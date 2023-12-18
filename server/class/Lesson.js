require('dotenv').config({
    path: process.cwd() + '/../'
});

const util = require('../util/helper.js');

const db = require('../model/db.js');
const moment = require('moment');
const mail = require('./../class/Mail.js');
const balance = require('./../class/Balance.js');
const user = require('./../class/User.js');

const socket = require('./../class/Socket.js');



exports.getAllLessonsUIDbyStatus = (uid, status) => {
    return db.Lesson.find({
        $and: [{
                $or: [
                    { sid: uid },
                    { tid: uid }
                ]
            },
            { status: status }
        ]
    });
}

exports.getAllLessonsUID = (uid) => {
    return db.Lesson.find({
        $or: [
            { sid: uid },
            { tid: uid }
        ]
    });
}

exports.getUpcomingLessons = (uid) => {
    return db.Lesson.find({
        $and: [{
                $or: [
                    { sid: uid },
                    { tid: uid }
                ]
            },
            { endtime: { $lt: Date.now() } }
        ]
    });
}

exports.getUpcomingLessonsForNotification = async (uid) => {
    m15 = moment().utc().add(15, 'minutes');

    return db.Lesson.find({
        $and: [{
                $or: [
                    { sid: uid },
                    { tid: uid }
                ]
            },
            { status: "confirmed" },
            { endtime: { $gt: Date.now() } },
            { starttime: { $lte: m15 } }
        ]
    });
}

exports.getLessonById = (lid) => {
    return db.Lesson.find({ _id: lid });
}

exports.bookLessonRaw = async (session) => {
    data = session;

    var teacherdata;
    var udata;

    try {
        var ds = await user.getUserById(data.uid);
        udata = JSON.parse(JSON.stringify(ds));
        udata.id = udata._id;
    } catch (error) {
        return {
            status: "error",
            error: "invalid_request",
            detail: "student_not_found"
        };
    }

    try {
        var dt = await user.getUserById(data.tid);
        teacherdata = JSON.parse(JSON.stringify(dt));
        teacherdata.id = teacherdata._id;
    } catch (error) {
        return {
            status: "error",
            error: "invalid_request",
            detail: "teacher_not_found"
        };
    }

    var price = parseFloat(data.price);

    var startdate = moment.utc(data.date + data.time, "YYYY-MM-DD HH:mm").subtract(data.tz, "minutes");
    var enddate = moment.utc(data.date + data.time, "YYYY-MM-DD HH:mm").subtract(data.tz, "minutes").add(parseInt(data.tf), "minutes");

    var weekday = util.numberToWeekday[startdate.day()];

    var startmin = startdate.hour() * 60 + startdate.minute();
    var endmin = startmin + parseInt(data.tf);



    // check teacher exists
    if (teacherdata.length <= 0) {
        res.json({
            status: "error",
            error: "invalid_request",
            detail: "teacher_not_found"
        });
        return;
    }

    if (data.tid == udata.id) {
        res.json({
            status: "error",
            error: "invalid_request",
            detail: "teacher_and_student_one_person"
        });
        return;
    }
    if (teacherdata.availability == 0) {
        res.json({
            status: "error",
            error: "invalid_request",
            detail: "teacher_not_available"
        });
        return;
    }
    if (!teacherdata.visible) {
        res.json({
            status: "error",
            error: "invalid_request",
            detail: "teacher_not_verified"
        });
        return;
    }

    if (data.subject in teacherdata.subjects === false) {
        res.json({
            status: "error",
            error: "invalid_request",
            detail: "subject_disagree"
        });
        return;
    }

    if (data.tf in teacherdata.subjects[data.subject].tf === false) {
        res.json({
            status: "error",
            error: "invalid_request",
            detail: "timeframe_disagree"
        });
        return;
    }


    var ctd_now = moment();
    var ctd_time = moment.utc(process.env.SPECIAL_OFFER_EXPIRES, "YYYY-MM-DD HH:mm:ss");

    if (ctd_now.isBefore(ctd_time) && udata.specialOfferLeft > 0 && ((teacherdata.isSpecialOffer && udata.specialOfferTutor == teacherdata._id) || (teacherdata.isSpecialOffer && udata.specialOfferTutor == ""))) {
        price = 0;
        await udata.addSpecialOfferUsage(udata.id, data.tid);
    } else if (teacherdata.subjects[data.subject].tf[data.tf] != price) {
        res.json({
            status: "error",
            error: "invalid_request",
            detail: "price_disagree"
        });
        return;
    }


    if (teacherdata.timetable[weekday] == undefined) {
        res.json({
            status: "error",
            error: "invalid_request",
            detail: "timetable_disagree"
        });
        return;
    }


    var timeresult = false;
    for (let [key, item] of Object.entries(teacherdata.timetable[weekday])) {
        var tmpstart = parseInt(item.start.split(":")[0] * 60) + parseInt(item.start.split(":")[1]);
        var tmpend = parseInt(item.end.split(":")[0] * 60) + parseInt(item.end.split(":")[1]);

        if (startmin >= tmpstart && endmin <= tmpend) {
            timeresult = true;
            break;
        }
    }

    if (timeresult == false) {
        res.json({
            status: "error",
            error: "invalid_request",
            detail: "timetable_disagree"
        });
        return;
    }



    if (udata.balance < price) {
        res.json({
            status: "error",
            error: "insufficient_balance"
        });
        return;
    }


    var result = await this.book(data.uid, data.tid, data.subject, data.tf, startdate, enddate, price, teacherdata, udata.firstname + " " + udata.lastname);

    if (!result) {
        return {
            status: "error",
            error: "server"
        };
    }

    return {
        status: "success"
    };
}


exports.book = async (sid, tid, subject, duration, starttime, endtime, price, teacherData, name, donation = 0) => {
    try {
        var ls = new db.Lesson({
            price: price,
            starttime: starttime,
            endtime: endtime,
            duration: duration,
            sid: sid,
            tid: tid,
            status: "requested",
            subject: subject,
            history: [{
                date: Date.now(),
                type: "requested"
            }],
            donation: donation
        });
        await ls.save();


        var not = new db.Notification({
            rxid: teacherData._id,
            type: "lesson_requested",
            link: "/lesson/" + ls._id,
            name: name
        });
        await not.save();

        socket.sendNotification(teacherData._id, not);

        await balance.blockBalance(sid, ls._id, tid, price);
        await mail.sendLessonRequestMail(teacherData.email, teacherData.locale);

        return true;

    } catch (error) {
        console.log(error);
        return false;
    }
}


exports.accept = async (lessonData, studentData, teacherData) => {
    await db.Lesson.updateOne({ _id: lessonData._id }, {
        "status": "confirmed",
        $addToSet: {
            history: {
                date: Date.now(),
                type: "confirmed"
            }
        }
    });

    var not = new db.Notification({
        rxid: studentData._id,
        type: "lesson_accepted",
        link: "/lesson/" + lessonData._id,
        name: teacherData.firstname + " " + teacherData.lastname
    });
    await not.save();

    socket.sendNotification(studentData._id, not);

    await mail.sendTeacherLessonAccept(studentData.email, studentData.locale);
}

exports.reject = async (lessonData, studentData, teacherData) => {
    await db.Lesson.updateOne({ _id: lessonData._id }, {
        "status": "rejected",
        $addToSet: {
            history: {
                date: Date.now(),
                type: "rejected"
            }
        }
    });

    var not = new db.Notification({
        rxid: studentData._id,
        type: "lesson_rejected",
        link: "/lesson/" + lessonData._id,
        name: teacherData.firstname + " " + teacherData.lastname
    });
    await not.save();

    socket.sendNotification(studentData._id, not);


    if (lessonData.price == 0) {
        await user.removeSpecialOfferUsage(studentData._id, studentData.specialOfferLeft);
    }

    await balance.unblockBalance(lessonData.sid, lessonData._id, lessonData.price);
    await mail.sendTeacherLessonRejected(studentData.email, studentData.locale);
}

exports.cancellRefund = async (lessonData, studentData, teacherData) => {
    await db.Lesson.updateOne({ _id: lessonData._id }, {
        "status": "cancelled_refund",
        $addToSet: {
            history: {
                date: Date.now(),
                type: "cancelled_refund"
            }
        }
    });

    var not = new db.Notification({
        rxid: studentData._id,
        type: "lesson_cancelled",
        link: "/lesson/" + lessonData._id,
        name: teacherData.firstname + " " + teacherData.lastname
    });
    await not.save();

    socket.sendNotification(studentData._id, not);

    if (lessonData.price == 0) {
        await user.removeSpecialOfferUsage(studentData._id, studentData.specialOfferLeft);
    }

    await balance.unblockBalance(lessonData.sid, lessonData._id, lessonData.price);
    await mail.sendTeacherLessonCanceled(studentData.email, studentData.locale);
}

exports.confirm = async (lessonData, teacherData, studentData) => {
    await db.Lesson.updateOne({ _id: lessonData._id }, {
        "status": "completed",
        $addToSet: {
            history: {
                date: Date.now(),
                type: "completed"
            }
        }
    });

    var payout = lessonData.price * process.env.PAYOUT_RATE;
    await balance.transferBalance(lessonData.tid, lessonData.sid, lessonData._id, lessonData.price);

    var not = new db.Notification({
        rxid: teacherData._id,
        type: "lesson_confirmed",
        link: "/lesson/" + lessonData._id,
        name: studentData.firstname + " " + studentData.lastname,
        price: lessonData.price
    });
    await not.save();

    socket.sendNotification(teacherData._id, not);

    if (lessonData.price == 0) {
        payout = 0;
    }
    await mail.sendTeacherLessonCompleted(teacherData.email, payout, teacherData.locale);
}

exports.disputeFromStudent = async (lessonData, text) => {
    await db.Lesson.updateOne({ _id: lessonData._id }, {
        "status": "appeal_student",
        $addToSet: {
            history: {
                date: Date.now(),
                type: "appeal_student"
            }
        }
    });

    await mail.sendAdminDisputeNotification(lessonData._id, text, lessonData);
}

exports.rate = async (lessonData, rating, rating_text) => {
    var review = new db.Review({
        sid: lessonData.sid,
        tid: lessonData.tid,
        lid: lessonData._id,
        rating: parseFloat(rating),
        text: util.cleanString(rating_text),
        subject: lessonData.subject,
        duration: lessonData.duration
    });
    await review.save();


    // update rating in User Document
    const ratingData = await db.Review.aggregate([
        { $match: { tid: lessonData.tid } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]).exec();

    var agg = ratingData[0];

    if (agg == undefined) {
        return;
    }

    await db.User.updateOne({ _id: lessonData.tid }, {
        "rating": agg.avgRating
    });
}
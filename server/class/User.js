require('dotenv').config({
    path: process.cwd() + '/../'
});

const util = require('../util/helper.js');
const crypto = require('crypto');

const moment = require('moment');
const db = require('../model/db.js');
const bcrypt = require('bcrypt');
const mail = require('./../class/Mail.js');


exports.create = async (email, password, firstName, lastName, locale, currency, socialstudent = false, socialteacher = false, profteacher = false) => {
    try {
        hashed = await bcrypt.hash(password, 10);
        emailVerifyCode = this.getVerificationCode();

        var user = new db.User({
            firstname: firstName,
            lastname: lastName,
            email: email.toLowerCase(),
            password: hashed,
            locale: locale,
            currency: currency,
            emailCode: emailVerifyCode,
            socialStudent: socialstudent,
            socialTeacher: socialteacher,
            professionalTeacher: profteacher
        });

        await user.save();
        await mail.createEmailContact(email.toLowerCase(), firstName, lastName, locale, currency);
        await mail.sendVerifyEmail(email.toLowerCase(), firstName, user._id, emailVerifyCode, locale);
        return hashed;
    } catch (error) {
        throw error;
    }
}

exports.update = async (id, firstname, lastname, availability, description, languages, country, subjects, timetable, visible, activeSince = "", utc_offset = 0, flags = {}, video, video_source, video_id) => {
    timetable = this.changeTimetableTimezone(timetable, utc_offset * (-1), true);

    var data = {
        firstname: firstname,
        lastname: lastname,
        availability: availability,
        description: util.cleanString(description),
        languages: languages,
        country: country,
        subjects: subjects,
        timetable: timetable,
        visible: visible,
        video: video,
        video_id: video_id,
        video_source: video_source
    };

    for (const key in flags) {
        data[key] = flags[key];
    }

    if (activeSince != "") {
        data.activeSince = Date.now();
    }

    return db.User.updateOne({ _id: id }, data);
};

exports.updateLocale = async (id, email, locale) => {
    await mail.updateLocale(email, locale);

    return db.User.updateOne({ _id: id }, {
        locale: locale
    });
}

exports.updateCurrency = async (id, email, currency) => {
    await mail.updateCurrency(email, currency);

    return db.User.updateOne({ _id: id }, {
        currency: currency
    });
}

exports.getUserById = async (uid) => {
    return db.User.findById(uid).exec();
}

exports.getUserByEmail = async (email) => {
    return db.User.find({
        email: email
    }).exec();
}

exports.getBasicInfo = async (uid) => {
    return db.User.findById(uid, 'id email firstname lastname visible availability specialOfferLeft isSpecialOffer specialOfferTutor socialStudent socialTeacher professionalTeacher').exec();
}

exports.getTransactions = async (uid) => {
    return db.Transaction.find({
        $or: [{
                $and: [
                    { rxid: uid },
                    {
                        $and: [
                            { status: { $ne: "blocked" } },
                            { status: { $ne: "unblocked" } }
                        ]
                    }
                ]
            },
            { txid: uid }
        ]
    });
}

exports.getTransactionById = async (tid) => {
    return db.Transaction.findById(tid).exec();
}

exports.getTeacherProfile = async (uid) => {
    var teacher = await db.User.findById(uid, 'firstname lastname country verified visible description availability rating languages subjects timetable activeSince isSpecialOffer video video_id video_source socialTeacher professionalTeacher').exec();
    teacher = teacher.toJSON();

    teacher.ratingsAgg = {};
    teacher.ratingsAgg.five = await db.Review.countDocuments({ tid: uid, rating: 5 });
    teacher.ratingsAgg.four = await db.Review.countDocuments({ tid: uid, rating: 4 });
    teacher.ratingsAgg.three = await db.Review.countDocuments({ tid: uid, rating: 3 });
    teacher.ratingsAgg.two = await db.Review.countDocuments({ tid: uid, rating: 2 });
    teacher.ratingsAgg.one = await db.Review.countDocuments({ tid: uid, rating: 1 });
    teacher.ratingsAgg.total = teacher.ratingsAgg.five + teacher.ratingsAgg.four + teacher.ratingsAgg.three + teacher.ratingsAgg.two + teacher.ratingsAgg.one;

    return teacher;
}

exports.getTeachers = async (filter, user) => {
    try {
        var mFilter = {
            visible: true,
            availability: 2,
            email: { $ne: "elizaveta@brainstr.ru" }
        };

        var sort = {};
        
        if(user == undefined){
            sort = {
                rating: -1,
                video: -1,
                socialTeacher: -1,
                verified: -1,
                activeSince: -1
            };
        }else if(user.socialStudent){
            sort = {
                video: -1,
                socialTeacher: -1,
                verified: -1,
                rating: -1,
                activeSince: -1
            };
        }else{
            sort = {
                video: -1,
                rating: -1,
                socialTeacher: -1,
                verified: -1,
                activeSince: -1
            };
        }


        // TODO: add name filter


        if (filter.subject != "") {
            var lvl = filter.subject_level == "" ? 0 : filter.subject_level;
            mFilter['subjects.' + filter.subject + '.level'] = { $gte: lvl }
        }


        if (filter.language != "") {
            var lvl = filter.language_level == "" ? 0 : filter.language_level;
            mFilter['languages.' + filter.language] = { $gte: lvl }
        }

        if (filter.location != "") {
            mFilter.country = filter.location;
        }


        var teachers = await db.User.find(mFilter, 'firstname lastname country verified visible description availability rating languages subjects timetable activeSince isSpecialOffer video video_id video_source socialTeacher professionalTeacher').sort(sort);

        return teachers;

    } catch (error) {
        console.log(error);
        return {};
    }
}

exports.getBookedTimeSlots = async (uid) => {
    var bookedTimes = {};
    try {
        bookedTimes = await db.Lesson.find({ tid: uid, status: "confirmed" }, 'starttime endtime');
    } catch (error) {
        console.log(error);
    }
    return bookedTimes;
}

exports.getReviewsLimited = async (uid) => {
    return db.Review.find({
        tid: uid
    }).sort({ 'createdAt': -1 }).limit(5).exec();
}

exports.getVerificationCode = () => {
    return crypto.randomBytes(20).toString('hex');
}

exports.sendResetPassword = async (email) => {
    var code = this.getVerificationCode();
    var expiry = moment.utc().add("12", "hours");

    var user = await this.getUserByEmail(email);
    if (user.length == 1) {
        user = user[0];
        try {
            await db.User.updateOne({ _id: user._id }, { resetCode: code, resetExpiry: expiry });
            await mail.sendPasswordReset(email, user.firstname, user._id, code, user.locale);
        } catch (error) {
            console.log(error);
        }
    }
    return true;
}

exports.getTeachersPreview = async () => {
    return db.User.aggregate([
        { $match: { visible: true } },
        { $sample: { size: 5 } }
    ]).exec();
}

exports.getUnreadNotifications = async (id) => {
    return db.Notification.find({ rxid: id, read: false }).sort({ 'createdAt': -1 }).exec();
}

exports.resetNotifications = async (id) => {
    return db.Notification.updateMany({ rxid: id }, { read: true }).exec();
}

exports.readNotification = async (uid, nid) => {
    return db.Notification.updateOne({ rxid: uid, _id: nid }, { read: true }).exec();
}

exports.resetPassword = async (email, code, uid, password) => {
    var userData = await this.getUserById(uid);

    if (moment.utc().isAfter(userData.resetExpiry)) {
        return false;
    }

    if (code != userData.resetCode || userData.resetCode == "") {
        return false;
    }

    if (userData.email != email) {
        return false;
    }

    var pw = await bcrypt.hash(password, 10);
    await db.User.updateOne({ _id: userData._id }, {
        password: pw,
        resetCode: ""
    });
    return true;
}

exports.verifyEmail = async (uid, code) => {
    var userData;

    try {
        userData = await this.getUserById(uid);
    } catch (error) {
        return false;
    }

    if (userData == null || userData == undefined) {
        return false;
    }

    if (userData.emailCode != code || userData.emailCode == "") {
        return false;
    }

    try {
        await db.User.updateOne({ _id: userData._id }, {
            emailVerified: true,
            emailCode: ""
        });
        return true;
    } catch (error) {
        return false;
    }
}

exports.updatePassword = async (uid, password) => {
    var pw = await bcrypt.hash(password, 10);
    await db.User.updateOne({ _id: uid }, { password: pw })
}

exports.updateGeneral = async (uid, firstname, lastname, language, currency, socialStudent) => {
    await db.User.updateOne({ _id: uid }, {
        firstname: firstname,
        lastname: lastname,
        locale: language,
        currency: currency,
        socialStudent: socialStudent
    })
}

exports.addSpecialOfferUsage = async (uid, tid) => {
    await db.User.updateOne({ _id: uid },
        [{
            "$set": {
                "specialOfferTutor": tid,
                "specialOfferLeft": { "$subtract": ["$specialOfferLeft", 1] }
            }
        }]);
}

exports.removeSpecialOfferUsage = async (uid, specialOfferLeft) => {
    if (specialOfferLeft == 1) {
        await db.User.updateOne({ _id: uid },
            [{
                "$set": {
                    "specialOfferTutor": "",
                    "specialOfferLeft": { "$add": ["$specialOfferLeft", 1] }
                }
            }]);
    } else {
        await db.User.updateOne({ _id: uid },
            [{
                "$set": {
                    "specialOfferLeft": { "$add": ["$specialOfferLeft", 1] }
                }
            }]);
    }
}

exports.changeTimetableTimezone = (timetable, utc_offset = 0, normalize = false) => {
    var tfdata = timetable;
    timetable = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };


    for (var i in tfdata) {
        for (var x in tfdata[i]) {

            if (tfdata[i][x] == undefined) {
                console.log("undefined, continue", tfdata[i], tfdata[i][x]);
                continue;
            }
            if (tfdata[i][x].adjusted != undefined) {
                continue;
            }


            tfdata[i][x].start = util.fillupHour(tfdata[i][x].start);
            tfdata[i][x].end = util.fillupHour(tfdata[i][x].end);


            var startmin = parseInt(tfdata[i][x].start.split(":")[0]) * 60 + parseInt(tfdata[i][x].start.split(":")[1]);
            startmin += utc_offset;
            if (startmin == 0) { startmin = -1; }

            var endmin = parseInt(tfdata[i][x].end.split(":")[0]) * 60 + parseInt(tfdata[i][x].end.split(":")[1]);
            endmin += utc_offset;
            if (endmin == 0) { endmin = -1; }

            var day_before = util.weekdayToNumber[i] - 1;
            if (day_before < 0) { day_before = 6; }
            day_before = util.numberToWeekday[day_before];

            var day_after = util.weekdayToNumber[i] + 1;
            if (day_after > 6) { day_after = 0; }
            day_after = util.numberToWeekday[day_after];


            // slot completely shifted to day before
            if (startmin < 0 && endmin < 0) {
                var newstart = moment("00:00", "HH:mm").add(1440 + startmin, "minutes");
                var newend = moment("00:00", "HH:mm").add(1440 + endmin, "minutes");

                if (tfdata[day_before] == undefined) {
                    tfdata[day_before] = [];
                }
                timetable[day_before].push({ start: newstart.format("HH:mm"), end: newend.format("HH:mm") == "00:00" ? "23:59" : newend.format("HH:mm") });
                continue;
            }

            // slot completely shifted to day after
            if (startmin > 1439 && endmin > 1439) {
                var newstart = moment("00:00", "HH:mm").add(startmin - 1440, "minutes");
                var newend = moment("00:00", "HH:mm").add(endmin - 1440, "minutes");

                if (tfdata[day_after] == undefined) {
                    tfdata[day_after] = [];
                }
                timetable[day_after].push({ start: newstart.format("HH:mm"), end: newend.format("HH:mm") == "00:00" ? "23:59" : newend.format("HH:mm"), adjusted: true });
                continue;
            }


            // overlapping on before day
            if (startmin < -1) {
                var newstart = moment("00:00", "HH:mm").add(startmin - 1440, "minutes");

                if (endmin == -1) { endmin = 0; }
                var newend = moment("00:00", "HH:mm").add(endmin, "minutes");

                if (tfdata[day_before] == undefined) {
                    tfdata[day_before] = [];
                }
                timetable[day_before].push({ start: newstart.format("HH:mm"), end: "23:59" });
                timetable[i].push({ start: "00:00", end: newend.format("HH:mm") == "00:00" ? "23:59" : newend.format("HH:mm") });
                continue;
            }


            // overlapping on after day
            if (endmin > 1440) {
                var newend = moment("00:00", "HH:mm").add(endmin - 1440, "minutes");

                if (startmin == -1) { startmin = 0; }
                var newstart = moment("00:00", "HH:mm").add(startmin, "minutes");

                if (tfdata[day_after] == undefined) {
                    tfdata[day_after] = [];
                }
                timetable[day_after].push({ start: "00:00", end: newend.format("HH:mm"), adjusted: true });
                timetable[i].push({ start: newstart.format("HH:mm"), end: "23:59" });
                continue;
            }



            if (startmin == -1) { startmin = 0; }
            if (endmin == -1) { endmin = 0; }

            var moment_start = moment("00:00", "HH:mm").add(startmin, "minutes");
            var moment_end = moment("00:00", "HH:mm").add(endmin, "minutes");

            timetable[i].push({
                start: moment_start.format("HH:mm"),
                end: moment_end.format("HH:mm") == "00:00" ? "23:59" : moment_end.format("HH:mm")
            });
        }
    }

    for (var i in timetable) {
        if (timetable[i].length == 0) {
            delete timetable[i];
            continue;
        }

        for (var x in timetable[i]) {
            if (timetable[i][x].adjusted != undefined) {
                delete timetable[i][x].adjusted;
            }

            timetable[i][x].start = util.fillupHour(timetable[i][x].start);
            timetable[i][x].end = util.fillupHour(timetable[i][x].end);
        }
    }

    return timetable;
}

exports.createOlympiadStudent = async (phone, firstname, lastname, email, interestedInTutoring) => {
    try {
        var user = new db.OlympiadStudents({
            phone: phone,
            firstname: firstname,
            lastname: lastname,
            email: email.toLowerCase(),
            interestedInTutoring: interestedInTutoring
        });

        await user.save();

        await mail.createEmailContactOlympiad(email.toLowerCase(), firstname, lastname);
        //await mail.sendWelcomeOlympiadStudent(email.toLowerCase(), firstname);
        await mail.createSupportTicket({ action: "NEW OLYMPIAD STUDENT REGISTRATION", phone: phone, firstname: firstname, lastname: lastname, email: email, interestedInTutoring: interestedInTutoring });

        return true;
    } catch (error) {
        return false;
    }
}
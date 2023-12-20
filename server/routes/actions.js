require('dotenv').config();
const express = require('express');
const router = express.Router();

const sharp = require('sharp');
const fs = require('fs');
const https = require('https');
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');

const mail = require('./../class/Mail.js');
const user = require('./../class/User.js');
const balance = require('./../class/Balance.js');
const lesson = require('./../class/Lesson.js');
const message = require('./../class/Message.js');

const blog = require('./../class/Blog.js');

const moment = require('moment');
const helper = require('./../util/helper');

const AccessToken = require('twilio').jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

const passport = require('passport');
const { isAuthNav, isAuth, loggedInRedirect } = require('./../util/auth');

const emailVal = require("email-validator");
const db = require('../model/db.js');
const { User } = require('../model/db.js');
const { data } = require('../data/meta.js');



var download = function (url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var request = https.get(url, function (response) {
        response.pipe(file);
        file.on('finish', function () {
            file.close(cb);  // close() is async, call cb after close completes.
        });
    }).on('error', function (err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (cb) cb(err.message);
    });
};

function getRandomItem(arr) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    const item = arr[randomIndex];
    return item;
}

const createFakeTeacher = async () => {
    const udr = await fetch('https://randomuser.me/api/');
    var ud = await udr.json();
    ud = ud.results[0];

    var countries = ['UK', 'US', ud.nat];
    var country = getRandomItem(countries);


    var t = new db.User({
        country: country,
        locale: "en",
        verified: true,
        visible: true,
        line2: "generated",
        description: "",
        availability: 2,
        currency: "usd",
        firstname: ud.name.first,
        lastname: ud.name.last,
        email: ud.email,
        password: ud.login.sha1,
        activeSince: ud.registered.date,
        languages: { 'en': 11 },
        subjects: {
            'English': {
                level: 3,
                tf: {
                    30: 0,
                    45: 15,
                    60: 0,
                    90: 0,
                    120: 0
                }
            }
        },
        timetable: {
            monday: [{
                start: "08:00",
                end: "20:00"
            }],
            tuesday: [{
                start: "08:00",
                end: "20:00"
            }],
            wednesday: [{
                start: "08:00",
                end: "20:00"
            }],
            thursday: [{
                start: "08:00",
                end: "20:00"
            }],
            friday: [{
                start: "08:00",
                end: "20:00"
            }],
            saturday: [{
                start: "08:00",
                end: "20:00"
            }],
        }
    });
    await t.save();

    download(ud.picture.large, "./data/profilepictures/generated/" + t._id + ".jpg", () => {
        sharp("./data/profilepictures/generated/" + t._id + ".jpg")
            .rotate()
            .resize(500, 500)
            .toFile(process.cwd() + '/data/profilepictures/' + t._id + '.webp', (err, info) => {
                console.log(err);
            });
    });

}



router.post('/login', async function (req, res, next) {
    var gresult = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${req.body["g-recaptcha"]}&remoteip=${req.ip}`);
    gresult = await gresult.json();

    var redirect = req.body.redirect != "" ? "&redirect=" + req.body.redirect : "";
    var redirect_new = req.body.redirect != "" ? req.body.redirect : "/teachers/";

    passport.authenticate('local', function (err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/login?e=true' + redirect); }

        req.logIn(user, function (err) {
            if (err) { return next(err); }
            return res.redirect(redirect_new);
        });
    })(req, res, next);
});

router.post('/login-floating', async function (req, res, next) {
    var gresult = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${req.body["g-recaptcha"]}&remoteip=${req.ip}`);
    gresult = await gresult.json();

    passport.authenticate('local', function (err, user, info) {
        if (err) { res.json({ status: "error" }); return; }
        if (!user) { res.json({ status: "error" }); return; }

        req.logIn(user, function (err) {
            if (err) { res.json({ status: "error" }); return; }
            res.json({ status: "success" });
        });
    })(req, res, next);
});

router.post('/logout', function (req, res) {
    req.logout();
    req.session.destroy(function (err) {
        res.redirect(req.get('referer'));
    });
});

router.post('/register', async (req, res, next) => {
    var gresult = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${req.body.token}&remoteip=${req.ip}`);
    gresult = await gresult.json();

    // check inputs
    if (!emailVal.validate(req.body.email)) {
        res.json({ status: "error", error: "invalid-email" });
        return;
    }
    if (req.body.firstName == "" || req.body.lastName == "") {
        res.json({ status: "error", error: "invalid-name" });
        return;
    }
    if (req.body.password.length < 4) {
        res.json({ status: "error", error: "invalid-password" });
        return;
    }


    var tmpuser = await user.getUserByEmail(req.body.email);
    if (tmpuser.length > 0) {
        res.json({ status: "error", error: "email-in-use" });
        return;
    }

    var socialstudent = req.body.socialstudent == undefined ? false : req.body.socialstudent;
    var socialteacher = req.body.socialteacher == undefined ? false : req.body.socialteacher;
    var profteacher = req.body.profteacher == undefined ? false : req.body.profteacher;

    await user.create(req.body.email, req.body.password, req.body.firstName, req.body.lastName, req.getLocale(), req.body.currency, socialstudent, socialteacher, profteacher);

    var newuser = await user.getUserByEmail(req.body.email);
    req.logIn(newuser[0], (err) => {
        if (err) {
            console.log(err);
            res.json({ status: "error", error: "" });
            return;
        }
        res.json({ status: "ok" });
    });
});




router.post("/joinLesson", isAuth, async (req, res) => {
    var lessonData;

    try {
        lessonData = await lesson.getLessonById(req.body.lid);
        lessonData = lessonData[0];
    } catch (error) {
        console.log(error);
        res.json({ status: "unauthorized" });
        return;
    }


    // check authorisation for this lesson
    if (req.user.id != lessonData.tid && req.user.id != lessonData.sid) {
        res.json({
            status: "unauthorized"
        });
        return;
    }


    // check wheater it's 5 min for or up to 5 mins after to be allowed to join the video call
    var now = moment().unix();
    if (now > (moment.utc(lessonData.starttime).unix() - 300) && now < (moment.utc(lessonData.endtime).unix() + 300)) {

        // generate twilio access token
        var token = new AccessToken(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET);
        token.identity = req.user.id;

        const videoGrant = new VideoGrant({
            room: req.body.lid
        });
        token.addGrant(videoGrant);

        res.json({
            status: "active_lesson",
            lesson: lessonData,
            token: token.toJwt()
        });
        return;

    } else {
        // send upcoming lesson data to client, video access denied
        res.json({
            status: "no_active_lesson",
            lesson: lessonData
        });
        return;
    }
});

router.post("/saveTeacherSettings", isAuth, async (req, res) => {
    var data = JSON.parse(req.body.str);
    var status = "success";

    var newTeacher = false;

    if (data.availibility != 0 && data.availibility != 1 && data.availibility != 2) {
        data.availibility = 0;
    }

    data.name = data.name == undefined ? "DE" : data.name;
    data.lastname = data.lastname == undefined ? "" : data.lastname;

    data.socialTeacher = false;

    data.description = data.description == undefined ? "" : helper.cleanString(data.description);
    data.country = data.country == undefined ? "DE" : data.country;
    data.timetable = data.timetable == undefined ? {} : data.timetable;
    data.languages = data.languages == undefined ? {} : data.languages;
    data.subjects = data.subjects == undefined ? {} : data.subjects;


    if (data.country.length > 2) {
        data.country = "DE";
    }


    var visible = true;
    if (data.name.length < 2) {
        visible = false;
    }
    if (data.lastname.length < 2) {
        visible = false;
    }
    if (data.description.length < 10) {
        visible = false;
    }
    if (data.timetable == {}) {
        visible = false;
    }
    if (data.subject == {}) {
        visible = false;
    }
    if (data.languages == {}) {
        visible = false;
    }

    var imagePath = process.cwd() + '/data/profilepictures/' + req.user.id + '.webp';
    if (!fs.existsSync(imagePath)) {
        visible = false;
    }


    data.activeSince = "";
    if (data.visible == false && visible == true) {
        data.activeSince = Date.now();
        newTeacher = true;

        try {
            if (req.user.locale == "ru") {
                await mail.sendWelcomeTutor(req.user.email, data.firstname, req.user.locale);
            }
        } catch (error) {
            console.log(error);
        }
    }

    try {
        //await mail.updateEmailContact(req.user.email, data.firstname, data.lastname, req.user.locale, req.user.currency);
        await user.update(req.user.id, data.firstname, data.lastname, data.availability, data.description, data.languages, data.country, data.subjects, data.timetable, visible, data.activeSince, req.body.tz, { socialTeacher: data.socialTeacher }, data.video, data.video_source, data.video_id);
    } catch (error) {
        console.log(error);
        res.json({
            status: "error"
        });
        return;
    }

    res.json({
        status: status,
        newTeacher: newTeacher
    });
});

router.post("/bookingRequest", isAuth, async (req, res) => {
    var data = JSON.parse(req.body.request);
    var teacherdata;

    try {
        var dt = await user.getUserById(data.tid);
        teacherdata = JSON.parse(JSON.stringify(dt));
    } catch (error) {
        res.json({
            status: "error",
            error: "invalid_request",
            detail: "teacher_not_found"
        });
        return;
    }

    var price = parseFloat(data.price);

    var startdate = moment.utc(data.date + data.time, "YYYY-MM-DD HH:mm").subtract(data.tz, "minutes");
    var enddate = moment.utc(data.date + data.time, "YYYY-MM-DD HH:mm").subtract(data.tz, "minutes").add(parseInt(data.tf), "minutes");

    var weekday = helper.numberToWeekday[startdate.day()];

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

    if (data.tid == req.user.id) {
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

    if (ctd_now.isBefore(ctd_time) && req.user.specialOfferLeft > 0 && ((teacherdata.isSpecialOffer && req.user.specialOfferTutor == teacherdata._id) || (teacherdata.isSpecialOffer && req.user.specialOfferTutor == ""))) {
        price = 0;
        await user.addSpecialOfferUsage(req.user.id, data.tid);
    } else if (teacherdata.subjects[data.subject].tf[data.tf] != price) {
        res.json({
            status: "error",
            error: "invalid_request",
            detail: "price_disagree"
        });
        return;
    }

    if (data.donation < 0 && req.user.socialStudent == false) {
        res.json({
            status: "error",
            error: "invalid_request",
            detail: "student_not_social_program"
        });
        return;
    } else {
        price = price + data.donation;
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


    if (req.user.balance < price) {
        res.json({
            status: "error",
            error: "insufficient_balance"
        });
        return;
    }


    var result = await lesson.book(req.user.id, data.tid, data.subject, data.tf, startdate, enddate, price, teacherdata, req.user.firstname + " " + req.user.lastname, data.donation);


    if (!result) {
        res.json({
            status: "error",
            error: "server"
        });
        return;
    }

    res.json({
        status: "success"
    });
});

router.post("/updateLesson", isAuth, async (req, res) => {
    var type = "";

    var teacherData;
    var studentData;

    var now = moment().unix();


    // get lesson in doubt
    var lessonData = await lesson.getLessonById(req.body.lid);
    var lessonData = lessonData[0];

    var otherId = lessonData.sid == req.user.id ? lessonData.tid : lessonData.sid;
    var otherUserData = await user.getBasicInfo(otherId);


    //check who is sending a request
    if (req.user.id == lessonData.sid) {
        type = "student";
        studentData = req.user;
        teacherData = otherUserData;
    } else if (req.user.id == lessonData.tid) {
        type = "teacher";
        teacherData = req.user;
        studentData = otherUserData;
    } else {
        res.json({
            status: "error",
            error: "unauthorized"
        });
        return;
    }


    // teacher accepted request
    if (req.body.action == "teacher-accept-request" && type == "teacher" && lessonData.status == "requested") {
        await lesson.accept(lessonData, studentData, teacherData);

        res.json({
            status: "success"
        });
        return;
    }


    // teacher rejected request
    if (req.body.action == "teacher-deny-request" && type == "teacher" && lessonData.status == "requested") {
        await lesson.reject(lessonData, studentData, teacherData);

        res.json({
            status: "success"
        });
        return;
    }


    // teacher cancelled confirmed lesson
    if ((req.body.action == "teacher-cancell-confirmed" || req.body.action == "teacher-refund-student") && type == "teacher" && lessonData.status == "confirmed") {
        await lesson.cancellRefund(lessonData, studentData, teacherData);

        res.json({
            status: "success"
        });
        return;
    }


    // student confirms completed lesson
    if (req.body.action == "student-confirm" && type == "student" && lessonData.status == "confirmed") {
        if (now < (lessonData.endtime._seconds - 300)) {
            res.json({
                status: "error",
                error: "illegal_request"
            });
            return;
        }

        await lesson.confirm(lessonData, teacherData, studentData);
        await lesson.rate(lessonData, req.body.rating, req.body.rating_text);
    }


    // student started dispute
    if (req.body.action == "dispute-student" && type == "student" && lessonData.status == "confirmed") {
        await lesson.disputeFromStudent(lessonData, req.body.text);

        res.json({
            status: "success"
        });
        return;
    }


    res.json({
        status: "error"
    });
});

router.post('/lessons', isAuth, async (req, res) => {
    var data = await lesson.getAllLessonsUID(req.user.id);
    res.json(data);
});

router.get("/profilepicture/:id", (req, res) => {
    res.set('Cache-control', 'public, max-age=120');

    var imagePath = process.cwd() + '/data/profilepictures/' + req.params.id + '.webp';

    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.sendFile(process.cwd() + '/data/profilepictures/placeholder.webp');
    }
});

router.get("/teachervideo/:id", (req, res) => {
    res.set('Cache-control', 'public, max-age=7200');

    var imagePath = process.cwd() + '/data/teachervideos/' + req.params.id + '.mp4';

    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
        return;
    }

    res.end();
});

router.post("/saveProfilePicture", isAuth, (req, res) => {
    var img = req.files.img;

    sharp(img.data)
        .rotate()
        .resize(500, 500)
        .toFile(process.cwd() + '/data/profilepictures/' + req.user.id + '.webp', (err, info) => {
            res.json({
                status: "success"
            });
        });
});

router.post('/upcomingLesson', isAuth, async (req, res) => {
    var ls = await lesson.getUpcomingLessonsForNotification(req.user.id);
    if (ls.length > 0) {
        res.json({
            status: "yes",
            lessonid: ls[0]._id,
            starttime: ls[0].starttime,
            endtime: ls[0].endtime
        });
    } else {
        res.json({
            status: "no"
        });
    }
});

router.post('/getUser', isAuth, async (req, res) => {
    var data = await user.getBasicInfo(req.body.id);
    res.json(data);
});

router.post('/getTeachers', async (req, res) => {
    try {
        var teachers = await user.getTeachers({
            name: req.body.name,
            subject: req.body.subject,
            subject_level: req.body.subject_level,
            language: req.body.language,
            language_level: req.body.language_level,
            rating: req.body.rating,
            location: req.body.location
        }, req.user);

        res.json({
            status: "ok",
            data: teachers
        });
    } catch (error) {
        console.error(error);
        res.json({
            status: "error"
        });
    }
});

router.post('/getTeacher', isAuth, async (req, res) => {
    try {
        var teacher = await user.getTeacherProfile(req.body.id);
        res.json(teacher);
    } catch (error) {
        console.error(error);
        res.json({
            status: "error"
        });
    }
});

router.post('/payoutRequest', isAuth, async (req, res) => {
    await mail.createSupportTicket({
        title: "NEW PAYOUT REQUEST",
        method: req.body.method,
        IBAN: req.body.iban,
        BIC: req.body.bic,
        PAYPAL: req.body.paypal,
        EURO: req.body.points
    });

    res.json({ status: "ok" });
});

router.post('/getLesson', isAuth, async (req, res) => {
    var data = await lesson.getLessonById(req.body.lid)
    res.json(data[0]);
});

router.post('/updateLocale', isAuth, async (req, res) => {
    await user.updateLocale(req.user.id, req.user.email, req.body.locale);
    res.json({ status: "ok" });
});

router.post('/updateCurrency', isAuth, async (req, res) => {
    await user.updateCurrency(req.user.id, req.user.email, req.body.currency);
    res.json({ status: "ok" });
});

router.post('/teachersPreview', async (req, res) => {
    var teachers = await user.getTeachersPreview();
    res.json({ status: "ok", data: teachers });
});

router.post('/resetNotifications', async (req, res) => {
    await user.resetNotifications(req.user.id);
    res.json({ status: "ok" });
});

router.post('/readNotification', async (req, res) => {
    await user.readNotification(req.user.id, req.body.id);
    res.json({ status: "ok" });
});

router.post('/resetPasswordRequest', async (req, res) => {
    await user.sendResetPassword(req.body.email);
    res.json({ status: "ok" });
});

router.post('/resetPassword', async (req, res) => {
    if (req.body.code == undefined || req.body.code == "") {
        res.json({ status: "error", error: "invalid" });
    }
    if (req.body.email == undefined || req.body.email == "") {
        res.json({ status: "error", error: "invalid" });
    }
    if (req.body.uid == undefined || req.body.uid == "") {
        res.json({ status: "error", error: "invalid" });
    }
    if (req.body.password.length < 5) {
        res.json({ status: "error", error: "weak-password" });
    }

    try {
        var data = await user.resetPassword(req.body.email, req.body.code, req.body.uid, req.body.password);
        if (data == true) {
            res.json({ status: "ok" });
        } else {
            res.json({ status: "error", error: "invalid-params" });
        }
    } catch (error) {
        res.json({ status: "error", error: "unknown" });
    }
});

router.post('/rateBlogHelpfull', async (req, res) => {
    id = req.body.id;
    rating = parseInt(req.body.rating);

    if (isNaN(rating)) {
        res.json({ status: "ok" });
        return;
    }

    await blog.rate(id, rating);
    res.json({ status: "ok" });
});

router.post('/user/action/setpassword', async (req, res) => {
    const match = await bcrypt.compare(req.body.pw, req.user.password);

    if (!match) {
        res.json({ status: "wrong-pw" });
        return;
    }

    if (req.body.new_pw.length < 4) {
        res.json({ status: "unsafe" });
        return;
    }

    await user.updatePassword(req.user.id, req.body.new_pw);
    res.json({ status: "ok" });
});

router.post('/user/action/updategeneral', async (req, res) => {
    if (req.body.firstname.length < 2) {
        res.json({ status: "firstname-invalid" });
        return;
    }
    if (req.body.lastname.length < 2) {
        res.json({ status: "lastname-invalid" });
        return;
    }

    await user.updateGeneral(req.user.id, req.body.firstname, req.body.lastname, req.body.language, req.body.currency);
    res.json({ status: "ok" });
});

router.post('/user/createOlympiadStudent', async (req, res) => {
    // validation...
    if (req.body.phone.length < 6) {
        res.json({ status: "invalid" });
        return;
    }
    if (req.body.firstname.length < 2) {
        res.json({ status: "invalid" });
        return;
    }
    if (req.body.lastname.length < 2) {
        res.json({ status: "invalid" });
        return;
    }
    if (req.body.email.length < 6) {
        res.json({ status: "invalid" });
        return;
    }

    await user.createOlympiadStudent(req.body.phone, req.body.firstname, req.body.lastname, req.body.email, req.body.interestedInTutoring);
    res.json({ status: "ok" });
});

router.post('/messages/getConversation', async (req, res) => {
    var msgs = await message.getConversation(req.body.id, req.user.id);
    res.json({ status: "ok", data: msgs });
});

router.post('/messages/create', async (req, res) => {
    await message.create(req.body.rx, req.user.id, req.body.text);
    res.json({ status: "ok" });
});









router.post('/action/admin/createUser', async (req, res) => {
    await createFakeTeacher();
    await createFakeTeacher();
    await createFakeTeacher();
    await createFakeTeacher();
    await createFakeTeacher();
    res.json({ status: "ok" });
});













module.exports = router;
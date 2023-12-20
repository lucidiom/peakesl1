require('dotenv').config();
const util = require('./../util/helper.js');

const express = require('express');
const router = express.Router();
const { isAuthNav, isAuth, loggedInRedirect, isAdminAuthNav } = require('./../util/auth');

const meta = require('./../data/meta.js');

const mail = require('./../class/Mail.js');
const user = require('./../class/User.js');
const balance = require('./../class/Balance.js');
const lesson = require('./../class/Lesson.js');
const blog = require('./../class/Blog.js');
const message = require('./../class/Message.js');

const admin = require('./../class/Admin.js');



router.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');

    if (req.get('host') == "peakesl.ru") {
        res.sendFile(process.cwd() + "/sitemap_ru.xml");
    } else {
        res.sendFile(process.cwd() + "/sitemap_de.xml");
    }
});

router.get('/robots.txt', (req, res) => {
    if (req.get('host') == "peakesl.ru") {
        res.sendFile(process.cwd() + "/robots_ru.txt");
    } else {
        res.sendFile(process.cwd() + "/robots_de.txt");
    }
});


router.get('/', async (req, res) => {
    var posts = await blog.getAllPosts(req.getLocale());

    res.render("external/index", await getCommonNavigationData({
        title: res.__('title.index'),
        meta: meta.data[req.getLocale()].index,
        blogposts: posts
    }, req));
});

router.get('/blog', async (req, res) => {
    res.redirect('./' + req.getLocale() + '/');
});

router.get('/blog/:lang', async (req, res) => {
    var posts = await blog.getAllPosts(req.params.lang);
    var featuredPosts = await blog.getFeaturedPosts(req.params.lang);

    req.setLocale(req.params.lang);

    res.render("external/blog", await getCommonNavigationData({
        title: res.__('title.blog'),
        meta: meta.data[req.getLocale()].blog,
        layout: "layouts/blog",
        posts: posts,
        featuredPosts: featuredPosts
    }, req));
});

router.get('/blog/:lang/:post', async (req, res) => {
    var postUrl = req.params.post;
    var post = await blog.getBlogPostByUrl(postUrl);
    if (post == null) {
        res.redirect("../");
        return;
    }

    var relatedPosts = await blog.getRelatedPosts(postUrl, req.params.lang);
    var blogText = post.content.replace(/<\/?("[^"]*"|'[^']*'|[^>])*(>|$)/g, "");

    req.setLocale(req.params.lang);

    var jsonLdText = util.replaceAll(blogText, "\\(", "");
    jsonLdText = util.replaceAll(jsonLdText, "\\)", "");
    jsonLdText = util.replaceAll(jsonLdText, "\\", "");

    res.render("external/blog-post", await getCommonNavigationData({
        layout: "layouts/blog-post",
        post: post,
        relatedPosts: relatedPosts,
        url: req.protocol + '://' + req.get('host') + req.originalUrl,
        text: blogText,
        textjson: jsonLdText,
    }, req));
});

router.get('/blog/:lang/:post/preview', isAdminAuthNav, async (req, res) => {
    var postUrl = req.params.post;
    var post = await blog.getBlogPostByUrlAdmin(postUrl);
    if (post == null) {
        res.redirect("../");
        return;
    }

    var blogText = post.content.replace(/<\/?("[^"]*"|'[^']*'|[^>])*(>|$)/g, "");

    var jsonLdText = util.replaceAll(blogText, "\\(", "");
    jsonLdText = util.replaceAll(jsonLdText, "\\)", "");
    jsonLdText = util.replaceAll(jsonLdText, "\\", "");

    res.render("external/blog-post", await getCommonNavigationData({
        layout: "layouts/blog-post",
        post: post,
        relatedPosts: [],
        url: req.protocol + '://' + req.get('host') + req.originalUrl,
        text: blogText,
        textjson: jsonLdText
    }, req));
});

router.get('/blog/:lang/:post/edit', isAdminAuthNav, async (req, res) => {
    var postUrl = req.params.post;
    var post = await blog.getBlogPostByUrlAdmin(postUrl);
    if (post == null) {
        res.redirect("../");
        return;
    }

    var blogText = post.content.replace(/<\/?("[^"]*"|'[^']*'|[^>])*(>|$)/g, "");

    var jsonLdText = util.replaceAll(blogText, "\\(", "");
    jsonLdText = util.replaceAll(jsonLdText, "\\)", "");
    jsonLdText = util.replaceAll(jsonLdText, "\\", "");

    res.render("internal/blog-post-edit", await getCommonNavigationData({
        layout: "layouts/blog-post",
        post: post,
        relatedPosts: [],
        url: req.protocol + '://' + req.get('host') + req.originalUrl,
        text: blogText,
        textjson: jsonLdText
    }, req));
});

router.get('/login', loggedInRedirect, async (req, res) => {
    res.render("external/login", await getCommonNavigationData({
        layout: "layouts/auth",
        title: res.__('title.login'),
        errmsg: req.query.e,
        meta: meta.data[req.getLocale()].login,
        gcaptcha_key: process.env.RECAPTCHA_SITEKEY
    }, req));
});

router.get('/reset-password', loggedInRedirect, async (req, res) => {
    resetProcess = false;
    resetProcess = req.query.e != undefined;

    res.render("external/reset_password", await getCommonNavigationData({
        layout: "layouts/auth",
        title: res.__('title.reset'),
        resetProcess: resetProcess,
        meta: meta.data[req.getLocale()].reset_password,
        gcaptcha_key: process.env.RECAPTCHA_SITEKEY
    }, req));
});

router.get('/register', loggedInRedirect, async (req, res) => {
    res.render("external/register", await getCommonNavigationData({
        layout: "layouts/auth",
        title: res.__('title.register'),
        meta: meta.data[req.getLocale()].register,
        gcaptcha_key: process.env.RECAPTCHA_SITEKEY
    }, req));
});

router.get('/imprint', async (req, res) => {
    res.render("external/imprint", await getCommonNavigationData({
        title: res.__('title.imprint'),
        meta: meta.data[req.getLocale()].imprint,
    }, req));
});

router.get('/terms-of-service', async (req, res) => {
    res.render("external/terms-of-service", await getCommonNavigationData({
        title: res.__('title.terms'),
        meta: meta.data[req.getLocale()].terms,
    }, req));
});

router.get('/privacy', async (req, res) => {
    res.render("external/privacy", await getCommonNavigationData({
        title: res.__('title.privacy'),
        meta: meta.data[req.getLocale()].privacy,
    }, req));
});

router.get('/refund', async (req, res) => {
    res.render("external/refund", await getCommonNavigationData({
        title: res.__('title.refund'),
        meta: meta.data[req.getLocale()].refund,
    }, req));
});

router.get('/virtual-classroom', async (req, res) => {
    res.render("external/virtual-classroom", await getCommonNavigationData({
        title: res.__('title.virtual_classroom'),
        meta: meta.data[req.getLocale()].virtual_classroom,
    }, req));
});

router.get('/teaching-with-peakesl', async (req, res) => {
    res.render("external/how-it-works-tutor", await getCommonNavigationData({
        title: res.__('title.how_it_works_tutor'),
        meta: meta.data[req.getLocale()].how_it_works_tutor
    }, req));
});
router.get('/teaching-with-peakesl/*', async (req, res) => {
    res.render("external/how-it-works-tutor", await getCommonNavigationData({
        title: res.__('title.how_it_works_tutor'),
        meta: meta.data[req.getLocale()].how_it_works_tutor
    }, req));
});
router.get('/online-nachhilfe-geben', async (req, res) => {
    res.render("external/how-it-works-tutor", await getCommonNavigationData({
        title: res.__('title.how_it_works_tutor'),
        meta: meta.data[req.getLocale()].how_it_works_tutor
    }, req));
});
router.get('/online-nachhilfelehrer-werden', async (req, res) => {
    res.render("external/how-it-works-tutor", await getCommonNavigationData({
        title: res.__('title.how_it_works_tutor'),
        meta: meta.data[req.getLocale()].how_it_works_tutor
    }, req));
});

router.get('/become-a-tutor', async (req, res) => {
    res.render("external/become-a-tutor", await getCommonNavigationData({
        title: res.__('title.how_it_works_tutor'),
        meta: meta.data[req.getLocale()].how_it_works_tutor,
        gcaptcha_key: process.env.RECAPTCHA_SITEKEY
    }, req));
});

router.get('/online-tutoring', async (req, res) => {
    res.render("external/how-it-works-student", await getCommonNavigationData({
        title: res.__('title.how_it_works_student'),
        meta: meta.data[req.getLocale()].how_it_works_student
    }, req));
});
router.get('/online-nachhilfe', async (req, res) => {
    res.render("external/how-it-works-student", await getCommonNavigationData({
        title: res.__('title.how_it_works_student'),
        meta: meta.data[req.getLocale()].how_it_works_student
    }, req));
});



// USER ACCESS
router.get('/teachers', async (req, res) => {
    res.render("internal/teachers", await getCommonNavigationData({
        title: res.__('title.teachers', ''),
        layout: "layouts/internal",
        gcaptcha_key: process.env.RECAPTCHA_SITEKEY
    }, req, true));
});

router.get('/tutors', async (req, res) => {
    res.render("internal/teachers", await getCommonNavigationData({
        title: res.__('title.teachers', ''),
        layout: "layouts/internal",
        gcaptcha_key: process.env.RECAPTCHA_SITEKEY
    }, req, true));
});


router.get('/:subject-tutors', async (req, res) => {
    var subject = util.capitalize(req.params.subject);
    if (util.availableSubjects[subject] == undefined) {
        res.redirect("/tutors/");
        return;
    }

    res.render("internal/teachers", await getCommonNavigationData({
        title: res.__('title.teachers', subject),
        layout: "layouts/internal",
        gcaptcha_key: process.env.RECAPTCHA_SITEKEY,
        data: {
            subject: subject
        }
    }, req, true));
});

router.get('/teacher/', async (req, res) => {
    res.redirect("/tutors/");
});

router.get('/teacher/:id', async (req, res) => {
    if (req.params.id == "") {
        res.redirect("/tutors/");
    }

    try {
        var teacher = await user.getTeacherProfile(req.params.id);

        if (teacher.visible == false) {
            res.redirect("/teachers");
            return;
        }

        var bookedTimes = await user.getBookedTimeSlots(req.params.id);
        var reviews = await user.getReviewsLimited(req.params.id);

        res.render("internal/teacher", await getCommonNavigationData({
            title: res.__('title.teacher'),
            layout: "layouts/internal",
            teacher: teacher,
            bookedTimes: bookedTimes,
            reviews: reviews,
            gcaptcha_key: process.env.RECAPTCHA_SITEKEY
        }, req, true));
    } catch (error) {
        console.error(error);
        res.redirect("/teachers");
    }
});

router.get('/teacher/:id/book', isAuthNav, async (req, res) => {
    if (req.params.id == "") {
        res.redirect("/teachers");
    }

    try {
        var teacher = await user.getTeacherProfile(req.params.id);

        if (teacher.visible == false) {
            res.redirect("/teachers");
            return;
        }

        var bookedTimes = await user.getBookedTimeSlots(req.params.id);

        res.render("internal/book", await getCommonNavigationData({
            title: res.__('title.book'),
            layout: "layouts/internal",
            teacher: teacher,
            bookedTimes: bookedTimes,
        }, req, true));
    } catch (error) {
        console.error(error);
        res.redirect("/teachers");
    }
});

router.get('/lessons', isAuthNav, async (req, res) => {
    var usercache = {};
    var data = await lesson.getAllLessonsUID(req.user.id);

    for (item of data) {
        var otherId = item.sid == req.user.id ? item.tid : item.sid;
        if (usercache[otherId] == undefined) {
            var userData = await user.getBasicInfo(otherId);
            usercache[otherId] = userData;
        }
    }

    res.render("internal/lessons", await getCommonNavigationData({
        title: res.__('title.lessons'),
        layout: "layouts/internal",
        lessons: data,
        usercache: usercache,
    }, req, true));
});

router.get('/lesson/:id', isAuthNav, async (req, res) => {
    var lessonData = await lesson.getLessonById(req.params.id);

    if (lessonData == false) {
        res.redirect("/lessons");
        return;
    }

    lessonData = lessonData[0];

    var otherdata;
    if (req.user.id == lessonData.tid) {
        otherdata = await user.getBasicInfo(lessonData.sid);
    } else {
        otherdata = await user.getBasicInfo(lessonData.tid);
    }

    if (otherdata == null) {
        res.redirect("/lessons/");
        return;
    }

    res.render("internal/lesson", await getCommonNavigationData({
        title: res.__('title.lesson'),
        layout: "layouts/internal",
        lesson: lessonData,
        otherdata: otherdata,
    }, req, true));
});

router.get('/classroom/:id', isAuthNav, async (req, res) => {
    var lessonData;
    try {
        lessonData = await lesson.getLessonById(req.params.id);
        lessonData = lessonData[0];
    } catch (error) {
        res.redirect("/lessons/");
        return;
    }

    if (lessonData == null || lessonData == undefined) {
        res.redirect("/lessons/");
        return;
    }

    var otherId = lessonData.sid == req.user.id ? lessonData.tid : lessonData.sid;
    var role = lessonData.sid == req.user.id ? "student" : "teacher";
    var userData = await user.getBasicInfo(otherId);

    res.render("internal/classroom", await getCommonNavigationData({
        title: res.__('title.classroom'),
        layout: "layouts/classroom",
        lesson: lessonData,
        otherdata: userData,
        role: role,
        id: req.params.id
    }, req, true));
});

router.get('/registration-teacher', isAuthNav, async (req, res) => {
    res.render("internal/registration_teacher", await getCommonNavigationData({
        title: res.__('title.registerTeacher'),
        layout: "layouts/internal",
    }, req, true));
});

router.get('/settings-teacher', isAuthNav, async (req, res) => {
    res.render("internal/settings_teacher", await getCommonNavigationData({
        title: res.__('title.settingsTeacher'),
        layout: "layouts/internal",
    }, req, true));
});

router.get('/balance', isAuthNav, async (req, res) => {
    var transactions = await user.getTransactions(req.user.id);

    res.render("internal/balance", await getCommonNavigationData({
        title: res.__('title.balance'),
        layout: "layouts/internal",
        transactions: transactions,
    }, req, true));
});

router.get('/settings', isAuthNav, async (req, res) => {
    res.render("internal/settings", await getCommonNavigationData({
        title: res.__('title.balance'),
        layout: "layouts/internal",
    }, req, true));
});

router.get('/messages', isAuthNav, async (req, res) => {
    var conversations = await message.getConversationList(req.user.id);

    res.render("internal/messages", await getCommonNavigationData({
        title: res.__('title.messages'),
        layout: "layouts/internal",
        conversations: conversations
    }, req, true));
});

router.get('/verify/:uid/:code', async (req, res) => {
    var answer = "error";
    var data = await user.verifyEmail(req.params.uid, req.params.code);
    if (data) { answer = "success"; }

    if (req.isAuthenticated()) {
        res.redirect('/../../teachers/?verify=' + answer);
    } else {
        res.redirect('/../../login/?verify=' + answer);
    }
});

router.get('/receipt/:tid', isAuthNav, async (req, res) => {
    var tid = req.params.tid;
    var transaction;

    if (tid == "" || tid == undefined || tid == null) {
        res.redirect("/teachers");
    }

    try {
        transaction = await user.getTransactionById(tid);
    } catch (error) {
        res.redirect("/balance/");
        return;
    }

    if (transaction.type != "deposit" || transaction.rxid != req.user.id) {
        res.redirect("/balance/");
        return;
    }

    res.sendFile(process.cwd() + '/data/invoice/archive/PeakESL_invoice_' + tid + '.pdf', {}, function (err) {
        if (err) {
            res.redirect("/balance/");
            return;
        }
    });
});









// ADMIN AREA
router.get('/admin', isAdminAuthNav, async (req, res) => {
    res.render("admin/index", await getCommonNavigationData({
        title: "[Admin] Dashboard - PeakESL",
        layout: "layouts/internal"
    }, req, true));
});

router.get('/admin/stats', isAdminAuthNav, async (req, res) => {
    var data = await admin.getStatsOverviewData("", "");

    res.render("admin/stats", await getCommonNavigationData({
        title: "[Admin] Statistics - PeakESL",
        layout: "layouts/internal",
        data: data
    }, req, true));
});






getCanonical = (req, url = "") => {
    const proxyHost = req.headers["x-forwarded-host"];
    const host = proxyHost == undefined ? req.headers.host : proxyHost;
    var urlExt = url == "" ? req.originalUrl : url;

    if (host.startsWith("www.")) {
        return 'https://' + host.replace("www.", "") + urlExt;
    } else {
        return 'https://' + host + urlExt;
    }
}


getCommonNavigationData = async (resData, req, internal = false, noHeader = false) => {
    resData.env = process.env.ENV;
    resData.specialOfferExpires = process.env.SPECIAL_OFFER_EXPIRES;
    resData.exchangeRates = balance.getExchangeRates();
    resData.user = req.user;
    resData.locale = req.getLocale();
    resData.noHeader = noHeader;

    if (resData.user != undefined) {
        delete resData.user.password;
        delete resData.user.resetCode;
    }

    if (internal && req.user != undefined) {
        resData.notifications = await user.getUnreadNotifications(req.user.id);;
        resData.unreadMsg = await message.getUnreadConversationCount(req.user.id);
    }

    resData.nav = internal ? "internal" : "external";

    return resData;
}






module.exports = router;
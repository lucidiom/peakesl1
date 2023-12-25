require('dotenv').config();

const express = require("express");
const expressLayouts = require("express-ejs-layouts");

const app = express();
const http = require('http').Server(app);

const session = require('express-session');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const db = require('./model/db');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

var bodyParser = require('body-parser');
var compression = require('compression');
const fileUpload = require('express-fileupload');

app.disable('x-powered-by');

app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", process.cwd() + "/views");
app.set("layout", "layouts/external");

app.use('/', express.static(process.cwd() + '/public'));
app.use('/:f', express.static(process.cwd() + '/public'));
app.use('/:f/:s', express.static(process.cwd() + '/public'));
app.use('/:f/:s/:t', express.static(process.cwd() + '/public'));


app.use(compression());
app.use(cookieParser());
app.use(fileUpload());


app.enable('trust proxy');

const MongoStore = require('connect-mongo');
var sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    ttl: 30 * 24 * 60 * 60,
});

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    proxy: true,
    cookie: {
        secure: process.env.ENV === "production" || process.env.ENV === "testing"
    },
}));


app.use(passport.initialize());
app.use(passport.session());


module.exports.sessionStore = sessionStore;
module.exports.http = http;

const socket = require('./class/Socket.js');


app.use(function (req, res, next) {
    var proxyHost = req.headers["x-forwarded-host"];
    var host = proxyHost == undefined ? req.headers.host : proxyHost;

    var cookieLang = req.cookies['peakesl-c-language'];

    if (cookieLang != undefined) {
        next();
        return;
    }

    req.cookies['peakesl-c-language'] = "en";
    next();
});

const i18n = require('i18n');
i18n.configure({
    locales: ['en', 'de', 'ru', 'uk'],
    defaultLocale: 'en',
    directory: path.join(__dirname, 'locales'),
    fallbacks: {
        'en-*': 'en',
        'de-*': 'de'
    },
    cookie: 'peakesl-c-language',
    objectNotation: true,
    updateFiles: false,
    queryParameter: 'lang'
});
app.use(i18n.init);


app.use(express.urlencoded({ extended: true }));
app.use(express.json({
    verify: function (req, res, buf) {
        var url = req.originalUrl;
        if (url.startsWith('/payment/webhook-stripe')) {
            req.rawBody = buf.toString()
        }
    }
}));



passport.serializeUser(function (user, done) {
    done(null, user._id);
});
passport.deserializeUser(function (id, done) {
    db.User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new localStrategy(function (username, password, done) {
    db.User.findOne({ email: username.toLowerCase() }, function (err, user) {
        if (err) return done(err);
        if (!user) return done(null, false, { errmsg: 'username' });

        bcrypt.compare(password, user.password, function (err, res) {
            if (err) return done(err);
            if (res === false) return done(null, false, { errmsg: 'password' });

            return done(null, user);
        });
    });
}));





const navRouter = require('./routes/navigation.js');
app.use(navRouter);

const actionRouter = require('./routes/actions.js');
app.use(actionRouter);

const paymentRouter = require('./routes/payments.js');
app.use(paymentRouter);

const analyticsRouter = require('./routes/analytics.js');
app.use(analyticsRouter);


if (process.env.NODE_APP_INSTANCE === '0' || process.env.NODE_APP_INSTANCE == undefined) {
    const CronJobsClass = require('./cron/jobs.js');
    const CronJobs = new CronJobsClass();
}




const user = require('./class/User.js');
const balance = require('./class/Balance.js');



app.get('*', async function (req, res) {
    var notifications;

    if (req.user != undefined) {
        notifications = await user.getUnreadNotifications(req.user.id);
    }

    res.status(404);

    res.render("404", {
        env: process.env.ENV,
        layout: "layouts/404",
        title: "Page not found - PeakESL",
        locale: req.getLocale(),
        user: req.user,
        notifications: notifications,
        exchangeRates: balance.getExchangeRates(),
        specialOfferExpires: process.env.SPECIAL_OFFER_EXPIRES
    });
});


http.listen(process.env.PORT, () => console.log(`PeakESL running on http://localhost:${process.env.PORT}`));
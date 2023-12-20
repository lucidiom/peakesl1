require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET);

const {
    isAuth
} = require('./../util/auth');

const mail = require('./../class/Mail.js');
const user = require('./../class/User.js');
const balance = require('./../class/Balance.js');
const lesson = require('./../class/Lesson.js');

const invoice = require('./../class/Invoice.js');



router.post("/payment/stripe/createPayment", isAuth, async (req, res) => {
    const proxyHost = req.headers["x-forwarded-host"];
    const host = proxyHost == undefined ? req.headers.host : proxyHost;

    var amount = parseFloat(req.body.amount);
    var fee = balance.calculateDeposit(amount);
    if (fee === false) {
        res.json({
            status: "error"
        });
        return;
    }

    var locale = req.getLocale();
    var paymentMethods = [];

    switch (locale) {
        case "de":
            paymentMethods = ['sepa_debit', 'card', 'sofort', 'ideal'];
            break;
        default:
            paymentMethods = ['sepa_debit', 'card', 'p24', 'ideal', 'sofort'];
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethods,
        billing_address_collection: 'required',
        line_items: [{
            price_data: {
                currency: 'eur',
                product_data: {
                    name: 'PeakESL Balance',
                },
                unit_amount: amount * 100,
            },
            quantity: 1,
        }, {
            price_data: {
                currency: 'eur',
                product_data: {
                    name: 'Processing fee',
                },
                unit_amount: Math.ceil(fee * 100),
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: req.protocol + '://' + host + '/balance?success=1',
        cancel_url: req.protocol + '://' + host + '/balance?cancel=1',
        metadata: {
            action: "deposit",
            uid: req.user.id,
            amount: amount,
            fee: fee,
            locale: req.locale,
            currency: req.user.currency
        },
        client_reference_id: req.user.id,
        locale: req.locale == "uk" ? "en" : req.locale,
        customer_email: req.user.email
    });

    res.json({
        id: session.id
    });
});

router.post("/payment/stripe/createSinglePayment", isAuth, async (req, res) => {
    const proxyHost = req.headers["x-forwarded-host"];
    const host = proxyHost == undefined ? req.headers.host : proxyHost;

    var amount = parseFloat(req.body.price);
    var donation = parseFloat(req.body.donation);
    var priceData = balance.calculateLessonFee(amount, req.body.roundUp, donation);

    if (priceData.fee === false) {
        res.json({
            status: "error"
        });
        return;
    }

    var locale = req.getLocale();
    var paymentMethods = [];

    switch (locale) {
        case "de":
            paymentMethods = ['sepa_debit', 'card', 'sofort', 'ideal'];
            break;
        default:
            paymentMethods = ['sepa_debit', 'card', 'p24', 'ideal', 'sofort'];
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethods,
        billing_address_collection: 'required',
        line_items: [{
            price_data: {
                currency: 'eur',
                product_data: {
                    name: req.body.tf + ' minutes ' + req.body.subject + ' lesson',
                },
                unit_amount: priceData.lesson * 100,
            },
            quantity: 1,
        }, {
            price_data: {
                currency: 'eur',
                product_data: {
                    name: 'PeakESL Social Program',
                },
                unit_amount: Math.round(priceData.donation * 100),
            },
            quantity: 1,
        }, {
            price_data: {
                currency: 'eur',
                product_data: {
                    name: 'Processing fee',
                },
                unit_amount: Math.round(priceData.fee * 100),
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: req.protocol + '://' + host + '/teacher/' + req.body.tid + "/book/?success=true",
        cancel_url: req.protocol + '://' + host + '/teacher/' + req.body.tid + "/book/",
        metadata: {
            action: "book_lesson",
            tid: req.body.tid,
            date: req.body.date,
            subject: req.body.subject,
            price: priceData.lesson,
            tf: req.body.tf,
            time: req.body.time,
            total: req.body.total,
            tz: req.body.tz,
            uid: req.user.id,
            amount: priceData.total,
            fee: priceData.fee,
            donation: priceData.donation,
            locale: req.locale,
            currency: req.user.currency
        },
        client_reference_id: req.user.id,
        locale: req.locale == "uk" ? "en" : req.locale,
        customer_email: req.user.email
    });

    res.json({
        id: session.id
    });
});

router.post("/payment/stripe/createTutorSignupPayment", async (req, res) => {
    const proxyHost = req.headers["x-forwarded-host"];
    const host = proxyHost == undefined ? req.headers.host : proxyHost;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['sepa_debit', 'card'],
        line_items: [{
            price: "price_1MYq5XLVOLfe8u22U1fv0mAP",
            quantity: 1,
        }],
        mode: "subscription",
        success_url: req.protocol + '://' + host + '/settings-teacher/',
        cancel_url: req.protocol + '://' + host + '/become-a-tutor/?cp=1',
        metadata: {
            action: "tutor_signup",
            amount: 20,
            locale: req.locale
        },
        locale: req.locale == "uk" ? "en" : req.locale,
        client_reference_id: req.user.id,
        customer_email: req.user.email
    });

    res.json({
        id: session.id
    });
});

router.post("/payment/getPaymentFee", isAuth, async (req, res) => {
    var price = parseFloat(req.body.price);
    var donation = parseFloat(req.body.donation);
    var data = balance.calculateLessonFee(price, req.body.roundUp, donation);

    res.json({
        status: "ok",
        fee: data.fee,
        donation: data.donation,
        total: data.total
    });
});

router.post("/payment/webhook-stripe", async (req, res) => {
    var sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_ENDPOINT_SECRET);
    } catch (err) {
        return res.status(400).send(`Payment Webhook Error: ${err.message}`);
    }


    res.json({
        received: true
    });



    if (event.type === 'checkout.session.completed') {
        var session = event.data.object;

        if (!Object.keys(session.metadata).includes("action")) return
        if (session.metadata.action != "deposit" && session.metadata.action != "book_lesson") {
            return;
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent
        );
        const paymentMethod = await stripe.paymentMethods.retrieve(
            paymentIntent.payment_method
        );

        var uid = session.metadata.uid;
        var amount = paymentIntent.amount_received / 100;
        var fee = parseFloat(session.metadata.fee);
        if (isNaN(fee)) fee = 0;
        var locale = session.metadata.locale == undefined ? "en" : session.metadata.locale;
        var amount_credit = amount - fee;

        var txid = await balance.depositBalance(uid, amount_credit, fee);
        var u = await user.getUserById(uid);

        await invoice.createDepositInvoice({
            locale: locale,
            tid: txid,
            uid: uid,
            date: Date.now(),
            firstname: u.firstname,
            lastname: u.lastname,
            line1: paymentMethod.billing_details.address.line1,
            line2: paymentMethod.billing_details.address.line2,
            zip: paymentMethod.billing_details.address.postal_code,
            city: paymentMethod.billing_details.address.city,
            amount_credits: amount - fee,
            fee: fee,
            tax: 0,
            amount: amount,
            currency: u.currency == undefined ? "eur" : u.currency
        });

        if (session.metadata.action == "deposit") {
            await mail.sendDepositSuccessful(txid, u.email, u.firstname, locale);
        }

        if (session.metadata.action == "book_lesson") {
            var res = await lesson.bookLessonRaw(session.metadata);
            console.log(res);
        }
    }

});



module.exports = router;
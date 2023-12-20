require('dotenv').config({
    path: process.cwd() + '/../'
});
const moment = require('moment');
const i18n = require('i18n');

const fs = require('fs');

const mail = require('@sendgrid/mail');
const client = require('@sendgrid/client');
const { locale } = require('moment');
client.setApiKey(process.env.SENDGRID_API_KEY);

mail.setApiKey(process.env.SENDGRID_API_KEY);
mail.setSubstitutionWrappers('{{', '}}');


let substitutions = {
    asmGroupUnsubscribeUrl: '<%asm_group_unsubscribe_url%>',
    asmGlobalUnsubscribeUrl: '<%asm_global_unsubscribe_url%>',
    asmPreferencesUrl: '<%asm_preferences_url%>',
    asmPreferencesRawUrl: '<%asm_preferences_raw_url%>'
}


exports.createEmailContact = async (email, firstname, lastname, locale, currency) => {
    const sendgrid_body = {
        list_ids: ["097ec961-2548-44f9-ba52-8eeecfe9287f", "a90cc56a-cb8f-44c7-bc39-ae9ff87d05ee", "665dfb59-3487-466d-bf82-37d946b744e8"],
        contacts: [{
            "email": email,
            "first_name": firstname,
            "last_name": lastname,
            "custom_fields": {
                "e1_T": locale,
                "e2_T": currency
            }
        }]
    };
    const request = {
        method: 'PUT',
        url: '/v3/marketing/contacts',
        body: sendgrid_body
    };
    await client.request(request);
}

exports.createEmailContactOlympiad = async (email, firstname, lastname) => {
    const sendgrid_body = {
        list_ids: ["097ec961-2548-44f9-ba52-8eeecfe9287f", "35d961ef-fabd-4c6f-b1d1-038e09b3f82a"],
        contacts: [{
            "email": email,
            "first_name": firstname,
            "last_name": lastname
        }]
    };
    const request = {
        method: 'PUT',
        url: '/v3/marketing/contacts',
        body: sendgrid_body
    };
    await client.request(request);
}

exports.updateEmailContact = async (email, firstname, lastname, locale, currency) => {
    const sendgrid_body = {
        contacts: [{
            "email": email,
            "first_name": firstname,
            "last_name": lastname,
            "custom_fields": {
                "e1_T": locale,
                "e2_T": currency
            }
        }]
    };
    const request = {
        method: 'PUT',
        url: '/v3/marketing/contacts',
        body: sendgrid_body
    };
    await client.request(request);
}

exports.updateLocale = async (email, locale) => {
    const sendgrid_body = {
        contacts: [{
            "email": email,
            "custom_fields": {
                "e1_T": locale
            }
        }]
    };
    const request = {
        method: 'PUT',
        url: '/v3/marketing/contacts',
        body: sendgrid_body
    };
    return client.request(request);
}

exports.updateCurrency = async (email, currency) => {
    const sendgrid_body = {
        contacts: [{
            "email": email,
            "custom_fields": {
                "e2_T": currency
            }
        }]
    };
    const request = {
        method: 'PUT',
        url: '/v3/marketing/contacts',
        body: sendgrid_body
    };
    return client.request(request);
}

exports.sendLessonRequestMail = async (receiver, locale = "en") => {
    i18n.setLocale(locale);
    var data = {
        subject: i18n.__('mail.subjects.lessonRequest'),
        link: "lessons"
    };
    data[locale] = true;


    mail.send({
        to: receiver,
        from: process.env.SENDGRID_SENDER,
        templateId: 'd-2979fec299f14ccd9ae314230560d072',
        dynamicTemplateData: data,
        substitutions: substitutions,
        asm: {
            groupId: 17640
        }
    });
}

exports.sendTeacherLessonAccept = async (receiver, locale = "en") => {
    i18n.setLocale(locale);
    var data = {
        subject: i18n.__('mail.subjects.teacherLessonAccept'),
        link: "lessons"
    };
    data[locale] = true;

    mail.send({
        to: receiver,
        from: process.env.SENDGRID_SENDER,
        templateId: 'd-eb117271597a4ac089e1e56e34ac9a30',
        dynamicTemplateData: data,
        substitutions: substitutions,
        asm: {
            groupId: 17640
        }
    });
}

exports.sendTeacherLessonRejected = async (receiver, locale = "en") => {
    i18n.setLocale(locale);
    var data = {
        subject: i18n.__('mail.subjects.teacherLessonRejected'),
        link: "teachers"
    };
    data[locale] = true;

    mail.send({
        to: receiver,
        from: process.env.SENDGRID_SENDER,
        templateId: 'd-16db72d52d0542129eac937c834bb0a8',
        dynamicTemplateData: data,
        substitutions: substitutions,
        asm: {
            groupId: 17640
        }
    });
}

exports.sendTeacherLessonCanceled = async (receiver, locale = "en") => {
    i18n.setLocale(locale);
    var data = {
        subject: i18n.__('mail.subjects.teacherLessonCanceled'),
        link: "teachers"
    };
    data[locale] = true;

    mail.send({
        to: receiver,
        from: process.env.SENDGRID_SENDER,
        templateId: 'd-04f3d584dcac46aa8564d399acb6d487',
        dynamicTemplateData: data,
        substitutions: substitutions,
        asm: {
            groupId: 17640
        }
    });
}

exports.sendTeacherLessonCompleted = async (receiver, points, locale = "en") => {
    i18n.setLocale(locale);
    var data = {
        subject: i18n.__('mail.subjects.teacherLessonCompleted'),
        link: "lessons",
        points: Math.round(points * 100) / 100
    };
    data[locale] = true;

    mail.send({
        to: receiver,
        from: process.env.SENDGRID_SENDER,
        templateId: 'd-388538b152014fc5b3b4ccb9c78d3fbe',
        dynamicTemplateData: data,
        substitutions: substitutions,
        asm: {
            groupId: 17640
        }
    });
}

exports.sendDepositSuccessful = async (tid, receiver, firstname, locale = "en") => {
    i18n.setLocale(locale);
    var data = {
        subject: i18n.__('mail.subjects.deposit-success'),
        firstname: firstname
    };
    data[locale] = true;

    // fetch invoice and attach to mail
    var invoice = fs.readFileSync(process.cwd() + '/data/invoice/archive/PeakESL_invoice_' + tid + '.pdf').toString("base64");

    mail.send({
        to: receiver,
        from: process.env.SENDGRID_SENDER,
        templateId: 'd-81266b91172c4af9b81d51b95d2d1a37',
        dynamicTemplateData: data,
        substitutions: substitutions,
        asm: {
            groupId: 17640
        },
        attachments: [{
            content: invoice,
            filename: 'PeakESL_' + tid + '.pdf',
            type: "application/pdf",
            disposition: "attachment"
        }]
    });

    mail.send({
        to: process.env.EMAIL_INVOICE_COPY,
        from: process.env.SENDGRID_SENDER,
        subject: "PeakESL Deposit Invoice",
        html: `You did it again - great job!`,
        attachments: [{
            content: invoice,
            filename: 'PeakESL_' + tid + '.pdf',
            type: "application/pdf",
        }]
    });
}

exports.sendPasswordReset = async (receiver, firstname, uid, code, locale = "en") => {
    i18n.setLocale(locale);
    var data = {
        subject: i18n.__('mail.subjects.password-reset'),
        firstname: firstname,
        code: code,
        uid: uid,
        email: receiver
    };
    data[locale] = true;


    mail.send({
        to: receiver,
        from: process.env.SENDGRID_SENDER,
        templateId: 'd-1f530b00843f4d55a8984a3e8dcf8ac4',
        dynamicTemplateData: data
    });
}

exports.sendVerifyEmail = async (receiver, firstname, uid, code, locale = "en") => {
    i18n.setLocale(locale);
    var data = {
        subject: i18n.__('mail.subjects.mail-confirmation'),
        firstname: firstname,
        code: code,
        uid: uid
    };
    data[locale] = true;


    mail.send({
        to: receiver,
        from: process.env.SENDGRID_SENDER,
        templateId: 'd-328f76deb41844fe9315d7b4afa904a9',
        dynamicTemplateData: data
    });
}

exports.sendWelcomeTutor = async (receiver, firstname, locale = "en") => {
    if (locale != "ru") {
        return;
    }

    i18n.setLocale(locale);
    var data = {
        subject: 'Ура! Теперь ты в команде вдохновляющих тьюторов.',
        firstname: firstname
    };
    data[locale] = true;


    var pdfAttachment = fs.readFileSync(process.cwd() + '/data/Welcome_Tutor.pdf').toString("base64");
    mail.send({
        to: receiver,
        from: process.env.SENDGRID_SENDER,
        templateId: 'd-e799d1570f884133b18a28c103a072d5',
        dynamicTemplateData: data
    });
}

exports.sendWelcomeOlympiadStudent = async (receiver, firstname) => {
    var data = {
        subject: firstname + ', рады видеть тебя в сообществе участников и победителей Олимпиад!',
        firstname: firstname
    };

    mail.send({
        to: receiver,
        from: process.env.SENDGRID_SENDER,
        templateId: 'd-91b46105415949ae9b865096457955b8',
        dynamicTemplateData: data
    });
}




exports.createSupportTicket = async (data) => {
    var dataPres = "";
    for (const [key, value] of Object.entries(data)) {
        dataPres += `<br> <b>${key}: </b> ${value}`;
    }

    var title_suffix = "";
    if (process.env.ENV != "production") {
        title_suffix = "[" + process.env.ENV.toUpperCase() + "] ";
    }

    mail.send({
        to: process.env.EMAIL_SUPPORT_TICKET,
        from: process.env.SENDGRID_SENDER,
        subject: title_suffix + 'Automatic Support Ticket',
        html: `${dataPres} <br><br>
                <b>Time sent</b> <br>
                 ${moment().format("dddd, MMMM Do YYYY, h:mm:ss a")}`
    });
}

exports.sendAdminDisputeNotification = async (lid, text, lessonData) => {
    var title_suffix = "";
    if (process.env.ENV != "production") {
        title_suffix = "[" + process.env.ENV.toUpperCase() + "] ";
    }

    mail.send({
        to: process.env.EMAIL_SUPPORT_TICKET,
        from: process.env.SENDGRID_SENDER,
        subject: title_suffix + 'Dispute started',
        html: `A new dispute has been started. <br><br>
                                    <b>Lesson #</b> <br>
                                    ${lid} <br> <br>
                                    <b>Message from student</b> <br>
                                    ${text} <br> <br>
                                    <b>Lesson data</b> <br>
                                    ${JSON.stringify(lessonData)} <br><br>
                                    <b>Time sent</b> <br>
                                    ${moment().format("dddd, MMMM Do YYYY, h:mm:ss a")}`
    });
}

exports.sendAdminCronJobErrorReport = async (error) => {
    var title_suffix = "";
    if (process.env.ENV != "production") {
        title_suffix = "[" + process.env.ENV.toUpperCase() + "] ";
    }

    mail.send({
        to: process.env.EMAIL_SUPPORT_TICKET,
        from: process.env.SENDGRID_SENDER,
        subject: title_suffix + "ERROR: Lesson Cron Job",
        html: `${JSON.stringify(error)}<br><br>Error generated ${moment().format("dddd, MMMM Do YYYY, h:mm:ss a")}`
    });
}

exports.sendAdminCronJobReport = async (closed_open_confirms, closed_pending_requests) => {
    var title_suffix = "";
    if (process.env.ENV != "production") {
        title_suffix = "[" + process.env.ENV.toUpperCase() + "] ";
    }

    mail.send({
        to: process.env.EMAIL_SUPPORT_TICKET,
        from: process.env.SENDGRID_SENDER,
        subject: title_suffix + "Lesson Cron Job Report",
        html: `Closed pending confirmations: ${closed_open_confirms} <br>
                Closed pending requests: ${closed_pending_requests} <br><br>
                Report generated ${moment().format("dddd, MMMM Do YYYY, h:mm:ss a")}`
    });
}
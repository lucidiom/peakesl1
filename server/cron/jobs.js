require('dotenv').config({
    path: process.cwd() + '/../'
});

const CronJob = require('cron').CronJob;

const db = require('./../model/db');
const mail = require('./../class/Mail.js');
const user = require('./../class/User.js');
const lesson = require('./../class/Lesson.js');

const moment = require('moment');

const fetch = require('node-fetch');
const fs = require('fs');




class CronJobs {
    constructor() {
        console.log("CRON JOB MANAGER STARTED");

        this.lessonManagement();
        this.exchangeRates();
    }




    async lessonManagement() {
        var lessonJob = new CronJob('0 * * * *', async function () {
            var closed_open_confirms = 0;
            var closed_pending_requests = 0;

            var now = moment.utc();
            var now_m24 = moment.utc().subtract(24, "hours");
            var now_m72 = moment.utc().subtract(72, "hours");



            // lesson not confirmed after 24 hours
            var lessons = await db.Lesson.find({
                status: "confirmed",
                endtime: { $lte: now_m24 }
            }).exec();


            for (let item of lessons) {
                var teacherData = await user.getBasicInfo(item.tid);
                var studentData = await user.getBasicInfo(item.sid);
                await lesson.confirm(item, teacherData, studentData);
                closed_open_confirms++;
            };



            // lesson request pending after lesson start OR no response after 72 hours
            var lessons = await db.Lesson.find({
                status: "requested",
                $or: [
                    { starttime: { $lte: now } },
                    { createdAt: { $lte: now_m72 } }
                ]
            }).exec();

            for (let item of lessons) {
                var studentData = await user.getBasicInfo(item.sid);
                var teacherData = await user.getBasicInfo(item.tid);
                await lesson.reject(item, studentData, teacherData);
                closed_pending_requests++;
            };



            // send report
            if (closed_open_confirms > 0 || closed_pending_requests > 0) {
                await mail.sendAdminCronJobReport(closed_open_confirms, closed_pending_requests);
            }

        }, null, true, 'Europe/Berlin');
        lessonJob.start();
    }


    async exchangeRates() {
        var exchangeJob = new CronJob('0 0,12 * * *', async function () {
            var data;
            try {
                var data_raw = await fetch('http://api.exchangeratesapi.io/latest?access_key=' + process.env.EXCHANGERATESAPI_KEY);
                data = await data_raw.json();
            } catch (error) {
                console.log(error);
            }
            fs.writeFileSync(process.cwd() + '/data/rates.json', JSON.stringify(data.rates));
        }, null, true, 'Europe/Berlin');
        exchangeJob.start();
    }


}

module.exports = CronJobs;
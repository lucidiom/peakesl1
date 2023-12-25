require('dotenv').config({
    path: process.cwd() + '/../'
});

const util = require('../util/helper.js');
const db = require('../model/db.js');
const moment = require('moment');




exports.getStatsOverviewData = async (start_time, end_time) => {
    var result = {
        count_lessons_requested: 0,
        count_lessons_completed: 0,
        count_messages: 0,
        count_reviews: 0,
        count_transactions: 0,
        count_deposits: 0,
        count_users: 0,
        count_teachers: 0,
        users: []
    };


    result.count_lessons_requested = await db.Lesson.countDocuments({ status: "requested" }).exec();
    result.count_lessons_completed = await db.Lesson.countDocuments({ status: "completed" }).exec();
    result.count_messages = await db.Message.countDocuments({}).exec();
    result.count_reviews = await db.Review.countDocuments({}).exec();
    result.count_transactions = await db.Transaction.countDocuments({}).exec();
    result.count_deposits = await db.Transaction.countDocuments({ type: "deposit" }).exec();
    result.count_users = await db.User.countDocuments({}).exec();
    result.count_teachers = await db.User.countDocuments({ visible: true }).exec();

    result.users = await db.User.find({}).sort([
        ['createdAt', -1]
    ]);

    return result;
}
require('dotenv').config({
    path: process.cwd() + '/../'
});

const util = require('../util/helper.js');

const moment = require('moment');
const db = require('../model/db.js');

const user = require('./../class/User.js');
const socket = require('./../class/Socket.js');



exports.create = async (rx, tx, text, rx_name, tx_name) => {
    // var read = socket.isUserOnline(rx);

    var msg = new db.Message({
        rx: rx,
        tx: tx,
        text: util.cleanString(text),
        read: false
    });
    await msg.save();

    socket.sendMessage(rx, msg);
}

exports.markAsRead = async (rx, tx) => {
    await db.Message.updateMany({ rx: rx, tx: tx }, { read: true });
}

exports.getConversationList = async (uid) => {
    var convIds = [];
    var resultConv = [];
    var usercache = {};

    var msgs = await db.Message.find({
        $or: [
            { rx: uid },
            { tx: uid }
        ]
    }).sort([
        ['createdAt', -1],
        ['read', false]
    ]);

    for (let i = 0; i < msgs.length; i++) {
        var item = msgs[i].toObject();
        var otherId = item.rx == uid ? item.tx : item.rx;

        if (!convIds.includes(otherId)) {
            var us = await user.getBasicInfo(otherId);

            if (us == null) {
                continue;
            }

            item.other = {
                id: otherId,
                firstname: us.firstname,
                lastname: us.lastname,
                teacher: us.visible
            }
            convIds.push(otherId);
            resultConv.push(item);
        }
    }

    return resultConv;
}

exports.getConversation = async (id, uid) => {
    await db.Message.updateMany({
        $and: [
            { rx: uid },
            { tx: id }
        ]
    }, { read: true });


    return await db.Message.find({
        $or: [{
                $and: [
                    { rx: uid },
                    { tx: id }
                ]
            },
            {
                $and: [
                    { rx: id },
                    { tx: uid }
                ]
            }
        ]
    }).sort([
        ['createdAt', 1]
    ]);
}

exports.getUnreadConversationCount = async (uid) => {
    var msg = await db.Message.find({
        $and: [
            { rx: uid },
            { read: false }
        ]
    });
    return msg.length;
}
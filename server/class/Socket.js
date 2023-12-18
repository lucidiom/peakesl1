require('dotenv').config({
    path: process.cwd() + '/../'
});

const app = require('./../index.js');
const passport = require('passport');

const session = require('express-session');

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);


class Socket {
    constructor() {
        var self = this;
        this.clients = {};

        this.io = require('socket.io')(app.http, { transports: ['websocket', 'polling'] });

        this.io.use(wrap(session({
            store: app.sessionStore,
            secret: process.env.SESSION_SECRET,
            resave: true,
            saveUninitialized: true,
            proxy: true,
            cookie: {
                secure: process.env.ENV === "production" || process.env.ENV === "testing"
            }
        })));
        this.io.use(wrap(passport.initialize()));
        this.io.use(wrap(passport.session()));


        this.io.use((socket, next) => {
            if (socket.request.user) {
                next();
            } else {
                next(new Error("unauthorized"))
            }
        });


        this.io.on('connection', (socket) => {
            this.clients[socket.request.user._id] = socket.id;
            //console.log(socket.request.user);

            socket.on('disconnect', function () {
                delete self.clients[socket.request.user._id];
            });
        });
    }

    send(receiver, event, data) {
        if (!this.isUserOnline(receiver)) return;
        this.io.to(this.getSocketIdByUid(receiver)).emit(event, data);
    }

    sendMessage(receiver, data) {
        if (!this.isUserOnline(receiver)) return;
        this.io.to(this.getSocketIdByUid(receiver)).emit("message", data);
    }

    sendNotification(receiver, data) {
        if (!this.isUserOnline(receiver)) return;
        this.io.to(this.getSocketIdByUid(receiver)).emit("notification", data);
    }

    isUserOnline(uid) {
        return this.getSocketIdByUid(uid) != undefined;
    }

    getSocketIdByUid(uid) {
        return this.clients[uid];
    }

    getSocket() {
        return this.io;
    }
}

module.exports = new Socket();
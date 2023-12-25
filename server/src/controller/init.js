const UTCOffset = moment().utcOffset();

var socket;
var messageSound = new Audio(CDN + 'sounds/message.mp3');


async function checkForUpcomingLessons() {
    var cookie = getCookie("peakesl-upcoming-lesson");
    var upcomingData = {};
    var data;


    if (cookie != undefined) {
        upcomingData = JSON.parse(cookie);

        if (upcomingData.uid == uData._id) {
            if (upcomingData.status == "yes") {
                var time = moment.utc(upcomingData.starttime).add(UTCOffset, "minutes");
                $("body").append(`<div class="notification-sticky"><p>${$.i18n('_bstr.general.lessonStart', time.format("LT"))} </p><a href="/classroom/${upcomingData.lessonid}">Join now</a></div>`);
            }
            return;
        }
    }

    try {
        data = await r('upcomingLesson', {});
    } catch (error) {
        console.error(error);
        return;
    }


    if (data.status == "no") {
        setCookieMinutes("peakesl-upcoming-lesson", JSON.stringify({
            status: "no",
            uid: uData._id
        }), 5);
        return;
    }

    data.uid = uData._id;

    var now = moment().unix();
    var endtime = moment.utc(data.endtime);

    var cookieData = JSON.stringify(data);
    var cookieLife = (endtime.unix() - now) / 60;
    setCookieMinutes("peakesl-upcoming-lesson", cookieData, cookieLife);

    var time = moment.utc(data.starttime).add(UTCOffset, "minutes");
    $("body").append(`<div class="notification-sticky"><p>${$.i18n('_bstr.general.lessonStart', time.format("LT"))} </p><a href="/classroom/${data.lessonid}">${$.i18n('_bstr.general.lessonStart.btn')}</a></div>`);
}

if (typeof uData != "undefined") {
    if (!window.location.pathname.startsWith("/classroom/")) {
        checkForUpcomingLessons();
    }
    setupSocket();
}

async function r(target, data = {}, params = {}) {
    var rq = {
        url: window.location.origin + "/" + target,
        type: 'post',
        data: data,
        xhrFields: {
            withCredentials: true
        }
    };

    $.extend(rq, params);
    var result = await $.ajax(rq);
    return objectify(result);
}


function showNotification(content, type, id = "main-notification") {
    $("#" + id).removeClass("error");
    $("#" + id).removeClass("success");
    $("#" + id).removeClass("warning");
    $("#" + id).removeClass("info");
    $("#" + id).removeClass("notice");

    $("#" + id + ">p").html(content);
    $("#" + id).addClass(type);
    $("#" + id).fadeIn("fast");
}

function hideNotification(id = "main-notification") {
    $("#" + id).fadeOut("fast");
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

function mToHHMM(min) {
    var m = min % 60;
    var h = (min - m) / 60;
    var sign = h >= 0 ? "+" : "";
    return sign + h.toString() + ":" + (m < 10 ? "0" : "") + m.toString();
}

function scrollTop() {
    $('html, body').animate({
        scrollTop: 0
    }, 0);
}

function objectify(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function round2dec(num) {
    return Math.round(num * 100) / 100;
}

function round1dec(num) {
    return Math.round(num * 10) / 10;
}



const changeFavicon = link => {
    let $favicon = document.querySelector('link[rel="icon"]')
    if ($favicon !== null) {
        $favicon.href = link
    } else {
        $favicon = document.createElement("link")
        $favicon.rel = "icon"
        $favicon.href = link
        document.head.appendChild($favicon)
    }
}

$(window).focus(function () {
    changeFavicon("https://peakesl.nyc3.cdn.digitaloceanspaces.com/web/images/favicon.png");
});


function setupSocket() {
    socket = io('', {
        transports: ['websocket', 'polling']
    });

    socket.on("message", function (data) {
        if (typeof (messageSite) == "undefined") {
            $(".header-messages a").html('<i class="icon-feather-mail"></i><span class="header-not-nocount">&nbsp;</span>');

            if (document.hidden) {
                messageSound.play();
                changeFavicon();
                changeFavicon("https://peakesl.nyc3.cdn.digitaloceanspaces.com/web/images/favicon_notification.png");
            }
        }
    });

    socket.on("notification", function (data) {
        $("#notification-none").hide();
        addNotification(data);
        i18n_updatePrices();

        $(".notifications-header-icon").html('<i class="icon-feather-bell"></i><span>' + unreadNotificationCount + '</span>');

        if (document.hidden) {
            messageSound.play();
            changeFavicon();
            changeFavicon("https://peakesl.nyc3.cdn.digitaloceanspaces.com/web/images/favicon_notification.png");
        }
    });
}


function timetableToLocalTimezone(timetable) {
    var tfdata = timetable;
    timetable = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };

    // correct timetable to LOCALE
    for (var i in tfdata) {
        for (var x in tfdata[i]) {

            if (tfdata[i][x] == undefined) {
                console.log("undefined, continue", tfdata[i], tfdata[i][x]);
                continue;
            }
            if (tfdata[i][x].adjusted != undefined) {
                continue;
            }

            tfdata[i][x].start = fillupHour(tfdata[i][x].start);
            tfdata[i][x].end = fillupHour(tfdata[i][x].end);

            var startmin = parseInt(tfdata[i][x].start.split(":")[0]) * 60 + parseInt(tfdata[i][x].start.split(":")[1]);
            startmin += UTCOffset;
            if (startmin == 0) { startmin = -1; }

            var endmin = parseInt(tfdata[i][x].end.split(":")[0]) * 60 + parseInt(tfdata[i][x].end.split(":")[1]);
            endmin += UTCOffset;
            if (endmin == 0) { endmin = -1; }



            var day_before = weekdayToNumber[i] - 1;
            if (day_before < 0) { day_before = 6; }
            day_before = numberToWeekday[day_before];

            var day_after = weekdayToNumber[i] + 1;
            if (day_after > 6) { day_after = 0; }
            day_after = numberToWeekday[day_after];


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
                var newend = moment("00:00", "HH:mm").add(endmin - 1439, "minutes");

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
            timetable[i][x].start = fillupHour(timetable[i][x].start);
            timetable[i][x].end = fillupHour(timetable[i][x].end);
        }
    }

    return timetable;
}

function fillupHour(timeItem) {
    if (timeItem.split(":")[0] != "23" && timeItem.split(":")[1] == 59) {
        var hour = parseInt(timeItem.split(":")[0]);
        hour++;
        timeItem = ("00" + hour).slice(-2) + ":00";
    }
    return timeItem;
}

$.fn.randomize = function (selector) {
    (selector ? this.find(selector) : this).parent().each(function () {
        $(this).children(selector).sort(function () {
            return Math.random() - 0.5;
        }).detach().appendTo(this);
    });

    return this;
};

function getLocalStorage(id) {
    var data = window.localStorage.getItem(id);

    if (data != null && data != "") {
        var obj = JSON.parse(data);
        var time = moment().unix();

        if (time > obj.exp) {
            window.localStorage.removeItem(id);
            return null;
        }
        return obj.data;
    }

    return data;
}

function setLocalStorage(id, ctx, life) {
    if (life == 0) {
        window.localStorage.removeItem(id);
        return;
    }

    var expiryDate = moment().add(life, 'd').unix();

    var data = {
        "exp": expiryDate,
        "data": ctx
    };
    window.localStorage.setItem(id, JSON.stringify(data));
}

$(window).on('scroll', function () {
    checkScrollNavbar();
});

function checkScrollNavbar() {
    var scrollTop = $(this).scrollTop();

    if (scrollTop == 0) {
        $("#header").css("border-bottom", "transparent");
    } else {
        $("#header").css("border-bottom", "1px solid var(--border)");
    }
}
checkScrollNavbar();
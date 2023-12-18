var chatroom;
var token = "";
var chat = true;
var whiteboard = false;
var screenshare = false;
var studentrights = "false";
var drawenabled = true;

var bluredVideo = false;

var usercache = {};
var role = "teacher";
var lessonID = "";
var lessonData = {};

var tc;
var localTracks;
var remoteTrack = [];

var dataTrack = new Twilio.Video.LocalDataTrack;
var dataTrackPublished = {};

var tryconnection = false;
var timerInterval;

var screenstream;
var screenTrack;

var initscreenshare = false;
var endscreenshare = false;

var chatHistory = {};

var intendedDiscon = false;
var reconectionInterval;

var chatHistory = "";

var whiteboard_canvas;

$(".local-media-container").hide();

var videoElement = $("#preview-media>video");
var canvas = document.getElementById('preview-canvas');


function setUpLocalTracks() {
    Twilio.Video.createLocalTracks({
        audio: true,
        video: {
            width: 1280,
            height: 720,
            frameRate: 24
        }
    }).then(tracks => {
        $.each(tracks, function(index, item) {
            if (item.kind == "video") {
                item.on("started", function() {
                    $('.local-media-container').css("height", $('#local-media>video').height() + "px");
                });

                return false;
            }
        });

        tracks[2] = dataTrack;
        localTracks = tracks;
        $("#local-media").append(tracks[1].attach());
        $("#preview-media").append(tracks[1].attach());


        if (bluredVideo) {
            $("#preview-media>video").hide();
            canvas.hidden = false;
        }


        $("#local-media>video").on("canplay", function() {
            $('.local-media-container').css("height", $('#local-media>video').height() + "px");
            $(".local-media-container").show();
            //loadBodyPix();
        });


        $("#preview-media>video").on("playing", function() {
            canvas.height = $("#preview-media>video").height();
            canvas.width = $("#preview-media>video").width();
            $("#preview-media>video")[0].width = $("#preview-media>video").width();
            $("#preview-media>video")[0].height = $("#preview-media>video").height();
        });

        $("#login-controls").css("display", "unset");
    }).catch(function(error) {
        console.log(error);
        $("#login-controls").css("display", "unset");
    });
}
setUpLocalTracks();
loadLesson();



function loadBodyPix() {
    options = {
        multiplier: 0.75,
        stride: 32,
        quantBytes: 4
    }
    bodyPix.load(options)
        .then(net => perform(net))
        .catch(err => console.log(err))
}

async function perform(net) {
    while (bluredVideo) {
        const segmentation = await net.segmentPerson($('#preview-media>video')[0]);

        const backgroundBlurAmount = 5;
        const edgeBlurAmount = 4;
        const flipHorizontal = false;

        bodyPix.drawBokehEffect(canvas, $("#preview-media>video")[0], segmentation, backgroundBlurAmount, edgeBlurAmount, flipHorizontal);
    }
}



function connectToVideoChat() {
    var tmpHistory = localStorage.getItem('brainstr-chathis-' + lessonData._id);
    if (tmpHistory != "" && tmpHistory != undefined && tmpHistory != null) {
        chatHistory = tmpHistory;
        $("#chat-container").html(chatHistory);
    }


    Twilio.Video.connect(token, {
        name: lessonData.tid,
        audio: true,
        video: {
            width: 1280,
            height: 720,
            frameRate: 24
        },
        tracks: localTracks
    }).then(room => {
        chatroom = room;

        clearTimeout(reconectionInterval);
        setStatus("connected");

        $("#preview-media").append(localTracks[1].detach());
        $("#preview-media").html("");

        switchToLocalVideo();

        $('.local-media-container').css("height", $('#local-media>video').height() + "px");

        $("#content-upcominglesson").css("display", "none");
        $("#content-video").css("display", "block");
        $(".video-controls").css("display", "block");
        $("#lessonDetails").css("display", "block");

        //$(".video-topbar").fadeIn("fast");

        addChatMessage(`<div class="message-time-sign"><span>${$.i18n('_bstr.classroom.entered')}</span></div>`);


        room.participants.forEach(async participant => {
            participant.on('trackSubscribed', track => {
                manageSubscribedTracks(track);
            });

            if (participant.identity in usercache) {
                addChatMessage(`<div class="message-time-sign"><span><strong>` + usercache[participant.identity].firstname + ` ` + usercache[participant.identity].lastname + `</strong> ${$.i18n('_bstr.classroom.alreadyin')}</span></div>`);
            } else {
                var userCData = await r('getTeacher', { id: participant.identity });
                usercache[participant.identity] = userCData;
                addChatMessage(`<div class="message-time-sign"><span><strong>` + userCData.firstname + ` ` + userCData.lastname + `</strong> ${$.i18n('_bstr.classroom.alreadyin')}</span></div>`);
            }
        });

        if (room.participants.size == 0) {
            if (role == "student") {
                addChatMessage(`<div class="message-time-sign"><span>${$.i18n('_bstr.classroom.waitteacher')}</span></div>`);
            } else {
                addChatMessage(`<div class="message-time-sign"><span>${$.i18n('_bstr.classroom.waitstudent')}</span></div>`);
            }
        }

        room.on('participantDisconnected', async participant => {
            if (participant.identity in usercache) {
                addChatMessage(`<div class="message-time-sign"><span><strong>` + usercache[participant.identity].firstname + ` ` + usercache[participant.identity].lastname + `</strong> ${$.i18n('_bstr.classroom.left')}</span></div>`);
            } else {
                var userCData = await r('getTeacher', { id: participant.identity });
                usercache[participant.identity] = userCData;
                addChatMessage(`<div class="message-time-sign"><span><strong>` + userCData.firstname + ` ` + userCData.lastname + `</strong> ${$.i18n('_bstr.classroom.left')}</span></div>`);
            }

            removeRemoteMedia();
        });


        room.on('participantConnected', async participant => {
            participant.tracks.forEach(publication => {
                if (publication.isSubscribed) {
                    const track = publication.track;
                    $("#remote-media").append(track.attach());
                }
            });


            participant.on('trackSubscribed', track => {
                manageSubscribedTracks(track);
            });

            switchToLocalVideo();

            if (role == "student") {
                $("#content-video").css("display", "block");
                $("#content-whiteboard").css("display", "none");
                $("#content-screensharing").css("display", "none");
            }

            if (participant.identity in usercache) {
                addChatMessage(`<div class="message-time-sign"><span><strong>` + usercache[participant.identity].firstname + ` ` + usercache[participant.identity].lastname + `</strong> ${$.i18n('_bstr.classroom.joined')}</span></div>`);
            } else {
                var userCData = await r('getTeacher', { id: participant.identity });
                usercache[participant.identity] = userCData;
                addChatMessage(`<div class="message-time-sign"><span><strong>` + userCData.firstname + ` ` + userCData.lastname + `</strong> ${$.i18n('_bstr.classroom.joined')}</span></div>`);
            }


            if (role == "teacher") {
                if (whiteboard) {
                    setTimeout(function() {
                        sendMessage('{"type": "command", "cmd": "whiteboard_open" }');
                        sendWhiteboard();
                    }, 1500);
                } else if (screenshare) {
                    sendMessage('{"type": "command", "cmd": "screensharing_started", "value": "' + screenTrack.id + '" }');
                } else {
                    closeWhiteboard();

                    $("#screensharing").html("");
                    $("#content-video").css("display", "block");
                    $("#content-whiteboard").css("display", "none");
                    $("#content-screensharing").css("display", "none");
                    switchToLocalVideo();
                }
            }
        });




        room.on('disconnected', (room, error) => {
            setStatus("disconnected");
            removeRemoteMedia();

            if (!intendedDiscon) {
                setStatus("reconnecting");
                reconectionInterval = setTimeout(connectToVideoChat, 3000);
            }
        });



        room.on('reconnecting', error => {
            if (error.code === 53001) {
                console.log('Reconnecting your signaling connection!', error.message);
            } else if (error.code === 53405) {
                console.log('Reconnecting your media connection!', error.message);
            }
            /* Update the application UI here */
            setStatus("reconnecting");
        });

        room.on('reconnected', () => {
            setStatus("connected");
            console.log('Reconnected your signaling and media connections!');
            /* Update the application UI here */
        });


        room.on('participantReconnecting', remoteParticipant => {
            console.log(`${remoteParticipant.identity} is reconnecting the signaling connection to the Room!`);
            setStatus("partner_disconnected");
        });

        room.on('participantReconnected', remoteParticipant => {
            console.log(`${remoteParticipant.identity} has reconnected the signaling connection to the Room!`);
            setStatus("connected");
        });



        $("#login").hide();
        $("#classroom").show();

        $("#chat-container").scrollTop($('#chat-container')[0].scrollHeight);

    }, error => {
        console.log(error);
        reconectionInterval = setTimeout(connectToVideoChat, 3000);
    });

}


function manageSubscribedTracks(track) {
    if (track.kind === 'data') {
        //handle data stream messages
        track.on('message', data => {
            var content = JSON.parse(data);

            if (content.type == "msg") {
                addChatMessage(`<div class="message-bubble">
                                <div class="message-bubble-inner">
                                  <div class="message-text">
                                    <p>` + createTextLinks_(content.msg) + `</p>
                                  </div>
                                </div>
                                <div class="clearfix"></div>
                              </div>`);

                $("#chat-container").scrollTop($('#chat-container')[0].scrollHeight);
            }

            if (content.type == "whiteboard_data") {
                console.log("RX", content);

                if (content.id != uData._id) {

                    if (role == "teacher" && studentrights == "false") {
                        return;
                    }

                    setWhiteboardData(content);
                }
            }

            if (content.type == "command") {
                switch (content.cmd) {
                    case "whiteboard_student":
                        studentrights = content.value;
                        if (role == "student") {
                            if (studentrights == "true") {
                                $("#c-whiteboard-protection").hide();
                                $("#c-whiteboard-controls").show();

                                addChatMessage(`<div class="message-time-sign"><span>${$.i18n('_bstr.classroom.whiteboard.access.granted')}</span></div>`);
                                $("#video-control-whiteboard-unlock").css("display", "none");
                            } else {
                                $("#c-whiteboard-protection").show();
                                $("#c-whiteboard-controls").hide();

                                addChatMessage(`<div class="message-time-sign"><span>${$.i18n('_bstr.classroom.whiteboard.access.removed')}</span></div>`);

                                whiteboard_canvas.isDrawingMode = false;
                                $("#video-control-whiteboard-drawing").removeClass("active");
                                $("#whiteboard-controls-drawing").attr("style", "display: none !important;");
                            }
                        }
                        break;
                    case "whiteboard_erase":
                        if (role == "teacher" && !studentrights) {
                            return;
                        };
                        eraseWhiteboard();
                        break;
                    case "whiteboard_open":
                        if (role == "student") {
                            openWhiteboard();
                        };
                        break;
                    case "whiteboard_close":
                        if (role == "student") {
                            closeWhiteboard();
                        };
                        break;
                    case "screensharing_started":
                        initscreenshare = true;
                        switchToRemoteVideo();
                        break;
                    case "screensharing_stopped":
                        $("#screensharing").html("");
                        $("#content-video").css("display", "block");
                        $("#content-whiteboard").css("display", "none");
                        $("#content-screensharing").css("display", "none");
                        switchToLocalVideo();
                        break;
                }
            }

        });
    } else if (track.kind == "video" && initscreenshare) {
        initscreenshare = false;
        $("#content-video").css("display", "none");
        $("#content-whiteboard").css("display", "none");
        $("#content-screensharing").css("display", "block");
        $("#screensharing").append(track.attach());
    } else {
        remoteTrack.push(track);
        switchToLocalVideo();
    }
}


function sendMessage(message) {
    dataTrack.send(message);
}

function removeRemoteMedia() {
    remoteTrack = [];
    $('#remote-media').html("");
}

function mute() {
    var videoTracks = localTracks.filter(function(i) { return i.kind == "audio"; });
    $.each(videoTracks, function(i, track) {
        track.disable();
    })

    $("#video-control-microphone").addClass("active");
}

function unmute() {
    var videoTracks = localTracks.filter(function(i) { return i.kind == "audio"; });
    $.each(videoTracks, function(i, track) {
        track.enable();
    });

    $("#video-control-microphone").removeClass("active");
}

function toggleAudio() {
    var audioTracks = localTracks.filter(function(i) { return i.kind == "audio"; });
    if (audioTracks[0].isEnabled == false) {
        unmute();
    } else {
        mute();
    }
}

function disableVideo() {
    var videoTracks = localTracks.filter(function(i) { return i.kind == "video"; });
    $.each(videoTracks, function(i, track) {
        track.disable();
    });

    $("#video-control-video").addClass("active");
}

function enableVideo() {
    var videoTracks = localTracks.filter(function(i) { return i.kind == "video"; });
    $.each(videoTracks, function(i, track) {
        track.enable();
    });

    $("#video-control-video").removeClass("active");

    //chatroom.localParticipant.videoTracks.forEach((publication) => {
    //    publication.track.enable();
    //});
}

function toggleVideo() {
    var videoTracks = localTracks.filter(function(i) { return i.kind == "video"; });
    if (videoTracks[0].isEnabled == false) {
        enableVideo();
    } else {
        disableVideo();
    }
}


$("#video-control-video").on("click", function() {
    toggleVideo();
});

$("#video-control-microphone").on("click", function() {
    toggleAudio();
});

function disconnectFromVideoChat() {
    $("#classroom-container").fadeOut();
    chatroom.disconnect();
    chatroom = null;
    window.location.href = "/lessons";
}

$("#button-leave").on("click", function() {
    disconnectFromVideoChat();
});

$("#chat-submit").on("click", function() {
    var chatmsg = $("#chat-msg").val();
    if (chatmsg == "") {
        return;
    }

    addChatMessage(`<div class="message-bubble me">
                                <div class="message-bubble-inner">
                                  <div class="message-text">
                                    <p>` + createTextLinks_($("#chat-msg").val()) + `</p>
                                  </div>
                                </div>
                                <div class="clearfix"></div>
                              </div>`);

    sendMessage('{"type": "msg", "msg": ' + JSON.stringify(chatmsg) + '}');
    $("#chat-msg").val("");

    $("#chat-container").scrollTop($('#chat-container')[0].scrollHeight);
});

$("#chat-msg").keypress(function(e) {
    if (e.which == 13) {
        $('#chat-submit').click();
        return false;
    }
});


$('#video-control-fullscreen').on('click', function() {
    if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    ) {
        $("#video-control-fullscreen>i").addClass("icon-feather-maximize-2");
        $("#video-control-fullscreen>i").removeClass("icon-feather-minimize-2");
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    } else {
        $("#video-control-fullscreen>i").removeClass("icon-feather-maximize-2");
        $("#video-control-fullscreen>i").addClass("icon-feather-minimize-2");
        element = $('.classroom-row').get(0);
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
});

function adjustLocalMediaPosition() {
    var wCC = $("#local-media").width();
    var wIC = $("#local-media>video").width();
    var px = 0;

    $("#local-media-status").width(wIC);
    $("#local-media-status").css("display", "block");

    if (wIC > wCC) {
        px = wIC / 2 - wCC / 2;
    } else {
        px = (wCC / 2 - wIC / 2) * -1;
    }
    $("#local-media-status").css("left", "-" + px + "px");
    $("#local-media>video").css("left", "-" + px + "px");
}

$("#video-control-chat").on("click", function() {
    toggleChat();
});

function toggleChat() {
    if (chat == true) {
        $(".col-left").css("width", "100%");
    } else {
        $(".col-left").css("width", "70%");
    }

    chat = !chat;
}

$(document).ready(function() {
    tippy('[data-tippy-placement]', {
        delay: 100,
        arrow: true,
        arrowType: 'sharp',
        size: 'regular',
        duration: 200,
        animation: 'shift-away',
        animateFill: true,
        theme: 'dark',
        distance: 10,
    });
});

function switchToRemoteVideo() {
    localTracks.forEach((track) => {
        if (track.kind != "data") {
            $("#local-media").remove(track.detach());
        }
    });


    if (remoteTrack != undefined) {
        remoteTrack.forEach((track) => {
            if (track.kind != "data") {
                $("#remote-media").remove(track.detach());
            }
        });
    }

    $("#remote-media").html("");
    $("#local-media").html("");


    if (remoteTrack != undefined) {
        remoteTrack.forEach((track) => {
            if (track.kind != "data") {
                $("#local-media").append(track.attach());
            }
        });
    }
}

function switchToLocalVideo() {
    localTracks.forEach((track) => {
        if (track.kind != "data") {
            $("#local-media").remove(track.detach());
        }
    });


    if (remoteTrack != undefined) {
        remoteTrack.forEach((track) => {
            if (track.kind != "data") {
                $("#remote-media").remove(track.detach());
            }
        });
    }

    $("#remote-media").html("");
    $("#local-media").html("");

    localTracks.forEach((track) => {
        if (track.kind != "data") {
            $("#local-media").append(track.attach());
        }
    });

    if (remoteTrack != undefined) {
        remoteTrack.forEach((track) => {
            if (track.kind != "data") {
                $("#remote-media").append(track.attach());
            }
        });
    }
}







$("#video-control-screensharing").on("click", function() {
    $("#video-control-whiteboard").removeClass("active");
    toggleScreenshare();
});

async function toggleScreenshare() {
    screenshare = !screenshare;

    if (screenshare) {
        screenmedia = await navigator.mediaDevices.getDisplayMedia();
        screenTrack = new Twilio.Video.LocalVideoTrack(screenmedia.getTracks()[0]);

        chatroom.localParticipant.publishTrack(screenTrack);

        $("#content-video").css("display", "none");
        $("#content-whiteboard").css("display", "none");
        $("#content-screensharing").css("display", "block");

        $("#screensharing").append(screenTrack.attach());

        $("#video-control-screensharing").addClass("active");
        $("#video-control-screensharing").attr("title", "Stop screen sharing");

        sendMessage('{"type": "command", "cmd": "screensharing_started", "value": "' + screenTrack.id + '" }');
        switchToRemoteVideo();
    } else {
        sendMessage('{"type": "command", "cmd": "screensharing_stopped", "value": "' + screenTrack.id + '" }');

        chatroom.localParticipant.unpublishTrack(screenTrack);
        $("#screensharing").remove(screenTrack.detach());
        $("#screensharing").html("");
        screenTrack.stop();
        chatroom.localParticipant._removeTrack(screenTrack);

        $("#content-video").css("display", "block");
        $("#content-whiteboard").css("display", "none");
        $("#content-screensharing").css("display", "none");

        $("#video-control-screensharing").removeClass("active");
        $("#video-control-screensharing").attr("title", "Share screen");
        switchToLocalVideo();
    }
}





async function loadLesson() {
    if (lid == undefined || lid == "") {
        windows.location.href = "/lessons";
        return;
    }

    lessonData = await r('getLesson', { lid: lid });

    var startdate = moment.utc(lessonData.starttime);
    var enddate = moment.utc(lessonData.endtime);
    $("#cls-upcoming-date").html(startdate.utcOffset(UTCOffset).format("LT") + " - " + enddate.utcOffset(UTCOffset).format("LT") + "<br/>" + startdate.utcOffset(UTCOffset).format("LL"));

    $("#cls-upcoming-duration").text(lessonData.duration + " " + $.i18n('_bstr.general.minutes'));
    $("#cls-upcoming-subject").text(subjectData[lessonData.subject]);



    if (lessonData.sid == uData._id) {
        role = "student";
        otherid = lessonData.tid;

        $("#c-whiteboard-protection").show();
    } else {
        role = "teacher";
        otherid = lessonData.sid;

        $("#c-whiteboard-controls").show();
        $("#c-whiteboard-protection").hide();
    }



    var otherDat = await r('getTeacher', { id: otherid });
    $("#cls-upcoming-teachername").text(otherDat.firstname + " " + otherDat.lastname);

    if (role == "student") {
        $("#cls-upcoming-teacherlink-2").attr('href', "/teacher/" + lessonData.tid);
        $("#cls-upcoming-teacherlink-2").html($.i18n('_bstr.classroom.viewProfile', otherDat.firstname) + ' <i class="icon-line-awesome-long-arrow-right"></i>');
    }

    $("#cls-upcoming-image").attr("src", "/profilepicture/" + otherDat._id);
    $("#teacher-profile-image").css("background-image", "url('" + "/profilepicture/" + otherDat._id + "')");

    $("#content-upcominglesson").css("display", "block");

    timer();
    timerInterval = setInterval(timer, 10000);
}


async function joinLesson() {
    var data;

    try {
        data = await r('joinLesson', { lid: lid });
    } catch (error) {
        window.location.href = "/lessons";
    }


    if (data.status == "unauthorized") {
        window.location.href = "/lessons";
        return;
    }

    lessonData = data.lesson;


    if (data.status == "active_lesson") {
        if (lessonData.sid == uData._id) {
            $("#teacher-profile-role").text($.i18n('_bstr.general.teacher'));
            role = "student";
            otherid = lessonData.tid;
            $("#video-control-screensharing").css("display", "none");
            $("#video-control-whiteboard").css("display", "none");
            $("#c-whiteboard-controls").hide();
        } else {
            $("#teacher-profile-role").text($.i18n('_bstr.general.student'));
            role = "teacher";
            otherid = lessonData.sid;
            $("#c-whiteboard-controls").show();
        }


        var startdate = moment.utc(lessonData.starttime);
        var enddate = moment.utc(lessonData.endtime);
        $("#ldi-details-date").html(startdate.utcOffset(UTCOffset).format("LT") + " " + startdate.utcOffset(UTCOffset).format("LL"));
        $("#ldi-details-duration").text(lessonData.duration + " " + $.i18n('_bstr.general.minutes'));
        $("#ldi-details-subject").text(subjectData[lessonData.subject]);


        var otherDat = await r('getTeacher', { id: otherid });
        $("#ldi-details-teacher").html(`<a id="back-btn" class="button gray" onclick="disconnectFromVideoChat();">${$.i18n('_bstr.classroom.leave')}</a> ` +
            lessonData.duration + ` ${$.i18n('_bstr.general.minutes')} ` + subjectData[lessonData.subject] + ` ${$.i18n('_bstr.classroom.with')} ` + otherDat.firstname + " " + otherDat.lastname);

        $("#teacher-profile-name").text(otherDat.firstname + " " + otherDat.lastname);

        token = data.token;
        connectToVideoChat();
        return;
    }
}

function timer() {
    var now = moment();
    var now_unix = moment().unix();
    var start = moment.utc(lessonData.starttime);
    var ctd = moment.duration(start.diff(now));


    // lesson is over!
    if (now_unix > (moment.utc(lessonData.endtime).unix() + 300)) {
        $("#timerbox").removeClass("available");
        $("#cls-upcoming-countdown").removeClass("button-primary");
        $("#cls-upcoming-countdown").addClass("gray");
        $("#cls-upcoming-countdown").text($.i18n('_bstr.classroom.completed'));
        return;
    }

    ctd.subtract(5, "minutes");


    var str_days = ctd.days() + " " + $.i18n('_bstr.general.days') + " ";
    if (ctd.days() == 1) {
        var str_days = ctd.days() + " " + $.i18n('_bstr.general.day') + " ";
    } else if (ctd.days() == 0) {
        var str_days = "";
    }

    var str_hours = ctd.hours() + " " + $.i18n('_bstr.general.hours') + " ";
    if (ctd.hours() == 1) {
        var str_hours = ctd.hours() + " " + $.i18n('_bstr.general.hour') + " ";
    } else if (ctd.hours() == 0) {
        var str_hours = "";
    }

    var str_mins = (ctd.minutes() + 1) + " " + $.i18n('_bstr.general.minutes') + " ";
    if ((ctd.minutes() + 1) == 1) {
        var str_mins = (ctd.minutes() + 1) + " " + $.i18n('_bstr.general.minute') + " ";
    } else if ((ctd.minutes() + 1) == 0) {
        var str_mins = "";
    } else if ((ctd.minutes() + 1) == 60) {
        var str_mins = "";
    }

    if (now_unix > (moment.utc(lessonData.starttime).unix() - 300)) {
        tryconnection = true;
        clearInterval(timerInterval);
        $("#timerbox").addClass("available");
        $("#cls-upcoming-countdown").addClass("button-primary");
        $("#cls-upcoming-countdown").removeClass("gray");
        $("#cls-upcoming-countdown").text($.i18n('_bstr.classroom.connect'));
    } else {
        $("#timerbox").removeClass("available");
        $("#cls-upcoming-countdown").removeClass("button-primary");
        $("#cls-upcoming-countdown").addClass("gray");
        $("#cls-upcoming-countdown").html("You can connect to the classroom in <br> " + str_days + str_hours + str_mins);
    }

}

function openTeacherProfile() {
    if (role == "teacher") {
        return;
    }
    var win = window.open("/teacher/" + lessonData.tid, '_blank');
    win.focus();
}

function connect() {
    if (tryconnection) {
        joinLesson();
    }
}

function openTeachers() {
    window.location.href = "/tutors/";
}

function createTextLinks_(text) {
    return (text || "").replace(
        /([^\S]|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
        function(match, space, url) {
            var hyperlink = url;
            if (!hyperlink.match('^https?:\/\/')) {
                hyperlink = 'http://' + hyperlink;
            }
            return space + '<a href="' + hyperlink + '" target="_blank">' + url + '</a>';
        }
    );
};

window.addEventListener('beforeunload', () => {
    chatroom.disconnect();
});

function setStatus(status) {
    $("#status-indicator").removeClass("status-connected");
    $("#status-indicator").removeClass("status-disconnected");

    switch (status) {
        case "connected":
            $("#status-indicator").addClass("status-connected");
            $("#status-indicator").text($.i18n('_bstr.classroom.connected'));
            break;
        case "disconnected":
            $("#status-indicator").addClass("status-disconnected");
            $("#status-indicator").text($.i18n('_bstr.classroom.disconnected'));
            break;
        case "connecting":
            $("#status-indicator").addClass("status-disconnected");
            $("#status-indicator").text($.i18n('_bstr.classroom.connecting'));
            break;
        case "reconnecting":
            $("#status-indicator").addClass("status-disconnected");
            $("#status-indicator").text($.i18n('_bstr.classroom.attemptingreconnect'));
            break;
        case "partner_disconnected":
            $("#status-indicator").addClass("status-disconnected");
            $("#status-indicator").text($.i18n('_bstr.classroom.partnerdisconnect'));
            break;
    }
}

function addChatMessage(msg) {
    if (msg == undefined || msg == null) {
        return;
    }

    $("#chat-container").append(msg);
    var old = localStorage.getItem('brainstr-chathis-' + lessonData._id);

    if (old == null || old == undefined) {
        old = "";
    }

    localStorage.setItem('brainstr-chathis-' + lessonData._id, old + msg);
    $("#chat-container").scrollTop($('#chat-container')[0].scrollHeight);
}
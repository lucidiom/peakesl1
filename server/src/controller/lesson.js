$("#ldi-id").html($.i18n("_bstr.lesson.id") + ": <strong>" + lesson._id + "</strong>");

var metype = "";

loadLesson();

async function loadLesson() {
    var startdate = moment.utc(lesson.starttime);
    var enddate = moment.utc(lesson.endtime);
    var subjectLoc = subjectData[lesson.subject];

    var price = await i18n_cc(lesson.price);

    $("#ldi-details-date").html(startdate.utc().utcOffset(UTCOffset).format("LT") + " - " + enddate.utc().utcOffset(UTCOffset).format("LT") + "<br/>" + startdate.utc().utcOffset(UTCOffset).format("LL"));
    $("#ldi-details-subject").text(subjectLoc);
    $("#ldi-details-duration").text(lesson.duration + " " + $.i18n("_bstr.general.minutes"));
    $("#ldi-details-points").html(price + ' <small class="subprice" data-currency-converted="' + lesson.price + '"></small>');
    $("#ldi-details-status").text(requestStatusData[lesson.status]);

    var sp = "";
    if (uData._id == lesson.tid) {
        otheruid = lesson.sid;
        metype = "teacher";
        $("#ldi-otherlink").attr("href", "#")

        if(otherdata.socialStudent == true){
            sp = `<br/><div class="verified-badge-with-title badge-socialteacher" style="display: inline-block;background: #3061ab;margin-top: 7px;">${$.i18n('_bstr.general.socialprogram')}</div>`;
        }
    } else {
        otheruid = lesson.tid;
        metype = "student";
        $("#ldi-otherlink").attr("href", "/teacher/" + otheruid);

        if(otherdata.socialTeacher == true){
            sp = `<br/><div class="verified-badge-with-title badge-socialteacher" style="display: inline-block;background: #3061ab;margin-top: 7px;">${$.i18n('_bstr.general.socialprogram')}</div>`;
        }
    }


    $("#ldi-othername").html(otherdata.firstname + " " + otherdata.lastname + sp);
    $('#ldi-otherimage').attr("src", "/profilepicture/" + otherdata._id);
    loadTimeline();

    i18n_updatePrices();
}




function loadTimeline() {
    var historyLength = Object.keys(lesson.history).length;
    var c = 1;
    $.each(lesson.history, function(index, value) {
        if (c == 1) {
            addTimelineItem(value, true);
        } else if (c == lesson.history.length) {
            addTimelineItem(value, false, false);
        } else {
            addTimelineItem(value);
        }
        c++;
    });
}

function addTimelineItem(data, last = false, first = true) {
    var lastCont = "";
    var text = "";
    var content = "";
    if (last) {
        lastCont = "timeline-lastitem";
    }
    var done = "";

    var time = moment.utc(data.date);


    // for init request

    switch (data.type) {
        case "requested":
            if (metype == "student") {
                text = $.i18n("_bstr.lesson.request.you", otherdata.firstname);
            } else {

                text = $.i18n("_bstr.lesson.request", otherdata.firstname);
                if (lesson.status == "requested") {
                    content = `<div class="margin-top-10">
                                        <a id="ld-action-acceptrequest" class="button button-green margin-right-10"> ${$.i18n("_bstr.general.accept")} </a>
                                        <!--<a class="button gray margin-right-10">Neuen Termin vorschlagen </a>-->
                                        <a id="ld-action-denyrequest"class="button button-red"> ${$.i18n("_bstr.general.reject")} </a>
                                    </div>`;
                }

            }

            break;


        case "reschedule_await_teacher":
            if (metype == "student") {
                text = "You requested to reschedule the lesson. Please wait for " + otherdata.firstname + " response.";
            } else {
                text = otherdata.firstname + " möchte die Unterrichtsstunde auf den XX. XXXXXXXX XXXX um XX:XX Uhr verschieben.";
                if (lesson.status == "reschedule_await_teacher") {
                    content = `<div class="margin-top-10">
                                        <a class="button button-green margin-right-10"> Accept </a>
                                        <a class="button gray margin-right-10">Neuen Termin vorschlagen </a>
                                        <a class="button button-red"> Reject </a>
                                    </div>`;
                }
            }
            break;


        case "reschedule_await_student":
            if (metype == "student") {
                text = otherdata.firstname + " möchte die Unterrichtsstunde auf den XX. XXXXXXXX XXXX um XX:XX Uhr verschieben.";
                if (lesson.status == "reschedule_await_student") {
                    content = `<div class="margin-top-10">
                                        <a class="button button-green margin-right-10"> Annehmen </a>
                                        <a class="button gray margin-right-10">Neuen Termin vorschlagen </a>
                                        <a class="button button-red"> Ablehnen </a>
                                    </div>`;
                }
            } else {
                text = "Du hast eine Anfrage zur Verschiebung der Stunde an " + otherdata.firstname + " gesendet. Bitte warte auf seine Rückmeldung.";
            }
            break;


        case "confirmed":
            if (metype == "student") {
                text = $.i18n("_bstr.lesson.confirmed", otherdata.firstname);
            } else {
                text = $.i18n("_bstr.lesson.confirmed.you", otherdata.firstname);
                if (lesson.status == "confirmed") {
                    content = `<div class="margin-top-10"><a id="ld-action-teachercancell" class="button gray margin-right-10">${$.i18n("_bstr.general.cancel")} </a></div>`;
                }
            }
            break;

        case "rejected":
            text = $.i18n("_bstr.lesson.reject");
            break;

        case "completed_await_confirmation":
            if (metype == "student") {
                text = $.i18n("_bstr.lesson.await-confirmation-student");
                if (lesson.status == "completed_await_confirmation") {
                    content = `<div class="margin-top-10"><a id="ld-action-student-confirm" class="button button-green margin-right-10">${$.i18n("_bstr.lesson.confirm-btn")}</a> <a id="ld-action-student-appeal" class="button button-red margin-right-10">${$.i18n("_bstr.lesson.dispute-btn")}</a></div>`;
                }
            } else {
                text = $.i18n("_bstr.lesson.await-confirmation");
                if (lesson.status == "completed_await_confirmation") {
                    content = `<div class="margin-top-10"><a id="ld-action-teacher-refund-student" class="button gray margin-right-10">${$.i18n("_bstr.lesson.refund-btn")}</a>`;
                }
            }
            break;

        case "completed":
            done = "done";
            text = $.i18n("_bstr.lesson.completed");
            break;

        case "cancelled_refund":
            done = "done";
            if (metype == "student") {
                text = $.i18n("_bstr.lesson.cancelled-refunded");
            } else {
                text = $.i18n("_bstr.lesson.cancelled-refunded-teacher");
            }
            break;

        case "cancelled_norefund":
            done = "done";
            if (metype == "student") {
                text = $.i18n("_bstr.lesson.cancelled-norefund");
            } else {
                text = $.i18n("_bstr.lesson.cancelled-norefund-teacher");
            }
            break;

        case "appeal_student":
            if (metype == "student") {
                text = $.i18n("_bstr.lesson.dispute-student");
            } else {
                text = $.i18n("_bstr.lesson.dispute-teacher", otherdata.firstname);
            }
            break;

        case "appeal_teacher":
            if (metype == "student") {
                text = $.i18n("_bstr.lesson.dispute-teacher", otherdata.firstname);
            } else {
                text = $.i18n("_bstr.lesson.dispute-student");
            }
            break;
    }


    if (first) {
        done = "done";
    }


    $("#ldi-timeline").prepend(`<div class="timeline-item">
                                <div class="timeline-item-leftbar">
                                    <div class="timeline-dot ${done}"></div>
                                </div>
                                <div class="timeline-item-content ` + lastCont + `">
                                    <p>` + text + `</p>
                                    <span>` + time.utc().utcOffset(UTCOffset).format("lll") + `</span>
                                    ` + content + `
                                </div>
                            </div>`);



    $("#ld-action-acceptrequest").on("click", function() {
        sendServerRequest("teacher-accept-request");
    });
    $("#ld-action-denyrequest").on("click", function() {
        sendServerRequest("teacher-deny-request");
    });
    $("#ld-action-teachercancell").on("click", function() {
        sendServerRequest("teacher-cancell-confirmed");
    });
    $("#ld-action-student-confirm").on("click", function() {
        sendServerRequest("student-confirm");
    });
    $("#ld-action-teacher-refund-student").on("click", function() {
        sendServerRequest("teacher-refund-student");
    });
    $("#ld-action-student-appeal").on("click", function() {
        sendServerRequest("student-appeal");
    });
}



async function sendServerRequest(action) {
    try {
        var data = await r('updateLesson', {
            action: action,
            lid: lesson._id,
            data: data
        });

        location.reload();
    } catch (error) {
        alert("There has been an error. Sorry!.");
        console.log(error);
    }
}
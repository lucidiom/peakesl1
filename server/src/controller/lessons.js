var teacherLessons = 0;
var studentLessons = 0;


lessons.forEach(async function(item) {
    var otherId = item.sid == uData._id ? item.tid : item.sid;
    var type = item.sid == uData._id ? "sid" : "tid";

    if (type == "sid") {
        studentLessons++;
    } else {
        teacherLessons++;
    }

    addLessonToDOM(type, item, usercache[otherId]);
});

if (teacherLessons == 0) {
    $("#li-container-tid").css("display", "none");
    showNotification($.i18n("_bstr.lessons.nolessons-teacher") + ' <br><a href="/settings-teacher/">' + $.i18n("_bstr.lessons.nolessons-teacher-link") + '</a>', "notice", "tnot");
}
if (studentLessons == 0) {
    $("#li-container-sid").css("display", "none");
    showNotification($.i18n("_bstr.lessons.nolessons-student") + ' <br><a href="/tutors/">' + $.i18n("_bstr.lessons.nolessons-student-link") + '</a>', "notice", "snot");
}




async function addLessonToDOM(prefix, data, userData) {
    var now = moment().unix();
    var startdate = moment.utc(data.starttime);
    var enddate = moment.utc(data.endtime);

    var join = "";
    var confirm = "";

    if (now > (enddate.unix() - 300) && data.status == "confirmed" && data.sid == uData._id) {
        confirm = `&nbsp; &nbsp;<a class="button button-red" href="javascript:void(0)" onclick="openDispute('${data._id}')">${$.i18n("_bstr.lesson.dispute-btn")}</a>
                    &nbsp;
                    <a class="button button-green" href="javascript:void(0)" onclick="openConfirmation('${data._id}');">${$.i18n("_bstr.lesson.confirm-btn-short")}</a>`;
    }
    if ((now > (startdate.unix() - 300) && now < (enddate.unix() + 300)) && data.status == "confirmed") {
        join = `&nbsp; &nbsp;<a class="button button-primary" href="/classroom/${data._id}" target="_blank">${$.i18n("_bstr.lesson.joinclassroom-btn")}</a>`;
    }

    var action = "";
    var badge = "";

    if (prefix == "tid") {
        if (data.status == "requested" || data.status == "reschedule_await_teacher") {
            action = `<a href="/lesson/` + data._id + `" class="button button-red ripple-effect margin-right-10">${$.i18n("_bstr.lessons.actionrequired")}</a>`;
            badge = '<div class="attention-badge"></div>';
        }
    }
    if (prefix == "sid") {
        if (data.status == "completion_await_confirmation" || data.status == "reschedule_await_student") {
            action = `<a href="/lesson/` + data._id + `" class="button button-red ripple-effect margin-right-10">${$.i18n("_bstr.lessons.actionrequired")}</a>`;
            badge = '<div class="attention-badge"></div>';
        }
    }

    var subjectLoc = subjectData[data.subject];

    var text = `<li data-date="${startdate.utcOffset(UTCOffset).format("LL")}" data-status="${data.status}">
                                            <div class="freelancer-overview manage-candidates">
                                                <div class="freelancer-overview-inner">

                                                    <div class="freelancer-avatar">
                                                        <a href="/lesson/` + data._id + `"><img src="/profilepicture/` + userData._id + `" alt="">` + badge + `</a>
                                                    </div>

                                                    <div class="freelancer-name">
                                                        <a href="/lesson/` + data._id + `"><h4>` + userData.firstname + ` ` + userData.lastname + `</h4></a>

                                                        <span class="freelancer-detail-item margin-right-20">
                                                            <strong>${requestStatusData[data.status]}</strong>
                                                        </span>

                                                        <span class="freelancer-detail-item margin-right-20">
                                                            <i class="icon-feather-calendar"></i>
                                                            ${startdate.utcOffset(UTCOffset).format("lll") + " - " + enddate.utcOffset(UTCOffset).format("LT")}
                                                        </span>

                                                        <span class="freelancer-detail-item margin-right-20">
                                                            <i class="icon-material-outline-school"></i>
                                                            ` + subjectLoc + `
                                                        </span>

                                                        <div class="freelancer-rating">
                                                            ` + action + `
                                                            <a href="/lesson/` + data._id + `" class="button gray">${$.i18n("_bstr.lessons.showdetails")}</a>
                                                            ${join}${confirm}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>`;

    if (action != "" || join != "" || confirm != "") {
        $("#li-container-list-" + prefix).prepend(text);
    } else {
        $("#li-container-list-" + prefix).append(text);
    }
}

async function confirmLesson() {
    var lid = $("#confirm-lesson-id").val();

    var rating = $("#confirm-lesson-rating").val();
    var rating_text = $("#confirm-review-text").val();

    try {
        await r('updateLesson', {
            action: "student-confirm",
            lid: lid,
            rating: rating,
            rating_text: rating_text
        });
        location.reload();
    } catch (error) {
        alert("There has been an error. Sorry!.");
        console.log(error);
    }
}

function openDispute(id) {
    $("#dispute-id").val(id);
    $("#dispute-modal-link").click();
}

async function sendDispute() {
    try {
        await r('updateLesson', {
            action: "dispute-student",
            lid: $("#dispute-id").val(),
            text: $("#dispute-text").val()
        });
        location.reload();
    } catch (error) {
        alert("There has been an error. Sorry!.");
        console.log(error);
    }
}

function openConfirmation(id) {
    $("#confirm-btn").prop("disabled", true);
    $("#confirm-review-text").fadeOut("fast");

    $('.starrr').starrr();

    $("#confirm-lesson-id").val(id);
    $("#confirm-modal-link").click();
}

$('.starrr').on('starrr:change', function(e, value) {
    $("#confirm-lesson-rating").val(value);
    $("#confirm-review-text").fadeIn("fast");
    $("#confirm-btn").prop("disabled", false);
})
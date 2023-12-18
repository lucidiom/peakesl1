var teacherData = uData;
var timeframes = [30, 45, 60, 90, 120];
var activeSubjects = {};
$("#timetable-info").text($.i18n("_bstr.settingsTeacher.tzadjust", mToHHMM(UTCOffset)));


// Filling Location and Language with Data
var countrySelect = '<select class="selectpicker" id="ts-country-picker" title="' + $.i18n("_bstr.settingsTeacher.selectCountry") + '" data-dropup-auto="false" data-size="10" data-live-search="true">';
$.each(countryData, function (index, item) {
    countrySelect += '<option value="' + index + '">' + item + '</option>';
});
countrySelect += '</select>';
$("#ts-country-picker-container").html(countrySelect);


var subjectSelect = '<select class="selectpicker" id="ts-subject-list-picker" title="' + $.i18n("_bstr.settingsTeacher.selectSubject") + '" data-dropup-auto="false" data-size="4" data-live-search="true">';
$.each(subjectData, function (index, item) {
    subjectSelect += '<option value="' + index + '">' + item + '</option>';
});
subjectSelect += '</select>';
$("#ts-subject-list-picker-container").html(subjectSelect);
$("#ts-subject-list-picker").selectpicker();


var languageSelectOptions = ''
$.each(languageData, function (index, item) {
    languageSelectOptions += '<option value="' + index + '">' + item + '</option>';
});

var lsel = '<select class="selectpicker" id="dialog-addlanguage-lang" title="' + $.i18n("_bstr.settingsTeacher.selectLanguage") + '"data-dropup-auto="false" data-size="4" data-live-search="true">';
lsel += languageSelectOptions + "</select>";
$("#dialog-addlanguage-languagecontainer").html(lsel);

var languageLevelSelectOptions = '<select class="selectpicker" id="dialog-addlanguage-level" title="" data-dropup-auto="false" data-live-search="false" data-size="3">';
$.each(languageLevel, function (index, item) {
    languageLevelSelectOptions += '<option value="' + index + '">' + item + ' (' + languageCERF[index] + ')</option>';
});
languageLevelSelectOptions += "</select>"
$("#dialog-addlanguage-levelcontainer").html(languageLevelSelectOptions);
$("#dialog-addlanguage-level").selectpicker();



$("#edittimetable-sliderstart").slider({
    min: 0,
    max: 96,
    step: 1,
    range: true,
    value: [32, 68],
    formatter: function (value) {
        var decimalTimeString = value[0] * 15;
        var n = new Date(0, 0);
        n.setSeconds(+decimalTimeString * 60);
        timestart = n.toTimeString().slice(0, 5);

        var decimalTimeString = value[1] * 15;
        var n = new Date(0, 0);
        n.setSeconds(+decimalTimeString * 60);
        timeend = n.toTimeString().slice(0, 5);

        if (timeend == "00:00") { timeend = "23:59"; }

        var start = moment(timestart, "HH:mm").format("LT");
        var end = moment(timeend, "HH:mm").format("LT");

        return start + " - " + end;
    }
});
$("#newtimetable-slider").slider({
    min: 0,
    max: 96,
    step: 1,
    range: true,
    value: [32, 68],
    formatter: function (value) {
        var decimalTimeString = value[0] * 15;
        var n = new Date(0, 0);
        n.setSeconds(+decimalTimeString * 60);
        timestart = n.toTimeString().slice(0, 5);

        var decimalTimeString = value[1] * 15;
        var n = new Date(0, 0);
        n.setSeconds(+decimalTimeString * 60);
        timeend = n.toTimeString().slice(0, 5);

        if (timeend == "00:00") { timeend = "23:59"; }

        var start = moment(timestart, "HH:mm").format("LT");
        var end = moment(timeend, "HH:mm").format("LT");

        return start + " - " + end;
    }
});



init();

function init() {
    teacherData.timetable = timetableToLocalTimezone(teacherData.timetable);

    if (teacherData.timetable == undefined) {
        teacherData.timetable = {};
    }
    if (teacherData.subjects == undefined) {
        teacherData.subjects = {};
    }


    // show notification about teacher status
    if (teacherData.visible == 1 && teacherData.availability > 0) {
        $("#notcont-general").html('<div class="notification success margin-bottom-50" style="display:block"><p><strong>' + $.i18n("_bstr.settingsTeacher.visible", "</strong>") + '</p></div>');
    } else {
        $("#notcont-general").html(`<div class="notification error margin-bottom-50" style="display:block;"><p style="text-align:left;">
                    ${$.i18n("_bstr.settingsTeacher.invisible")}<br><br>
                    <strong>${$.i18n("_bstr.settingsTeacher.invisible-req")}</strong><br>
                    - ${$.i18n("_bstr.settingsTeacher.invisible-req1")}<br>
                    - ${$.i18n("_bstr.settingsTeacher.invisible-req2")}<br>
                    - ${$.i18n("_bstr.settingsTeacher.invisible-req3")}<br>
                    - ${$.i18n("_bstr.settingsTeacher.invisible-req4")}<br>
                    - ${$.i18n("_bstr.settingsTeacher.invisible-req5")}<br>
                </p></div>`);
    }

    $('#socialteacher').prop("checked", teacherData.socialTeacher);

    if (teacherData.country != null) {
        $("#ts-country-picker").selectpicker('val', teacherData.country.toUpperCase());
    }

    // availability status
    switch (teacherData.availability) {
        case 0:
            $("#ts-avail-0").prop("checked", true);
            break;
        case 1:
            $("#ts-avail-1").prop("checked", true);
            break;
        case 2:
            $("#ts-avail-2").prop("checked", true);
            break;
    }


    // load languages
    $.each(teacherData.languages, function (index, value) {
        addLanguageToDOM(index, value);
    });

    $.each(teacherData.subjects, function (index, value) {
        addSubjectToDOM(index, value);
    });



    // load timetable
    var ttlength = $(".timetable-row-item-container").width();

    $.each(teacherData.timetable, function (ix, itx) {
        $.each(itx, function (index, item) {
            var st = (parseFloat(item.start.split(":")[0]) + (parseFloat(item.start.split(":")[1]) / 60)) / 24;
            var ed = (parseFloat(item.end.split(":")[0]) + (parseFloat(item.end.split(":")[1]) / 60)) / 24;
            var diff = ed - st;

            var st_tot = Math.round(ttlength * st);
            var wd_tot = Math.round(ttlength * diff);

            var localeStart = moment(item.start, "HH:mm");
            var localeEnd = moment(item.end, "HH:mm");

            $('#timetable-' + ix + '-items').append('<div id="' + index + '" onclick="openTimetableUpdateDialog(\'' + ix + '\', ' + index + ');" class="timetable-item" style="left: ' + st_tot + 'px;width:' + wd_tot + 'px;"><span>' + localeStart.format("LT") + '<br />' + localeEnd.format("LT") + '</span></div>');

        });
    });
}

function addLanguageToDOM(id, level) {
    $("#languageContainer").append(`<div class="row" id="language-row-` + id + `">
                                        <div class="col-md-4">
                                            <div id="ts-language-picker-container-` + id + `"></div>
                                        </div>

                                        <div class="col-md-4">
                                            <div id="ts-language-level-picker-container-` + id + `"></div>
                                        </div>

                                        <div class="col-md-2">
                                            <a onclick="deleteLanguage('` + id + `');" id="button-lessonstart" class="button gray ripple-effect-dark">${$.i18n("_bstr.general.delete")}</a>
                                        </div>
                                    </div>`);


    $("#ts-language-picker-container-" + id).html('<input type="text" class="with-border" value="' + languageData[id] + '" disabled>');
    $("#ts-language-level-picker-container-" + id).html('<input type="text" class="with-border" value="' + languageLevel[level] + '" disabled>');
}

function deleteLanguage(id) {
    delete teacherData.languages[id];
    $("#language-row-" + id).remove();
}

function round(value, step) {
    step || (step = 1.0);
    var inv = 1.0 / step;
    return Math.round(value * inv) / inv;
}

function showDeleteSubjectDialog(id) {
    $("#deletesubject-dialog-id").val(id);
    $("#subjectdelete-dialog-link").click();
}

function deleteSubject() {
    var id = $("#deletesubject-dialog-id").val();
    if (id == -1) {
        return;
    }
    delete teacherData.subjects[id];
    delete activeSubjects[id];
    $("#subject-" + id).remove();
    $.magnificPopup.close();
}

function addSubjectToDOM(index, subject) {
    $("#subject-container").after(`<div class="col-md-6" id="subject-` + index + `">
                                                    <div class="dashboard-box">

                                                        <!-- Headline -->
                                                        <div class="headline">
                                                            <h3><i class="icon-material-outline-library-books"></i> ` + subjectData[index] + `</h3>
                                                            <a onclick="showDeleteSubjectDialog('` + index + `');" class="ts-subject-delete-btn"><i class="icon-material-outline-delete"></i>
                                                                ${$.i18n("_bstr.general.delete")}</a>
                                                        </div>

                                                        <div class="content with-padding">
                                                            <div class="row">

                                                                <div class="col-xl-12 margin-bottom-20">
                                                                    <div class="row">

                                                                        <div class="col-md-12">
                                                                            <div class="submit-field">
                                                                                <h5>${$.i18n("_bstr.settingsTeacher.level")}</h5>
                                                                                <select class="selectpicker"
                                                                                    id="ts-subject-` + index + `-level" onchange="subjectChangeLevel('` + index + `');" title="${$.i18n("_bstr.settingsTeacher.selectLevel")}"
                                                                                    data-live-search="false">
                                                                                    <option value="1">${$.i18n("_bstr.general.level.1")}</option>
                                                                                    <option value="2">${$.i18n("_bstr.general.level.2")}</option>
                                                                                    <option value="3">${$.i18n("_bstr.general.level.3")}</option>
                                                                                    <option value="4">${$.i18n("_bstr.general.level.4")}</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div class="col-md-12">
                                                                    <div class="submit-field">
                                                                        <h5>${$.i18n("_bstr.settingsTeacher.landp")} / 45 ${$.i18n('_bstr.general.minutes')}</h5>
                                                                        <select class="selectpicker" id="ts-subject-` + index + `-45-points" data-live-search="false" data-size="5">
                                                                            <option value="2" data-content="2.00€ <small>(<span data-currency-converted='2'></span>)</small>"></option>
                                                                            <option value="3.5" data-content="3.50€ <small>(<span data-currency-converted='3.5'></span>)</small>"></option>
                                                                            <option value="5" data-content="5.00€ <small>(<span data-currency-converted='5'></span>)</small>"></option>
                                                                            <option value="7" data-content="7.00€ <small>(<span data-currency-converted='7'></span>)</small>"></option>
                                                                            <option value="10" data-content="10.00€ <small>(<span data-currency-converted='10'></span>)</small>"></option>
                                                                            <option value="15" data-content="15.00€ <small>(<span data-currency-converted='15'></span>)</small>"></option>
                                                                            <option value="20" data-content="20.00€ <small>(<span data-currency-converted='20'></span>)</small>"></option>
                                                                            <option value="20" data-content="25.00€ <small>(<span data-currency-converted='25'></span>)</small>"></option>
                                                                            <option value="20" data-content="30.00€ <small>(<span data-currency-converted='30'></span>)</small>"></option>
                                                                            <option value="20" data-content="35.00€ <small>(<span data-currency-converted='35'></span>)</small>"></option>
                                                                            <option value="20" data-content="40.00€ <small>(<span data-currency-converted='40'></span>)</small>"></option>
                                                                            <option value="20" data-content="45.00€ <small>(<span data-currency-converted='45'></span>)</small>"></option>
                                                                            <option value="20" data-content="50.00€ <small>(<span data-currency-converted='50'></span>)</small>"></option>
                                                                        </select>
                                                                    </div> 
                                                                </div>

                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>`);

    $("#ts-subject-" + index + "-level").selectpicker("val", subject.level);
    $("#ts-subject-" + index + "-45-points").selectpicker("val", subject.tf[45]);
    i18n_updatePrices();


    // DOM logic
    timeframes.forEach(function (time) {
        $("#ts-subject-" + index + "-" + time + "-points").on("change", function (event) {
            i18n_updatePrices();
            teacherData.subjects[index].tf[time] = isNaN(parseFloat($(this).val())) ? 0 : parseFloat($(this).val());
            //checkLessonPrice(index, time);
        });

        /*$("#ts-subject-" + index + "-" + time).on("change", function() {
            checkLessonPrice(index, time);
        });

        if (subject.tf[time] > 0) {
            $("#ts-subject-" + index + "-" + time).prop("checked", true);
            $("#ts-subject-" + index + "-" + time).trigger("change");
            $("#ts-subject-" + index + "-" + time + "-points").trigger("change");
        }

        checkLessonPrice(index, time);*/
    });
}

function checkLessonPrice(index, time) {
    return;
    var value = $("#ts-subject-" + index + "-" + time + "-points").val();
    var active = $("#ts-subject-" + index + "-" + time).prop("checked");

    if (!active) {
        teacherData.subjects[index].tf[time] = 0;
        $("#ts-subject-" + index + "-" + time + "-points").prop("disabled", true);
        $("#ts-subject-" + index + "-" + time + "-points").val(null);
        $("#ts-subject-" + index + "-" + time + "-finalpoints").html("");
        return;
    }


    $("#ts-subject-" + index + "-" + time + "-finalpoints").html(`(<span data-currency-converted=""></span>)`);


    if (value == 0 && active) {
        value = RECOMM_RATES[time];
        $("#ts-subject-" + index + "-" + time + "-points").val(RECOMM_RATES[time]);
    }

    if (value < MINRATES[time]) {
        value = MINRATES[time];
        $("#ts-subject-" + index + "-" + time + "-points").val(MINRATES[time]);
    }

    $("#ts-subject-" + index + "-" + time + "-finalpoints>span").data("currency-converted", value);
    $("#ts-subject-" + index + "-" + time + "-points").prop("disabled", false);

    teacherData.subjects[index].tf[time] = value;

    i18n_updatePrices();
}


function subjectChangeLevel(index) {
    var value = $('#ts-subject-' + index + '-level').val();
    teacherData.subjects[index].level = parseInt(value);
}

function addNewSubject() {
    $("#newsubject-not").html("");
    var lvl = $("#newsubjectdialog-level").val();
    var subject = $("#ts-subject-list-picker").val();

    if (subject in teacherData.subjects) {
        $("#newsubject-not").html('<div class="notification error d-block"><p>' + $.i18n("_bstr.settingsTeacher.error.subjectalready") + '</p></div><br/>');
        return;
    }

    if (lvl == "" || lvl == null) {
        $("#newsubject-not").html('<div class="notification error d-block"><p>' + $.i18n("_bstr.settingsTeacher.error.subjectlevel") + '</p></div><br/>');
        return;
    }
    if (subject == "" || subject == null) {
        $("#newsubject-not").html('<div class="notification error d-block"><p>' + $.i18n("_bstr.settingsTeacher.error.subject") + '</p></div><br/>');
        return;
    }

    $("#newsubject-not").html('');
    $("#newsubjectdialog-level").selectpicker("val", 0);
    $("#ts-subject-list-picker").selectpicker("val", 0);

    teacherData.subjects[subject] = {
        level: parseInt(lvl),
        tf: {
            30: 0,
            45: Math.ceil((MINRATE_45 * 1.5)),
            60: 0,
            90: 0,
            120: 0
        }
    };
    addSubjectToDOM(subject, teacherData.subjects[subject]);

    $.magnificPopup.close();
}

function openAddLanguageDialog() {
    $("#showdialog-addlanguage").click();
}

function addLanguage() {
    $("#newlanguage-not").html("");
    var language = $("#dialog-addlanguage-lang").val();
    var level = parseInt($("#dialog-addlanguage-level").val());

    if (teacherData.languages != undefined) {
        if (language in teacherData.languages) {
            $("#newlanguage-not").html('<div class="notification error d-block"><p>' + $.i18n("_bstr.settingsTeacher.error.languagealready") + '</p></div><br/>')
            return;
        }
    } else {
        teacherData.languages = {};
    }
    if (language == "" || language == null) {
        $("#newlanguage-not").html('<div class="notification error d-block"><p>' + $.i18n("_bstr.settingsTeacher.error.language") + '</p></div><br/>')
        return;
    }
    if ($("#dialog-addlanguage-level").val() == "" || $("#dialog-addlanguage-level").val() == null || level == 0) {
        $("#newlanguage-not").html('<div class="notification error d-block"><p>' + $.i18n("_bstr.settingsTeacher.error.languagelevel") + '</p></div><br/>')
        return;
    }

    $("#newlanguage-not").html("");
    $("#dialog-addlanguage-lang").selectpicker("val", 0);
    $("#dialog-addlanguage-level").selectpicker("val", 1);

    teacherData.languages[language] = level;
    addLanguageToDOM(language, level);

    $.magnificPopup.close();
}

function openTimetableUpdateDialog(weekday, id) {
    $("#edittimetable-day").val(weekday);
    $("#edittimetable-id").val(id);
    $("#edittimetable-not").html("");

    start = teacherData.timetable[weekday][id].start;
    end = teacherData.timetable[weekday][id].end;

    var starttime = parseInt((start.split(":")[0] * 60)) + parseInt((start.split(":")[1]));
    starttime = starttime / 15;

    var endtime = parseInt((end.split(":")[0] * 60)) + parseInt((end.split(":")[1]));
    endtime = endtime / 15;

    $("#edittimetable-sliderstart").slider('setValue', [starttime, endtime]);
    $("#showdialog-edittimetableitem").click();
}

function updateTimetableItem() {
    var weekday = $("#edittimetable-day").val();
    var id = $("#edittimetable-id").val();
    var domitem = $("#timetable-" + weekday + "-items>#" + $("#edittimetable-id").val());
    var values = $("#edittimetable-sliderstart").slider('getValue');
    $("#edittimetable-not").html("");

    var starttime = values[0] * 15 / 60 / 24;
    var endtime = values[1] * 15 / 60 / 24;


    //check if overlapping
    var startmin = values[0] * 15;
    var endmin = values[1] * 15;

    var overlapping = isOverlapping(id, startmin, endmin, teacherData.timetable[weekday]);

    if (overlapping) {
        $("#edittimetable-not").html('<div class="notification error d-block"><p>' + $.i18n("_bstr.settingsTeacher.error.tt.overlap") + '</p></div><br/>');
        $("#edittimetable-not>.notification").fadeIn("fast");
        return;
    }


    var n = new Date(0, 0);
    n.setSeconds(+startmin * 60);
    startmin = n.toTimeString().slice(0, 5);

    var x = new Date(0, 0);
    x.setSeconds(+endmin * 60);
    endmin = x.toTimeString().slice(0, 5);

    if (endmin == "00:00") { endmin = "23:59"; }

    teacherData.timetable[weekday][id].start = startmin;
    teacherData.timetable[weekday][id].end = endmin;

    var localeStart = moment(startmin, "HH:mm");
    var localeEnd = moment(endmin, "HH:mm");

    $("#timetable-" + weekday + "-items>#" + id + ">span").html(localeStart.format("LT") + "<br/>" + localeEnd.format("LT"));

    var diff = endtime - starttime;

    var ttlength = $(".timetable-row-item-container").width();
    var st_tot = Math.round(ttlength * starttime);
    var wd_tot = Math.round(ttlength * diff);

    domitem.css("left", st_tot + "px");
    domitem.css("width", wd_tot + "px");

    $.magnificPopup.close();
}

function deleteTimetableItem() {
    delete teacherData.timetable[$("#edittimetable-day").val()][$("#edittimetable-id").val()];
    $("#timetable-" + $("#edittimetable-day").val() + "-items>#" + $("#edittimetable-id").val()).remove();

    if (jQuery.isEmptyObject(teacherData.timetable[$("#edittimetable-day").val()])) {
        delete teacherData.timetable[$("#edittimetable-day").val()];
    }

    if (teacherData.timetable[$("#edittimetable-day").val()] != undefined) {
        teacherData.timetable[$("#edittimetable-day").val()] = teacherData.timetable[$("#edittimetable-day").val()].filter(n => n);
    }

    $.magnificPopup.close();
}

function addTimetableItem() {
    $("#addtimetable-not").html("");
    var weekday = $("#dialog-newtimetable-weekday").val();
    var times = $("#newtimetable-slider").slider('getValue');

    if (weekday == "" || weekday == null) {
        $("#addtimetable-not").html('<div class="notification error d-block"><p>' + $.i18n("_bstr.settingsTeacher.error.tt.weekday") + '</p></div><br/>');
        $("#addtimetable-not>.notification").fadeIn("fast");
        return;
    }

    var starttime = times[0] * 15;
    var n = new Date(0, 0);
    n.setSeconds(+starttime * 60);
    starttime = n.toTimeString().slice(0, 5);

    var endtime = times[1] * 15;
    var n = new Date(0, 0);
    n.setSeconds(+endtime * 60);
    endtime = n.toTimeString().slice(0, 5);

    var startmin = times[0] * 15;
    var endmin = times[1] * 15;

    if (endtime == "00:00") { endtime = "23:59"; }

    //check if overlapping
    var overlapping = isOverlapping(-1, startmin, endmin, teacherData.timetable[weekday]);

    if (overlapping) {
        $("#addtimetable-not").html('<div class="notification error d-block"><p>' + $.i18n("_bstr.settingsTeacher.error.tt.overlap") + '</p></div><br/>');
        $("#addtimetable-not>.notification").fadeIn("fast");
        return;
    }


    if (jQuery.isEmptyObject(teacherData.timetable[weekday])) {
        teacherData.timetable[weekday] = [];
    }

    var max = teacherData.timetable[weekday].push({
        "start": starttime,
        "end": endtime
    });
    max--;



    //add item to timetable
    var sttime = times[0] * 15 / 60 / 24;
    var edtime = times[1] * 15 / 60 / 24;

    var diff = edtime - sttime;

    var ttlength = $(".timetable-row-item-container").width();
    var st_tot = Math.round(ttlength * sttime);
    var wd_tot = Math.round(ttlength * diff);

    var localeStart = moment(starttime, "HH:mm");
    var localeEnd = moment(endtime, "HH:mm");

    $('#timetable-' + weekday + '-items').append('<div id="' + max + '" onclick="openTimetableUpdateDialog(\'' + weekday + '\', ' + max + ');" class="timetable-item" style="left: ' + st_tot + 'px;width:' + wd_tot + 'px;"><span>' + localeStart.format("LT") + '<br />' + localeEnd.format("LT") + '</span></div>');

    $("#dialog-newtimetable-weekday").selectpicker("val", 0);
    $("#newtimetable-slider").slider('setValue', [32, 68]);
    $.magnificPopup.close();
}


$("#save-btn").on("click", function () {
    saveData();
});
$("#save-btn-2").on("click", function () {
    saveData();
});

async function saveData() {
    $("#save-btn").html($.i18n("_bstr.settingsTeacher.saving"));
    $("#save-btn-2").html($.i18n("_bstr.settingsTeacher.saving"));


    var file = $("#ts-pp-upload")[0].files[0];
    if (file != undefined) {
        var formData = new FormData();
        formData.append('img', file);
        var imageResult = await $.ajax({
            url: window.location.origin + "/saveProfilePicture",
            type: 'post',
            data: formData,
            processData: false,
            contentType: false
        });
    }



    var result = await r('saveTeacherSettings', {
        str: JSON.stringify(teacherData),
        tz: UTCOffset
    });




    if (file == undefined) {
        if (result.status == "success") {
            if (result.newTeacher == true) {
                if (CFG_ENV == "production") {
                    fbq('track', 'SubmitApplication');
                    setTimeout(saveSuccess, 500);
                }
                return;
            };

            saveSuccess();
        } else {
            saveError();
        }
        return;
    }

    if (result.status == "success" && imageResult.status == "success") {

        if (result.newTeacher == true) {
            if (CFG_ENV == "production") {
                fbq('track', 'SubmitApplication');
            }
            setTimeout(saveSuccess, 250);
            return;
        };

        saveSuccess();
    } else {
        saveError();
    }
}


if (getUrlVars().s != undefined) {
    if (getUrlVars().s == "1") {
        $("#save-btn").html($.i18n("_bstr.settingsTeacher.saving.success"));
        $("#save-btn").addClass("button-green");

        $("#save-btn-2").html($.i18n("_bstr.settingsTeacher.saving.success"));
        $("#save-btn-2").addClass("button-green");

        setTimeout(function () {
            $("#save-btn").html($.i18n("_bstr.general.save"));
            $("#save-btn").removeClass("button-green");

            $("#save-btn-2").html($.i18n("_bstr.general.save"));
            $("#save-btn-2").removeClass("button-green");
        }, 3000);
    }

    if (getUrlVars().s == "0") {
        $("#save-btn").html($.i18n("_bstr.settingsTeacher.saving.error"));
        $("#save-btn").addClass("button-red");

        $("#save-btn-2").html($.i18n("_bstr.settingsTeacher.saving.error"));
        $("#save-btn-2").addClass("button-red");

        setTimeout(function () {
            $("#save-btn").html("Save");
            $("#save-btn").removeClass("button-red");

            $("#save-btn-2").html("Save");
            $("#save-btn-2").removeClass("button-red");
        }, 3000);
    }
}

function saveError() {
    window.location.href = "/settings-teacher?s=0"

    $("#save-btn").html($.i18n("_bstr.settingsTeacher.saving.error"));
    $("#save-btn").addClass("button-red");

    $("#save-btn-2").html($.i18n("_bstr.settingsTeacher.saving.error"));
    $("#save-btn-2").addClass("button-red");

    setTimeout(function () {
        $("#save-btn").html("Save");
        $("#save-btn").removeClass("button-red");

        $("#save-btn-2").html("Save");
        $("#save-btn-2").removeClass("button-red");
    }, 5000);
}

function saveSuccess() {
    window.location.href = "/settings-teacher?s=1"

    $("#save-btn").html($.i18n("_bstr.settingsTeacher.saving.success"));
    $("#save-btn").addClass("button-green");

    $("#save-btn-2").html($.i18n("_bstr.settingsTeacher.saving.success"));
    $("#save-btn-2").addClass("button-green");

    setTimeout(function () {
        $("#save-btn").html($.i18n("_bstr.general.save"));
        $("#save-btn").removeClass("button-green");

        $("#save-btn-2").html($.i18n("_bstr.general.save"));
        $("#save-btn-2").removeClass("button-green");
    }, 5000);
}

$("#ts-avail-0").on("change", function () {
    if (this.checked) {
        teacherData.availability = 0;
    }
});
$("#ts-avail-1").on("change", function () {
    if (this.checked) {
        teacherData.availability = 1;
    }
});
$("#ts-avail-2").on("change", function () {
    if (this.checked) {
        teacherData.availability = 2;
    };
});

$("#ts-description").on("change", function () {
    teacherData.description = $("#ts-description").val();
});

$("#ts-name").on("change", function () {
    teacherData.firstname = $("#ts-name").val();
});

$("#ts-lastname").on("change", function () {
    teacherData.lastname = $("#ts-lastname").val();
});

$('#ts-country-picker').on('changed.bs.select', function () {
    teacherData.country = $('#ts-country-picker').val();
});

$('#socialteacher').on("change", function () {
    teacherData.socialTeacher = $(this).is(":checked");
});

$('#ts-video').on('keyup', function(){
    var url = $(this).val();
    var id = getYouTubeVideoIdFromUrl(url);

    if(id == undefined){ 
        teacherData.video_id = "";
        teacherData.video_source = "";
        teacherData.video = false;
        return;
    }

    teacherData.video_id = id;
    teacherData.video_source = "youtube";
    teacherData.video = true;
});

const getYouTubeVideoIdFromUrl = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : undefined;
};
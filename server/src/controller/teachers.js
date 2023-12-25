let url = new URL(window.location.href);
let searchParams = new URLSearchParams(url.search);
var teacherData = {};



if (searchParams.get('teacherrequest') == "success") {
    showNotification($.i18n("_bstr.teachers.request.received"), "success");
}

if (getUrlVars().verify == "success") {
    showNotification($.i18n('_bstr.login.verifySuccess'), "success");
} else if (getUrlVars().verify == "error") {
    showNotification($.i18n('_bstr.login.verifyError'), "error");
}



//Loading data for filters
var subjectlist = '<select class="selectpicker default" data-size="5" data-dropup-auto="false" data-live-search="true" title="' + $.i18n("_bstr.general.subject") + '" id="filter-subjects"> <option value="reset">' + $.i18n("_bstr.general.reset") + '</option><option data-divider="true"></option>';
$.each(subjectData, function (index, value) {
    subjectlist += '<option value="' + index + '">' + value + '</option>';
});
subjectlist += "</select>";
$("#filter-container-subjects").html(subjectlist);

$("#filter-subjects").on("change", function () {
    if ($("#filter-subjects").selectpicker("val") == "reset") {
        $("h1").html($.i18n('_bstr.teachers.headline', ''));
        document.title = $.i18n('_bstr.teachers.headline', '') + " - PeakESL";

        $('.readmore>p>b').each(function () {
            $(this).html('');
        })

        $("#filter-container-subjects-level").fadeOut("fast");
        $("#filter-subjects").selectpicker("val", -1);

        window.history.pushState('tutors', document.title, window.location.origin + "/" + "tutors/" + window.location.search);
        return;
    }
    $("#filter-container-subjects-level").fadeIn("fast");


    if ($.i18n().locale == "ru") {
        $("h1").html($.i18n('_bstr.teachers.headline', '<mark class="color" id="h-subject">' + subjectDataDeclined[$("#filter-subjects").selectpicker("val")] + '</mark>'));
        document.title = $.i18n('_bstr.teachers.headline', subjectDataDeclined[$("#filter-subjects").selectpicker("val")]) + " - PeakESL";
        $('.readmore>p>b').each(function () {
            $(this).html(subjectDataDeclined[$("#filter-subjects").selectpicker("val")]);
        });
    } else {
        $("h1").html($.i18n('_bstr.teachers.headline', '<mark class="color" id="h-subject">' + subjectData[$("#filter-subjects").selectpicker("val")] + '</mark>'));
        document.title = $.i18n('_bstr.teachers.headline', subjectData[$("#filter-subjects").selectpicker("val")]) + " - PeakESL";
        $('.readmore>p>b').each(function () {
            $(this).html(subjectData[$("#filter-subjects").selectpicker("val")]);
        });
    }

    window.history.pushState('tutors', document.title, window.location.origin + "/" + $("#filter-subjects").selectpicker("val").toLowerCase().replaceAll(" ", "-") + "-tutors/" + window.location.search);
});


var subjectLevellist = '<select class="selectpicker default" data-size="10" data-dropup-auto="false" title="' + $.i18n("_bstr.general.level") + '" id="filter-subjects-level"> <option value="reset">' + $.i18n("_bstr.general.reset") + '</option><option data-divider="true"></option>';
$.each(subjectLevel, function (index, value) {
    subjectLevellist += '<option value="' + index + '">' + value + '</option>';
});
subjectLevellist += "</select>";
$("#filter-container-subjects-level").html(subjectLevellist);

$("#filter-subjects-level").on("change", function () {
    if ($("#filter-subjects-level").selectpicker("val") == "reset") {
        $("#filter-subjects-level").selectpicker("val", -1);
        return;
    }
});



//Loading data for filters
var languagelist = '<select class="selectpicker default" data-size="5" data-dropup-auto="false" data-live-search="true" title="' + $.i18n("_bstr.general.language") + '" id="filter-languages"> <option value="reset">' + $.i18n("_bstr.general.reset") + '</option><option data-divider="true"></option>';
$.each(languageData, function (index, value) {
    languagelist += '<option value="' + index + '">' + value + '</option>';
});
languagelist += "</select>";
$("#filter-container-languages").html(languagelist);

$("#filter-languages").on("change", function () {
    if ($("#filter-languages").selectpicker("val") == "reset") {
        $("#filter-container-languages-level").fadeOut("fast");
        $("#filter-languages").selectpicker("val", -1);

        var searchParams = new URLSearchParams(window.location.search);
        searchParams.delete('tl');
        window.history.pushState('tutors', document.title, window.location.pathname + "?" + searchParams.toString());
        return;
    }
    $("#filter-container-languages-level").fadeIn("fast");

    var searchParams = new URLSearchParams(window.location.search);
    searchParams.set('tl', $("#filter-languages").selectpicker("val"));
    window.history.pushState('tutors', document.title, window.location.pathname + "?" + searchParams.toString());
});



var languagelevellist = '<select class="selectpicker default" data-size="10" data-dropup-auto="false" title="' + $.i18n("_bstr.general.level") + '" id="filter-languages-level"> <option value="reset">' + $.i18n("_bstr.general.reset") + '</option><option data-divider="true"></option>';
$.each(languageLevel, function (index, value) {
    languagelevellist += '<option value="' + index + '">' + value + '</option>';
});
languagelevellist += "</select>";
$("#filter-container-languages-level").html(languagelevellist);

$("#filter-languages-level").on("change", function () {
    if ($("#filter-languages-level").selectpicker("val") == "reset") {
        $("#filter-languages-level").selectpicker("val", -1);
        return;
    }
});




var countrylist = '<select class="selectpicker default" data-size="5" data-dropup-auto="false" data-live-search="true" title="' + $.i18n("_bstr.general.location") + '" id="filter-location"> <option value="reset">' + $.i18n("_bstr.general.reset") + '</option><option data-divider="true"></option>';
$.each(countryData, function (index, value) {
    countrylist += '<option value="' + index + '">' + value + '</option>';
});
countrylist += "</select>";
$("#filter-container-location").html(countrylist);

$("#filter-location").on("change", function () {
    if ($("#filter-location").selectpicker("val") == "reset") {
        $("#filter-location").selectpicker("val", -1);

        var searchParams = new URLSearchParams(window.location.search);
        searchParams.delete('tc');
        window.history.pushState('tutors', document.title, window.location.pathname + "?" + searchParams.toString());
        return;
    }

    var searchParams = new URLSearchParams(window.location.search);
    searchParams.set('tc', $("#filter-location").selectpicker("val"));
    window.history.pushState('tutors', document.title, window.location.pathname + "?" + searchParams.toString());
});




// load data from server and url params
if (typeof (pageData) != "undefined") {
    $("#filter-subjects").selectpicker("val", pageData.subject);
    $("#filter-container-subjects-level").fadeIn("fast");

    if ($.i18n().locale == "ru") {
        $("h1").html($.i18n('_bstr.teachers.headline', '<mark class="color" id="h-subject">' + subjectDataDeclined[pageData.subject] + '</mark>'));
        document.title = $.i18n('_bstr.teachers.headline', subjectDataDeclined[pageData.subject]) + " - PeakESL";
        $('.readmore>p>b').each(function () {
            $(this).html(subjectDataDeclined[pageData.subject]);
        });
    } else {
        $("h1").html($.i18n('_bstr.teachers.headline', '<mark class="color" id="h-subject">' + subjectData[pageData.subject] + '</mark>'));
        document.title = $.i18n('_bstr.teachers.headline', subjectData[pageData.subject]) + " - PeakESL";
        $('.readmore>p>b').each(function () {
            $(this).html(subjectData[pageData.subject]);
        });
    }
}

if (searchParams.get("tl") != null) {
    $("#filter-languages").selectpicker("val", searchParams.get("tl"));
}
if (searchParams.get("tc") != null) {
    $("#filter-location").selectpicker("val", searchParams.get("tc").toUpperCase());
}




async function loadTeachers(reload = true) {
    hideNotification();

    if (searchParams.get('teacherrequest') == "success") {
        showNotification($.i18n("_bstr.teachers.request.received"), "success");
    }

    if (getUrlVars().verify == "success") {
        showNotification($.i18n('_bstr.login.verifySuccess'), "success");
    } else if (getUrlVars().verify == "error") {
        showNotification($.i18n('_bstr.login.verifyError'), "error");
    }

    if (searchParams.get("signup") == "true" && CFG_ENV == "production") {
        fbq('track', 'CompleteRegistration');
    }


    if (reload) {
        teacherData = {};
        $("#teachers-container").html("");
    }



    //var name = $("#filter-name").val();
    var subject = $("#filter-subjects").selectpicker("val");
    if (subject == null) {
        subject = "";
    }

    var subject_level = parseFloat($("#filter-subjects-level").selectpicker("val"));
    if (isNaN(subject_level)) {
        subject_level = 0;
    }

    var language = $("#filter-languages").selectpicker("val");
    if (language == null) {
        language = "";
    }

    var language_level = parseFloat($("#filter-languages-level").selectpicker("val"));
    if (isNaN(language_level)) {
        language_level = 0;
    }


    var location = $("#filter-location").selectpicker("val");


    var rating = parseFloat($("#filter-rating").selectpicker("val"));
    if (isNaN(rating)) {
        rating = 0;
    }


    if (CFG_ENV == "production") {
        gtag('event', 'view_item_list', {
            'event_category': 'Teachers_View',
            'event_label': subject + "," + subject_level + "," + language + "," + language_level + "," + location + "," + rating
        });
    }


    try {
        var result = await r('getTeachers', {
            name: null,
            subject: subject,
            subject_level: subject_level,
            language: language,
            language_level: language_level,
            rating: rating,
            location: location
        });

        if (result.status == "ok") {
            teacherData = result.data;

            $.each(teacherData, function (index, value) {
                addTeacherToDOM(value);
            });

            //$('#teachers-container').randomize('.teacherview-profile');


            if (reload) {
                starRating('.star-rating');
            }

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

            if (Object.keys(teacherData).length == 0) {
                __analytics_tv_nr({
                    name: null,
                    subject: subject,
                    subject_level: subject_level,
                    language: language,
                    language_level: language_level,
                    rating: rating,
                    location: location
                });
                showTeacherResultsNotification($.i18n("_bstr.teachers.noresults"), "notice");
            }

            setTimeout(resizeForSpecialOffer, 200);
        } else {
            showTeacherResultsNotification($.i18n("_bstr.teachers.error"), "error");
        }

    } catch (error) {
        console.log(error);
        showTeacherResultsNotification($.i18n("_bstr.teachers.error"), "error");
    }
}
loadTeachers(true);



function addTeacherToDOM(teacher) {
    var subjects = "";
    var lowest_rate = 0;
    var subject_counter = 0;

    var languages = "";

    $.each(teacher.languages, function (index, item) {
        languages += `<span data-tippy-placement="top" title="${languageLevel[item]}">${languageData[index]} <div class="lang-level-ind ll-${item}">${languageCERF[item]}</div></span>`;
    });


    $.each(teacher.subjects, function (index, item) {
        var subjectLoc = subjectData[index];

        if (subject_counter == 0) {
            subjects += subjectLoc;
            lowest_rate = item.tf[45];
        } else {
            subjects += ", " + subjectLoc;
        }


        if (item.tf[30] < lowest_rate && item.tf[30] != 0) {
            lowest_rate = item.tf[30];
        }
        if (item.tf[45] < lowest_rate && item.tf[45] != 0) {
            lowest_rate = item.tf[45];
        }

        subject_counter++;
    });

    var verified = "";
    if (teacher.verified == true) {
        verified = `<div class="verified-badge-with-title" data-tippy-placement="top" title="${$.i18n("_bstr.teacher.verified.tooltip")}"></div>`;
    }

    var socialTeacher = "";
    if (teacher.socialTeacher == true) {
        socialTeacher = `<div class="verified-badge-with-title badge-socialteacher" data-tippy-placement="top" title="${$.i18n("_bstr.teacher.socialteacher.tooltip")}"></div>`;
    }

    var rating = '';
    if (teacher.rating != -1) {
        rating = `<div class="star-rating teacherview-rating d-block" data-rating="` + round1dec(teacher.rating) + `"></div>`;
    }

    var so = "",
        soi = "";
    var ssoi = `<span>${$.i18n("_bstr.general.rate")} <strong><span data-currency-converted="${lowest_rate}"></span></strong></span>`;

    if (typeof (uData) != "undefined") {
        if (uData.socialStudent == true) {
            ssoi = "<br><br>";
        }
    }

    if (ctd_active) {
        if (typeof (uData) != "undefined") {
            if (uData.specialOfferLeft > 0) {
                if ((teacher.isSpecialOffer && uData.specialOfferTutor == teacher._id) || (teacher.isSpecialOffer && uData.specialOfferTutor == "")) {
                    lowest_rate = 0;
                    so = "specialOffer";
                    soi = `<div class="soi">${$.i18n("_bstr.general.specialOffer")}</div>`;
                    ssoi = '<span style="font-weight:bold;"> ' + $.i18n("_bstr.general.freeFirstLesson") + '</span>';
                }
            }
        } else if (teacher.isSpecialOffer) {
            lowest_rate = 0;
            so = "specialOffer";
            soi = `<div class="soi">${$.i18n("_bstr.general.specialOffer")}</div>`;
            ssoi = '<span style="font-weight:bold;"> ' + $.i18n("_bstr.general.freeFirstLesson") + '</span>';
        }
    }

    // deactivating Special Offer
    so = "";
    soi = "";

    var thumbnail = "";
    var video = "";

    if (teacher.video) {
        thumbnail = "https://img.youtube.com/vi/" + teacher.video_id + "/mqdefault.jpg";
        if (teacher.video_source == "vimeo") { thumbnail = "https://i.vimeocdn.com/video/" + teacher.video_id + "_410x231.webp"; }

        video = `<div class="tv-video-container" style="background-image:url('${thumbnail}');" id="tv-vb-${teacher._id}">
                                            <div class="tv-video-overlay"></div>
                                            <i class="icon-line-awesome-play"></i>
                                        </div>`;
    }


    var teacherDomElement = `<div class="teacherview-profile freelancer ${so}">
                                        ${soi}

                                        <div class="freelancer-overview">
                                            <div class="freelancer-overview-inner">

                                                <div class="freelancer-avatar">
                                                    <a href="/teacher/` + teacher._id + `">
                                                        <!--<div class="avatar-flag">
                                                            <img class="flag" src="https://peakesl.nyc3.cdn.digitaloceanspaces.com/web/images/flags/` + teacher.country.toLowerCase() + `.svg" alt="" title="` + countryData[teacher.country.toUpperCase()] + `" data-tippy-placement="top" />
                                                        </div>-->
                                                        <img src="/profilepicture/${teacher._id}" alt="" id="teacherimg-` + teacher._id + `"/>
                                                    </a>
                                                    
                                                    <a href="/teacher/` + teacher._id + `/" class="button button-primary button-teacherview-book">${$.i18n("_bstr.teachers.profile")}</a>
                                                </div>

                                                <div class="freelancer-name">
                                                    <h4>
                                                        <a href="/teacher/` + teacher._id + `">` + teacher.firstname + ` ` + teacher.lastname + `</a>
                                                        
                                                        ${verified} ${socialTeacher}
                                                    </h4>
                                                    ${rating}
                                                    <span class="tv-subjects margin-bottom-5 margin-top-5"><i class="icon-line-awesome-graduation-cap"></i> ` + subjects + `</span> <br>
                                                    
                                                    <span>${$.i18n("_bstr.teachers.speaks")}: ` + languages + `</span> <br>
                                                    ${ssoi}
                                                </div>
                                            </div>
                                        </div>
                                        ${video}
                                    </div>`;

    $("#teachers-container").append(teacherDomElement);


    if (teacher.video) {
        var link = "https://www.youtube.com/watch?v=" + teacher.video_id;
        if (teacher.video_source == "vimeo") { link = "http://vimeo.com/" + teacher.video_id; }

        $('#tv-vb-' + teacher._id).magnificPopup({
            items: [{ src: link }],
            type: 'iframe',
            callbacks: {
                open: function () {
                    __analytics_track("tv_video_play", {
                        tid: teacher._id,
                        filter: {
                            subject: $("#filter-subjects").selectpicker("val"),
                            language: $("#filter-languages").selectpicker("val"),
                            location: $("#filter-location").selectpicker("val")
                        }
                    });
                }
            }
        });
    }


    i18n_updatePrices();
}

$(window).on("resize", function () {
    resizeForSpecialOffer();
})

function resizeForSpecialOffer() {
    $(".soi").each(function (i, item) {
        var v = $(this).height() - 27;
        $(this).parent().css("padding-top", v + "px");
    });

}


function resetAllFilters() {
    $("#filter-name").val("");
    $("#filter-subjects").selectpicker("val", -1);
    $("#filter-subjects-level").selectpicker("val", -1);
    $("#filter-languages").selectpicker("val", -1);
    $("#filter-languages-level").selectpicker("val", -1);
    $("#filter-location").selectpicker("val", -1);
    $("#filter-rating").selectpicker("val", -1);
    loadTeachers(true);
}

function applyFilters() {
    if (CFG_ENV == "production") {
        fbq('track', 'Search');
    }

    loadTeachers(true);
}

$("#filter-subjects").on("change", applyFilters);
$("#filter-languages").on("change", applyFilters);
$("#filter-location").on("change", applyFilters);

function showTeacherResultsNotification(text, type, prepend = false) {
    var data = `<div class="notification ${type}">
                    <p>${text}</p>
                </div>`;

    if (prepend) {
        $("#teachers-container").prepend(data);
    } else {
        $("#teachers-container").html(data);
    }
}
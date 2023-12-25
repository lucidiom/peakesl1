$("#timetable-info").text($.i18n("_bstr.teacher.tz", mToHHMM(UTCOffset)));

var selectedSubject = "";
var dp;
var ready = false;



function loadteacher() {
    teacherData.timetable = timetableToLocalTimezone(teacherData.timetable);

    if (teacherData.activeSince != undefined) {
        var date = moment(teacherData.activeSince);
        $('#ti-registereddate').text($.i18n("_bstr.teacher.activesince", date.utc().utcOffset(UTCOffset).format("LL")));
    }

    switch (teacherData.type) {
        case 1:
            $('#ti-type').html('<i class="icon-material-outline-school"></i> ' + $.i18n("_bstr.general.type.1"));
            break;
        case 2:
            $('#ti-type').html('<i class="icon-material-outline-business"></i> ' + $.i18n("_bstr.general.type.2"));
            break;
    }


    //$('#ti-rating').html('<div class="star-rating" data-rating="' + teacherData.rating + '"></div>');
    $('#ti-location').html('<img class="flag" src="https://peakesl.nyc3.cdn.digitaloceanspaces.com/web/images/flags/' + teacherData.country.toLowerCase() + '.svg" alt=""> ' + countryData[teacherData.country.toUpperCase()]);
    $('#ti-description').html(teacherData.description.replace(/\r\n|\r|\n/g, "<br />"));


    $.each(teacherData.languages, function (index, item) {
        $('#ti-languages').append(`<span style="margin-right: 20px;" data-tippy-placement="top" title="${languageLevel[item]}">${languageData[index]} <div class="lang-level-ind ll-${item}">${languageCERF[item]}</div></span>`);
    });

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


    if (teacherData.verified == true) {
        $("#ti-verified").css("display", "inline-block");
    }


    switch (teacherData.availability) {
        case 0:
            $("#ti-bookingpanel").fadeOut("fast");

            $("#ti-bookingpanel").fadeOut();
            $('#ti-availability').addClass("red");
            $('#ti-availability').html('<strong>' + $.i18n("_bstr.teacher.unavailable") + '</strong>');
            break;
        case 1:
            $('#ti-availability').addClass("orange");
            $('#ti-availability').html($.i18n("_bstr.teacher.available-current"));
            break;
        case 2:
            $('#ti-availability').addClass("green");
            $('#ti-availability').html($.i18n("_bstr.teacher.available"));
            break;
    }


    //setup booking panel
    var disabledWeekdays = [0, 1, 2, 3, 4, 5, 6];
    $.each(teacherData.timetable, function (i, item) {
        disabledWeekdays = disabledWeekdays.filter(function (item) {
            return item !== weekdayToNumber[i];
        })
    });

    var nextOppDay = moment().day() + 1;
    if (nextOppDay > 6) {
        nextOppDay = 0;
    }

    if (disabledWeekdays.length != 7) {
        while (disabledWeekdays.includes(nextOppDay)) {
            nextOppDay++;

            if (nextOppDay > 6) {
                nextOppDay = 0;
            }
        }
    }

    var nextDateAv = moment().startOf('isoWeek').add(1, 'week').day(nextOppDay).format("DD.MM.YYYY");

    dp = $('#ti-dateselect-container').datepicker({
        format: 'dd.mm.yyyy',
        startDate: '+1d',
        endDate: "+90d",
        weekStart: 1,
        todayHighlight: false,
        autoclose: true,
        orientation: "top left",
        maxViewMode: 0,
        language: i18n_locale,
        daysOfWeekDisabled: disabledWeekdays
    });

    $('#ti-dateselect-container').datepicker('setDate', nextDateAv);

    dp.on("changeDate", function (e) {
        var seldate = moment(e.date)
        var day = numberToWeekday[seldate.day()];
        calculateAvailableTimes(day);
        checkBookingCompletion();
    });



    var timeselect = '<select class="selectpicker" id="ti-timeselect" title="' + $.i18n("_bstr.teacher.selectDate") + '" data-size="5" data-live-search="false" data-dropup-auto="false"> </select>';
    $("#ti-timeselect-container").html(timeselect);
    $("#ti-timeselect").selectpicker("val", -1);



    var teacherSubjectList;
    $.each(teacherData.subjects, function (index, item) {
        var max = 0;
        var min = 500;
        var hoursind = "";
        $.each(item.tf, function (i, v) {
            max = (max < i) ? i : max;
            min = (min > i) ? i : min;
            return
        });
        if (min == max) {
            hoursind = max + " min";
        } else {
            hoursind = min + ' - ' + max + ' min';
        }

        var subjectLoc = subjectData[index];

        var subjectpricing = `<div class="job-listing-footer"><ul><li><i class="icon-material-outline-account-balance-wallet"></i> <span data-currency-converted="${item.tf[45]}"></span> / 45 ${$.i18n("_bstr.general.minutes")}</li></ul></div>`;
        if (typeof (uData) != "undefined") {
            if (uData.socialStudent == true) {
                subjectpricing = "";
            }
        }

        $("#ti-subjects").append(`<div class="job-listing">
                                        <div class="job-listing-details">
                                            <div class="job-listing-description">
                                                <h4 class="job-listing-company">` + subjectLevel[item.level] + `</h4>
                                                <h3 class="job-listing-title">` + subjectLoc + `</h3>
                                            </div>
                                        </div>
                                        ${subjectpricing}
                                    </div>`);

        teacherSubjectList += '<option value="' + index + '">' + subjectLoc + '</option>';


        if (CFG_ENV == "production") {
            gtag('event', 'view_item', {
                'event_category': 'view_teacher_profile',
                'event_label': teacherData._id
            });

            fbq('ViewContent', { content_ids: teacherData._id, content_type: "teacher_profile" });
        }
    });


    var subjectSelect = '<select class="selectpicker" id="ti-subjectselect" title="' + $.i18n("_bstr.settingsTeacher.selectSubject") + '" data-size="5" data-live-search="false" data-dropup-auto="false"> ' + teacherSubjectList + '</select>';
    $("#ti-subjectselect-container").html(subjectSelect);
    $("#ti-subjectselect").selectpicker();

    $("#ti-subjectselect").on("change", function () {
        selectedSubject = $("#ti-subjectselect").val();
        updateSlider();
        checkBookingCompletion();
    });

    $.each(teacherData.subjects, function (index, value) {
        selectedSubject = index;
        $("#ti-subjectselect").selectpicker("val", index);
        updateSlider();
        return false;
    });



    //load Timetable
    var ttlength = $(".timetable-row-item-container").width();

    $.each(teacherData.timetable, function (index, item) {
        $.each(item, function (index2, item2) {
            var st = (parseFloat(item2.start.split(":")[0]) + (parseFloat(item2.start.split(":")[1]) / 60)) / 24;
            var ed = (parseFloat(item2.end.split(":")[0]) + (parseFloat(item2.end.split(":")[1]) / 60)) / 24;
            var diff = ed - st;

            var st_tot = Math.round(ttlength * st);
            var wd_tot = Math.round(ttlength * diff);

            var localeStart = moment(item2.start, "HH:mm");
            var localeEnd = moment(item2.end, "HH:mm");

            $('#timetable-' + index + '-items').append('<div id="' + index2 + '" class="timetable-item" style="left: ' + st_tot + 'px;width:' + wd_tot + 'px;"><span>' + localeStart.format("LT") + '<br />' + localeEnd.format("LT") + '</span></div>');
        });
    });


    if (teacherData.rating != -1) {
        $("#ti-rating").html(`<div class="star-rating" data-rating="` + round1dec(teacherData.rating) + `"></div>`);
        $("#ti-rating").css("display", "flex");

        $("#rating-big").html(`${round1dec(teacherData.rating)} <small>/ 5</small>`);
        $("#rating-big").css("display", "unset");
    }


    if (reviews.length != 0) {
        reviews.forEach(function (review) {
            var date = moment.utc(review.createdAt);
            $("#ti-reviews").append(`<li>
                                        <div class="boxed-list-item">
                                            <div class="item-content">
                                                <div class="item-details margin-top-10">
                                                    <div class="star-rating" data-rating="${review.rating}"></div>
                                                    <div class="detail-item"><i class="icon-material-outline-school"></i> ${subjectData[review.subject]}</div>
                                                    <div class="detail-item"><i class="icon-material-outline-date-range"></i> ` + date.utcOffset(UTCOffset).format("LL") + `</div>
                                                </div>
                                                <div class="item-description">
                                                    <p>${review.text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </li>`);
        });

    } else {
        $("#ti-reviews").html('<div class="notification notice" style="display:block;margin-bottom: -30px;"><p>' + $.i18n("_bstr.teacher.nofeedback") + '</p></div><br/>');
    }


    $("#ti-reviews-headline").text($("#ti-reviews-headline").text() + " (" + teacherData.ratingsAgg.total + ")");

    $("#rating-bar-five .rating-amount").html("(" + teacherData.ratingsAgg.five + ")");
    $("#rating-bar-five .rating-bar>div").css("width", (teacherData.ratingsAgg.five / teacherData.ratingsAgg.total) * 100 + "%");
    if (teacherData.ratingsAgg.five != 0) { $("#rating-bar-five ").removeClass("inactive"); }

    $("#rating-bar-four .rating-amount").html("(" + teacherData.ratingsAgg.four + ")");
    $("#rating-bar-four .rating-bar>div").css("width", (teacherData.ratingsAgg.four / teacherData.ratingsAgg.total) * 100 + "%");
    if (teacherData.ratingsAgg.four != 0) { $("#rating-bar-four ").removeClass("inactive"); }

    $("#rating-bar-three .rating-amount").html("(" + teacherData.ratingsAgg.three + ")");
    $("#rating-bar-three .rating-bar>div").css("width", (teacherData.ratingsAgg.three / teacherData.ratingsAgg.total) * 100 + "%");
    if (teacherData.ratingsAgg.three != 0) { $("#rating-bar-three ").removeClass("inactive"); }

    $("#rating-bar-two .rating-amount").html("(" + teacherData.ratingsAgg.two + ")");
    $("#rating-bar-two .rating-bar>div").css("width", (teacherData.ratingsAgg.two / teacherData.ratingsAgg.total) * 100 + "%");
    if (teacherData.ratingsAgg.two != 0) { $("#rating-bar-two ").removeClass("inactive"); }

    $("#rating-bar-one .rating-amount").html("(" + teacherData.ratingsAgg.one + ")");
    $("#rating-bar-one .rating-bar>div").css("width", (teacherData.ratingsAgg.one / teacherData.ratingsAgg.total) * 100 + "%");
    if (teacherData.ratingsAgg.one != 0) { $("#rating-bar-one ").removeClass("inactive"); }


    starRating('.star-rating');
    i18n_updatePrices();
}
loadteacher();



function updateSlider() {
    var txt = '<select class="selectpicker" id="ti-duration">';

    $.each(teacherData.subjects[selectedSubject].tf, function (index, value) {
        if (value <= 0) {
            return;
        }

        txt += `<option value="${index}">${index} ${$.i18n('_bstr.general.minutes')}</option>`;
    });

    txt += '</select>';

    $('#ti-duration-container').html(txt);
    $('#ti-duration').selectpicker();
    $('#ti-duration').selectpicker("val", "45");


    $('#ti-duration').change(function () {
        var price = teacherData.subjects[selectedSubject].tf[$(this).val()];

        if (typeof (uData) != "undefined") {
            if (ctd_active && uData.specialOfferLeft > 0 && ((teacherData.isSpecialOffer && uData.specialOfferTutor == teacherData._id) || (teacherData.isSpecialOffer && uData.specialOfferTutor == ""))) {
                price = 0;
            }
        } else {
            if (ctd_active && teacherData.isSpecialOffer) {
                price = 0;
            }
        }


        $("#ti-booking-price").html('<span data-currency-converted="' + price + '"></span>');
        i18n_updatePrices();

        var seldate = moment($('#ti-dateselect-container').datepicker("getDate"));
        var day = numberToWeekday[seldate.day()];
        if (day != undefined && day != "") {
            calculateAvailableTimes(day);
        }
        checkBookingCompletion();
    });


    calculateAvailableTimes();
    checkBookingCompletion();


    // check if params in URL and set booking panel
    var urlVars = getUrlVars();
    if (urlVars.booking != undefined) {
        $("#ti-subjectselect").selectpicker("val", urlVars.booking);
        $("#ti-duration").selectpicker("val", urlVars.duration);
        $('#ti-dateselect-container').datepicker('setDate', urlVars.date);
        $("#ti-timeselect").selectpicker("val", urlVars.time);

        checkBookingCompletion(true);
    }
}

function calculateAvailableTimes() {
    var date = moment($('#ti-dateselect-container').datepicker("getDate"));
    var duration = parseInt($("#ti-duration").val());

    var weekday = numberToWeekday[date.day()];
    if (date == undefined || date == "") {
        return;
    }

    timetableBlocks = teacherData.timetable[weekday];
    var currentf = parseInt($("#ti-duration").val());

    var options = "";
    var totalElements = 0;
    var optionsArray = [];


    $.each(timetableBlocks, function (index, item) {
        startmin = parseInt(item.start.split(":")[0] * 60) + parseInt(item.start.split(":")[1]);
        endmin = parseInt(item.end.split(":")[0] * 60) + parseInt(item.end.split(":")[1]);
        if (endmin == 1439) { endmin++; }

        var tfmins = endmin - startmin - duration;
        var timeframe = ((endmin - startmin) / 15) - (currentf / 15);

        var counter = 0;
        while (timeframe >= 0) {
            var mins = counter * 15 + startmin;
            var minsend = mins + currentf;

            if (minsend > endmin) {
                counter++;
                timeframe--;
                continue;
            }

            var n = new Date(0, 0);
            n.setSeconds(+mins * 60);
            var finmin = n.toTimeString().slice(0, 5);

            var n = new Date(0, 0);
            n.setSeconds(+minsend * 60);
            var finendmin = n.toTimeString().slice(0, 5);

            var start_datetime = moment(date.format('DD.MM.YYYY') + " " + finmin, "DD.MM.YYYY HH:mm").utc().utcOffset(UTCOffset).unix();
            var end_datetime = moment(date.format('DD.MM.YYYY') + " " + finendmin, "DD.MM.YYYY HH:mm").utc().utcOffset(UTCOffset).unix();


            var skip = false;

            bookedTimes.forEach(function (value) {
                var bookedbeginning = moment.utc(value.starttime).unix();
                var bookedend = moment.utc(value.endtime).unix();

                if ((bookedbeginning >= start_datetime && bookedbeginning < end_datetime) || (bookedend > start_datetime && bookedend <= end_datetime)) {
                    skip = true;
                    return;
                }
            });


            if (!skip) {
                totalElements++;
                optionsArray.push({ start: finmin, end: finendmin });
                //options += '<option value="' + finmin + '">' + finmin + ' - ' + finendmin + '</option>';
            }

            counter++;
            timeframe--;
        }
    });


    optionsArray.sort(function (a, b) {
        var aa = a.start.split(":")[0] * 60 + a.start.split(":")[1];
        var bb = b.start.split(":")[0] * 60 + b.start.split(":")[1];
        return aa - bb;
    });
    $.each(optionsArray, function (i, value) {
        var start_moment = moment.utc(value.start, "HH:mm").format("LT");
        var end_moment = moment.utc(value.end, "HH:mm").format("LT");
        options += '<option value="' + value.start + '">' + start_moment + ' - ' + end_moment + '</option>';
    });


    if (totalElements == 0) {
        var timeselect = '<select class="selectpicker" id="ti-timeselect" title="' + $.i18n("_bstr.teacher.notime") + '" data-size="5" data-live-search="false" data-dropup-auto="false"> ' + options + '</select>';
        $("#ti-timeselect-container").html(timeselect);
        $("#ti-timeselect").selectpicker("val", -1);
    } else {
        var timeselect = '<select class="selectpicker" id="ti-timeselect" title="' + $.i18n("_bstr.teacher.selectTime") + '" data-size="5" data-live-search="false" data-dropup-auto="false"> ' + options + '</select>';
        $("#ti-timeselect-container").html(timeselect);
        $("#ti-timeselect").selectpicker("val", optionsArray[0].start);
    }

    checkBookingCompletion();
}

function checkBookingCompletion(redirect = false) {
    $("#continue-booking-btn").html($.i18n("_bstr.teacher.btn-continue-booking"));

    var intready = true;
    if (selectedSubject == null || selectedSubject == "") {
        intready = false;
    }

    var time = $("#ti-timeselect").selectpicker("val");
    if (time == undefined || time == -1) {
        intready = false;
    }

    if ($('#ti-dateselect-container').datepicker("getDate") == null) {
        intready = false;
    }

    // check price
    var price = teacherData.subjects[$("#ti-subjectselect").selectpicker("val")].tf[parseInt($("#ti-duration").val())];


    if (typeof (uData) == "undefined") {
        if (ctd_active && teacherData.isSpecialOffer) {
            price = 0;
        }
        $("#continue-booking-btn").removeClass("gray");
        $("#continue-booking-btn").removeClass("disabled");

        if (price == 0) {
            $("#continue-booking-btn").html($("#continue-booking-btn").text() + ' (<span>' + $.i18n('_bstr.general.free') + '</span>)');
        } else {
            $("#continue-booking-btn").html($("#continue-booking-btn").text());
            i18n_updatePrices();
        }
        return;
    }



    if (ctd_active && uData.specialOfferLeft > 0 && ((teacherData.isSpecialOffer && uData.specialOfferTutor == teacherData._id) || (teacherData.isSpecialOffer && uData.specialOfferTutor == ""))) {
        price = 0;
    }

    /*if (price > uData.balance) {
        intready = false;
        $("#continue-booking-btn").html($.i18n("_bstr.teacher.insufficientBalance") + ' ');
    }*/

    /*if (intready == false && uData.balance > price) {
        $("#continue-booking-btn").addClass("gray");
        $("#continue-booking-btn").addClass("disabled");
    } else {*/
    $("#continue-booking-btn").removeClass("gray");
    $("#continue-booking-btn").removeClass("disabled");

    if (redirect) {
        setTimeout(function () {
            $("#continue-booking-btn").click();
        }, 50);
    }
    //}

    ready = intready;
}

$("#continue-booking-btn").on("click", async function () {
    if (typeof (uData) == "undefined") {
        $('#floating-login-model-link').click();

        var date = moment($('#ti-dateselect-container').datepicker("getDate"));

        var bookingRequest = {};
        bookingRequest.subject = $("#ti-subjectselect").selectpicker("val");
        bookingRequest.tf = $("#ti-duration").val();
        bookingRequest.date = date.format("YYYY-MM-DD");
        bookingRequest.time = moment($("#ti-timeselect").selectpicker("val"), "HH:mm").format("HH:mm");
        bookingRequest.price = teacherData.subjects[$("#ti-subjectselect").selectpicker("val")].tf[parseInt($("#ti-duration").val())];
        bookingRequest.tid = teacherData._id;
        bookingRequest.tz = moment().utcOffset();

        setLocalStorage('peakesl_booking_request_' + teacherData._id, JSON.stringify(bookingRequest), 3);
        $("#redirect").val("/teacher/" + teacherData._id + '/book/');

        //var url = '/teacher/60439fc3b8eb841b080180ae/?booking=' + $('#ti-subjectselect').val() + "&duration=" + $('#ti-duration').val() + "&date=" + moment($('#ti-dateselect-container').datepicker("getDate")).format('DD.MM.YYYY') + "&time=" + $('#ti-timeselect').val();
        //window.location.href = '/login/?redirect=' + encodeURIComponent(url);
        return;
    }


    var price = teacherData.subjects[$("#ti-subjectselect").selectpicker("val")].tf[parseInt($("#ti-duration").val())];

    if (ctd_active && uData.specialOfferLeft > 0 && ((teacherData.isSpecialOffer && uData.specialOfferTutor == teacherData._id) || (teacherData.isSpecialOffer && uData.specialOfferTutor == ""))) {
        price = 0;
    }

    if (ready) {
        var date = moment($('#ti-dateselect-container').datepicker("getDate"));
        var subjectLoc = subjectData[$("#ti-subjectselect").selectpicker("val")];
        var time = moment($("#ti-timeselect").selectpicker("val"), "HH:mm");

        $("#ti-confirmation-subject").html(subjectLoc);
        $("#ti-confirmation-tf").html($("#ti-duration").val() + " " + $.i18n("_bstr.general.minutes"));
        $("#ti-confirmation-date").html(date.utc().utcOffset(UTCOffset).format("LL"));
        $("#ti-confirmation-time").html(time.format("LT"));

        var price_eur = await i18n_cc(price);
        $("#ti-confirmation-price").html(price_eur + '<small class="subprice" style="font-weight:normal">(<span data-currency-converted="' + price + '"></span>)</small>');

        if (price == 0) {
            $("#ti-confirmation-price").html('<mark class="green">' + $.i18n('_bstr.general.free') + '</mark>');
        }

        i18n_updatePrices();

        var date = moment($('#ti-dateselect-container').datepicker("getDate"));

        var bookingRequest = {};
        bookingRequest.subject = $("#ti-subjectselect").selectpicker("val");
        bookingRequest.tf = $("#ti-duration").val();
        bookingRequest.date = date.format("YYYY-MM-DD");
        bookingRequest.time = moment($("#ti-timeselect").selectpicker("val"), "HH:mm").format("HH:mm");
        bookingRequest.price = teacherData.subjects[$("#ti-subjectselect").selectpicker("val")].tf[parseInt($("#ti-duration").val())];
        bookingRequest.tid = teacherData._id;
        bookingRequest.tz = moment().utcOffset();

        setLocalStorage('peakesl_booking_request_' + teacherData._id, JSON.stringify(bookingRequest), 3);
        window.location.href = "/teacher/" + teacherData._id + '/book/';

        return;

        $("#panel-booking").hide();
        $("#panel-booking-confirmation").show();
        $('html, body').animate({
            scrollTop: $("#ti-bookingpanel").offset().top - 125
        }, 250);
    }
    /* else if (uData.balance < price) {
            window.location.href = "/balance/";
        }*/
});

function backToEntry() {
    $("#panel-booking-confirmation").hide();
    $("#panel-booking").show();
}

async function sendBookingOrder() {
    var date = moment($('#ti-dateselect-container').datepicker("getDate"));

    var bookingRequest = {};
    bookingRequest.subject = $("#ti-subjectselect").selectpicker("val");
    bookingRequest.tf = $("#ti-duration").val();
    bookingRequest.date = date.format("YYYY-MM-DD");
    bookingRequest.time = moment($("#ti-timeselect").selectpicker("val"), "HH:mm").format("HH:mm");
    bookingRequest.price = teacherData.subjects[$("#ti-subjectselect").selectpicker("val")].tf[parseInt($("#ti-duration").val())];
    bookingRequest.tid = teacherData._id;
    bookingRequest.tz = moment().utcOffset();


    try {
        var res = await r('bookingRequest', { request: JSON.stringify(bookingRequest) });
        if (res.status == "success") {

            if (CFG_ENV == "production") {
                gtag('event', 'purchase', {
                    'event_category': 'book_lesson',
                    'event_label': bookingRequest.tid,
                    'value': bookingRequest.price
                });

                fbq('Purchase', { currency: "EUR", value: bookingRequest.price });
            }

            uData.specialOfferLeft--;
            $("#ti-booking-slider").slider("setValue", 1, true, true);
            showSuccess();
        } else {
            showError();
        }
    } catch (error) {
        showError();
    }
}

$("#send-booking").on("click", function () {
    sendBookingOrder();
})

function showError() {
    $("#ti-bookingresult").removeClass("success");
    $("#ti-bookingresult").addClass("error");
    $("#ti-bookingresult-icon").removeClass("icon-feather-check");
    $("#ti-bookingresult-icon").addClass("icon-feather-x");
    $("#ti-bookingresult-headline").html($.i18n("_bstr.teacher.booking.error.headline"));
    $("#ti-bookingresult-text").html($.i18n("_bstr.teacher.booking.error.text"));

    $("#ti-bookingpanel").hide("fast");
    $("#ti-bookingresult").show("fast");
    $('html, body').animate({
        scrollTop: $("#ti-bookingpanel").offset().top - 125
    }, 250);


    setTimeout(function () {
        $("#panel-booking").show();
        $("#panel-booking-confirmation").hide();
        $("#ti-bookingresult").fadeOut("fast");
        $("#ti-bookingpanel").fadeIn("fast");
    }, 7500);
}

function showSuccess() {
    $("#ti-bookingresult").removeClass("error");
    $("#ti-bookingresult").addClass("success");
    $("#ti-bookingresult-icon").addClass("icon-feather-check");
    $("#ti-bookingresult-icon").removeClass("icon-feather-x");
    $("#ti-bookingresult-headline").html($.i18n("_bstr.teacher.booking.headline"));
    $("#ti-bookingresult-text").html($.i18n("_bstr.teacher.booking.text"));

    $("#ti-bookingpanel").hide("fast");
    $("#ti-bookingresult").show("fast");
    $('html, body').animate({
        scrollTop: $("#ti-bookingpanel").offset().top - 125
    }, 250);

    setTimeout(function () {
        $("#panel-booking").show();
        $("#panel-booking-confirmation").hide();
        $("#ti-bookingresult").fadeOut("fast");
        $("#ti-bookingpanel").fadeIn("fast");
    }, 7500);
}



__analytics_tp_view();
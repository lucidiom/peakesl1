var stripe = Stripe(STRIPE_PUBLIC_KEY);
var bookingRequest = {}

try {
    ttq.track('AddToCart');
} catch (error) {
}

var rawRequest = getLocalStorage('brainstr_booking_request_' + teacherData._id);
if (typeof (rawRequest) == "undefined") {
    window.location.href = '/teacher/' + teacherData._id + "/";
}
if (rawRequest == null || rawRequest == "") {
    window.location.href = '/teacher/' + teacherData._id + "/";
}
bookingRequest = JSON.parse(rawRequest);
bookingRequest.paymentMethod = "credit";
bookingRequest.roundUp = true;
bookingRequest.fee = 0;
bookingRequest.donation = 0;

var date = moment(bookingRequest.date + " " + bookingRequest.time, "YYYY-MM-DD HH:mm");
$('#lesson-info').html(`<b>${bookingRequest.tf} ${$.i18n('_bstr.general.minutes')} ${subjectData[bookingRequest.subject]}</b><br><small>${date.format('ll')} ${date.format('LT')}</small>`);

$('#lesson-cost').data('currency', bookingRequest.price);
$('#total-cost').data('currency', bookingRequest.total);
$('#total-cost-converted').data('currency-converted', bookingRequest.total);
i18n_updatePrices();
checkSufficientBalance();

if (getUrlVars()["success"] == "true") {
    showSuccess();
}


async function getPaymentFee(reloadFee = true) {
    if (reloadFee) {
        var data = await r('payment/getPaymentFee', { price: bookingRequest.price, roundUp: true, donation: 0 });
        bookingRequest.fee = data.fee;
        bookingRequest.total = data.total;
        bookingRequest.donation = data.donation;
    }

    $("#social-donation").data("currency", bookingRequest.donation);
    $("#processing-fee").data("currency", bookingRequest.fee);
    $('#total-cost').data('currency', bookingRequest.total);
    $('#total-cost-converted').data('currency-converted', bookingRequest.total);
    i18n_updatePrices();

    checkSufficientBalance();

    $("#btn-ctn").css('display', 'flex');
}
getPaymentFee();

function checkSufficientBalance() {
    if (bookingRequest.paymentMethod == "brainstr_social") {
        return;
    }

    if (uData.balance >= bookingRequest.total) {
        $("#payment-method-balance").removeClass("inactive");
    } else {
        $("#payment-method-balance").addClass("inactive");
    }
}

$("#terms").on("change", function () {
    if ($(this).is(":checked")) {
        $("#send-booking").removeClass("gray");
        $("#send-booking").addClass("button-green");
    } else {
        $("#send-booking").removeClass("button-green");
        $("#send-booking").addClass("gray");
    }
})

$('.payment-method').on("click", function () {
    if ($(this).hasClass("inactive")) {
        return;
    }

    $('.payment-method').removeClass('active');
    $(this).addClass('active');
    bookingRequest.paymentMethod = $(this).data('payment');

    if (bookingRequest.paymentMethod == "balance" || bookingRequest.paymentMethod == "brainstr_social") {
        bookingRequest.donation = 0;
        bookingRequest.total = bookingRequest.price + bookingRequest.donation;
        bookingRequest.fee = 0;
        getPaymentFee(false);
        $("#btn-ctn").text($.i18n("_bstr.book.book"));
    } else {
        getPaymentFee();
        $("#btn-ctn").text($.i18n("_bstr.book.continue"));
    }

    if (bookingRequest.paymentMethod == "brainstr_social") {
        bookingRequest.donation = -1 * bookingRequest.price;
        bookingRequest.total = 0;
        getPaymentFee(false);
    }
})

$("#btn-ctn").on("click", function () {
    switch (bookingRequest.paymentMethod) {
        case "balance":
            payByBalance();
            break;

        case "credit":
            createStripePayment();
            break;

        case "brainstr_social":
            payByBalance();
            break;

        default:
            createStripePayment();
    }
});


async function createStripePayment() {
    try {
        var session = await r('payment/stripe/createSinglePayment', bookingRequest);

        if (session.status != undefined) {
            if (session.status == "error") {
                console.log(session);
                alert($.i18n('_bstr.balance.error.general'));
                return;
            }
        }

        try {
            ttq.track('InitiateCheckout');
        } catch (error) {
        }

        await stripe.redirectToCheckout({
            sessionId: session.id
        });

    } catch (error) {
        alert($.i18n('_bstr.balance.error.general'));
    }
}

async function payByBalance() {
    try {
        var res = await r('bookingRequest', { request: JSON.stringify(bookingRequest) });

        console.log(res);
        if (res.status == "success") {
            showSuccess();

            try {
                ttq.track('CompletePayment');
            } catch (error) {
            }
        } else {
            alert($.i18n('_bstr.balance.error.general'));
        }
    } catch (error) {
        console.log(error);
        alert($.i18n('_bstr.balance.error.general'));
    }
}

$("#btn-complete").on("click", function () {
    window.location.href = "/teacher/" + teacherData._id + "/";
});

function showSuccess() {
    if (CFG_ENV == "production") {
        gtag('event', 'purchase', {
            'event_category': 'book_lesson',
            'event_label': bookingRequest.tid,
            'value': bookingRequest.total
        });

        fbq('Purchase', { currency: "EUR", value: bookingRequest.total });
    }


    var date = moment(bookingRequest.date + " " + bookingRequest.time, "YYYY-MM-DD HH:mm");
    $("#panel-success>h3").text($.i18n('_bstr.book.confirmation.headline', date.format("LL"), date.format("LT")));

    $("#panel-pay").hide();
    $("#panel-success").show();

    setLocalStorage('brainstr_booking_request_' + teacherData._id, "", -1);
}
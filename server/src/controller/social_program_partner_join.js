var stripe = Stripe(STRIPE_PUBLIC_KEY);
$('.input-contribution>span').text(i18n_currency.toUpperCase());

$('.input-contribution>input').on("input", function () {
    updateLessonCounter();
})

$("#monthly").on("change", function () {
    updateLessonCounter();
})

function updateLessonCounter() {
    var val = $('.input-contribution>input').val();
    var eur = val / EXCHANGE_RATES[i18n_currency.toUpperCase()];

    var lessons = Math.ceil(eur / 1.2);

    if ($("#monthly").is(":checked")) {
        $('#lesson-counter').html($.i18n('_bstr.social.contribution.msg-monthly', '<b>', lessons, '</b>'));
    } else {
        $('#lesson-counter').html($.i18n('_bstr.social.contribution.msg', '<b>', lessons, '</b>'));
    }
}

async function setAmount(value) {
    var price = (value * EXCHANGE_RATES[i18n_currency.toUpperCase()]).toFixed(0);
    $('.input-contribution>input').val(price);
    updateLessonCounter();
}
setAmount(10);


$('#btn-submit').on("click", async function () {
    try {
        var price = $('.input-contribution>input').val();
        var eur = Math.ceil(price / EXCHANGE_RATES[i18n_currency.toUpperCase()]).toFixed(2);

        var session = await r('payment/stripe/createContributionPayment', {
            amount: eur,
            currency: i18n_currency,
            type: $("#monthly").is(":checked") ? "subscription" : "payment"
        });

        if (session.status != undefined) {
            if (session.status == "error") {
                alert($.i18n('_bstr.balance.error.general'));
                return;
            }
        }

        await stripe.redirectToCheckout({
            sessionId: session.id
        });

    } catch (error) {
        alert($.i18n('_bstr.balance.error.general'));
    }
});
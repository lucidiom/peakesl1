var params = getUrlVars();
if ('success' in params) {
    showNotification('<strong>' + $.i18n('_bstr.balance.purchase.successful', '</strong>'), "success");

    if (CFG_ENV == "production") {
        gtag('event', 'checkout_progress', {
            'event_label': 'success'
        });
    }
} else if ('cancel' in params) {
    showNotification($.i18n('_bstr.balance.purchase.cancelled'), "notice");

    if (CFG_ENV == "production") {
        gtag('event', 'checkout_progress', {
            'event_label': 'cancelled'
        });
    }
}


var rates = {};
var topUpBalance = 100;
var stripe = Stripe(STRIPE_PUBLIC_KEY);


$("#payout-slider").slider({
    min: 20,
    max: parseFloat(uData.balance),
    step: 5,
    value: 20,
    formatter: function (value) {
        return value + "€";
    }
});




async function loadTransactions() {
    transactions.forEach(async function (transaction) {
        var time = moment.utc(transaction.createdAt);
        var statusClass = transaction.status == "blocked" ? "payment-pending" : "paid";
        var sign = "-";

        var amount = transaction.amount;
        if (transaction.rxid == uData._id) {
            sign = "";
            if (transaction.type != "deposit") {
                amount = transaction.amount - (isNaN(transaction.fee) ? 0 : transaction.fee);
            }
        }

        $("#transactions-list").prepend(`
            <li>
                <div class="invoice-list-item">
                    <strong>${transactionType[transaction.type]}</strong>
                        <ul>
                            <li><span class="${statusClass}"> ${transactionStatus[transaction.status]}</span></li>
                            <li>${sign}<span data-currency="${amount}"></span> <small class="subprice">(<span data-currency-converted="${amount}"></span>)</small></li>
                            <li>${$.i18n('_bstr.general.date')}: ${time.utcOffset(UTCOffset).format("ll")}</li>
                        </ul>
                    </div>
                <div class="buttons-to-right">
                    <a onclick="openTransactionDetails('${transactions.indexOf(transaction)}');" class="button gray">${$.i18n('_bstr.general.details')}</a>
                </div>
            </li>`);
    });

    i18n_updatePrices();
}

async function openTransactionDetails(id) {
    var date = moment(transactions[id].createdAt);
    var sign = "-";

    var points = transactions[id].amount;
    if (transactions[id].rxid == uData._id) {
        sign = "";
        if (transactions[id].type != "deposit") {
            points = transactions[id].amount - (isNaN(transactions[id].fee) ? 0 : transactions[id].fee);
        }
    }

    points = await i18n_cc(points);

    if (transactions[id].type != "deposit") {
        $("#receipt-col").hide();
    } else {
        $("#receipt-col").show();
    }

    $("#td-status").removeClass("paid");
    $("#td-status").removeClass("payment-pending");
    $("#td-status").addClass(transactions[id].status == "blocked" ? "payment-pending" : "paid");

    $("#td-status").text(transactionStatus[transactions[id].status]);

    $("#td-id").text(transactions[id]._id);
    $("#td-points").text(sign + points);
    $("#td-type").text(transactionType[transactions[id].type]);
    $("#td-date").text(date.utc().utcOffset(UTCOffset).format("lll"));

    $("#td-receipt-link").attr("href", "/receipt/" + transactions[id]._id);

    $("#balance-dialog-transactiondetails-link").click();
}

async function initCheckout() {
    if (CFG_ENV == "production") {
        gtag('event', 'begin_checkout', {
            'event_category': 'Deposit_Amount',
            'value': topUpBalance
        });
        fbq('track', 'InitiateCheckout', { value: topUpBalance });
    }

    if (i18n_currency == "rub") {
        //createYookassaPayment();
        createStripePayment();
    } else {
        createStripePayment();
    }
}

async function createStripePayment() {
    try {
        var session = await r('payment/stripe/createPayment', { amount: topUpBalance });

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
}

async function createYookassaPayment() {
    try {
        var session = await r('payment/yookassa/createPayment', { amount: topUpBalance });
        console.log(session);
        if (session.status != "ok") {
            throw Error;
        }
        window.location.href = session.data.confirmation.confirmation_url;
    } catch (error) {
        alert($.i18n('_bstr.balance.error.general'));
    }
}

async function sendPayoutRequest() {
    var method = $("#payout-check-sepa").prop("checked") ? "SEPA" : "PAYPAL";
    var iban = $("#payout-iban").val();
    var bic = $("#payout-bic").val();
    var paypal = $("#payout-paypalmail").val();
    var points = $("#payout-slider").val();

    if (method == "SEPA" && (iban.length < 5 || bic.length < 6)) {
        showNotification($.i18n('_bstr.balance.error.payout.missing'), "error");
        scrollTop();
        return;
    }
    if (method == "PAYPAL" && paypal.length < 3) {
        showNotification($.i18n('_bstr.balance.error.payout.missing'), "error");
        scrollTop();
        return;
    }

    try {
        var res = await r('payoutRequest', {
            method: method,
            paypal: paypal,
            iban: iban,
            bic: bic,
            points: points
        });

        if (res.status == "ok") {
            $("#payout-iban").val("");
            $("#payout-bic").val("");
            $("#payout-paypal").val("");
            $("#payout-panel").fadeOut();
            showNotification($.i18n('_bstr.balance.success.payout'), "success");
            scrollTop();
        } else {
            showNotification($.i18n('_bstr.balance.error.general'), "error");
            scrollTop();
        }

    } catch (error) {
        console.log(error);
        showNotification($.i18n('_bstr.balance.error.general'), "error");
        scrollTop();
    }
}


$("#payout-btn").on("click", function () {
    $("#payout-panel").fadeIn();
    scrollTop();
});

$("#payout-check-sepa").on("click", function () {
    $("#payout-sepa").show();
    $("#payout-paypal").hide();
    $('#payout-check-paypal').prop("checked", false);
});

$("#payout-check-paypal").on("click", function () {
    $("#payout-paypal").show();
    $("#payout-sepa").hide();
    $('#payout-check-sepa').prop("checked", false);
});

$("#proceed-to-checkout").on("click", async function () {
    initCheckout();
});

$('#confirm-payout-btn').on("click", function () {
    sendPayoutRequest();
});

loadTransactions();

function changeTopup(value) {
    topUpBalance = value;
    $(".topup-amount-btn").removeClass("selected");
    $("#topup-" + value).addClass("selected");
}
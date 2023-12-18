var i18n_currency = "eur";

var unreadNotificationCount = 0;


function i18_init() {
    var currencyCookie = getCookie("brainstr-c-currency");

    if (currencyCookie != undefined) {
        i18n_currency = currencyCookie;
    } else {
        switch (i18n_locale) {
            case "de":
                i18n_currency = "eur";
                break;
            case "uk":
                i18n_currency = "uah";
                break;
            case "en":
                i18n_currency = "usd";
                break;
            case "ru":
                i18n_currency = "rub";
                break;
            default:
                i18n_currency = "eur";
        }
    }

    if (typeof uData != "undefined") {
        i18n_locale = uData.locale;
        i18n_currency = uData.currency;
    }

    if (CFG_ENV == "production") {
        gtag('set', {
            'language': i18n_locale,
            'currency': i18n_currency
        });
    }

    moment.locale(i18n_locale);
    i18n_changeLanguage(i18n_locale, false);
    i18n_update();

    i18n_updateCurrency(i18n_currency);
    i18n_updatePrices();
}
i18_init();


function i18n_checkValidLang(lang) {
    return lang == "en" || lang == "de" || lang == "ru" || lang == "ua";
}

function i18n_update() {
    var loc_tmp = {};
    //loc_tmp[i18n_locale] = './i18n/' + i18n_locale + '.json';

    loc_tmp[i18n_locale] = i18nTranslations;

    $.i18n().load(loc_tmp).then(function() {
        $.i18n({
            locale: i18n_locale
        });

        $("[data-i18n]").each(function() {
            txt = $.i18n($(this).data("i18n"));
            if (!txt.startsWith("_bstr")) {
                $(this).i18n();
            } else {
                console.error(txt);
            }
        });
    });
}


function i18n_changeLanguage(loc, reload = true) {
    i18n_locale = loc;
    setCookie("brainstr-c-language", i18n_locale, 365);
    $("#i18-language-picker").val(i18n_locale);

    if (reload) {
        location.reload();
    }
}



window.onload = async function() {
    if (typeof uData != "undefined") {
        interpretNotifications();
    }


    i18n_updatePrices();
    $("#i18-language-picker").val(i18n_locale);

    $("#i18-language-picker").on("change", async function() {
        if (typeof uData != "undefined") {
            try {
                await r('updateLocale', { locale: $("#i18-language-picker").val() });
            } catch (error) {
                console.error(error);
            }
        }

        i18n_changeLanguage($("#i18-language-picker").val());
    });


    $("#i18-currency-picker").on("change", async function() {
        if (typeof uData != "undefined") {
            try {
                await r('updateCurrency', { currency: $("#i18-currency-picker").val() });
            } catch (error) {
                console.error(error);
            }
        }

        i18n_updateCurrency($("#i18-currency-picker").val());
    });
};

function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
}

function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/;";
}

function setCookieMinutes(name, value, minutes) {
    var expires = "";
    if (minutes) {
        var date = new Date();
        date.setTime(date.getTime() + (minutes * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/;";
}

async function i18n_cc(price, currency = "eur", prependCurrency = false) {
    switch (currency) {
        case "aud":
            res = prependCurrency ? "$" + parseFloat(price * EXCHANGE_RATES.AUD).toFixed(2) + " AUD" : "$" + parseFloat(price * EXCHANGE_RATES.AUD).toFixed(2);
            break;
        case "cad":
            res = prependCurrency ? "$" + parseFloat(price * EXCHANGE_RATES.CAD).toFixed(2) + " CAD" : "$" + parseFloat(price * EXCHANGE_RATES.CAD).toFixed(2);
            break;
        case "chf":
            res = prependCurrency ? "CHF " + parseFloat(price * EXCHANGE_RATES.CHF).toFixed(2) : parseFloat(price * EXCHANGE_RATES.CHF).toFixed(2) + " fr";
            break;
        case "cny":
            res = prependCurrency ? "CNY" + parseFloat(price * EXCHANGE_RATES.CNY).toFixed(2) : "CN¥" + parseFloat(price * EXCHANGE_RATES.CNY).toFixed(2);
            break;
        case "czk":
            res = prependCurrency ? "CZK " + parseFloat(price * EXCHANGE_RATES.CZK).toFixed(2) : parseFloat(price * EXCHANGE_RATES.CZK).toFixed(2) + " Kč";
            break;
        case "dkk":
            res = prependCurrency ? "DKK " + parseFloat(price * EXCHANGE_RATES.DKK).toFixed(2) : parseFloat(price * EXCHANGE_RATES.DKK).toFixed(2) + " kr";
            break;
        case "gbp":
            res = prependCurrency ? "£" + parseFloat(price * EXCHANGE_RATES.GBP).toFixed(2) + " GBP" : "£" + parseFloat(price * EXCHANGE_RATES.GBP).toFixed(2);
            break;
        case "hkd":
            res = prependCurrency ? "HK$" + parseFloat(price * EXCHANGE_RATES.HKD).toFixed(2) + " HKD" : "HK$" + parseFloat(price * EXCHANGE_RATES.HKD).toFixed(2);
            break;
        case "jpy":
            res = prependCurrency ? "¥" + parseFloat(price * EXCHANGE_RATES.JPY).toFixed(2) + " JPY" : "¥" + parseFloat(price * EXCHANGE_RATES.JPY).toFixed(2);
            break;
        case "nok":
            res = prependCurrency ? "NOK " + parseFloat(price * EXCHANGE_RATES.NOK).toFixed(2) : parseFloat(price * EXCHANGE_RATES.NOK).toFixed(2) + " kr";
            break;
        case "nzd":
            res = prependCurrency ? "$" + parseFloat(price * EXCHANGE_RATES.NZD).toFixed(2) + " NZD" : "$" + parseFloat(price * EXCHANGE_RATES.NZD).toFixed(2);
            break;
        case "rub":
            res = prependCurrency ? "RUB " + parseFloat(Math.ceil(price * EXCHANGE_RATES.RUB / 5) * 5) : parseFloat(Math.ceil(price * EXCHANGE_RATES.RUB / 5) * 5) + " ₽";
            break;
        case "sek":
            res = prependCurrency ? "SEK " + parseFloat(price * EXCHANGE_RATES.SEK).toFixed(2) : parseFloat(price * EXCHANGE_RATES.SEK).toFixed(2) + " kr";
            break;
        case "uah":
            res = prependCurrency ? "₴" + parseFloat(price * EXCHANGE_RATES.UAH).toFixed(2) + " UAH" : "₴" + parseFloat(price * EXCHANGE_RATES.UAH).toFixed(2);
            break;
        case "usd":
            res = prependCurrency ? "$" + parseFloat(price * EXCHANGE_RATES.USD).toFixed(2) + " USD" : "$" + parseFloat(price * EXCHANGE_RATES.USD).toFixed(2);
            break;
        case "zar":
            res = prependCurrency ? "R " + parseFloat(price * EXCHANGE_RATES.ZAR).toFixed(2) + " ZAR" : "R " + parseFloat(price * EXCHANGE_RATES.ZAR).toFixed(2);
            break;
        default:
            res = prependCurrency ? "EUR " + parseFloat(price).toFixed(2) : parseFloat(price).toFixed(2) + "€";
    }
    return res;
}

function i18n_updatePrices() {
    $("[data-currency]").each(async function() {
        var price = parseFloat($(this).data('currency'));
        priceFormat = await i18n_cc(price);
        $(this).text(priceFormat);
    });

    $("[data-currency-converted]").each(async function() {
        var price = parseFloat($(this).data('currency-converted'));
        priceFormat = await i18n_cc(price, i18n_currency);
        $(this).text(priceFormat);
    });
}

function i18n_updateCurrency(currency) {
    i18n_currency = currency;

    setCookie("brainstr-c-currency", i18n_currency, 365);
    $("#i18-currency-picker").val(i18n_currency);

    i18n_updatePrices();
}

async function resetNotifications() {
    var res = await r('resetNotifications');
    $("#notifications-container").html("");
    $("#notification-btn").html('<i class="icon-feather-bell"></i>');
    $("#notification-btn").click();
}

function interpretNotifications() {
    if (typeof(notifications) == "undefined") {
        return;
    }

    $.each(notifications, async function(i, notification) {
        addNotification(notification);
    });

    i18n_updatePrices();


    if (notifications.length == 0) {
        $("#notifications-container").append(`<li class="notifications-not-read" id="notification-none">
                                                <a href="javascript:void(0);">
                                                    <span class="notification-text">${$.i18n("_bstr.notification.none")}</span>
                                                </a>
                                            </li>`);
    }
}

function addNotification(notification) {
    var time = moment.utc(notification.createdAt);
    time = time.utc().utcOffset(UTCOffset).format("lll");

    var text = "";

    switch (notification.type) {
        case "lesson_requested":
            text = $.i18n('_bstr.notification.lesson_requested', '<strong>' + notification.name + '</strong>');
            break;
        case "lesson_rejected":
            text = $.i18n('_bstr.notification.lesson_rejected', '<strong>' + notification.name + '</strong>');
            break;
        case "lesson_accepted":
            text = $.i18n('_bstr.notification.lesson_accepted', '<strong>' + notification.name + '</strong>');
            break;
        case "lesson_cancelled":
            text = $.i18n('_bstr.notification.lesson_cancelled', '<strong>' + notification.name + '</strong>');
            break;
        case "lesson_confirmed":
            text = $.i18n('_bstr.notification.lesson_confirmed', '<strong>' + notification.name + '</strong>', '<strong data-currency-converted="' + notification.price + '"></strong>');
            break;
        default:
            return;
    }


    $("#notifications-container").append(`<li class="notifications-not-read">
                                            <a href="javascript:void(0);" onclick="openNotification('${notification._id}', '${notification.link}')">
                                                <span class="notification-text">${text}</span>
                                                <span class="notification-date">${time}</span>
                                            </a>
                                        </li>`);

    unreadNotificationCount++;
}

async function openNotification(id, link) {
    await r('readNotification', { id: id });
    window.location.href = link;
}
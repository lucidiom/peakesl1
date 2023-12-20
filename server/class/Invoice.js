require('dotenv').config({
    path: process.cwd() + '/../'
});

const { readFile } = require("fs");
const fs = require('fs');
const { promisify } = require('util');
const readFs = promisify(readFile);

const html_to_pdf = require('html-pdf-node');

const moment = require('moment');


exports.replaceAll = (str, find, replace) => {
    return str.replace(new RegExp(find, 'g'), replace);
}

exports.readFile = async (file) => {
    return readFs(process.cwd() + '/data/' + file, { encoding: "utf8" });
}

exports.createDepositInvoice = async (data) => {
    /*var data = {
        locale: "en",
        tid: "xxx",
        uid: "yyy",
        date: "2021-03-03",
        firstname: "Dieter",
        lastname: "Senf",
        line1: "Zeichenweg 7",
        line2: "",
        zip: "50974",
        city: "Weicheneisen",
        amount_credits: 124.58,
        fee: 5.14,
        tax: 0,
        amount: 129.72,
        currency: "rub"
    }; */

    var exchangeRates = await this.readFile('rates.json');
    exchangeRates = JSON.parse(exchangeRates);

    var content = await this.readFile('invoice/invoice_' + data.locale + '.html');

    var date = moment.utc(data.date);

    content = this.replaceAll(content, "%tid%", data.tid);
    content = this.replaceAll(content, "%uid%", data.uid);
    content = this.replaceAll(content, "%date%", date.format("LLL"));

    content = this.replaceAll(content, "%firstname%", data.firstname);
    content = this.replaceAll(content, "%lastname%", data.lastname);
    content = this.replaceAll(content, "%line1%", data.line1 == null ? "" : data.line1);
    content = this.replaceAll(content, "%line2%", data.line2 == null ? "" : data.line2);
    content = this.replaceAll(content, "%zip%", data.zip == null ? "" : data.zip);
    content = this.replaceAll(content, "%city%", data.city == null ? "" : data.city);


    content = this.replaceAll(content, "%amount-credits%", this.getDisplayConvertedPrice(data.amount_credits, "EUR", {}));
    content = this.replaceAll(content, "%fee%", this.getDisplayConvertedPrice(data.fee, "EUR", {}));
    content = this.replaceAll(content, "%tax%", this.getDisplayConvertedPrice(data.tax, "EUR", {}));
    content = this.replaceAll(content, "%amount%", this.getDisplayConvertedPrice(data.amount, "EUR", {}));

    content = this.replaceAll(content, "%amount-credits-converted%", this.getDisplayConvertedPrice(data.amount_credits, data.currency, exchangeRates));
    content = this.replaceAll(content, "%fee-converted%", this.getDisplayConvertedPrice(data.fee, data.currency, exchangeRates));
    content = this.replaceAll(content, "%tax-converted%", this.getDisplayConvertedPrice(data.tax, data.currency, exchangeRates));
    content = this.replaceAll(content, "%amount-converted%", this.getDisplayConvertedPrice(data.amount, data.currency, exchangeRates));

    if (data.currency == "eur") {
        content = this.replaceAll(content, "%exchange-rate%", "1.000");
    } else {
        content = this.replaceAll(content, "%exchange-rate%", exchangeRates[data.currency.toUpperCase()]);
    }

    content = this.replaceAll(content, "%currency%", data.currency.toUpperCase());

    await this.createPDF(data.tid, data.locale, content);
}


exports.createPDF = async (tid, locale, content) => {
    var options = {
        format: 'A4',
        scale: 0.8
    };

    try {
        await fs.promises.access(process.cwd() + '/data/invoice/archive/');
    } catch (error) {
        await fs.promises.mkdir(process.cwd() + '/data/invoice/archive/', { recursive: true });
    }

    var pdfBuffer = await html_to_pdf.generatePdf({ content: content }, options);
    await fs.promises.writeFile(process.cwd() + '/data/invoice/archive/PeakESL_invoice_' + tid + '.pdf', pdfBuffer);
}


exports.getDisplayConvertedPrice = (price, currency, rates) => {
    switch (currency) {
        case "aud":
            res = "$" + parseFloat(price * rates["AUD"]).toFixed(2) + " AUD";
            break;
        case "cad":
            res = "$" + parseFloat(price * rates["CAD"]).toFixed(2) + " CAD";
            break;
        case "chf":
            res = parseFloat(price * rates["CHF"]).toFixed(2) + " CHF";
            break;
        case "cny":
            res = parseFloat(price * rates["CNY"]).toFixed(2) + " CNY";
            break;
        case "czk":
            res = parseFloat(price * rates["CZK"]).toFixed(2) + " CZK";
            break;
        case "dkk":
            res = parseFloat(price * rates["DKK"]).toFixed(2) + " DKK";
            break;
        case "gbp":
            res = "£" + parseFloat(price * rates["GBP"]).toFixed(2);
            break;
        case "hkd":
            res = "HK$" + parseFloat(price * rates["HKD"]).toFixed(2);
            break;
        case "jpy":
            res = "¥" + parseFloat(price * rates["JPY"]).toFixed(2);
            break;
        case "nok":
            res = parseFloat(price * rates["NOK"]).toFixed(2) + " NOK";
            break;
        case "nzd":
            res = "$" + parseFloat(price * rates["NZD"]).toFixed(2) + " NZD";
            break;
        case "rub":
            res = "RUB " + parseFloat(price * rates["RUB"]).toFixed(2) + " ₽";
            break;
        case "sek":
            res = parseFloat(price * rates["SEK"]).toFixed(2) + " SEK";
            break;
        case "usd":
            res = "$" + parseFloat(price * rates["USD"]).toFixed(2) + " USD";
            break;
        case "zar":
            res = "R " + parseFloat(price * rates["ZAR"]).toFixed(2) + " ZAR";
            break;
        default:
            res = parseFloat(price).toFixed(2) + "€";
    }
    return res;
}
require('dotenv').config({
    path: process.cwd() + '/../'
});

const db = require('./../model/db');

const NodeCache = require("node-cache");
const cache = new NodeCache();

const fs = require('fs');



exports.blockBalance = async (uid, lid, tid, amount) => {
    amount = parseFloat(amount);

    await db.User.updateOne({ _id: uid },
        [{
            "$set": {
                "balance": { "$subtract": ["$balance", amount] },
                "floatingBalance": { "$add": ["$floatingBalance", amount] }
            }
        }]);

    var tx = new db.Transaction({
        rxid: tid,
        txid: uid,
        currency: "EUR",
        lessonid: lid,
        amount: amount,
        status: "blocked",
        type: "lesson",
        history: [{ date: Date.now(), type: "blocked" }]
    });
    await tx.save();
}

exports.unblockBalance = async (uid, lid, amount) => {
    amount = parseFloat(amount);

    await db.User.updateOne({ _id: uid },
        [{
            "$set": {
                "balance": { "$add": ["$balance", amount] },
                "floatingBalance": { "$subtract": ["$floatingBalance", amount] }
            }
        }]);


    await db.Transaction.updateOne({ txid: uid, lessonid: lid }, {
        "status": "unblocked",
        $addToSet: {
            history: {
                date: Date.now(),
                type: "completed"
            }
        }
    });
}

exports.transferBalance = async (tid, sid, lid, amount) => {
    amount = parseFloat(amount);
    amount_after_commission = amount * parseFloat(process.env.PAYOUT_RATE);
    amount_after_commission = Math.floor(amount_after_commission * 100) / 100;
    commission = (amount * 100 - amount_after_commission * 100) / 100;

    if (amount == 1) {
        amount_after_commission = 0;
        commission = 1;
    }


    // remove floating from student
    await db.User.updateOne({ _id: sid },
        [{ "$set": { "floatingBalance": { "$subtract": ["$floatingBalance", amount] } } }]);

    // add balance to teacher
    await db.User.updateOne({ _id: tid },
        [{ "$set": { "balance": { "$add": ["$balance", amount_after_commission] } } }]);

    // update transaction
    await db.Transaction.updateOne({ rxid: tid, txid: sid, lessonid: lid }, {
        "status": "completed",
        "fee": commission,
        $addToSet: {
            history: {
                date: Date.now(),
                type: "completed"
            }
        }
    });
}

exports.depositBalance = async (uid, amount, fee) => {
    amount = parseFloat(amount);

    await db.User.updateOne({ _id: uid },
        [{ "$set": { "balance": { "$add": ["$balance", amount] } } }]);

    var tx = new db.Transaction({
        rxid: uid,
        txid: "brainstr_deposit",
        status: "completed",
        type: "deposit",
        fee: fee,
        amount: amount,
        history: [{ date: Date.now(), type: "completed" }]
    });
    await tx.save();

    return tx.id;
}

exports.calculateDeposit = (amount) => {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount < 2) {
        return false;
    }
    var pctgFee = 1 - parseFloat(process.env.DEPOSIT_FEE_PCTG);
    var flatFee = parseFloat(process.env.DEPOSIT_FEE_FIX);
    return Math.ceil((amount * pctgFee + flatFee) * 100) / 100;
}

exports.calculateLessonFee = (amount, roundUp, donation) => {
    var pctgFee = parseFloat(process.env.DEPOSIT_FEE_PCTG);
    var flatFee = parseFloat(process.env.DEPOSIT_FEE_FIX);

    var fee = 0;
    var donation = 0;
    var total = amount;

    amount = parseFloat(amount);
    if (isNaN(amount) || amount < 2) {
        return false;
    }

    if (roundUp) {
        total = Math.ceil(amount + 0.0000001);
        fee = total * (1 - pctgFee) + flatFee;
        donation = total - amount - fee;
    } else {
        donation = donation;
        amount = amount + donation;
        total = Math.ceil((amount * pctgFee + flatFee) * 100) / 100;
        fee = total - amount;
    }

    return {
        fee: fee,
        donation: donation,
        lesson: amount,
        total: total
    };
}

exports.getExchangeRates = () => {
    value = cache.get("exchangeRates");
    if (value != undefined) {
        return value;
    }

    // fetch data from file
    var exchangeRates = fs.readFileSync(process.cwd() + '/data/rates.json');
    exchangeRates = JSON.parse(exchangeRates);

    cache.set("exchangeRates", exchangeRates, 7200);
    return exchangeRates;
}
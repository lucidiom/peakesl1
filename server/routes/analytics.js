require('dotenv').config();
const express = require('express');
const router = express.Router();
const { isAuthNav, isAuth, loggedInRedirect } = require('./../util/auth');

const fetch = require('node-fetch');
const NodeCache = require("node-cache");
const cache = new NodeCache();


const db = require('./../model/db.js');
const mail = require('./../class/Mail.js');


addGeolocationToMeta = async (ip, data) => {
    value = cache.get("ip-" + ip);
    if (value != undefined) {
        data.meta.location = value;
        return data;
    }


    var res = await fetch('http://free.ipwhois.io/json/' + ip);
    var result = await res.json();

    if (result == []) {
        data.meta.location = {
            status: "invalid",
            region: "",
            city: "",
            country: "",
            continent: "",
            timezone: "",
            currency: "",
            latitude: "",
            longitude: ""
        };
    }

    data.meta.location = {
        status: "ok",
        region: result.region,
        city: result.city,
        country: result.country,
        continent: result.continent,
        timezone: result.timezone,
        currency: result.currency_code,
        latitude: result.latitude,
        longitude: result.longitude
    };

    cache.set("ip-" + ip, data.meta.location, 21600);
    return data;
}

router.post('/analytics/teacher/view', async (req, res) => {
    res.json({ "status": "ok" });
    var data = await addGeolocationToMeta(req.ip, req.body);
    var event = new db.analytics_events(data);
    event.save();
});

router.post('/analytics/teachers/noresult', async (req, res) => {
    res.json({ "status": "ok" });
    var data = await addGeolocationToMeta(req.ip, req.body);
    var event = new db.analytics_events(data);
    event.save();
});

router.post('/analytics/track', async (req, res) => {
    // FIXME: filter allowed events

    res.json({ "status": "ok" });
    var data = req.body;

    try {
        data = await addGeolocationToMeta(req.ip, req.body);
    } catch (error) {}

    var event = new db.analytics_events(data);
    event.save();
});




module.exports = router;
var firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

const CFG_ENV = "production";
const CFG_DOMAIN = "https://whale-app-o2jqe.ondigitalocean.app";
const STRIPE_PUBLIC_KEY = "";

const CDN = "https://peakesl.nyc3.cdn.digitaloceanspaces.com/web/";

const POINTS_FACTOR_EUR = 10;
const DEPOSIT_FEE_PCTG = 0.96;
const DEPOSIT_FEE_FIX = 0.25;
const WITHDRAW_FEE_PCTG = 0.96;
const WITHDRAW_FEE_FIX = 0.25;


const PAYOUT_RATE = 1;
const MINRATE_30 = 3.5;
const MINRATE_45 = 4.5;
const MINRATE_60 = 5.5;
const MINRATE_90 = 8.0;
const MINRATE_120 = 10.0;

const MINRATES = {
    30: 3.5,
    45: 4.5,
    60: 5.5,
    90: 8.0,
    120: 10.0
};

const RECOMM_RATES = {
    30: 7,
    45: 15,
    60: 10,
    90: 15,
    120: 20
};
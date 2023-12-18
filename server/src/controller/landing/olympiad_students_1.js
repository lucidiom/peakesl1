var urlVars = getUrlVars();
if (urlVars["phone"] != undefined) {
    checkExistence(urlVars["phone"], urlVars["email"]);
}

async function checkExistence(phone, email) {
    var res = await r('payment/yookassa/checkOlympiadPurchase', { phone: phone, email: email });
    console.log(res);

    if (res.status == "purchased") {
        document.querySelector("#text-confirmation-name").innerHTML = 'Добро пожаловать в сообщество участников и победителей Олимпиад!';

        document.querySelector('#registration-form').style.display = "none";
        document.querySelector('#confirmation').style.display = "block";
    }
}

async function signUp() {
    document.getElementById('btn-submit').style.display = "none";
    document.getElementById('div-loading').style.display = "block";

    document.querySelector('#invalid-msg').style.display = "none";

    var phone = document.querySelector('#phone').value;
    var firstname = document.querySelector('#firstname').value;
    var lastname = document.querySelector('#lastname').value;
    var email = document.querySelector('#email').value;

    var interestedInTutoring = document.querySelector('#interestedInTutoring').checked == true ? "YES" : "NO";


    const result = await createOlympiadSignup({
        phone: phone,
        email: email,
        firstname: firstname,
        lastname: lastname,
        interestedInTutoring: interestedInTutoring
    });

    resize();
}

async function createYookassaPayment(user) {
    try {
        var session = await r('payment/yookassa/olympiadSignup', { firstname: user.firstname, lastname: user.lastname, phone: user.phone, email: user.email, subject: user.subject, class: user.class, interestedInTutoring: user.interestedInTutoring });
        if (session.status == "invalid") {
            document.getElementById('btn-submit').style.display = "block";
            document.getElementById('div-loading').style.display = "none";
            document.querySelector('#invalid-msg').style.display = "block";
            return;
        }

        if (session.status == "ok") {
            if (CFG_ENV == "production") {
                try {
                    fbq('Lead');
                } catch (error) {
                }
            }

            window.location.href = session.data.confirmation.confirmation_url;
            return;
        }

        if (session.status == "error") {
            document.querySelector('#invalid-msg').style.display = "block";
            document.getElementById('btn-submit').style.display = "block";
            document.getElementById('div-loading').style.display = "none";
            alert("An error occured. Please try again later");
            return;
        }

    } catch (error) {
        document.getElementById('btn-submit').style.display = "block";
        document.getElementById('div-loading').style.display = "none";
        alert("An error occured. Please try again later.");
    }
}

async function createOlympiadSignup(user) {
    try {
        var session = await r('user/createOlympiadStudent', {
            firstname: user.firstname,
            lastname: user.lastname,
            phone: user.phone,
            email: user.email,
            interestedInTutoring: user.interestedInTutoring
        });

        if (session.status == "invalid") {
            document.getElementById('btn-submit').style.display = "block";
            document.getElementById('div-loading').style.display = "none";
            document.querySelector('#invalid-msg').style.display = "block";
            return;
        }

        if (session.status == "ok") {
            if (CFG_ENV == "production") {
                try {
                    fbq('Lead');
                } catch (error) {
                }
            }

            redirect_blank("https://t.me/brainstr_olympiad_community_bot");

            document.getElementById('div-loading').style.display = "none";
            document.querySelector('#link-confirmation').style.display = "block";

            return;
        }

        if (session.status == "error") {
            document.getElementById('btn-submit').style.display = "block";
            document.getElementById('div-loading').style.display = "none";
            alert("An error occured. Please try again later");
            return;
        }

    } catch (error) {
        document.getElementById('btn-submit').style.display = "block";
        document.getElementById('div-loading').style.display = "none";
        alert("An error occured. Please try again later.");
    }
}

function redirect_blank(url) {
    var a = document.createElement('a');
    a.target = "_blank";
    a.href = url;
    a.click();
}

async function r(target, data = {}, params = {}) {
    const response = await fetch(window.location.origin + "/" + target, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
    });

    var result = await response.json();
    return result;
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}
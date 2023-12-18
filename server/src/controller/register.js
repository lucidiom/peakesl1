$(document).keypress(function (e) {
    if (e.which == 13) {
        $('#register-btn').click();
        return false;
    }
});


function showSuccessMessage(text) {
    $('#login-notification').addClass("success");
    $('#login-notification').removeClass("error");
    $('#login-notification>p').html(text);
    $('#login-notification').fadeIn();
}

function showErrorMessage(text) {
    $('#login-notification').removeClass("success");
    $('#login-notification').addClass("error");
    $('#login-notification>p').html(text);
    $('#login-notification').fadeIn();
}


async function onClickRegister(token) {
    if ($('#terms').is(":checked") == false) {
        showErrorMessage($.i18n("_bstr.register.error.terms"));
        return;
    }

    $("#loader").show();
    $("#login-notification").fadeOut("fast");

    var email = $("#emailaddress").val();
    var password = $("#password").val();
    var name = $("#name").val();
    var surname = $("#surname").val();

    if (name == "") {
        $("#loader").hide();
        showErrorMessage($.i18n("_bstr.register.error.firstname"));
        return;
    }
    if (surname == "") {
        $("#loader").hide();
        showErrorMessage($.i18n("_bstr.register.error.lastname"));
        return;
    }

    try {
        var response = await r('register', {
            password: password,
            email: email,
            firstName: name,
            lastName: surname,
            currency: i18n_currency,
            token: token
        });

        if (response.status == "ok") {

            if (CFG_ENV == "production") {
                try {
                    ttq.track('CompleteRegistration');
                    fbq('track', 'CompleteRegistration');

                    gtag('event', 'sign_up', {
                        'event_label': 'email'
                    });
                } catch (error) {
                }
            }

            setTimeout(function () {
                if (getUrlVars().redirect != undefined) {
                    window.location.href = decodeURIComponent(getUrlVars().redirect);
                } else {
                    window.location.href = "/tutors/?signup=true";
                }
            }, 500);
            return;
        }


        $("#loader").hide();

        switch (response.error) {
            case "email-in-use":
                showErrorMessage($.i18n("_bstr.register.error.email-in-use"));
                break;
            case "invalid-email":
                showErrorMessage($.i18n("_bstr.register.error.invalid-email"));
                break;
            case "invalid-password":
                showErrorMessage($.i18n("_bstr.register.error.weak-password"));
                break;
            case "invalid-name":
                showErrorMessage($.i18n("_bstr.register.error.invalid-name"));
                break;
            default:
                showErrorMessage($.i18n("_bstr.register.error.defaulterror"));
                break;
        }
    } catch (error) {
        $("#loader").hide();
        showErrorMessage($.i18n("_bstr.register.error.defaulterror"));
    }
}
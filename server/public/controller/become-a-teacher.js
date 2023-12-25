var urlVars = getUrlVars();

if (Object.keys(urlVars).includes("cp")) {
    $('#signup-form').hide();
    $('#retry-payment').show();
}

$(document).keypress(function (e) {
    if (e.which == 13) {
        $('#btn-submit').click();
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
    $("#login-notification").fadeOut("fast");

    var email = $("#emailaddress").val();
    var password = $("#password").val();
    var name = $("#name").val();
    var surname = $("#surname").val();

    if (name == "") {
        showErrorMessage($.i18n("_bstr.register.error.firstname"));
        return;
    }
    if (surname == "") {
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
            token: token,
            socialteacher: false,
            profteacher: false,
            isTeacher: true
        });

        if (response.status == "ok") {
            window.location.href = "/settings-teacher/";
            return;
        }

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
                console.log(response);
                showErrorMessage($.i18n("_bstr.register.error.defaulterror"));
                break;
        }
    } catch (error) {
        console.log(error);
        showErrorMessage($.i18n("_bstr.register.error.defaulterror"));
    }
}
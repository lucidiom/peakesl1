$("body").addClass("gray");


if (getUrlVars().redirect != undefined) {
    $("#redirect").val(decodeURIComponent(getUrlVars().redirect));
}

if (getUrlVars().reset == "success") {
    showSuccessMessage($.i18n('_bstr.login.resetSuccess'));
}

if (getUrlVars().verify == "success") {
    showSuccessMessage($.i18n('_bstr.login.verifySuccess'));
} else if (getUrlVars().verify == "error") {
    showErrorMessage($.i18n('_bstr.login.verifyError'));
}

$(document).keypress(function(e) {
    if (e.which == 13) {
        $('#login-btn').click();
        return false;
    }
});

function showErrorMessage(text) {
    $('#login-notification').removeClass("success");
    $('#login-notification').addClass("error");
    $('#login-notification>p').html(text);
    $('#login-notification').fadeIn();
}

function showSuccessMessage(text) {
    $('#login-notification').addClass("success");
    $('#login-notification').removeClass("error");
    $('#login-notification>p').html(text);
    $('#login-notification').fadeIn();
}


function onLoginClick(token) {
    if (CFG_ENV == "production") {
        gtag('event', 'login', {
            'event_label': 'email'
        });
    }

    $("#g-recaptcha").val(token);
    document.getElementById("login-form").submit();
}

function redirectToRegistration() {
    if (getUrlVars().redirect != undefined) {
        window.location.href = "/register/?redirect=" + getUrlVars().redirect;
        return;
    }
    window.location.href = "/register/";
}
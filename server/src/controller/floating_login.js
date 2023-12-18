$('#login-form .input-text').keypress(function(e) {
    if (e.which == 13) {
        $('#login-btn').click();
        return false;
    }
});

function showFloatingErrorMessage(text) {
    $('#login-notification').removeClass("success");
    $('#login-notification').addClass("error");
    $('#login-notification>p').html(text);
    $('#login-notification').fadeIn();
}

function resetFloatingMessage() {
    $('#login-notification').fadeOut();
}


function onLoginClick(token) {
    resetFloatingMessage();

    if (CFG_ENV == "production") {
        gtag('event', 'login', {
            'event_label': 'email'
        });
    }

    $("#g-recaptcha").val(token);

    var form = $('#floating-login-form');

    $.ajax({
        type: "POST",
        url: '/login-floating',
        data: form.serialize(),
        success: function(data) {
            if (data.status == "success") {
                var redirect = $('#redirect').val();
                if (redirect == "") {
                    window.location.reload();
                } else {
                    window.location.href = redirect;
                }
            }

            if (data.status == "error") {
                showFloatingErrorMessage($.i18n('_bstr.login.error'));
            }
        },
        error: function(error) {
            showFloatingErrorMessage($.i18n('_bstr.login.error'));
        }
    });
}

function redirectToRegistration() {
    if (getUrlVars().redirect != undefined) {
        window.location.href = "/register/?redirect=" + getUrlVars().redirect;
        return;
    }
    window.location.href = "/register/";
}
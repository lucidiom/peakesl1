var mode = 1;

$(document).keypress(function(e) {
    if (e.which == 13) {
        $('#reset-btn').click();
        return false;
    }
});


$('#reset-btn').click(async function() {

    if (mode == 2) {
        window.location.href = "/login";
        return;
    }

    $('#login-notification').fadeOut();
    var email = $("#emailaddress").val();
    if (email == "" || email == null) {
        showErrorMessage($.i18n("_bstr.reset.error.nomail"));
        return;
    }


    try {
        var data = await r('resetPasswordRequest', { email: email });
        mode = 2;
        showSuccessMessage($.i18n("_bstr.reset.success"));
        $("#emailaddress").fadeOut("fast");
        $(".text-center").fadeOut("fast");
        $('#reset-btn').html($.i18n('_bstr.reset.back'));
        $(".welcome-text>h3").html($.i18n('_bstr.reset.done'));
    } catch (e) {
        console.log(e);
        showErrorMessage($.i18n("_bstr.reset.error.default"));
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

$("#setpw-btn").on("click", async function() {
    var pw = $('#password').val();
    if (pw.length < 6) {
        showErrorMessage($.i18n('_bstr.register.error.weak-password'));
        return;
    }

    var params = getUrlVars();

    var res = await r('resetPassword', {
        email: params.e,
        code: params.c,
        uid: params.u,
        password: pw
    });

    if (res.status == "ok") {
        window.location.href = "/login/?reset=success";
        return;
    }

    switch (res.error) {
        case "invalid":
            showErrorMessage($.i18n('_bstr.register.error.defaulterror'));
            break;
        case "weak-password":
            showErrorMessage($.i18n('_bstr.register.error.weak-password'));
            break;
        case "invalid-params":
            showErrorMessage($.i18n('_bstr.reset.error.invalidlink'));
            break;
        default:
            showErrorMessage($.i18n('_bstr.register.error.defaulterror'));
    }
});
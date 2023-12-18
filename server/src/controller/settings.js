$('#old-pw').keyup(function(e) {
    if (e.keyCode == 13) {
        $("#btn-set-pw").click();
    }
});
$('#new-pw').keyup(function(e) {
    if (e.keyCode == 13) {
        $("#btn-set-pw").click();
    }
});
$('#repeat-pw').keyup(function(e) {
    if (e.keyCode == 13) {
        $("#btn-set-pw").click();
    }
});


$("#btn-save-general").on("click", async function() {
    hideNotification();

    var firstname = $("#ts-name").val();
    var lastname = $("#ts-lastname").val();
    var language = $("#settings-language-picker").val();
    var currency = $("#settings-currency-picker").val();

    if (firstname.length < 2) {
        showNotification($.i18n("_bstr.settings.error.firstname"), "error");
        scrollTop();
        return;
    }
    if (lastname.length < 2) {
        showNotification($.i18n("_bstr.settings.error.lastname"), "error");
        scrollTop();
        return;
    }


    var file = $("#ts-pp-upload")[0].files[0];
    if (file != undefined) {
        var formData = new FormData();
        formData.append('img', file);
        var imageResult = await $.ajax({
            url: window.location.origin + "/saveProfilePicture",
            type: 'post',
            data: formData,
            processData: false,
            contentType: false
        });
    }


    var res = await r('user/action/updategeneral', { firstname: firstname, lastname: lastname, language: language, currency: currency, socialStudent: $('#socialStudent').is(":checked") });

    switch (res.status) {
        case "firstname-invalid":
            showNotification($.i18n("_bstr.settings.error.firstname"), "error");
            break;
        case "lastname-invalid":
            showNotification($.i18n("_bstr.settings.error.lastname"), "error");
            break;
        case "ok":
            showNotification($.i18n("_bstr.settings.success.general"), "success");
            break;
    }
    scrollTop();
});

$("#btn-set-pw").on("click", async function() {
    hideNotification();

    var pw = $("#old-pw").val();
    var new_pw = $("#new-pw").val();
    var repeat_pw = $("#repeat-pw").val();

    if (new_pw != repeat_pw) {
        showNotification($.i18n("_bstr.settings.error.pw.match"), "error");
        scrollTop();
        return;
    }

    if (new_pw.length < 5) {
        showNotification($.i18n("_bstr.settings.error.pw.unsafe"), "error");
        scrollTop();
        return;
    }

    var res = await r('user/action/setpassword', { pw: pw, new_pw: new_pw });

    switch (res.status) {
        case "unsafe":
            showNotification($.i18n("_bstr.settings.error.pw.unsafe"), "error");
            break;
        case "wrong-pw":
            showNotification($.i18n("_bstr.settings.error.pw.wrong"), "error");
            break;
        case "ok":
            $("#old-pw").val("");
            $("#new-pw").val("");
            $("#repeat-pw").val("");
            showNotification($.i18n("_bstr.settings.success.pw"), "success");
            break;
    }

    scrollTop();
});
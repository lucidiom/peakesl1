$("#regteacher-submit").click(function () {
    $('#login-notification').fadeOut();
    $("#regteacher-submit").html("Einen Moment bitte...");

    var type = "student";
    var text = $("#aboutyou").val();
    var agree = $("#terms");
    var schoolid = $("#upload");

    if (text.length < 50) {
        showErrorMessage("Bitte schreibe etwas mehr über dich.");
        return;
    }

    if (!agree.is(":checked")) {
        showErrorMessage("Du musst unsere Nutzungsbedingungen und Datenschutzerklärung akzeptieren, um Lehrer zu werden");
        return;
    }


    if (!schoolid.val()) {
        showErrorMessage("Bitte lade eine Kopie oder ein Foto deines Schüler- oder Studentenausweises hoch, um dich zu verifizieren.");
        return
    } else if ((schoolid[0].files[0].size / 1024) > 10240) {
        showErrorMessage("Die maximale Dateigröße beträgt 10 MB. Bitte passe deine Datei an und lade sie erneut hoch.");
        return;
    }


    var file = schoolid[0].files[0];
    var tmp = file.name.split(".");
    var filetype = tmp[tmp.length - 1];

    // FIXME: upload images via different means!
    var schoolidRef = storage.ref().child('teacher_registrations/' + firebase.auth().currentUser.uid + "/schoolid." + filetype);
    schoolidRef.put(file).then(function (snapshot) {

        firebase.auth().currentUser.getIdToken(true).then(function (idToken) {

            $.ajax({
                    url: window.location.origin + "/teacherRegistration",
                    type: 'post',
                    headers: {
                        authorization: idToken,
                        uid: firebase.auth().currentUser.uid
                    },
                    data: {
                        email: firebase.auth().currentUser.email,
                        type: type,
                        text: text,
                        name: sessionStorage.getItem("brainstr-name")
                    }
                }).done(function () {
                    window.location.href = "teachers?teacherrequest=success"
                    return;
                })
                .fail(function () {
                    showErrorMessage("Sorry! Es gab einen Fehler bei der Anfrage. Bitte versuche es erneut oder kontaktiere unseren Support.");
                    return;
                });


        }).catch(function (error) {
            showErrorMessage("Sorry! Es gab einen Fehler. Bitte versuche es später erneut oder kontaktiere unseren Support.");
            return;
        });


    }).catch(function () {
        showErrorMessage("Sorry! Es gab einen Fehler beim Hochladen deines Dokuments. Bitte versuche es später erneut.");
        return;
    });

});


function showErrorMessage(text) {
    $("#regteacher-submit").html("Bewerbung absenden");
    $('#login-notification>p').html(text);
    $('#login-notification').fadeIn();
}

$("#upload:file").on("change", function () {
    var fileName = $(this)[0].files[0].name;
    $(".upload-text").html(fileName);
});
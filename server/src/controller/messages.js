var activeConvId = "";
var params = getUrlVars();
var unreadMessages = 0;

var messageSite = true;



$.each(conversations, function (i, item) {
    addConversationToDom(item);
});

if (conversations.length > 0 && params.start == undefined) {
    var lastId = conversations[0].rx == uData._id ? conversations[0].tx : conversations[0].rx;
    //loadConversation(lastId);
} else if (params.start == undefined) {
    $(".messages-container").hide();
    showNotification($.i18n('_bstr.messages.nomsgs'), "notice")
}




socket.on("message", function (data) {
    var otherId = data.rx == uData._id ? data.tx : data.rx;
    if (otherId == activeConvId) {
        addMsgToDom(data);
        $('#messages-container').scrollTop($('#messages-container')[0].scrollHeight);
    }

    if (document.hidden) {
        messageSound.play();
        changeFavicon("https://brstr.nyc3.cdn.digitaloceanspaces.com/web/images/favicon_notification.png");

        unreadMessages++;

        if (document.title.split(")")[1] == undefined) {
            // document.title = "(" + unreadMessages + ") " + document.title.split(")")[0];
        } else {
            // document.title = "(" + unreadMessages + ") " + document.title.split(")")[1];
        }
    }

    $("#conv-" + otherId + " p").html('<b>' + data.text + '</b>');
});



//check if conv is started
function startConversation() {
    if (params.start != undefined) {
        // check if a conv already exists
        var res = conversations.filter(function (item) {
            return item.rx == params.start || item.tx == params.start;
        });

        if (res.length == 0) {
            var con = { _id: "xxx", rx: params.start, tx: uData._id, other: { firstname: decodeURI(params.n), lastname: "" }, text: $.i18n('_bstr.messages.start') };
            conversations.push(con);
            addConversationToDom(con);
            loadConversation(params.start);
            return;
        }

        loadConversation(params.start);
    }
}
startConversation();

// end check if conv is started




function addConversationToDom(msg) {
    var otherId = msg.rx == uData._id ? msg.tx : msg.rx;
    var txt = msg.read == true ? msg.text : '<b>' + msg.text + '</b>';

    $("#message-conversation-list").append(`<li id="conv-${otherId}">
                                            <a href="javascript:void(0);" onclick="loadConversation('${otherId}');">
                                                <div class="message-avatar"><img src="/profilepicture/${otherId}" alt=""></div>

                                                <div class="message-by">
                                                    <div class="message-by-headline">
                                                        <h5>${msg.other.firstname + ' ' + msg.other.lastname}</h5>
                                                    </div>
                                                    <p>${txt}</p>
                                                </div>
                                            </a>
                                        </li>`);
}

async function loadConversation(id) {
    activeConvId = id;
    $("#messages-container").html("");

    $("#message-conversation-list li").removeClass("active");
    $("#conv-" + id).addClass("active");

    var msgs = await r('messages/getConversation', { id: id, read: true });

    var conversationTmp = conversations.filter(function (i) { return i.tx == id || i.rx == id });
    var conversation = conversationTmp[0];

    if (conversation != undefined && conversation != null) {
        $(".messages-headline h4").html(conversation.other.firstname + " " + conversation.other.lastname);
    }


    $.each(msgs.data, function (i, msg) {
        addMsgToDom(msg);
    });

    $(".message-content").removeClass("d-none");

    $('#messages-container').scrollTop($('#messages-container')[0].scrollHeight);
    $("#msg").focus();
}

async function sendMessage() {
    if (activeConvId == "") {
        return;
    }

    var msg = $("#msg").val();
    if (msg.length == 0) {
        return;
    }

    msg = msg.replace(/\r?\n/g, '<br />');

    await r('messages/create', { rx: activeConvId, text: msg });
    addMsgToDom({ rx: activeConvId, tx: uData._id, text: msg, read: true, createdAt: moment.utc().format("YYYY-MM-DD HH:mm:ss"), other: { firstname: "", lastname: "" } });

    $('#messages-container').scrollTop($('#messages-container')[0].scrollHeight);
    $("#conv-" + activeConvId + " p").text(msg);
    $("#msg").val("");
}

function addMsgToDom(msg) {
    var date = moment.utc(msg.createdAt);

    var otherId = msg.rx == uData._id ? msg.tx : msg.rx;
    otherdata = getOtherData(otherId);

    var name = uData.firstname + " " + uData.lastname;
    if (msg.tx != uData._id) {
        if (otherdata.teacher) {
            name = '<a href="/teacher/' + otherdata.id + '" target="_blank">' + otherdata.firstname + ' ' + otherdata.lastname + '</a>';
        } else {
            name = otherdata.firstname + ' ' + otherdata.lastname;
        }
    }

    $("#messages-container").append(`<div class="message-bubble-fullwidth">
                                        <div>
                                            <img src="/profilepicture/${msg.tx}" alt="">
                                            <b>${name}</b>
                                            <small>${date.format("lll")}</small>
                                        </div>
                                        <span>${msg.text}</span>
                                    </div>`);
}

function getOtherData(otherId) {
    var dt = conversations.filter(function (item) {
        return item.rx == otherId || item.tx == otherId;
    });
    return dt[0].other;
}

$("#msg").on("keydown", function (e) {
    if (e.keyCode == 13 && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
})


$("#btn-send").on("click", function () {
    sendMessage();
})

$(".messages-headline i").on("click", function () {
    $(".message-content").addClass("d-none");
});
var whiteboardHeight = 0;
var lastWhiteboardData = {};
var rx = false;


whiteboard_canvas = new fabric.Canvas('c-whiteboard', {
    backgroundColor: 'rgb(255,255,255)',
});

const pickrPen = Pickr.create({
    el: '#colorpicker-indicator',
    theme: 'nano',
    default: '#184596',
    position: 'bottom-end',
    comparison: false,

    components: {
        preview: true,
        opacity: false,
        hue: true,

        interaction: {
            save: false
        },
    },
    strings: {
        save: $.i18n('_bstr.general.apply')
    }
});


$("#video-control-whiteboard").on("click", function () {
    toggleWhiteboard();
});


function toggleWhiteboard() {
    if (!whiteboard) {
        if (role == "teacher") {
            sendMessage('{"type": "command", "cmd": "whiteboard_open" }');
            sendWhiteboard();
        }
        openWhiteboard();
    } else {
        if (role == "teacher") {
            sendMessage('{"type": "command", "cmd": "whiteboard_close" }');
        }
        closeWhiteboard();
    }
}

function openWhiteboard() {
    whiteboard = true;
    $("#content-video").css("display", "none");
    $("#content-screensharing").css("display", "none");
    $("#content-whiteboard").css("display", "block");


    $("#whiteboard").width($("#whiteboard").height() / 9 * 16);
    $("#whiteboard").css("max-height", ($("#content-whiteboard").width() - 30) / 16 * 9);

    $("#video-control-whiteboard").addClass("active");
    $("#video-control-screensharing").removeClass("active");

    whiteboard_canvas.setWidth($("#whiteboard").width());
    whiteboard_canvas.setHeight($("#whiteboard").height());

    whiteboardHeight = $("#whiteboard").height();

    $(window).on('resize', function () {
        $("#whiteboard").width($("#whiteboard").height() / 9 * 16);
        $("#whiteboard").css("max-height", ($("#content-whiteboard").width() - 30) / 16 * 9);

        whiteboard_canvas.setWidth($("#whiteboard").width());
        whiteboard_canvas.setHeight($("#whiteboard").height());

        scaleWhiteboard(whiteboardHeight);
        whiteboardHeight = $("#whiteboard").height();
    });


    whiteboard_canvas.isDrawingMode = true;

    whiteboard_canvas.freeDrawingBrush.width = parseInt($('#whiteboard-controls-brushwidth').val());
    var c = pickrPen.getColor().toRGBA();
    whiteboard_canvas.freeDrawingBrush.color = "rgb(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + ")";


    whiteboard_canvas.on('object:modified', function (options) {
        if (rx) return;
        console.log("object:modified");
        sendWhiteboard();
    });
    whiteboard_canvas.on('object:added', function (options) {
        if (rx) return;
        console.log("object:added");
        sendWhiteboard();
    });
    whiteboard_canvas.on('object:removed', function (options) {
        if (rx) return;
        console.log("object:removed");
        sendWhiteboard();
    });
    whiteboard_canvas.on('object:moving', function (options) {
        if (rx) return;
        console.log("object:moving");
        sendWhiteboard();
    });
    whiteboard_canvas.on('object:scaling', function (options) {
        if (rx) return;
        console.log("object:scaling");
        sendWhiteboard();
    });
    whiteboard_canvas.on('path:created', function (options) {
        if (rx) return;
        //console.log("path:created");
        //sendWhiteboard();
    });

    whiteboard_canvas.on('selection:created', function (e) {
        $("#video-control-whiteboard-delete-item").css("display", "inline-block");

        switch (whiteboard_canvas.getActiveObject().get('type')) {
            case "i-text":
                $("#whiteboard-controls-fontSize").val(whiteboard_canvas.getActiveObject().fontSize);
                $("#whiteboard-controls-text").removeClass("d-none");
                $("#whiteboard-controls-text").addClass("d-inline-block");
                break;

            default:
                $("#whiteboard-controls-text").removeClass("d-inline-block");
                $("#whiteboard-controls-text").addClass("d-none");
        }
    });

    whiteboard_canvas.on('selection:cleared', function (options) {
        $("#video-control-whiteboard-delete-item").css("display", "none");
        $("#whiteboard-controls-text").removeClass("d-inline-block");
        $("#whiteboard-controls-text").addClass("d-none");
    });

    switchToRemoteVideo();
    whiteboard_canvas.renderAll();

    sendWhiteboard();
}


function closeWhiteboard() {
    whiteboard = false;
    $("#content-whiteboard").css("display", "none");
    $("#content-screensharing").css("display", "video");
    $("#video-control-whiteboard").removeClass("active");
    $("#content-video").css("display", "block");

    switchToLocalVideo();
}


function sendWhiteboard() {
    if (role == "student" && studentrights == "false") {
        return;
    }

    var dt = whiteboard_canvas.toDatalessJSON();
    if (lastWhiteboardData == dt) {
        return;
    }

    console.log("TX");
    sendMessage('{"type": "whiteboard_data", "id": "' + uData._id + '", "width": ' + $("#whiteboard").width() + ', "height": ' + $("#whiteboard").height() + ', "data": ' + JSON.stringify(dt) + '}');
}

function whiteboardToggleStudentRights() {
    if (studentrights == "true") {
        studentrights = "false";
        $("#video-control-whiteboard-unlock").removeClass("active");
    } else {
        studentrights = "true";
        $("#video-control-whiteboard-unlock").addClass("active");
    }

    sendMessage('{"type": "command", "cmd": "whiteboard_student", "value": "' + studentrights + '" }');
}

function whiteBoardDelete() {
    sendMessage('{"type": "command", "cmd": "whiteboard_erase"}');
    eraseWhiteboard();
}

function eraseWhiteboard() {
    whiteboard_canvas.clear();
}

function setWhiteboardData(msg) {
    rx = true;
    whiteboard_canvas.loadFromJSON(msg.data);
    scaleWhiteboard(msg.height);
    rx = false;
}

function scaleWhiteboard(height) {
    var scaleMultiplier = $("#whiteboard").height() / height;

    var objects = whiteboard_canvas.getObjects();
    for (var i in objects) {
        var scaleX = objects[i].scaleX;
        var scaleY = objects[i].scaleY;
        var left = objects[i].left;
        var top = objects[i].top;

        var tempScaleX = scaleX * scaleMultiplier;
        var tempScaleY = scaleY * scaleMultiplier;
        var tempLeft = left * scaleMultiplier;
        var tempTop = top * scaleMultiplier;

        objects[i].scaleX = tempScaleX;
        objects[i].scaleY = tempScaleY;
        objects[i].left = tempLeft;
        objects[i].top = tempTop;

        objects[i].setCoords();
    }

    whiteboard_canvas.renderAll();
    whiteboard_canvas.calcOffset();
    whiteboard_canvas.renderAll();
}


pickrPen.on('change', (color, instance) => {
    var c = color.toRGBA();
    whiteboard_canvas.freeDrawingBrush.color = "rgb(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + ")";

    if (whiteboard_canvas.getActiveObject() != undefined) {
        switch (whiteboard_canvas.getActiveObject().get('type')) {
            case "i-text":
                whiteboard_canvas.getActiveObject().set("fill", color.toHEXA().toString());
                break;
            case "triangle":
                whiteboard_canvas.getActiveObject().set("fill", color.toHEXA().toString());
                break;
            case "circle":
                whiteboard_canvas.getActiveObject().set("fill", color.toHEXA().toString());
                break;
            case "rect":
                whiteboard_canvas.getActiveObject().set("fill", color.toHEXA().toString());
                break;
            case "path":
                whiteboard_canvas.getActiveObject().set("stroke", color.toHEXA().toString());
                break;
            default:
        }

        whiteboard_canvas.requestRenderAll();
    }

});

$("#whiteboard-controls-brushwidth").on("change", function () {
    whiteboard_canvas.freeDrawingBrush.width = parseInt($(this).val());
})

$("#video-control-whiteboard-drawing").on("click", function () {
    whiteboard_canvas.isDrawingMode = !whiteboard_canvas.isDrawingMode;

    if (whiteboard_canvas.isDrawingMode) {
        $("#video-control-whiteboard-drawing").addClass("active");
        $("#whiteboard-controls-drawing").attr("style", "display: inline-block !important;");
        return;
    }
    $("#video-control-whiteboard-drawing").removeClass("active");
    $("#whiteboard-controls-drawing").attr("style", "display: none !important;");
});

function downloadWhiteboard() {
    var data = whiteboard_canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    var date = moment();

    var link = document.createElement('a');
    link.download = 'peakesl_whiteboard_' + date.format("YYYMMDD_HHmmSS") + '.png';
    link.href = data;
    link.click();
}

$("#video-control-whiteboard-text").on("click", function () {
    var text = new fabric.IText('Text', {
        left: getWhiteboardMiddleWidth() - 25,
        top: getWhiteboardMiddleHeight() - 25,
        fill: pickrPen.getColor().toHEXA().toString(),
        fontSize: 22
    });
    whiteboard_canvas.add(text);
    whiteboard_canvas.renderAll();
});

$("#video-control-whiteboard-form-square").on("click", function () {
    var rect = new fabric.Rect({
        left: getWhiteboardMiddleWidth() - 25,
        top: getWhiteboardMiddleHeight() - 25,
        fill: pickrPen.getColor().toHEXA().toString(),
        width: 50,
        height: 50
    });
    whiteboard_canvas.add(rect);
    whiteboard_canvas.renderAll();
});

$("#video-control-whiteboard-form-circle").on("click", function () {
    var circle = new fabric.Circle({
        left: getWhiteboardMiddleWidth() - 25,
        top: getWhiteboardMiddleHeight() - 25,
        fill: pickrPen.getColor().toHEXA().toString(),
        radius: 50
    });
    whiteboard_canvas.add(circle);
    whiteboard_canvas.renderAll();
});

$("#video-control-whiteboard-form-triangle").on("click", function () {
    var triangle = new fabric.Triangle({
        left: getWhiteboardMiddleWidth() - 25,
        top: getWhiteboardMiddleHeight() - 25,
        fill: pickrPen.getColor().toHEXA().toString(),
        width: 50,
        height: 50
    });
    whiteboard_canvas.add(triangle);
    whiteboard_canvas.renderAll();
});

function getWhiteboardMiddleWidth() {
    return whiteboard_canvas.width / 2;
}

function getWhiteboardMiddleHeight() {
    return whiteboard_canvas.height / 2;
}

$("#video-control-whiteboard-text-bold").on("click", function () {
    if (whiteboard_canvas.getActiveObject().selectionEnd == 0 || whiteboard_canvas.getActiveObject().getSelectionStyles()[0] == undefined) {
        if (whiteboard_canvas.getActiveObject().fontWeight == "normal" || whiteboard_canvas.getActiveObject().fontWeight == undefined) {
            whiteboard_canvas.getActiveObject().set("fontWeight", "bold");
        } else {
            whiteboard_canvas.getActiveObject().set("fontWeight", "normal");
        }
        whiteboard_canvas.requestRenderAll();
        sendWhiteboard();
        return;
    }

    if (whiteboard_canvas.getActiveObject().getSelectionStyles()[0].fontWeight == "normal" || whiteboard_canvas.getActiveObject().getSelectionStyles()[0].fontWeight == undefined) {
        whiteboard_canvas.getActiveObject().setSelectionStyles({ fontWeight: "bold" });
    } else {
        whiteboard_canvas.getActiveObject().setSelectionStyles({ fontWeight: "normal" });
    }
    whiteboard_canvas.requestRenderAll();
    sendWhiteboard();
});

$("#video-control-whiteboard-text-italic").on("click", function () {
    if (whiteboard_canvas.getActiveObject().selectionEnd == 0 || whiteboard_canvas.getActiveObject().getSelectionStyles()[0] == undefined) {
        if (whiteboard_canvas.getActiveObject().fontStyle == "normal" || whiteboard_canvas.getActiveObject().fontStyle == undefined) {
            whiteboard_canvas.getActiveObject().set("fontStyle", "italic");
        } else {
            whiteboard_canvas.getActiveObject().set("fontStyle", "normal");
        }
        whiteboard_canvas.requestRenderAll();
        sendWhiteboard();
        return;
    }

    if (whiteboard_canvas.getActiveObject().getSelectionStyles()[0].fontStyle == "normal" || whiteboard_canvas.getActiveObject().getSelectionStyles()[0].fontStyle == undefined) {
        whiteboard_canvas.getActiveObject().setSelectionStyles({ fontStyle: "italic" });
    } else {
        whiteboard_canvas.getActiveObject().setSelectionStyles({ fontStyle: "normal" });
    }
    whiteboard_canvas.requestRenderAll();
    sendWhiteboard();
});

$("#video-control-whiteboard-text-underline").on("click", function () {
    if (whiteboard_canvas.getActiveObject().selectionEnd == 0 || whiteboard_canvas.getActiveObject().getSelectionStyles()[0] == undefined) {
        if (whiteboard_canvas.getActiveObject().underline == false || whiteboard_canvas.getActiveObject().underline == undefined) {
            whiteboard_canvas.getActiveObject().set("underline", true);
        } else {
            whiteboard_canvas.getActiveObject().set("underline", false);
        }
        whiteboard_canvas.requestRenderAll();
        sendWhiteboard();
        return;
    }

    if (whiteboard_canvas.getActiveObject().getSelectionStyles()[0].underline == false || whiteboard_canvas.getActiveObject().getSelectionStyles()[0].underline == undefined) {
        whiteboard_canvas.getActiveObject().setSelectionStyles({ underline: true });
    } else {
        whiteboard_canvas.getActiveObject().setSelectionStyles({ underline: false });
    }
    whiteboard_canvas.requestRenderAll();
    sendWhiteboard();
});

$("#video-control-whiteboard-text-align-left").on("click", function () {
    whiteboard_canvas.getActiveObject().set('textAlign', "left");
    whiteboard_canvas.requestRenderAll();
    sendWhiteboard();
});

$("#video-control-whiteboard-text-align-center").on("click", function () {
    whiteboard_canvas.getActiveObject().set('textAlign', "center");
    whiteboard_canvas.requestRenderAll();
    sendWhiteboard();
});

$("#video-control-whiteboard-text-align-right").on("click", function () {
    whiteboard_canvas.getActiveObject().set('textAlign', "right");
    whiteboard_canvas.requestRenderAll();
    sendWhiteboard();
});

$("#whiteboard-controls-fontSize").on("change", function () {
    if (whiteboard_canvas.getActiveObject().selectionEnd == 0) {
        whiteboard_canvas.getActiveObject().set('fontSize', $(this).val());
    } else {
        whiteboard_canvas.getActiveObject().setSelectionStyles({ fontSize: $(this).val() });
    }
    whiteboard_canvas.requestRenderAll();
    sendWhiteboard();
});

$("#video-control-whiteboard-delete-item").on("click", function () {
    whiteboard_canvas.getActiveObjects().forEach((obj) => {
        whiteboard_canvas.remove(obj);
    });
    whiteboard_canvas.discardActiveObject().renderAll();
    sendWhiteboard();
});
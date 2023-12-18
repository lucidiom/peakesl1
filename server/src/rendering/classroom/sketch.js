var img;
var canvas;
var p;
var branding;

var wht_color = 'rgb(24,69,150)';
var wht_width = 4;

var framerate = 30;


function preload() {
    branding = loadImage('https://brstr.nyc3.cdn.digitaloceanspaces.com/web/images/logo.png');
}

function setup() {
    var canvasDiv = document.getElementById('whiteboard');
    canvas = createCanvas(100, 100);

    frameRate(framerate);

    img = createGraphics(100, 100);
    img.stroke(0);
    img.noFill();

    canvas.parent("whiteboard");
    img.parent("whiteboard");

    image(img, 0, 0);
}

function initWhiteboard() {
    var canvasDiv = document.getElementById('whiteboard');
    canvas.resize(canvasDiv.clientWidth, canvasDiv.clientHeight);
    img = createGraphics(width, height);
    img.stroke(0);
    img.noFill();

    canvas.parent("whiteboard");
    img.parent("whiteboard");

    image(img, 0, 0);
    //image(branding, 30, 20, 120, 46);
}

function draw() {
    if (!whiteboard) {
        return;
    }
}

function mouseDragged() {
    if (!whiteboard || !drawenabled) {
        return;
    }
    if (role == "student" && studentrights == "false") {
        return;
    }

    img.stroke(color(wht_color));
    img.strokeWeight(wht_width);
    img.line(mouseX, mouseY, pmouseX, pmouseY);

    image(img, 0, 0);
    //image(branding, 30, 20, 120, 46);

    var data = {
        cheight: canvas.height,
        cwidth: canvas.width,
        x1: mouseX,
        y1: mouseY,
        x2: pmouseX,
        y2: pmouseY,
        color: wht_color,
        width: wht_width
    };
    sendWhiteboardData(data);
}

function addDrawing(cwidth, cheight, x1, y1, x2, y2, clr, wdth) {
    if (!whiteboard) {
        return;
    }
    if (studentrights == "false" && role == "teacher") {
        return;
    }

    img.stroke(color(clr));
    img.strokeWeight(wdth);

    x1 = x1 / cwidth * canvas.width;
    y1 = y1 / cheight * canvas.height;
    x2 = x2 / cwidth * canvas.width;
    y2 = y2 / cheight * canvas.height;


    img.line(x1, y1, x2, y2);
    image(img, 0, 0);
    //image(branding, 30, 20, 120, 46);
}

function windowResized() {
    if (!whiteboard) {
        return;
    }

    var canvasDiv = document.getElementById('whiteboard');
    canvas.resize(canvasDiv.clientWidth, canvasDiv.clientHeight);

    image(img, 0, 0);
    //image(branding, 30, 20, 120, 46);
    redraw();
}

function eraseWhiteboard() {
    var canvasDiv = document.getElementById('whiteboard');
    img = createGraphics(width, height);
    img.background(255);
    img.stroke(0);
    img.noFill();

    img.parent("whiteboard");
    image(img, 0, 0);
    //image(branding, 30, 20, 120, 46);
}

function downloadWhiteboard() {
    saveCanvas(canvas, 'brainstr_whiteboard', 'jpg');
    redraw();
}
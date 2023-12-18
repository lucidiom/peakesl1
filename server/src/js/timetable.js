function isOverlapping(id, startMin, endMin, items) {
    var result = false;

    if (items == undefined) {
        return false;
    }

    $.each(items, function(index, it) {
        if (index == id) {
            return;
        }

        tmpstartmin = parseInt(it.start.split(":")[0] * 60) + parseInt(it.start.split(":")[1]);
        tmpendmin = parseInt(it.end.split(":")[0] * 60) + parseInt(it.end.split(":")[1]);

        if (inRange(startMin, endMin, tmpstartmin, tmpendmin)) {
            result = true;
        }
    });

    return result;
}


function inRange(n, ne, nStart, nEnd) {
    return btw(n, nStart, nEnd) || btw(ne, nStart, nEnd) ||
        btw(nStart, n, ne) || btw(nEnd, n, ne) ||
        (n == nStart && ne == nEnd);
}

function btw(n, nStart, nEnd) {
    return n > nStart && n < nEnd;
}
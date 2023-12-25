var parentDomain = window.location.origin.replace("blog.", "");

if (relatedPosts[0] != undefined) {
    $("#related-0-date").text(moment.utc(relatedPosts[0].createdAt).format("LL"));
}
if (relatedPosts[1] != undefined) {
    $("#related-1-date").text(moment.utc(relatedPosts[1].createdAt).format("LL"));
}
if (relatedPosts[2] != undefined) {
    $("#related-2-date").text(moment.utc(relatedPosts[2].createdAt).format("LL"));
}



$("#share-tw").on("click", function () {
    if (CFG_ENV == "production") {
        gtag('event', 'share', {
            'event_label': 'twitter'
        });
    }

    var shareURL = "http://twitter.com/share?";

    var params = {
        url: window.location.href,
        text: post.headline,
        via: "peakeslteam",
    }
    for (var prop in params) shareURL += '&' + prop + '=' + encodeURIComponent(params[prop]);
    popupwindow(shareURL, $.i18n('_bstr.blog.share.twitter') + ' - ' + post.headline, 550, 450);
})

$("#share-fb").on("click", function () {
    if (CFG_ENV == "production") {
        gtag('event', 'share', {
            'event_label': 'facebook'
        });
    }
    popupwindow('https://www.facebook.com/sharer/sharer.php?u=' + encodeURI(window.location.href), post.headline, 626, 436);
});

$("#share-li").on("click", function () {
    if (CFG_ENV == "production") {
        gtag('event', 'share', {
            'event_label': 'linkedin'
        });
    }
    popupwindow('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURI(window.location.href), post.headline, 550, 450);
});

$("#share-em").on("click", function () {
    if (CFG_ENV == "production") {
        gtag('event', 'share', {
            'event_label': 'email'
        });
    }
    document.location.href = "mailto:?subject=" + post.headline + "&body=" + window.location.href;
});

$("#share-ok").on("click", function () {
    if (CFG_ENV == "production") {
        gtag('event', 'share', {
            'event_label': 'ok'
        });
    }
    popupwindow('https://connect.ok.ru/offer?url=' + encodeURI(window.location.href), post.headline, 550, 450);
});

$("#share-vk").on("click", function () {
    if (CFG_ENV == "production") {
        gtag('event', 'share', {
            'event_label': 'vk'
        });
    }
    popupwindow('http://vk.com/share.php?url=' + encodeURI(window.location.href), post.headline, 550, 450);
});

$("#share-telegram").on("click", function () {
    if (CFG_ENV == "production") {
        gtag('event', 'share', {
            'event_label': 'telegram'
        });
    }
    popupwindow('https://t.me/share/url?url=' + encodeURI(window.location.href), post.headline, 550, 450);
});

function popupwindow(url, title, w, h) {
    var left = (screen.width / 2) - (w / 2);
    var top = (screen.height / 2) - (h / 2);
    return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
}

$("#helpful-yes").on("click", async function () {
    await r('rateBlogHelpfull', { id: post._id, rating: 1 });
    successHelpful();
});

$("#helpful-no").on("click", async function () {
    await r('rateBlogHelpfull', { id: post._id, rating: 0 });
    successHelpful();
});

function successHelpful() {
    $(".blog-helpful").html(`<span>${$.i18n('_bstr.blog.helpfullThanks')}</span>`);
}


var initPos = $(document).scrollTop();
var fadededIn = false;

$(document).on("scroll", function () {
    if (fadededIn == false && post.cta.active == true) {
        var scrollPos = $(document).scrollTop();
        if (scrollPos >= initPos + 750) {
            fadededIn = true;
            $(".sticky-information").fadeIn();
            $(".sticky-information").css("transform", "translateX(0px)");
        }
    }
});

$("#cta-close").on("click", function () {
    $(".sticky-information").fadeOut("fast");
});
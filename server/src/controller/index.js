$("body").removeClass("gray");

async function topCTAClick() {
    if (CFG_ENV == "production") {
        gtag('event', 'search', {
            'event_label': $("#ix-subject-select").val()
        });
    }

    window.location.href = "/" + $("#ix-subject-select").val().toLowerCase() + "-tutors/";
}


var selectBoxOptions = '';
selectBoxOptions += '<option value="English" selected>' + subjectData["English"] + '</option>';
selectBoxOptions += '<option value="Spanish">' + subjectData["Spanish"] + '</option>';
selectBoxOptions += '<option value="German">' + subjectData["German"] + '</option>';
selectBoxOptions += '<option value="Russian">' + subjectData["Russian"] + '</option>';
selectBoxOptions += '<option value="French">' + subjectData["French"] + '</option>';
selectBoxOptions += '<option value="more">' + $.i18n('_bstr.index.moresubjects') + '</option>';

$(".ix-subject-select>div").html(`<select name="" id="ix-subject-select">${selectBoxOptions}</select>`);
$("#ix-subject-select").selectpicker();



$('#topbrainstrs').slick({
    infinite: false,
    slidesToShow: 3,
    slidesToScroll: 1,
    dots: false,
    arrows: true,
    adaptiveHeight: true,
    responsive: [{
        breakpoint: 1292,
        settings: {
            dots: true,
            arrows: false
        }
    },
    {
        breakpoint: 993,
        settings: {
            slidesToShow: 2,
            slidesToScroll: 2,
            dots: true,
            arrows: false
        }
    },
    {
        breakpoint: 769,
        settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
            dots: true,
            arrows: false
        }
    }
    ]
});
tippy('[data-tippy-placement]', {
    delay: 100,
    arrow: true,
    arrowType: 'sharp',
    size: 'regular',
    duration: 200,
    animation: 'shift-away',
    animateFill: true,
    theme: 'dark',
    distance: 10,
});


$.each(blogposts, function (ix, value) {
    $('#blog-entries').prepend(`<a href="/blog/${i18n_locale}/${value.url}" class="blog-compact-item-container">
                                        <div class="blog-compact-item">
                                            <img src="${value.small_image}" alt="${value.headline}">
                                            <span class="blog-item-tag">${value.category}</span>
                                            <div class="blog-compact-item-content">
                                                <h3>${value.headline}</h3>
                                            </div>
                                        </div>
                                    </a>`);
});



$('#blog-entries').slick({
    infinite: false,
    slidesToShow: 3,
    slidesToScroll: 1,
    dots: false,
    arrows: true,
    responsive: [{
        breakpoint: 1365,
        settings: {
            slidesToShow: 3,
            dots: true,
            arrows: false
        }
    },
    {
        breakpoint: 992,
        settings: {
            slidesToShow: 2,
            dots: true,
            arrows: false
        }
    },
    {
        breakpoint: 768,
        settings: {
            slidesToShow: 1,
            dots: true,
            arrows: false
        }
    }
    ]
});
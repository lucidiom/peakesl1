$.each(featuredPosts, function(ix, value) {
    var dt = moment.utc(value.updatedAt);
    $('#featured-container').prepend(`<a href="${value.url}" class="blog-compact-item-container">
                                        <div class="blog-compact-item">
                                            <img src="${value.small_image}" alt="${value.headline}">
                                            <span class="blog-item-tag">${value.category}</span>
                                            <div class="blog-compact-item-content">
                                                <h3>${value.headline}</h3>
                                            </div>
                                        </div>
                                    </a>`);
});



$('.blog-carousel').slick({
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



$.each(posts, function(ix, value) {
    var dt = moment.utc(value.updatedAt);
    $('#post-container').prepend(`<a href="${value.url}" class="blog-post">
                                        <div class="blog-post-thumbnail">
                                            <div class="blog-post-thumbnail-inner">
                                                <span class="blog-item-tag">${value.category}</span>
                                                <img src="${value.small_image}" alt="${value.headline}">
                                            </div>
                                        </div>

                                        <div class="blog-post-content bco">
                                            <span class="blog-post-date">${dt.format("LL")}</span>
                                            <h3>${value.headline}</h3>
                                            <p>${value.meta.description}</p>
                                        </div>

                                        <div class="entry-icon"></div>
                                    </a>`);
});
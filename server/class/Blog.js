require('dotenv').config({
    path: process.cwd() + '/../'
});

const db = require('./../model/db');




exports.getBlogPostByUrl = async (url) => {
    return await db.Blog.findOne({
        url: url,
        public: true
    });
}

exports.getBlogPostByUrlAdmin = async (url) => {
    return await db.Blog.findOne({
        url: url
    });
}


exports.getRelatedPosts = async (url, locale) => {
    return db.Blog.aggregate([{
            $match: {
                language: locale,
                url: { $ne: url },
                public: true
            }
        },
        { $sample: { size: 3 } }
    ]).exec();
}

exports.getFeaturedPosts = async (locale) => {
    return db.Blog.aggregate([{
            $match: {
                language: locale,
                featured: true,
                public: true
            }
        },
        { $sample: { size: 3 } }
    ]).sort({ updatedAt: 'asc' }).exec();
}

exports.rate = async (id, rating) => {
    if (rating == 1) {
        return db.Blog.updateOne({ _id: id }, {
            $inc: { helpful_yes: 1 }
        });
    }
    return db.Blog.updateOne({ _id: id }, {
        $inc: { helpful_no: 1 }
    });
}

exports.getAllPosts = async (locale) => {
    return db.Blog.find({
        language: locale,
        public: true
    }).sort({ updatedAt: 'asc' }).exec();
}
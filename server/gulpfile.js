const gulp = require("gulp");
const gutil = require("gulp-util");

const nodemon = require('gulp-nodemon');
const del = require('del');

const uglifyjs = require('gulp-uglify-es').default;
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const strip = require('gulp-strip-comments');
const purgecss = require('gulp-purgecss')

const javascriptObfuscator = require('gulp-javascript-obfuscator');




if (gutil.env.env == undefined) {
    console.error("ERROR: Please define --env=XXX to run build!");
    process.exit(0);
}

var isProdOrTest = gutil.env.env == "production" ? true : false;
console.log("Environment: ", gutil.env.env);
console.log("Is Production: ", isProdOrTest);



function startSourcemap() {
    return isProdOrTest === false ?
        sourcemaps.init() :
        gutil.noop();
}

function endSourcemap() {
    return isProdOrTest === false ?
        sourcemaps.write() :
        gutil.noop();
}


gulp.task("css", function() {
    del(["./public/css/**/*.css"]);

    return gulp.src("./src/css/**/*.css")
        .pipe(cleanCSS({
            compatibility: 'ie8'
        }))
        .pipe(gulp.dest("./public/css/"));


    // Issue modals
    //.pipe(purgecss({
    //    content: ['views/**/*.ejs', 'src/**/*.js']
    //}))
});

gulp.task('js-controller', function() {
    del(["./public/controller/**/*.js"]);

    return gulp.src('./src/controller/**/*.js')
        .pipe(strip())
        .pipe(startSourcemap())
        .pipe(javascriptObfuscator({
            compact: true
        }))
        .pipe(endSourcemap())
        .pipe(gulp.dest('./public/controller'));
});

gulp.task('js', function() {
    del(["./public/js/**/*.js"]);

    return gulp.src('./src/js/**/*.js')
        .pipe(strip())
        .pipe(startSourcemap())
        .pipe(uglifyjs())
        .pipe(endSourcemap())
        .pipe(gulp.dest('./public/js/'));
});

gulp.task('i18n-concat', function() {
    return gulp.src(['./src/js/i18n/CLDRPluralRuleParser.js', './src/js/i18n/jquery.i18n.js', './src/js/i18n/jquery.i18n.messagestore.js',
            './src/js/i18n/jquery.i18n.fallbacks.js', './src/js/i18n/jquery.i18n.parser.js', './src/js/i18n/jquery.i18n.emitter.js',
            './src/js/i18n/jquery.i18n.emitter.bidi.js', './src/js/i18n/jquery.i18n.language.js'
        ])
        .pipe(strip())
        .pipe(concat('bundle.js'))
        .pipe(startSourcemap())
        .pipe(uglifyjs())
        .pipe(endSourcemap())
        .pipe(gulp.dest('./public/js/i18n/'));
});

gulp.task('i18n-clean', function() {
    return del(['./public/js/i18n/CLDRPluralRuleParser.js', './public/js/i18n/jquery.i18n.js', './public/js/i18n/jquery.i18n.messagestore.js',
        './public/js/i18n/jquery.i18n.fallbacks.js', './public/js/i18n/jquery.i18n.parser.js', './public/js/i18n/jquery.i18n.emitter.js',
        './public/js/i18n/jquery.i18n.emitter.bidi.js', './public/js/i18n/jquery.i18n.language.js'
    ]);
})

gulp.task('rendering', function() {
    del(["./public/rendering/**/*.js"]);

    return gulp.src('./src/rendering/**/*.js')
        .pipe(strip())
        .pipe(startSourcemap())
        .pipe(uglifyjs())
        .pipe(endSourcemap())
        .pipe(gulp.dest('./public/rendering/'));
});

gulp.task('data', function() {
    del(["./public/data/**/*.js"]);

    return gulp.src('./src/data/**/*.js')
        .pipe(strip())
        .pipe(startSourcemap())
        .pipe(uglifyjs())
        .pipe(endSourcemap())
        .pipe(gulp.dest('./public/data/'));
});

gulp.task('fonts', function() {
    del(["./public/fonts/**/*.*"]);

    return gulp.src('./src/fonts/**/*.*')
        .pipe(gulp.dest('./public/fonts/'));
});

gulp.task('i18n', function() {
    del(["./public/i18n/**/*.*"]);

    return gulp.src('./src/i18n/**/*.*')
        .pipe(gulp.dest('./public/i18n/'));
});

gulp.task('images', function() {
    del(["./public/images/**/*.*"]);

    return gulp.src('./src/images/**/*.*')
        .pipe(gulp.dest('./public/images/'));
});

gulp.task('videos', function() {
    del(["./public/videos/**/*.*"]);

    return gulp.src('./src/videos/**/*.*')
        .pipe(gulp.dest('./public/videos/'));
});

gulp.task('sounds', function() {
    del(["./public/sounds/**/*.*"]);

    return gulp.src('./src/sounds/**/*.*')
        .pipe(gulp.dest('./public/sounds/'));
});

gulp.task('misc', function() {
    del(["./public/*.*"]);

    return gulp.src('./src/*.*')
        .pipe(gulp.dest('./public/'));
});



gulp.task("run", gulp.series("css", "js-controller", "js", "rendering", "data", "fonts", "images", "videos", "sounds", "i18n", "i18n-concat", "i18n-clean", "misc"));
gulp.task("watch", function() {
    gulp.watch("./src/css/**/*.*", gulp.series("css"));
    gulp.watch("./src/controller/**/*.*", gulp.series("js-controller"));
    gulp.watch("./src/js/**/*.*", gulp.series("js", "i18n", "i18n-concat", "i18n-clean"));
    gulp.watch("./src/rendering/**/*.*", gulp.series("rendering"));
    gulp.watch("./src/data/**/*.*", gulp.series("data"));
    gulp.watch("./src/fonts/**/*.*", gulp.series("fonts"));
    gulp.watch("./src/images/**/*.*", gulp.series("images"));
    gulp.watch("./src/videos/**/*.*", gulp.series("videos"));
    gulp.watch("./src/sounds/**/*.*", gulp.series("sounds"));

    gulp.watch("./src/i18n/**/*.*", gulp.series("js", "i18n", "i18n-concat", "i18n-clean"));

    gulp.watch("./src/*.*", gulp.series("misc"));

});

gulp.task("default", gulp.series("run"));
gulp.task("dev", gulp.series("run", "watch"));
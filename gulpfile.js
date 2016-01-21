(function() {
    'use strict';


    let log         = require('ee-log');
    let gulp        = require('gulp');
    let concat      = require('gulp-concat');
    let sourceMap   = require('gulp-sourcemaps');
    let expect      = require('gulp-expect-file');
    let uglify      = require('gulp-uglify');
    let rOptimize   = require('gulp-requirejs-optimize');



    let config = {
        js: {
            input: [
                'src/dash-video.js'
            ]
            , target:'dist'
        }
    };



    /**
     * minify js
     */
    gulp.task('js', function() {
        return gulp.src(config.js.input)
            //.pipe(expect(config.js.input))
            //.pipe(sourceMap.init({debug:true}))
            //.pipe(concat('dash-video.js'))
            .pipe(rOptimize({
                paths: {
                    bower: '../bower_components'
                }
                , optimize: 'uglify'
                , useStrict: true
                , findNestedDependencies: true
            }))
            //.pipe(sourceMap.write('./maps'))
            .pipe(gulp.dest(config.js.target));
    });
/*
    gulp.task('js-min', function() {
        return gulp.src(config.js.input)
            .pipe(expect(config.js.input))
            .pipe(sourceMap.init({debug:true}))
            .pipe(uglify())
            .pipe(concat('dash-video.min.js'))
            .pipe(rOptimize())
            .pipe(sourceMap.write('./maps'))
            .pipe(gulp.dest(config.js.target));
    });*/
})();

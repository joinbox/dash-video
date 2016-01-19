(function() {
    'use strict';


    let gulp        = require('gulp');
    let concat      = require('gulp-concat');
    let sourceMap   = require('gulp-sourcemaps');
    let expect      = require('gulp-expect-file');
    let uglify      = require('gulp-uglify');



    let config = {
        js: {
            input: [
                'src/types.js'
            ]
            , target:'dist'
        }
    };



    /**
     * minify js
     */
    gulp.task('js', function() {
        return gulp.src(config.js.input)
            .pipe(expect(config.js.input))
            .pipe(sourceMap.init({debug:true}))
            .pipe(concat('ee-types.js'))
            .pipe(sourceMap.write('./maps'))
            .pipe(gulp.dest(config.js.target));
    });

    gulp.task('js-min', function() {
        return gulp.src(config.js.input)
            .pipe(expect(config.js.input))
            .pipe(sourceMap.init({debug:true}))
            .pipe(uglify())
            .pipe(concat('ee-types.min.js'))
            .pipe(sourceMap.write('./maps'))
            .pipe(gulp.dest(config.js.target));
    });
})();

const gulp = require('gulp');
const cleanCss = require('gulp-clean-css');
const rename = require('gulp-rename');
const terser = require('gulp-terser');

gulp.task('min-js', function () {
	return gulp.src('multi-select2.js')
		.pipe(terser())
		.pipe(rename('multi-select2.min.js'))
		.pipe(gulp.dest('dist/'));
});

gulp.task('min-css', function () {
	return gulp.src('multi-select2.css')
		.pipe(cleanCss())
		.pipe(rename('multi-select2.min.css'))
		.pipe(gulp.dest('dist/'));
});

gulp.task('default', gulp.series('min-js', 'min-css'));

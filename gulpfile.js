'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var component = require('gulp-component');
var notify = require('gulp-notify');
var livereload = require('gulp-livereload');

var SCRIPTS = ['lib/*/*.js', '!lib/vendor/**/lib/**'];
var debug = false;

var server = require('tiny-lr')();

gulp.task('jshint', function() {
	gulp.src(SCRIPTS)
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'))
		.on('error', notify.onError('jscs error: <%= error.message %>'));
});

gulp.task('jscs', function() {
	gulp.src(SCRIPTS)
		.pipe(jscs())
		.on('error', notify.onError('jshint error: <%= error.message %>'));
});

gulp.task('lint', ['jshint', 'jscs']);

// Production build
gulp.task('build', ['lint'], function() {
	gulp.src('component.json')
		.pipe(component.scripts({
			dev: debug,
			name: 'acmejs'
		}))
		.on('error', notify.onError('build error: <%= error.message %>'))
		.pipe(concat('acme.js'))
		.pipe(gulp.dest('dist'))
		.pipe(livereload(server))
		.pipe(notify('✔ dist/acmejs.js'));
});

gulp.task('debug', function() {
	debug = true;
});

gulp.task('livereload', function() {
	server.listen(35729, function() {
		gutil.log('[livereload]', 'Listening');
	});
});

gulp.task('server', function() {
	var express = require('express');
	var app = express();
	app.use(require('connect-livereload')())
		.use(express.static(__dirname))
		.listen(8080, function() {
			gutil.log('[server]', 'Listening http://localhost:8080');
		});
});

gulp.task('watch', ['server', 'livereload', 'build'], function() {
	gulp.watch(SCRIPTS, ['build']);
});

gulp.task('default', ['build']);

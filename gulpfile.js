'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')({
	lazy: false
});
var server = require('tiny-lr')();

var pkg = require('./package.json');

var SCRIPTS = ['lib/*/**.js', '!lib/vendor/**/lib/**'];
var TESTS = 'test/**.test.js';
var WATCH = SCRIPTS.concat(TESTS);
var debug = false;

gulp.task('jshint', function() {
	return gulp.src(SCRIPTS)
		.pipe(plugins.jshint())
		.pipe(plugins.jshint.reporter('jshint-stylish'))
		.on('error', function handleError(err) {
			this.emit('end');
		});
});

gulp.task('jsxcs', function() {
	return gulp.src(SCRIPTS)
		.pipe(plugins.jsxcs({
			esnext: true
		}))
		.on('error', function handleError(err) {
			console.log(err.message);
			this.emit('end');
		});
});

gulp.task('typecheck', function() {
	return gulp.src(SCRIPTS)
		.pipe(plugins.flowtype({
			all: false,
			weak: false,
			killFlow: true,
			beep: false
		}));
});

gulp.task('lint', ['typecheck', 'jsxcs']);

gulp.task('test', ['build'], function() {
	return gulp.src(['test/*.test.js'], {
			read: false
		})
		.pipe(plugins.mocha({
			reporter: 'spec'
		}))
		.on('error', function handleError(err) {
			this.emit('end');
		});
});

gulp.task('docs', function() {
	return gulp.src(SCRIPTS)
		.pipe(plugins.jsdoc.parser({
			name: pkg.name,
			description: pkg.description,
			version: pkg.version,
			licenses: pkg.licenses || [pkg.license]
		}))
		.pipe(plugins.jsdoc.generator('./docs', {
			// path: 'ink-docstrap',
			// systemName: pkg.name,
			// footer: 'Generated with gulp',
			// copyright: 'Copyright Harald Kirschner 2014',
			// navType: 'inline',
			// theme: 'united',
			// linenums: true,
			// collapseSymbols: false,
			// inverseNav: false
		}, {
			'private': true,
			monospaceLinks: true,
			cleverLinks: true,
			outputSourceFiles: true
		}));
});

// Production build
gulp.task('build', ['lint'], function() {
	return gulp.src('lib/index.js')
		.pipe(plugins.webpack({
			devtool: 'source-map',
			debug: debug,
			output: {
				filename: 'acme.js',
				library: 'acmejs',
				libraryTarget: 'var'
			},
			module: {
				loaders: [{
					test: /\.js$/,
					loader: '6to5-loader'
				}]
			}
		}))
		.on('error', plugins.notify.onError('build error: <%= error.message %>'))
		// .pipe(plugins.concat('acme.js'))
		// .pipe(plugins.if(!debug, plugins.stripDebug(), plugins.uglify()))
		.pipe(gulp.dest('dist'))
		// .pipe(plugins.livereload(server))
		.pipe(plugins.notify('✔ dist/acme.js'));
	/*
	return gulp.src('component.json')
		.pipe(plugins.component.scripts({
			dev: debug,
			name: 'acmejs'
		}))
		.on('error', plugins.notify.onError('build error: <%= error.message %>'))
		.pipe(plugins.concat('acme.js'))
		// .pipe(plugins.if(!debug, plugins.stripDebug(), plugins.uglify()))
		.pipe(gulp.dest('dist'))
		// .pipe(plugins.livereload(server))
		.pipe(plugins.notify('✔ dist/acmejs.js'));
	*/
});

gulp.task('debug', function() {
	debug = true;
});

// gulp.task('livereload', function() {
// 	livereload.listen();
// 	server.listen(35729, function() {
// 		// plugins.util.log('Livereload listening');
// 	});
// });

gulp.task('server', function() {
	require('portfinder').getPort(function(err, port) {
		var app = require('express')();
		app
		// .use(require('connect-livereload')())
			.use(require('serve-static')(__dirname))
			.use(require('serve-index')(__dirname))
			.listen(port, function() {
				plugins.util.log('Listening http://localhost:' + port);
			});
	});
});

gulp.task('watch', ['server', 'test'], function() {
	gulp.watch(WATCH, ['test']);
});

gulp.task('default', ['build']);
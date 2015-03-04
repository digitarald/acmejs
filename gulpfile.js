'use strict';

var argv = require('yargs')
	.boolean('verbose')
	.alias('v', 'verbose')
	.boolean('debug')
	.alias('d', 'debug')
	.boolean('production')
	.alias('p', 'production')
	.argv;
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')({
	lazy: false
});
var server = require('tiny-lr')();

var pkg = require('./package.json');

var ENTRY = 'lib/index.js';
var SCRIPTS = [ENTRY, 'lib/*/**.js', 'lib/vendor/*/**.js', '!lib/vendor/**/lib/**'];
var TESTS = 'test/*/**.test.js';
var WATCH = SCRIPTS.concat(TESTS);

require('babel/register')({
	modules: 'common',
	sourceMap: 'inline'
});

function handleError(err) {
	console.error(argv.debug ? err.toString() : err.message);
	this.emit('end');
}

gulp.task('jshint', function() {
	return gulp.src(SCRIPTS)
		.pipe(plugins.jshint())
		.pipe(plugins.jshint.reporter('jshint-stylish'))
		.on('error', handleError);
});

gulp.task('jscs', function() {
	return gulp.src(SCRIPTS)
		.pipe(plugins.jscs({
			esnext: true
		}))
		.on('error', handleError);
});

// gulp.task('typecheck', function() {
// 	return gulp.src(SCRIPTS)
// 		.pipe(plugins.flowtype({
// 			all: false,
// 			weak: false,
// 			killFlow: true,
// 			beep: false
// 		}));
// });

gulp.task('lint', ['jscs']); // 'typecheck',

gulp.task('test', function() { // , ['lint']
	return gulp.src(TESTS, {
			read: false
		})
		.pipe(plugins.mocha({
			reporter: argv.verbose ? 'spec' : 'dot',
			bail: true
		}))
		.on('error', handleError);
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

gulp.task('build-all', ['test'], function() {
	return gulp.src(ENTRY)
		.pipe(plugins.webpack({
			devtool: argv.production ? null : 'source-map',
			debug: argv.debug,
			cache: true,
			output: {
				filename: 'acme-all.js',
				library: 'acmejs',
				libraryTarget: 'var'
			},
			module: {
				loaders: [{
					test: /\.js$/,
					loader: 'babel-loader?modules=common&experimental' // &optional=runtime
				}]
			}
		}))
		.on('error', plugins.notify.onError('build error: <%= error.message %>'))
		.pipe(gulp.dest('dist'))
		.pipe(plugins.notify('✔ dist/acme.js'));
});

// Production build
gulp.task('build-umd', ['build-all'], function() {
	plugins.livereload.reload();
	return gulp.src(SCRIPTS)
		.pipe(plugins.sourcemaps.init())
		.pipe(plugins['babel']({
			modules: 'umd'
		}))
		.on('error', handleError)
		.pipe(plugins.concat('acme.js'))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest('dist'));
});

gulp.task('build', ['build-umd']);

gulp.task('server', function() {
	plugins.livereload.listen({
		// quiet: true
	});
	require('portfinder').getPort(function(err, port) {
		var app = require('express')();
		app
			.use(require('serve-static')(__dirname))
			.use(require('serve-index')(__dirname))
			.listen(port, function() {
				plugins.util.log('Listening http://localhost:' + port);
			});
	});
});

gulp.task('watch', ['server', 'build'], function() {
	gulp.watch(WATCH, ['build']);
});

gulp.task('default', ['build']);

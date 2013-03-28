# https://github.com/EightMedia/ps-barbershop/blob/master/Gruntfile.coffee
# https://github.com/oal/Coffify/blob/master/Gruntfile.coffee

module.exports = (grunt) ->

	grunt.loadNpmTasks('grunt-contrib-watch')
	grunt.loadNpmTasks('grunt-contrib-coffee')
	grunt.loadNpmTasks('grunt-shell')


	grunt.initConfig

		# watch files
		# watch:
		#	coffee:
		#		files: ['lib/**/*.coffee', 'examples/**/*.coffee']
		#		tasks: ['build']
		#		options:
		#			interrupt: true

		watch:
			js:
				files: ['lib/**/*.js', 'examples/**/index.js']
				tasks: ['shell']

		coffee:
			options:
				bare: yes
			glob_to_multiple:
				expand: true
				src: ['lib/**/*.coffee', 'examples/**/*.coffee']
				ext: '.js'

		shell:
			browserify:
				command: 'browserify ./examples/putpuck/index.js > ./examples/putpuck/build.js && browserify ./examples/bench/index.js > ./examples/bench/build.js && browserify ./examples/raid/index.js > ./examples/raid/build.js'
				options:
					stdout: true
					stderr: true
					failOnError: true

	# task
	grunt.registerTask('default', ['build', 'watch'])
	grunt.registerTask('build', ['shell'])

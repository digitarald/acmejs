'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    watch: {
      js: {
        files: ['lib/**/*.js', 'examples/**/index.js'],
        tasks: ['shell']
      }
    },
    shell: {
      browserify: {
        command: 'browserify ./examples/putpuck/index.js > ./examples/putpuck/build.js && browserify ./examples/bench/index.js > ./examples/bench/build.js && browserify ./examples/raid/index.js > ./examples/raid/build.js && browserify ./examples/rigid-device/index.js > ./examples/rigid-device/build.js',
        options: {
          stdout: true,
          stderr: true,
          failOnError: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', ['build', 'watch']);
  grunt.registerTask('build', ['shell']);
};

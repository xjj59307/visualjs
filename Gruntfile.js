module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      files: ['*.js', 'debugger/*.js', 'spec/*.js'],
      options: { ignores: ['debugger/visualjs.js'] }
    },
    jasmine_node: { forceExit: true }
  });

  // Load the plugin that provides the grunt-jasmine-node task.
  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default tasks.
  grunt.registerTask('default', ['jasmine_node']);

};

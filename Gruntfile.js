module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        jasmine_node: {
            specNameMatcher: "./spec", // load only specs containing specNameMatcher
            projectRoot: ".",
            requirejs: false,
            forceExit: true,
            jUnit: {
                report: false,
                savePath : "./build/reports/jasmine/",
                useDotNotation: true,
                consolidate: true
            }
        }
    });

    // Load the plugin that provides the grunt-jasmine-node task.
    grunt.loadNpmTasks('grunt-jasmine-node');

    // Default tasks.
    grunt.registerTask('default', 'jasmine_node');

};

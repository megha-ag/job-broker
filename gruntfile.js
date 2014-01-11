module.exports = function(grunt) {
  // set up grunt
  grunt.initConfig({
    jshint: {
      src: ['server.js', 'src/**/*.js'],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          require: true,
          define: true,
          requirejs: true,
          describe: true,
          expect: true,
          it: true
        }
      }
    },
	jasmine_node: {
	    specNameMatcher: "spec", // load only specs containing specNameMatcher
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

  // Load JSHint task
  grunt.loadNpmTasks('grunt-contrib-jshint');

  //Load Jasmine task
  grunt.loadNpmTasks('grunt-jasmine-node');

  // Default task.
  grunt.registerTask('default', ['jshint', 'jasmine_node']);
};
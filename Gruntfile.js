module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: ';\n'
			},
			core:{
				src: [
					'core/_script/lib/**/*.js',
                    '!core/_script/lib/mapboxgl.1.5.1.js',
					'core/_script/map/**/*.js',
					'core/_script/translation/**/*.js'

				],
				dest: 'build/_script/core.js'
			},
			map:{
				src: [
					'_script/custom/*.js',
					'_script/config.js'
				],
				dest: 'build/_script/webmapping.js'
			},
			c3:{
				src: [
					'core/_script/c3/**/*.js'
				],
				dest: 'build/_script/c3d3.js'
			},
			mapbox:{
                src: [
                    'core/_script/lib/mapboxgl.1.5.1.js'
                ],
                dest: 'build/_script/mapboxgl.js'
            }
		},
		uglify: {
			options: {
				mangle: {
					toplevel:false
				},
				mangleProperties: false,
				nameCache: 'grunt-uglify-cache.json',
				banner: '/*<%= pkg.name %> v<%= pkg.version %> by <%= pkg.author %> - ' + 'build <%= grunt.template.today("yyyy-mm-dd") %> */',
				compress: {
					sequences     : true,  // join consecutive statemets with the “comma operator”
					properties    : true,  // optimize property access: a["foo"] → a.foo
					dead_code     : true,  // discard unreachable code
					drop_console  : true,
					drop_debugger : true,  // discard “debugger” statements
					unsafe        : false, // some unsafe optimizations (see below)
					conditionals  : true,  // optimize if-s and conditional expressions
					comparisons   : true,  // optimize comparisons
					evaluate      : true,  // evaluate constant expressions
					booleans      : true,  // optimize boolean expressions
					loops         : true,  // optimize loops
					unused        : true,  // drop unused variables/functions
					hoist_funs    : true,  // hoist function declarations
					hoist_vars    : false, // hoist variable declarations
					if_return     : true,  // optimize if-s followed by return/continue
					join_vars     : true,  // join var declarations
					side_effects  : true,  // drop side-effect-free statements
					warnings      : true,  // warn about potentially dangerous optimizations/code
					global_defs   : {},
					pure_getters  : true
				},
				beautify: false
			},
			map:{
				files: {
					'build/_script/webmapping-min.js': ['build/_script/webmapping.js']
				}
			},
			core:{
				files: {
					'build/_script/core-min.js': ['build/_script/core.js']
				}
			}
		},
		clean: {
			js: ['build/_script/webmapping.js','build/_script/core.js'],
			build: ['build/**/*'],
			core: ['core/']
		},
		replace: {
			buildnumber: {
				src: ['index_src.html'],
				dest: 'build/index.html',
				replacements: [{
					from: '{build}',
					to: function (matchedWord) {
						return grunt.template.process('<%= pkg.version %>-build<%= grunt.template.today("yyyymmdd.hhMM") %>');
					}
				},
				{
					from: '{version}',
					to: function (matchedWord) {
						return grunt.template.process('<%= pkg.version %>');
					}
				}]
			},
			dev: {
				src: ['dev_src.html'],
				dest: 'build/dev.html',
				replacements: [{
					from: '{build}',
					to: function (matchedWord) {
						return grunt.template.process('<%= pkg.version %>-build<%= grunt.template.today("yyyymmdd.hhMM") %>');
					}
				},
					{
						from: '{version}',
						to: function (matchedWord) {
							return grunt.template.process('<%= pkg.version %>');
						}
					}]
			}
		},
		gitclone: {
			clone: {
				options: {
					repository: 'https://github.com/IPISResearch/webmapping_core.git',
					branch: 'master',
					directory: 'core'
				}
			}
		},
		copy: {
			main: {
				files: [
					// includes files within path and its sub-directories
					{expand: true, src: ['_img/**'], dest: 'build/'},
					{expand: true, src: ['_templates/**'], dest: 'build/'},
					{expand: true, src: ['_data/**'], dest: 'build/'},
					{expand: true, src: ['_style/**'], dest: 'build/'},
					{expand: true, cwd: 'core/_style/', src: ['*'], dest: 'build/_style/'}
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-git');

	// Default task(s).
	// note:  use concat before uglify to keep the order of the JS files
	grunt.registerTask('init', ['clean:core','gitclone']);
	grunt.registerTask('map', ['clean:core','gitclone','clean:build','copy','replace','concat','uglify','clean:js','alldone']);
	grunt.registerTask('core', ['concat:core','uglify:core','clean:js']);
	grunt.registerTask('default', ['map']);
	grunt.registerTask('alldone', function() {
		grunt.log.writeln("\nAll done, you'll find your compiled map in the 'build' directory"['cyan']);
	});

};
const _ = require("lodash");
const path = require("path");
const fs = require("fs");
const pug = require("pug");
const PUG_ADMIN_TEMPLATE = __dirname + "/public/js/admin-templates.js";

module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    "sass": {
      dist: {
        options: {
          style: "compressed"
        },
        files: [{
          expand: true,
          cwd: "scss",
          src: ["**/*.scss"],
          dest: "public/css",
          ext: ".min.css"
        }]
      }
    },
    "babel": {
      options: {
        sourceMap: true,
        minified: false
      },
      dist: {
        files: [{
          expand: true,
          cwd: "src/js",
          src: ["*.js"],
          dest: "public/js/",
          ext: ".min.js"
        }]
      }
    }
  });
  
  grunt.registerTask("default", ["babel", "sass"]);
};
'use strict';

var fs = require('fs');
var through = require('through2');
var gutil = require('gulp-util');

var spec = function (name) {
  var spec = '', filename;
  var currentSpec;
  var dic = {};

  return through.obj(function (file, enc, callback) {
    var path = file.path;
    var subdir;
    var fileNameSearch = path.match(/(\w+)\.spec\.js$/);
    if (fileNameSearch) {
      filename = fileNameSearch[1];
    }
    var subdirSearch = path.match(/spec\\([a-zA-Z0-9\\]+)\\\w+\.spec\.js$/);
    if (subdirSearch) {
      subdir = subdirSearch[1];
    }
    if (filename && subdir) {
      currentSpec = getCurrentSpec(dic, subdir);
      currentSpec[filename] = file.contents.toString();
    }

    callback();
  }, function (callback) {
    spec += "describe(\"Spec\", function () {\r\n" + spec;
    spec = buildSpec(spec, dic);
    spec += "\r\n});";

    var file = new gutil.File({ cwd: '', base: '', path: name, contents: new Buffer(spec) });

    this.unshift(file);

    callback();
  });
};

module.exports = spec;

var getCurrentSpec = function (dic, subdir) {
  var obj = dic;
  if (subdir) {
    var fragments = subdir.split('\\');
    for (var i = 0; i < fragments.length; i++) {
      if (!(fragments[i] in obj)) {
        obj[fragments[i]] = {};
      }
      obj = obj[fragments[i]];
    }
  }
  return obj;
};

var buildSpec = function (spec, obj) {
  if (obj.Describe) {
    spec += '\r\n' + indent(obj.Describe) + '\r\n';
  }
  var propertyName,
      subSpec;
  for (propertyName in obj) {
    if (propertyName !== 'Describe' && typeof obj[propertyName] === 'string') {
      spec += '\r\n' + indent(obj[propertyName]) + '\r\n';
    }
  }
  for (propertyName in obj) {
    if (propertyName !== 'Describe' && typeof obj[propertyName] === 'object') {
      subSpec = '\r\n' + "describe(\"package's '" + propertyName + "' spec\", function () {" + '\r\n';
      subSpec = buildSpec(subSpec, obj[propertyName]);
      subSpec += '\r\n' + "});" + '\r\n';
      spec += indent(subSpec);
    }
  }
  return spec;
};

var indent = function (src) {
  var lines = src.split('\r\n');
  for (var i = 0; i < lines.length; i++) {
    lines[i] = '  ' + lines[i];
  }
  return lines.join('\r\n');
};
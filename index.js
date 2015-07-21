//https://github.com/fex-team/fis3/blob/master/lib/file.js

var handlebars = require('handlebars');
var fs = require('fs')
var path = require('path')
module.exports = function(content, file, opt){
	var _dataPath = opt.dataFile
	var dataPath = path.join(file.dirname,_dataPath)
	console.log(file.dirname)
	var template = handlebars.compile(content)
	var data
	try{
		data = require(dataPath).data
	}catch(e){
		console.error(e)
		data = {}
	}

  return template(data);
};

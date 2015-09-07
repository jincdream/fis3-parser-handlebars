//https://github.com/fex-team/fis3/blob/master/lib/file.js

var Handlebars = require('handlebars');
var layouts    = require('handlebars-layouts');
Handlebars.registerHelper(layouts(Handlebars));
var fs          = require('fs')
var path        = require('path')
var util        = require('util')

var cache       = require.cache
var layoutCache = {}
var _layoutPath = './layout/'
module.exports = function(content, file, opt){
	var _dataPath = opt.dataFile
	var dataPath  = path.join(file.dirname,_dataPath)
	var fileName  = file.filename
  !file._orgData && (file._orgData = content);
  var _data = util._extend({charset:file.charset.replace('utf','utf-')},opt._data || {})
  var data,_dataFile,template
  if(cache[dataPath])delete cache[dataPath];
  try{
    _dataFile = require(dataPath)
  }catch(e){
  }
  if(_dataFile){
    data = _dataFile.data
    _dataFile._extend && _dataFile._extend(Handlebars,data)
  }else{
    data = {}
  }
  util._extend(data,_data)
  var _reg = /Error\:\sMissing\spartial\:\s\'(.*?)\'/
  var _content
  var _cacheLayout = layoutCache[file.id]
  if(_cacheLayout){
    Handlebars.registerPartial(_cacheLayout.name,fs.readFileSync(_cacheLayout.layout).toString())
  }
  template = Handlebars.compile(file._orgData)
  try{
    _content = template(data);
  }catch(e){
    var _e = e + ''
    if(_reg.test(_e)){
      var _layout = _e.replace(_reg,'$1')
      var _layoutDir = path.join(file.dirname,_layoutPath)
      var _layoutFile =  path.join(_layoutDir,'./' + _layout + '.html')
      console.log('loadding layout: '+ _layoutFile)
      Handlebars.registerPartial(_layout,fs.readFileSync(_layoutFile).toString())
      _content = Handlebars.compile(content)(data)
      layoutCache[file.id] = {
        layout : _layoutFile,
        name   : _layout
      }
    }else{
      _content = content
    }
  }
  return _content
};

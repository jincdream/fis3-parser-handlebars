//https://github.com/fex-team/fis3/blob/master/lib/file.js

var Handlebars = require('handlebars');
var layouts    = require('handlebars-layouts');
Handlebars.registerHelper(layouts(Handlebars));
var fs          = require('fs')
var path        = require('path')
var util        = fis.util
var pre         = require('./pre/index.js')
var cache       = require.cache
var layoutCache = {}
var _layoutPath = './layout/'

module.exports = function(content, file, opt){
  var _dataPath = opt.dataFile
  var dataPath  = path.join(file.dirname,_dataPath)
  var fileName  = file.filename
  // !file._orgData && (file._orgData = content);
  var _data = util.assign({charset:file.charset.replace('utf','utf-')},opt._data || {})
  var data,_dataFile,template

    
  // if(opt._edite){
  //   var org = '' + fs.readFileSync(file.origin)
  //   org.replace(/\{\{\#(\S*?)\}\}/)
  // }
  // console.log(_data)
  
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
  util.assign(data,_data)

  var editeHtml = content
  // if(opt._edite){
  var editHtmlFile = path.resolve(file.origin,'../','../source/edit/',file.basename)
  var editDataFile = path.resolve(dataPath,'../','../source/edit/','./'+file.basename.replace('.html','')+'_data.js')
  // }
  var preObj = pre(content,data,editDataFile,editHtmlFile)
  content = preObj.content
  util.assign(data,preObj.data)
  
  console.log(data)
  var _reg = /Error\:\sMissing\spartial\:\s\'(.*?)\'/
  var _content
  var _cacheLayout = layoutCache[file.id]
  if(_cacheLayout){
    // Handlebars.registerPartial(_cacheLayout.name,fs.readFileSync(_cacheLayout.layout).toString())
    // Handlebars.unregisterPartial(_cacheLayout.name)
  }
  template = Handlebars.compile(content)
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
      Handlebars.unregisterPartial(_layout)
    }else{
      _content = content
    }
  }
  
  // _content = _content.replace(/\{\@(.*?)\}/g,function(m,a){
  //   console.log(a,'aa')
  //   var mock = 'mock'+_preTime+'_' + (_k++)
  //   var _mock = a.split(':')
  //   var name = _mock[0]
  //   var arg = _mock[1]
  //   console.log(a)
  //   allMockData[mock] = mockData[name](arg)
  //   return allMockData[mock]
  // })
  return _content
};

//https://github.com/fex-team/fis3/blob/master/lib/file.js

var Handlebars = require('handlebars');
var layouts    = require('handlebars-layouts');
Handlebars.registerHelper(layouts(Handlebars));
var fs          = require('fs')
var path        = require('path')
var util        = fis.util

var cache       = require.cache
var layoutCache = {}
var _layoutPath = './layout/'
var mockData = {
    url: function(n){
      n === void 0 && (n = '')
      return 'http://www.pconline.com.cn?mock=' + (n)
    },
    title: function _text(n){
      n === void 0 && (n = 6)
      var i = 0
      var text = ["\u592A","\u5E73","\u6D0B","\u7535","\u8111","\u7F51"]
      var rz = []
      while(i < n){
        rz.push(text[i++%6])
      }
      return rz.join('')
    },
    text: function __text(n){
      n === void 0 && (n = 6)
      var k = n/10 * 6
      var i = 0
      var text = ["\u592A","\u5E73","\u6D0B","\u7535","\u8111","\u7F51"]
      var dot = '\u3002'
      var rz = []
      while(i < n){
        var m = Math.random() * k | 0
        if(rz[i-1]!== dot && m === i%k){
          rz.push(dot)
          i++
          continue
        }
        rz.push(text[i++%6])
      }
      return rz.join('')
    },
    img:function _img(wx,text){
      var randomColor = ('00000'+(Math.random()*0x1000000<<0).toString(16)).slice(-6);
      return 'http://dummyimage.com/'+wx+'/'+randomColor+'/FFF'+ (text ? '&text='+text : '')
    }
  }
module.exports = function(content, file, opt){
  var _dataPath = opt.dataFile
  var dataPath  = path.join(file.dirname,_dataPath)
  var fileName  = file.filename
  // !file._orgData && (file._orgData = content);
  var _data = util.assign({charset:file.charset.replace('utf','utf-')},opt._data || {})
  var data,_dataFile,template,_k = 0

    
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
  var _preTime = data._editerSaveTime === void(0) ? '' : data._editerSaveTime
  content = content.replace(/\{\{\#(.*?)\}\}([\s\S]*?)\{\{\/\1\}\}/gm,function(m,blockName,content){
    var item = data[blockName]
    var k = 0
    var _mockData = {}
    if(blockName === 'html'){
      var mock = 'mock'+_preTime+'_' + blockName + '_' + (k++)
      data[mock] = new Handlebars.SafeString(content)
      return '{{'+mock+'}}'
    }
    if(item && Array.isArray(item)){
      // item.push
      var ln = item.length
      var itIndex = 0
      content = content
      .replace(/\{\{\.\}\}/g,function(){
        return '{{_org_'+blockName+'}}'
      })
      .replace(/\{\{\@(.*?)\}\}/g,function(_m,_a){
        var _mock = _a.split(':')
        var name = _mock[0]
        var arg = _mock[1]
        var mock = 'mock'+_preTime+'_' + name + '_' + (k++) + '_' + blockName
        console.log(name, '  name')
        _mockData[mock] = mockData[name](arg)
        return '{{' + mock + '}}'
      })
      item.forEach(function(obj, index){
        var _org = obj
        if(('' + _org).toLowerCase() !== '[object object]'){
          obj = {}
          obj['_org_'+blockName] = _org
        }
        data[blockName][index] = util.assign(obj,_mockData)
      })
    }
    return '{{#' + blockName + '}}' + content + '{{/'+ blockName +'}}'
  })
  .replace(/\{\{\@(.*?)\}\}/g,function(m,a){
    var _mock = a.split(':')
    var name = _mock[0]
    var arg = _mock[1]
    var mock = 'mock'+_preTime+'_' +name+'_'+ (_k++)
    if(mockData[name]){
      data[mock] = mockData[name](arg)
      return '{{' + mock + '}}'
    }
    return m
  })

  var editeHtml = content
  // if(opt._edite){
    fs.createWriteStream(path.resolve(file.origin,'../','../source/edite/',file.basename)).write(content)
    var _strData = JSON.stringify(data, null, "\t");
    fs.createWriteStream(path.resolve(dataPath,'../','../source/edite/','./_data.js')).write(_strData)
  // }
  
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

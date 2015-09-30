var fs = require('fs')
var path = require('path')
var getMock = {
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
module.exports = function(content,orgData,dataFile,htmlFile){
  var _k = 0
  var data
  try{
    data = JSON.parse('' + fs.readFileSync(dataFile))
  }catch(e){
    data = {}
  }
  var _preTime = data._editerSaveTime === void(0) ? '' : data._editerSaveTime
  var c = content.replace(/\{\{\#(.*?)\}\}([\s\S]*?)\{\{\/\1\}\}/gm,function(m,blockName,content){
    var item = orgData[blockName]
    var k = 0
    var mockData = {}
    // if(blockName === 'html'){
    //   var mock = 'mock'+_preTime+'_' + blockName + '_' + (k++)
    //   data[mock] = new Handlebars.SafeString(content)
    //   return '{{'+mock+'}}'
    // }
    if(blockName === 'html'){
      var mock = 'mock'+_preTime+'_' + blockName + '_' + (k++)
      data[mock] = content
      return '{{{'+mock+'}}}'
    }else if(item && Array.isArray(item)){
      // item.push
      data[blockName] = []
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
        mockData[mock] = getMock[name](arg)
        return '{{' + mock + '}}'
      })
      item.forEach(function(obj, index){
        var _org = obj
        if(('' + _org).toLowerCase() !== '[object object]'){
          obj = {}
          obj['_org_'+blockName] = _org
        }
        data[blockName][index] = util.assign(obj,mockData)
      })
    }
    return '{{#' + blockName + '}}' + content + '{{/'+ blockName +'}}'
  })
  .replace(/\{\{\@(.*?)\}\}/g,function(m,a){
    var _mock = a.split(':')
    var name = _mock[0]
    var arg = _mock[1]
    var mock = 'mock'+_preTime+'_' +name+'_'+ (_k++)
    if(getMock[name]){
      data[mock] = getMock[name](arg)
      return '{{' + mock + '}}'
    }
    return m
  })
  fs.createWriteStream(htmlFile).write(c)
  var _strData = JSON.stringify(data, null, "\t")
  fs.createWriteStream(dataFile).write(_strData)
  return {content:c,data:data}
}
var fs = require('fs')
var path = require('path')
var util = require('util')
var objIn = function(objA,objB){
  var o = {}
  Object.keys(objA).forEach(function(name, i){
    console.log(objA[name],name)
    console.log(objB[name ])
    if(objA[name] && objB[name]){
      o[name] = objB[name]
    }
  })
  return o
}
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
module.exports = function(content,orgData,dataFile,htmlFile,fileObj){
  var _k = 0
  var data
  var _eData = ['__delete__','__add__']
  try{
    data = JSON.parse('' + fs.readFileSync(dataFile))
  }catch(e){
    data = {}
  }
  var _preTime = data._editerSaveTime === void(0) ? '' : data._editerSaveTime


  Object.keys(data).forEach(function(n,i){
    if(n === '__delete__'){
      /*
        __delete__:{
          items: [1,3,4]
        }
      */
      Object.keys(data[n]).forEach(function(items,k,ary){
        var a = data[items]
        var b = orgData[items]
        if(a.length === b.length){
          delete data[n][items]
        }
      })
      Object.keys(data[n]).forEach(function(items,k,ary){
        data[n][items].forEach(function(j){
          console.log(n,items,k,'---')
          orgData[items][j] && orgData[items].splice(j,1)
        })
      })
    }else if(n === '__add__'){
      Object.keys(data[n]).forEach(function(items,k,ary){
        var a = data[items]
        var b = orgData[items]
        if(a.length === b.length){
          delete data[n][items]
        }
      })
    }
  })


  var c = content
  .replace(/\{\{(mock[\d]*?_.*?)\}\}/gm,function(m,n){
    _eData.push(n)
    return m
  })
  .replace(/\{\{\#(.*?)\}\}([\s\S]*?)\{\{\/\1\}\}/gm,function(m,blockName,content){
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
      _eData.push(mock)
      return '{{{'+mock+'}}}'
    }else if(item && Array.isArray(item)){
      // item.push
      data[blockName] = data[blockName] || []
      _eData.push(blockName)
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
        _eData.push(mock)
        return '{{' + mock + '}}'
      })
      item.forEach(function(obj, index){
        var _org = obj
        var _mockOrg = {}
        if(('' + _org).toLowerCase() !== '[object object]'){
          obj = {}
          obj['_org_'+blockName] = _org
        }
        data[blockName][index] && util._extend(_mockOrg,data[blockName][index])
        obj = util._extend(_mockOrg,obj)
        console.log('pre \n',obj)
        data[blockName][index] = util._extend(obj,mockData)
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
      _eData.push(mock)
      return '{{' + mock + '}}'
    }
    return m
  })
  var _data = {}
  ;(_preTime !== '') && _eData.push('_editerSaveTime') && Object.keys(data).forEach(function(n,i){

      console.log(_eData.indexOf(n),n)
    
    if(!~_eData.indexOf(n)){
      delete data[n]
    }
  })
  
  fs.writeFileSync(htmlFile,c)
  console.log(fileObj.links)
  var _strData = JSON.stringify(data, null, "\t")
  fs.createWriteStream(dataFile).write(_strData)
  return {content:c,data:data}
}
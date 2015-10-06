'use strict';

var request = require('request');
var fs = require('fs');

function pvim(message, cb){
    if(message.length <= 'print(#Hello, world!#)'){
      cb(true, message);
      return;
    }
    request.post('http://cfp.vim-cn.com/',
       {form: {vimcn: message}},
        function optionalCallback(err, httpResponse, body) {
          if (err || httpResponse.statusCode != 200) {
            console.error('Post to cfp.vim-cn.com failed', err);
            cb(true, message);
            return;
          }
          cb(false, body);
          return;
        });
}

function imgvim(url, cb){

    var data =request.get(url)
      .on('response', function(response) {
        console.log(response.statusCode) // 200
        console.log(response.headers['content-type']) // 'image/png'
      });

    request.post({url:'https://img.vim-cn.com/', formData: {name: data}},
      function optionalCallback(err, httpResponse, body) {
        if (err || httpResponse.statusCode != 200) {
          console.error('Post to img.vim-cn.com failed', err);
          cb(true, body);
          return;
        }
        cb(false, body);
        return;
      });
}

function test(){
    pvim('testing\nabc\nadd\nethis is a log message', function cb(url) {console.log(url);});
}


function testImg(){
  imgvim('https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
    function cb(err,url) {console.log(url);});
}


exports.pvim = pvim;

exports.imgvim =imgvim;

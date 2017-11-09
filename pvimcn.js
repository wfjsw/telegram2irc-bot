'use strict';

var request = require('request');
var stream = require('stream');
var fs = require('fs');
var cp = require("child_process");

function pvim(message, cb){
    if(message.length <= 'print(#Hello, world!#)'){
      cb(true, message);
      return;
    }
    request.post('https://fars.ee/?u=1',
       {form: {c: message}},
        function optionalCallback(err, httpResponse, body) {
          if (err || httpResponse.statusCode != 200) {
            console.error('Post txt to fars.ee failed', err);
            cb(true, message);
            return;
          }
          cb(false, body);
          return;
        });
}

function imgvim(url, cb){
    var ext=url.match(/.*(\..*)$/)[1];
    var data =request.get(url)
      .on('response', function(response) {
        console.log(response.statusCode) // 200
        console.log(response.headers['content-type']) // 'image/png'
      });

    request.post({url:'https://fars.ee/?u=1', formData: {c: data}},
      function optionalCallback(err, httpResponse, body) {
        if (err || httpResponse.statusCode != 200) {
          console.error('Post img to fars.ee failed', err);
          cb(true, body);
          return;
        }
        cb(false, body.trim());
        return;
      });
}

function imgwebp(url, cb){
    var convert = cp.spawn("convert", ["-define", "png:exclude-chunks=date,time", "webp:-", "png:-"], {shell: false});
    request.get(url)
    .on('response', (response) => {
        console.log(url)
    })
    .pipe(convert.stdin);

    var buffers=[];
    convert.stdout.on('data', (data) =>{
        buffers.push(data);
    });

    convert.on("close", () => {
        request.post({url:'https://fars.ee/?u=1', formData: {
            c: {value: Buffer.concat(buffers),
                options: {filename: "c.png", contentType: "image/png"}}}
        }, (err, httpResponse, body) => {
            if (err || httpResponse.statusCode != 200) {
                console.error('Post webp to fars.ee failed', err);
                cb(true, body);
                return;
            }
            cb(false, body.trim());
            return;
        });
    });
}

function test(){
    pvim('testing\nabc\nadd\nethis is a log message', function cb(err,url) {console.log(url);});
}


function testImg(){
  imgvim('https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
    function cb(err,url) {console.log(url);});
}

function testWebp(){
  imgwebp('http://www.gstatic.com/webp/gallery/1.webp',
    function cb(err,url) {console.log(url);});
}


exports.pvim = pvim;

exports.imgvim =imgvim;
exports.imgwebp =imgwebp;

//testWebp();
//test();
//testImg();


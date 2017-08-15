'use strict';

var jf = require('jsonfile');
var path = require('path');

function root(f) {
	return path.join(__dirname, '.', f || '');
}

var names = {};
var file = root('./config/nicks.json');

function setNick(id, nick){
	var names = jf.readFileSync(file);
	names[id]=nick;
	jf.writeFileSync(file, names);
	reload();
}

function getNick(id){
	if(id in names){
		return names[id];
    } else {
        return false;
    }
}

function tests(){
	setNick("farseerfc", "fc");
}

function initJson(){
	var names = {};
	jf.writeFileSync(file, names);
}

function reload(){
	names = jf.readFileSync(file);
}

reload();

// initJson();
// tests();

exports.setNick = setNick;
exports.getNick = getNick;

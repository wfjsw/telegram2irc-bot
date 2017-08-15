'use strict';

var jf = require('jsonfile');
var path = require('path');
var names = {};

function root(f) {
	return path.join(__dirname, '.', f || '');
}

function setNick(id, nick){
	var file = root('config/nicks.json');
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
	jf.writeFileSync("nicks.json", names);
}

function reload(){
	names = jf.readFileSync("nicks.json");
}

reload();

// initJson();
// tests();

exports.setNick = setNick;
exports.getNick = getNick;

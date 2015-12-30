'use strict';

var jf = require('jsonfile');
var names = {};

function setNick(tgname, nick){
	var names = jf.readFileSync("nicks.json");
	names[tgname]=nick;
	jf.writeFileSync("nicks.json", names);
	reload();
}

function getNick(tgname){
	if(tgname in names){
		return names[tgname];
	}
	return tgname;
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
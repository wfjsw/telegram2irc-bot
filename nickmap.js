'use strict';

var jf = require('jsonfile');
var names = {};

function setNick(id, nick){
	var names = jf.readFileSync("nicks.json");
	names[id]=nick;
	jf.writeFileSync("nicks.json", names);
	reload();
}

function getNick(id){
	if(id in names){
		return names[id];
	}
	return false;
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

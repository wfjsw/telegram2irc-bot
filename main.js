#!/usr/bin/env node --harmony

// Total hours wasted here -> 12
// ^ Do Not Remove This!

'use strict';


var Telegram = require('telegram-bot');
var IRC = require('irc');
var pvimcn = require('./pvimcn.js');
var config = require('./config.json');


var tg = new Telegram(config.tgbot.token);
var client = new IRC.Client(config.irc.server, config.irc.nick, {
    channels: [config.irc.channel],
    sasl: config.irc.sasl,
    secure: config.irc.ssl,
    selfSigned: config.irc.ssl_self_signed,
    port: config.irc.port,
    username: config.irc.username,
    password: config.irc.password,
    floodProtection: true,
    floodProtectionDelay: 1000
});
var tgid, tgusername;
var enabled = true;
var block.irc2tg = [];
var block.tg2irc = [];


function printf(){
    var str = arguments[0];
    var args = arguments;
    str = str.replace(/%(\d+)|%{(\d+)}/g, function(match, number1, number2){
	var number = number1? number1: number2;
	return (typeof args[number] != 'undefined')? args[number]: match;
    });
    return str;
}


function format_name(first_name, last_name) {
    var full_name = last_name?
        first_name + ' ' + last_name:
        first_name;
    if(full_name.length > 20)
        full_name = full_name.slice(0, 20);
    return full_name;
}


function format_newline(text, user, target, type) {
    text = text.replace(/(\s*\n\s*)+/g, '\n');
    if(type == 'reply')
        return text.replace(/\n/g, printf('\n[%1] %2: ', user, target));
    if(type == 'forward')
        return text.replace(/\n/g, printf('\n[%1] Fwd %2: ', user, target));
    return text.replace(/\n/g, printf('\n[%1] ', user));
}


// Event to write config on exit.
process.on('SIGINT', function(code) {
    console.log('About to exit with code:', code);
    client.part(config.irc.channel);
    process.exit();
});
// End Exit Event.


client.addListener('message' + config.irc.channel, function (from, message) {
    console.log(printf('From IRC %1  --  %2', from, message));

    // Blocking Enforcer
    if (block.irc2tg.indexOf(from) > -1 || !enabled)
        return;

    // say last context to irc
    if (message.match(/\s*\\last\s*/)){
	let last_msg = printf('Replied %1: %2', lastContext.name, lastContext.text);
	client.say(config.irc.channel, last_msg);
        console.log(last_msg);
        return;
    }

    if(config.block.hide_nick_prefix.indexOf(from) == -1)
        message = printf('[%1] %2', from, message);
    tg.sendMessage({
        text: message,
        chat_id: config.tgbot.group_id
    });
});


client.addListener('action', function (from, to, text) {
    console.log(printf('From IRC Action %1  --  %2', from, text));

    // Blocking Enforcer
    if (block.irc2tg.indexOf(from) > -1 || !enabled)
        return;

    if(to == config.irc.channel){
        if(config.block.hide_nick_prefix.indexOf(from) == -1)
            text = printf('** [%1] %2 **', from, text);
        else
            text = printf('** %1 **', text);
        tg.sendMessage({
            text: text,
            chat_id: config.tgbot.group_id
        });
    }
});

// record last reply context
var lastContext = {name:'', text:''};

tg.on('message', function(msg) {
    // Process Commands.
    console.log(printf('From ID %1  --  %2', msg.chat.id, msg.text));
    if(config.forward.photo_enabled && msg.photo){
        let largest = {file_size: 0};
        for(let i in msg.photo){
            let p = msg.photo[i];
            if(p.file_size > largest.file_size){
                largest = p;
            }
        }
        tg.getFile({file_id: largest.file_id}).then(function (ret){
            if(ret.ok){
                let url = printf('https://api.telegram.org/file/bot%1/%2',
                    config.tgbot.token, ret.result.file_path);
                pvimcn.imgvim(url, function(err,ret){
                    console.log(ret);
                    let user = format_name(msg.from.first_name, msg.from.last_name);
                    client.say(config.irc.channel, printf('[%1] Img: %2', user,ret));
                });
            }
        });
    } else if (msg.text && msg.text.slice(0, 1) == '/') {
        let command = msg.text.split(' ');
        if (command[0] == '/hold' || command[0] == '/hold@' + tgusername) {
            tg.sendMessage({
                text: '阿卡林黑洞已关闭！',
                chat_id: msg.chat.id
            });
            enabled = false;
            return;
        } else if (command[0] == '/unhold' || command[0] == '/unhold@' + tgusername) {
            tg.sendMessage({
                text: '阿卡林黑洞已开启！',
                chat_id: msg.chat.id
            });
            enabled = true;
            return;
        } else if (command[0] == '/block.irc2tg' || command[0] == '/block.irc2tg@' + tgusername) {
            if (command[1] && block.irc2tg.indexOf(command[1]) == -1) {
                block.irc2tg.push(command[1]);
                tg.sendMessage({
                    text: 'Temporary Blocked ' + command[1] + ' From IRC to Telegram!',
                    chat_id: msg.chat.id
                });
            } else {
                tg.sendMessage({
                    text: 'Nickname Unspecified!',
                    chat_id: msg.chat.id
                });
            }
            return;
        } else if (command[0] == '/block.tg2irc' || command[0] == '/block.tg2irc@' + tgusername) {
            if (msg.reply_to_message && block.tg2irc.indexOf(msg.reply_to_message.from.id) == -1) {
                block.tg2irc.push(msg.reply_to_message.from.id);
                tg.sendMessage({
                    text: 'Temporary Blocked ' + msg.reply_to_message.from.username + ' From Telegram to IRC!',
                    chat_id: msg.chat.id
                });
            } else if (command[1] && !isNaN(command[1]) && block.tg2irc.indexOf(command[1]) == -1) {
                block.tg2irc.push(parseInt(command[1]));
                tg.sendMessage({
                    text: 'Temporary Blocked ' + command[1] + ' From Telegram to IRC!',
                    chat_id: msg.chat.id
                });
            } else {
                tg.sendMessage({
                    text: 'Target Unspecified!',
                    chat_id: msg.chat.id
                });
            }
            return;
        } else if (command[0] == '/unblock.irc2tg' || command[0] == '/unblock.irc2tg@' + tgusername) {
            if (command[1] && block.irc2tg.indexOf(command[1]) > -1) {
                block.irc2tg.splice(block.irc2tg.indexOf(command[1]), 1);
                tg.sendMessage({
                    text: 'Temporary Unblocked ' + command[1] + ' From IRC to Telegram!',
                    chat_id: msg.chat.id
                });
            } else {
                tg.sendMessage({
                    text: 'Nickname Unspecified!',
                    chat_id: msg.chat.id
                });
            }
            return;
        } else if (command[0] == '/unblock.tg2irc' || command[0] == '/unblock.tg2irc@' + tgusername) {
            if (msg.reply_to_message && block.tg2irc.indexOf(msg.reply_to_message.from.id) > -1) {
                block.tg2irc.splice(block.tg2irc.indexOf(msg.reply_to_message.from.id), 1);
                tg.sendMessage({
                    text: 'Temporary Unblocked ' + msg.reply_to_message.from.username + ' From Telegram to IRC!',
                    chat_id: msg.chat.id
                });
            } else if (command[1] && !isNaN(command[1]) && block.tg2irc.indexOf(parseInt(command[1])) > -1) {
                block.tg2irc.splice(block.tg2irc.indexOf(parseInt(command[1])), 1);
                tg.sendMessage({
                    text: 'Temporary Unblocked ' + command[1] + ' From Telegram to IRC!',
                    chat_id: msg.chat.id
                });
            } else {
                tg.sendMessage({
                    text: 'Target Unspecified!',
                    chat_id: msg.chat.id
                });
            }
            return;
        } else if (command[0] == '/reloadblocklist' || command[0] == '/reloadblocklist@' + tgusername) {
            // Load blocklist
            block.irc2tg = config.block.irc2tg;
            block.tg2irc = config.block.tg2irc;
            tg.sendMessage({
                text: 'Blocklist Reloaded!',
                chat_id: msg.chat.id
            });
        }
        return;
    }

    var user, reply_to, forward_from, message_text;

    // Message Filter
    if(!msg.text || msg.chat.id != config.tgbot.group_id || !enabled)
        return;

    // Blocking Enforcer
    if (block.tg2irc.indexOf(msg.from.id) > -1 || msg.text.slice(0, 3) == '@@@')
        return;

    user = format_name(msg.from.first_name, msg.from.last_name);
    if(msg.reply_to_message){
        if (msg.reply_to_message.from.id == tgid)
            reply_to = msg.reply_to_message.text.match(/^[\[\(<]([^>\)\]\[]+)[>\)\]]/)[1];
        else
            reply_to = format_name(msg.reply_to_message.from.first_name, msg.reply_to_message.from.last_name);
        lastContext = {
	    text: msg.reply_to_message.text,
	    name: reply_to
	};
        message_text = format_newline(msg.text, user, reply_to, 'reply');
        message_text = printf('[%1] %2: %3', user, reply_to, message_text);
    } else if (msg.forward_from){
        if(msg.forward_from.id == tgid)
            forward_from = msg.text.match(/^[\[\(<]([^>\)\]\[]+)[>\)\]]/)[1];
        else
            forward_from = format_name(msg.forward_from.first_name, msg.forward_from.last_name);
        message_text = format_newline(msg.text, user, forward_from,
				      'forward', true);
        message_text = printf('[%1] Fwd %2: %3', user, forward_from, message_text);
    } else {
	let formatted_msg_text = msg.text;
	let arr = msg.text.split('\n');
        if (arr.length > config.forward.line_count_limit ||
            arr.some(function (line){
                    return line.length > config.forward.message_length_limit;
            })){

	    if(config.forward.paste_long_message){
		console.log(printf('User [%1] send a long message', user));
		pvimcn.pvim(msg.text, function cb(err, result){
                    if(err)
			client.say(config.irc.channel,
				   printf('[%1] %2', user,
					  msg.text.replace(/\n/g, '\\n')));
                    else
			client.say(config.irc.channel,
				   printf('Long Msg [%1] %2', user, result));
		});
		return;
	    }else{
		arr.map(function (line){
		    return line.slice(0, config.forward.message_length_limit);
		});
		if(arr.length > config.forward.line_count_limit){
		    arr = arr.slice(0, config.forward.line_count_limit);
		    arr.push("(line count limit exceeded)");
		}
		formatted_msg_text = arr.join('\n');
	    }
        }
	message_text = format_newline(formatted_msg_text, user);
	message_text = printf('[%1] %2', user, message_text);
    }

    client.say(config.irc.channel, message_text);
    //End of the sub process.
});


client.addListener('error', function(message) {
    console.log('error: ', message);
});

// Load blocklist
block.irc2tg = config.block.irc2tg;
block.tg2irc = config.block.tg2irc;

tg.start();
tg.getMe().then(function(ret){
    tgid = ret.result.id;
    tgusername = ret.result.username;
})
client.join(config.irc.channel);


console.log('卫星成功发射');

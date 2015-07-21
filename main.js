#!/usr/bin/env node


'use strict';


var Telegram = require('telegram-bot');
var IRC = require('irc');
var config = require('./config.js');
var tg = new Telegram(config.tg_bot_api_key);
var client = new IRC.Client('irc.freenode.net', config.irc_nick, {
    channels: [config.irc_channel],
});
var tgid;


function printf(args) {
    var string = arguments[0];
    /* note that %n in the string must be in ascending order */
    /* like 'Foo %1 Bar %2 %3' */
    var i;
    for(i=arguments.length-1; i>0; i--)
        string = string.replace('%'+i, arguments[i]);
    return string;
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
    if(type == 'reply')
        return text.replace(/\n/g, printf('\n[%1] %2: ', user, target));
    if(type == 'forward')
        return text.replace(/\n/g, printf('\n[%1] Fwd %2: ', user, target));
    return text.replace(/\n/g, printf("\n[%1] ", user));
}


// Event to write config on exit.
process.on('SIGINT', function(code) {
    console.log('About to exit with code:', code);
    client.part(IRC_GROUP_NAME);
    process.exit();
});
// End Exit Event.


client.addListener('message' + config.irc_channel, function (from, message) {
    console.log(printf('From IRC %1  --  %2', from, message));
    if(config.other_bridge_bots.indexOf(from) == -1)
        message = printf('[%1] %2', from, message);
    tg.sendMessage({
        text: message,
        chat_id: config.tg_group_id
    });
});


client.addListener('action', function (from, to, text) {
    console.log(printf('From IRC Action %1  --  %2', from, text));
    if(to == config.irc_channel){
        if(config.other_bridge_bots.indexOf(from) == -1)
            text = printf('** [%1] %2 **', from, text);
        else
            text = printf('** %1 **', text);
        tg.sendMessage({
            text: text,
            chat_id: config.tg_group_id
        });
    }
});


tg.on('message', function(msg) {
    // Process Commands.
    console.log(printf('From ID %1  --  %2', msg.chat.id, msg.text));
    var user, reply_to, forward_from, message_text;
    if(!msg.text || msg.chat.id != config.tg_group_id)
        return;
    user = format_name(msg.from.first_name, msg.from.last_name);
    if(msg.reply_to_message){
        if (msg.reply_to_message.from.id == tgid)
            reply_to = msg.reply_to_message.text.match(/^\[([^\]\[]+)\]/)[1];
        else
            reply_to = format_name(msg.reply_to_message.from.first_name, msg.reply_to_message.from.last_name);
        message_text = format_newline(msg.text, user, reply_to, 'reply');
        message_text = printf('[%1] %2: %3', user, reply_to, message_text);
    } else if (msg.forward_from){
        if(msg.forward_from.id == tgid)
            forward_from = msg.text.match(/^\[([^\]\[]+)\]/)[1];
        else
            forward_from = format_name(msg.forward_from.first_name, msg.forward_from.last_name);
        message_text = format_newline(msg.text, user, forward_from, 'forward');
        message_text = printf('[%1] Fwd %2: %3', user, forward_from, message_text);
    } else {
        message_text = format_newline(msg.text, user);
        message_text = printf('[%1] %2', user, message_text);
    }
    client.say(config.irc_channel, message_text);
    //End of the sub process.
});


client.addListener('error', function(message) {
    console.log('error: ', message);
});


tg.start();
tg.getMe().then(function(ret){
    tgid = ret.result.id;
})
client.join(config.irc_channel);


console.log('卫星成功发射');

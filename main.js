var Telegram = require('telegram-bot');
var tg = new Telegram("ClientKeyGoesHere");
var irc = require('irc');
var Memcached = require('memcached');
var memcached = new Memcached('127.0.0.1:11211');
var client = new irc.Client('irc.freenode.net', 'OrzTgBot', {
    channels: ['##Orz'],
});

// Event to write config on exit.
process.on('SIGINT', function(code) {
  console.log('About to exit with code:', code);
  client.part("##Orz");
  process.exit();
});
// End Exit Event.

client.addListener('message##Orz', function (from, message) {
    console.log("From IRC " + from + "  --  " + message);
    if(from == "OrzTox" || from == "OrzGTalk") {
       var ret = tg.sendMessage({
            text: message,
            chat_id: -14381522
       });
       var idpattl = /^\[([^\]\[]+)\]/;
       var getmsg = idpattl.exec(message);
       memcached.set(ret.message_id, getmsg[1], 3600, function (err) {console.log("error: " + err);});
    }
    else {
       var ret = tg.sendMessage({
            text: "["+ from + "] " + message,
            chat_id: -14381522
       });
       memcached.set(ret.message_id, from, 3600, function (err) { /* stuff */ });
    }
});

client.addListener('action', function (from, to, text) {
    console.log("From IRC Action " + from + "  --  " + text);
    if(to == "##Orz") {
     if(from == "OrzTox" || from == "OrzGTalk") {
       tg.sendMessage({
            text: "** " + text + " **",
            chat_id: -14381522
       });
     } else {
       tg.sendMessage({
            text: "** ["+ from + "] " + text + " **",
            chat_id: -14381522
       });
     }
    }
});

tg.on('message', function(msg) {
    //Process Commands.
    console.log("From ID " + msg.chat.id + "  --  " + msg.text);
    
    if (msg.text && msg.chat.id == -14381522) {
        if (msg.from.last_name) {
            var usersend = msg.from.first_name + " " + msg.from.last_name;
        }
        else {
            var usersend = msg.from.first_name;
        }

        if (msg.reply_to_message.message_id) {
            memcached.get(msg.reply_to_message.message_id, function (err, data) {
                console.log(err);
                if (data){
                    var messagetext = msg.text.replace(/\n/g,"\n["+usersend+"] " + data + ": ");
                    client.say('##Orz', "[" + usersend + "] " + data + ": " + messagetext);
                } else {
                    var messagetext = msg.text.replace(/\n/g,"\n["+usersend+"] " + msg.reply_to_message.from.first_name + ": ");
                    client.say('##Orz', "[" + usersend + "] " + msg.reply_to_message.from.first_name + ": " + messagetext);
                }
            });
        } else {
            var messagetext = msg.text.replace(/\n/g,"\n["+usersend+"] ");
            client.say('##Orz', "[" + usersend + "] " + messagetext);
        }
    }
    //End of the sub process.
});

client.addListener('error', function(message) {
      console.log('error: ', message);
});

tg.start();
client.join('##Orz');
console.log("卫星成功发射")

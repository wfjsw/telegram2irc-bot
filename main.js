var Telegram = require('telegram-bot');
var tg = new Telegram("ClientKeyGoesHere");
var irc = require('irc');
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
       tg.sendMessage({
            text: message,
            chat_id: -14381522
       });
    }
    else {
       tg.sendMessage({
            text: "["+ from + "] " + message,
            chat_id: -14381522
       });
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
        var messagetext = msg.text.replace(/\n/g,"\n["+usersend+"] ");
        client.say('##Orz', "[" + usersend + "] " + messagetext);
    }
    //End of the sub process.
});

client.addListener('error', function(message) {
      console.log('error: ', message);
});

tg.start();
client.join('##Orz');
console.log("卫星成功发射")

// BELOW IS CONFIG
const TELEGRAM_BOT_API_KEY = "";
const IRC_GROUP_NAME = "";
const TELEGRAM_GROUP_ID = "";
// ABOVE IS CONFIG

var Telegram = require('telegram-bot');
var tg = new Telegram(TELEGRAM_BOT_API_KEY);
var irc = require('irc');
var client = new irc.Client('irc.freenode.net', 'OrzTgBot', {
    channels: [IRC_GROUP_NAME],
});
var tgid;

// Event to write config on exit.
process.on('SIGINT', function(code) {
  console.log('About to exit with code:', code);
  client.part(IRC_GROUP_NAME);
  process.exit();
});
// End Exit Event.

client.addListener('message' + IRC_GROUP_NAME, function (from, message) {
    console.log("From IRC " + from + "  --  " + message);
    if(from == "OrzTox" || from == "OrzGTalk") {
       tg.sendMessage({
            text: message,
            chat_id: TELEGRAM_GROUP_ID
       });
    }
    else {
       tg.sendMessage({
            text: "["+ from + "] " + message,
            chat_id: TELEGRAM_GROUP_ID
        });
    }
});

client.addListener('action', function (from, to, text) {
    console.log("From IRC Action " + from + "  --  " + text);
    if(to == IRC_GROUP_NAME) {
        if(from == "OrzTox" || from == "OrzGTalk") {
            var textsend = "** " + text + " **";
        } else {
            var textsend = "** ["+ from + "] " + text + " **";
        }
        tg.sendMessage({
            text: textsend,
            chat_id: TELEGRAM_GROUP_ID
        });
    }
});

tg.on('message', function(msg) {
    //Process Commands.
    console.log("From ID " + msg.chat.id + "  --  " + msg.text);
    
    if (msg.text && msg.chat.id == TELEGRAM_GROUP_ID) {
        if (msg.from.last_name) {
            var usersend = msg.from.first_name + " " + msg.from.last_name;
        }
        else {
            var usersend = msg.from.first_name;
        }
        if (usersend.length > 20) {
            usersend = usersend.slice(0,21) + "...";
        }

        if (msg.reply_to_message) {
            if (msg.reply_to_message.from.id == tgid) {
                var replyto = msg.reply_to_message.text.match(/^\[([^\]\[]+)\]/)[1];
                var messagetext = msg.text.replace(/\n/g,"\n["+usersend+"] " + replyto + ": ");
                client.say(IRC_GROUP_NAME.toString(), "[" + usersend + "] " + replyto + ": " + messagetext);
            }
            else {
                var replyto = msg.reply_to_message.from.last_name ? msg.reply_to_message.from.first_name + " " + msg.reply_to_message.from.last_name : msg.reply_to_message.from.first_name;
                if (replyto.length > 20) {
                    replyto = replyto.slice(0,21) + "...";
                }
                var messagetext = msg.text.replace(/\n/g,"\n["+usersend+"] " + replyto + ": ");
                client.say(IRC_GROUP_NAME.toString(), "[" + usersend + "] " + replyto + ": " + messagetext);
            }
        }
        else {
            var messagetext = msg.text.replace(/\n/g,"\n["+usersend+"] ");
            client.say(IRC_GROUP_NAME.toString(), "[" + usersend + "] " + messagetext);
        }
    }
    //End of the sub process.
});

client.addListener('error', function(message) {
      console.log('error: ', message);
});

tg.start();
tg.getMe().then(function(ret){
    tgid = ret.result.id;
})
client.join(IRC_GROUP_NAME);
console.log("卫星成功发射")

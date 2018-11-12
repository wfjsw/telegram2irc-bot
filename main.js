#!/usr/bin/env node

// Total hours wasted here -> 35
// ^ Do Not Remove This!

var version = '`PROJECT AKARIN(TDLIB-FULL) VERSION 20181124`'

var configname = process.argv[2]

const {Bot, Logger} = require('tdlib')
const IRC = require('./irc_promise_wrapper')
const emoji = require('node-emoji')
const config = require('./config/' + configname + '.js')
const pvimcn = require('./pvimcn.js')
const he = require('he')
const nickmap = require('./nickmap.js')
const util = require('util')

var irc_channels = new Set() // Fill Realtime
for (let [i, t] of config.i2t) {
    irc_channels.add(i)
}
for (let [t, i] of config.t2i) {
    irc_channels.add(i)
}

Logger.setLogVerbosityLevel(2)

var tg = new Bot(config.api_id, config.api_hash, config.tg_bot_api_key)
var irc_c = new IRC.ClientPromise(config.irc_server, config.irc_nick, {
    channels: [...irc_channels],
    debug: true,
    showErrors: true,
    sasl: config.irc_sasl,
    secure: config.irc_ssl,
    selfSigned: config.irc_ssl_self_signed,
    port: config.irc_port,
    userName: config.irc_username,
    password: config.irc_password,
    floodProtection: true,
    floodProtectionDelay: 1000,
    retryDelay: 5000,
    autoConnect: true,
    autoRejoin: true,
    autoRenick: true,
    stripColors: true
})
var me
var enabled = new Set() // Set of Telegram Group ID
var blocki2t = new Set(config.blocki2t)
config.blocki2t = blocki2t;
var blockt2i = new Set(config.blockt2i)
config.blockt2i = blockt2i;
var other_bridge_bots = new Set(config.other_bridge_bots)
config.other_bridge_bots = other_bridge_bots;


var inittime = Math.round(Date.now() / 1000)


// record last reply context
// Index by channel name
var lastContext = new Map()
//{
//    name: '',
//    text: '',
//    byname: ''
//}

var UnicodeString = (function () {
    function surrogatePairToCodePoint(charCode1, charCode2) {
        return ((charCode1 & 0x3FF) << 10) + (charCode2 & 0x3FF) + 0x10000
    }

    function stringToCodePointArray(str) {
        var codePoints = [],
            i = 0,
            charCode
        while (i < str.length) {
            charCode = str.charCodeAt(i)
            if ((charCode & 0xF800) == 0xD800) {
                codePoints.push(surrogatePairToCodePoint(charCode, str.charCodeAt(++i)))
            } else {
                codePoints.push(charCode)
            }
            ++i
        }
        return codePoints
    }

    function codePointArrayToString(codePoints) {
        var stringParts = []
        for (var i = 0, len = codePoints.length, codePoint, offset, codePointCharCodes; i < len; ++i) {
            codePoint = codePoints[i]
            if (codePoint > 0xFFFF) {
                offset = codePoint - 0x10000
                codePointCharCodes = [0xD800 + (offset >> 10), 0xDC00 + (offset & 0x3FF)]
            } else {
                codePointCharCodes = [codePoint]
            }
            stringParts.push(String.fromCharCode.apply(String, codePointCharCodes))
        }
        return stringParts.join('')
    }

    function UnicodeString(arg) {
        if (this instanceof UnicodeString) {
            this.codePoints = typeof arg == 'string' ? stringToCodePointArray(arg) : arg
            this.length = this.codePoints.length
        } else {
            return new UnicodeString(arg)
        }
    }

    UnicodeString.prototype = {
        slice: function (start, end) {
            return new UnicodeString(this.codePoints.slice(start, end))
        },

        toString: function () {
            return codePointArrayToString(this.codePoints)
        }
    }


    return UnicodeString
})()


function format_name(id, first_name, last_name) {
    var full_name = last_name ?
        first_name + ' ' + last_name :
        first_name
    var full_name_1 = nickmap.getNick(id)
    full_name_1 = UnicodeString(full_name_1 ? full_name_1 : full_name)
    if (full_name_1.length > 15)
        full_name_1 = full_name_1.slice(0, 15)
    return full_name_1
}

function estimateLength(text) {
    var match = encodeURIComponent(text).match(/%[a-f0-9]{2}/gi)
    if (match)
        return match.length
    else
        return text.length
}

function check_ascii_nickname(nickname) {
    return !/[^\x30-\x7F]/g.test(nickname)
}

async function format_newline(ic, text, user, target, type) {
    var pretext = text
    text = text.replace(/(\s*\n\s*)+/g, '\n')
    if (type == 'reply')
        text = text.replace(/\n/g, util.format('\n[%s] %s: ', user, target))
    if (type == 'forward')
        text = text.replace(/\n/g, util.format('\n[%s] Fwd %s: ', user, target))

    var arr = text.split('\n')
    if (arr.length > config.irc_line_count_limit ||
        arr.some(function (line) {
            return estimateLength(line) > config.irc_message_length_limit
        })) {

        if (config.irc_long_message_paste_enabled) {
            console.log(util.format('User [%s] send a long message', user))
            var result = await pvimcn.pvim(pretext)
            console.log('pvim result: ' + result)
            return util.format('Long Msg: %s', result)
        } else {
            arr.map(function (line) {
                return line.slice(0, config.irc_message_length_limit / 3)
            })
            if (arr.length > config.irc_line_count_limit) {
                arr = arr.slice(0, config.irc_line_count_limit)
                arr.push('(line count limit exceeded)')
            }
            text = arr.join('\n')
        }
    }

    return text.replace(/\n/g, util.format('\n[%s] ', user))
}


// Event to write config on exit.
process.on('SIGINT', async (code) => {
    console.log('About to exit with code:', code)
    return takeDown()
})
process.on('SIGTERM', function (code) {
    console.log('About to exit with code:', code)
    return takeDown()
})
// End Exit Event.


for (let [ic, tc] of config.i2t) {
    irc_c.addListener('message' + ic, async (from, message) => {
        console.log(util.format('From IRC %s  --  %s', from, message))

        // Blocking Enforcer
        if (blocki2t.has(from) || !enabled.has(tc)) {
            console.log('blocked')
            return
        }

        if (message.match(/\s*\\reset\w*/)) {
            return takeDown() // Hmm
        }

        if (message.match(/\s*\\invite/)) {
            if (config.tg_invite_link.has(tc)) {
                var link = config.tg_invite_link.get(tc)
                var msg = 'Join the telegram group: ' + link
                irc_c.say(ic, msg)
                message += '\n' + msg
                if (!config.cmd_echo) return
            } else {
                irc_c.say(ic, 'Invitation link is not available for this group :-(')
                if (!config.cmd_echo) return
            }
        }

        if (!config.other_bridge_bots.has(from))
            message = util.format('[%s] %s', from, message)
        // say last context to irc
        if (message.match(/\s*\\last\w*/)) {
            var last_msg = util.format('Replied %s: %s', lastContext.get(ic).name, lastContext.get(ic).text)
            irc_c.say(ic, last_msg)
            console.log(last_msg)
            message += '\n' + last_msg
            if (!config.cmd_echo) return
        }
        if (config.replace_emoji) message = emoji.emojify(message)
        return tg.sendMessage(tc, message)
    })
}


irc_c.addListener('action', function (from, to, text) {
    console.log(util.format('From IRC Action %s  --  %s', from, text))

    // Blocking Enforcer
    if (blocki2t.has(from) || !enabled.has(config.i2t.get(to)))
        return

    if (config.i2t.has(to)) {
        if (!config.other_bridge_bots.has(from))
            text = util.format('** %s %s **', from, text)
        else
            text = util.format('** %s **', text)
        tg.sendMessage(config.i2t.get(to), text)
    }
})

var topic = new Map()

irc_c.addListener('topic', function (chan, newtopic, nick, message) {
    topic.set(chan, newtopic)
    if (config.i2t.has(chan)) {
        if (nick) {
            return tg.sendMessage(config.i2t.get(chan), 'Channel ' + chan + ' has topic by ' + nick + ': ' + newtopic)
        } else {
            return tg.sendMessage(config.i2t.get(chan), 'Channel ' + chan + ' topic:' + newtopic)
        }
    }
})


async function sendimg(ic, fileid, msg, type) {
    switch (type) {
        case 'Img':
        case 'Sticker':
            await tg.sendChatAction(msg.chat.id, 'upload_photo')
            break
        case 'Voice':
            await tg.sendChatAction(msg.chat.id, 'upload_audio')
            break
        default:
            await tg.sendChatAction(msg.chat.id, 'upload_document')
    }
    let file_data = await tg.getFile(fileid)
    let user = format_name(msg.from.id, msg.from.first_name, msg.from.last_name)
    if (type == 'Sticker') {
        try {
            let ret = await pvimcn.imgwebp(file_data.file_path)
            console.log(ret)
            if (msg.caption) {
                irc_c.say(ic, util.format('[%s] %s: %s Saying: %s', user, type, ret.trim(), msg.caption))
            } else {
                irc_c.say(ic, util.format('[%s] %s: %s (-lisa)', user, type, ret.trim()))
            }
        } catch (e) {
            console.error(e.message)
            return
        }
    } else {
        try {
            let ret = await pvimcn.imgvim(file_data.file_path)
            console.log(ret)
            if (msg.caption) {
                irc_c.say(ic, util.format('[%s] %s: %s Saying: %s', user, type, ret.trim(), msg.caption))
            } else {
                irc_c.say(ic, util.format('[%s] %s: %s', user, type, ret.trim()))
            }
        } catch (e) {
            console.error(e.message)
            return
        }
    }
    await tg.deleteFile(file_data.file_id)
}

async function on_message(msg) {
    // Process Commands.
    var me_message = false
    console.log(util.format('From ID %s  --  %s', msg.chat.id, msg.text))

    // enforce group chat
    if (!config.t2i.has(msg.chat.id)) return

    let ic = config.t2i.get(msg.chat.id)

    // Message Filter
    if (!enabled.has(msg.chat.id) || msg.date < inittime) {
        console.log('ignoring mesage time filter' + msg.text)
        return
    }

    if (config.irc_photo_forwarding_enabled && msg.photo) {
        // Photos
        var largest = {
            file_size: 0
        }
        for (var i in msg.photo) {
            var p = msg.photo[i]
            if (p.file_size > largest.file_size) {
                largest = p
            }
        }
        return sendimg(ic, largest.file_id, msg, 'Img')
    } else if (config.irc_sticker_forwarding_enabled && msg.sticker) {
        // Stickers
        return sendimg(ic, msg.sticker.file_id, msg, 'Sticker')
    } else if (config.irc_photo_forwarding_enabled && msg.voice) {
        // VoiceNote
        sendimg(ic, msg.voice.file_id, msg, 'Voice')
        return
    } else if (config.irc_photo_forwarding_enabled && msg.video) {
        // Video
        sendimg(ic, msg.video.file_id, msg, 'Video')
        return
    } else if (config.irc_photo_forwarding_enabled && msg.document) {
        // Document
        return sendimg(ic, msg.document.file_id, msg,
            util.format('File(%s)', msg.document.mime_type))
    } else if (msg.new_chat_participant) {
        // New Chat Participant from Telegram

        let part = msg.new_chat_participants
        if (config.irc_participant_enabled) {
            let usernames = part.map(p => format_name(p.id, p.first_name, p.last_name)).join(', ')
            let ircmesg = 'New user "' + usernames + '" joined Telegram group. Welcome!'
            irc_c.say(ic, ircmesg)
        }

        if (config.irc_ensure_ascii_nickname) {
            let non_asc_user = []
            for (let ncp of part) {
                if (!check_ascii_nickname(format_name(ncp.id, ncp.first_name, ncp.last_name))) {
                    non_asc_user.push(ncp)
                }
            }

            let nau_usernames = non_asc_user.map(p => p.username ? `@${p.username}` : `<a href="tg://user?id=${p.id}">${he.encode(format_name(p.id, p.first_name, p.last_name))}</a>`).join(', ')
            let header = `Hello, ${nau_usernames}\n`
            let message = 'Your current nickname is "' + username +
                '", which contains non-ascii chars and it may be hard to input in some IRC clients.\n' +
                'Please choose a suitable which easy to enter in most of cases.\n' +
                'Use "/nick <nickname>" to set your nickname :-)'
            return tg.sendMessage(msg.chat.id, header + message, {
                parse_mode: 'HTML'
            })
        }

    } else if (config.irc_participant_enabled && msg.left_chat_participant) {
        // This is rarely called in big groups.

        var part = msg.left_chat_participant
        var username = format_name(part.id, part.first_name, part.last_name)
        var ircmesg = 'User "' + username + '" left Telegram group. See you~'
        irc_c.say(config.irc_channel, ircmesg)
    } else if (msg.text && msg.text.slice(0, 1) == '/') {
        // Commands are as follows.
        // 2 times if is retarded. We can replace bot's username off the command.
        var command = msg.text.split(' ')
        command[0] = command[0].replace(`@${me.username}`, '')
        if (command[0] == '/hold') {
            irc_c.part(ic)
            enabled.delete(msg.chat.id)
            return tg.sendMessage(msg.chat.id, '`EXECUTE ORDER STOP-FORWARD`', {
                parse_mode: 'Markdown'
            })
        } else if (command[0] == '/unhold') {
            enabled.add(msg.chat.id)
            irc_c.join(ic)
            return tg.sendMessage(msg.chat.id, '`EXECUTE ORDER START-FORWARD`', {
                parse_mode: 'Markdown'
            })
        } else if (command[0] == '/blocki2t') {
            if (command[1] && !blocki2t.has(command[1])) {
                blocki2t.add(command[1])
                return tg.sendMessage(msg.chat.id, '`Temporary Blocked ' + command[1] + ' From IRC to Telegram!`', {
                    parse_mode: 'Markdown'
                })
            } else {
                return tg.sendMessage(msg.chat.id, '`ERROR OCCURED: TARGET NOT FOUND`', {
                    parse_mode: 'Markdown'
                })
            }
        } else if (command[0] == '/blockt2i') {
            if (msg.reply_to_message && !blockt2i.has(msg.reply_to_message.from.id)) {
                blockt2i.add(msg.reply_to_message.from.id)
                return tg.sendMessage(msg.chat.id, '`Temporary Blocked ' + msg.reply_to_message.from.username + ' From Telegram to IRC!`', {
                    parse_mode: 'Markdown'
                })
            } else if (command[1] && !isNaN(command[1]) && blockt2i.has(command[1])) {
                blockt2i.add(parseInt(command[1]))
                return tg.sendMessage(msg.chat.id, '`Temporary Blocked ' + command[1] + ' From Telegram to IRC!`', {
                    parse_mode: 'Markdown'
                })
            } else {
                return tg.sendMessage(msg.chat.id, '`ERROR OCCURED: TARGET NOT FOUND`', {
                    parse_mode: 'Markdown'
                })
            }
        } else if (command[0] == '/unblocki2t') {
            if (command[1] && blocki2t.has(command[1])) {
                blocki2t.delete(command[1])
                return tg.sendMessage(msg.chat.id, '`Temporary Unblocked ' + command[1] + ' From IRC to Telegram!`', {
                    parse_mode: 'Markdown'
                })
            } else {
                return tg.sendMessage(msg.chat.id, '`ERROR OCCURED: TARGET NOT FOUND`', {
                    parse_mode: 'Markdown'
                })
            }
        } else if (command[0] == '/unblockt2i') {
            if (msg.reply_to_message && blockt2i.has(msg.reply_to_message.from.id)) {
                blockt2i.delete(msg.reply_to_message.from.id)
                return tg.sendMessage(msg.chat.id, '`Temporary Unblocked ' + msg.reply_to_message.from.username + ' From Telegram to IRC!`', {
                    parse_mode: 'Markdown'
                })
            } else if (command[1] && !isNaN(command[1]) && blockt2i.has(parseInt(command[1]))) {
                blockt2i.delete(parseInt(command[1]))
                return tg.sendMessage(msg.chat.id, 'Temporary Unblocked ' + command[1] + ' From Telegram to IRC!', {
                    parse_mode: 'Markdown'
                })
            } else {
                return tg.sendMessage(msg.chat.id, '`ERROR OCCURED: TARGET NOT FOUND`', {
                    parse_mode: 'Markdown'
                })
            }
        } /*else if (command[0] == '/reloadblocklist' || command[0] == '/reloadblocklist@' + tgusername) {
            // Load blocklist
            // Kinda useless. These lists probably
            blocki2t = config.blocki2t
            blockt2i = config.blockt2i
            tg.sendMessage(msg.chat.id, '`EXECUTE ORDER BLOCKLIST-RELOAD`', {
                parse_mode: 'Markdown'
            })
            return
        } */else if (command[0] == '/ircsay') {
            let txtn
            command.shift()
            txtn = command.join(' ')
            irc_c.say(ic, txtn)
            // fall through
        } else if (command[0] == '/ircrejoin') {
            // To Async/Await
            await irc_c.part(ic)
            await irc_c.join(ic)
            return tg.sendMessage(msg.chat.id, '`EXECUTE ORDER REJOIN`', {
                parse_mode: 'Markdown'
            })
        } else if (command[0] == '/version') {
            return tg.sendMessage(msg.chat.id, version, {
                parse_mode: 'Markdown'
            })
        } else if (command[0] == '/uptime') {
            var uptimestr = '`PROJECT AKARIN UPTIME: ' + process.uptime() + ' seconds`\n'
            uptimestr += '`OS UPTIME: ' + require('os').uptime() + ' seconds`'
            return tg.sendMessage(msg.chat.id, uptimestr, {
                parse_mode: 'Markdown'
            })
        } else if (command[0] == '/reset') {
            await tg.sendMessage(msg.chat.id, '`TAKING DOWN...`', {
                parse_mode: 'Markdown'
            })
            return takeDown()
        } else if (command[0] == '/syn') {
            return tg.sendMessage(msg.chat.id, '`ACK`', {
                parse_mode: 'Markdown'
            })
        } else if (command[0] == '/blocklist') {
            // Show blocklist
            return tg.sendMessage(
                msg.chat.id,
                'Blocki2t: ' + [...blocki2t].join(', ') + '\nBlockt2i: ' + [...blockt2i].join(', ')
            )
        } else if (command[0] == '/nick') {
            if (command[1]) {
                let nick = command.slice(1).join(' ').trim()
                let first_name = msg.from.first_name
                let last_name = msg.from.last_name
                let full_name = last_name ?
                    first_name + ' ' + last_name :
                    first_name
                let oldnick = nickmap.getNick(msg.from.id)
		if (!oldnick) {
			oldnick = ""
		}
                nickmap.setNick(msg.from.id, nick)
                let notifymsg = util.format('User "%s" with nick "%s" changed nick to "%s"', full_name, oldnick, nick)
                tg.sendMessage(
                    msg.chat.id,
                    notifymsg
                )
                irc_c.say(ic, notifymsg)
            } else {
                let first_name = msg.from.first_name
                let last_name = msg.from.last_name
                let full_name = last_name ?
                    first_name + ' ' + last_name :
                    first_name
                let nick = nickmap.getNick(msg.from.id)
                nick = nick ? nick : full_name

                let notifymsg = util.format('User "%s" has nick "%s"', full_name, nick)

                tg.sendMessage(
                    msg.chat.id,
                    notifymsg
                )
            }
            return
        } else if (command[0] == '/topic') {
            return tg.sendMessage(msg.chat.id, 'Channel topic :' + topic.get(ic))
        } else if (command[0] == '/me') {
            me_message = true
            msg.text = msg.text.substring(command[0].length)
            // passthrough to allow /me action
        } else if (Object.keys(config.custom_command).includes(command[0])) {
            let txtn
            command[0] = config.custom_command[command[0]]
            txtn = command.join(' ')
            irc_c.say(ic, txtn)
            // fall through
        } else {
            return
        }
    }
    var user, reply_to, text, forward_from, message_text

    // Blocking Enforcer
    if (blockt2i.has(msg.from.id) || (msg.text && msg.text.slice(0, 2) == '@@'))
        return

    user = format_name(msg.from.id, msg.from.first_name, msg.from.last_name)
    if (msg.reply_to_message) {
        if (msg.reply_to_message.from.id == me.id) {
            var nickregex = [/^\[[^\]]+] [\[\(<]([^ ]*)[>\)\]] / ,/^[\[\(<]([^ ]*)[>\)\]] /]
            if (msg.reply_to_message.text.match(nickregex[0])) {
                reply_to = msg.reply_to_message.text.match(nickregex[0])[1]
                text = msg.reply_to_message.text.substr(reply_to.length + 3)
            }
            else if (msg.reply_to_message.text.match(nickregex[1])) {
                reply_to = msg.reply_to_message.text.match(nickregex[1])[1]
                text = msg.reply_to_message.text.substr(reply_to.length + 3)
            } else {
                reply_to = '[Nobody]'
                text = msg.reply_to_message.text
            }
        } else {
            reply_to = format_name(msg.reply_to_message.from.id, msg.reply_to_message.from.first_name, msg.reply_to_message.from.last_name)
            text = msg.reply_to_message.text
            text = text ? text : 'Img'
        }
        lastContext.set(ic, {
            text: text,
            name: reply_to,
            byname: user
        })
        message_text = await format_newline(ic, msg.text, user, reply_to, 'reply')
        if (message_text === null) return
        message_text = util.format('[%s] %s: %s', user, reply_to, message_text)
    } else if (msg.forward_from) {
        if (msg.forward_from.id == me.id)
            forward_from = msg.text.match(/^[[(<]([^>)\][]+)[>)\]]/)[1]
        else
            forward_from = format_name(msg.forward_from.id, msg.forward_from.first_name, msg.forward_from.last_name)
        message_text = await format_newline(ic, msg.text, user, forward_from,
            'forward', true)
        if (message_text === null) return
        message_text = util.format('[%s] Fwd %s: %s', user, forward_from, message_text)
    } else {
        message_text = await format_newline(ic, msg.text, user)
        if (message_text === null) return
        message_text = util.format('[%s] %s', user, message_text)
    }
    if (config.replace_emoji) message_text = emoji.unemojify(message_text)
    if (me_message) {
        irc_c.action(ic, message_text)
    } else {
        irc_c.say(ic, message_text)
    }
    //End of the sub process.
}

tg.on('message', on_message);
tg.on('edited_message', on_message);

// Indexed by IRC channel name
// var nicks = new Map()

// irc_c.addListener('names', function (channel, newnicks) {
//     nicks.set(channel, Object.keys(newnicks))
// })

/*
tg.on('inline_query', function (msg) {
    console.log('inline_query: id=' + msg.id + ' query=' + msg.query + ' offset=' + msg.offset)
    // var user = format_name(msg.from.id, msg.from.first_name, msg.from.last_name)
    var results = []
    var offset = msg.offset ? msg.offset : 0

    var next_offset = offset + 50
    if (offset + 50 < Object.keys(nicks).length)
        next_offset = ''
    var names = .slice(offset, offset + 50)

    for (var i in names) {
        var key = names[i]
        results.push({
            type: 'article',
            id: msg.id + '/' + key,
            title: '' + nicks[key] + key,
            description: '预览: ' + key + ': ' + msg.query,
            message_text: key + ': ' + msg.query
        })
    }
    tg.answerInlineQuery(
        '' + msg.id,
        results, {
            cache_time: 10,
            is_personal: false,
            next_offset: next_offset
        }
    )
})
*/

irc_c.addListener('error', function (e) {
    console.log('error: ', e.message)
})

async function takeDown() {
    try {
        for (let i of irc_channels) {
            await irc_c.part(i)
        }
        await irc_c.disconnect()
        process.exit()
    } catch (e) {
        console.error(e.message)
        process.exit()
    }
}

tg.once('ready', async () => {
    me = await tg.getMe()
    console.log('PROJECT AKARIN INITATED')
    //for (let i of irc_channels) {
    //    await irc_c.join(i)
    //}
    for (let [t, i] of config.t2i) {
        enabled.add(t)
    }
})

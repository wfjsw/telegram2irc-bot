// Config File For Akarin

var bots = [
  {
    tg_group: 0,
    irc_channel: '',
    tg_invite_link: ''
  },
]


// Forwarder Settings
exports.t2i = new Map()
for (let b of bots) {
    exports.t2i.set(b.tg_group, b.irc_channel)
}

exports.i2t = new Map()
for (let b of bots) {
    exports.i2t.set(b.irc_channel, b.tg_group)
}

// Telegram-Bot Config
exports.api_id = 0
exports.api_hash = ''
exports.tg_bot_api_key = ''
// exports.tg_group_id = 0;
// Target Telegram group invite link.
// exports.tg_invite_link = '';
exports.tg_invite_link = new Map()
for (let b of bots) {
    exports.tg_invite_link.set(b.tg_group, b.tg_invite_link)
}


// IRC Config
exports.irc_server = ''
// exports.irc_channel = '';
exports.irc_nick = ''
exports.irc_port = 6667
exports.irc_ssl = false
exports.irc_ssl_self_signed = false


// Turn On IRC Nick Auth By set SASL to true
exports.irc_sasl = false
exports.irc_username = ''
exports.irc_password = ''

// Content Length Limit
exports.irc_line_count_limit = 5
exports.irc_message_length_limit = 400
exports.irc_long_message_paste_enabled = false
// Send message to IRC when Telegram user join or left.
exports.irc_participant_enabled = true
// Image Forwarding
exports.irc_photo_forwarding_enabled = false
// Sticker Forwarding
exports.irc_sticker_forwarding_enabled = true
// Ensure ASCII name for forwarding to irc.
exports.irc_ensure_ascii_nickname = false

exports.cmd_echo = false

// Blocking Config
/** Hide prefixes of these names automatically */
exports.other_bridge_bots = new Set([])
/** Block specific users from IRC to Telegram, use nickname here. */
exports.blocki2t = new Set([])
/** Block specific users from Telegram to IRC, use UserID here.
 *  Acquire ID by forwarding a user's message to @userinfobot. */
exports.blockt2i = new Set([])

exports.replace_emoji = true

exports.custom_command = {
    '/list': '!!list'
}

// Telegram channel to send Error Report
exports.error_report_channel = 0

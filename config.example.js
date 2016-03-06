// Config File For Akarin

// Telegram-Bot Config
exports.tg_bot_api_key = '';
exports.tg_group_id = 0;
/** filter function (string) -> (string) */
exports.tg_msg_filter = function (s) { return s.replace('wfjsw','wfj.js'); }

// IRC Config
exports.irc_server = '';
exports.irc_channel = '';
exports.irc_nick = '';
exports.irc_port = 6667;
exports.irc_ssl = false;
exports.irc_ssl_self_signed = false;

exports.cutjj_interval = 5 * 60 * 1000;

// Turn On IRC Nick Auth By set SASL to true
exports.irc_sasl = false;
exports.irc_username = '';
exports.irc_password = '';

// Content Length Limit
exports.irc_line_count_limit = 5;
exports.irc_message_length_limit = 400;
exports.irc_long_message_paste_enabled = false;

// Image Forwarding
exports.irc_photo_forwarding_enabled = false;

// Blocking Config
/** Hide prefixes of these names automatically */
exports.other_bridge_bots = [];
/** Block specific users from IRC to Telegram, use nickname here. */
exports.blocki2t = [];
/** Block specific users from Telegram to IRC, use UserID here. 
 *  Acquire ID by forwarding a user's message to @userinfobot. */
exports.blockt2i = []; 

exports.use_kaomoji = true;
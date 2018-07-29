let irc = require('irc-upd')

irc.ClientPromise = class extends irc.Client {
    constructor(server, nick, options = {}) {
        super(server, nick, options)
    }

    join(channel) { 
        let j = super.join.bind(this)
        return new Promise(function (rs, rj) {
            try {
                j(channel, rs)
            } catch (e) {
                rj(e)
            }
        })
    }

    part(channel, message) {
        let p = super.part.bind(this)
        return new Promise(function (rs, rj) {
            try {
                if (message) {
                    p(channel, message, rs)
                } else {
                    p(channel, rs)
                }
            } catch (e) {
                rj(e)
            }
        })
    }

    connect(retryCount) {
        let c = super.connect.bind(this)
        return new Promise(function (rs, rj) {
            try {
                c(retryCount, rs)
            } catch (e) {
                rj(e)
            }
        })
    }

    disconnect(message) {
        let d = super.disconnect.bind(this)
        return new Promise(function (rs, rj) {
            try {
                if (message) {
                    d(message, rs)
                } else {
                    d(rs)
                }
            } catch (e) {
                rj(e)
            }
        })
    }
}

module.exports = irc

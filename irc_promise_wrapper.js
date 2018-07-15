let irc = require('irc')

irc.ClientPromise = class extends irc.Client {
    constructor(server, nick, options = {}) {
        super(server, nick, options)
    }

    join(channel) { 
        return new Promise(function (rs, rj) {
            try {
                super(channel, rs)
            } catch (e) {
                rj(e)
            }
        })
    }

    part(channel, message) {
        return new Promise(function (rs, rj) {
            try {
                if (message) {
                    super(channel, message, rs)
                } else {
                    super(channel, rs)
                }
            } catch (e) {
                rj(e)
            }
        })
    }

    connect(retryCount) {
        return new Promise(function (rs, rj) {
            try {
                super(retryCount, rs)
            } catch (e) {
                rj(e)
            }
        })
    }

    disconnect(message) {
        return new Promise(function (rs, rj) {
            try {
                if (message) {
                    super(message, rs)
                } else {
                    super(rs)
                }
            } catch (e) {
                rj(e)
            }
        })
    }
}

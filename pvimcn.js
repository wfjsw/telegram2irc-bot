const request = require('request')
const rp = require('request-promise-native')
// const stream = require('stream')
const fs = require('fs')
const fsp = fs.promises
const cp = require('child_process')

async function pvim(message) {
    if (message.length <= 'print(#Hello, world!#)') {
        return message
    }
    try {
        let body = await rp.post('https://fars.ee/?u=1',
            { form: { c: message } })
        return body
    } catch (e) {
        console.error('Post txt to fars.ee failed', e.message)
        return message
    }
}

async function imgvim(path) {
    var ext = null
    try {
        ext = path.match(/.*(\.[^/]*)$/)[1].substring(1)
    } catch (e) {
        ext = null
    }

    var data = await fsp.readFile(path)
    console.log('Debug: posting image ' + path)
    try {
        let body = await rp.post({
            url: 'https://fars.ee/?u=1', formData: {
                c: {
                    value: data,
                    options: { filename: ext ? 'c.' + ext : 'c', contentType: 'image/' + ext }
                }
            }
        })
        var ret = body.trim()
        if (ext != null && !ret.endsWith(ext)) {
            ret = ret + '.' + ext
        }
        return ret
    } catch (e) {
        console.error('Post img to fars.ee failed', e.message)
        throw e
    }
}

async function imgwebp(path) {
    return new Promise((rs, rj) => {
        // TODO: use sharp library for webp -> png

        var convert = cp.spawn('convert', ['-define', 'png:exclude-chunks=date,time', 'webp:-', 'png:-'], { shell: false })
        fs.createReadStream(path).pipe(convert.stdin)
        var buffers = []
        convert.stdout.on('data', (data) => {
            buffers.push(data)
        })

        convert.on('close', () => {
            request.post({
                url: 'https://fars.ee/?u=1', formData: {
                    c: {
                        value: Buffer.concat(buffers),
                        options: { filename: 'c.png', contentType: 'image/png' }
                    }
                }
            }, (err, httpResponse, body) => {
                if (err || httpResponse.statusCode != 200) {
                    console.error('Post webp to fars.ee failed', err)
                    rj(body)
                    return
                }
                var ret = body.trim()
                var ext = 'png'
                if (ext != null && !ret.endsWith(ext)) {
                    ret = ret + '.' + ext
                }
                rs(ret)
                return
            })
        })
    })
}

async function test() {
    let url = await pvim('testing\nabc\nadd\nethis is a log message')
    console.log(url)
}


async function testImg() {
    console.log('TODO: change url to local path')
    // let url = await imgvim('https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png')
    // console.log(url)
}

async function testWebp() {
    console.log('TODO: change url to local path')
    // let url = await imgwebp('http://www.gstatic.com/webp/gallery/1.webp')
    // console.log(url)
}


exports.pvim = pvim

exports.imgvim = imgvim
exports.imgwebp = imgwebp

if (require.main === module) {
    (async () => {
        await test()
        await testImg()
        await testWebp()
    })()
}

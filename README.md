# telegram2irc-bot

A Telegram-IRC sync bot.

## Usage

Create a config file `config.js` just like the example `config.js.example` and set your configuration, then run `main.js` to start.

**REMEMBER TO DISABLE PRIVACY MODE @BotFather**

## Default Command

No helps will be provided in-bot.  
Commands are **cASe SeNsITivE** !

```
/syn - ACK
/unhold - START-FORWARDING
/hold - STOP-FORWARDING
/ircrejoin - PART & JOIN THE CHANNEL
/ircsay content - SPEAK RAW TO IRC
/nick yournick - CHANGE WHAT YOU LOOK LIKE IN IRC
/blocklist - BLOCKLIST OVERVIEW
/blocki2t nickname - BLOCK IRC -> TELEGRAM
/blockt2i [ID] - BLOCK TELEGRAM -> IRC BY REPLY || ID
/me action - SEND ACTION MSG TO IRC
/version - GET CURRENT WRITEDATE
```

## Pro Tip

To reduce memory usage, start the bot with

```
node --max-new-space-size=16384 --max-old-space-size=256 main
```

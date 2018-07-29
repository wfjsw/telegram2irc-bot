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

## Docker Usage

**Step 1: clone this repo to your machine**

```
git clone https://github.com/farseerfc/orz-telegram-bot.git
cd orz-telegram-bot/
```

**Step 2: Build the docker image**

```
docker build -t orzbot .
```

**Step 3: Initialize the config file**

choose a place for the config files `<ABSOLUTE_PATH_TO_THE_CONFIGURATION_FOLDER>`, create a config file `config.js` and `nicks.json`

**Step 4: Run the Images**

```
docker run --name=orzbotd -d -v <ABSOLUTE_PATH_TO_THE_CONFIGURATION_FOLDER>:/home/orzbot/config orzbot
```

```
docker logs orzbotd      # check log
docker stop orzbotd      # stop bot
docker start orzbotd     # start bot
```

That's all. Have fun.

# orz-telegram-bot

A Telegram-IRC sync bot.

## Usage

Create a config file `config.js` just like the example `config.js.example` and set your configuration, then run `main.js` to start.

## Image forwarding

Because the upstream has not updated yet, you have to hack the library `telegram-bot` if you want to enable image forwarding.

In `node_modules/telegram-bot/lib/telegram.js`:

    methods = "getMe\nsendMessage\nforwardMessage\nsendPhoto\nsendAudio\nsendDocument\nsendSticker\nsendVideo\nsendLocation\nsendChatAction\ngetUserProfilePhotos\ngetUpdates\nsetWebhook\ngetFile";
    
Add the method `getFile` to the list as above.

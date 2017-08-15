From node:argon

USER root
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y libicu-dev && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm i -g encoding irc node-telegram-bot-api request encoding jsonfile && npm cache clear

RUN useradd -ms /bin/bash orzbot
USER orzbot

RUN mkdir -p /home/orzbot/.orzbot
VOLUME ["/home/orzbot/.orzbot"]

WORKDIR /home/orzbot/.orzbot

CMD ["node --max-new-space-size=16384 --max-old-space-size=256 main"]

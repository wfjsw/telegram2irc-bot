From node

USER root
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y libicu-dev && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN useradd -ms /bin/bash orzbot
WORKDIR /home/orzbot

RUN mkdir config
ADD package.json /home/orzbot/package.json
ADD main.js /home/orzbot/main.js
ADD pvimcn.js /home/orzbot/pvimcn.js
ADD nickmap.js /home/orzbot/nickmap.js
RUN yarn install

USER orzbot
VOLUME ["/home/orzbot/config"]

CMD ["sh", "-c", "/home/orzbot/main.js"]

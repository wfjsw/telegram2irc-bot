From node

USER root
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y libicu-dev && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /home/orzbot
ADD package.json .
ADD main.js .
ADD pvimcn.js .
RUN yarn install

RUN useradd -ms /bin/bash orzbot
USER orzbot

RUN mkdir -p /home/orzbot/config
VOLUME ["/home/orzbot/config"]

CMD ["sh", "-c", "/home/orzbot/main.js"]

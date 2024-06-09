FROM ubuntu:focal

RUN /usr/bin/apt-get update && \
    /usr/bin/apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    /usr/bin/apt-get update && \
    /usr/bin/apt-get upgrade -y && \
    /usr/bin/apt-get install -y nodejs ffmpeg

WORKDIR /home/app/video_transform

COPY package.json ./
RUN npm install -g @nestjs/cli && \
    npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
FROM node:17-bullseye-slim
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y git
RUN git clone https://github.com/backbonedao/swarm-webrtc /app
WORKDIR /app
RUN npm i
FROM node:17-bullseye-slim
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y git
WORKDIR /app
COPY package.json /app
RUN npm i
COPY . /app
COPY .greenlockrc /app
RUN npx patch-package
RUN npm link
EXPOSE 80
EXPOSE 1337
CMD node /app/server.js
FROM node:16-alpine
WORKDIR /usr/src/app
COPY package*.json ./
COPY . ./
RUN npm install
RUN npm install pm2 -g
EXPOSE ${PORT}
# EXPOSE 5432

CMD ["npm", "start"]
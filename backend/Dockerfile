FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# copy .env inside image
COPY .env /app/.env

EXPOSE 5000
CMD ["node", "server.js"]

FROM node:18

WORKDIR /app

# Copy ONLY backend package.json
COPY package.json package-lock.json ./

# Install backend dependencies
RUN npm install

# Copy backend source code
COPY . .

# Copy .env file
COPY .env /app/.env

EXPOSE 4000

CMD ["node", "server.js"]

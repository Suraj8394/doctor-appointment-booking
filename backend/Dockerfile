FROM node:18

WORKDIR /app

# Copy only backend package files
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy backend source code
COPY . .

# Copy environment file
COPY .env /app/.env

EXPOSE 4000

CMD ["node", "server.js"]

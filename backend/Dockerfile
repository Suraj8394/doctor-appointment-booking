FROM node:18

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (bcrypt will compile correctly for Linux)
RUN npm install

# Copy source code
COPY . .

EXPOSE 4000
CMD ["node", "server.js"]

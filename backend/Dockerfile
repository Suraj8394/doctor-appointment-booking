FROM node:18

WORKDIR /app

# Copy only package files
COPY package.json package-lock.json ./

# Install node modules
RUN npm install

# Copy source code
COPY . .

EXPOSE 4000

CMD ["node", "server.js"]

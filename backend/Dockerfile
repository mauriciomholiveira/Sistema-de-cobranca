FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy all source files (no bind mount for stability on macOS)
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]

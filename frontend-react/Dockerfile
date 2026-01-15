FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy all source files (no bind mount for stability on macOS)
COPY . .

EXPOSE 5175

# Expose host to allow access from outside container
CMD ["npm", "run", "dev", "--", "--host"]

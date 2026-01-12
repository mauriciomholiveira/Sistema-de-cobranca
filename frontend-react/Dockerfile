FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Bind Modules for hot reload
# COPY . . 

EXPOSE 5173

# Expose host to allow access from outside container
CMD ["npm", "run", "dev", "--", "--host"]

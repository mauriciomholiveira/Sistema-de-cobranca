FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# We do NOT copy the rest of the code here because we will use Bind Mounts in docker-compose for hot reload
# COPY . . 

EXPOSE 3000

CMD ["npm", "run", "dev"]

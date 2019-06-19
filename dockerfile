FROM node:latest
WORKDIR /app
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install
COPY ./dist .
EXPOSE 5000:5000
ENV MONGO_USER='root'
ENV MONGO_PASS='toor'
CMD ["node", "./index.js", "5000", "prod"]

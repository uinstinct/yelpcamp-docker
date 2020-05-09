FROM node:10-alpine
WORKDIR /yelpcamp
COPY . /yelpcamp
RUN npm install
EXPOSE 8000
CMD ["npm", "start"]
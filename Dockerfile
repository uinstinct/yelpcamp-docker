FROM node:10-alpine
WORKDIR /yelpcamp
COPY . /yelpcamp
EXPOSE 8000
CMD ["npm", "start"]
FROM node:8.9.4

# Create app directory
RUN mkdir -p /usr/src/app

# Copy deployment file
COPY server.js /usr/src/app/
COPY package.json /usr/src/app/

# Install production dependencies
WORKDIR /usr/src/app
RUN yarn install --production

## Start server
EXPOSE 8100
CMD [ "yarn", "start" ]
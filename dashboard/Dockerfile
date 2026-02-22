# Use an official Node.js runtime as a parent image
FROM node:20-alpine AS builder
# Set the working directory in the container
WORKDIR /app
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
# Install application dependencies
RUN npm install 
# Copy the rest of the application code to the working directory
COPY . .
# Accept build-time API URL from docker-compose / Docploy
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# Build the React application for production
RUN npm run build
RUN npm install -g pm2
EXPOSE 3000
CMD ["pm2-runtime", "start", "npm", "--", "run", "start"]
# Use an official Node.js runtime as a parent image
FROM node:20-alpine AS builder
# Set the working directory in the container
WORKDIR /app
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
# Install application dependencies (remove lockfile to resolve correct platform-specific deps)
RUN rm -f package-lock.json && npm install
# Copy the rest of the application code to the working directory
COPY . .
# Build the React application for production
RUN npm run build
RUN npm install -g pm2
EXPOSE 3000
CMD ["pm2-runtime", "start", "npm", "--", "run", "start"]
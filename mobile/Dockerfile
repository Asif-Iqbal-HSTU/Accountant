# Base image for React Native / Expo
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies required for Expo and native builds
RUN apk add --no-cache \
  git \
  bash \
  curl \
  libc6-compat

# Install global Expo CLI
RUN npm install -g expo-cli @expo/ngrok

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose ports needed by Expo
# 8081: Metro Bundler
# 19000: Expo Development Server
# 19001: Expo Development Server
# 19002: Expo DevTools
EXPOSE 8081 19000 19001 19002

# Start the Expo application
CMD ["npm", "start"]

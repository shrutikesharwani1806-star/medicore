# Stage 1: Build Frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
# Set production URL for the build
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server/ ./server/
# Copy frontend build from Stage 1
COPY --from=build-frontend /app/client/dist ./client/dist

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server/server.js"]

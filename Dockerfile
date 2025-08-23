# Multi-stage build for FamilyToDo

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ .

# Build frontend
RUN npm run build

# Stage 2: Build and run backend with frontend
FROM node:18-alpine

# Install necessary packages
RUN apk add --no-cache sqlite

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ .

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist ./public

# Create necessary directories
RUN mkdir -p data uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_PATH=/app/data/familytodo.db
ENV UPLOAD_DIR=/app/uploads

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start the application
CMD ["node", "src/index.js"]
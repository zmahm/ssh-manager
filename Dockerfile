# Stage 1: Build React frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Install root deps (frontend)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy frontend source and build
COPY vite.config.js tailwind.config.js postcss.config.js index.html ./
COPY src ./src
COPY public ./public 2>/dev/null || true
ARG VITE_API_URL=https://sshmanager.zeshanmahmood.com
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app

# Install server deps
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --ignore-scripts

# Copy server source
COPY server ./server

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /app/server/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.js"]

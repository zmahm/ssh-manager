# Stage 1: Build React frontend
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install --ignore-scripts

COPY vite.config.js tailwind.config.js postcss.config.js index.html ./
COPY src ./src

ARG VITE_API_URL=https://sshmanager.zeshanmahmood.com
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app

COPY server/package.json ./server/
RUN cd server && npm install --omit=dev

COPY server ./server
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/server/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.js"]

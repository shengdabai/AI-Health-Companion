# Frontend only; the local API service has its own runtime and is never bundled.
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig*.json vite.config.ts postcss.config.js tailwind.config.js index.html ./
COPY src ./src
COPY public ./public
ARG VITE_AI_API_BASE_URL
ENV VITE_AI_API_BASE_URL=$VITE_AI_API_BASE_URL
RUN npm run build

FROM nginx:stable-alpine AS runner
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1
EXPOSE 3000

# syntax=docker/dockerfile:1
# Targets: production (nginx + static SPA), development (react-scripts)

FROM node:22-bookworm-slim AS development
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV HOST=0.0.0.0 \
    WATCHPACK_POLLING=true \
    BROWSER=none
EXPOSE 3000
CMD ["npm", "start"]

FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG REACT_APP_API_URL=/api
ARG REACT_APP_ENV=production
ENV REACT_APP_API_URL=${REACT_APP_API_URL} \
    REACT_APP_ENV=${REACT_APP_ENV}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY --from=build /app/build /usr/share/nginx/html
COPY docker/nginx-frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# -------- BUILD --------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG BUILD_REV=dev
LABEL build.rev=$BUILD_REV
RUN echo "front-credentials build @ ${BUILD_REV}"

COPY . .

RUN npm run build

# -------- SERVE --------
FROM nginx:stable-alpine

# limpiar default
RUN rm -rf /etc/nginx/conf.d/*

# copiar config nginx
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# copiar build angular
COPY --from=builder /app/dist/credentials/browser /usr/share/nginx/html


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
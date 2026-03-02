# FROM pierrezemb/gostatic
# COPY . /srv/http/
# CMD ["-port","8080","-https-promote", "-enable-logging"]
#----------------------
# ---- build ----
# ---- build ----
# ---- build (front + build assets) ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# build do front + gera prisma client (ok)
RUN npm run build

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# deps de runtime
COPY package*.json ./
RUN npm ci --omit=dev

# prisma schema precisa existir no runtime pra gerar
COPY --from=build /app/prisma ./prisma

# gera o prisma client NO RUNTIME
RUN npx prisma generate

# app
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/server.ts ./server.ts

# tsx pra rodar TS em runtime
RUN npm i -g tsx

EXPOSE 8080
CMD ["tsx", "server.ts"]

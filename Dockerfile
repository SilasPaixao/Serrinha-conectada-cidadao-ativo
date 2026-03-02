# FROM pierrezemb/gostatic
# COPY . /srv/http/
# CMD ["-port","8080","-https-promote", "-enable-logging"]
#----------------------
# ---- build ----
# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# copia o build do frontend
COPY --from=build /app/dist ./dist

# copia o backend e prisma (necessários)
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma

# se você roda server.ts com tsx
RUN npm i -g tsx

EXPOSE 8080
CMD ["tsx", "server.ts"]

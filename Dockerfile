# FROM pierrezemb/gostatic
# COPY . /srv/http/
# CMD ["-port","8080","-https-promote", "-enable-logging"]
#----------------------
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

# copia o build do front e o código do server
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/vite.config.* ./ 2>/dev/null || true
COPY --from=build /app/prisma ./prisma 2>/dev/null || true

# se você usa TSX no runtime, precisa dele em deps (ou compile server)
# alternativa: instalar tsx no runtime:
RUN npm i -g tsx

EXPOSE 8080
CMD ["tsx", "server.ts"]

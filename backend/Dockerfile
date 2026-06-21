FROM node:22-alpine AS build
WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm ci --prefix backend

COPY backend ./backend
RUN npm run prisma:generate --prefix backend
RUN npm run build --prefix backend

FROM node:22-alpine AS runtime
WORKDIR /app/backend

ENV NODE_ENV=production

COPY --from=build /app/backend/package*.json ./
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/server.js"]

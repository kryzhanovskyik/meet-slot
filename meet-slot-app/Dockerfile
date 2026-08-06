FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

# Applies migrations (retrying until the database is actually reachable), seeds demo
# data, then starts the production server. Safe to run repeatedly: migrations are
# idempotent and the seed upserts rooms/users. See docker-entrypoint.sh.
CMD ["./docker-entrypoint.sh"]

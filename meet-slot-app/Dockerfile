FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

# Applies migrations, seeds demo data, then starts the production server.
# Safe to run repeatedly: migrations are idempotent and the seed upserts rooms/users.
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && npm start"]

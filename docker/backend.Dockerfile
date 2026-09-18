FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm ci

WORKDIR /app/packages/backend

ENV NODE_ENV=production
EXPOSE 3000

USER node

CMD ["node", "-r", "ts-node/register", "src/main.ts"]

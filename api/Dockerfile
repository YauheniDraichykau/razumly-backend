FROM node:22-slim AS builder
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y python3 g++ make
RUN apt-get update && apt-get install -y openssl

COPY package.json yarn.lock ./

ENV npm_config_build_from_source=true
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn prisma generate

RUN yarn build

FROM node:22-slim
WORKDIR /usr/src/app
ENV NODE_ENV=development

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/main.js"]

ARG VERSION=20-alpine
FROM node:$VERSION AS build-env
WORKDIR /app

# Copy package and restore as distinct layers
COPY package*.json ./
RUN npm ci

# Copy everything else and build
COPY ./scripts ./scripts
COPY ./types ./types
COPY ./src ./src
COPY ./tsconfig.json ./tsconfig.json
COPY ./.npmrc ./.npmrc

RUN npm run build

# Runtime image
FROM node:$VERSION
ARG NODE_PORT=8080

RUN adduser \
  --disabled-password \
  --home /app \
  --gecos '' app \
  && chown -R app /app
USER app
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

VOLUME /app/config

COPY --from=build-env /app/dist /app/bin
COPY --from=build-env /app/public /app/public
COPY --chown=app:app ./config /app/config

ENV NODE_PORT=${NODE_PORT}

EXPOSE ${NODE_PORT}

ENTRYPOINT ["node", "./bin/server.js"]
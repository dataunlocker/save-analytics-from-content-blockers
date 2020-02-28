# Build node_modules to avoid installing NPM (additinal container size)

FROM alpine AS stage

WORKDIR /app
COPY . /app

RUN apk add --update npm=12.15.0-r1
RUN npm install

# Build aclual container

FROM alpine

COPY . /app
COPY --from=stage /app/node_modules /app/node_modules
WORKDIR /app

RUN apk add --update nodejs=12.15.0-r1

EXPOSE 80

ENV APP__ENV_NAME=prod
CMD node -r esm src/api.js
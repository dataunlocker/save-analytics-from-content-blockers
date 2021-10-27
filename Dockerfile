# Build node_modules to avoid installing NPM (additinal container size)

FROM alpine AS stage

WORKDIR /app
COPY . /app

RUN apk add --update 'npm<13.0.0'
RUN npm install

# Build aclual container

FROM alpine

COPY . /app
COPY --from=stage /app/node_modules /app/node_modules
WORKDIR /app

RUN apk add --update 'nodejs<13.0.0'

EXPOSE 80

ENV APP__ENV_NAME=prod
CMD node --max-http-header-size=1048576 -r esm src/api.js

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

ARG APP__ENV_NAME=prod
ENV APP__ENV_NAME=$APP__ENV_NAME

ARG APP__PROXY_DOMAIN
ENV APP__PROXY_DOMAIN=$APP__PROXY_DOMAIN

ARG APP__STRIPPED_PATH
ENV APP__STRIPPED_PATH=$APP__STRIPPED_PATH

ARG APP__HOSTS_WHITELIST_REGEX
ENV APP__HOSTS_WHITELIST_REGEX=$APP__HOSTS_WHITELIST_REGEX

CMD node -r esm src/api.js
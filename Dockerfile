FROM node:11

WORKDIR /server
COPY . /server

RUN yarn
RUN yarn clean
RUN yarn build

# Copy live env config updates file to /server so that it may be updated while running.
COPY ./packages/rollup-core/config/env_var_updates.config /server

WORKDIR /server/packages/rollup-services

# This is required for the wait_for_postgres script
RUN apt-get update
RUN apt-get install -y postgresql-client

ENTRYPOINT [ "bash", "./exec/wait_for_postgres_and_geth.sh", "yarn", "run", "services" ]

FROM node as build
COPY public /app/public
COPY src /app/src
COPY package.json /app/package.json
COPY tsconfig.json /app/tsconfig.json
WORKDIR /app
RUN yarn set version 1.22.10 && yarn && yarn build

FROM nginx:1.19.10 as app
COPY --from=build ./app/build /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/conf.d/default.conf
EXPOSE 80

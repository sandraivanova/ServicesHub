FROM node:22-alpine AS build

WORKDIR /app
COPY . .

RUN npm ci
RUN npm run build --workspace=packages/frontend -- --configuration=production

FROM nginx:alpine AS runtime

COPY docker/frontend.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/frontend/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

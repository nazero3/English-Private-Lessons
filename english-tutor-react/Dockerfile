FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js eslint.config.js ./
COPY src ./src
COPY public ./public
ARG VITE_USE_FASTAPI=true
ARG VITE_API_URL=
ENV VITE_USE_FASTAPI=$VITE_USE_FASTAPI
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build && rm -rf dist/books

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

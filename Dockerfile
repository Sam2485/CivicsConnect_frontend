FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Accept build arguments for environment variables
ARG VITE_API_URL
ARG VITE_AUTH_DISABLED
ARG VITE_GOOGLE_MAPS_API_KEY

# Expose them as environment variables during build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_DISABLED=$VITE_AUTH_DISABLED
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Add build arguments
ARG PUBLIC_TODOIST_CLIENT_ID
ARG PUBLIC_TODOIST_CLIENT_SECRET
ARG PUBLIC_YT_DATA_V3_API_KEY
ENV PUBLIC_TODOIST_CLIENT_ID=${PUBLIC_TODOIST_CLIENT_ID}
ENV PUBLIC_TODOIST_CLIENT_SECRET=${PUBLIC_TODOIST_CLIENT_SECRET}
ENV PUBLIC_YT_DATA_V3_API_KEY=${PUBLIC_YT_DATA_V3_API_KEY}

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules

# Set runtime environment variables
ENV PUBLIC_TODOIST_CLIENT_ID=${PUBLIC_TODOIST_CLIENT_ID}
ENV PUBLIC_TODOIST_CLIENT_SECRET=${PUBLIC_TODOIST_CLIENT_SECRET}
ENV PUBLIC_YT_DATA_V3_API_KEY=${PUBLIC_YT_DATA_V3_API_KEY}
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000
CMD ["node", "build"]
# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install serve for static file hosting (respects PORT env var)
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Railway injects PORT at runtime
ENV PORT=3000
EXPOSE 3000

# Serve static files on Railway's PORT
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]

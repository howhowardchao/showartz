#############################
# Build stage
#############################
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies（含 dev，為 build 所需）
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

#############################
# Production stage
#############################
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy build artifacts與必要檔案
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/node_modules /app/node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 使用 Next.js 內建伺服器
CMD ["npm", "run", "start"]


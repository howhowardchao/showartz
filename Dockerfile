#############################
# Build stage
#############################
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Avoid stale cache pulling old Next.js
RUN npm cache clean --force

# 安裝依賴：捨棄 lock，直接線上抓最新（確保 next 為 16.0.10）
ENV NPM_CONFIG_REGISTRY=https://registry.npmjs.org
RUN rm -rf node_modules package-lock.json \
  && npm install --prefer-online --no-audit --legacy-peer-deps \
  && npm install next@16.0.10 --save-exact --prefer-online --no-audit --legacy-peer-deps

# Copy source code
COPY . .

# Force disable Turbopack to avoid missing routes during build
ENV NEXT_PRIVATE_SKIP_TURBOPACK=1

# Build Next.js app
RUN npm run build

#############################
# Production stage
#############################
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Keep same build flag in runtime for safety (should not affect start)
ENV NEXT_PRIVATE_SKIP_TURBOPACK=1

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


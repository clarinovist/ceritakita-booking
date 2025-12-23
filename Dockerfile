# ============================================
# Stage 1: Dependencies
# Install all dependencies and compile native modules
# ============================================
FROM node:20-alpine AS deps

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
# This also compiles better-sqlite3 native module
RUN npm ci

# ============================================
# Stage 2: Builder
# Build the Next.js application
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Create necessary directories for data and uploads
RUN mkdir -p data uploads/payment-proofs

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
# The standalone output will be in .next/standalone
RUN npm run build

# ============================================
# Stage 3: Production Runner
# Minimal production runtime with only necessary files
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder stage
# Standalone build includes minimal node_modules automatically
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create directories for persistent data (will be mounted as volumes)
RUN mkdir -p data uploads/payment-proofs && \
    chown -R nextjs:nodejs data uploads

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly (for graceful shutdown)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the Next.js production server
CMD ["node", "server.js"]

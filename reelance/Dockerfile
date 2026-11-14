# Reelance — image de production (VPS Hostinger, ou tout hôte Docker)
# Build : docker compose build    Lancement : docker compose up -d

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_APP_URL est intégré au build : passez-le en argument.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npx prisma generate && npx next build

# Étape utilisée pour les migrations et le seed (contient la CLI Prisma et tsx)
FROM build AS migrate
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts"]

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S reelance && adduser -S reelance -G reelance
COPY --from=build --chown=reelance:reelance /app/.next/standalone ./
COPY --from=build --chown=reelance:reelance /app/.next/static ./.next/static
COPY --from=build --chown=reelance:reelance /app/public ./public
USER reelance
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]

import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Pour les migrations, on préfère une connexion directe (non « poolée ») quand l'hébergeur en fournit une
 * (Neon via Vercel : DATABASE_URL_UNPOOLED ou POSTGRES_URL_NON_POOLING).
 */
const migrationUrl =
  process.env["DATABASE_URL_UNPOOLED"] ??
  process.env["POSTGRES_URL_NON_POOLING"] ??
  process.env["DATABASE_URL"] ??
  process.env["POSTGRES_PRISMA_URL"] ??
  process.env["POSTGRES_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl,
  },
});

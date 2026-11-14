import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_OUTPUT=standalone (utilisé par le Dockerfile) produit un serveur Node autonome : .next/standalone/server.js
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  serverExternalPackages: ["pg", "nodemailer"],
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Domaines publics supplémentaires autorisés à soumettre les formulaires, si un proxy
      // ne transmet pas l'en-tête Host d'origine (ex. « reelance.com,www.reelance.com »).
      allowedOrigins: (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    },
  },
};

export default nextConfig;

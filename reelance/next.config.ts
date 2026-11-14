import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_OUTPUT=standalone (utilisé par le Dockerfile) produit un serveur Node autonome : .next/standalone/server.js
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  serverExternalPackages: ["pg", "nodemailer"],
  poweredByHeader: false,
};

export default nextConfig;

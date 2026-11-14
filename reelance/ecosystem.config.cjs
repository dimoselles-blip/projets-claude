// PM2 — déploiement sans Docker sur un VPS (Hostinger KVM, etc.)
//   npm ci && npm run build && npm run db:deploy && npm run db:seed
//   pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: "reelance",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1, // une seule instance : le limiteur de tentatives de connexion est en mémoire
      exec_mode: "fork",
      max_memory_restart: "800M",
      env: { NODE_ENV: "production" },
    },
  ],
};

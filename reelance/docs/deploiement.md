# Déploiement

Trois options. Dans tous les cas : base PostgreSQL, variables de `.env.example`, **HTTPS obligatoire** (le cookie de session est `Secure` en production), et un appel horaire de `/api/cron`.

## Option A — Vercel + base managée (le plus simple)

1. **Base** : créez une base PostgreSQL sur Neon, Supabase ou Railway (offres gratuites) et copiez l'URL de connexion (avec `?sslmode=require` si demandé).
2. **Projet Vercel** : importez le dépôt GitHub, avec `reelance` comme **Root Directory**. Framework : Next.js. Les commandes par défaut conviennent (`npm install`, `npm run build`).
3. **Variables** (Settings → Environment Variables) : toutes celles de `.env.example`, dont `DATABASE_URL`, `NEXT_PUBLIC_APP_URL=https://votre-domaine.com`, les clés FedaPay, `CRON_SECRET` (chaîne aléatoire).
4. **Migrations et admin**, depuis votre poste, avec l'URL de la base de production :
   ```bash
   DATABASE_URL="postgresql://…" ADMIN_EMAIL="…" ADMIN_PASSWORD="…" npm run db:deploy
   DATABASE_URL="postgresql://…" ADMIN_EMAIL="…" ADMIN_PASSWORD="…" npm run db:seed
   ```
5. **Cron** : `vercel.json` déclare un appel quotidien de `/api/cron` (le plan gratuit n'autorise qu'un cron par jour). Vercel envoie automatiquement `Authorization: Bearer $CRON_SECRET`. Avec le plan Pro, passez à `"0 * * * *"` (toutes les heures). La validation automatique est aussi appliquée dès qu'une commande concernée est ouverte, donc un cron quotidien suffit pour démarrer.
6. **Domaine** : ajoutez votre domaine dans Vercel, puis déclarez le webhook FedaPay sur `https://votre-domaine.com/api/webhooks/fedapay`.

## Option B — VPS Hostinger avec Node.js et PM2

Pour un VPS (offre KVM) sous Ubuntu 22.04 ou 24.04. L'hébergement mutualisé ne convient pas : il faut Node.js en continu et PostgreSQL.

```bash
# 1. Paquets
sudo apt update && sudo apt install -y postgresql nginx certbot python3-certbot-nginx git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm install -g pm2

# 2. Base de données
sudo -u postgres psql -c "CREATE USER reelance WITH PASSWORD 'mot-de-passe-fort';"
sudo -u postgres psql -c "CREATE DATABASE reelance OWNER reelance;"

# 3. Application
git clone https://github.com/<compte>/<depot>.git && cd <depot>/reelance
cp .env.example .env && nano .env      # DATABASE_URL=postgresql://reelance:…@localhost:5432/reelance
npm ci
npm run build
npm run db:deploy && npm run db:seed
pm2 start ecosystem.config.cjs && pm2 save && pm2 startup
```

**Nginx** (`/etc/nginx/sites-available/reelance`) :

```nginx
server {
  server_name votre-domaine.com www.votre-domaine.com;
  client_max_body_size 10m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/reelance /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com   # HTTPS gratuit
```

**Cron** (`crontab -e`) :

```cron
0 * * * * curl -fsS -H "Authorization: Bearer VOTRE_CRON_SECRET" https://votre-domaine.com/api/cron > /dev/null
```

**Mise à jour** :

```bash
git pull && npm ci && npm run build && npm run db:deploy && pm2 restart reelance
```

**Sauvegardes** : `pg_dump -U reelance reelance | gzip > reelance-$(date +%F).sql.gz`, à planifier chaque jour et à copier hors du serveur.

## Option C — VPS avec Docker

Le `docker-compose.yml` lance PostgreSQL, l'application et un cron horaire.

```bash
cd reelance
cp .env.example .env     # remplissez ; ajoutez POSTGRES_PASSWORD=… (DATABASE_URL est fourni par compose)
docker compose build
docker compose run --rm migrate      # migrations + catégories + admin
docker compose up -d
```

L'application écoute sur `127.0.0.1:3000` : placez Nginx et Certbot devant, comme dans l'option B.

## Avant l'ouverture au public

- [ ] `NEXT_PUBLIC_APP_URL` en HTTPS, domaine définitif
- [ ] Clés FedaPay **live** dans les variables de l'hébergeur, « Tester la connexion FedaPay » au vert, webhook live déclaré, service Payouts activé, modes Mobile Money vérifiés (voir [fedapay.md](fedapay.md))
- [ ] `PAYMENT_SIMULATION=false`
- [ ] `CRON_SECRET` défini et cron actif (vérifier la réponse de `/api/cron`)
- [ ] SMTP configuré (sinon pas d'e-mails, ni de réinitialisation de mot de passe)
- [ ] Cloudinary configuré (sinon les utilisateurs doivent coller des liens d'images)
- [ ] Compte admin créé avec un mot de passe fort ; `ADMIN_PASSWORD` retiré du `.env` après le seed
- [ ] Conditions d'utilisation (`/conditions`) relues par un juriste
- [ ] Logo définitif intégré (voir [charte-graphique.md](charte-graphique.md))
- [ ] Sauvegardes de la base planifiées

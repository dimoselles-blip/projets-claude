# Déploiement

Trois options. Dans tous les cas : base PostgreSQL, variables de `.env.example`, **HTTPS obligatoire** (le cookie de session est `Secure` en production), et un appel horaire de `/api/cron`.

## Option A — Vercel (le plus simple, sans rien installer)

Tout se fait dans le navigateur. Les tables, les catégories et le compte admin sont créés automatiquement au moment du déploiement (script `vercel-build`).

1. **Compte** : créez un compte gratuit sur [vercel.com](https://vercel.com) avec « Continue with GitHub ».
2. **Projet** : *Add New… → Project*, importez le dépôt GitHub qui contient Reelance.
   - **Root Directory** : cliquez sur *Edit* et choisissez `reelance`.
   - Framework : Next.js (détecté automatiquement). Ne touchez pas aux commandes.
   - Le code doit être sur la branche par défaut du dépôt (`main`). Sinon, après l'import : *Settings → Environments → Production → Branch Tracking* et indiquez la branche.
3. **Variables d'environnement** (sur le même écran, rubrique *Environment Variables*) :

   | Nom | Valeur |
   | --- | --- |
   | `ADMIN_EMAIL` | votre e-mail d'administrateur |
   | `ADMIN_PASSWORD` | un mot de passe fort (10 caractères minimum) |
   | `CRON_SECRET` | une longue chaîne aléatoire |
   | `PAYMENT_SIMULATION` | `true` pour tester sans FedaPay (à retirer en production) |
   | `SEED_DEMO` | `true` pour avoir des monteurs et services de démonstration (facultatif) |

4. **Base de données** : cliquez sur *Deploy* (le premier déploiement échoue : c'est normal, il manque la base). Ouvrez ensuite l'onglet **Storage → Create Database → Neon (Postgres)**, choisissez la région la plus proche (Europe), puis **Connect** au projet. Vercel ajoute lui-même les variables de connexion.
5. **Redéployer** : onglet *Deployments* → menu « ⋯ » du dernier déploiement → *Redeploy*.
6. **C'est en ligne** : l'adresse s'affiche sur la page du projet (ex. `https://reelance-xxxx.vercel.app`). Connectez-vous avec `ADMIN_EMAIL` et `ADMIN_PASSWORD` : vous arrivez dans le back office.

Ensuite :

- **Votre domaine** : *Settings → Domains*, ajoutez `reelance.com` (ou autre) et suivez les instructions DNS. Puis ajoutez `NEXT_PUBLIC_APP_URL=https://votre-domaine` et redéployez.
- **FedaPay** : ajoutez `FEDAPAY_PUBLIC_KEY`, `FEDAPAY_SECRET_KEY` (puis `FEDAPAY_WEBHOOK_SECRET`), retirez `PAYMENT_SIMULATION`, redéployez, et utilisez « Tester la connexion FedaPay » dans les paramètres admin (voir [fedapay.md](fedapay.md)).
- **Cron** : `vercel.json` déclare un appel quotidien de `/api/cron` (le plan gratuit n'autorise qu'un cron par jour). Vercel envoie automatiquement `Authorization: Bearer $CRON_SECRET`. Avec le plan Pro, passez à `"0 * * * *"`. La validation automatique est aussi appliquée dès qu'une commande concernée est ouverte.

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

La ligne `proxy_set_header Host $host;` est importante : sans elle, les formulaires sont refusés (protection anti-falsification de Next.js). À défaut, renseignez `SERVER_ACTIONS_ALLOWED_ORIGINS` avec votre domaine.

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

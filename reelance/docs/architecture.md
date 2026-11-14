# Architecture

## Vue d'ensemble

Une seule application Next.js sert à la fois les pages (rendu serveur) et le back-end :

- **Pages** : composants serveur React qui lisent la base directement via Prisma.
- **Mutations** : Server Actions (`src/server/actions/*`), appelées par les formulaires. Chaque action vérifie la session, le rôle et la propriété de l'objet avant d'écrire.
- **Routes API** (`src/app/api/*`) uniquement pour ce qui vient de l'extérieur : webhook FedaPay, retour de paiement, cron, signature d'upload Cloudinary, sonde de santé.
- **Logique métier** dans `src/lib` : le séquestre (`escrow.ts`) est le seul endroit qui change le statut d'une commande, d'un séquestre ou d'un reversement.

```
Navigateur ──► Next.js (pages + Server Actions) ──► PostgreSQL (Prisma)
                     │            ▲
                     ▼            │ webhook signé / retour client
                 API FedaPay ─────┘      (paiements et reversements)
```

## Arborescence

```
reelance/
├── prisma/
│   ├── schema.prisma          # modèle de données
│   ├── migrations/            # migrations SQL versionnées
│   └── seed.ts                # catégories, admin, données de démo
├── public/brand/              # emplacement du logo définitif
├── src/
│   ├── proxy.ts               # redirige vers /connexion les pages privées sans session
│   ├── app/
│   │   ├── layout.tsx, globals.css (charte), not-found.tsx, error.tsx
│   │   ├── (site)/            # pages publiques avec en-tête et pied de page
│   │   │   ├── page.tsx                    # accueil
│   │   │   ├── services/, services/[slug]/ # catalogue (grille) et fiche service
│   │   │   ├── freelances/, freelances/[slug]/  # annuaire et profil détaillé
│   │   │   ├── missions/, missions/[id]/   # missions ouvertes, candidature
│   │   │   ├── commander/[slug]/           # finalisation d'achat d'un service
│   │   │   ├── paiement/simulation/        # paiement simulé (mode démo)
│   │   │   └── conditions/                 # CGU (modèle)
│   │   ├── (auth)/            # connexion, inscription, mot de passe oublié
│   │   ├── tableau-de-bord/   # espace freelance ou client (selon le rôle)
│   │   │   ├── page.tsx                    # vue d'ensemble
│   │   │   ├── commandes/, commandes/[id]/ # suivi, paiement, livraison, validation, litige
│   │   │   ├── services/ (+ nouveau, [id]) # freelance : ses services
│   │   │   ├── candidatures/, paiements/   # freelance
│   │   │   ├── missions/ (+ nouvelle, [id]) # client : missions et candidatures reçues
│   │   │   └── profil/                     # profil, portfolio, Mobile Money / profil entreprise
│   │   ├── admin/             # back office
│   │   │   ├── page.tsx (statistiques), utilisateurs/, services/, missions/,
│   │   │   ├── commandes/ (+ [id]), paiements/, litiges/, categories/, parametres/
│   │   └── api/
│   │       ├── webhooks/fedapay/  # événements FedaPay (signature vérifiée)
│   │       ├── paiements/retour/  # callback_url FedaPay
│   │       ├── cron/              # validation auto + taux de change
│   │       ├── uploads/signature/ # signature d'upload Cloudinary
│   │       └── health/
│   ├── components/
│   │   ├── ui/                # boutons, champs, cartes, badges, tableaux
│   │   ├── forms/             # ActionForm (formulaires reliés aux Server Actions), ImageUpload
│   │   ├── layout/            # en-tête, pied de page, sélecteur de devise, messages flash
│   │   ├── services/, freelancers/, missions/, orders/, dashboard/, admin/, brand/
│   ├── lib/
│   │   ├── config.ts          # lecture des variables d'environnement
│   │   ├── db.ts              # client Prisma
│   │   ├── auth/              # mots de passe, sessions, gardes de rôle
│   │   ├── fedapay.ts         # client API FedaPay + vérification de signature
│   │   ├── payments.ts        # création de la transaction, montants figés
│   │   ├── escrow.ts          # machine à états commande / séquestre / reversement
│   │   ├── currency.ts, rates.ts, display-currency.ts   # multi-devises
│   │   ├── settings.ts        # commission, délais, modération (table Setting)
│   │   ├── queries.ts         # recherches du catalogue
│   │   ├── notifications.ts, mail.ts   # e-mails transactionnels
│   │   └── validation.ts, constants.ts, utils.ts, flash.ts, rate-limit.ts, audit.ts
│   ├── server/actions/        # Server Actions : auth, profile, services, missions, orders, admin, currency
│   └── generated/prisma/      # client Prisma généré (non versionné)
├── Dockerfile, docker-compose.yml, ecosystem.config.cjs, vercel.json
└── .env.example
```

## Modèle de données

Tous les montants sont des **entiers en FCFA (XOF)**.

| Domaine | Tables | Rôle |
| --- | --- | --- |
| Comptes | `User`, `Session`, `PasswordResetToken` | Un utilisateur a un rôle (`ADMIN`, `FREELANCER`, `CLIENT`) et un statut (`ACTIVE`, `SUSPENDED`). Les sessions stockent l'empreinte SHA-256 du jeton du cookie. |
| Profils | `FreelancerProfile`, `PortfolioItem`, `ClientProfile` | Profil public du monteur (slug, compétences, logiciels, tarif, badge vérifié, compte Mobile Money) ; profil entreprise du client. |
| Catalogue | `Category` (arborescente), `Service`, `ServicePackage` | Catégories et sous-catégories gérées par l'admin. Un service a 1 à 3 offres (`BASIC`, `STANDARD`, `PREMIUM`), chacune avec prix, délai, retouches, éléments inclus. |
| Missions | `Mission`, `Application` | Mission d'un client (budget, échéance) ; candidatures des freelances (message, devis, délai), une par freelance et par mission. |
| Commandes | `Order`, `Delivery`, `OrderEvent` | Une commande vient soit d'un service (`SERVICE`), soit d'une candidature retenue (`MISSION`). Elle fige le prix, la commission, le net freelance, la devise du client et le taux utilisé. `OrderEvent` est l'historique affiché. |
| Argent | `Payment`, `Escrow`, `Payout` | `Payment` = une tentative de paiement FedaPay. `Escrow` = fonds bloqués d'une commande payée. `Payout` = un reversement (FedaPay ou manuel). |
| Litiges | `Dispute` | Un litige par commande au plus, tranché par l'admin. |
| Plateforme | `Setting`, `ExchangeRate`, `WebhookEvent`, `AuditLog` | Paramètres modifiables, taux de change, journal des webhooks reçus, journal des actions admin. |

## Cycle de vie d'une commande et du séquestre

```
                    paiement FedaPay approuvé
AWAITING_PAYMENT ─────────────────────────────► IN_PROGRESS ──────livraison──────► DELIVERED
   │                       (Escrow HELD)          ▲                                  │  │  │
   │ annulation                                   │ nouvelle livraison               │  │  │ validation client
   ▼                                              │                                  │  │  │ ou automatique (J+3)
CANCELLED                                 REVISION_REQUESTED ◄────retouche───────────┘  │  ▼
                                                                                         │ COMPLETED (Escrow RELEASABLE)
IN_PROGRESS / DELIVERED / REVISION_REQUESTED ──litige──► DISPUTED                        │        │
                                         admin : pour le freelance ──► COMPLETED ◄───────┘        │ admin : reverser
                                         admin : pour le client ────► REFUNDED (Escrow REFUNDED)  ▼
                                                                          Escrow RELEASING ──► RELEASED
```

Points de robustesse :

- Chaque transition est une **mise à jour conditionnelle** (`updateMany … where status = attendu`). Si le webhook et le retour client arrivent en même temps, un seul applique le paiement ; l'autre ne fait rien (idempotence testée).
- Le statut d'un paiement est toujours **relu auprès de l'API FedaPay** (et le montant comparé) avant de bloquer les fonds. Les paramètres d'URL du retour client ne sont pas utilisés.
- Un paiement reçu pour une commande déjà annulée est signalé dans le back office (à rembourser).
- Le reversement verrouille le séquestre (`RELEASING`) avant d'appeler FedaPay : impossible de payer deux fois le même freelance.

## Les deux flux

**Achat de service** : fiche service → choix de l'offre → `/commander/[slug]` (consignes) → commande `AWAITING_PAYMENT` → transaction FedaPay → page de paiement FedaPay → retour + webhook → `IN_PROGRESS` → livraison → validation → reversement.

**Mission** : le client publie (validation admin si activée) → les freelances postulent → le client retient une candidature (commande `MISSION` à son prix et son délai) → paiement → les autres candidatures passent « non retenues » → même suite que ci-dessus.

## Multi-devises

1. Le freelance saisit ses prix en FCFA.
2. La devise d'affichage vient du compte, sinon d'un cookie, sinon du pays détecté (en-têtes géo de Vercel ou Cloudflare), sinon FCFA.
3. EUR et XAF utilisent la parité fixe (1 € = 655,957 FCFA). USD, CAD, GBP et CHF viennent de l'API de change, mise en cache en base (12 h par défaut, rafraîchie par le cron) ; si l'API est injoignable, les derniers taux connus ou des valeurs de secours sont utilisés.
4. À la création de la commande, on fige `displayCurrency`, `displayAmount` et `xofPerUnit`, recopiés dans le séquestre. FedaPay débite le montant en FCFA ; le client voit les deux montants avant de payer.

## Sécurité

- Mots de passe hachés avec bcrypt (coût 12) ; cookie de session `httpOnly`, `SameSite=Lax`, `Secure` en production.
- Contrôle d'accès côté serveur dans chaque layout privé et chaque Server Action (le `proxy.ts` ne fait qu'une première redirection).
- Webhook : signature HMAC-SHA256 vérifiée, avec 5 minutes de tolérance ; sans `FEDAPAY_WEBHOOK_SECRET`, tout webhook est refusé.
- Limitation des tentatives de connexion, d'inscription et de mot de passe oublié (en mémoire, par instance).
- Les liens saisis (livraisons, portfolio, images) doivent être en `http(s)`. Les valeurs saisies sont échappées dans les e-mails.
- Les actions admin sensibles sont journalisées (`AuditLog`).

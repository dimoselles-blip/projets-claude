# Intégration FedaPay

Reelance appelle l'API REST de FedaPay directement (`src/lib/fedapay.ts`), avec les mêmes endpoints et formats que le SDK Node officiel (`fedapay` sur npm).

| Usage | Endpoint FedaPay | Où dans le code |
| --- | --- | --- |
| Créer la transaction d'une commande | `POST /v1/transactions` | `lib/payments.ts → startPayment` |
| Obtenir l'URL de la page de paiement | `POST /v1/transactions/:id/token` | idem |
| Vérifier le statut d'un paiement | `GET /v1/transactions/:id` | `lib/escrow.ts → syncPaymentWithFedapay` |
| Créer un reversement au freelance | `POST /v1/payouts` | `lib/escrow.ts → startFedapayPayout` |
| Envoyer le reversement | `PUT /v1/payouts/start` | idem |
| Vérifier un reversement | `GET /v1/payouts/:id` | `lib/escrow.ts → refreshPayout` |

## 1. Variables d'environnement

```env
FEDAPAY_PUBLIC_KEY="pk_sandbox_…"     # puis pk_live_… en production
FEDAPAY_SECRET_KEY="sk_sandbox_…"
FEDAPAY_WEBHOOK_SECRET="wh_sandbox_…"
NEXT_PUBLIC_APP_URL="https://votre-domaine.com"   # sert de callback_url
```

- Le mode est **déduit de la clé secrète** : `sk_sandbox_…` → `https://sandbox-api.fedapay.com`, `sk_live_…` → `https://api.fedapay.com`. `FEDAPAY_ENV` (« sandbox » ou « live ») ne sert qu'à forcer un mode ; en cas d'incohérence avec la clé, le back office l'affiche.
- Les clés se trouvent dans le tableau de bord FedaPay, rubrique **Paramètres → Clés API** (une paire par environnement).
- La clé publique n'est pas utilisée par le parcours actuel (redirection vers la page de paiement FedaPay). Elle est prévue pour intégrer plus tard le widget Checkout.js dans la page.
- Ne mettez jamais la clé secrète dans le code, dans une variable `NEXT_PUBLIC_…`, dans un e-mail ou une conversation. Elle se colle **uniquement** dans les variables d'environnement de l'hébergeur (Vercel : Settings → Environment Variables ; VPS : fichier `.env` du serveur). Si elle a circulé ailleurs, régénérez-la dans le tableau de bord FedaPay.

### Vérifier la connexion

Une fois les clés en place et le site redéployé : **back office → Paramètres → « Tester la connexion FedaPay »**. Le test est en lecture seule (il lit les soldes du compte, sans créer de paiement ni de reversement) et affiche :

- « Connexion FedaPay réussie (mode LIVE — paiements réels). Solde du compte : … » si tout est bon ;
- « FedaPay refuse la clé secrète (HTTP 401) » si la clé est fausse, révoquée ou d'un autre mode ;
- « Incohérence : la clé secrète est une clé live mais FEDAPAY_ENV vaut sandbox » si le mode forcé ne correspond pas.

## 2. Parcours de paiement

1. Le client clique sur « Payer ». Reelance crée une ligne `Payment`, puis une transaction FedaPay en **XOF** (montant de la commande) avec `callback_url = {APP_URL}/api/paiements/retour?paiement={id}`.
2. Le client est redirigé vers la page FedaPay (Mobile Money MTN, Moov, Celtiis, carte…).
3. Deux signaux confirment le paiement, et le premier arrivé l'applique :
   - le **retour du client** sur `callback_url` : Reelance relit la transaction via l'API ;
   - le **webhook** `transaction.approved` : signature vérifiée, puis transaction relue via l'API.
4. Si le statut est `approved` (ou `transferred`) et que le montant correspond, la commande passe « en cours » et les fonds sont bloqués en séquestre.

## 3. Webhook

Dans le tableau de bord FedaPay, rubrique **Webhooks** :

- URL : `https://votre-domaine.com/api/webhooks/fedapay`
- Événements : au minimum `transaction.approved`, `transaction.declined`, `transaction.canceled` ; ajoutez les événements de décaissement (`payout.*`) s'ils sont proposés.
- Copiez la clé secrète du webhook (`wh_…`) dans `FEDAPAY_WEBHOOK_SECRET`.

Reelance vérifie l'en-tête `X-FEDAPAY-SIGNATURE` (`t=<horodatage>,s=<signature>`, HMAC-SHA256 de `"<t>.<corps brut>"`, comme le SDK officiel). Tout webhook non signé est refusé (HTTP 400). Chaque événement reçu est journalisé dans la table `WebhookEvent`. En cas d'erreur de traitement, Reelance répond 500 et FedaPay renvoie l'événement plus tard.

Le nom de l'événement est lu dans `name` (ou `type` selon les versions) et l'objet dans `entity`. Vérifiez sur un premier événement sandbox, dans la table `WebhookEvent`, que le format reçu est bien celui-ci.

## 4. Reversements aux freelances (Payouts)

Le service de **décaissement** (Payouts) doit être **activé sur votre compte FedaPay** : faites-en la demande au support. Le solde FedaPay doit couvrir les montants à reverser.

Dans le back office, page **Paiements & séquestre** :

- « Reverser via FedaPay » crée un payout vers le numéro Mobile Money du freelance et l'envoie immédiatement. Le montant est net, après commission.
- « Actualiser le statut » relit le payout chez FedaPay (`sent` → reversé, `failed` → le séquestre redevient « à reverser » et on peut réessayer).
- « Paiement manuel » enregistre un virement fait hors plateforme.

Les opérateurs proposés aux freelances et le `mode` FedaPay correspondant sont définis dans `src/lib/constants.ts` (`PAYOUT_OPERATORS`), par exemple `mtn_open` pour MTN Bénin et `moov` pour Moov Bénin. **Vérifiez ces valeurs** dans votre tableau de bord FedaPay (liste des modes de décaissement actifs sur votre compte) avant la mise en production, et ajustez la liste si besoin.

## 5. Remboursements

En V1, quand l'admin tranche un litige en faveur du client, Reelance clôt le séquestre (`REFUNDED`). **Le remboursement lui-même se fait depuis le tableau de bord FedaPay.**

## 6. Tester

- **Sans clés** : `PAYMENT_SIMULATION=true` simule paiements et reversements. Désactivé automatiquement en `live`.
- **Sandbox FedaPay** : renseignez les clés sandbox, exposez votre poste avec un tunnel HTTPS (par exemple ngrok) pour recevoir le webhook, et payez avec les numéros de test indiqués dans la documentation FedaPay.

## 7. Passage en production

1. Remplacez les clés sandbox par les clés live (le site passe automatiquement en mode live) et vérifiez avec « Tester la connexion FedaPay ».
2. Créez le webhook **live** (le secret est différent de celui du sandbox).
3. Vérifiez que `NEXT_PUBLIC_APP_URL` est l'URL HTTPS définitive.
4. Faites un vrai paiement de faible montant de bout en bout : paiement, livraison, validation, reversement.

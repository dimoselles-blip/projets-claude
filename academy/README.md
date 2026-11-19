# DIMO Tech Academy — plateforme de formation

Plateforme officielle de DIMO Tech Academy, prévue pour un sous-domaine de dimotech.fr (par exemple `academy.dimotech.fr`) hébergé chez Hostinger.

Elle comprend le site public, l'inscription avec paiement Mobile Money, l'espace apprenant et l'espace d'administration. Elle fonctionne en PHP et MySQL, sans dépendance externe.

| Document | Pour quoi faire |
| --- | --- |
| Ce fichier | Mettre la plateforme en ligne chez Hostinger |
| [`GUIDE-CONTENU.md`](GUIDE-CONTENU.md) | Ajouter une formation, une session, un témoignage, valider un paiement… |
| [`BRANCHEMENTS.md`](BRANCHEMENTS.md) | Ce qu'il reste à brancher, et les points à confirmer avant publication |
| [`contenu/catalogue.json`](contenu/catalogue.json) | Le fichier de contenu unique : formations, sessions, témoignages, compteurs, FAQ |
| [`config/config.example.php`](config/config.example.php) | Modèle du fichier de réglages unique : numéros, e-mails, réseaux, paiement |

---

## Ce que fait la plateforme

**Site public.** L'accueil comprend les 12 blocs du brief. On y trouve aussi le catalogue filtrable (catégorie, niveau, format, prix), une fiche par formation et les pages Masterclass (avec les replays), Parcours, Entreprises (avec le formulaire de devis), Sessions (calendrier filtrable), À propos, Contact, FAQ, Mentions légales et Confidentialité. Le bouton WhatsApp flottant est présent sur toutes les pages.

**Inscription en 2 clics.** Le bouton « S'inscrire » ouvre une fenêtre déjà liée à la formation. Elle demande le nom, l'e-mail, le WhatsApp, le format (quand on a le choix) et la session, et rappelle le prix. Ensuite :
- formation gratuite : confirmation immédiate et e-mail de confirmation ;
- formation payante : choix de MTN, Moov ou Celtiis, puis un bouton ouvre WhatsApp avec un message prérempli (formation, nom, e-mail, référence). Le statut reste « En attente de paiement » jusqu'à ce que l'équipe valide le paiement.

**Paiement en plusieurs tranches.** Chaque inscription a un échéancier (montant total, tranches reçues, reste à payer). Les statuts sont : En attente de paiement, Partiellement payée, Payée, Confirmée, Annulée. Les contenus s'ouvrent au statut « Confirmée » ou dès que **50 %** du montant est payé (seuil réglable dans l'administration).

**Espace apprenant.** La connexion se fait par lien e-mail (sans mot de passe) ou par mot de passe. L'espace affiche :
- les formations suivies et leur statut ;
- la prochaine séance en direct, avec le lien visio révélé 24 h avant ;
- les replays et vidéos, regroupés par module, et les supports à télécharger (protégés) ;
- la progression et les notifications.

Les quiz et les certificats sont préparés pour la phase 2.

**Administration** (depuis un navigateur, Chromebook compris). L'équipe y gère les formations, les modules et contenus, les sessions, les formateurs, les témoignages, les compteurs, la FAQ et les catégories. Elle peut aussi :
- valider un paiement et confirmer une inscription ;
- exporter les inscrits en CSV et voir les demandes de devis, de contact et de liste d'attente ;
- envoyer un lien de connexion à un apprenant ;
- régler la plateforme, consulter les statistiques de visite et importer ou exporter le fichier de contenu.

---

## Mise en ligne chez Hostinger (environ 20 minutes)

Tout se fait depuis **hPanel**, dans un navigateur.

### 1. Créer le sous-domaine

hPanel → **Domaines** → **Sous-domaines** → créer `academy` (ou le nom retenu) pour `dimotech.fr`. Notez le dossier créé, par exemple `public_html/academy`. Si le domaine est géré chez un autre registrar, ajoutez chez lui l'enregistrement DNS indiqué par Hostinger (type A ou CNAME).

### 2. Vérifier PHP

hPanel → **Avancé** → **Configuration PHP** : choisissez **PHP 8.2 ou 8.3**. Les extensions `pdo_mysql`, `mbstring`, `gd` et `curl` sont actives par défaut chez Hostinger.

### 3. Créer la base de données

hPanel → **Bases de données** → **Gestion** : créez une base MySQL et un utilisateur, puis notez le nom de la base, l'utilisateur et le mot de passe.

### 4. Envoyer les fichiers

1. Sur GitHub, téléchargez le dépôt (**Code** → **Download ZIP**), décompressez-le et compressez à nouveau **le contenu du dossier `academy`** en `academy.zip`. Sur Chromebook, l'application Fichiers sait décompresser et compresser.
2. hPanel → **Gestionnaire de fichiers** → ouvrez le dossier du sous-domaine → **Importer** `academy.zip` → clic droit → **Extraire**.
3. Le dossier du sous-domaine doit contenir directement `index.php`, `install.php`, `.htaccess`, `assets/`, `config/`, etc.

> Autre méthode : hPanel → **Avancé** → **Git** permet de déployer le dépôt GitHub. Faites alors pointer le sous-domaine vers le sous-dossier `academy` du dépôt.

### 5. Lancer l'installateur

Ouvrez `https://academy.dimotech.fr/install.php`. L'installateur vérifie l'hébergement, puis demande :
- les informations de la base de données (étape 3) ;
- l'adresse du site, l'e-mail de contact et le numéro WhatsApp (facultatif) ;
- le nom, l'e-mail et le mot de passe de l'administrateur.

Il crée les tables, importe le catalogue 2026, crée le compte administrateur et écrit `config/config.php`. Ensuite, il se bloque. **Supprimez `install.php`** du serveur.

### 6. Activer HTTPS

hPanel → **Sécurité** → **SSL** : installez le certificat gratuit pour le sous-domaine, puis activez **Forcer HTTPS**.

### 7. Brancher le reste

Ouvrez `config/config.php` dans le Gestionnaire de fichiers. Ce fichier unique contient le numéro WhatsApp, les numéros Mobile Money, les adresses e-mail, l'envoi des e-mails (SMTP), les réseaux sociaux, FedaPay et Google Analytics. Tout est détaillé dans [`BRANCHEMENTS.md`](BRANCHEMENTS.md).

Connectez-vous ensuite à `https://academy.dimotech.fr/espace/connexion` avec le compte administrateur. Le tableau de bord rappelle ce qui reste à brancher.

---

## Sécurité

- Les dossiers `config/`, `src/`, `views/`, `storage/` et `contenu/` sont inaccessibles depuis le web (fichiers `.htaccess`, vérifié sous Apache).
- Aucun script ne peut s'exécuter dans `uploads/`. Les supports de cours sont stockés hors du web et servis seulement aux inscrits qui y ont accès.
- Mots de passe hachés, liens de connexion à usage unique, protection CSRF sur tous les formulaires, champ piège anti-robots, limites de tentatives, requêtes SQL préparées et en-têtes de sécurité.
- Les numéros WhatsApp et Mobile Money n'apparaissent jamais dans le code des pages. Les boutons passent par une redirection serveur (`/whatsapp`).

**Sauvegardes** : hPanel → **Fichiers** → **Sauvegardes** (base de données et fichiers). En complément, exportez régulièrement `catalogue.json` depuis l'administration.

## Performance et qualité

- L'accueil pèse environ 130 Ko au total, compressé : HTML 16 Ko, CSS 13 Ko, JS 5 Ko, deux polices (Sora et Inter, 82 Ko) et le logo en WebP.
- Les vidéos YouTube ne se chargent qu'au clic, et les photos envoyées sont converties en WebP compressé.
- Aucun défilement horizontal, testé de 320 à 1440 px de large.
- Aucune violation WCAG A/AA détectée par axe-core sur les pages principales, en thème clair comme en thème sombre.
- Les cibles tactiles mesurent au moins 44 px et l'animation est réduite si le visiteur l'a demandé (prefers-reduced-motion).
- Chaque page a son titre, sa description et ses balises Open Graph. Le site fournit un plan du site (`/sitemap.xml`), un fichier `robots.txt` et des données structurées `Course`, `EducationalOrganization` et `FAQPage`.

## Structure

```
academy/
├── index.php              point d'entrée unique
├── install.php            installateur (à supprimer après usage)
├── .htaccess              réécriture d'URL, protections, cache
├── assets/                CSS, JS, polices, logo, images
├── config/                config.example.php → config.php (réglages et secrets)
├── contenu/catalogue.json fichier de contenu unique
├── src/                   code PHP (routes, contrôleurs, base de données, e-mails, paiement)
├── views/                 gabarits HTML (site, espace apprenant, administration, e-mails)
├── storage/               journaux, sessions, supports de cours privés
└── uploads/               images envoyées depuis l'administration
```

## Tester sur un ordinateur

Prérequis : PHP 8.1 ou plus récent et MySQL ou MariaDB.

```bash
cd academy
php -S 127.0.0.1:8080 index.php
# puis ouvrir http://127.0.0.1:8080/install.php
```

Avec `'mode' => 'journal'` dans `config/config.php`, les e-mails ne partent pas : ils sont écrits dans `storage/logs/emails.log`, liens de connexion compris.

## Phase 2 (déjà préparée)

- **FedaPay** (Mobile Money et carte) : le code est en place (`src/fedapay.php`, webhook signé `/webhooks/fedapay`). Il suffit de renseigner la clé et de passer `actif` à `true`. Le parcours ne change pas : un bouton « Payer en ligne » s'ajoute au paiement par WhatsApp.
- **Quiz et certificats numériques** avec code de vérification : les tables `quiz`, `quiz_tentatives` et `certificats` existent déjà, et l'espace apprenant a des emplacements « Bientôt ».
- **Notifications WhatsApp** : les notifications passent toutes par une seule fonction (`notifier()`), qui envoie déjà l'e-mail. Il suffira d'y ajouter l'envoi WhatsApp.

# Branchements restants et points à confirmer

Les réglages techniques se font dans **un seul fichier** : `config/config.php`. Pour le modifier : hPanel → Gestionnaire de fichiers → `config/config.php` → Modifier, puis Enregistrer.

Les réglages éditoriaux se font dans **Administration → Réglages**. Le tableau de bord de l'administration rappelle ce qui n'est pas encore branché.

## À brancher

| Branchement | Où | Ce qu'il faut |
| --- | --- | --- |
| **Numéro WhatsApp** ✅ | `contact.whatsapp` | Branché : `229433373686` (prérempli dans l'installateur). Tous les boutons WhatsApp, y compris celui du paiement, ouvrent WhatsApp ; le numéro n'est jamais écrit dans les pages. ⚠️ À vérifier : il compte 9 chiffres après +229, alors que les numéros béninois en ont 10 depuis 2024 (01 + 8 chiffres). |
| **Messagerie (envoi des e-mails)** | `email` | 1. Créez une boîte, par exemple `academy@dimotech.fr` (hPanel → E-mails). 2. Passez `mode` à `'smtp'`. 3. Renseignez `expediteur`, `smtp.utilisateur` (l'adresse complète) et `smtp.mot_de_passe`. Hôte `smtp.hostinger.com`, port 465, sécurité `ssl`. 4. Testez avec Administration → Réglages → **M'envoyer un e-mail de test**. Tant que le mode reste `'journal'`, aucun e-mail ne part : confirmations et liens de connexion sont seulement écrits dans `storage/logs/emails.log`. |
| **Adresse e-mail officielle** ✅ | `contact.email`, `contact.email_assistance`, `email.copie_equipe` | Branché : `contact@dimotech.fr`. `copie_equipe` reçoit une copie de chaque inscription et de chaque demande. |
| **Numéros Mobile Money** ✅ | `paiement.mobile_money` | Décision : aucun numéro affiché. L'apprenant choisit MTN, Moov ou Celtiis, puis reçoit les instructions sur WhatsApp. Laisser `afficher_numeros_etape_paiement` à `false`. |
| **Réseaux sociaux** | `reseaux` | Liens TikTok « DIMO TECH ACADEMY », Facebook « DIMO TECH » et LinkedIn « DIMO TECH ACADEMY ». Une icône sans lien reste masquée. |
| **Clé FedaPay** (phase 2) | `paiement.fedapay` | 1. Dans FedaPay → Paramètres → Clés API, copiez la clé secrète (`sk_sandbox_…` pour tester, `sk_live_…` en production) dans `cle_secrete`. 2. Dans FedaPay → Webhooks, déclarez l'adresse `https://academy.dimotech.fr/webhooks/fedapay` et copiez le secret dans `secret_webhook`. 3. Passez `actif` à `true`. Un bouton « Payer en ligne » s'ajoute au paiement par WhatsApp. Le paiement validé est enregistré automatiquement dans l'échéancier. |
| **Statistiques de visite** | rien à faire | Un compteur de pages vues sans cookie fonctionne déjà (tableau de bord de l'administration). Pour Google Analytics, renseignez `statistiques.ga4` (`G-XXXXXXXXXX`) : il ne se charge qu'après l'accord du visiteur. |
| **Lien Google Maps du siège** | `contact.carte` | Facultatif. Il s'affiche sur la page Contact. |
| **Adresse du site** | `site.url` | Écrite par l'installateur. À changer seulement si le sous-domaine change. |

## Points à confirmer avant publication

Pour chaque point, le site applique déjà le choix indiqué par défaut et reste modifiable sans toucher au code.

1. **Nom exact du sous-domaine.** Par défaut : `academy.dimotech.fr`. Le site s'adapte à l'adresse réelle saisie à l'installation.
2. **Formations du brief initial absentes du catalogue 2026.** ✅ Décision : les 6 formations sont gardées, en **Brouillon** (visibles par l'équipe dans l'administration, masquées du public) : Maîtriser ChatGPT & Claude, Créer son premier Agent IA, Power BI : créer son premier Dashboard, Gagner de l'argent avec Claude AI, Data Analytics avec Power BI, Python pour la Data. Pour en mettre une en ligne : complétez sa fiche (accroche, objectifs, modules, format) et passez-la en « Publiée ».
3. **Prix entreprises.** Par défaut, le site affiche les formules Essentielle, Premium et Corporate et l'option en ligne, avec leurs prix. Administration → Réglages → **Prix des formules entreprises** permet de repasser à « Sur devis ». L'accompagnement Data avec DIMO Tech est toujours « Sur devis ».
4. **Certification.** Le site parle de « certificat de fin de parcours » (attestation pour IA générative au travail, rien pour les masterclass), comme le catalogue. Si des certifications internationales sont délivrées, indiquez lesquelles et dans quels parcours : elles s'ajouteront au champ « Résultat » de chaque fiche.
5. **Règle d'accès pour les paiements par tranches.** Choix retenu : les contenus s'ouvrent dès **50 %** du montant payé, ou au statut « Confirmée ». Ce seuil se change dans Administration → Réglages.
6. **Durée des masterclass gratuites.** Elles s'affichent pour l'instant comme « Session courte ». Renseignez la durée dans chaque fiche (champ Durée).
7. **Dates des prochaines sessions.** Aucune pour l'instant : le site affiche « Dates à venir » et un formulaire de liste d'attente. Les personnes inscrites sur la liste sont visibles dans Administration → Demandes.
8. **Formateurs et photos.** Morelle ATINDOGBE est enregistrée comme fondatrice, sans être affectée à une formation. Pour chaque formation, ajoutez son formateur (menu Formateurs, puis le champ Formateur de la fiche). Les cadres « à remplacer » marquent les photos à fournir :
   - le portrait de la fondatrice ;
   - les photos de cohorte, d'atelier, d'apprenantes et du siège ;
   - les photos de l'équipe et des formateurs.
9. **Numéro WhatsApp affiché ou non.** ✅ Décision : le numéro n'est **jamais écrit dans les pages** et les liens mènent toujours à WhatsApp. Les boutons passent par une redirection serveur : le numéro reste invisible même dans le code source.
10. **Niveaux des parcours.** Le catalogue ne précise pas de niveau pour les parcours. Ceux-ci ont été déduits du public cible et des prérequis, à valider :
    - Data Starter, Data Analyst & BI, IA générative au travail, Créateurs d'agents IA : Débutant ;
    - Data Engineer, Data Scientist, Cybersécurité, IoT Full-Stack : Intermédiaire ;
    - Ingénieur IA : Avancé.
11. **Mentions légales.** À compléter : forme juridique, numéros RCCM et IFU, responsable de la publication (fichier `views/site/mentions-legales.php`, ou demandez-moi).
12. **Mot de la fondatrice.** Le texte est à saisir dans Administration → Réglages. Voici une proposition à relire et adapter :

    > J'ai créé DIMO Tech Academy en 2022 avec une conviction : la Data et l'Intelligence Artificielle ne doivent pas rester l'affaire de quelques-uns. Au Bénin comme partout en Afrique, des talents n'attendent qu'une chose : apprendre concrètement, sur de vrais projets, avec un accompagnement jusqu'à l'emploi ou aux premiers clients.
    >
    > C'est ce que nous construisons : une académie exigeante, pratique et ouverte à toutes et à tous, avec une attention particulière pour les femmes qui veulent rejoindre les métiers du numérique. Notre objectif : transformer la connaissance en compétence, et la compétence en opportunité.

## Ce qui a été vérifié

Tout a été vérifié en local :
- installation complète ;
- parcours d'inscription en 2 clics (gratuit et payant) ;
- prix selon le format ;
- validation d'un paiement par tranche et ouverture automatique des contenus à 50 % ;
- lien de connexion à usage unique ;
- lien visio révélé 24 h avant ;
- progression, téléchargements protégés et export CSV ;
- import et export du fichier de contenu ;
- formulaires de contact, de devis et de liste d'attente ;
- protections (CSRF, champ piège, accès réservés, dossiers internes bloqués sous Apache) ;
- aucun défilement horizontal de 320 à 1440 px ;
- aucune violation WCAG A/AA (axe-core) en thème clair et sombre.

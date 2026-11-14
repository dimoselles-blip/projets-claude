# Charte graphique

Objectif : l'allure d'une grande marketplace internationale (propre, épurée, crédible), lisible sur mobile, qui laisse la place au logo Reelance.

## Couleurs

Toutes les couleurs sont des variables CSS dans `src/app/globals.css` (bloc `@theme`). **Pour aligner la palette sur le logo définitif, il suffit de modifier les valeurs `--color-brand-*` et `--color-accent-*`** : tout le site suit.

| Rôle | Nom | Valeur | Usage |
| --- | --- | --- | --- |
| Marque | Violet électrique `brand-600` | `#5B3DF5` | Boutons principaux, liens, onglet actif, focus |
| Marque foncée | `brand-700` / `brand-900` | `#4A2ED6` / `#33228A` | Survol, dégradés |
| Marque claire | `brand-50` / `brand-100` | `#F3F1FF` / `#E9E5FF` | Fonds de mise en avant, badges |
| Accent | Corail « REC » `accent-500` | `#FF5A4E` | Point du logo, compteurs du back office, touches ponctuelles (5 % de la surface maximum) |
| Encre | `ink-900` / `ink-950` | `#0E1330` / `#080B1F` | Titres, texte principal, sections sombres, pied de page, back office |
| Texte secondaire | `ink-500` / `ink-600` | `#636A85` / `#4A5069` | Descriptions, légendes |
| Bordures et fonds | `ink-100` / `ink-50` | `#ECEEF5` / `#F5F6FA` | Cartes, séparateurs, fonds de section |
| États | émeraude, ambre, rouge, bleu ciel | palette Tailwind | Succès (payé, terminé), attente, erreur et litige, information |

Le violet est assez neutre pour accompagner la plupart des logos ; le corail rappelle le voyant d'enregistrement d'une caméra.

## Typographie

Polices auto-hébergées (paquets `@fontsource`) : aucun appel à Google Fonts, chargement rapide sur mobile.

| Usage | Police | Graisses |
| --- | --- | --- |
| Titres, prix, chiffres clés | **Plus Jakarta Sans** (`font-display`) | 700 et 800, interlettrage serré |
| Texte, interface, formulaires | **Inter** (`font-sans`) | 400, 500, 600 |

Échelle : titre d'accueil 36 à 60 px, titres de page 24 à 30 px, titres de section 20 à 30 px, texte 15 à 16 px, légendes 12 à 14 px.

## Composants

- Coins arrondis : 12 px (boutons, champs) à 18 px (cartes) ; ombres douces (`shadow-card`).
- Boutons : `primary` (violet), `dark` (encre), `outline`, `ghost`, `success`, `danger`, en 3 tailles. Hauteur 44 px minimum, adaptée au tactile.
- Cartes de services (grille façon Fiverr) : visuel 16:10, monteur, titre, catégorie, délai, prix « à partir de » dans la devise du visiteur. Sans visuel, un dégradé aux couleurs de la marque avec l'icône de la catégorie est généré.
- Profils (façon Upwork et Malt) : bandeau, carte d'identité (localisation, tarif, expérience, langues), présentation, compétences, portfolio vidéo intégré, services.
- Mobile : catégories et onglets en défilement horizontal, menu plein écran, offres affichées avant la description sur la fiche service.

## Logo

Un logo provisoire (icône « lecture » violette avec point corail et le mot Reelance) est en place. Pour intégrer le logo définitif :

1. Déposez `logo.svg` (fonds clairs) et `logo-white.svg` (fonds sombres) dans `public/brand/`.
2. Dans `src/components/brand/Logo.tsx`, passez `USE_BRAND_FILE` à `true`.
3. Remplacez `src/app/icon.svg` (favicon) par la version carrée du logo.
4. Ajustez si besoin `--color-brand-*` et `--color-accent-*` dans `globals.css`.

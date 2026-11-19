<?php
/**
 * Composition du hero : portable, cylindre de base de données, circuits et tableau de bord
 * (formes reprises du logo), entourés des trois niveaux de l'offre.
 */
defined('DTA') || exit;
?>
<div class="hero-visuel" aria-label="Notre offre en un coup d’œil">
  <svg class="hero-svg" viewBox="0 0 520 420" role="img" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="hv-halo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--bleu)" stop-opacity=".18"/>
        <stop offset="1" stop-color="var(--bleu)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <circle cx="300" cy="180" r="190" fill="url(#hv-halo)"/>
    <!-- Portable -->
    <rect x="70" y="58" width="380" height="250" rx="18" class="v-cadre"/>
    <rect x="88" y="76" width="344" height="214" rx="10" class="v-ecran"/>
    <rect x="40" y="316" width="440" height="16" rx="8" class="v-socle"/>
    <rect x="222" y="316" width="76" height="6" rx="3" class="v-encoche"/>
    <!-- Tableau de bord -->
    <rect x="106" y="94" width="130" height="80" rx="8" class="v-tuile"/>
    <path d="M118 158 L140 140 L160 148 L184 122 L206 130 L224 108" class="v-courbe"/>
    <circle cx="224" cy="108" r="4" class="v-noeud"/>
    <rect x="106" y="186" width="130" height="88" rx="8" class="v-tuile"/>
    <rect x="122" y="236" width="14" height="26" rx="3" class="v-barre"/>
    <rect x="144" y="220" width="14" height="42" rx="3" class="v-barre"/>
    <rect x="166" y="228" width="14" height="34" rx="3" class="v-barre"/>
    <rect x="188" y="204" width="14" height="58" rx="3" class="v-barre v-barre-accent"/>
    <rect x="210" y="214" width="14" height="48" rx="3" class="v-barre"/>
    <!-- Base de données et circuits (inspirés du logo) -->
    <g class="v-base">
      <path d="M326 118 v116 c0 13 22 24 50 24 s50-11 50-24 V118" class="v-cylindre"/>
      <ellipse cx="376" cy="118" rx="50" ry="22" class="v-cylindre-haut"/>
      <path d="M326 158 c0 13 22 24 50 24 s50-11 50-24" class="v-ligne-cyl"/>
      <path d="M326 198 c0 13 22 24 50 24 s50-11 50-24" class="v-ligne-cyl"/>
    </g>
    <path d="M250 140 H290 L306 156" class="v-circuit"/>
    <path d="M250 182 H316" class="v-circuit"/>
    <path d="M250 224 H290 L306 208" class="v-circuit"/>
    <circle cx="306" cy="156" r="6" class="v-noeud v-pulse"/>
    <circle cx="316" cy="182" r="6" class="v-noeud v-pulse v-pulse-2"/>
    <circle cx="306" cy="208" r="6" class="v-noeud v-pulse v-pulse-3"/>
  </svg>

  <ul class="hero-offres">
    <li class="hero-offre hero-offre-1">
      <span class="hero-offre-icone"><?= icone('etincelle') ?></span>
      <span><strong>Masterclass gratuites</strong><small>Pour découvrir, sans engagement</small></span>
    </li>
    <li class="hero-offre hero-offre-2">
      <span class="hero-offre-icone"><?= icone('horloge') ?></span>
      <span><strong>Parcours de 1 jour à 1 mois</strong><small>IA générative, agents IA, Data Starter</small></span>
    </li>
    <li class="hero-offre hero-offre-3">
      <span class="hero-offre-icone"><?= icone('diplome') ?></span>
      <span><strong>Parcours professionnels</strong><small>De 6 à 12 mois · certifiants</small></span>
    </li>
  </ul>
</div>

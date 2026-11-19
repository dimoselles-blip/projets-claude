<?php
defined('DTA') || exit;
$meta ??= [];
$u = utilisateur();
$chemin = Routeur::chemin_courant();
$aValider = (int) DB::valeur("SELECT COUNT(*) FROM inscriptions WHERE statut IN ('en_attente', 'partielle', 'payee')");
$demandes = (int) DB::valeur('SELECT COUNT(*) FROM demandes WHERE traitee = 0');
$menu = [
    ['Pilotage', [
        ['/admin', 'Tableau de bord', 'tableau-bord', null],
        ['/admin/inscriptions', 'Inscriptions', 'utilisateurs', $aValider],
        ['/admin/demandes', 'Demandes', 'mail', $demandes],
        ['/admin/apprenants', 'Apprenants et équipe', 'utilisateur', null],
    ]],
    ['Catalogue', [
        ['/admin/formations', 'Formations', 'diplome', null],
        ['/admin/sessions', 'Sessions', 'calendrier', null],
        ['/admin/formateurs', 'Formateurs', 'mentor', null],
        ['/admin/temoignages', 'Témoignages', 'etoile', null],
        ['/admin/indicateurs', 'Compteurs', 'graphique', null],
        ['/admin/faq', 'FAQ', 'question', null],
        ['/admin/categories', 'Catégories', 'couches', null],
    ]],
    ['Plateforme', [
        ['/admin/reglages', 'Réglages', 'reglages', null],
        ['/admin/contenu', 'Fichier de contenu', 'fichier', null],
    ]],
];
$actif = function (string $href) use ($chemin): bool {
    return $href === '/admin' ? $chemin === '/admin' : str_starts_with($chemin, $href);
};
?><!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= e(($meta['titre'] ?? 'Administration') . ' — Administration DIMO Tech Academy') ?></title>
<link rel="icon" href="<?= e(url('/favicon.ico')) ?>">
<link rel="stylesheet" href="<?= e(asset('css/app.css')) ?>">
<link rel="stylesheet" href="<?= e(asset('css/admin.css')) ?>">
</head>
<body class="admin">
<a class="lien-evitement" href="#contenu">Aller au contenu</a>
<input type="checkbox" id="admin-menu" class="sr">
<header class="admin-haut">
  <label for="admin-menu" class="burger" aria-label="Menu"><?= icone('menu') ?></label>
  <a class="marque" href="<?= e(url('/admin')) ?>"><img src="<?= e(asset('img/logo-160.png')) ?>" alt="DIMO Tech Academy" width="183" height="160"></a>
  <span class="admin-titre">Administration</span>
  <a class="btn btn-fantome btn-petit admin-voir" href="<?= e(url('/')) ?>" target="_blank" rel="noopener"><?= icone('externe') ?>Voir le site</a>
</header>
<nav class="admin-nav" aria-label="Administration">
  <?php foreach ($menu as [$groupe, $liens]): ?>
    <p class="admin-nav-groupe"><?= e($groupe) ?></p>
    <ul>
      <?php foreach ($liens as [$href, $libelle, $ico, $compte]): ?>
        <li><a href="<?= e(url($href)) ?>"<?= $actif($href) ? ' aria-current="page"' : '' ?>><?= icone($ico) ?><span><?= e($libelle) ?></span><?= $compte ? '<em>' . (int) $compte . '</em>' : '' ?></a></li>
      <?php endforeach; ?>
    </ul>
  <?php endforeach; ?>
  <div class="admin-nav-bas">
    <p class="muted"><?= e($u['nom'] ?? '') ?></p>
    <form method="post" action="<?= e(url('/espace/deconnexion')) ?>"><?= champ_csrf() ?><button class="btn btn-fantome btn-petit btn-bloc" type="submit"><?= icone('deconnexion') ?>Déconnexion</button></form>
  </div>
</nav>
<main id="contenu" class="admin-contenu" tabindex="-1">
  <?= partiel('flash') ?>
  <?= $contenu ?>
</main>
<script src="<?= e(asset('js/app.js')) ?>" defer></script>
</body>
</html>

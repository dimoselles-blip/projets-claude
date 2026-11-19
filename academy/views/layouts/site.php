<?php
defined('DTA') || exit;
$meta ??= [];
$page ??= '';
$titre = $meta['titre'] ?? 'DIMO Tech Academy — La Data et l’IA à votre portée';
$description = $meta['description'] ?? 'DIMO Tech Academy, première académie hybride Data & IA du Bénin : masterclass gratuites, parcours Data, IA et Tech, certificats et accompagnement vers l’emploi.';
$canonique = $meta['canonique'] ?? url_absolue(Routeur::chemin_courant());
$image = $meta['image'] ?? url_absolue('/assets/img/og.png');
$jsonld = $meta['jsonld'] ?? null;
$nettoyer = function ($v) use (&$nettoyer) {
    if (!is_array($v)) {
        return $v;
    }
    $v = array_map($nettoyer, $v);
    return array_filter($v, fn($x) => $x !== null && $x !== [] && $x !== '');
};
$ga = (string) cfg('statistiques.ga4', '');
?><!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= e($titre) ?></title>
<meta name="description" content="<?= e($description) ?>">
<?php if (!empty($meta['robots'])): ?><meta name="robots" content="<?= e($meta['robots']) ?>">
<?php endif; ?>
<link rel="canonical" href="<?= e($canonique) ?>">
<meta property="og:site_name" content="DIMO Tech Academy">
<meta property="og:locale" content="fr_FR">
<meta property="og:type" content="<?= e($meta['type'] ?? 'website') ?>">
<meta property="og:title" content="<?= e($titre) ?>">
<meta property="og:description" content="<?= e($description) ?>">
<meta property="og:url" content="<?= e($canonique) ?>">
<meta property="og:image" content="<?= e($image) ?>">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E1322" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="<?= e(url('/favicon.ico')) ?>" sizes="48x48">
<link rel="icon" href="<?= e(asset('img/icon-192.png')) ?>" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="<?= e(asset('img/icon-180.png')) ?>">
<link rel="preload" href="<?= e(url('/assets/fonts/sora.woff2')) ?>" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="<?= e(url('/assets/fonts/inter.woff2')) ?>" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="<?= e(asset('css/app.css')) ?>">
<?php if ($jsonld): ?>
<script type="application/ld+json"><?= json_encode($nettoyer($jsonld), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script>
<?php endif; ?>
</head>
<body class="page-<?= e($page) ?><?= !empty($corps) ? ' ' . e($corps) : '' ?>">
<a class="lien-evitement" href="#contenu">Aller au contenu</a>
<?= partiel('entete', ['page' => $page]) ?>
<main id="contenu" tabindex="-1">
<?= partiel('flash') ?>
<?= $contenu ?>
</main>
<?= partiel('pied') ?>
<?= partiel('whatsapp-flottant') ?>
<?= partiel('modale-inscription') ?>
<?php if ($ga !== ''): ?><?= partiel('consentement', ['ga' => $ga]) ?><?php endif; ?>
<script src="<?= e(asset('js/app.js')) ?>" defer></script>
</body>
</html>

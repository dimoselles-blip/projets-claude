<?php
defined('DTA') || exit;
$liens = [
    'formations' => ['/formations', 'Formations'],
    'masterclass' => ['/masterclass', 'Masterclass'],
    'entreprises' => ['/entreprises', 'Entreprises'],
    'sessions' => ['/sessions', 'Sessions'],
    'espace' => ['/espace', 'Espace apprenant'],
    'faq' => ['/faq', 'FAQ'],
];
$u = utilisateur();
?>
<header class="entete" data-entete>
  <div class="entete-inner conteneur">
    <a class="marque" href="<?= e(url('/')) ?>" aria-label="DIMO Tech Academy — accueil">
      <picture>
        <source srcset="<?= e(asset('img/logo-160.webp')) ?>" type="image/webp">
        <img src="<?= e(asset('img/logo-160.png')) ?>" alt="DIMO Tech Academy" width="183" height="160">
      </picture>
    </a>
    <nav class="nav-principale" aria-label="Navigation principale">
      <ul>
        <?php foreach ($liens as $cle => [$href, $libelle]): ?>
          <li><a href="<?= e(url($href)) ?>"<?= $page === $cle ? ' aria-current="page"' : '' ?>><?= e($cle === 'espace' && $u ? 'Mon espace' : $libelle) ?></a></li>
        <?php endforeach; ?>
      </ul>
    </nav>
    <div class="entete-actions">
      <a class="btn btn-corail btn-entete" href="<?= e(url('/inscription')) ?>" data-inscription="">Je m’inscris</a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="menu-mobile" data-menu-ouvrir>
        <?= icone('menu') ?><span class="sr">Ouvrir le menu</span>
      </button>
    </div>
  </div>
</header>
<div class="menu-mobile" id="menu-mobile" hidden data-menu role="dialog" aria-modal="true" aria-label="Menu">
    <div class="menu-mobile-haut conteneur">
      <a class="marque" href="<?= e(url('/')) ?>" aria-label="DIMO Tech Academy — accueil">
        <img src="<?= e(asset('img/logo-160.png')) ?>" alt="DIMO Tech Academy" width="183" height="160">
      </a>
      <button class="burger" type="button" data-menu-fermer><?= icone('fermer') ?><span class="sr">Fermer le menu</span></button>
    </div>
    <nav class="menu-mobile-liens conteneur" aria-label="Menu">
      <ul>
        <li><a href="<?= e(url('/')) ?>"<?= $page === 'accueil' ? ' aria-current="page"' : '' ?>>Accueil<?= icone('fleche') ?></a></li>
        <?php foreach ($liens as $cle => [$href, $libelle]): ?>
          <li><a href="<?= e(url($href)) ?>"<?= $page === $cle ? ' aria-current="page"' : '' ?>><?= e($cle === 'espace' && $u ? 'Mon espace' : $libelle) ?><?= icone('fleche') ?></a></li>
        <?php endforeach; ?>
      </ul>
      <div class="menu-mobile-cta">
        <a class="btn btn-corail btn-large btn-maj" href="<?= e(url('/inscription')) ?>" data-inscription="">Je m’inscris</a>
        <a class="btn btn-contour btn-large btn-maj" href="<?= e(url('/#trouver')) ?>">Je choisis ma formation</a>
      </div>
    </nav>
  </div>


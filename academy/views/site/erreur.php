<?php defined('DTA') || exit; $code ??= 404; ?>
<section class="contenu-page">
  <div class="conteneur conteneur-etroit centre">
    <p class="surtitre">Erreur <?= (int) $code ?></p>
    <h1><?= e($titre ?? 'Page introuvable') ?></h1>
    <p class="muted"><?= $code === 404 ? 'Cette page n’existe pas ou a été déplacée.' : ($code === 403 ? 'Cette page est réservée.' : 'Merci de réessayer dans quelques instants.') ?></p>
    <p class="installation-actions" style="justify-content:center">
      <a class="btn btn-corail" href="<?= e(url('/formations')) ?>">Voir les formations</a>
      <a class="btn btn-contour" href="<?= e(url('/')) ?>">Retour à l’accueil</a>
    </p>
  </div>
</section>

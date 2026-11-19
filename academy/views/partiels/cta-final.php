<?php defined('DTA') || exit; ?>
<section class="cta-final" aria-labelledby="cta-final-titre">
  <div class="conteneur cta-final-inner" data-reveler>
    <div>
      <p class="surtitre surtitre-clair">La Data et l’IA à votre portée…</p>
      <h2 id="cta-final-titre"><?= e($titre ?? 'Prêt(e) à passer à l’action ?') ?></h2>
      <p><?= e($texte ?? 'Commencez par une masterclass gratuite ou lancez-vous dans un parcours certifiant.') ?></p>
    </div>
    <div class="cta-final-boutons">
      <a class="btn btn-corail btn-large btn-maj" href="<?= e(url('/inscription')) ?>" data-inscription="">Je m’inscris</a>
      <a class="btn btn-blanc btn-large btn-maj" href="<?= e(url('/#trouver')) ?>">Je choisis ma formation</a>
    </div>
  </div>
</section>

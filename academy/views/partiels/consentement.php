<?php defined('DTA') || exit; ?>
<div class="consentement" data-consentement data-ga="<?= e($ga) ?>" hidden role="region" aria-label="Statistiques de visite">
  <p>Nous aimerions mesurer l’audience du site avec Google Analytics (cookies). Vous pouvez refuser sans conséquence. <a href="<?= e(url('/confidentialite')) ?>">En savoir plus</a></p>
  <div>
    <button type="button" class="btn btn-fantome btn-petit" data-consentement-choix="non">Refuser</button>
    <button type="button" class="btn btn-bleu btn-petit" data-consentement-choix="oui">Accepter</button>
  </div>
</div>

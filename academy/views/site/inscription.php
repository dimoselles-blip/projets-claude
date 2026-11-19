<?php defined('DTA') || exit; ?>
<section class="contenu-page">
  <div class="conteneur conteneur-etroit">
    <ol class="fil"><li><a href="<?= e(url('/')) ?>">Accueil</a></li><?php if ($formation): ?><li><a href="<?= e($formation['url']) ?>"><?= e($formation['titre']) ?></a></li><?php endif; ?><li aria-current="page">Inscription</li></ol>
    <div class="suivi">
      <ol class="etapes" aria-label="Étapes de l’inscription">
        <li class="faite">Choix</li><li class="actuelle" aria-current="step">Inscription</li><li>Paiement</li><li>Accès</li>
      </ol>
      <div class="carte">
        <p class="surtitre">Inscription</p>
        <h1 style="font-size:clamp(1.6rem,1.2rem + 1.6vw,2.2rem)"><?= e($formation['titre'] ?? 'Je m’inscris') ?></h1>
        <?php if ($formation): ?>
          <p class="muted"><?= e($formation['duree_affichee']) ?> · <?= e($formation['format_affiche']) ?> · <?= e($formation['certification_label']) ?></p>
        <?php else: ?>
          <p class="muted">Choisissez votre formation : le prix s’affiche avant validation.</p>
        <?php endif; ?>
        <?= partiel('formulaire-inscription', ['formation' => $formation, 'sessions' => $sessions, 'sessionChoisie' => $sessionChoisie, 'prefixe' => 'page']) ?>
      </div>
      <p class="muted centre" style="font-size:.9rem"><?= icone('cadenas') ?> Vos informations servent uniquement à traiter votre inscription.</p>
    </div>
  </div>
</section>

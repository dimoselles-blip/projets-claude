<?php
/** Emplacement prêt pour une vraie photo, marqué « à remplacer » tant qu'elle n'existe pas. */
defined('DTA') || exit;
if (!afficher_emplacements()) {
    return;
}
$texte ??= 'Photo';
$ratio ??= '4 / 3';
$classe ??= '';
?>
<figure class="emplacement <?= e($classe) ?>" style="aspect-ratio: <?= e($ratio) ?>">
  <?= icone('image') ?>
  <figcaption><strong>À remplacer</strong><span><?= e($texte) ?></span></figcaption>
</figure>

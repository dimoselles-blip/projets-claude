<?php
/** Cartes de témoignages ; emplacements « à remplacer » tant qu'aucun vrai témoignage n'est publié. */
defined('DTA') || exit;
$temoignages ??= [];
if (!$temoignages && !afficher_emplacements()) {
    return;
}
?>
<div class="grille-temoignages">
  <?php if ($temoignages): ?>
    <?php foreach ($temoignages as $t): ?>
      <figure class="carte temoignage" data-reveler>
        <blockquote><p><?= e($t['texte']) ?></p></blockquote>
        <figcaption>
          <?php if ($t['photo']): ?>
            <img src="<?= e(media($t['photo'])) ?>" alt="" width="56" height="56" loading="lazy">
          <?php else: ?>
            <span class="initiales" aria-hidden="true"><?= e(mb_strtoupper(mb_substr($t['nom'], 0, 1) . (mb_substr(strstr($t['nom'], ' ') ?: '', 1, 1)))) ?></span>
          <?php endif; ?>
          <span><strong><?= e($t['nom']) ?></strong><?php if ($t['formation']): ?><small><?= e($t['formation']) ?></small><?php endif; ?></span>
        </figcaption>
      </figure>
    <?php endforeach; ?>
  <?php else: ?>
    <?php for ($i = 1; $i <= 3; $i++): ?>
      <figure class="carte temoignage temoignage-emplacement" data-reveler>
        <p class="emplacement-etiquette">À remplacer</p>
        <blockquote><p>Témoignage d’un(e) apprenant(e) : ce qu’il ou elle a appris, réalisé et obtenu après la formation.</p></blockquote>
        <figcaption>
          <span class="initiales initiales-vide" aria-hidden="true"><?= icone('utilisateur') ?></span>
          <span><strong>Photo, prénom et nom</strong><small>Formation suivie</small></span>
        </figcaption>
      </figure>
    <?php endfor; ?>
  <?php endif; ?>
</div>

<?php
/** Carte formation : durée, prix, format, certificat, « En savoir plus » et « S'inscrire ». */
defined('DTA') || exit;
/** @var array $f */
$titreNiveau ??= 'h3';
$icones = ['masterclass' => 'etincelle', 'data' => 'base', 'ia' => 'robot', 'tech' => 'puce'];
?>
<article class="carte carte-formation" data-reveler>
  <div class="carte-haut">
    <span class="carte-icone"><?= icone($icones[$f['categorie_slug']] ?? 'diplome') ?></span>
    <?php if ($f['badge']): ?><span class="badge badge-<?= $f['badge'] === 'GRATUIT' ? 'gratuit' : 'certifiant' ?>"><?= e($f['badge']) ?></span><?php endif; ?>
  </div>
  <<?= $titreNiveau ?> class="carte-titre"><a href="<?= e($f['url']) ?>"><?= e($f['titre']) ?></a></<?= $titreNiveau ?>>
  <?php if (!empty($f['accroche'])): ?><p class="carte-texte"><?= e(tronquer($f['accroche'], 130)) ?></p><?php endif; ?>
  <ul class="carte-infos">
    <li><?= icone('horloge') ?><span><span class="sr">Durée : </span><?= e($f['duree_affichee'] ?: '—') ?></span></li>
    <li><?= icone('lieu') ?><span><span class="sr">Format : </span><?= e($f['format_court']) ?></span></li>
    <li><?= icone('certificat') ?><span><?= e($f['certification_label']) ?></span></li>
    <li><?= icone('niveau') ?><span><span class="sr">Niveau : </span><?= e($f['niveau']) ?></span></li>
  </ul>
  <div class="carte-prix">
    <strong><?= $f['prix_detail'] ? 'Dès ' . e(prix($f['prix_min'])) : e($f['prix_affiche']) ?></strong>
    <?php if ($f['prix_detail']): ?><small><?= e($f['prix_detail']) ?></small><?php endif; ?>
    <?php if ($f['mention_prix']): ?><small><?= e(ucfirst($f['mention_prix'])) ?></small><?php endif; ?>
  </div>
  <div class="carte-actions">
    <a class="btn btn-contour" href="<?= e($f['url']) ?>">En savoir plus<span class="sr"> sur <?= e($f['titre']) ?></span></a>
    <a class="btn btn-corail" href="<?= e(url('/inscription', ['formation' => $f['slug']])) ?>" data-inscription="<?= e($f['slug']) ?>"><?= $f['gratuite'] ? 'Réserver' : 'S’inscrire' ?><span class="sr"> à <?= e($f['titre']) ?></span></a>
  </div>
</article>

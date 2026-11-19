<?php
/** Session du calendrier : date, formation, durée, format, places, prix, inscription. */
defined('DTA') || exit;
/** @var array $s */
$t = strtotime($s['date_debut']);
$prixSession = (int) $s['prix'] === 0 && ($s['prix_en_ligne'] === null || (int) $s['prix_en_ligne'] === 0)
    ? 'Gratuit'
    : ($s['format'] === 'en_ligne' && $s['prix_en_ligne'] !== null ? prix((int) $s['prix_en_ligne']) : prix((int) $s['prix']));
?>
<article class="session<?= $s['ouverte'] ? ' session-ouverte' : '' ?>" data-reveler>
  <div class="session-date" aria-hidden="true">
    <span class="session-jour"><?= date('j', $t) ?></span>
    <span class="session-mois"><?= e(MOIS_COURTS_FR[(int) date('n', $t) - 1]) ?></span>
    <span class="session-annee"><?= date('Y', $t) ?></span>
  </div>
  <div class="session-infos">
    <p class="session-etat">
      <?php if ($s['ouverte']): ?><span class="pastille pastille-ok">Inscriptions ouvertes</span>
      <?php elseif ($s['complete']): ?><span class="pastille pastille-ko">Complet</span>
      <?php else: ?><span class="pastille">Inscriptions bientôt ouvertes</span><?php endif; ?>
      <span class="session-categorie"><?= e($s['categorie_nom']) ?></span>
    </p>
    <h3 class="session-titre"><a href="<?= e(url('/formations/' . $s['formation_slug'])) ?>"><?= e($s['formation_titre']) ?></a></h3>
    <?php if ($s['intitule']): ?><p class="session-intitule"><?= e($s['intitule']) ?></p><?php endif; ?>
    <ul class="session-meta">
      <li><?= icone('calendrier') ?><time datetime="<?= e($s['date_debut']) ?>"><?= e(date_fr($s['date_debut'], true)) ?></time><?= $s['heure_debut'] ? ' · ' . e(heure_fr($s['heure_debut'])) : '' ?></li>
      <?php if ($s['duree_label']): ?><li><?= icone('horloge') ?><?= e($s['duree_label']) ?><?= $s['horaires'] ? ' · ' . e($s['horaires']) : '' ?></li><?php endif; ?>
      <li><?= icone('lieu') ?><?= e($s['format_label']) ?><?= $s['format'] !== 'en_ligne' && $s['lieu'] ? ' · ' . e($s['lieu']) : '' ?></li>
      <?php if ($s['places_restantes'] !== null): ?><li><?= icone('utilisateurs') ?><strong><?= e(pluriel($s['places_restantes'], 'place restante', 'places restantes')) ?></strong></li><?php endif; ?>
    </ul>
    <?php if ($s['note']): ?><p class="session-note"><?= e($s['note']) ?></p><?php endif; ?>
  </div>
  <div class="session-action">
    <strong class="session-prix"><?= e($prixSession) ?></strong>
    <?php if ($s['ouverte']): ?>
      <a class="btn btn-corail" href="<?= e(url('/inscription', ['formation' => $s['formation_slug'], 'session' => $s['id']])) ?>" data-inscription="<?= e($s['formation_slug']) ?>" data-session="<?= (int) $s['id'] ?>">S’inscrire<span class="sr"> à la session du <?= e(date_fr($s['date_debut'])) ?></span></a>
    <?php else: ?>
      <a class="btn btn-contour" href="<?= e(url('/formations/' . $s['formation_slug'])) ?>">Voir la formation</a>
    <?php endif; ?>
  </div>
</article>

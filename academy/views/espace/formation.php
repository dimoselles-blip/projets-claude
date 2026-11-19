<?php
defined('DTA') || exit;
$delai = (int) reglage('delai_lien_visio');
$iconesType = ['video' => 'video', 'direct' => 'direct', 'document' => 'fichier', 'lien' => 'lien'];

$rendreLecon = function (array $l) use ($progression, $iconesType): string {
    ob_start();
    $video = video_integrable($l['video_url']);
    $yt = youtube_id($l['video_url']);
    $fait = in_array((int) $l['id'], $progression['ids'], true);
    ?>
    <li class="lecon" id="lecon-<?= (int) $l['id'] ?>">
      <div class="lecon-haut">
        <span class="lecon-titre"><?= icone($l['type'] === 'direct' && $l['video_url'] ? 'lecture' : ($iconesType[$l['type']] ?? 'point')) ?>
          <span><?= e($l['titre']) ?>
            <small><?= $l['type'] === 'direct' ? 'Replay de la séance du ' . e(date_fr($l['date_direct'])) : e(['video' => 'Vidéo', 'document' => 'Support à télécharger', 'lien' => 'Ressource en ligne'][$l['type']] ?? '') ?><?= $l['duree_min'] ? ' · ' . (int) $l['duree_min'] . ' min' : '' ?></small>
          </span>
        </span>
      </div>
      <?php if ($l['description']): ?><p><?= nl2br(e($l['description'])) ?></p><?php endif; ?>
      <?php if ($video): ?>
        <div class="video">
          <button class="video-lancer" type="button" data-video="<?= e($video) ?>" data-titre="<?= e($l['titre']) ?>"<?= $yt ? ' style="background-image:url(\'https://i.ytimg.com/vi/' . e($yt) . '/hqdefault.jpg\')"' : '' ?>><span><?= icone('lecture') ?>Lire la vidéo</span></button>
        </div>
      <?php endif; ?>
      <div class="lecon-actions">
        <?php if ($l['fichier']): ?>
          <a class="btn btn-fantome btn-petit" href="<?= e(url('/espace/fichiers/' . $l['id'])) ?>"><?= icone('telecharger') ?>Télécharger<?= $l['fichier_taille'] ? ' (' . e(taille_lisible((int) $l['fichier_taille'])) . ')' : '' ?></a>
        <?php endif; ?>
        <?php if ($l['lien_externe']): ?>
          <a class="btn btn-fantome btn-petit" href="<?= e($l['lien_externe']) ?>" target="_blank" rel="noopener"><?= icone('externe') ?>Ouvrir</a>
        <?php endif; ?>
        <?php if ($l['video_url'] && !$video): ?>
          <a class="btn btn-fantome btn-petit" href="<?= e($l['video_url']) ?>" target="_blank" rel="noopener"><?= icone('lecture') ?>Voir la vidéo</a>
        <?php endif; ?>
        <button class="case-terminee" type="button" aria-pressed="<?= $fait ? 'true' : 'false' ?>" data-terminer="<?= e(url('/espace/lecons/' . $l['id'] . '/terminee')) ?>"><?= icone('valide') ?><span><?= $fait ? 'Terminé' : 'Marquer comme terminé' ?></span></button>
      </div>
    </li>
    <?php
    return (string) ob_get_clean();
};
?>
<section class="entete-page" style="padding-bottom:28px">
  <div class="conteneur">
    <ol class="fil"><li><a href="<?= e(url('/espace')) ?>">Mon espace</a></li><li aria-current="page"><?= e($f['titre']) ?></li></ol>
    <h1 style="font-size:clamp(1.6rem,1.2rem + 1.8vw,2.4rem)"><?= e($f['titre']) ?></h1>
    <?php if ($acces && $progression['total'] > 0): ?>
      <div data-progression style="max-width:520px">
        <div class="progression-texte"><span data-progression-texte><?= $progression['faites'] ?> / <?= $progression['total'] ?> contenus terminés</span><span data-progression-pourcentage><?= $progression['pourcentage'] ?> %</span></div>
        <div class="jauge"><span style="width:<?= $progression['pourcentage'] ?>%"></span></div>
      </div>
    <?php endif; ?>
  </div>
</section>

<div class="conteneur" style="padding:28px 20px 72px">
  <?php if (!$acces): ?>
    <div class="carte verrou">
      <span class="carte-icone"><?= icone('cadenas') ?></span>
      <h2 style="font-size:1.3rem">Contenus bientôt accessibles</h2>
      <p class="muted">Vos contenus s’ouvrent dès validation de votre paiement par notre équipe.<?= $ins ? ' Reste à payer : ' . e(prix(reste_a_payer($ins))) . '.' : '' ?></p>
      <?php if ($ins): ?><a class="btn btn-corail" href="<?= e(url('/inscription/suivi/' . $ins['jeton_suivi'])) ?>">Finaliser mon paiement</a><?php endif; ?>
    </div>
  <?php else: ?>
    <?php if ($directs): ?>
      <section aria-labelledby="t-directs" style="margin-bottom:32px">
        <h2 id="t-directs" style="font-size:1.3rem">Séances en direct</h2>
        <ul class="lecons" style="border-top:1px solid var(--ligne);border-radius:var(--rayon-moyen)">
          <?php foreach ($directs as $d): ?>
            <li class="lecon">
              <div class="lecon-haut">
                <span class="lecon-titre"><?= icone('direct') ?><span><?= e($d['titre']) ?><small><?= e(date_heure_fr($d['date_direct'])) ?><?= $d['duree_min'] ? ' · ' . (int) $d['duree_min'] . ' min' : '' ?></small></span></span>
                <?php if ($d['lien_visible'] && $d['lien_visio']): ?>
                  <a class="btn btn-bleu btn-petit" href="<?= e($d['lien_visio']) ?>" target="_blank" rel="noopener"><?= icone('video') ?>Rejoindre</a>
                <?php elseif (strtotime((string) $d['date_direct']) > time()): ?>
                  <span class="pastille">Lien visible <?= (int) $delai ?> h avant</span>
                <?php else: ?>
                  <span class="pastille">Replay bientôt disponible</span>
                <?php endif; ?>
              </div>
              <?php if ($d['description']): ?><p><?= nl2br(e($d['description'])) ?></p><?php endif; ?>
            </li>
          <?php endforeach; ?>
        </ul>
      </section>
    <?php endif; ?>

    <section aria-labelledby="t-contenus">
      <h2 id="t-contenus" style="font-size:1.3rem">Replays, vidéos et supports</h2>
      <?php if (!$parModule && !$sansModule): ?>
        <div class="vide"><p>Les contenus de cette formation seront publiés ici au fil des séances. Vous serez prévenu(e) par e-mail et dans votre espace.</p></div>
      <?php endif; ?>
      <?php $premier = true; foreach ($parModule as $g): $m = $g['module']; ?>
        <details class="module-contenu"<?= $premier ? ' open' : '' ?>>
          <summary><span class="module-code"><?= e($m['code'] ?: 'M') ?></span><strong><?= e($m['titre']) ?></strong><span class="muted" style="font-size:.85rem"><?= pluriel(count($g['lecons']), 'contenu') ?></span><?= icone('chevron', 'ico accordeon-chevron') ?></summary>
          <ul class="lecons"><?php foreach ($g['lecons'] as $l): ?><?= $rendreLecon($l) ?><?php endforeach; ?></ul>
        </details>
      <?php $premier = false; endforeach; ?>
      <?php if ($sansModule): ?>
        <details class="module-contenu"<?= !$parModule ? ' open' : '' ?>>
          <summary><span class="module-code"><?= icone('fichier') ?></span><strong>Ressources de la formation</strong><span class="muted" style="font-size:.85rem"><?= pluriel(count($sansModule), 'contenu') ?></span><?= icone('chevron', 'ico accordeon-chevron') ?></summary>
          <ul class="lecons"><?php foreach ($sansModule as $l): ?><?= $rendreLecon($l) ?><?php endforeach; ?></ul>
        </details>
      <?php endif; ?>
      <?php if ($modulesVides): ?>
        <p class="muted" style="font-size:.9rem;margin-top:18px">À venir : <?= e(implode(' · ', array_map(fn($g) => ($g['module']['code'] ? $g['module']['code'] . ' ' : '') . $g['module']['titre'], $modulesVides))) ?></p>
      <?php endif; ?>
    </section>
  <?php endif; ?>
</div>

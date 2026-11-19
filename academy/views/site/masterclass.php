<?php defined('DTA') || exit; ?>
<section class="entete-page">
  <div class="conteneur">
    <ol class="fil"><li><a href="<?= e(url('/')) ?>">Accueil</a></li><li aria-current="page">Masterclass</li></ol>
    <span class="badge badge-gratuit" style="margin-bottom:14px">GRATUIT</span>
    <h1>Masterclass gratuites</h1>
    <p class="intro">Des sessions courtes pour découvrir les nouvelles technologies et apprendre gratuitement. Réservez votre place, puis revenez découvrir les prochaines dates et les replays.</p>
  </div>
</section>

<section class="contenu-page">
  <div class="conteneur">
    <div class="section-entete section-entete-gauche">
      <h2>Prochaines masterclass</h2>
    </div>
    <?php if ($sessions): ?>
      <div class="liste-sessions"><?php foreach ($sessions as $s): ?><?= partiel('carte-session', ['s' => $s]) ?><?php endforeach; ?></div>
    <?php else: ?>
      <?= partiel('liste-attente', ['retour' => '/masterclass', 'titre' => 'Prochaines dates à venir', 'texte' => 'Réservez dès maintenant la masterclass qui vous intéresse ci-dessous, ou laissez vos coordonnées : nous vous prévenons à chaque nouvelle date.']) ?>
    <?php endif; ?>

    <div class="section-entete section-entete-gauche" style="margin-top:56px">
      <h2>Nos masterclass</h2>
      <p>Toutes accessibles aux débutants.</p>
    </div>
    <div class="grille-cartes" data-n="<?= count($formations) ?>">
      <?php foreach ($formations as $f): ?><?= partiel('carte-formation', ['f' => $f]) ?><?php endforeach; ?>
    </div>

    <div class="section-entete section-entete-gauche" style="margin-top:56px">
      <h2>Replays</h2>
      <p>Vous avez manqué une session ? Les replays publiés sont ici.</p>
    </div>
    <?php if ($replays): ?>
      <div class="grille-cartes">
        <?php foreach ($replays as $r): $video = video_integrable($r['replay_url']); ?>
          <article class="carte" data-reveler>
            <?php if ($video): ?>
              <div class="video" style="margin:0 0 14px">
                <button class="video-lancer" type="button" data-video="<?= e($video) ?>" data-titre="<?= e($r['formation_titre']) ?>"<?= ($yt = youtube_id($r['replay_url'])) ? ' style="background-image:url(\'https://i.ytimg.com/vi/' . e($yt) . '/hqdefault.jpg\')"' : '' ?>><span><?= icone('lecture') ?>Regarder le replay</span></button>
              </div>
            <?php endif; ?>
            <h3><?= e($r['titre_affiche']) ?></h3>
            <p class="muted" style="margin:0">Session du <?= e(date_fr($r['date_debut'])) ?></p>
            <?php if (!$video): ?><p style="margin:.6em 0 0"><a class="lien-fleche" href="<?= e($r['replay_url']) ?>" target="_blank" rel="noopener">Voir le replay <?= icone('externe') ?></a></p><?php endif; ?>
          </article>
        <?php endforeach; ?>
      </div>
    <?php else: ?>
      <div class="vide"><p>Les premiers replays seront publiés ici après les prochaines sessions.</p></div>
    <?php endif; ?>
  </div>
</section>
<?= partiel('cta-final', ['titre' => 'Envie d’aller plus loin ?', 'texte' => 'Après une masterclass, poursuivez avec un parcours Data, IA ou Tech certifiant.']) ?>

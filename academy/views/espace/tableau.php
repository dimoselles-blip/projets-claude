<?php
defined('DTA') || exit;
$prenom = explode(' ', trim($u['nom']))[0];
$delai = (int) reglage('delai_lien_visio');
$actives = array_filter($inscriptions, fn($i) => $i['statut'] !== 'annulee');
?>
<div class="conteneur espace-grille">
  <div>
    <div class="bienvenue">
      <h1>Bonjour <?= e($prenom) ?> !</h1>
      <p><?= $actives ? 'Voici où vous en êtes.' : 'Bienvenue dans votre espace apprenant.' ?></p>
    </div>

    <?php if ($directs): $d = $directs[0]; ?>
      <section class="carte carte-direct" aria-labelledby="t-direct" style="margin-bottom:22px">
        <p class="surtitre surtitre-clair"><?= icone('direct') ?> Prochain rendez-vous</p>
        <h2 id="t-direct" style="font-size:1.35rem;margin-bottom:4px"><?= e($d['titre']) ?></h2>
        <p style="margin:0"><?= e($d['formation']) ?> · <?= e(date_heure_fr($d['debut'])) ?></p>
        <?php if ($d['lieu']): ?>
          <p style="margin:.4em 0 0"><?= icone('lieu') ?> <?= e($d['lieu']) ?></p>
        <?php elseif ($d['lien']): ?>
          <a class="btn btn-blanc" href="<?= e($d['lien']) ?>" target="_blank" rel="noopener"><?= icone('video') ?>Rejoindre la séance en direct</a>
        <?php else: ?>
          <p style="margin:.6em 0 0"><small>Le lien de connexion apparaîtra ici <?= (int) $delai ?> h avant le début.</small></p>
        <?php endif; ?>
        <?php if (count($directs) > 1): ?>
          <p style="margin:14px 0 0;font-size:.88rem">Ensuite : <?php foreach (array_slice($directs, 1) as $k => $x): ?><?= $k ? ' · ' : '' ?><?= e($x['titre']) ?> (<?= e(date_fr($x['debut'], false, true)) ?>)<?php endforeach; ?></p>
        <?php endif; ?>
      </section>
    <?php endif; ?>

    <section aria-labelledby="t-formations">
      <h2 id="t-formations" style="font-size:1.3rem">Mes formations</h2>
      <?php if (!$inscriptions): ?>
        <div class="vide">
          <p><strong>Vous n’êtes inscrit(e) à aucune formation pour le moment.</strong></p>
          <a class="btn btn-corail" href="<?= e(url('/formations')) ?>">Choisir une formation</a>
        </div>
      <?php endif; ?>
      <?php foreach ($inscriptions as $i):
          $classe = match ($i['statut']) { 'confirmee', 'payee' => 'pastille-ok', 'annulee' => 'pastille-ko', default => 'pastille-attente' };
          $reste = reste_a_payer($i); ?>
        <article class="carte ma-formation"<?= $i['statut'] === 'annulee' ? ' style="opacity:.65"' : '' ?>>
          <div class="ma-formation-haut">
            <div>
              <h3><?= e($i['formation_titre']) ?></h3>
              <p class="muted" style="margin:2px 0 0;font-size:.9rem">
                <?= $i['date_debut'] ? 'Session du ' . e(date_fr($i['date_debut'])) : 'Session : dates à venir' ?>
                <?= $i['format'] ? ' · ' . e(FORMATS_SESSION[$i['format']] ?? '') : '' ?> · Réf. <?= e($i['reference']) ?>
              </p>
            </div>
            <span class="pastille <?= $classe ?>"><?= e(libelle_statut($i['statut'])) ?></span>
          </div>
          <?php if ($i['acces'] && $i['progression'] && $i['progression']['total'] > 0): $p = $i['progression']; ?>
            <div>
              <div class="progression-texte"><span><?= $p['faites'] ?> / <?= $p['total'] ?> contenus terminés</span><span><?= $p['pourcentage'] ?> %</span></div>
              <div class="jauge" role="progressbar" aria-valuenow="<?= $p['pourcentage'] ?>" aria-valuemin="0" aria-valuemax="100" aria-label="Progression"><span style="width:<?= $p['pourcentage'] ?>%"></span></div>
            </div>
          <?php elseif ($i['acces']): ?>
            <p class="muted" style="margin:0;font-size:.92rem">Les contenus (vidéos, replays, supports) apparaîtront ici au fil de la formation.</p>
          <?php elseif ($i['statut'] !== 'annulee'): ?>
            <p class="muted" style="margin:0;font-size:.92rem">Reste à payer : <strong><?= e(prix($reste)) ?></strong> sur <?= e(prix((int) $i['montant_total'])) ?>. Vos contenus s’ouvriront après validation du paiement.</p>
          <?php endif; ?>
          <div class="quiz-actions">
            <?php if ($i['acces']): ?>
              <a class="btn btn-bleu" href="<?= e(url('/espace/formations/' . $i['formation_slug'])) ?>">Accéder aux contenus</a>
            <?php endif; ?>
            <?php if (!$i['acces'] && $i['statut'] !== 'annulee'): ?>
              <a class="btn btn-corail" href="<?= e(url('/inscription/suivi/' . $i['jeton_suivi'])) ?>">Finaliser mon paiement</a>
            <?php elseif ($reste > 0 && $i['statut'] !== 'annulee'): ?>
              <a class="btn btn-fantome" href="<?= e(url('/inscription/suivi/' . $i['jeton_suivi'])) ?>">Mon échéancier (reste <?= e(prix($reste)) ?>)</a>
            <?php endif; ?>
            <?php if ($i['session_replay'] && $i['acces']): ?>
              <a class="btn btn-fantome" href="<?= e($i['session_replay']) ?>" target="_blank" rel="noopener"><?= icone('lecture') ?>Replay</a>
            <?php endif; ?>
          </div>
        </article>
      <?php endforeach; ?>
    </section>

    <?php if ($recents): ?>
      <section aria-labelledby="t-recents" style="margin-top:32px">
        <h2 id="t-recents" style="font-size:1.3rem">Dernières vidéos publiées</h2>
        <ul class="liste-notifs">
          <?php foreach ($recents as $r): ?>
            <li><a href="<?= e(url('/espace/formations/' . $r['formation_slug'] . '#lecon-' . $r['id'])) ?>"><strong><?= e($r['titre']) ?></strong></a><time><?= e($r['formation_titre']) ?> · <?= e(date_fr($r['cree_le'])) ?></time></li>
          <?php endforeach; ?>
        </ul>
      </section>
    <?php endif; ?>
  </div>

  <aside style="display:grid;gap:16px">
    <section class="carte" aria-labelledby="t-notifs"<?= $nonLues ? ' data-notifs-lues="' . e(url('/espace/notifications/lues')) . '"' : '' ?>>
      <h2 id="t-notifs" style="font-size:1.1rem;display:flex;align-items:center;gap:8px"><?= icone('cloche') ?>Notifications<?= $nonLues ? ' <span class="pastille pastille-ko">' . $nonLues . '</span>' : '' ?></h2>
      <?php if ($notifications): ?>
        <ul class="liste-notifs">
          <?php foreach ($notifications as $n): ?>
            <li class="<?= $n['lu_le'] ? '' : 'non-lue' ?>"><strong><?= e($n['titre']) ?></strong><br><span class="muted"><?= e($n['message']) ?></span><time datetime="<?= e($n['cree_le']) ?>"><?= e(date_fr($n['cree_le'])) ?></time></li>
          <?php endforeach; ?>
        </ul>
      <?php else: ?>
        <p class="muted" style="margin:0">Aucune notification pour le moment.</p>
      <?php endif; ?>
    </section>
    <section class="carte bientot">
      <span class="pastille">Bientôt</span>
      <h2 style="font-size:1.05rem;display:flex;gap:8px;align-items:center"><?= icone('certificat') ?>Certificats numériques</h2>
      <p class="muted" style="margin:0;font-size:.92rem">Vos certificats, avec un code de vérification, apparaîtront ici à la fin de votre parcours.</p>
    </section>
    <section class="carte bientot">
      <span class="pastille">Bientôt</span>
      <h2 style="font-size:1.05rem;display:flex;gap:8px;align-items:center"><?= icone('question') ?>Quiz</h2>
      <p class="muted" style="margin:0;font-size:.92rem">Des quiz pour vérifier vos acquis à la fin de chaque module.</p>
    </section>
    <section class="carte">
      <h2 style="font-size:1.05rem">Besoin d’aide ?</h2>
      <a class="btn btn-fantome btn-bloc" href="<?= e(lien_whatsapp('Bonjour, j’ai besoin d’aide dans mon espace apprenant.')) ?>" target="_blank" rel="noopener"><?= icone('whatsapp') ?>Écrire sur WhatsApp</a>
    </section>
  </aside>
</div>

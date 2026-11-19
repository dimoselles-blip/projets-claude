<?php
defined('DTA') || exit;
/** @var array $f */
$seuil = (int) reglage('seuil_acces_tranches');
$faq = [];
foreach ($f['faq'] as $q) {
    if (!empty($q['q']) && !empty($q['r'])) {
        $faq[] = $q;
    }
}
if ($f['gratuite']) {
    $faq[] = ['q' => 'Est-ce vraiment gratuit ?', 'r' => 'Oui. Réservez votre place : l’inscription est confirmée immédiatement, sans aucun paiement.'];
} else {
    $acces = $seuil === 0 ? 'dès la première tranche validée' : ($seuil >= 100 ? 'une fois le montant entièrement réglé' : 'dès que ' . $seuil . ' % du montant est réglé');
    $faq[] = ['q' => 'Comment se passe le paiement ?', 'r' => 'Par Mobile Money (MTN, Moov, Celtiis). Après votre inscription, un bouton ouvre WhatsApp pour recevoir les instructions de paiement. Le paiement en plusieurs tranches est possible : vos contenus en ligne s’ouvrent ' . $acces . '.'];
}
$faq[] = ['q' => 'Faut-il un niveau particulier ?', 'r' => 'Niveau : ' . mb_strtolower($f['niveau']) . '.' . ($f['prerequis'] ? ' Prérequis : ' . $f['prerequis'] : '') . ($f['public_cible'] ? ' Public visé : ' . $f['public_cible'] : '')];
if ($f['mode'] === 'hybride') {
    $faq[] = ['q' => 'Que se passe-t-il si je manque une séance ?', 'r' => 'Les cours en direct sont complétés par des vidéos à revoir dans votre espace apprenant, avec les supports à télécharger.'];
}
$faq[] = ['q' => 'Obtient-on un certificat ?', 'r' => match ($f['certification']) {
    'certificat' => 'Oui : un certificat de fin de parcours DIMO Tech Academy.',
    'attestation' => 'Oui : une attestation DIMO Tech Academy.',
    default => 'Les masterclass gratuites ne donnent pas lieu à un certificat. Pour en obtenir un, poursuivez avec l’un de nos parcours.',
}];
$prochaine = $sessions[0] ?? null;
$texteBouton = $f['gratuite'] ? 'Réserver ma place' : 'S’inscrire';
$lienInscription = url('/inscription', ['formation' => $f['slug']]);
?>
<section class="fiche-hero">
  <div class="conteneur">
    <ol class="fil">
      <li><a href="<?= e(url('/')) ?>">Accueil</a></li>
      <li><a href="<?= e(url('/formations')) ?>">Formations</a></li>
      <li><a href="<?= e(url('/formations', ['categorie' => $f['categorie_slug']])) ?>"><?= e($f['categorie_onglet']) ?></a></li>
    </ol>
    <div class="fiche-badges">
      <?php if ($f['statut'] !== 'publie'): ?><span class="pastille pastille-ko">Brouillon — visible par l’équipe uniquement</span><?php endif; ?>
      <?php if ($f['badge']): ?><span class="badge badge-<?= $f['badge'] === 'GRATUIT' ? 'gratuit' : 'certifiant' ?>"><?= e($f['badge']) ?></span><?php endif; ?>
      <span class="pastille"><?= e($f['categorie_onglet']) ?></span>
      <?php if ($f['stage']): ?><span class="pastille">Stage prévu</span><?php endif; ?>
    </div>
    <h1><?= e($f['titre']) ?></h1>
    <?php if ($f['accroche']): ?><p class="intro"><?= e($f['accroche']) ?></p><?php endif; ?>
    <ul class="faits">
      <li><span><?= icone('horloge') ?>Durée</span><strong><?= e($f['duree_affichee'] ?: 'À confirmer') ?></strong></li>
      <li><span><?= icone('lieu') ?>Format</span><strong><?= e($f['format_affiche']) ?></strong></li>
      <li><span><?= icone('paiement') ?>Prix</span><strong><?= e($f['prix_affiche']) ?><?= $f['prix_detail'] ? ' en présentiel' : '' ?></strong><?php if ($f['prix_detail']): ?><small class="muted"><?= e(prix($f['prix_en_ligne'])) ?> en ligne</small><?php endif; ?></li>
      <li><span><?= icone('certificat') ?>Certification</span><strong><?= e($f['certification_label']) ?></strong></li>
      <li><span><?= icone('niveau') ?>Niveau</span><strong><?= e($f['niveau']) ?></strong></li>
    </ul>
  </div>
</section>

<div class="conteneur fiche-grille">
  <div class="fiche-contenu">
    <?php if ($f['probleme']): ?>
      <section class="fiche-bloc" aria-labelledby="t-probleme">
        <h2 id="t-probleme">Le problème que cette formation résout</h2>
        <p class="probleme"><?= e($f['probleme']) ?></p>
      </section>
    <?php endif; ?>

    <?php if ($f['objectifs']): ?>
      <section class="fiche-bloc" aria-labelledby="t-objectifs">
        <h2 id="t-objectifs">Objectifs</h2>
        <ul class="objectifs">
          <?php foreach ($f['objectifs'] as $o): ?><li><?= icone('valide-cercle') ?><span><?= e($o) ?></span></li><?php endforeach; ?>
        </ul>
      </section>
    <?php endif; ?>

    <?php if ($modules): ?>
      <section class="fiche-bloc" aria-labelledby="t-modules">
        <h2 id="t-modules">Programme</h2>
        <ol class="modules">
          <?php foreach ($modules as $i => $m): ?>
            <li><span class="module-code"><?= e($m['code'] ?: 'M' . ($i + 1)) ?></span><div><strong><?= e($m['titre']) ?></strong><?php if ($m['description']): ?><span><?= e($m['description']) ?></span><?php endif; ?></div></li>
          <?php endforeach; ?>
        </ol>
      </section>
    <?php endif; ?>

    <?php if ($f['public_cible'] || $f['prerequis']): ?>
      <section class="fiche-bloc" aria-labelledby="t-public">
        <h2 id="t-public">Pour qui ?</h2>
        <?php if ($f['public_cible']): ?><p><?= e($f['public_cible']) ?></p><?php endif; ?>
        <?php if ($f['prerequis']): ?><p><strong>Prérequis :</strong> <?= e($f['prerequis']) ?></p><?php endif; ?>
      </section>
    <?php endif; ?>

    <?php if ($f['resultat'] || $f['debouches']): ?>
      <section class="fiche-bloc" aria-labelledby="t-resultat">
        <h2 id="t-resultat">Résultat et débouchés</h2>
        <?php if ($f['resultat']): ?><p><?= e($f['resultat']) ?></p><?php endif; ?>
        <?php if ($f['debouches']): ?>
          <p class="muted" style="margin-bottom:10px">Métiers visés :</p>
          <ul class="puces"><?php foreach ($f['debouches'] as $d): ?><li><?= e($d) ?></li><?php endforeach; ?></ul>
        <?php endif; ?>
      </section>
    <?php endif; ?>

    <section class="fiche-bloc" aria-labelledby="t-formateur">
      <h2 id="t-formateur">Formateur</h2>
      <?php if ($formateur): ?>
        <div class="formateur">
          <?php if ($formateur['photo']): ?><img src="<?= e(media($formateur['photo'])) ?>" alt="" width="84" height="84" loading="lazy"><?php else: ?><?= partiel('emplacement', ['texte' => 'Photo du formateur', 'ratio' => '1']) ?><?php endif; ?>
          <div>
            <strong><?= e($formateur['nom']) ?></strong>
            <?php if ($formateur['role']): ?><p class="muted" style="margin:0"><?= e($formateur['role']) ?></p><?php endif; ?>
            <?php if ($formateur['bio']): ?><p style="margin:.5em 0 0"><?= e($formateur['bio']) ?></p><?php endif; ?>
          </div>
        </div>
      <?php else: ?>
        <div class="formateur">
          <?= partiel('emplacement', ['texte' => 'Photo du formateur', 'ratio' => '1']) ?>
          <p class="muted" style="margin:0">Le formateur ou la formatrice de cette formation sera présenté(e) prochainement.</p>
        </div>
      <?php endif; ?>
    </section>

    <section class="fiche-bloc" id="sessions" aria-labelledby="t-sessions">
      <h2 id="t-sessions">Prochaines sessions</h2>
      <?php if ($sessions): ?>
        <div class="liste-sessions"><?php foreach ($sessions as $s): ?><?= partiel('carte-session', ['s' => $s]) ?><?php endforeach; ?></div>
      <?php else: ?>
        <?= partiel('liste-attente', ['formationId' => $f['id'], 'retour' => '/formations/' . $f['slug'] . '#sessions', 'texte' => 'Les prochaines dates de « ' . $f['titre'] . ' » sont en préparation. Inscrivez-vous dès maintenant pour réserver votre place, ou laissez vos coordonnées pour être prévenu(e).']) ?>
      <?php endif; ?>
    </section>

    <section class="fiche-bloc" aria-labelledby="t-faq">
      <h2 id="t-faq">Questions fréquentes</h2>
      <?= partiel('accordeon', ['questions' => $faq]) ?>
    </section>
  </div>

  <aside class="fiche-aside" aria-label="Inscription">
    <div class="carte carte-inscription">
      <p class="surtitre"><?= $f['gratuite'] ? 'Masterclass gratuite' : 'Tarif' ?></p>
      <p class="prix-grand"><?= e($f['prix_affiche']) ?></p>
      <?php if ($f['prix_detail']): ?><p class="muted" style="margin:0"><?= e($f['prix_detail']) ?></p><?php endif; ?>
      <?php if ($f['mention_prix']): ?><p class="muted" style="margin:0"><?= e(ucfirst($f['mention_prix'])) ?></p><?php endif; ?>
      <ul class="liste-coches">
        <li><?= icone('valide') ?><?= e($f['format_affiche']) ?></li>
        <li><?= icone('valide') ?><?= e($f['duree_affichee'] ?: 'Durée à confirmer') ?></li>
        <li><?= icone('valide') ?><?= e($f['certification_label']) ?></li>
        <?php if ($f['stage']): ?><li><?= icone('valide') ?>Stage prévu</li><?php endif; ?>
        <?php if (!$f['gratuite']): ?><li><?= icone('valide') ?>Mobile Money, en plusieurs tranches</li><?php endif; ?>
        <li><?= icone('valide') ?><?= $prochaine ? 'Prochaine session : ' . e(date_fr($prochaine['date_debut'])) : 'Dates à venir' ?></li>
      </ul>
      <a class="btn btn-corail btn-large btn-maj" href="<?= e($lienInscription) ?>" data-inscription="<?= e($f['slug']) ?>"><?= e($texteBouton) ?></a>
      <a class="btn btn-fantome" href="<?= e(lien_whatsapp('Bonjour, j’ai une question sur la formation « ' . $f['titre'] . ' ».')) ?>" target="_blank" rel="noopener"><?= icone('whatsapp') ?>Une question ?</a>
    </div>
  </aside>
</div>

<?php if ($autres): ?>
  <section class="section section-grise" aria-labelledby="t-autres">
    <div class="conteneur">
      <div class="section-entete"><h2 id="t-autres">Dans la même catégorie</h2></div>
      <div class="grille-cartes" data-n="<?= count($autres) ?>"><?php foreach ($autres as $a): ?><?= partiel('carte-formation', ['f' => $a]) ?><?php endforeach; ?></div>
    </div>
  </section>
<?php endif; ?>

<div class="barre-mobile">
  <div><strong><?= e($f['prix_detail'] ? 'Dès ' . prix($f['prix_min']) : $f['prix_affiche']) ?></strong><small><?= e($f['duree_affichee'] ?: $f['titre']) ?></small></div>
  <a class="btn btn-corail" href="<?= e($lienInscription) ?>" data-inscription="<?= e($f['slug']) ?>"><?= e($texteBouton) ?></a>
</div>

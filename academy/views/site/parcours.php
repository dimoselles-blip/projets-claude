<?php defined('DTA') || exit; ?>
<section class="entete-page">
  <div class="conteneur">
    <ol class="fil"><li><a href="<?= e(url('/')) ?>">Accueil</a></li><li aria-current="page">Parcours Data, IA et Tech</li></ol>
    <h1>Parcours Data, IA et Tech</h1>
    <p class="intro">De 1 jour à 12 mois, des parcours pensés pour un métier : pédagogie hybride, projets réels, mentors, stages selon les parcours et certificat de fin de parcours.</p>
  </div>
</section>

<section class="contenu-page">
  <div class="conteneur">
    <ol class="etapes-parcours">
      <li><strong>Apprendre</strong><span>Cours en direct, vidéos à revoir et présentiel à Akpakpa.</span></li>
      <li><strong>Pratiquer</strong><span>Exercices, cas réels et travaux de groupe à chaque module.</span></li>
      <li><strong>Construire</strong><span>Des projets concrets pour votre portfolio, avec des dépôts GitHub pour les parcours techniques.</span></li>
      <li><strong>Se lancer</strong><span>Certificat, stage selon le parcours et préparation à l’emploi ou aux premiers clients.</span></li>
    </ol>

    <?php foreach ($groupes as $slug => $g): ?>
      <div class="groupe-categorie" id="<?= e($slug) ?>" style="margin-top:56px">
        <h2><?= e($g['categorie']['onglet']) ?></h2>
        <?php if ($g['categorie']['accroche']): ?><p class="muted"><?= e($g['categorie']['accroche']) ?></p><?php endif; ?>
        <div class="grille-cartes" data-n="<?= count($g['formations']) ?>">
          <?php foreach ($g['formations'] as $f): ?><?= partiel('carte-formation', ['f' => $f]) ?><?php endforeach; ?>
        </div>
      </div>
    <?php endforeach; ?>

    <div class="carte" style="margin-top:56px">
      <h2 style="font-size:1.35rem">Mentors, stages et certificats</h2>
      <ul class="liste-colonnes">
        <li><?= icone('valide') ?>Des mentors pendant tout le parcours</li>
        <li><?= icone('valide') ?>Un stage pour Data Analyst &amp; BI et Data Scientist</li>
        <li><?= icone('valide') ?>Un certificat de fin de parcours (attestation pour IA générative au travail)</li>
        <li><?= icone('valide') ?>Un portfolio de projets réels</li>
        <li><?= icone('valide') ?>Paiement Mobile Money en plusieurs tranches</li>
        <li><?= icone('valide') ?>Préparation à l’emploi ou aux premiers clients</li>
      </ul>
    </div>
  </div>
</section>
<?= partiel('cta-final') ?>

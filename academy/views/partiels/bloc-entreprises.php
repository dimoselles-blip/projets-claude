<?php
/** Bloc « Pour les entreprises » (accueil et page Entreprises). */
defined('DTA') || exit;
$complet ??= false;
$prixVisibles = prix_entreprises_visibles();
$services = [
    ['etincelle', 'Formation IA pour les équipes'],
    ['graphique', 'Data & Business Intelligence'],
    ['couches', 'Automatisation des processus'],
    ['tableau', 'Power BI'],
    ['robot', 'Création d’assistants IA'],
    ['cible', 'Formations sur mesure'],
];
$niveauTitre = $complet ? 'h2' : 'h2';
?>
<section class="section section-entreprises" id="entreprises" aria-labelledby="entreprises-titre">
  <div class="conteneur">
    <div class="grille-entreprises">
      <div class="section-entete section-entete-gauche" data-reveler>
        <p class="surtitre">Pour les entreprises</p>
        <<?= $niveauTitre ?> id="entreprises-titre">Développez les compétences de vos équipes</<?= $niveauTitre ?>>
        <p>Nous accompagnons les entreprises dans leur transformation numérique grâce à des formations adaptées à leurs besoins.</p>
        <p class="muted">Sur site ou en ligne, avec un programme adapté à votre secteur. Chaque formule comprend deux jours de formation dans vos locaux, des exercices sur vos propres cas, un support et un suivi après la formation.</p>
        <a class="btn btn-corail btn-large" href="<?= e(url('/entreprises#devis')) ?>"<?= $complet ? ' data-defiler' : '' ?>>Demander une formation sur mesure</a>
      </div>
      <ul class="services" data-reveler>
        <?php foreach ($services as [$ico, $libelle]): ?>
          <li><span class="puce-icone"><?= icone($ico) ?></span><?= e($libelle) ?></li>
        <?php endforeach; ?>
      </ul>
    </div>

    <div class="formules">
      <?php foreach (FORMULES_ENTREPRISES as $fo): ?>
        <article class="carte formule<?= !empty($fo['vedette']) ? ' formule-vedette' : '' ?>" data-reveler>
          <h3><?= e($fo['nom']) ?></h3>
          <p class="formule-public"><?= e($fo['participants']) ?></p>
          <p class="formule-prix"><?= $prixVisibles ? e(prix($fo['prix'])) : 'Sur devis' ?></p>
          <p class="formule-format"><?= icone('calendrier') ?><?= e($fo['format']) ?></p>
          <ul class="liste-coches">
            <?php foreach ($fo['inclus'] as $inc): ?><li><?= icone('valide') ?><?= e($inc) ?></li><?php endforeach; ?>
          </ul>
          <p class="formule-ideal">Idéal pour : <?= e($fo['ideal']) ?></p>
        </article>
      <?php endforeach; ?>
    </div>

    <div class="accompagnement-data carte" data-reveler>
      <div>
        <p class="surtitre">Avec DIMO Tech, notre branche services</p>
        <h3>Accompagnement Data des entreprises</h3>
        <?php if ($complet): ?>
          <ul class="liste-colonnes">
            <?php foreach (['Audit et diagnostic des données', 'Nettoyage et préparation', 'Visualisation et reporting', 'Analyse prédictive et modélisation', 'Aide à la décision', 'Analyses marketing et client', 'Analyses commerciales et ventes', 'Analyses opérationnelles et logistiques', 'Formation des équipes sur leurs propres données'] as $s): ?>
              <li><?= icone('valide') ?><?= e($s) ?></li>
            <?php endforeach; ?>
          </ul>
        <?php else: ?>
          <p>Audit et diagnostic des données, visualisation et reporting, analyse prédictive, aide à la décision, et formation des équipes sur leurs propres données.</p>
        <?php endif; ?>
      </div>
      <div class="accompagnement-prix">
        <strong>Sur devis</strong>
        <a class="lien-fleche" href="<?= e(url('/entreprises#devis')) ?>">Nous consulter <?= icone('fleche') ?></a>
      </div>
    </div>
  </div>
</section>

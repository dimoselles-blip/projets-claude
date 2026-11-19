<?php
defined('DTA') || exit;
$rubriques = [];
foreach ($faq as $q) {
    $rubriques[$q['rubrique'] ?: 'Autres questions'][] = $q;
}
?>
<section class="entete-page">
  <div class="conteneur">
    <ol class="fil"><li><a href="<?= e(url('/')) ?>">Accueil</a></li><li aria-current="page">FAQ</li></ol>
    <h1>Questions fréquentes</h1>
    <p class="intro">Inscription, formats, paiement, certificats, entreprises : tout ce qu’il faut savoir avant de vous lancer.</p>
  </div>
</section>
<section class="contenu-page">
  <div class="conteneur conteneur-etroit">
    <?php foreach ($rubriques as $nom => $questions): ?>
      <h2 style="font-size:1.35rem;margin-top:36px"><?= e($nom) ?></h2>
      <?= partiel('accordeon', ['questions' => $questions]) ?>
    <?php endforeach; ?>
    <div class="carte centre" style="margin-top:48px">
      <h2 style="font-size:1.3rem">Vous ne trouvez pas votre réponse ?</h2>
      <p class="muted">Écrivez-nous, nous répondons rapidement.</p>
      <div class="installation-actions" style="justify-content:center">
        <a class="btn btn-bleu" href="<?= e(lien_whatsapp('Bonjour, j’ai une question sur DIMO Tech Academy.')) ?>" target="_blank" rel="noopener"><?= icone('whatsapp') ?>WhatsApp</a>
        <a class="btn btn-contour" href="<?= e(url('/contact')) ?>">Formulaire de contact</a>
      </div>
    </div>
  </div>
</section>
<?= partiel('cta-final') ?>

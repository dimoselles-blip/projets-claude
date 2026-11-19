<?php
defined('DTA') || exit;
$mois = [];
foreach ($toutes as $s) {
    $cle = substr($s['date_debut'], 0, 7);
    $mois[$cle] = ucfirst(MOIS_FR[(int) substr($cle, 5, 2) - 1]) . ' ' . substr($cle, 0, 4);
}
ksort($mois);
?>
<section class="entete-page">
  <div class="conteneur">
    <ol class="fil"><li><a href="<?= e(url('/')) ?>">Accueil</a></li><li aria-current="page">Prochaines sessions</li></ol>
    <h1>Prochaines sessions</h1>
    <p class="intro">Présentiel au siège d’Akpakpa (Cotonou) ou en ligne. Les places sont limitées : les sessions aux inscriptions ouvertes apparaissent en premier.</p>
  </div>
</section>

<section class="contenu-page">
  <div class="conteneur">
    <?php if ($toutes): ?>
      <form class="filtres" method="get" action="<?= e(url('/sessions')) ?>" data-auto-submit aria-label="Filtrer les sessions" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
        <div class="champ"><label for="s-cat">Catégorie</label>
          <select id="s-cat" name="categorie"><option value="">Toutes</option><?php foreach (categories() as $c): ?><option value="<?= e($c['slug']) ?>"<?= $filtres['categorie'] === $c['slug'] ? ' selected' : '' ?>><?= e($c['onglet']) ?></option><?php endforeach; ?></select>
        </div>
        <div class="champ"><label for="s-format">Format</label>
          <select id="s-format" name="format"><option value="">Tous</option><?php foreach (FORMATS_SESSION as $k => $l): ?><option value="<?= e($k) ?>"<?= $filtres['format'] === $k ? ' selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select>
        </div>
        <div class="champ"><label for="s-mois">Mois</label>
          <select id="s-mois" name="mois"><option value="">Tous</option><?php foreach ($mois as $k => $l): ?><option value="<?= e($k) ?>"<?= $filtres['mois'] === $k ? ' selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select>
        </div>
        <div class="filtres-actions"><button class="btn btn-bleu" type="submit">Filtrer</button></div>
      </form>
      <?php if ($sessions): ?>
        <div class="liste-sessions"><?php foreach ($sessions as $s): ?><?= partiel('carte-session', ['s' => $s]) ?><?php endforeach; ?></div>
      <?php else: ?>
        <div class="vide"><p>Aucune session ne correspond à ces critères. <a href="<?= e(url('/sessions')) ?>">Voir toutes les sessions</a></p></div>
      <?php endif; ?>
      <div style="margin-top:40px"><?= partiel('liste-attente', ['titre' => 'Votre formation n’a pas encore de date ?', 'texte' => 'Laissez vos coordonnées : nous vous prévenons dès l’ouverture des inscriptions.']) ?></div>
    <?php else: ?>
      <?= partiel('liste-attente') ?>
    <?php endif; ?>
  </div>
</section>
<?= partiel('cta-final') ?>

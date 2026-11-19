<?php
defined('DTA') || exit;
$parCategorie = [];
foreach ($formations as $f) {
    $parCategorie[$f['categorie_slug']][] = $f;
}
?>
<section class="entete-page">
  <div class="conteneur">
    <ol class="fil"><li><a href="<?= e(url('/')) ?>">Accueil</a></li><li aria-current="page">Formations</li></ol>
    <h1>Toutes nos formations</h1>
    <p class="intro">Masterclass gratuites, parcours Data, IA et Tech de 1 jour à 12 mois. Prix en F CFA, paiement Mobile Money en plusieurs tranches possible.</p>
  </div>
</section>

<section class="contenu-page">
  <div class="conteneur">
    <form class="filtres" method="get" action="<?= e(url('/formations')) ?>" data-auto-submit role="search" aria-label="Filtrer les formations">
      <div class="champ">
        <label for="f-q">Rechercher</label>
        <input id="f-q" name="q" type="search" value="<?= e($filtres['q']) ?>" placeholder="Power BI, agents IA, SQL…">
      </div>
      <div class="champ">
        <label for="f-cat">Catégorie</label>
        <select id="f-cat" name="categorie">
          <option value="">Toutes</option>
          <?php foreach (categories() as $c): ?><option value="<?= e($c['slug']) ?>"<?= $filtres['categorie'] === $c['slug'] ? ' selected' : '' ?>><?= e($c['onglet']) ?></option><?php endforeach; ?>
        </select>
      </div>
      <div class="champ">
        <label for="f-niv">Niveau</label>
        <select id="f-niv" name="niveau">
          <option value="">Tous</option>
          <?php foreach (NIVEAUX as $n): ?><option<?= $filtres['niveau'] === $n ? ' selected' : '' ?>><?= e($n) ?></option><?php endforeach; ?>
        </select>
      </div>
      <div class="champ">
        <label for="f-format">Format</label>
        <select id="f-format" name="format">
          <option value="">Tous</option>
          <option value="hybride"<?= $filtres['mode'] === 'hybride' ? ' selected' : '' ?>>Hybride</option>
          <option value="en_ligne"<?= $filtres['mode'] === 'en_ligne' ? ' selected' : '' ?>>Possible en ligne</option>
          <option value="presentiel"<?= $filtres['mode'] === 'presentiel' ? ' selected' : '' ?>>Possible en présentiel</option>
          <option value="au_choix"<?= $filtres['mode'] === 'au_choix' ? ' selected' : '' ?>>Présentiel ou en ligne, au choix</option>
        </select>
      </div>
      <div class="champ">
        <label for="f-prix">Prix</label>
        <select id="f-prix" name="prix">
          <option value="">Tous</option>
          <?php foreach (TRANCHES_PRIX as $k => $l): ?><option value="<?= e($k) ?>"<?= $filtres['prix'] === $k ? ' selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?>
        </select>
      </div>
      <div class="filtres-actions">
        <button class="btn btn-bleu" type="submit"><?= icone('filtre') ?>Filtrer</button>
      </div>
    </form>

    <div class="resultats-info">
      <p><strong><?= count($formations) ?></strong> formation<?= count($formations) > 1 ? 's' : '' ?><?= $nbFiltres ? ' correspondant à vos critères' : '' ?></p>
      <?php if ($nbFiltres): ?><a class="btn-lien" href="<?= e(url('/formations')) ?>">Effacer les filtres</a><?php endif; ?>
    </div>

    <?php if (!$formations): ?>
      <div class="vide">
        <p><strong>Aucune formation ne correspond à ces critères.</strong></p>
        <p><a href="<?= e(url('/formations')) ?>">Voir toutes les formations</a> ou <a href="<?= e(lien_whatsapp('Bonjour, je cherche une formation et j’aimerais être conseillé(e).')) ?>" target="_blank" rel="noopener">demandez conseil sur WhatsApp</a>.</p>
      </div>
    <?php else: ?>
      <?php foreach ($parCategorie as $slug => $liste): $c = categorie_par_slug($slug); ?>
        <div class="groupe-categorie">
          <h2><?= e($c['onglet']) ?></h2>
          <?php if ($c['accroche']): ?><p class="muted"><?= e($c['accroche']) ?></p><?php endif; ?>
          <div class="grille-cartes" data-n="<?= count($liste) ?>">
            <?php foreach ($liste as $f): ?><?= partiel('carte-formation', ['f' => $f]) ?><?php endforeach; ?>
          </div>
        </div>
      <?php endforeach; ?>
    <?php endif; ?>
  </div>
</section>
<?= partiel('cta-final', ['titre' => 'Vous hésitez entre deux formations ?', 'texte' => 'Répondez à une question et nous vous orientons, ou écrivez-nous sur WhatsApp.']) ?>

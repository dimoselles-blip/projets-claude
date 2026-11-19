<?php
defined('DTA') || exit;
$max = max(1, ...array_map(fn($v) => (int) $v['vues'], $visitesJours ?: [['vues' => 1]]));
$jours = [];
for ($i = 13; $i >= 0; $i--) {
    $jours[date('Y-m-d', strtotime("-$i days"))] = 0;
}
foreach ($visitesJours as $v) {
    $jours[$v['jour']] = (int) $v['vues'];
}
?>
<div class="admin-entete">
  <div><h1>Tableau de bord</h1><p>Inscriptions, paiements à valider et activité du site.</p></div>
  <div class="actions">
    <a class="btn btn-bleu btn-petit" href="<?= e(url('/admin/sessions/nouveau')) ?>"><?= icone('plus') ?>Ajouter une session</a>
    <a class="btn btn-fantome btn-petit" href="<?= e(url('/admin/formations/nouveau')) ?>"><?= icone('plus') ?>Ajouter une formation</a>
  </div>
</div>

<div class="kpis">
  <a class="kpi" href="<?= e(url('/admin/inscriptions', ['statut' => 'a_valider'])) ?>"><span>Paiements à suivre</span><strong><?= $stats['attente'] ?></strong></a>
  <div class="kpi"><span>Encaissé ce mois-ci</span><strong><?= e(prix($stats['encaisse_mois'])) ?></strong></div>
  <div class="kpi"><span>Reste à encaisser</span><strong><?= e(prix($stats['reste_total'])) ?></strong></div>
  <a class="kpi" href="<?= e(url('/admin/demandes')) ?>"><span>Demandes non traitées</span><strong><?= $stats['demandes'] ?></strong></a>
  <a class="kpi" href="<?= e(url('/admin/inscriptions')) ?>"><span>Inscriptions (30 jours)</span><strong><?= $stats['inscriptions30'] ?></strong></a>
  <a class="kpi" href="<?= e(url('/admin/apprenants')) ?>"><span>Apprenants</span><strong><?= $stats['apprenants'] ?></strong></a>
  <div class="kpi"><span>Pages vues (30 jours)</span><strong><?= number_format($stats['visites30'], 0, ',', ' ') ?></strong></div>
</div>

<div class="grille-admin">
  <div>
    <section class="panneau">
      <h2>Dernières inscriptions</h2>
      <?php if ($dernieres): ?>
        <div class="defilement">
          <table class="tableau tableau-cartes">
            <thead><tr><th>Apprenant</th><th>Formation</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody>
              <?php foreach ($dernieres as $i): ?>
                <tr>
                  <td data-label="Apprenant"><a href="<?= e(url('/admin/inscriptions/' . $i['id'])) ?>"><strong><?= e($i['nom']) ?></strong></a><br><span class="muted"><?= e(date_fr($i['cree_le'], false, true)) ?> · <?= e($i['reference']) ?></span></td>
                  <td data-label="Formation"><?= e($i['formation_titre']) ?></td>
                  <td data-label="Montant"><?= (int) $i['montant_total'] === 0 ? 'Gratuit' : e(prix((int) $i['montant_recu'], false)) . ' / ' . e(prix((int) $i['montant_total'])) ?></td>
                  <td data-label="Statut"><?= partiel('pastille-statut', ['statut' => $i['statut']]) ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php else: ?>
        <p class="muted">Aucune inscription pour le moment.</p>
      <?php endif; ?>
    </section>
    <section class="panneau">
      <h2>Visites des 14 derniers jours</h2>
      <div class="graphe-visites" aria-label="Pages vues par jour">
        <?php foreach ($jours as $j => $n): ?>
          <div title="<?= e(date_fr($j)) ?> : <?= $n ?> pages vues"><span style="height:<?= (int) round($n * 100 / $max) ?>%"></span><small><?= (int) substr($j, 8) ?></small></div>
        <?php endforeach; ?>
      </div>
      <?php if ($pages): ?>
        <ul class="liste-admin" style="margin-top:14px">
          <?php foreach ($pages as $p): ?><li><span><?= e($p['chemin']) ?></span><strong><?= (int) $p['vues'] ?></strong></li><?php endforeach; ?>
        </ul>
      <?php endif; ?>
    </section>
  </div>
  <div>
    <?php if ($branchements): ?>
      <section class="panneau">
        <h2>À brancher avant publication</h2>
        <ul class="alerte-branchement">
          <?php foreach ($branchements as [$titre, $texte]): ?><li><?= icone('alerte') ?><span><strong><?= e($titre) ?></strong><br><span class="muted"><?= e($texte) ?></span></span></li><?php endforeach; ?>
        </ul>
        <p class="muted" style="font-size:.85rem;margin:10px 0 0">Ces réglages se font dans <code>config/config.php</code> (hPanel → Gestionnaire de fichiers).</p>
      </section>
    <?php endif; ?>
    <section class="panneau">
      <h2>Prochaines sessions</h2>
      <?php if ($sessions): ?>
        <ul class="liste-admin">
          <?php foreach ($sessions as $s): ?>
            <li><span><a href="<?= e(url('/admin/sessions/' . $s['id'])) ?>"><?= e($s['formation_titre']) ?></a><br><span class="muted"><?= e(date_fr($s['date_debut'])) ?> · <?= e($s['format_label']) ?></span></span><span><?= $s['inscrits'] ?><?= $s['places'] !== null ? ' / ' . $s['places'] : '' ?></span></li>
          <?php endforeach; ?>
        </ul>
      <?php else: ?>
        <p class="muted">Aucune session programmée : le site affiche « Dates à venir » et une liste d’attente.</p>
        <a class="btn btn-bleu btn-petit" href="<?= e(url('/admin/sessions/nouveau')) ?>">Ajouter une session</a>
      <?php endif; ?>
    </section>
  </div>
</div>

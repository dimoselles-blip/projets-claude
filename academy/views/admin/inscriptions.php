<?php
defined('DTA') || exit;
$params = array_filter($filtres);
$pages = (int) ceil($total / 50);
?>
<div class="admin-entete">
  <div><h1>Inscriptions</h1><p>Validez les paiements reçus, suivez les échéanciers et exportez la liste des inscrits.</p></div>
  <div class="actions"><a class="btn btn-fantome btn-petit" href="<?= e(url('/admin/inscriptions/export', $params)) ?>"><?= icone('telecharger') ?>Exporter (CSV)</a></div>
</div>

<form class="filtres-admin" method="get" action="<?= e(url('/admin/inscriptions')) ?>" data-auto-submit>
  <div class="champ"><label for="i-q">Recherche</label><input id="i-q" name="q" type="search" value="<?= e($filtres['q']) ?>" placeholder="Nom, e-mail, téléphone, référence"></div>
  <div class="champ"><label for="i-statut">Statut</label>
    <select id="i-statut" name="statut">
      <option value="">Tous</option>
      <option value="a_valider"<?= $filtres['statut'] === 'a_valider' ? ' selected' : '' ?>>À traiter (en attente, partielle, payée)</option>
      <?php foreach (STATUTS_INSCRIPTION as $k => $l): ?><option value="<?= e($k) ?>"<?= $filtres['statut'] === $k ? ' selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?>
    </select>
  </div>
  <div class="champ"><label for="i-formation">Formation</label>
    <select id="i-formation" name="formation"><option value="">Toutes</option><?php foreach ($formations as $fo): ?><option value="<?= (int) $fo['id'] ?>"<?= (int) $filtres['formation'] === (int) $fo['id'] ? ' selected' : '' ?>><?= e($fo['titre']) ?></option><?php endforeach; ?></select>
  </div>
  <button class="btn btn-bleu btn-petit" type="submit">Filtrer</button>
</form>

<section class="panneau">
  <p class="muted" style="margin-top:0"><?= pluriel($total, 'inscription') ?></p>
  <?php if ($lignes): ?>
    <div class="defilement">
      <table class="tableau tableau-cartes">
        <thead><tr><th>Apprenant</th><th>Formation</th><th>Paiement</th><th>Statut</th><th class="tableau-actions"></th></tr></thead>
        <tbody>
          <?php foreach ($lignes as $i): ?>
            <tr>
              <td data-label="Apprenant"><a href="<?= e(url('/admin/inscriptions/' . $i['id'])) ?>"><strong><?= e($i['nom']) ?></strong></a><br><span class="muted"><?= e($i['email']) ?> · <?= e($i['telephone']) ?></span><br><span class="muted"><?= e($i['reference']) ?> · <?= e(date_fr($i['cree_le'], false, true)) ?></span></td>
              <td data-label="Formation"><?= e($i['formation_titre']) ?><br><span class="muted"><?= $i['date_debut'] ? 'Session du ' . e(date_fr($i['date_debut'], false, true)) : 'Session à définir' ?><?= $i['format'] ? ' · ' . e(FORMATS_SESSION[$i['format']] ?? '') : '' ?></span></td>
              <td data-label="Paiement"><?php if ((int) $i['montant_total'] === 0): ?>Gratuit<?php else: ?><?= e(prix((int) $i['montant_recu'], false)) ?> / <?= e(prix((int) $i['montant_total'])) ?><br><span class="muted">Reste <?= e(prix(reste_a_payer($i))) ?><?= $i['moyen_paiement'] ? ' · ' . e(MOYENS_PAIEMENT[$i['moyen_paiement']] ?? '') : '' ?></span><?php endif; ?></td>
              <td data-label="Statut"><?= partiel('pastille-statut', ['statut' => $i['statut']]) ?></td>
              <td class="tableau-actions"><a class="btn btn-fantome btn-petit" href="<?= e(url('/admin/inscriptions/' . $i['id'])) ?>">Ouvrir</a></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php if ($pages > 1): ?>
      <nav class="pagination" aria-label="Pages">
        <?php for ($p = 1; $p <= $pages; $p++): ?>
          <?php if ($p === $page): ?><span><?= $p ?></span><?php else: ?><a href="<?= e(url('/admin/inscriptions', $params + ['page' => $p])) ?>"><?= $p ?></a><?php endif; ?>
        <?php endfor; ?>
      </nav>
    <?php endif; ?>
  <?php else: ?>
    <p class="muted">Aucune inscription ne correspond.</p>
  <?php endif; ?>
</section>

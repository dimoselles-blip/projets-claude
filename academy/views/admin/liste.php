<?php defined('DTA') || exit; /** @var array $r */ ?>
<div class="admin-entete">
  <div>
    <h1><?= e($r['titre']) ?></h1>
    <?php if (!empty($r['aide'])): ?><p><?= e($r['aide']) ?></p><?php endif; ?>
  </div>
  <div class="actions">
    <a class="btn btn-corail btn-petit" href="<?= e(url('/admin/' . $r['nom'] . '/nouveau')) ?>"><?= icone('plus') ?>Ajouter <?= e($r['singulier']) ?></a>
  </div>
</div>
<section class="panneau">
  <?php if (!$lignes): ?>
    <p class="muted" style="margin:0">Aucun élément pour le moment.</p>
  <?php else: ?>
    <div class="defilement">
      <table class="tableau tableau-cartes">
        <thead><tr><?php foreach ($r['colonnes'] as [$titre]): ?><th><?= e($titre) ?></th><?php endforeach; ?><th class="tableau-actions">Actions</th></tr></thead>
        <tbody>
          <?php foreach ($lignes as $l): ?>
            <tr>
              <?php foreach ($r['colonnes'] as [$titre, $rendu]): ?><td data-label="<?= e($titre) ?>"><?= $rendu($l) ?></td><?php endforeach; ?>
              <td class="tableau-actions">
                <a class="btn-lien" href="<?= e(url('/admin/' . $r['nom'] . '/' . $l['id'])) ?>">Modifier</a>
                <?php if (isset($r['actions'])): ?><?= ($r['actions'])($l) ?><?php endif; ?>
                <?php if (in_array($r['nom'], ['sessions', 'formations'], true)): ?>
                  <form method="post" action="<?= e(url('/admin/' . $r['nom'] . '/' . $l['id'] . '/dupliquer')) ?>"><?= champ_csrf() ?><button class="btn-lien" type="submit">Dupliquer</button></form>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  <?php endif; ?>
</section>

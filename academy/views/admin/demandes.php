<?php defined('DTA') || exit; ?>
<div class="admin-entete">
  <div><h1>Demandes</h1><p>Devis entreprises, messages de contact et inscriptions sur liste d’attente.</p></div>
  <div class="actions"><a class="btn btn-fantome btn-petit" href="<?= e(url('/admin/demandes/export', ['type' => $type])) ?>"><?= icone('telecharger') ?>Exporter (CSV)</a></div>
</div>
<nav class="filtres-admin" aria-label="Type de demande">
  <a class="btn <?= $type === '' ? 'btn-bleu' : 'btn-fantome' ?> btn-petit" href="<?= e(url('/admin/demandes')) ?>">Toutes</a>
  <?php foreach (TYPES_DEMANDE as $k => $l): ?><a class="btn <?= $type === $k ? 'btn-bleu' : 'btn-fantome' ?> btn-petit" href="<?= e(url('/admin/demandes', ['type' => $k])) ?>"><?= e($l) ?></a><?php endforeach; ?>
</nav>
<section class="panneau">
  <?php if (!$lignes): ?>
    <p class="muted" style="margin:0">Aucune demande.</p>
  <?php else: ?>
    <div class="defilement">
      <table class="tableau tableau-cartes">
        <thead><tr><th>Contact</th><th>Demande</th><th>Reçue le</th><th class="tableau-actions"></th></tr></thead>
        <tbody>
          <?php foreach ($lignes as $d): $details = json_decode((string) $d['details'], true) ?: []; ?>
            <tr<?= $d['traitee'] ? ' style="opacity:.6"' : '' ?>>
              <td data-label="Contact"><strong><?= e($d['nom']) ?></strong><?= $d['organisation'] ? ' — ' . e($d['organisation']) : '' ?><br><a href="mailto:<?= e($d['email']) ?>"><?= e($d['email']) ?></a><?= $d['telephone'] ? '<br><span class="muted">' . e($d['telephone']) . '</span>' : '' ?></td>
              <td data-label="Demande"><span class="pastille"><?= e(TYPES_DEMANDE[$d['type']] ?? $d['type']) ?></span> <?= e($d['formation_titre'] ?: $d['sujet']) ?>
                <?php if ($d['message']): ?><br><span class="muted"><?= nl2br(e(tronquer($d['message'], 400))) ?></span><?php endif; ?>
                <?php foreach ($details as $k => $v): if ($v === '' || $v === []) continue; ?><br><span class="muted"><?= e(ucfirst($k)) ?> : <?= e(is_array($v) ? implode(', ', $v) : $v) ?></span><?php endforeach; ?>
              </td>
              <td data-label="Reçue le"><?= e(date_fr($d['cree_le'], false, true)) ?></td>
              <td class="tableau-actions"><form method="post" action="<?= e(url('/admin/demandes/' . $d['id'] . '/traitee')) ?>"><?= champ_csrf() ?><button class="btn btn-fantome btn-petit" type="submit"><?= $d['traitee'] ? 'Rouvrir' : 'Marquer traitée' ?></button></form></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  <?php endif; ?>
</section>

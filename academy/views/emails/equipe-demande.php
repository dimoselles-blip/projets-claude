<?php defined('DTA') || exit; ?>
<h1 style="font-size:20px;margin:0 0 12px;"><?= e($type) ?></h1>
<p><strong><?= e($v['nom']) ?></strong><?= !empty($v['organisation']) ? ' — ' . e($v['organisation']) : '' ?><br><?= e($v['email']) ?><?= !empty($v['telephone']) ? ' · ' . e($v['telephone']) : '' ?></p>
<?php if (!empty($v['sujet'])): ?><p>Sujet : <?= e($v['sujet']) ?></p><?php endif; ?>
<?php foreach ($details as $k => $val): if ($val === '' || $val === []) continue; ?><p><?= e(ucfirst($k)) ?> : <?= e(is_array($val) ? implode(', ', $val) : $val) ?></p><?php endforeach; ?>
<?php if (!empty($v['message'])): ?><p style="white-space:pre-line;background:#F7F9FC;padding:12px 14px;border-radius:10px;"><?= e($v['message']) ?></p><?php endif; ?>
<?= rendre_fichier(__DIR__ . '/_bouton.php', ['lien' => url_absolue('/admin/demandes'), 'texte' => 'Voir les demandes', 'couleur' => '#0074E4']) ?>

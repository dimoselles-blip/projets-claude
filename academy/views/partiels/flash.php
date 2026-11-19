<?php
defined('DTA') || exit;
$messages = flashs();
if (!$messages) {
    return;
}
$icones = ['succes' => 'valide-cercle', 'erreur' => 'alerte', 'info' => 'info'];
?>
<div class="flashs conteneur" role="status" aria-live="polite">
  <?php foreach ($messages as $m): ?>
    <div class="alerte alerte-<?= e($m['type']) ?>"><?= icone($icones[$m['type']] ?? 'info') ?><p><?= e($m['message']) ?></p></div>
  <?php endforeach; ?>
</div>

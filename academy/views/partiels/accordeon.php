<?php
/** Accordéon de questions (éléments natifs details/summary : accessibles au clavier). */
defined('DTA') || exit;
$questions ??= [];
?>
<div class="accordeon">
  <?php foreach ($questions as $q): ?>
    <details class="accordeon-item" data-reveler>
      <summary><span><?= e($q['question'] ?? $q['q']) ?></span><?= icone('chevron', 'ico accordeon-chevron') ?></summary>
      <div class="accordeon-reponse"><?= paragraphes($q['reponse'] ?? $q['r']) ?></div>
    </details>
  <?php endforeach; ?>
</div>

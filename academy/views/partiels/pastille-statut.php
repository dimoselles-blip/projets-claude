<?php
defined('DTA') || exit;
$classe = match ($statut) {
    'confirmee' => 'pastille-ok',
    'payee' => 'pastille-ok',
    'annulee' => 'pastille-ko',
    'partielle' => 'pastille-attente',
    default => 'pastille-attente',
};
?><span class="pastille <?= $classe ?>"><?= e(libelle_statut($statut)) ?></span>

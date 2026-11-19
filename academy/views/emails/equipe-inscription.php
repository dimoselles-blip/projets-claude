<?php defined('DTA') || exit; ?>
<h1 style="font-size:20px;margin:0 0 12px;">Nouvelle inscription</h1>
<p><strong><?= e($ins['nom']) ?></strong> — <?= e($ins['email']) ?> — WhatsApp : <?= e($ins['telephone']) ?></p>
<p>Formation : <strong><?= e($formation['titre']) ?></strong><br>
Session : <?= $session ? e(date_fr($session['date_debut'])) : 'à définir' ?><?= $ins['format'] ? ' · ' . e(FORMATS_SESSION[$ins['format']] ?? '') : '' ?><br>
Montant : <?= (int) $ins['montant_total'] === 0 ? 'Gratuit' : e(prix((int) $ins['montant_total'])) ?><br>
Référence : <?= e($ins['reference']) ?> · Statut : <?= e(libelle_statut($ins['statut'])) ?></p>
<?= rendre_fichier(__DIR__ . '/_bouton.php', ['lien' => $lien_admin, 'texte' => 'Ouvrir dans l’administration', 'couleur' => '#0074E4']) ?>

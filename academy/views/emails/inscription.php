<?php
defined('DTA') || exit;
$gratuit = (int) $ins['montant_total'] === 0;
$prenom = explode(' ', trim($ins['nom']))[0];
?>
<h1 style="font-size:22px;margin:0 0 12px;">Bonjour <?= e($prenom) ?>,</h1>
<?php if ($gratuit): ?>
  <p>Votre place pour <strong><?= e($formation['titre']) ?></strong> est confirmée. Merci et à très bientôt !</p>
<?php else: ?>
  <p>Votre inscription à <strong><?= e($formation['titre']) ?></strong> est bien enregistrée. Prochaine étape : le paiement par Mobile Money (MTN, Moov ou Celtiis), en une ou plusieurs tranches.</p>
<?php endif; ?>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;border-radius:10px;margin:14px 0;font-size:14px;">
  <tr><td style="padding:12px 16px;color:#5C6478;">Référence</td><td style="padding:12px 16px;font-weight:bold;"><?= e($ins['reference']) ?></td></tr>
  <tr><td style="padding:0 16px 12px;color:#5C6478;">Session</td><td style="padding:0 16px 12px;"><?= $session ? e(date_fr($session['date_debut'], true)) . ($session['heure_debut'] ? ' à ' . e(heure_fr($session['heure_debut'])) : '') . ' · ' . e($session['format_label']) : 'Dates à venir : nous vous prévenons dès l’ouverture' ?></td></tr>
  <tr><td style="padding:0 16px 12px;color:#5C6478;">Montant</td><td style="padding:0 16px 12px;font-weight:bold;"><?= $gratuit ? 'Gratuit' : e(prix((int) $ins['montant_total'])) ?></td></tr>
</table>
<?php if (!$gratuit): ?>
  <p>Cliquez ci-dessous, choisissez votre opérateur, puis recevez les instructions de paiement sur WhatsApp. Votre inscription reste « En attente de paiement » jusqu’à validation par notre équipe.</p>
  <?= rendre_fichier(__DIR__ . '/_bouton.php', ['lien' => $lien_suivi, 'texte' => 'Finaliser mon paiement']) ?>
<?php endif; ?>
<p>Votre espace apprenant regroupe vos formations, les séances en direct, les replays et les supports :</p>
<?= rendre_fichier(__DIR__ . '/_bouton.php', ['lien' => $lien_espace, 'texte' => 'Accéder à mon espace', 'couleur' => '#0074E4']) ?>
<p style="font-size:13px;color:#5C6478;">Ce lien de connexion est personnel et valable 7 jours. Ensuite, demandez simplement un nouveau lien depuis la page « Espace apprenant ».</p>

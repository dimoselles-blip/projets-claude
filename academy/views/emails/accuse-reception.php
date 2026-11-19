<?php defined('DTA') || exit; $prenom = explode(' ', trim($nom))[0]; ?>
<h1 style="font-size:22px;margin:0 0 12px;">Merci <?= e($prenom) ?> !</h1>
<p>Nous avons bien reçu <?= e($objet) ?>. Notre équipe vous répond rapidement, par e-mail ou sur WhatsApp.</p>
<p>En attendant, découvrez nos formations :</p>
<?= rendre_fichier(__DIR__ . '/_bouton.php', ['lien' => url_absolue('/formations'), 'texte' => 'Voir les formations', 'couleur' => '#0074E4']) ?>
<p>L’équipe DIMO Tech Academy</p>

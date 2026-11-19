<?php defined('DTA') || exit; $prenom = explode(' ', trim($nom))[0]; ?>
<h1 style="font-size:22px;margin:0 0 12px;">Bonjour <?= e($prenom) ?>,</h1>
<p>Voici votre lien pour accéder à votre espace apprenant DIMO Tech Academy :</p>
<?= rendre_fichier(__DIR__ . '/_bouton.php', ['lien' => $lien, 'texte' => 'Me connecter', 'couleur' => '#0074E4']) ?>
<p style="font-size:13px;color:#5C6478;">Ce lien est valable 1 heure et ne fonctionne qu’une fois. Si vous n’avez rien demandé, ignorez simplement cet e-mail.</p>

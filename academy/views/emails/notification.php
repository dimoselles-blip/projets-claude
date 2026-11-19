<?php defined('DTA') || exit; $prenom = explode(' ', trim($nom))[0]; ?>
<h1 style="font-size:22px;margin:0 0 12px;"><?= e($titre) ?></h1>
<p>Bonjour <?= e($prenom) ?>,</p>
<p><?= nl2br(e($message)) ?></p>
<?php if (!empty($lien)): ?><?= rendre_fichier(__DIR__ . '/_bouton.php', ['lien' => $lien, 'texte' => 'Ouvrir mon espace', 'couleur' => '#0074E4']) ?><?php endif; ?>
<p>L’équipe DIMO Tech Academy</p>

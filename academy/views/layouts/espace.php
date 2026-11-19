<?php
/** Espace apprenant : mise en page du site + barre de navigation de l'espace. */
defined('DTA') || exit;
$u = utilisateur();
$chemin = Routeur::chemin_courant();
ob_start();
?>
<nav class="espace-barre" aria-label="Espace apprenant">
  <div class="conteneur">
    <a href="<?= e(url('/espace')) ?>"<?= $chemin === '/espace' ? ' aria-current="page"' : '' ?>><?= icone('tableau-bord') ?>Tableau de bord</a>
    <a href="<?= e(url('/espace/profil')) ?>"<?= $chemin === '/espace/profil' ? ' aria-current="page"' : '' ?>><?= icone('utilisateur') ?>Mon profil</a>
    <?php if (($u['role'] ?? '') === 'admin'): ?><a href="<?= e(url('/admin')) ?>"><?= icone('reglages') ?>Administration</a><?php endif; ?>
    <form method="post" action="<?= e(url('/espace/deconnexion')) ?>">
      <?= champ_csrf() ?>
      <button type="submit"><?= icone('deconnexion') ?>Déconnexion</button>
    </form>
  </div>
</nav>
<?= $contenu ?>
<?php
$contenu = (string) ob_get_clean();
include RACINE . '/views/layouts/site.php';

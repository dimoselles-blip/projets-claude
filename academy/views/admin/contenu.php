<?php defined('DTA') || exit; ?>
<div class="admin-entete">
  <div><h1>Fichier de contenu</h1><p>Tout le contenu éditorial (catégories, formations et modules, sessions, formateurs, témoignages, compteurs, FAQ) tient dans un seul fichier JSON : <code>contenu/catalogue.json</code>.</p></div>
</div>
<div class="grille-admin">
  <section class="panneau">
    <h2>Exporter</h2>
    <p class="muted">Téléchargez le contenu actuel de la plateforme : sauvegarde, relecture ou modification hors ligne.</p>
    <a class="btn btn-bleu" href="<?= e(url('/admin/contenu/export')) ?>"><?= icone('telecharger') ?>Télécharger catalogue.json</a>
  </section>
  <section class="panneau">
    <h2>Importer</h2>
    <p class="muted">L’import ajoute les éléments nouveaux et met à jour les existants (reconnus par leur identifiant ou leur nom). Il ne supprime rien et ne touche ni aux inscriptions ni aux paiements.</p>
    <form class="formulaire" method="post" action="<?= e(url('/admin/contenu/import')) ?>" enctype="multipart/form-data">
      <?= champ_csrf() ?>
      <div class="champ"><label for="c-fichier">Fichier JSON</label><input id="c-fichier" type="file" name="fichier" accept="application/json,.json"></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <button class="btn btn-corail" type="submit">Importer ce fichier</button>
      </div>
    </form>
    <form method="post" action="<?= e(url('/admin/contenu/import')) ?>" style="margin-top:12px" data-confirmer="Réimporter contenu/catalogue.json présent sur le serveur ?">
      <?= champ_csrf() ?><input type="hidden" name="source" value="serveur">
      <button class="btn btn-fantome btn-petit" type="submit">Réimporter le fichier du serveur (contenu/catalogue.json)</button>
    </form>
  </section>
</div>

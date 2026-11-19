<?php
defined('DTA') || exit;
$lecon = null;
foreach ($lecons as $l) {
    if ((int) $l['id'] === $edition) {
        $lecon = $l;
    }
}
$moduleEdite = null;
foreach ($modules as $m) {
    if ((int) $m['id'] === $editionModule) {
        $moduleEdite = $m;
    }
}
$nomsModules = array_column($modules, 'titre', 'id');
$type = $lecon['type'] ?? 'video';
$iconesType = ['video' => 'video', 'direct' => 'direct', 'document' => 'fichier', 'lien' => 'lien'];
?>
<style>
  .form-lecon:has(input[name="type"][value="video"]:checked) [data-si-type~="video"],
  .form-lecon:has(input[name="type"][value="direct"]:checked) [data-si-type~="direct"],
  .form-lecon:has(input[name="type"][value="document"]:checked) [data-si-type~="document"],
  .form-lecon:has(input[name="type"][value="lien"]:checked) [data-si-type~="lien"] { display: grid; }
</style>
<div class="admin-entete">
  <div>
    <p class="surtitre" style="margin-bottom:6px"><a href="<?= e(url('/admin/formations/' . $f['id'])) ?>" style="text-decoration:none"><?= icone('fleche-gauche') ?> Fiche de la formation</a></p>
    <h1>Contenus — <?= e($f['titre']) ?></h1>
    <p>Les modules structurent la fiche publique et l’espace apprenant. Les vidéos, séances en direct, replays et supports ne sont visibles que par les inscrits ayant accès.</p>
  </div>
  <div class="actions"><a class="btn btn-fantome btn-petit" href="<?= e(url('/espace/formations/' . $f['slug'])) ?>" target="_blank" rel="noopener"><?= icone('oeil') ?>Voir comme un apprenant</a></div>
</div>

<div class="contenus-grille">
  <section class="panneau" id="modules">
    <h2>Modules (programme)</h2>
    <?php if ($modules): ?>
      <ul class="liste-admin" style="margin-bottom:16px">
        <?php foreach ($modules as $m): ?>
          <li>
            <span><strong><?= e(($m['code'] ? $m['code'] . ' · ' : '') . $m['titre']) ?></strong><?php if ($m['description']): ?><br><span class="muted"><?= e($m['description']) ?></span><?php endif; ?></span>
            <span class="tableau-actions">
              <a class="btn-lien" href="<?= e(url('/admin/formations/' . $f['id'] . '/contenus', ['module' => $m['id']])) ?>#modules">Modifier</a>
              <form method="post" action="<?= e(url('/admin/modules/' . $m['id'] . '/supprimer')) ?>" data-confirmer="Supprimer ce module ? Ses contenus seront conservés."><?= champ_csrf() ?><button class="btn-lien" type="submit">Supprimer</button></form>
            </span>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php else: ?>
      <p class="muted">Aucun module.</p>
    <?php endif; ?>
    <form class="formulaire" method="post" action="<?= e(url('/admin/formations/' . $f['id'] . '/modules')) ?>" style="border-top:1px solid var(--ligne);padding-top:16px">
      <?= champ_csrf() ?>
      <input type="hidden" name="module_id" value="<?= (int) ($moduleEdite['id'] ?? 0) ?>">
      <h3 style="margin:0"><?= $moduleEdite ? 'Modifier le module' : 'Ajouter un module' ?></h3>
      <div class="grille-2">
        <div class="champ"><label for="m-code">Code</label><input id="m-code" name="code" value="<?= e($moduleEdite['code'] ?? 'M' . (count($modules) + 1)) ?>" maxlength="10"></div>
        <div class="champ"><label for="m-ordre">Ordre</label><input id="m-ordre" name="ordre" inputmode="numeric" value="<?= e($moduleEdite['ordre'] ?? count($modules)) ?>"></div>
      </div>
      <div class="champ"><label for="m-titre">Titre</label><input id="m-titre" name="titre" required value="<?= e($moduleEdite['titre'] ?? '') ?>"></div>
      <div class="champ"><label for="m-desc">Contenu (facultatif)</label><input id="m-desc" name="description" value="<?= e($moduleEdite['description'] ?? '') ?>" placeholder="Ex. : Tableaux croisés, formules clés."></div>
      <div><button class="btn btn-bleu btn-petit" type="submit"><?= $moduleEdite ? 'Enregistrer le module' : 'Ajouter le module' ?></button><?php if ($moduleEdite): ?> <a class="btn-lien" href="<?= e(url('/admin/formations/' . $f['id'] . '/contenus')) ?>">Annuler</a><?php endif; ?></div>
    </form>
  </section>

  <section class="panneau" id="lecons">
    <h2>Vidéos, directs, replays et supports</h2>
    <?php if ($lecons): ?>
      <div>
        <?php foreach ($lecons as $l): ?>
          <div class="element-contenu">
            <span style="display:flex;gap:10px"><?= icone($iconesType[$l['type']] ?? 'point') ?>
              <span><strong><?= e($l['titre']) ?></strong><?= $l['publie'] ? '' : ' <span class="pastille">Masqué</span>' ?><br>
                <span class="muted" style="font-size:.85rem">
                  <?= e(TYPES_LECON[$l['type']] ?? '') ?>
                  <?= $l['module_id'] ? ' · ' . e($nomsModules[$l['module_id']] ?? '') : ' · Sans module' ?>
                  <?= $l['date_direct'] ? ' · ' . e(date_heure_fr($l['date_direct'])) : '' ?>
                  <?= $l['type'] === 'direct' && $l['video_url'] ? ' · replay publié' : '' ?>
                  <?= $l['fichier_nom'] ? ' · ' . e($l['fichier_nom']) : '' ?>
                </span>
              </span>
            </span>
            <span class="tableau-actions">
              <a class="btn-lien" href="<?= e(url('/admin/formations/' . $f['id'] . '/contenus', ['lecon' => $l['id']])) ?>#lecon">Modifier</a>
              <form method="post" action="<?= e(url('/admin/lecons/' . $l['id'] . '/supprimer')) ?>" data-confirmer="Supprimer ce contenu ?"><?= champ_csrf() ?><button class="btn-lien" type="submit">Supprimer</button></form>
            </span>
          </div>
        <?php endforeach; ?>
      </div>
    <?php else: ?>
      <p class="muted">Aucun contenu pour le moment.</p>
    <?php endif; ?>
  </section>
</div>

<section class="panneau" id="lecon">
  <h2><?= $lecon ? 'Modifier « ' . e($lecon['titre']) . ' »' : 'Ajouter un contenu' ?></h2>
  <form class="formulaire form-lecon" method="post" action="<?= e(url('/admin/formations/' . $f['id'] . '/lecons')) ?>" enctype="multipart/form-data">
    <?= champ_csrf() ?>
    <input type="hidden" name="lecon_id" value="<?= (int) ($lecon['id'] ?? 0) ?>">
    <fieldset>
      <legend>Type de contenu</legend>
      <div class="type-lecon">
        <?php foreach (TYPES_LECON as $k => $libelle): ?>
          <label class="option-carte"><input type="radio" name="type" value="<?= e($k) ?>"<?= $type === $k ? ' checked' : '' ?>><span><strong><?= icone($iconesType[$k]) ?></strong><?= e($libelle) ?></span></label>
        <?php endforeach; ?>
      </div>
    </fieldset>
    <div class="champ"><label for="l-titre">Titre</label><input id="l-titre" name="titre" required value="<?= e($lecon['titre'] ?? '') ?>"></div>
    <div class="grille-2">
      <div class="champ"><label for="l-module">Module</label>
        <select id="l-module" name="module_id"><option value="">Sans module</option><?php foreach ($modules as $m): ?><option value="<?= (int) $m['id'] ?>"<?= (int) ($lecon['module_id'] ?? 0) === (int) $m['id'] ? ' selected' : '' ?>><?= e(($m['code'] ? $m['code'] . ' · ' : '') . $m['titre']) ?></option><?php endforeach; ?></select>
      </div>
      <div class="champ"><label for="l-session">Réservé à une cohorte (facultatif)</label>
        <select id="l-session" name="session_id"><option value="">Tous les inscrits</option><?php foreach ($sessions as $s): ?><option value="<?= (int) $s['id'] ?>"<?= (int) ($lecon['session_id'] ?? 0) === (int) $s['id'] ? ' selected' : '' ?>>Session du <?= e(date_fr($s['date_debut'])) ?><?= $s['intitule'] ? ' — ' . e($s['intitule']) : '' ?></option><?php endforeach; ?></select>
      </div>
    </div>
    <div class="champ" data-si-type="direct"><label for="l-date">Date et heure du direct</label><input id="l-date" type="datetime-local" name="date_direct" value="<?= e(!empty($lecon['date_direct']) ? date('Y-m-d\TH:i', strtotime($lecon['date_direct'])) : '') ?>"></div>
    <div class="champ" data-si-type="direct"><label for="l-visio">Lien de la visio (Google Meet, Zoom…)</label><input id="l-visio" type="url" name="lien_visio" placeholder="https://" value="<?= e($lecon['lien_visio'] ?? '') ?>"><small class="aide">Visible par les apprenants <?= (int) reglage('delai_lien_visio') ?> h avant le début.</small></div>
    <div class="champ" data-si-type="video direct"><label for="l-video">Lien de la vidéo (ou du replay, après un direct)</label><input id="l-video" type="url" name="video_url" placeholder="https://youtu.be/…" value="<?= e($lecon['video_url'] ?? '') ?>"><small class="aide">YouTube en « non répertorié », Vimeo ou Google Drive (partage « toute personne disposant du lien »).</small></div>
    <div class="champ" data-si-type="lien"><label for="l-lien">Lien externe</label><input id="l-lien" type="url" name="lien_externe" placeholder="https://" value="<?= e($lecon['lien_externe'] ?? '') ?>"></div>
    <div class="champ" data-si-type="document video direct lien"><label for="l-fichier">Support téléchargeable <?= !empty($lecon['fichier_nom']) ? '(actuel : ' . e($lecon['fichier_nom']) . ')' : '' ?></label><input id="l-fichier" type="file" name="fichier"><small class="aide">PDF, PowerPoint, Word, Excel, CSV, ZIP, notebook… Le fichier n’est accessible qu’aux inscrits.</small></div>
    <div class="champ"><label for="l-desc">Description (facultatif)</label><textarea id="l-desc" name="description" rows="3"><?= e($lecon['description'] ?? '') ?></textarea></div>
    <div class="grille-2">
      <div class="champ"><label for="l-duree">Durée en minutes (facultatif)</label><input id="l-duree" name="duree_min" inputmode="numeric" value="<?= e($lecon['duree_min'] ?? '') ?>"></div>
      <div class="champ"><label for="l-ordre">Ordre</label><input id="l-ordre" name="ordre" inputmode="numeric" value="<?= e($lecon['ordre'] ?? count($lecons)) ?>"></div>
    </div>
    <label class="case"><input type="checkbox" name="publie" value="1"<?= ($lecon['publie'] ?? 1) ? ' checked' : '' ?>><span>Visible par les apprenants</span></label>
    <label class="case"><input type="checkbox" name="prevenir" value="1"<?= $lecon ? '' : ' checked' ?>><span>Prévenir les apprenants concernés (e-mail et notification)</span></label>
    <div><button class="btn btn-corail" type="submit"><?= $lecon ? 'Enregistrer' : 'Ajouter le contenu' ?></button><?php if ($lecon): ?> <a class="btn-lien" href="<?= e(url('/admin/formations/' . $f['id'] . '/contenus')) ?>">Annuler</a><?php endif; ?></div>
  </form>
</section>

<?php
defined('DTA') || exit;
/** @var array $r */
$ligne ??= [];
$valeurBrute = fn(string $nom, mixed $defaut = '') => array_key_exists($nom, $ligne ?? []) ? $ligne[$nom] : $defaut;
$ouvert = false;
$action = $id ? url('/admin/' . $r['nom'] . '/' . $id . '/enregistrer') : url('/admin/' . $r['nom'] . '/enregistrer');
?>
<div class="admin-entete">
  <div>
    <p class="surtitre" style="margin-bottom:6px"><a href="<?= e(url('/admin/' . $r['nom'])) ?>" style="text-decoration:none"><?= icone('fleche-gauche') ?> <?= e($r['titre']) ?></a></p>
    <h1><?= $id ? 'Modifier' : 'Ajouter' ?> <?= e($r['singulier']) ?></h1>
  </div>
  <?php if ($id && $r['nom'] === 'formations'): ?>
    <div class="actions">
      <a class="btn btn-bleu btn-petit" href="<?= e(url('/admin/formations/' . $id . '/contenus')) ?>"><?= icone('couches') ?>Modules et contenus</a>
      <a class="btn btn-fantome btn-petit" href="<?= e(url('/formations/' . ($ligne['slug'] ?? ''))) ?>" target="_blank" rel="noopener"><?= icone('externe') ?>Voir la fiche</a>
    </div>
  <?php endif; ?>
</div>

<form class="form-admin" method="post" action="<?= e($action) ?>" enctype="multipart/form-data">
  <?= champ_csrf() ?>
  <?php foreach ($r['champs'] as $c): ?>
    <?php if (isset($c['groupe'])): ?>
      <?php if ($ouvert): ?></fieldset><?php endif; $ouvert = true; ?>
      <fieldset><legend><?= e($c['groupe']) ?></legend>
      <?php continue; endif; ?>
    <?php
      if (!$ouvert) { echo '<fieldset>'; $ouvert = true; }
      [$nom, $libelle, $type] = $c;
      $o = $c[3] ?? [];
      $val = $valeurBrute($nom, $id ? null : ($o['defaut'] ?? null));
      $idc = 'champ-' . $nom;
      $requis = !empty($o['requis']) ? ' required' : '';
    ?>
    <?php if ($type === 'checkbox'): ?>
      <label class="case"><input type="checkbox" name="<?= e($nom) ?>" value="1"<?= $val ? ' checked' : '' ?>><span><strong><?= e($libelle) ?></strong><?php if (!empty($o['aide'])): ?><br><?= e($o['aide']) ?><?php endif; ?></span></label>
    <?php else: ?>
      <div class="champ">
        <label for="<?= e($idc) ?>"><?= e($libelle) ?><?= $requis ? ' *' : '' ?></label>
        <?php switch ($type):
          case 'textarea': ?>
            <textarea id="<?= e($idc) ?>" name="<?= e($nom) ?>" rows="<?= (int) ($o['lignes'] ?? 4) ?>"<?= $requis ?><?= isset($o['max']) ? ' maxlength="' . (int) $o['max'] . '"' : '' ?>><?= e($val) ?></textarea>
            <?php break;
          case 'liste':
            $txt = is_string($val) && ($d = json_decode($val, true)) !== null && is_array($d) ? implode("\n", $d) : (string) $val; ?>
            <textarea id="<?= e($idc) ?>" name="<?= e($nom) ?>" rows="5"<?= $requis ?>><?= e($txt) ?></textarea>
            <?php break;
          case 'faq':
            $d = is_string($val) ? json_decode($val, true) : null;
            $txt = is_array($d) ? implode("\n\n", array_map(fn($q) => ($q['q'] ?? '') . "\n" . ($q['r'] ?? ''), $d)) : (string) $val; ?>
            <textarea id="<?= e($idc) ?>" name="<?= e($nom) ?>" rows="7" placeholder="Question ?&#10;Réponse.&#10;&#10;Autre question ?&#10;Autre réponse."><?= e($txt) ?></textarea>
            <?php break;
          case 'select': ?>
            <select id="<?= e($idc) ?>" name="<?= e($nom) ?>"<?= $requis ?>>
              <?php if (empty($o['requis']) && !isset($o['defaut']) && $nom !== 'statut' && $nom !== 'mode' && $nom !== 'certification' && $nom !== 'niveau' && $nom !== 'format'): ?><option value="">—</option><?php endif; ?>
              <?php foreach ($o['options'] as $k => $l): ?><option value="<?= e($k) ?>"<?= (string) $val === (string) $k ? ' selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?>
            </select>
            <?php break;
          case 'relation':
            $options = DB::tous('SELECT id, `' . $o['libelle'] . '` AS l FROM `' . $o['table'] . '` ORDER BY l'); ?>
            <select id="<?= e($idc) ?>" name="<?= e($nom) ?>"<?= $requis ?>>
              <option value=""><?= e($o['vide'] ?? '— Choisir —') ?></option>
              <?php foreach ($options as $op): ?><option value="<?= (int) $op['id'] ?>"<?= (int) $val === (int) $op['id'] ? ' selected' : '' ?>><?= e($op['l']) ?></option><?php endforeach; ?>
            </select>
            <?php break;
          case 'multicheck':
            $choisis = is_array($val) ? $val : (json_decode((string) $val, true) ?: []); ?>
            <div class="multicheck">
              <?php foreach ($o['options'] as $k => $l): ?><label class="case"><input type="checkbox" name="<?= e($nom) ?>[]" value="<?= e($k) ?>"<?= in_array($k, $choisis, true) ? ' checked' : '' ?>><span><?= e($l) ?></span></label><?php endforeach; ?>
            </div>
            <?php break;
          case 'image': ?>
            <?php if ($val): ?><div class="apercu-image"><img src="<?= e(media($val)) ?>" alt=""><label class="case"><input type="checkbox" name="<?= e($nom) ?>_supprimer" value="1"><span>Supprimer l’image</span></label></div><?php endif; ?>
            <input id="<?= e($idc) ?>" type="file" name="<?= e($nom) ?>" accept="image/jpeg,image/png,image/webp">
            <small class="aide">JPG, PNG ou WebP. L’image est automatiquement compressée au format WebP.</small>
            <?php break;
          case 'slug': ?>
            <input id="<?= e($idc) ?>" name="<?= e($nom) ?>" value="<?= e($val) ?>" pattern="[a-z0-9\-]*"<?= !empty($o['verrouille']) && $id ? ' readonly' : '' ?>>
            <?php break;
          case 'number': ?>
            <input id="<?= e($idc) ?>" type="text" inputmode="numeric" name="<?= e($nom) ?>" value="<?= e($val) ?>"<?= $requis ?>>
            <?php break;
          default:
            $types = ['url' => 'url', 'email' => 'email', 'date' => 'date', 'time' => 'time']; ?>
            <input id="<?= e($idc) ?>" type="<?= e($types[$type] ?? 'text') ?>" name="<?= e($nom) ?>" value="<?= e($type === 'time' && $val ? substr((string) $val, 0, 5) : $val) ?>"<?= $requis ?><?= isset($o['max']) ? ' maxlength="' . (int) $o['max'] . '"' : '' ?><?= $type === 'url' ? ' placeholder="https://"' : '' ?>>
        <?php endswitch; ?>
        <?php if (!empty($o['aide']) && $type !== 'checkbox'): ?><small class="aide"><?= e($o['aide']) ?></small><?php endif; ?>
      </div>
    <?php endif; ?>
  <?php endforeach; ?>
  <?php if ($ouvert): ?></fieldset><?php endif; ?>

  <div class="barre-enregistrer">
    <button class="btn btn-corail" type="submit">Enregistrer</button>
    <button class="btn btn-fantome" type="submit" name="_continuer" value="1">Enregistrer et continuer</button>
    <a class="btn-lien" href="<?= e(url('/admin/' . $r['nom'])) ?>">Annuler</a>
  </div>
</form>

<?php if ($id && empty($r['sans_suppression'])): ?>
  <form method="post" action="<?= e(url('/admin/' . $r['nom'] . '/' . $id . '/supprimer')) ?>" data-confirmer="Supprimer définitivement cet élément ?" style="margin-top:24px">
    <?= champ_csrf() ?>
    <button class="btn btn-fantome btn-petit" type="submit"><?= icone('corbeille') ?>Supprimer</button>
  </form>
<?php endif; ?>

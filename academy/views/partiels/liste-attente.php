<?php
/** « Dates à venir » + formulaire de liste d'attente. */
defined('DTA') || exit;
$formationId ??= null;
$retour ??= '/sessions';
$titre ??= 'Dates à venir';
$texte ??= 'Les prochaines dates sont en préparation. Laissez vos coordonnées : nous vous prévenons dès l’ouverture des inscriptions.';
$id = 'attente-' . substr(md5($retour . $formationId), 0, 6);
?>
<div class="attente carte" data-reveler>
  <div class="attente-texte">
    <span class="attente-icone"><?= icone('calendrier') ?></span>
    <h3><?= e($titre) ?></h3>
    <p><?= e($texte) ?></p>
  </div>
  <form class="formulaire attente-form" method="post" action="<?= e(url('/liste-attente')) ?>" data-form-ajax>
    <?= champ_csrf() ?>
    <?= champ_piege() ?>
    <input type="hidden" name="retour" value="<?= e($retour) ?>">
    <div class="grille-2">
      <div class="champ"><label for="<?= $id ?>-nom">Nom</label><input id="<?= $id ?>-nom" name="nom" autocomplete="name" required><small class="erreur-champ" data-erreur-pour="nom"></small></div>
      <div class="champ"><label for="<?= $id ?>-email">E-mail</label><input id="<?= $id ?>-email" name="email" type="email" autocomplete="email" required><small class="erreur-champ" data-erreur-pour="email"></small></div>
    </div>
    <div class="grille-2">
      <div class="champ"><label for="<?= $id ?>-tel">WhatsApp (facultatif)</label><input id="<?= $id ?>-tel" name="telephone" type="tel" autocomplete="tel" inputmode="tel"></div>
      <?php if ($formationId): ?>
        <input type="hidden" name="formation_id" value="<?= (int) $formationId ?>">
      <?php else: ?>
        <div class="champ"><label for="<?= $id ?>-formation">Formation qui vous intéresse</label>
          <select id="<?= $id ?>-formation" name="formation_id">
            <option value="">Toutes les formations</option>
            <?php foreach (formations_options() as $o): ?><option value="<?= (int) $o['id'] ?>"><?= e($o['titre']) ?></option><?php endforeach; ?>
          </select>
        </div>
      <?php endif; ?>
    </div>
    <label class="case"><input type="checkbox" name="consentement" value="1" required><span>J’accepte d’être recontacté(e) au sujet des prochaines sessions (<a href="<?= e(url('/confidentialite')) ?>">confidentialité</a>).</span></label>
    <small class="erreur-champ" data-erreur-pour="consentement"></small>
    <p class="alerte" data-message-formulaire hidden></p>
    <button class="btn btn-bleu" type="submit">Me prévenir des prochaines dates</button>
  </form>
</div>

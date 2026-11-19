<?php
/**
 * Formulaire d'inscription (fenêtre et page /inscription).
 * $formation : formation présélectionnée (ou null) ; $sessions : sessions ouvertes de cette formation.
 */
defined('DTA') || exit;
$formation ??= null;
$sessions ??= [];
$sessionChoisie ??= 0;
$prefixe ??= 'ins';
$u = utilisateur();
$groupes = [];
foreach (formations_options() as $o) {
    $groupes[$o['categorie']][] = $o;
}
$valeur = fn(string $c, string $d = '') => ancienne($c, $d);
$slugChoisi = $valeur('formation', $formation['slug'] ?? '');
?>
<form class="formulaire form-inscription" method="post" action="<?= e(url('/inscription')) ?>" data-form-inscription novalidate>
  <?= champ_csrf() ?>
  <?= champ_piege() ?>
  <div class="champ">
    <label for="<?= $prefixe ?>-formation">Formation</label>
    <select id="<?= $prefixe ?>-formation" name="formation" required data-champ-formation>
      <option value="">Choisissez une formation</option>
      <?php foreach ($groupes as $cat => $liste): ?>
        <optgroup label="<?= e($cat) ?>">
          <?php foreach ($liste as $o): ?>
            <option value="<?= e($o['slug']) ?>"<?= $o['slug'] === $slugChoisi ? ' selected' : '' ?>><?= e($o['titre']) ?> — <?= (int) $o['prix'] === 0 ? 'Gratuit' : e(prix((int) ($o['prix_en_ligne'] !== null ? min($o['prix'], $o['prix_en_ligne']) : $o['prix']))) ?></option>
          <?php endforeach; ?>
        </optgroup>
      <?php endforeach; ?>
    </select>
    <small class="erreur-champ" data-erreur-pour="formation"></small>
  </div>

  <fieldset class="champ choix-format" data-bloc-format<?= ($formation['choix_format'] ?? false) ? '' : ' hidden' ?>>
    <legend>Format souhaité</legend>
    <div class="options-format">
      <label class="option-carte">
        <input type="radio" name="format" value="presentiel"<?= $valeur('format') === 'presentiel' ? ' checked' : '' ?>>
        <span><strong>Présentiel</strong><small>Au siège d’Akpakpa (Cotonou)</small><em data-prix-format="presentiel"><?= $formation ? e(prix($formation['prix'])) : '' ?></em></span>
      </label>
      <label class="option-carte">
        <input type="radio" name="format" value="en_ligne"<?= $valeur('format') === 'en_ligne' ? ' checked' : '' ?>>
        <span><strong>En ligne</strong><small>En direct, depuis chez vous</small><em data-prix-format="en_ligne"><?= $formation ? e(prix($formation['prix_en_ligne'] ?? $formation['prix'])) : '' ?></em></span>
      </label>
    </div>
    <small class="erreur-champ" data-erreur-pour="format"></small>
  </fieldset>

  <div class="champ" data-bloc-session>
    <label for="<?= $prefixe ?>-session">Session</label>
    <select id="<?= $prefixe ?>-session" name="session_id" data-champ-session>
      <?php if ($sessions): ?>
        <?php foreach ($sessions as $s): ?>
          <option value="<?= (int) $s['id'] ?>"<?= (int) $s['id'] === (int) $sessionChoisie ? ' selected' : '' ?>><?= e(date_fr($s['date_debut'], true)) ?> · <?= e($s['format_label']) ?><?= $s['places_restantes'] !== null ? ' · ' . e(pluriel($s['places_restantes'], 'place restante', 'places restantes')) : '' ?></option>
        <?php endforeach; ?>
        <option value="">Une date ultérieure (me prévenir)</option>
      <?php else: ?>
        <option value="">Prochaine session — dates à venir</option>
      <?php endif; ?>
    </select>
    <small class="aide" data-aide-session><?= $formation && !$sessions ? 'Les dates ne sont pas encore fixées : votre inscription vous réserve une place et nous vous prévenons dès l’ouverture.' : '' ?></small>
    <small class="erreur-champ" data-erreur-pour="session_id"></small>
  </div>

  <div class="champ">
    <label for="<?= $prefixe ?>-nom">Nom complet</label>
    <input id="<?= $prefixe ?>-nom" name="nom" autocomplete="name" required maxlength="120" value="<?= e($valeur('nom', $u['nom'] ?? '')) ?>">
    <small class="erreur-champ" data-erreur-pour="nom"></small>
  </div>
  <div class="grille-2">
    <div class="champ">
      <label for="<?= $prefixe ?>-email">E-mail</label>
      <input id="<?= $prefixe ?>-email" name="email" type="email" autocomplete="email" inputmode="email" required value="<?= e($valeur('email', $u['email'] ?? '')) ?>">
      <small class="erreur-champ" data-erreur-pour="email"></small>
    </div>
    <div class="champ">
      <label for="<?= $prefixe ?>-tel">Téléphone WhatsApp</label>
      <input id="<?= $prefixe ?>-tel" name="telephone" type="tel" autocomplete="tel" inputmode="tel" required placeholder="Avec l’indicatif hors Bénin" value="<?= e($valeur('telephone', $u['telephone'] ?? '')) ?>">
      <small class="erreur-champ" data-erreur-pour="telephone"></small>
    </div>
  </div>

  <div class="recap-prix" data-recap aria-live="polite">
    <span>Montant</span>
    <strong data-recap-montant><?= $formation ? e($formation['gratuite'] ? 'Gratuit' : prix($formation['prix'])) : '—' ?></strong>
    <small data-recap-detail><?= $formation && !$formation['gratuite'] ? 'Mobile Money (MTN, Moov, Celtiis) · paiement en plusieurs tranches possible' : ($formation ? 'Aucun paiement : votre place est confirmée immédiatement.' : '') ?></small>
  </div>

  <label class="case">
    <input type="checkbox" name="consentement" value="1" required<?= $valeur('consentement') ? ' checked' : '' ?>>
    <span>J’accepte que DIMO Tech Academy utilise ces informations pour traiter mon inscription et me contacter (<a href="<?= e(url('/confidentialite')) ?>" target="_blank">confidentialité</a>).</span>
  </label>
  <small class="erreur-champ" data-erreur-pour="consentement"></small>

  <p class="alerte alerte-erreur" data-erreur-globale hidden></p>
  <button type="submit" class="btn btn-corail btn-large btn-bloc" data-bouton-inscription>Valider mon inscription</button>
</form>

<?php defined('DTA') || exit; $seuil = (int) reglage('seuil_acces_tranches'); ?>
<div class="admin-entete">
  <div><h1>Réglages</h1><p>Règles de la plateforme modifiables sans toucher au code. Les numéros, adresses e-mail, réseaux sociaux et clés de paiement se règlent dans <code>config/config.php</code>.</p></div>
</div>
<form class="form-admin" method="post" action="<?= e(url('/admin/reglages')) ?>">
  <?= champ_csrf() ?>
  <fieldset>
    <legend>Paiement et accès aux contenus</legend>
    <div class="champ">
      <label for="r-seuil">Paiement en plusieurs tranches : ouvrir les contenus à partir de</label>
      <select id="r-seuil" name="seuil_acces_tranches">
        <?php foreach ([0 => 'La première tranche validée', 25 => '25 % du montant payé', 30 => '30 % du montant payé', 50 => '50 % du montant payé', 75 => '75 % du montant payé', 100 => 'Le paiement complet'] as $k => $l): ?>
          <option value="<?= $k ?>"<?= $seuil === $k ? ' selected' : '' ?>><?= e($l) ?></option>
        <?php endforeach; ?>
      </select>
      <small class="aide">Une inscription au statut « Confirmée » a toujours accès aux contenus.</small>
    </div>
    <div class="champ">
      <label for="r-visio">Le lien visio d’une séance en direct apparaît</label>
      <select id="r-visio" name="delai_lien_visio"><?php foreach ([1, 2, 6, 12, 24, 48] as $h): ?><option value="<?= $h ?>"<?= (int) reglage('delai_lien_visio') === $h ? ' selected' : '' ?>><?= $h ?> h avant le début</option><?php endforeach; ?></select>
    </div>
  </fieldset>
  <fieldset>
    <legend>Affichage</legend>
    <div class="champ">
      <label for="r-prix">Prix des formules entreprises</label>
      <select id="r-prix" name="prix_entreprises">
        <option value="formules"<?= reglage('prix_entreprises') !== 'devis' ? ' selected' : '' ?>>Afficher les prix des formules (catalogue 2026)</option>
        <option value="devis"<?= reglage('prix_entreprises') === 'devis' ? ' selected' : '' ?>>Afficher « Sur devis »</option>
      </select>
    </div>
    <label class="case"><input type="checkbox" name="afficher_emplacements" value="1"<?= afficher_emplacements() ? ' checked' : '' ?>><span><strong>Afficher les emplacements « à remplacer »</strong><br>Cadres prévus pour les vraies photos, témoignages et membres de l’équipe. Décochez pour les masquer tant qu’ils sont vides.</span></label>
  </fieldset>
  <fieldset>
    <legend>Textes</legend>
    <div class="champ"><label for="r-cohorte">Phrase sur la première cohorte</label><input id="r-cohorte" name="phrase_cohorte" value="<?= e(reglage('phrase_cohorte')) ?>"><small class="aide">Sans chiffre inventé. Laisser vide pour la masquer.</small></div>
    <div class="champ"><label for="r-mot">Mot de la fondatrice (page À propos)</label><textarea id="r-mot" name="mot_fondatrice" rows="7"><?= e(reglage('mot_fondatrice')) ?></textarea><small class="aide">Séparez les paragraphes par une ligne vide.</small></div>
    <div class="champ"><label for="r-legal">Mentions légales : identité de l’éditeur</label><textarea id="r-legal" name="identite_legale" rows="4" placeholder="Forme juridique : …&#10;RCCM : …&#10;IFU : …&#10;Responsable de la publication : …"><?= e(reglage('identite_legale')) ?></textarea><small class="aide">Une information par ligne. Tant que ce champ est vide, la page Mentions légales affiche seulement le nom, le siège et le contact.</small></div>
  </fieldset>
  <div class="barre-enregistrer"><button class="btn btn-corail" type="submit">Enregistrer les réglages</button></div>
</form>

<section class="panneau" style="margin-top:24px">
  <h2>Fichier config/config.php</h2>
  <table class="tableau-simple">
    <tr><th scope="row">Adresse du site</th><td><?= e(cfg('site.url')) ?></td></tr>
    <tr><th scope="row">Numéro WhatsApp</th><td><?= cfg('contact.whatsapp') ? 'Renseigné (masqué dans les pages)' : '<strong>À renseigner</strong>' ?></td></tr>
    <tr><th scope="row">Numéros Mobile Money</th><td><?= cfg('paiement.afficher_numeros_etape_paiement') ? implode(', ', array_map(fn($op) => (cfg('paiement.mobile_money.' . $op . '.numero') ? '✓ ' : '— ') . strtoupper($op), OPERATEURS_MOBILE_MONEY)) : 'Jamais affichés : les instructions de paiement sont envoyées sur WhatsApp' ?></td></tr>
    <tr><th scope="row">E-mail de contact</th><td><?= e(cfg('contact.email')) ?></td></tr>
    <tr><th scope="row">Envoi des e-mails</th><td><?= e(['smtp' => 'SMTP', 'mail' => 'Fonction mail() de PHP', 'journal' => 'Journal (aucun envoi réel)'][cfg('email.mode')] ?? cfg('email.mode')) ?></td></tr>
    <tr><th scope="row">Réseaux sociaux</th><td><?= implode(', ', array_filter(['TikTok' => cfg('reseaux.tiktok'), 'Facebook' => cfg('reseaux.facebook'), 'LinkedIn' => cfg('reseaux.linkedin')], fn($v) => $v) ? array_keys(array_filter(['TikTok' => cfg('reseaux.tiktok'), 'Facebook' => cfg('reseaux.facebook'), 'LinkedIn' => cfg('reseaux.linkedin')])) : ['À renseigner']) ?></td></tr>
    <tr><th scope="row">FedaPay (phase 2)</th><td><?= fedapay_actif() ? 'Actif' : 'Inactif' ?></td></tr>
  </table>
  <form method="post" action="<?= e(url('/admin/email-test')) ?>" style="margin-top:14px"><?= champ_csrf() ?><button class="btn btn-fantome btn-petit" type="submit"><?= icone('mail') ?>M’envoyer un e-mail de test</button></form>
</section>

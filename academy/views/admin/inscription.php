<?php
defined('DTA') || exit;
$reste = reste_a_payer($ins);
$gratuit = (int) $ins['montant_total'] === 0;
$telWa = preg_replace('/\D/', '', $ins['telephone']) ?? '';
if ($telWa !== '' && strlen($telWa) <= 10 && !str_starts_with($ins['telephone'], '+')) {
    $telWa = '229' . $telWa; // numéro béninois saisi sans indicatif
}
$lienSuivi = url_absolue('/inscription/suivi/' . $ins['jeton_suivi']);
$seuil = (int) reglage('seuil_acces_tranches');
?>
<div class="admin-entete">
  <div>
    <p class="surtitre" style="margin-bottom:6px"><a href="<?= e(url('/admin/inscriptions')) ?>" style="text-decoration:none"><?= icone('fleche-gauche') ?> Inscriptions</a></p>
    <h1><?= e($ins['nom']) ?></h1>
    <p><?= e($ins['reference']) ?> · inscrit(e) le <?= e(date_heure_fr($ins['cree_le'])) ?></p>
  </div>
  <div class="actions"><?= partiel('pastille-statut', ['statut' => $ins['statut']]) ?></div>
</div>

<div class="grille-admin">
  <div>
    <section class="panneau">
      <h2>Inscription</h2>
      <table class="tableau-simple">
        <tr><th scope="row">Formation</th><td><a href="<?= e(url('/admin/formations/' . $ins['formation_id'])) ?>"><?= e($ins['formation_titre']) ?></a></td></tr>
        <tr><th scope="row">Session</th><td><?= $ins['date_debut'] ? e(date_fr($ins['date_debut'], true)) . ($ins['session_intitule'] ? ' — ' . e($ins['session_intitule']) : '') : 'À définir (liste d’attente de la formation)' ?></td></tr>
        <tr><th scope="row">Format</th><td><?= e(FORMATS_SESSION[$ins['format']] ?? 'Selon la formation') ?></td></tr>
        <tr><th scope="row">E-mail</th><td><a href="mailto:<?= e($ins['email']) ?>"><?= e($ins['email']) ?></a></td></tr>
        <tr><th scope="row">WhatsApp</th><td><?= e($ins['telephone']) ?><?php if ($telWa): ?> · <a href="https://wa.me/<?= e($telWa) ?>" target="_blank" rel="noopener">Écrire</a><?php endif; ?></td></tr>
        <tr><th scope="row">Moyen de paiement choisi</th><td><?= e(MOYENS_PAIEMENT[$ins['moyen_paiement']] ?? '—') ?></td></tr>
        <tr><th scope="row">Accès aux contenus</th><td><?= $acces ? '<strong>Ouvert</strong>' : 'Fermé' ?> <span class="muted">(règle : statut « Confirmée », ou <?= $seuil ?> % du montant payé)</span></td></tr>
      </table>
    </section>

    <?php if (!$gratuit): ?>
      <section class="panneau">
        <h2>Échéancier</h2>
        <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
          <div class="kpi"><span>Montant total</span><strong><?= e(prix((int) $ins['montant_total'])) ?></strong></div>
          <div class="kpi"><span>Reçu</span><strong><?= e(prix((int) $ins['montant_recu'])) ?></strong></div>
          <div class="kpi"><span>Reste à payer</span><strong><?= e(prix($reste)) ?></strong></div>
        </div>
        <?php if ($paiements): ?>
          <table class="tableau">
            <thead><tr><th>Date</th><th>Montant</th><th>Moyen</th><th>Référence</th><th></th></tr></thead>
            <tbody>
              <?php foreach ($paiements as $p): ?>
                <tr>
                  <td><?= e(date_fr($p['recu_le'] ?? $p['cree_le'], false, true)) ?><?= $p['statut'] !== 'valide' ? ' <span class="pastille">' . e($p['statut'] === 'en_attente' ? 'En cours' : 'Échoué') . '</span>' : '' ?></td>
                  <td><strong><?= e(prix((int) $p['montant'])) ?></strong></td>
                  <td><?= e(MOYENS_PAIEMENT[$p['moyen']] ?? $p['moyen']) ?></td>
                  <td><?= e($p['reference']) ?><?= $p['note'] ? '<br><span class="muted">' . e($p['note']) . '</span>' : '' ?><?= $p['admin_nom'] ? '<br><span class="muted">par ' . e($p['admin_nom']) . '</span>' : '' ?></td>
                  <td class="tableau-actions"><?php if ($p['fournisseur'] === 'fedapay' && $p['statut'] === 'en_attente' && $p['externe_id']): ?><form method="post" action="<?= e(url('/admin/inscriptions/' . $ins['id'] . '/paiement/' . $p['id'] . '/verifier')) ?>"><?= champ_csrf() ?><button class="btn-lien" type="submit">Vérifier auprès de FedaPay</button></form><?php endif; ?><form method="post" action="<?= e(url('/admin/inscriptions/' . $ins['id'] . '/paiement/' . $p['id'] . '/supprimer')) ?>" data-confirmer="Supprimer cette tranche ?"><?= champ_csrf() ?><button class="btn-lien" type="submit">Supprimer</button></form></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>

        <?php if ($ins['statut'] !== 'annulee' && $reste > 0): ?>
          <form class="formulaire" method="post" action="<?= e(url('/admin/inscriptions/' . $ins['id'] . '/paiement')) ?>" style="border-top:1px solid var(--ligne);padding-top:16px;margin-top:12px">
            <?= champ_csrf() ?>
            <h3 style="margin:0">Valider un paiement reçu</h3>
            <p class="muted" style="margin:0;font-size:.9rem">Après vérification sur votre compte Mobile Money. L’apprenant est prévenu automatiquement.</p>
            <div class="grille-2">
              <div class="champ"><label for="p-montant">Montant reçu (F CFA)</label><input id="p-montant" name="montant" inputmode="numeric" required value="<?= (int) $reste ?>"></div>
              <div class="champ"><label for="p-moyen">Moyen</label>
                <select id="p-moyen" name="moyen"><?php foreach (MOYENS_PAIEMENT as $k => $l): if ($k === 'fedapay') continue; ?><option value="<?= e($k) ?>"<?= ($ins['moyen_paiement'] ?: 'mtn') === $k ? ' selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select>
              </div>
            </div>
            <div class="grille-2">
              <div class="champ"><label for="p-ref">Référence de transaction</label><input id="p-ref" name="reference" placeholder="ID de la transaction"></div>
              <div class="champ"><label for="p-date">Date de réception</label><input id="p-date" name="date" type="date" value="<?= date('Y-m-d') ?>"></div>
            </div>
            <div class="champ"><label for="p-note">Note (facultatif)</label><input id="p-note" name="note" placeholder="Ex. : 1re tranche sur 3"></div>
            <label class="case"><input type="checkbox" name="confirmer" value="1"><span>Confirmer aussi l’inscription (statut « Confirmée »)</span></label>
            <div><button class="btn btn-corail" type="submit">Enregistrer le paiement</button></div>
          </form>
        <?php endif; ?>
      </section>
    <?php endif; ?>
  </div>

  <div>
    <section class="panneau">
      <h2>Statut</h2>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">
        <?php if ($ins['statut'] !== 'confirmee'): ?>
          <form method="post" action="<?= e(url('/admin/inscriptions/' . $ins['id'] . '/statut')) ?>"><?= champ_csrf() ?><input type="hidden" name="statut" value="confirmee"><button class="btn btn-bleu btn-petit" type="submit"><?= icone('valide') ?>Confirmer l’inscription</button></form>
        <?php endif; ?>
        <?php if ($ins['statut'] !== 'annulee'): ?>
          <form method="post" action="<?= e(url('/admin/inscriptions/' . $ins['id'] . '/statut')) ?>" data-confirmer="Annuler cette inscription ? L’apprenant sera prévenu."><?= champ_csrf() ?><input type="hidden" name="statut" value="annulee"><button class="btn btn-fantome btn-petit" type="submit">Annuler</button></form>
        <?php endif; ?>
      </div>
      <form class="filtres-admin" method="post" action="<?= e(url('/admin/inscriptions/' . $ins['id'] . '/statut')) ?>" style="margin:0">
        <?= champ_csrf() ?>
        <div class="champ"><label for="s-statut">Autre statut</label><select id="s-statut" name="statut"><?php foreach (STATUTS_INSCRIPTION as $k => $l): ?><option value="<?= e($k) ?>"<?= $ins['statut'] === $k ? ' selected' : '' ?>><?= e($l) ?></option><?php endforeach; ?></select></div>
        <button class="btn btn-fantome btn-petit" type="submit">Appliquer</button>
      </form>
    </section>

    <section class="panneau">
      <h2>Accès de l’apprenant</h2>
      <p class="muted" style="font-size:.9rem">Lien de suivi (paiement et statut) :</p>
      <div class="lien-copie"><input readonly value="<?= e($lienSuivi) ?>" aria-label="Lien de suivi"><button class="btn btn-fantome btn-petit" type="button" data-copier="<?= e($lienSuivi) ?>">Copier</button></div>
      <p class="muted" style="font-size:.9rem;margin-top:14px">Lien de connexion à son espace, à envoyer par WhatsApp si l’e-mail n’arrive pas :</p>
      <?php if ($lienConnexion): ?>
        <div class="lien-copie"><input readonly value="<?= e($lienConnexion) ?>" aria-label="Lien de connexion"><button class="btn btn-fantome btn-petit" type="button" data-copier="<?= e($lienConnexion) ?>">Copier</button></div>
      <?php else: ?>
        <form method="post" action="<?= e(url('/admin/inscriptions/' . $ins['id'] . '/lien')) ?>"><?= champ_csrf() ?><button class="btn btn-fantome btn-petit" type="submit"><?= icone('lien') ?>Créer un lien de connexion (7 jours)</button></form>
      <?php endif; ?>
    </section>

    <section class="panneau">
      <h2>Note interne</h2>
      <form method="post" action="<?= e(url('/admin/inscriptions/' . $ins['id'] . '/note')) ?>" class="formulaire">
        <?= champ_csrf() ?>
        <div class="champ"><label for="n-note" class="sr">Note</label><textarea id="n-note" name="note_admin" rows="4" placeholder="Échéancier convenu, échanges WhatsApp…"><?= e($ins['note_admin']) ?></textarea></div>
        <div><button class="btn btn-fantome btn-petit" type="submit">Enregistrer la note</button></div>
      </form>
    </section>

    <?php if ($autres): ?>
      <section class="panneau">
        <h2>Autres inscriptions</h2>
        <ul class="liste-admin"><?php foreach ($autres as $a): ?><li><a href="<?= e(url('/admin/inscriptions/' . $a['id'])) ?>"><?= e($a['titre']) ?></a><?= partiel('pastille-statut', ['statut' => $a['statut']]) ?></li><?php endforeach; ?></ul>
      </section>
    <?php endif; ?>
  </div>
</div>

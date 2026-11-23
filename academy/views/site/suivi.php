<?php
defined('DTA') || exit;
/** @var array $ins */
$gratuit = (int) $ins['montant_total'] === 0;
$annulee = $ins['statut'] === 'annulee';
$prenom = explode(' ', trim($ins['nom']))[0];
$seuil = (int) reglage('seuil_acces_tranches');
$pourcentage = (int) $ins['montant_total'] > 0 ? (int) floor((int) $ins['montant_recu'] * 100 / (int) $ins['montant_total']) : 100;
$etapePaiement = $gratuit || $acces ? 'faite' : 'actuelle';
$etapeAcces = $acces ? 'actuelle' : '';
$classeStatut = match ($ins['statut']) {
    'confirmee', 'payee' => 'pastille-ok',
    'annulee' => 'pastille-ko',
    default => 'pastille-attente',
};
$texteAcces = $seuil === 0 ? 'dès la première tranche validée' : ($seuil >= 100 ? 'une fois le montant entièrement réglé' : 'dès que ' . $seuil . ' % du montant est réglé');
?>
<section class="contenu-page">
  <div class="conteneur">
    <div class="suivi">
      <ol class="etapes" aria-label="Étapes de l’inscription">
        <li class="faite">Choix</li>
        <li class="faite">Inscription</li>
        <li class="<?= $etapePaiement ?>"<?= $etapePaiement === 'actuelle' ? ' aria-current="step"' : '' ?>>Paiement</li>
        <li class="<?= $etapeAcces ?>"<?= $acces ? ' aria-current="step"' : '' ?>>Accès</li>
      </ol>

      <div class="suivi-entete">
        <div>
          <p class="surtitre">Inscription <?= e($ins['reference']) ?></p>
          <h1><?= $annulee ? 'Inscription annulée' : ($gratuit || $acces ? 'C’est confirmé, ' . e($prenom) . ' !' : 'Merci, ' . e($prenom) . ' !') ?></h1>
        </div>
        <span class="pastille <?= $classeStatut ?>"><?= e(libelle_statut($ins['statut'])) ?></span>
      </div>

      <?php if (!$annulee && ($gratuit || $acces)): ?>
        <div class="alerte alerte-succes"><?= icone('valide-cercle') ?><p><?= $gratuit
            ? 'Votre place est réservée. Un e-mail de confirmation vient de vous être envoyé.'
            : 'Vos contenus en ligne sont accessibles dans votre espace apprenant.' ?>
          <?= ($ins['format'] === 'presentiel' || $ins['session_format'] === 'presentiel') ? ' Pour le présentiel, votre place est confirmée' . ($ins['date_debut'] ? ' pour le ' . e(date_fr($ins['date_debut'], true)) : ' : la date vous sera communiquée') . '.' : '' ?></p></div>
      <?php endif; ?>

      <div class="carte">
        <h2 style="font-size:1.2rem">Récapitulatif</h2>
        <table class="tableau-simple">
          <tr><th scope="row">Formation</th><td><a href="<?= e(url('/formations/' . $ins['formation_slug'])) ?>"><?= e($ins['formation_titre']) ?></a></td></tr>
          <tr><th scope="row">Session</th><td><?= $ins['date_debut'] ? e(date_fr($ins['date_debut'], true)) . ($ins['heure_debut'] ? ' à ' . e(heure_fr($ins['heure_debut'])) : '') : 'Dates à venir — nous vous prévenons dès l’ouverture' ?></td></tr>
          <?php if ($ins['format']): ?><tr><th scope="row">Format</th><td><?= e(FORMATS_SESSION[$ins['format']] ?? $ins['format']) ?><?= $ins['format'] === 'presentiel' ? ' — siège d’Akpakpa (Cotonou)' : '' ?></td></tr><?php endif; ?>
          <tr><th scope="row">Montant</th><td><strong><?= $gratuit ? 'Gratuit' : e(prix((int) $ins['montant_total'])) ?></strong></td></tr>
          <?php if (!$gratuit): ?>
            <tr><th scope="row">Déjà reçu</th><td><?= e(prix((int) $ins['montant_recu'])) ?></td></tr>
            <tr><th scope="row">Reste à payer</th><td><strong><?= e(prix($reste)) ?></strong></td></tr>
          <?php endif; ?>
        </table>
        <?php if (!$gratuit && (int) $ins['montant_recu'] > 0): ?>
          <div style="margin-top:16px">
            <div class="progression-texte"><span>Paiement</span><span><?= $pourcentage ?> %</span></div>
            <div class="jauge" role="progressbar" aria-valuenow="<?= $pourcentage ?>" aria-valuemin="0" aria-valuemax="100"><span style="width:<?= $pourcentage ?>%"></span></div>
          </div>
        <?php endif; ?>
      </div>

      <?php if (!$gratuit && !$annulee && $reste > 0): ?>
        <div class="carte">
          <p class="surtitre">Étape 3 · Paiement</p>
          <h2 style="font-size:1.3rem">Payez par Mobile Money</h2>
          <p class="muted">Choisissez votre opérateur, puis recevez les instructions de paiement sur WhatsApp : un message prérempli avec votre formation, votre nom et votre référence s’ouvre automatiquement.</p>
          <form method="post" action="<?= e(url('/inscription/suivi/' . $ins['jeton_suivi'] . '/whatsapp')) ?>" target="_blank" class="formulaire">
            <?= champ_csrf() ?>
            <fieldset>
              <legend class="sr">Opérateur Mobile Money</legend>
              <div class="operateurs">
                <?php foreach (OPERATEURS_MOBILE_MONEY as $i => $op): ?>
                  <label class="option-carte">
                    <input type="radio" name="moyen" value="<?= e($op) ?>"<?= ($ins['moyen_paiement'] ?: 'mtn') === $op ? ' checked' : '' ?>>
                    <span><strong><?= e(['mtn' => 'MTN', 'moov' => 'Moov', 'celtiis' => 'Celtiis'][$op]) ?></strong><small><?= e(['mtn' => 'MoMo', 'moov' => 'Moov Money', 'celtiis' => 'Mobile Money'][$op]) ?></small></span>
                  </label>
                <?php endforeach; ?>
              </div>
            </fieldset>
            <?php if (array_filter($numeros, fn($n) => !empty($n['numero']))): ?>
              <ul class="liste-coches">
                <?php foreach ($numeros as $op => $n): if (empty($n['numero'])) continue; ?>
                  <li><?= icone('mobile') ?><span><?= e($n['libelle']) ?> : <strong><?= e($n['numero']) ?></strong><?= !empty($n['titulaire']) ? ' (' . e($n['titulaire']) . ')' : '' ?></span></li>
                <?php endforeach; ?>
              </ul>
            <?php endif; ?>
            <button class="btn btn-corail btn-large btn-bloc" type="submit"><?= icone('whatsapp') ?>Recevoir les instructions sur WhatsApp</button>
          </form>
          <?php if (fedapay_actif()): $minEnLigne = min($reste, MONTANT_MIN_EN_LIGNE); ?>
            <div class="separateur">ou</div>
            <form method="post" action="<?= e(url('/inscription/suivi/' . $ins['jeton_suivi'] . '/en-ligne')) ?>" class="formulaire">
              <?= champ_csrf() ?>
              <?php if ($reste > $minEnLigne): ?>
                <div class="champ">
                  <label for="montant-en-ligne">Montant à payer maintenant (F CFA)</label>
                  <input id="montant-en-ligne" name="montant" type="number" inputmode="numeric" min="<?= $minEnLigne ?>" max="<?= $reste ?>" step="1" value="<?= $reste ?>" required>
                  <small class="aide">Payez tout ou une tranche, entre <?= e(prix($minEnLigne)) ?> et <?= e(prix($reste)) ?>.</small>
                </div>
              <?php else: ?>
                <input type="hidden" name="montant" value="<?= $reste ?>">
              <?php endif; ?>
              <button class="btn btn-bleu btn-large btn-bloc" type="submit"><?= icone('paiement') ?>Payer en ligne maintenant</button>
              <p class="muted" style="margin:0;font-size:.9rem">Mobile Money ou carte bancaire, sur la page sécurisée de FedaPay. Le paiement est validé automatiquement.</p>
            </form>
          <?php endif; ?>
          <ul class="liste-coches" style="margin-top:18px;font-size:.9rem">
            <li><?= icone('info') ?><span>Paiement en plusieurs tranches possible : précisez-le dans votre message.</span></li>
            <li><?= icone('info') ?><span><?= fedapay_actif() ? 'Avec WhatsApp, votre inscription reste « En attente de paiement » jusqu’à validation par notre équipe.' : 'Votre inscription reste « En attente de paiement » jusqu’à validation par notre équipe.' ?></span></li>
            <li><?= icone('info') ?><span>Vos contenus en ligne s’ouvrent <?= e($texteAcces) ?>.</span></li>
          </ul>
        </div>
      <?php endif; ?>

      <?php if ($paiements): ?>
        <div class="carte">
          <h2 style="font-size:1.2rem">Paiements reçus</h2>
          <table class="tableau-simple">
            <?php foreach ($paiements as $p): ?>
              <tr><th scope="row"><?= e(date_fr($p['recu_le'])) ?> · <?= e(MOYENS_PAIEMENT[$p['moyen']] ?? $p['moyen']) ?></th><td><?= e(prix((int) $p['montant'])) ?></td></tr>
            <?php endforeach; ?>
          </table>
        </div>
      <?php endif; ?>

      <?php if (!$annulee): ?>
        <div class="carte">
          <p class="surtitre">Étape 4 · Accès</p>
          <h2 style="font-size:1.3rem">Votre espace apprenant</h2>
          <p class="muted">Formations suivies, prochaine séance en direct, replays, supports et progression : tout est réuni dans votre espace.<?= $acces ? '' : ' Les contenus payants s’y ouvrent après validation de votre paiement.' ?></p>
          <?php if ($connecte): ?>
            <a class="btn btn-bleu btn-large" href="<?= e(url('/espace')) ?>">Accéder à mon espace</a>
          <?php else: ?>
            <form method="post" action="<?= e(url('/inscription/suivi/' . $ins['jeton_suivi'] . '/acces')) ?>">
              <?= champ_csrf() ?>
              <button class="btn btn-bleu btn-large" type="submit"><?= icone('mail') ?>Recevoir mon lien d’accès par e-mail</button>
            </form>
            <p class="muted" style="font-size:.88rem;margin-top:10px">Le lien est envoyé à l’adresse indiquée lors de l’inscription.</p>
          <?php endif; ?>
        </div>
      <?php endif; ?>

      <p class="muted centre" style="font-size:.9rem">Une question ? <a href="<?= e(lien_whatsapp('Bonjour, j’ai une question sur mon inscription ' . $ins['reference'] . '.')) ?>" target="_blank" rel="noopener">Écrivez-nous sur WhatsApp</a> en indiquant la référence <?= e($ins['reference']) ?>.</p>
    </div>
  </div>
</section>

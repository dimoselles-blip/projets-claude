<?php defined('DTA') || exit; ?>
<section class="entete-page">
  <div class="conteneur">
    <ol class="fil"><li><a href="<?= e(url('/')) ?>">Accueil</a></li><li aria-current="page">Confidentialité</li></ol>
    <h1>Politique de confidentialité</h1>
    <p class="intro">Nous collectons uniquement les informations nécessaires pour vous former et vous accompagner.</p>
  </div>
</section>
<section class="contenu-page">
  <div class="conteneur texte-long">
    <h2>Responsable du traitement</h2>
    <p>DIMO Tech Academy (DIMO Group), <?= e(cfg('contact.adresse', 'Akpakpa, Cotonou (Bénin)')) ?>. Contact : <a href="mailto:<?= e(cfg('contact.email')) ?>"><?= e(cfg('contact.email')) ?></a>.</p>

    <h2>Données collectées et utilisation</h2>
    <ul>
      <li><strong>Inscription</strong> : nom, e-mail, numéro WhatsApp, formation, session et format choisis. Pour traiter votre inscription, vous envoyer les instructions de paiement, vous donner accès à votre espace apprenant et vous informer de vos sessions.</li>
      <li><strong>Paiements</strong> : montants reçus, dates, moyen de paiement et référence de transaction, pour tenir votre échéancier. Nous ne stockons aucun code secret Mobile Money ni numéro de carte.</li>
      <li><strong>Espace apprenant</strong> : progression dans les contenus et notifications.</li>
      <li><strong>Contact, devis et liste d’attente</strong> : les informations saisies dans le formulaire, pour vous répondre.</li>
    </ul>
    <p>Ces traitements reposent sur votre consentement, donné en cochant la case du formulaire, et sur l’exécution de votre inscription.</p>

    <h2>Destinataires</h2>
    <p>Seule l’équipe de DIMO Tech Academy accède à vos données. Elles sont hébergées chez Hostinger. Lorsque vous cliquez sur un bouton WhatsApp, la conversation se déroule sur WhatsApp, selon ses propres conditions. Vos données ne sont ni vendues ni cédées.</p>

    <h2>Durée de conservation</h2>
    <p>Vos données d’inscription sont conservées pendant la durée de votre formation puis 3 ans après votre dernier contact, et les données de paiement selon les obligations comptables. Les demandes de contact sans suite sont supprimées après 1 an.</p>

    <h2>Cookies et statistiques</h2>
    <p>Le site utilise un seul cookie indispensable (session de connexion et protection des formulaires). La mesure d’audience intégrée compte les pages vues sans cookie et sans donnée personnelle.<?= cfg('statistiques.ga4') ? ' Google Analytics n’est chargé qu’après votre accord, via le bandeau prévu à cet effet.' : '' ?></p>

    <h2>Vos droits</h2>
    <p>Vous pouvez demander l’accès, la rectification ou la suppression de vos données, et retirer votre consentement à tout moment, en écrivant à <a href="mailto:<?= e(cfg('contact.email')) ?>"><?= e(cfg('contact.email')) ?></a>. Ces droits sont prévus par le Code du numérique de la République du Bénin (loi n° 2017-20) ; vous pouvez également saisir l’Autorité de Protection des Données à caractère Personnel (APDP).</p>
  </div>
</section>

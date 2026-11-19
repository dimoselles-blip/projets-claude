<?php defined('DTA') || exit; $valeur = fn(string $c) => ancienne($c); ?>
<section class="entete-page">
  <div class="conteneur">
    <ol class="fil"><li><a href="<?= e(url('/')) ?>">Accueil</a></li><li aria-current="page">Entreprises</li></ol>
    <h1>Formations IA &amp; Data pour vos équipes</h1>
    <p class="intro">IA générative au bureau (ChatGPT, Claude, Copilot), agents IA et automatisation des tâches, Power BI, tableaux de bord et analyse de données : sur site ou en ligne, avec un programme adapté à votre secteur.</p>
  </div>
</section>

<?= partiel('bloc-entreprises', ['complet' => true]) ?>

<section class="section section-grise" id="devis" aria-labelledby="devis-titre">
  <div class="conteneur grille-2-col">
    <div class="section-entete section-entete-gauche">
      <p class="surtitre">Devis</p>
      <h2 id="devis-titre">Demander une formation sur mesure</h2>
      <p>Décrivez votre besoin : nous revenons vers vous avec un programme et une proposition adaptés à votre équipe.</p>
      <ul class="liste-coches" style="margin-top:20px">
        <li><?= icone('valide') ?>Deux jours de formation dans vos locaux</li>
        <li><?= icone('valide') ?>Exercices sur vos propres cas</li>
        <li><?= icone('valide') ?>Un support et un suivi après la formation</li>
      </ul>
      <p style="margin-top:22px"><a class="lien-fleche" href="<?= e(lien_whatsapp('Bonjour, je souhaite échanger sur une formation pour mon équipe.')) ?>" target="_blank" rel="noopener"><?= icone('whatsapp') ?>Préférez-vous en parler sur WhatsApp ?</a></p>
      <?php if (cfg('reseaux.dimotech')): ?><p class="muted" style="font-size:.9rem">Communication, réseaux informatiques et autres services numériques sur mesure : <a href="<?= e(cfg('reseaux.dimotech')) ?>" target="_blank" rel="noopener">DIMO Tech</a>.</p><?php endif; ?>
    </div>
    <form class="formulaire carte" method="post" action="<?= e(url('/entreprises/devis')) ?>" data-form-ajax>
      <?= champ_csrf() ?>
      <?= champ_piege() ?>
      <div class="grille-2">
        <div class="champ"><label for="d-nom">Votre nom</label><input id="d-nom" name="nom" autocomplete="name" required value="<?= e($valeur('nom')) ?>"><small class="erreur-champ" data-erreur-pour="nom"></small></div>
        <div class="champ"><label for="d-org">Entreprise ou organisation</label><input id="d-org" name="organisation" autocomplete="organization" required value="<?= e($valeur('organisation')) ?>"><small class="erreur-champ" data-erreur-pour="organisation"></small></div>
      </div>
      <div class="grille-2">
        <div class="champ"><label for="d-email">E-mail professionnel</label><input id="d-email" name="email" type="email" autocomplete="email" required value="<?= e($valeur('email')) ?>"><small class="erreur-champ" data-erreur-pour="email"></small></div>
        <div class="champ"><label for="d-tel">Téléphone</label><input id="d-tel" name="telephone" type="tel" autocomplete="tel" inputmode="tel" required value="<?= e($valeur('telephone')) ?>"><small class="erreur-champ" data-erreur-pour="telephone"></small></div>
      </div>
      <div class="grille-2">
        <div class="champ"><label for="d-formule">Formule envisagée</label>
          <select id="d-formule" name="formule">
            <option value="">À définir ensemble</option>
            <?php foreach (FORMULES_ENTREPRISES as $fo): ?><option><?= e($fo['nom']) ?></option><?php endforeach; ?>
            <option>Accompagnement Data (DIMO Tech)</option>
          </select>
        </div>
        <div class="champ"><label for="d-part">Nombre de participants</label><input id="d-part" name="participants" inputmode="numeric" value="<?= e($valeur('participants')) ?>"></div>
      </div>
      <fieldset class="champ">
        <legend>Vos besoins</legend>
        <?php foreach (BESOINS_ENTREPRISES as $b): ?>
          <label class="case"><input type="checkbox" name="besoins[]" value="<?= e($b) ?>"><span><?= e($b) ?></span></label>
        <?php endforeach; ?>
      </fieldset>
      <div class="champ"><label for="d-msg">Votre contexte (secteur, objectifs, dates souhaitées)</label><textarea id="d-msg" name="message" rows="4"><?= e($valeur('message')) ?></textarea></div>
      <label class="case"><input type="checkbox" name="consentement" value="1" required><span>J’accepte que DIMO Tech Academy utilise ces informations pour répondre à ma demande (<a href="<?= e(url('/confidentialite')) ?>">confidentialité</a>).</span></label>
      <small class="erreur-champ" data-erreur-pour="consentement"></small>
      <p class="alerte" data-message-formulaire hidden></p>
      <button class="btn btn-corail btn-large" type="submit">Envoyer ma demande de devis</button>
    </form>
  </div>
</section>

<?php defined('DTA') || exit; $valeur = fn(string $c) => ancienne($c); ?>
<section class="entete-page">
  <div class="conteneur">
    <ol class="fil"><li><a href="<?= e(url('/')) ?>">Accueil</a></li><li aria-current="page">Contact</li></ol>
    <h1>Contactez-nous</h1>
    <p class="intro">Une question sur une formation, une inscription ou un paiement ? Écrivez-nous : nous répondons rapidement.</p>
  </div>
</section>

<section class="contenu-page">
  <div class="conteneur grille-2-col">
    <div class="carte-contact">
      <a class="carte ligne-contact" href="<?= e(lien_whatsapp()) ?>" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">
        <span class="puce-icone"><?= icone('whatsapp') ?></span>
        <span><strong>WhatsApp</strong><span class="muted">Le plus rapide pour une question ou un paiement.</span></span>
      </a>
      <div class="carte ligne-contact">
        <span class="puce-icone"><?= icone('mail') ?></span>
        <span><strong>E-mail</strong><a href="mailto:<?= e(cfg('contact.email')) ?>"><?= e(cfg('contact.email')) ?></a><?php if (cfg('contact.email_assistance') && cfg('contact.email_assistance') !== cfg('contact.email')): ?><br><span class="muted">Assistance apprenants : </span><a href="mailto:<?= e(cfg('contact.email_assistance')) ?>"><?= e(cfg('contact.email_assistance')) ?></a><?php endif; ?></span>
      </div>
      <div class="carte ligne-contact">
        <span class="puce-icone"><?= icone('lieu') ?></span>
        <span><strong>Siège</strong><span class="muted"><?= e(cfg('contact.adresse', 'Akpakpa, Cotonou (Bénin)')) ?></span><?php if (cfg('contact.carte')): ?><br><a href="<?= e(cfg('contact.carte')) ?>" target="_blank" rel="noopener">Voir sur la carte</a><?php endif; ?></span>
      </div>
      <?= partiel('emplacement', ['texte' => 'Photo du siège à Akpakpa', 'ratio' => '16 / 9']) ?>
    </div>

    <form class="formulaire carte" method="post" action="<?= e(url('/contact')) ?>" data-form-ajax>
      <h2 style="font-size:1.35rem;margin:0">Envoyer un message</h2>
      <?= champ_csrf() ?>
      <?= champ_piege() ?>
      <div class="grille-2">
        <div class="champ"><label for="c-nom">Nom</label><input id="c-nom" name="nom" autocomplete="name" required value="<?= e($valeur('nom')) ?>"><small class="erreur-champ" data-erreur-pour="nom"></small></div>
        <div class="champ"><label for="c-email">E-mail</label><input id="c-email" name="email" type="email" autocomplete="email" required value="<?= e($valeur('email')) ?>"><small class="erreur-champ" data-erreur-pour="email"></small></div>
      </div>
      <div class="grille-2">
        <div class="champ"><label for="c-tel">WhatsApp (facultatif)</label><input id="c-tel" name="telephone" type="tel" autocomplete="tel" inputmode="tel" value="<?= e($valeur('telephone')) ?>"></div>
        <div class="champ"><label for="c-sujet">Sujet</label>
          <select id="c-sujet" name="sujet">
            <?php foreach (['Choisir une formation', 'Inscription ou paiement', 'Espace apprenant', 'Formation pour mon entreprise', 'Partenariat', 'Autre'] as $s): ?><option<?= $valeur('sujet') === $s ? ' selected' : '' ?>><?= e($s) ?></option><?php endforeach; ?>
          </select>
        </div>
      </div>
      <div class="champ"><label for="c-msg">Message</label><textarea id="c-msg" name="message" rows="5" required><?= e($valeur('message')) ?></textarea><small class="erreur-champ" data-erreur-pour="message"></small></div>
      <label class="case"><input type="checkbox" name="consentement" value="1" required><span>J’accepte que DIMO Tech Academy utilise ces informations pour me répondre (<a href="<?= e(url('/confidentialite')) ?>">confidentialité</a>).</span></label>
      <small class="erreur-champ" data-erreur-pour="consentement"></small>
      <p class="alerte" data-message-formulaire hidden></p>
      <button class="btn btn-corail btn-large" type="submit">Envoyer</button>
    </form>
  </div>
</section>

<?php defined('DTA') || exit; ?>
<div class="conteneur conteneur-etroit" style="padding:32px 20px 72px;display:grid;gap:20px">
  <h1 style="font-size:clamp(1.6rem,1.2rem + 1.6vw,2.2rem);margin:0">Mon profil</h1>
  <form class="formulaire carte" method="post" action="<?= e(url('/espace/profil')) ?>">
    <?= champ_csrf() ?>
    <h2 style="font-size:1.15rem;margin:0">Mes informations</h2>
    <div class="champ"><label for="p-nom">Nom complet</label><input id="p-nom" name="nom" autocomplete="name" required value="<?= e($u['nom']) ?>"></div>
    <div class="grille-2">
      <div class="champ"><label for="p-email">E-mail</label><input id="p-email" type="email" value="<?= e($u['email']) ?>" disabled><small class="aide">Pour changer d’adresse, écrivez-nous.</small></div>
      <div class="champ"><label for="p-tel">Téléphone WhatsApp</label><input id="p-tel" name="telephone" type="tel" autocomplete="tel" value="<?= e($u['telephone']) ?>"></div>
    </div>
    <button class="btn btn-bleu" type="submit">Enregistrer</button>
  </form>
  <form class="formulaire carte" method="post" action="<?= e(url('/espace/mot-de-passe')) ?>">
    <?= champ_csrf() ?>
    <h2 style="font-size:1.15rem;margin:0"><?= $u['a_mot_de_passe'] ? 'Changer mon mot de passe' : 'Créer un mot de passe' ?></h2>
    <p class="muted" style="margin:0">Facultatif : vous pouvez toujours vous connecter avec un lien envoyé par e-mail.</p>
    <?php if ($u['a_mot_de_passe']): ?>
      <div class="champ"><label for="p-actuel">Mot de passe actuel</label><input id="p-actuel" name="actuel" type="password" autocomplete="current-password" required></div>
    <?php endif; ?>
    <div class="grille-2">
      <div class="champ"><label for="p-nouveau">Nouveau mot de passe</label><input id="p-nouveau" name="nouveau" type="password" autocomplete="new-password" minlength="8" required><small class="aide">8 caractères minimum.</small></div>
      <div class="champ"><label for="p-conf">Confirmation</label><input id="p-conf" name="confirmation" type="password" autocomplete="new-password" minlength="8" required></div>
    </div>
    <button class="btn btn-bleu" type="submit">Enregistrer le mot de passe</button>
  </form>
</div>

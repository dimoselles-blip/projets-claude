<?php defined('DTA') || exit; ?>
<section class="conteneur">
  <div class="connexion">
    <div class="carte">
      <p class="surtitre">Espace apprenant</p>
      <h1>Connexion</h1>
      <p class="muted">Retrouvez vos formations, les séances en direct, les replays et vos supports.</p>

      <form class="formulaire" method="post" action="<?= e(url('/espace/lien')) ?>">
        <?= champ_csrf() ?>
        <div class="champ">
          <label for="l-email">Votre e-mail d’inscription</label>
          <input id="l-email" name="email" type="email" autocomplete="email" inputmode="email" required value="<?= e(ancienne('email')) ?>">
        </div>
        <button class="btn btn-corail btn-large btn-bloc" type="submit"><?= icone('mail') ?>Recevoir un lien de connexion</button>
        <p class="muted" style="font-size:.85rem;margin:0">Un lien valable 1 heure vous est envoyé par e-mail. Aucun mot de passe nécessaire.</p>
      </form>

      <div class="separateur" style="margin:24px 0">ou avec un mot de passe</div>

      <form class="formulaire" method="post" action="<?= e(url('/espace/connexion')) ?>">
        <?= champ_csrf() ?>
        <div class="champ">
          <label for="c-email">E-mail</label>
          <input id="c-email" name="email" type="email" autocomplete="username" inputmode="email" required value="<?= e(ancienne('email')) ?>">
        </div>
        <div class="champ">
          <label for="c-mdp">Mot de passe</label>
          <input id="c-mdp" name="mot_de_passe" type="password" autocomplete="current-password" required>
        </div>
        <button class="btn btn-contour btn-large btn-bloc" type="submit">Se connecter</button>
      </form>
    </div>
    <p class="muted centre" style="margin-top:20px;font-size:.92rem">Pas encore inscrit(e) ? <a href="<?= e(url('/formations')) ?>">Choisissez votre formation</a>.</p>
  </div>
</section>

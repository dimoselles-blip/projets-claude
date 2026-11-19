<?php
defined('DTA') || exit;
$reseaux = array_filter([
    'tiktok' => ['TikTok — DIMO TECH ACADEMY', cfg('reseaux.tiktok')],
    'facebook' => ['Facebook — DIMO TECH', cfg('reseaux.facebook')],
    'linkedin' => ['LinkedIn — DIMO TECH ACADEMY', cfg('reseaux.linkedin')],
], fn($r) => !empty($r[1]));
?>
<footer class="pied">
  <div class="conteneur pied-grille">
    <div class="pied-marque">
      <a class="cartouche-logo" href="<?= e(url('/')) ?>" aria-label="DIMO Tech Academy — accueil">
        <img src="<?= e(asset('img/logo-160.png')) ?>" alt="DIMO Tech Academy" width="137" height="120" loading="lazy">
      </a>
      <p class="pied-phrase">Former aujourd’hui les talents qui construiront l’Afrique numérique de demain.</p>
      <?php if ($reseaux): ?>
        <ul class="reseaux" aria-label="Réseaux sociaux">
          <?php foreach ($reseaux as $cle => [$libelle, $lien]): ?>
            <li><a href="<?= e($lien) ?>" target="_blank" rel="noopener" aria-label="<?= e($libelle) ?>"><?= icone($cle) ?></a></li>
          <?php endforeach; ?>
        </ul>
      <?php endif; ?>
    </div>
    <nav class="pied-liens" aria-label="Pied de page">
      <div>
        <p class="pied-titre">Navigation</p>
        <ul>
          <li><a href="<?= e(url('/')) ?>">Accueil</a></li>
          <li><a href="<?= e(url('/formations')) ?>">Formations</a></li>
          <li><a href="<?= e(url('/masterclass')) ?>">Masterclass</a></li>
          <li><a href="<?= e(url('/parcours')) ?>">Parcours Data, IA et Tech</a></li>
          <li><a href="<?= e(url('/entreprises')) ?>">Entreprises</a></li>
        </ul>
      </div>
      <div>
        <p class="pied-titre">L’académie</p>
        <ul>
          <li><a href="<?= e(url('/a-propos')) ?>">À propos</a></li>
          <li><a href="<?= e(url('/sessions')) ?>">Prochaines sessions</a></li>
          <li><a href="<?= e(url('/contact')) ?>">Contact</a></li>
          <li><a href="<?= e(url('/faq')) ?>">FAQ</a></li>
          <li><a href="<?= e(url('/espace')) ?>">Espace apprenant</a></li>
        </ul>
      </div>
      <div>
        <p class="pied-titre">Nous trouver</p>
        <ul class="pied-contact">
          <li><?= icone('lieu') ?> <?= e(cfg('contact.adresse', 'Akpakpa, Cotonou (Bénin)')) ?></li>
          <li><?= icone('mail') ?> <a href="mailto:<?= e(cfg('contact.email')) ?>"><?= e(cfg('contact.email')) ?></a></li>
          <li><?= icone('whatsapp') ?> <a href="<?= e(lien_whatsapp()) ?>" target="_blank" rel="noopener">Nous écrire sur WhatsApp</a></li>
        </ul>
      </div>
    </nav>
  </div>
  <div class="conteneur pied-bas">
    <p>© DIMO Tech Academy — Tous droits réservés</p>
    <ul>
      <li><a href="<?= e(url('/mentions-legales')) ?>">Mentions légales</a></li>
      <li><a href="<?= e(url('/confidentialite')) ?>">Confidentialité</a></li>
      <?php if (cfg('reseaux.dimotech')): ?><li><a href="<?= e(cfg('reseaux.dimotech')) ?>" target="_blank" rel="noopener">DIMO Tech, services numériques</a></li><?php endif; ?>
    </ul>
  </div>
</footer>

<?php defined('DTA') || exit; ?>
<section class="entete-page">
  <div class="conteneur">
    <ol class="fil"><li><a href="<?= e(url('/')) ?>">Accueil</a></li><li aria-current="page">Mentions légales</li></ol>
    <h1>Mentions légales</h1>
  </div>
</section>
<section class="contenu-page">
  <div class="conteneur texte-long">
    <h2>Éditeur du site</h2>
    <p>DIMO Tech Academy, branche formation de DIMO Group.<br>
    Siège : <?= e(cfg('contact.adresse', 'Akpakpa, Cotonou (Bénin)')) ?>.<br>
    Contact : <a href="mailto:<?= e(cfg('contact.email')) ?>"><?= e(cfg('contact.email')) ?></a>.<br>
    Forme juridique, numéro RCCM et numéro IFU : <em>à compléter</em>.<br>
    Responsable de la publication : <em>à compléter</em>.</p>

    <h2>Hébergement</h2>
    <p>Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Chypre — <a href="https://www.hostinger.com" target="_blank" rel="noopener">hostinger.com</a>.</p>

    <h2>Propriété intellectuelle</h2>
    <p>Le logo, la marque DIMO Tech Academy, les textes, visuels et contenus pédagogiques de ce site sont la propriété de DIMO Group. Toute reproduction sans autorisation écrite est interdite. Les contenus réservés aux apprenants (vidéos, supports) sont destinés à un usage personnel et ne doivent pas être partagés.</p>

    <h2>Responsabilité</h2>
    <p>Nous veillons à l’exactitude des informations publiées (programmes, prix, dates). Elles peuvent toutefois évoluer : la confirmation d’inscription fait foi. Nos formations préparent au monde professionnel mais ne garantissent pas l’obtention d’un emploi.</p>

    <h2>Données personnelles</h2>
    <p>Voir notre <a href="<?= e(url('/confidentialite')) ?>">politique de confidentialité</a>.</p>
  </div>
</section>

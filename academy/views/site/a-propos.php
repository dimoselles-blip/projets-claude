<?php
defined('DTA') || exit;
$mot = trim((string) reglage('mot_fondatrice'));
$phraseCohorte = (string) reglage('phrase_cohorte');
$fondatrice = null;
$equipe = [];
foreach ($formateurs as $p) {
    if ($fondatrice === null && str_contains(mb_strtolower($p['nom']), 'morelle')) {
        $fondatrice = $p;
    } else {
        $equipe[] = $p;
    }
}
?>
<section class="entete-page">
  <div class="conteneur">
    <ol class="fil"><li><a href="<?= e(url('/')) ?>">Accueil</a></li><li aria-current="page">À propos</li></ol>
    <h1>Former les talents de l’Afrique numérique</h1>
    <p class="intro">DIMO Tech Academy est la branche formation de DIMO Group, créée en 2022 à Cotonou et complémentaire de DIMO Tech, la branche services. C’est la première académie hybride Data &amp; IA du Bénin.</p>
  </div>
</section>

<section class="contenu-page">
  <div class="conteneur">
    <div class="grille-2-col" style="align-items:center">
      <div>
        <?php if ($fondatrice && $fondatrice['photo']): ?>
          <img src="<?= e(media($fondatrice['photo'])) ?>" alt="Morelle ATIN, fondatrice de DIMO Tech Academy" style="border-radius:var(--rayon);width:100%;aspect-ratio:4/5;object-fit:cover" loading="lazy">
        <?php else: ?>
          <?= partiel('emplacement', ['texte' => 'Portrait de Morelle ATIN, fondatrice', 'ratio' => '4 / 5']) ?>
        <?php endif; ?>
      </div>
      <div>
        <p class="surtitre">Le mot de la fondatrice</p>
        <h2>Morelle ATIN</h2>
        <p class="muted">Fondatrice de DIMO Tech Academy — ingénieur Télécoms et TIC, consultante Data/IA.</p>
        <?php if ($mot !== ''): ?>
          <div class="citation"><?= paragraphes($mot) ?></div>
        <?php elseif (afficher_emplacements()): ?>
          <div class="citation temoignage-emplacement" style="border-style:dashed">
            <p class="emplacement-etiquette">À remplacer</p>
            <p class="muted" style="margin:0">Mot de la fondatrice : pourquoi DIMO Tech Academy, la vision, l’engagement envers les apprenants. Texte à saisir dans Administration → Réglages.</p>
          </div>
        <?php endif; ?>
      </div>
    </div>

    <div class="grille-2-col" style="margin-top:72px">
      <div>
        <p class="surtitre">Notre histoire</p>
        <h2>Depuis 2022</h2>
        <ol class="chronologie">
          <li><strong>2022</strong><p>Création de DIMO Tech Academy à Cotonou, branche formation de DIMO Group, aux côtés de DIMO Tech.</p></li>
          <li><strong>Première cohorte</strong><p><?= e($phraseCohorte ?: 'Une première cohorte formée aux métiers de la Data et de l’IA.') ?></p></li>
          <li><strong>2026</strong><p>Un catalogue de parcours Data, IA et Tech, de 1 jour à 12 mois, et une plateforme en ligne pour apprendre où que vous soyez.</p></li>
        </ol>
      </div>
      <div>
        <p class="surtitre">Notre vision</p>
        <h2>La Data et l’IA à votre portée…</h2>
        <p class="accroche-forte">Former aujourd’hui les talents qui construiront l’Afrique numérique de demain.</p>
        <p class="muted">Notre objectif : transformer la connaissance en compétence, et la compétence en opportunité. Pour cela, une pédagogie hybride — cours en direct, vidéos à revoir et présentiel au siège d’Akpakpa — avec une théorie courte et de la pratique sur des projets réels qui nourrissent votre portfolio.</p>
      </div>
    </div>

    <div style="margin-top:72px">
      <div class="section-entete section-entete-gauche">
        <p class="surtitre">L’équipe</p>
        <h2>Formateurs et mentors</h2>
        <p>Celles et ceux qui vous accompagnent tout au long des parcours.</p>
      </div>
      <div class="grille-equipe">
        <?php foreach ($equipe as $p): ?>
          <div class="membre">
            <?php if ($p['photo']): ?><img src="<?= e(media($p['photo'])) ?>" alt="" loading="lazy" width="300" height="300"><?php else: ?><?= partiel('emplacement', ['texte' => 'Photo de ' . $p['nom'], 'ratio' => '1']) ?><?php endif; ?>
            <strong><?= e($p['nom']) ?></strong><span><?= e($p['role']) ?></span>
          </div>
        <?php endforeach; ?>
        <?php if (afficher_emplacements()): for ($i = count($equipe); $i < 4; $i++): ?>
          <div class="membre">
            <?= partiel('emplacement', ['texte' => 'Photo d’un membre de l’équipe', 'ratio' => '1']) ?>
            <strong>Prénom et nom</strong><span>Rôle — à remplacer</span>
          </div>
        <?php endfor; endif; ?>
      </div>
    </div>

    <div class="bandeau-femmes" style="margin-top:72px">
      <div>
        <p class="surtitre">Notre engagement</p>
        <h2>Les femmes au cœur de la Tech</h2>
        <p>Encourager les femmes à rejoindre les métiers du numérique fait partie de nos valeurs. Étudiantes, professionnelles en reconversion ou entrepreneuses : nos formations vous sont ouvertes, et notre équipe vous accompagne pour trouver votre place dans la Data et l’IA.</p>
        <a class="btn btn-corail" href="<?= e(url('/#trouver')) ?>">Je choisis ma formation</a>
      </div>
      <?= partiel('emplacement', ['texte' => 'Photo d’apprenantes en formation', 'ratio' => '4 / 3']) ?>
    </div>

    <div style="margin-top:72px">
      <?= partiel('emplacement', ['texte' => 'Photo de cohorte au siège d’Akpakpa', 'ratio' => '21 / 9']) ?>
    </div>
  </div>
</section>
<?= partiel('cta-final') ?>

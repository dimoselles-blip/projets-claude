<?php
defined('DTA') || exit;
$prixMin = null;
foreach ($groupes as $g) {
    foreach ($g['formations'] as $f) {
        if (!$f['gratuite'] && ($prixMin === null || $f['prix_min'] < $prixMin)) {
            $prixMin = $f['prix_min'];
        }
    }
}
$phraseCohorte = (string) reglage('phrase_cohorte');
?>
<!-- 2. Hero -->
<section class="hero">
  <div class="conteneur hero-grille">
    <div class="hero-texte">
      <p class="badge-lieu"><?= icone('lieu') ?> Académie Data &amp; IA — Cotonou, Bénin</p>
      <p class="signature">La Data et l’IA à votre portée…</p>
      <h1>Formez-vous aux métiers de la <span class="accent-bleu">Data</span> &amp; de l’<span class="accent-bleu">Intelligence Artificielle</span></h1>
      <p class="hero-sous-titre">Développez des compétences recherchées, réalisez des projets concrets et préparez votre avenir professionnel avec DIMO Tech Academy.</p>
      <div class="hero-boutons">
        <a class="btn btn-corail btn-large" href="#formations">Découvrir nos formations</a>
        <a class="btn btn-contour btn-large" href="#sessions">Voir les prochaines sessions</a>
      </div>
      <ul class="hero-faits">
        <li><?= icone('utilisateurs') ?>Étudiants, professionnels, entrepreneurs et entreprises</li>
        <li><?= icone('paiement') ?>Masterclass gratuites<?= $prixMin ? ', parcours dès ' . e(prix($prixMin)) : '' ?> · Mobile Money en plusieurs tranches</li>
        <li><?= icone('video') ?>Cours en direct, vidéos à revoir et présentiel à Akpakpa</li>
      </ul>
    </div>
    <?= partiel('visuel-hero') ?>
  </div>
</section>

<!-- 3. Pourquoi DIMO Tech Academy ? -->
<section class="section" id="pourquoi" aria-labelledby="pourquoi-titre">
  <div class="conteneur">
    <div class="section-entete" data-reveler>
      <p class="surtitre">Notre différence</p>
      <h2 id="pourquoi-titre">Pourquoi DIMO Tech Academy ?</h2>
    </div>
    <ul class="grille-atouts">
      <?php foreach ([
          ['diplome', 'Formations professionnalisantes', 'Des programmes construits autour des métiers et des outils demandés en entreprise.'],
          ['pratique', 'Apprentissage pratique', 'Une théorie courte et de la pratique sur des projets réels qui nourrissent votre portfolio.'],
          ['certificat', 'Certifications', 'Un certificat de fin de parcours qui atteste de vos compétences.'],
          ['accompagnement', 'Accompagnement professionnel', 'Des mentors pendant le parcours et un accompagnement vers l’emploi ou les premiers clients.'],
          ['globe', 'Marché africain et international', 'Des compétences adaptées aux réalités du marché africain comme international.'],
      ] as [$ico, $titre, $texte]): ?>
        <li class="carte carte-atout" data-reveler>
          <span class="carte-icone"><?= icone($ico) ?></span>
          <h3><?= e($titre) ?></h3>
          <p><?= e($texte) ?></p>
        </li>
      <?php endforeach; ?>
    </ul>
    <ul class="bandeau-appui" data-reveler>
      <li><strong>Pédagogie hybride</strong><span>Cours en direct, vidéos à revoir et présentiel au siège d’Akpakpa.</span></li>
      <li><strong>Un portfolio concret</strong><span>Chaque projet réalisé devient une preuve de vos compétences.</span></li>
      <li><strong>Accompagnement vers l’emploi</strong><span>Nous vous préparons à l’emploi ou à vos premiers clients.</span></li>
      <li><strong>Les femmes au cœur de la tech</strong><span>Nous encourageons les femmes à rejoindre les métiers du numérique.</span></li>
    </ul>
    <p class="phrase-cle" data-reveler>Notre objectif : transformer la connaissance en compétence, et la compétence en opportunité.</p>
  </div>
</section>

<!-- 4. Nos formations -->
<section class="section section-grise" id="formations" aria-labelledby="formations-titre">
  <div class="conteneur">
    <div class="section-entete" data-reveler>
      <p class="surtitre">Catalogue 2026</p>
      <h2 id="formations-titre">Nos formations</h2>
      <p>Du premier pas gratuit au parcours professionnel certifiant. Prix en F CFA, visibles dès la carte.</p>
    </div>
    <div class="onglets" data-onglets>
      <div class="onglets-liste" role="tablist" aria-label="Catégories de formations">
        <?php $i = 0; foreach ($groupes as $slug => $g): ?>
          <button class="onglet" type="button" role="tab" id="onglet-<?= e($slug) ?>" aria-controls="panneau-<?= e($slug) ?>" aria-selected="<?= $i === 0 ? 'true' : 'false' ?>" tabindex="<?= $i === 0 ? '0' : '-1' ?>"><?= e($g['categorie']['onglet']) ?><span class="onglet-compte"><?= count($g['formations']) ?></span></button>
        <?php $i++; endforeach; ?>
      </div>
      <?php $i = 0; foreach ($groupes as $slug => $g): ?>
        <div class="onglet-panneau" role="tabpanel" id="panneau-<?= e($slug) ?>" aria-labelledby="onglet-<?= e($slug) ?>" tabindex="0"<?= $i > 0 ? ' hidden' : '' ?>>
          <?php if ($g['categorie']['accroche']): ?><p class="panneau-intro"><?= e($g['categorie']['accroche']) ?></p><?php endif; ?>
          <div class="grille-cartes" data-n="<?= count($g['formations']) ?>">
            <?php foreach ($g['formations'] as $f): ?><?= partiel('carte-formation', ['f' => $f]) ?><?php endforeach; ?>
          </div>
        </div>
      <?php $i++; endforeach; ?>
    </div>
    <p class="centre"><a class="lien-fleche" href="<?= e(url('/formations')) ?>">Voir le catalogue complet avec filtres <?= icone('fleche') ?></a></p>
  </div>
</section>

<!-- 5. Trouvez la formation qui vous correspond -->
<section class="section" id="trouver" aria-labelledby="trouver-titre">
  <div class="conteneur conteneur-etroit">
    <div class="section-entete" data-reveler>
      <p class="surtitre">Mini-parcours</p>
      <h2 id="trouver-titre">Trouvez la formation qui vous correspond</h2>
      <p class="question-quiz">Quel est votre objectif ?</p>
    </div>
    <div class="quiz" data-quiz>
      <div class="quiz-options" role="group" aria-label="Votre objectif">
        <?php foreach (OBJECTIFS_QUIZ as $cle => $libelle): ?>
          <button class="quiz-option" type="button" aria-pressed="false" aria-controls="quiz-<?= e($cle) ?>" data-objectif="<?= e($cle) ?>">
            <?= icone(['decouvrir-ia' => 'etincelle', 'ia-business' => 'mallette', 'metier-data' => 'graphique', 'pro-ia' => 'robot', 'cyber-iot' => 'bouclier', 'equipe' => 'equipe'][$cle]) ?>
            <span><?= e($libelle) ?></span>
          </button>
        <?php endforeach; ?>
      </div>
      <div class="quiz-resultats" aria-live="polite">
        <?php foreach (OBJECTIFS_QUIZ as $cle => $libelle): ?>
          <div class="quiz-resultat" id="quiz-<?= e($cle) ?>" hidden>
            <?php if ($cle === 'equipe'): ?>
              <p class="quiz-intro">Nos formules entreprises : <strong>Essentielle</strong>, <strong>Premium</strong>, <strong>Corporate</strong> et l’<strong>option en ligne</strong>, avec un programme adapté à votre secteur.</p>
              <div class="quiz-actions">
                <a class="btn btn-bleu" href="#entreprises">Voir les formules entreprises</a>
                <a class="btn btn-contour" href="<?= e(url('/entreprises#devis')) ?>">Demander une formation sur mesure</a>
              </div>
            <?php elseif ($objectifs[$cle]): ?>
              <p class="quiz-intro">Nos recommandations pour vous :</p>
              <ul class="quiz-liste">
                <?php foreach ($objectifs[$cle] as $f): ?>
                  <li class="quiz-item">
                    <div>
                      <a class="quiz-titre" href="<?= e($f['url']) ?>"><?= e($f['titre']) ?></a>
                      <span class="quiz-meta"><?= e($f['duree_affichee']) ?> · <?= e($f['prix_detail'] ? 'dès ' . prix($f['prix_min']) : $f['prix_affiche']) ?><?= $f['badge'] ? ' · ' . e($f['badge']) : '' ?></span>
                    </div>
                    <a class="btn btn-corail btn-petit" href="<?= e(url('/inscription', ['formation' => $f['slug']])) ?>" data-inscription="<?= e($f['slug']) ?>"><?= $f['gratuite'] ? 'Réserver' : 'S’inscrire' ?><span class="sr"> à <?= e($f['titre']) ?></span></a>
                  </li>
                <?php endforeach; ?>
              </ul>
            <?php else: ?>
              <p class="quiz-intro">Écrivez-nous : nous vous orientons vers la formation adaptée.</p>
            <?php endif; ?>
          </div>
        <?php endforeach; ?>
      </div>
      <noscript><p class="centre"><a class="lien-fleche" href="<?= e(url('/formations')) ?>">Parcourir toutes les formations</a></p></noscript>
    </div>
  </div>
</section>

<!-- 6. Apprenez en pratique -->
<section class="section section-grise" id="pratique" aria-labelledby="pratique-titre">
  <div class="conteneur grille-pratique">
    <div>
      <div class="section-entete section-entete-gauche" data-reveler>
        <p class="surtitre">Pédagogie</p>
        <h2 id="pratique-titre">Apprenez en pratique</h2>
        <p class="accroche-forte">Pas seulement apprendre. Faire. Construire. Maîtriser.</p>
      </div>
      <ul class="liste-pratique">
        <?php foreach ([
            ['projet', 'Projets pratiques', 'Des réalisations concrètes tout au long du parcours.'],
            ['cas', 'Cas réels', 'Des situations inspirées de vrais besoins d’entreprises.'],
            ['exercice', 'Exercices', 'Pour ancrer chaque notion par la pratique.'],
            ['mentor', 'Accompagnement', 'Des formateurs et des mentors pour vous guider.'],
            ['groupe', 'Travaux de groupe', 'Pour apprendre à collaborer comme en entreprise.'],
            ['certificat', 'Certification', 'Vos acquis validés en fin de parcours.'],
        ] as [$ico, $t, $d]): ?>
          <li data-reveler><span class="puce-icone"><?= icone($ico) ?></span><div><strong><?= e($t) ?></strong><span><?= e($d) ?></span></div></li>
        <?php endforeach; ?>
      </ul>
    </div>
    <div class="pratique-visuel" data-reveler>
      <div class="fenetre-code" aria-hidden="true">
        <div class="fenetre-barre"><span></span><span></span><span></span><em>projet_final.ipynb</em></div>
        <pre><code><span class="c-mot">import</span> pandas <span class="c-mot">as</span> pd
ventes = pd.read_csv(<span class="c-txt">"ventes_cotonou.csv"</span>)
ventes.groupby(<span class="c-txt">"mois"</span>)[<span class="c-txt">"montant"</span>].sum()</code></pre>
        <div class="fenetre-graph"><span style="height:38%"></span><span style="height:55%"></span><span style="height:47%"></span><span style="height:72%"></span><span style="height:64%"></span><span class="accent" style="height:88%"></span></div>
      </div>
      <?= partiel('emplacement', ['texte' => 'Photo d’apprenants en atelier pratique', 'ratio' => '16 / 10', 'classe' => 'emplacement-pratique']) ?>
    </div>
  </div>
</section>

<!-- 7. Pour les entreprises -->
<?= partiel('bloc-entreprises', ['complet' => false]) ?>

<!-- 8. Nos apprenants -->
<section class="section" id="apprenants" aria-labelledby="apprenants-titre">
  <div class="conteneur">
    <div class="section-entete" data-reveler>
      <p class="surtitre">Ils se forment avec nous</p>
      <h2 id="apprenants-titre">Nos apprenants</h2>
      <?php if ($phraseCohorte !== ''): ?><p><?= e($phraseCohorte) ?></p><?php endif; ?>
    </div>
    <?php if ($indicateurs): ?>
      <ul class="compteurs" data-reveler>
        <?php foreach ($indicateurs as $k): ?>
          <li><strong data-compteur="<?= (int) $k['valeur'] ?>"><?= e(number_format((int) $k['valeur'], 0, ',', "\u{202F}")) ?></strong><?= $k['suffixe'] ? '<span class="compteur-suffixe">' . e($k['suffixe']) . '</span>' : '' ?><span><?= e($k['libelle']) ?></span></li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
    <?= partiel('temoignages', ['temoignages' => $temoignages]) ?>
  </div>
</section>

<!-- 9. Prochaines sessions -->
<section class="section section-grise" id="sessions" aria-labelledby="sessions-titre">
  <div class="conteneur">
    <div class="section-entete" data-reveler>
      <p class="surtitre">Calendrier</p>
      <h2 id="sessions-titre">Prochaines sessions</h2>
      <p>En présentiel à Akpakpa ou en ligne. Les sessions aux inscriptions ouvertes sont mises en avant.</p>
    </div>
    <?php if ($sessions): ?>
      <div class="liste-sessions">
        <?php foreach ($sessions as $s): ?><?= partiel('carte-session', ['s' => $s]) ?><?php endforeach; ?>
      </div>
      <p class="centre"><a class="lien-fleche" href="<?= e(url('/sessions')) ?>">Voir tout le calendrier <?= icone('fleche') ?></a></p>
    <?php else: ?>
      <?= partiel('liste-attente', ['retour' => '/#sessions']) ?>
    <?php endif; ?>
  </div>
</section>

<!-- 10. Certification & insertion -->
<section class="section section-sombre" id="insertion" aria-labelledby="insertion-titre">
  <div class="conteneur">
    <div class="section-entete" data-reveler>
      <p class="surtitre surtitre-clair">Certification &amp; insertion</p>
      <h2 id="insertion-titre">Préparez votre entrée dans le monde professionnel</h2>
      <p>Une formation n’a de valeur que si elle ouvre des portes. Tout le parcours est pensé pour cela.</p>
    </div>
    <ul class="grille-insertion">
      <?php foreach ([
          ['certificat', 'Certificat de fin de parcours', 'Il atteste des compétences acquises et des projets réalisés.'],
          ['projet', 'Projets pratiques', 'Vous apprenez en réalisant, sur des cas concrets.'],
          ['portfolio', 'Portfolio', 'Vos réalisations rassemblées, avec des dépôts GitHub pour les parcours techniques.'],
          ['mentor', 'Mentors', 'Un accompagnement pendant tout le parcours.'],
          ['stage', 'Stages selon les parcours', 'Prévus notamment pour Data Analyst & BI et Data Scientist.'],
          ['fusee', 'Préparation à l’emploi', 'Ou à vos premiers clients si vous visez l’indépendance.'],
      ] as [$ico, $t, $d]): ?>
        <li data-reveler><span class="carte-icone"><?= icone($ico) ?></span><h3><?= e($t) ?></h3><p><?= e($d) ?></p></li>
      <?php endforeach; ?>
    </ul>
    <?php if ($phraseCohorte !== ''): ?><p class="insertion-preuve" data-reveler><?= icone('valide-cercle') ?><?= e($phraseCohorte) ?></p><?php endif; ?>
    <div class="centre insertion-cta">
      <a class="btn btn-corail btn-large btn-maj" href="#trouver">Je choisis ma formation</a>
    </div>
  </div>
</section>

<!-- 11. FAQ -->
<section class="section" id="faq" aria-labelledby="faq-titre">
  <div class="conteneur conteneur-etroit">
    <div class="section-entete" data-reveler>
      <p class="surtitre">FAQ</p>
      <h2 id="faq-titre">Questions fréquentes</h2>
    </div>
    <?= partiel('accordeon', ['questions' => $faq]) ?>
    <div class="centre faq-cta">
      <a class="lien-fleche" href="<?= e(url('/faq')) ?>">Toutes les questions <?= icone('fleche') ?></a>
      <a class="btn btn-corail btn-maj" href="<?= e(url('/inscription')) ?>" data-inscription="">Je m’inscris</a>
    </div>
  </div>
</section>

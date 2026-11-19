<?php
/**
 * Pages publiques du site.
 */
defined('DTA') || exit;

function page_accueil(): void
{
    compter_vue('/');
    afficher('site/accueil', [
        'page' => 'accueil',
        'groupes' => formations_par_categorie(),
        'objectifs' => formations_pour_objectifs(),
        'sessions' => sessions_a_venir([], 6),
        'temoignages' => temoignages(),
        'indicateurs' => indicateurs_visibles(),
        'faq' => faq_liste(true),
        'meta' => [
            'titre' => 'DIMO Tech Academy — Formations Data & IA à Cotonou et en ligne',
            'description' => 'Première académie hybride Data & IA du Bénin. Masterclass gratuites, parcours Data, IA et Tech de 1 jour à 12 mois, certificats et accompagnement vers l’emploi.',
            'jsonld' => jsonld_organisation(),
        ],
    ]);
}

function jsonld_organisation(): array
{
    $reseaux = array_values(array_filter([cfg('reseaux.facebook'), cfg('reseaux.linkedin'), cfg('reseaux.tiktok')]));
    return [
        '@context' => 'https://schema.org',
        '@type' => 'EducationalOrganization',
        'name' => 'DIMO Tech Academy',
        'url' => url_absolue('/'),
        'logo' => url_absolue('/assets/img/logo.png'),
        'slogan' => 'La Data et l’IA à votre portée…',
        'foundingDate' => '2022',
        'parentOrganization' => ['@type' => 'Organization', 'name' => 'DIMO Group'],
        'address' => ['@type' => 'PostalAddress', 'addressLocality' => 'Cotonou', 'streetAddress' => 'Akpakpa', 'addressCountry' => 'BJ'],
        'sameAs' => $reseaux,
    ];
}

function page_formations(): void
{
    compter_vue('/formations');
    $filtres = [
        'categorie' => param('categorie'),
        'niveau' => param('niveau'),
        'mode' => param('format'),
        'prix' => param('prix'),
        'q' => mb_substr(param('q'), 0, 80),
    ];
    if ($filtres['categorie'] && !categorie_par_slug($filtres['categorie'])) {
        $filtres['categorie'] = '';
    }
    $formations = formations($filtres);
    $actifs = array_filter($filtres);
    afficher('site/formations', [
        'page' => 'formations',
        'formations' => $formations,
        'filtres' => $filtres,
        'nbFiltres' => count($actifs),
        'meta' => [
            'titre' => 'Catalogue des formations Data, IA et Tech — DIMO Tech Academy',
            'description' => 'Toutes nos formations : masterclass gratuites, Data Starter, Data Analyst & BI, Data Engineer, IA générative, agents IA, Data Scientist, Ingénieur IA, cybersécurité et IoT. Prix en F CFA.',
            'robots' => $actifs ? 'noindex, follow' : null,
        ],
    ]);
}

function page_formation(string $slug): void
{
    $f = formation_par_slug($slug, est_admin());
    if (!$f) {
        page_introuvable();
    }
    compter_vue('/formations/' . $slug);
    $modules = modules_de((int) $f['id']);
    $sessions = sessions_a_venir(['formation_id' => $f['id']]);
    $autres = array_slice(array_values(array_filter(
        formations(['categorie' => $f['categorie_slug']]),
        fn($x) => $x['id'] !== $f['id']
    )), 0, 3);

    $offres = [[
        '@type' => 'Offer',
        'price' => (string) $f['prix'],
        'priceCurrency' => 'XOF',
        'category' => $f['gratuite'] ? 'Free' : 'Paid',
        'availability' => 'https://schema.org/InStock',
        'url' => url_absolue('/formations/' . $f['slug']),
    ]];
    $jsonld = [
        '@context' => 'https://schema.org',
        '@type' => 'Course',
        'name' => $f['titre'],
        'description' => tronquer($f['accroche'] ?: (string) $f['probleme'], 280),
        'url' => url_absolue('/formations/' . $f['slug']),
        'inLanguage' => 'fr',
        'educationalLevel' => $f['niveau'],
        'provider' => ['@type' => 'EducationalOrganization', 'name' => 'DIMO Tech Academy', 'sameAs' => url_absolue('/')],
        'offers' => $offres,
        'isAccessibleForFree' => $f['gratuite'],
    ];
    if ($f['objectifs']) {
        $jsonld['teaches'] = $f['objectifs'];
    }
    if ($f['certification'] !== 'aucune') {
        $jsonld['educationalCredentialAwarded'] = $f['certification_label'];
    }
    if ($sessions) {
        $jsonld['hasCourseInstance'] = array_map(fn($s) => [
            '@type' => 'CourseInstance',
            'courseMode' => $s['format'] === 'en_ligne' ? 'online' : ($s['format'] === 'hybride' ? 'blended' : 'onsite'),
            'startDate' => $s['date_debut'],
            'location' => $s['format'] === 'en_ligne' ? null : ($s['lieu'] ?: 'Akpakpa, Cotonou'),
        ], array_slice($sessions, 0, 5));
    } else {
        $jsonld['hasCourseInstance'] = [[
            '@type' => 'CourseInstance',
            'courseMode' => match ($f['mode']) { 'en_ligne' => 'online', 'presentiel' => 'onsite', default => 'blended' },
            'courseWorkload' => $f['duree_label'] ?: null,
        ]];
    }

    afficher('site/formation', [
        'page' => 'formations',
        'corps' => 'page-fiche',
        'f' => $f,
        'modules' => $modules,
        'formateur' => formateur_par_id($f['formateur_id'] ? (int) $f['formateur_id'] : null),
        'sessions' => $sessions,
        'autres' => $autres,
        'meta' => [
            'titre' => $f['titre'] . ' — ' . ($f['gratuite'] ? 'Masterclass gratuite' : 'Formation ' . $f['duree_label']) . ' | DIMO Tech Academy',
            'description' => tronquer(($f['accroche'] ?: $f['probleme']) . ' ' . ($f['gratuite'] ? 'Gratuit.' : $f['prix_affiche'] . '.'), 158),
            'image' => $f['image'] ? url_absolue('/uploads/' . $f['image']) : null,
            'type' => 'product',
            'robots' => $f['statut'] !== 'publie' ? 'noindex' : null,
            'jsonld' => $jsonld,
        ],
    ]);
}

function page_masterclass(): void
{
    compter_vue('/masterclass');
    afficher('site/masterclass', [
        'page' => 'masterclass',
        'formations' => formations(['categorie' => 'masterclass']),
        'sessions' => sessions_a_venir(['categorie' => 'masterclass']),
        'replays' => replays_masterclass(),
        'meta' => [
            'titre' => 'Masterclass gratuites Data & IA — DIMO Tech Academy',
            'description' => 'Sessions courtes et gratuites pour découvrir l’IA, la Data et Power BI. Réservez votre place et retrouvez les replays.',
        ],
    ]);
}

function page_parcours(): void
{
    compter_vue('/parcours');
    $groupes = formations_par_categorie();
    unset($groupes['masterclass']);
    afficher('site/parcours', [
        'page' => 'parcours',
        'groupes' => $groupes,
        'meta' => [
            'titre' => 'Parcours Data, IA et Tech — de 1 jour à 12 mois | DIMO Tech Academy',
            'description' => 'Parcours professionnalisants en Data, IA, cybersécurité et IoT : pédagogie hybride, projets réels, mentors, stages selon les parcours et certificat de fin de parcours.',
        ],
    ]);
}

function page_entreprises(): void
{
    compter_vue('/entreprises');
    afficher('site/entreprises', [
        'page' => 'entreprises',
        'formules' => FORMULES_ENTREPRISES,
        'meta' => [
            'titre' => 'Formations IA & Data pour les entreprises — DIMO Tech Academy',
            'description' => 'Formez vos équipes à l’IA générative, aux agents IA, à Power BI et à l’analyse de données. Formules sur site de 2 jours ou en ligne, programme adapté à votre secteur.',
        ],
    ]);
}

/** Validation commune des formulaires de contact, devis et liste d'attente. */
function valider_demande(array $requis): array
{
    $v = [
        'nom' => mb_substr(champ('nom'), 0, 190),
        'email' => mb_strtolower(mb_substr(champ('email'), 0, 190)),
        'telephone' => mb_substr(nettoyer_telephone(champ('telephone')), 0, 40),
        'organisation' => mb_substr(champ('organisation'), 0, 190),
        'sujet' => mb_substr(champ('sujet'), 0, 190),
        'message' => mb_substr(champ('message'), 0, 5000),
    ];
    $erreurs = [];
    if (mb_strlen($v['nom']) < 2) {
        $erreurs['nom'] = 'Indiquez votre nom.';
    }
    if (!est_email($v['email'])) {
        $erreurs['email'] = 'Indiquez une adresse e-mail valide.';
    }
    foreach ($requis as $c => $message) {
        if (($v[$c] ?? '') === '') {
            $erreurs[$c] = $message;
        }
    }
    if (empty($_POST['consentement'])) {
        $erreurs['consentement'] = 'Merci d’accepter l’utilisation de vos données pour traiter votre demande.';
    }
    return [$erreurs, $v];
}

function repondre_formulaire(array $erreurs, string $retour, string $succes): never
{
    if (est_ajax()) {
        json_reponse($erreurs ? ['ok' => false, 'erreurs' => $erreurs] : ['ok' => true, 'message' => $succes]);
    }
    if ($erreurs) {
        memoriser_saisie($_POST);
        flash('erreur', implode(' ', $erreurs));
    } else {
        flash('succes', $succes);
    }
    rediriger($retour);
}

function envoyer_devis(): void
{
    if (est_robot() || !limite('devis', 20, 3600)) {
        repondre_formulaire([], '/entreprises#devis', 'Merci, votre demande a bien été envoyée.');
    }
    [$erreurs, $v] = valider_demande(['organisation' => 'Indiquez le nom de votre organisation.', 'telephone' => 'Indiquez un numéro pour vous rappeler.']);
    $details = [
        'formule' => mb_substr(champ('formule'), 0, 60),
        'participants' => mb_substr(champ('participants'), 0, 20),
        'besoins' => array_values(array_intersect((array) ($_POST['besoins'] ?? []), BESOINS_ENTREPRISES)),
        'modalite' => mb_substr(champ('modalite'), 0, 40),
    ];
    if (!$erreurs) {
        DB::inserer('demandes', [
            'type' => 'devis',
            'nom' => $v['nom'],
            'email' => $v['email'],
            'telephone' => $v['telephone'],
            'organisation' => $v['organisation'],
            'sujet' => 'Formation sur mesure' . ($details['formule'] ? ' — ' . $details['formule'] : ''),
            'message' => $v['message'],
            'details' => json_encode($details, JSON_UNESCAPED_UNICODE),
            'consentement_le' => maintenant(),
            'cree_le' => maintenant(),
        ]);
        prevenir_equipe('Demande de devis : ' . $v['organisation'], 'equipe-demande', ['type' => 'Demande de devis entreprise', 'v' => $v, 'details' => $details], $v['email']);
        envoyer_email($v['email'], 'Votre demande de formation sur mesure — DIMO Tech Academy', 'accuse-reception', ['nom' => $v['nom'], 'objet' => 'votre demande de formation sur mesure']);
    }
    repondre_formulaire($erreurs, '/entreprises#devis', 'Merci ! Votre demande est enregistrée. Notre équipe vous recontacte rapidement avec une proposition adaptée.');
}

const BESOINS_ENTREPRISES = [
    'IA générative au bureau (ChatGPT, Claude, Copilot)',
    'Agents IA et automatisation des tâches',
    'Power BI et tableaux de bord',
    'Analyse de données',
    'Accompagnement Data avec DIMO Tech',
    'Autre besoin',
];

function page_sessions(): void
{
    compter_vue('/sessions');
    $filtres = [
        'categorie' => param('categorie'),
        'format' => array_key_exists(param('format'), FORMATS_SESSION) ? param('format') : '',
        'mois' => param('mois'),
    ];
    afficher('site/sessions', [
        'page' => 'sessions',
        'sessions' => sessions_a_venir($filtres),
        'toutes' => sessions_a_venir(),
        'filtres' => $filtres,
        'meta' => [
            'titre' => 'Prochaines sessions — DIMO Tech Academy',
            'description' => 'Calendrier des prochaines sessions de formation Data, IA et Tech, en présentiel à Akpakpa (Cotonou) ou en ligne. Places limitées.',
        ],
    ]);
}

function inscrire_liste_attente(): void
{
    $retour = champ('retour') && str_starts_with(champ('retour'), '/') ? champ('retour') : '/sessions';
    if (est_robot() || !limite('attente', 30, 3600)) {
        repondre_formulaire([], $retour, 'Merci, vous êtes sur la liste d’attente.');
    }
    [$erreurs, $v] = valider_demande([]);
    $formationId = (int) champ('formation_id') ?: null;
    if ($formationId && !formation_par_id($formationId)) {
        $formationId = null;
    }
    if (!$erreurs) {
        DB::inserer('demandes', [
            'type' => 'liste_attente',
            'nom' => $v['nom'],
            'email' => $v['email'],
            'telephone' => $v['telephone'],
            'formation_id' => $formationId,
            'sujet' => 'Liste d’attente',
            'consentement_le' => maintenant(),
            'cree_le' => maintenant(),
        ]);
        $titre = $formationId ? formation_par_id($formationId)['titre'] : 'prochaines sessions';
        prevenir_equipe('Liste d’attente : ' . $titre, 'equipe-demande', ['type' => 'Inscription sur liste d’attente (' . $titre . ')', 'v' => $v, 'details' => []], $v['email']);
    }
    repondre_formulaire($erreurs, $retour, 'C’est noté ! Vous serez prévenu(e) dès l’ouverture des prochaines dates.');
}

function page_a_propos(): void
{
    compter_vue('/a-propos');
    afficher('site/a-propos', [
        'page' => 'a-propos',
        'formateurs' => formateurs_publies(),
        'meta' => [
            'titre' => 'À propos — DIMO Tech Academy, académie Data & IA à Cotonou',
            'description' => 'Branche formation de DIMO Group créée en 2022 à Cotonou, DIMO Tech Academy forme aux métiers de la Data et de l’IA avec une pédagogie hybride et des projets réels.',
        ],
    ]);
}

function page_contact(): void
{
    compter_vue('/contact');
    afficher('site/contact', [
        'page' => 'contact',
        'meta' => [
            'titre' => 'Contact — DIMO Tech Academy',
            'description' => 'Écrivez-nous ou contactez-nous sur WhatsApp. Siège à Akpakpa, Cotonou (Bénin).',
        ],
    ]);
}

function envoyer_contact(): void
{
    if (est_robot() || !limite('contact', 30, 3600)) {
        repondre_formulaire([], '/contact', 'Merci, votre message a bien été envoyé.');
    }
    [$erreurs, $v] = valider_demande(['message' => 'Écrivez votre message.']);
    if (!$erreurs) {
        DB::inserer('demandes', [
            'type' => 'contact',
            'nom' => $v['nom'],
            'email' => $v['email'],
            'telephone' => $v['telephone'],
            'sujet' => $v['sujet'] ?: 'Message depuis le site',
            'message' => $v['message'],
            'consentement_le' => maintenant(),
            'cree_le' => maintenant(),
        ]);
        prevenir_equipe('Message : ' . ($v['sujet'] ?: $v['nom']), 'equipe-demande', ['type' => 'Message depuis la page Contact', 'v' => $v, 'details' => []], $v['email']);
        envoyer_email($v['email'], 'Nous avons bien reçu votre message — DIMO Tech Academy', 'accuse-reception', ['nom' => $v['nom'], 'objet' => 'votre message']);
    }
    repondre_formulaire($erreurs, '/contact', 'Merci ! Votre message est bien arrivé. Nous vous répondons rapidement.');
}

function page_faq(): void
{
    compter_vue('/faq');
    $faq = faq_liste();
    afficher('site/faq', [
        'page' => 'faq',
        'faq' => $faq,
        'meta' => [
            'titre' => 'Questions fréquentes — DIMO Tech Academy',
            'description' => 'Inscription, paiement Mobile Money en plusieurs tranches, formats en ligne et présentiel, certificats, formations pour les entreprises : toutes les réponses.',
            'jsonld' => [
                '@context' => 'https://schema.org',
                '@type' => 'FAQPage',
                'mainEntity' => array_map(fn($q) => [
                    '@type' => 'Question',
                    'name' => $q['question'],
                    'acceptedAnswer' => ['@type' => 'Answer', 'text' => $q['reponse']],
                ], $faq),
            ],
        ],
    ]);
}

function page_mentions(): void
{
    afficher('site/mentions-legales', ['page' => 'legal', 'meta' => ['titre' => 'Mentions légales — DIMO Tech Academy']]);
}

function page_confidentialite(): void
{
    afficher('site/confidentialite', ['page' => 'legal', 'meta' => ['titre' => 'Politique de confidentialité — DIMO Tech Academy']]);
}

/**
 * Redirige vers WhatsApp : le numéro ne figure jamais dans le code des pages.
 * Paramètres : m (message prérempli) ou i (jeton d'inscription → message de paiement).
 */
function rediriger_whatsapp(): void
{
    $numero = preg_replace('/\D/', '', (string) cfg('contact.whatsapp', '')) ?? '';
    $message = mb_substr(param('m'), 0, 800);
    if (($jeton = param('i')) && ($ins = inscription_par_jeton($jeton))) {
        $message = message_whatsapp_paiement($ins);
    }
    if ($message === '') {
        $message = 'Bonjour DIMO Tech Academy, je souhaite avoir des informations sur vos formations.';
    }
    if ($numero === '') {
        flash('info', 'Notre numéro WhatsApp sera bientôt disponible. Écrivez-nous avec ce formulaire, nous vous répondons rapidement.');
        rediriger('/contact');
    }
    header('X-Robots-Tag: noindex');
    rediriger('https://wa.me/' . $numero . '?text=' . rawurlencode($message), 302);
}

function plan_du_site(): void
{
    $pages = ['/', '/formations', '/masterclass', '/parcours', '/entreprises', '/sessions', '/a-propos', '/contact', '/faq', '/mentions-legales', '/confidentialite'];
    header('Content-Type: application/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($pages as $p) {
        echo '  <url><loc>' . e(url_absolue($p)) . '</loc><changefreq>weekly</changefreq><priority>' . ($p === '/' ? '1.0' : '0.7') . "</priority></url>\n";
    }
    foreach (formations() as $f) {
        echo '  <url><loc>' . e(url_absolue('/formations/' . $f['slug'])) . '</loc><lastmod>' . e(substr((string) $f['maj_le'], 0, 10)) . "</lastmod><priority>0.8</priority></url>\n";
    }
    echo '</urlset>';
}

function fichier_robots(): void
{
    header('Content-Type: text/plain; charset=utf-8');
    echo "User-agent: *\nDisallow: /admin\nDisallow: /espace\nDisallow: /inscription/suivi\nDisallow: /whatsapp\n\nSitemap: " . url_absolue('/sitemap.xml') . "\n";
}

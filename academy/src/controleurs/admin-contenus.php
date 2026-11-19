<?php
/**
 * Administration des collections (formations, sessions, formateurs, témoignages, indicateurs, FAQ, catégories)
 * et des contenus pédagogiques (modules, vidéos, directs, supports).
 */
defined('DTA') || exit;

const LIEU_SIEGE = 'Siège DIMO Tech Academy, Akpakpa (Cotonou)';

/** Description de chaque collection : champs du formulaire et colonnes de la liste. */
function ressources_admin(): array
{
    $categories = array_column(DB::tous('SELECT id, onglet FROM categories ORDER BY ordre'), 'onglet', 'id');
    return [
        'formations' => [
            'titre' => 'Formations',
            'singulier' => 'une formation',
            'table' => 'formations',
            'ordre' => '(SELECT ordre FROM categories c WHERE c.id = categorie_id), ordre, titre',
            'horodatage' => true,
            'aide' => 'Une formation publiée apparaît automatiquement dans le catalogue, les onglets de l’accueil, le mini-parcours et le plan du site. Les modules et les vidéos se gèrent avec le bouton « Contenus ».',
            'colonnes' => [
                'titre' => ['Formation', fn($r) => '<strong>' . e($r['titre']) . '</strong><br><span class="muted">' . e($categories[$r['categorie_id']] ?? '') . '</span>'],
                'prix' => ['Prix', fn($r) => (int) $r['prix'] === 0 ? 'Gratuit' : e(prix((int) $r['prix'])) . ($r['prix_en_ligne'] !== null ? '<br><span class="muted">' . e(prix((int) $r['prix_en_ligne'])) . ' en ligne</span>' : '')],
                'duree_label' => ['Durée', fn($r) => e($r['duree_label'])],
                'statut' => ['Statut', fn($r) => $r['statut'] === 'publie' ? '<span class="pastille pastille-ok">Publiée</span>' : '<span class="pastille">Brouillon</span>'],
            ],
            'actions' => fn($r) => '<a class="btn-lien" href="' . e(url('/admin/formations/' . $r['id'] . '/contenus')) . '">Contenus</a><a class="btn-lien" href="' . e(url('/formations/' . $r['slug'])) . '" target="_blank" rel="noopener">Voir</a>',
            'champs' => [
                ['groupe' => 'Essentiel'],
                ['titre', 'Titre de la formation', 'text', ['requis' => true, 'max' => 190]],
                ['categorie_id', 'Catégorie (onglet)', 'select', ['options' => $categories, 'requis' => true]],
                ['statut', 'Statut', 'select', ['options' => ['publie' => 'Publiée (visible sur le site)', 'brouillon' => 'Brouillon (masquée)'], 'defaut' => 'brouillon']],
                ['niveau', 'Niveau', 'select', ['options' => array_combine(NIVEAUX, NIVEAUX)]],
                ['slug', 'Adresse de la page', 'slug', ['aide' => 'Partie finale de l’adresse (ex. data-starter). Laisser vide pour la générer à partir du titre.', 'depuis' => 'titre']],
                ['ordre', 'Ordre d’affichage', 'number', ['defaut' => 0, 'aide' => 'Les plus petits nombres s’affichent en premier.']],
                ['groupe' => 'Présentation (fiche formation)'],
                ['accroche', 'Accroche (carte et référencement)', 'textarea', ['lignes' => 2, 'max' => 300, 'aide' => 'Une ou deux phrases courtes.']],
                ['probleme', 'Problème résolu', 'textarea', ['lignes' => 3]],
                ['objectifs', 'Objectifs', 'liste', ['aide' => 'Un objectif par ligne.']],
                ['public_cible', 'Public cible', 'textarea', ['lignes' => 2]],
                ['prerequis', 'Prérequis', 'textarea', ['lignes' => 2]],
                ['resultat', 'Résultat en fin de formation', 'textarea', ['lignes' => 2, 'aide' => 'Ex. : certificat, portfolio, stage.']],
                ['debouches', 'Débouchés', 'liste', ['aide' => 'Un métier par ligne.']],
                ['groupe' => 'Format, durée et prix'],
                ['mode', 'Format', 'select', ['options' => MODES_FORMATION, 'aide' => '« Présentiel ou en ligne, au choix » fait apparaître le choix du format à l’inscription.']],
                ['format_label', 'Texte du format (facultatif)', 'text', ['aide' => 'Remplace le texte par défaut, ex. « Présentiel à Akpakpa ou en ligne ».']],
                ['duree_label', 'Durée', 'text', ['aide' => 'Ex. : 1 jour, 3 jours, 6 mois.', 'max' => 60]],
                ['prix', 'Prix (F CFA)', 'number', ['defaut' => 0, 'aide' => '0 = gratuit (badge GRATUIT). Prix en présentiel si un prix en ligne différent existe.']],
                ['prix_en_ligne', 'Prix en ligne (F CFA, facultatif)', 'number', ['vide_null' => true, 'aide' => 'Seulement si le prix en ligne est différent.']],
                ['mention_prix', 'Mention à côté du prix', 'text', ['aide' => 'Ex. : kit fourni.']],
                ['certification', 'Certification', 'select', ['options' => CERTIFICATIONS, 'aide' => '« Certificat de fin de parcours » affiche le badge CERTIFIANT.']],
                ['stage', 'Stage prévu', 'checkbox'],
                ['groupe' => 'Formateur, visuel et questions'],
                ['formateur_id', 'Formateur', 'relation', ['table' => 'formateurs', 'libelle' => 'nom', 'vide' => 'À présenter prochainement']],
                ['image', 'Visuel de la formation (facultatif)', 'image'],
                ['quiz', 'Recommandée dans « Trouvez votre formation » pour…', 'multicheck', ['options' => array_diff_key(OBJECTIFS_QUIZ, ['equipe' => 1])]],
                ['faq', 'Questions fréquentes de la fiche', 'faq', ['aide' => 'Une question par bloc : la première ligne est la question, les suivantes la réponse. Séparez les blocs par une ligne vide.']],
            ],
        ],
        'sessions' => [
            'titre' => 'Sessions',
            'singulier' => 'une session',
            'table' => 'sessions',
            'ordre' => 'date_debut DESC, heure_debut',
            'horodatage' => 'cree_le',
            'aide' => 'Une session est une date de démarrage (cohorte, journée, masterclass). Les sessions ouvertes apparaissent dans le calendrier et dans le formulaire d’inscription.',
            'colonnes' => [
                'date_debut' => ['Date', fn($r) => '<strong>' . e(date_fr($r['date_debut'], false, true)) . '</strong>' . ($r['heure_debut'] ? '<br><span class="muted">' . e(heure_fr($r['heure_debut'])) . '</span>' : '')],
                'formation_id' => ['Formation', fn($r) => e(DB::valeur('SELECT titre FROM formations WHERE id = ?', [$r['formation_id']])) . ($r['intitule'] ? '<br><span class="muted">' . e($r['intitule']) . '</span>' : '')],
                'format' => ['Format', fn($r) => e(FORMATS_SESSION[$r['format']] ?? '')],
                'places' => ['Places', function ($r) {
                    $n = (int) DB::valeur("SELECT COUNT(*) FROM inscriptions WHERE session_id = ? AND statut <> 'annulee'", [$r['id']]);
                    return $n . ($r['places'] !== null ? ' / ' . (int) $r['places'] : '') . ' inscrit' . ($n > 1 ? 's' : '');
                }],
                'statut' => ['État', fn($r) => $r['statut'] === 'annulee' ? '<span class="pastille pastille-ko">Annulée</span>' : ($r['date_debut'] < date('Y-m-d') ? '<span class="pastille">Passée</span>' : ($r['inscriptions_ouvertes'] ? '<span class="pastille pastille-ok">Inscriptions ouvertes</span>' : '<span class="pastille">Fermée</span>'))],
            ],
            'champs' => [
                ['groupe' => 'Session'],
                ['formation_id', 'Formation', 'relation', ['table' => 'formations', 'libelle' => 'titre', 'requis' => true]],
                ['intitule', 'Intitulé (facultatif)', 'text', ['aide' => 'Ex. : Cohorte de janvier, Masterclass spéciale entrepreneuses.']],
                ['date_debut', 'Date de début', 'date', ['requis' => true]],
                ['heure_debut', 'Heure de début', 'time'],
                ['date_fin', 'Date de fin (facultatif)', 'date'],
                ['horaires', 'Rythme / horaires', 'text', ['aide' => 'Ex. : samedis 9 h–13 h, ou 3 soirs par semaine.']],
                ['format', 'Format', 'select', ['options' => FORMATS_SESSION]],
                ['lieu', 'Lieu (présentiel)', 'text', ['defaut' => LIEU_SIEGE]],
                ['groupe' => 'Inscriptions'],
                ['places', 'Nombre de places', 'number', ['vide_null' => true, 'aide' => 'Laisser vide si illimité. Les places restantes s’affichent automatiquement.']],
                ['inscriptions_ouvertes', 'Inscriptions ouvertes', 'checkbox', ['defaut' => 1]],
                ['statut', 'Statut', 'select', ['options' => ['planifiee' => 'Planifiée', 'terminee' => 'Terminée', 'annulee' => 'Annulée']]],
                ['note', 'Note affichée (facultatif)', 'text', ['max' => 300, 'aide' => 'Ex. : Places limitées, apportez votre ordinateur.']],
                ['groupe' => 'En ligne'],
                ['lien_visio', 'Lien de la visio', 'url', ['aide' => 'Visible par les inscrits 24 h avant le début, dans leur espace.']],
                ['replay_url', 'Lien du replay (YouTube non répertorié)', 'url', ['aide' => 'Pour une masterclass gratuite, le replay est affiché sur la page Masterclass.']],
            ],
        ],
        'formateurs' => [
            'titre' => 'Formateurs',
            'singulier' => 'un formateur',
            'table' => 'formateurs',
            'ordre' => 'ordre, nom',
            'colonnes' => [
                'nom' => ['Nom', fn($r) => '<strong>' . e($r['nom']) . '</strong><br><span class="muted">' . e($r['role']) . '</span>'],
                'publie' => ['Visible', fn($r) => $r['publie'] ? 'Oui' : 'Non'],
            ],
            'champs' => [
                ['nom', 'Prénom et nom', 'text', ['requis' => true]],
                ['role', 'Rôle / spécialité', 'text'],
                ['bio', 'Présentation courte', 'textarea', ['lignes' => 4]],
                ['photo', 'Photo', 'image'],
                ['linkedin', 'Profil LinkedIn', 'url'],
                ['publie', 'Visible sur le site', 'checkbox', ['defaut' => 1]],
                ['ordre', 'Ordre', 'number', ['defaut' => 0]],
            ],
        ],
        'temoignages' => [
            'titre' => 'Témoignages',
            'singulier' => 'un témoignage',
            'table' => 'temoignages',
            'ordre' => 'ordre, id',
            'aide' => 'Uniquement de vrais témoignages d’apprenants, avec leur accord.',
            'colonnes' => [
                'nom' => ['Apprenant', fn($r) => '<strong>' . e($r['nom']) . '</strong><br><span class="muted">' . e($r['formation']) . '</span>'],
                'texte' => ['Témoignage', fn($r) => e(tronquer($r['texte'], 90))],
                'publie' => ['Visible', fn($r) => $r['publie'] ? 'Oui' : 'Non'],
            ],
            'champs' => [
                ['nom', 'Prénom et nom', 'text', ['requis' => true]],
                ['formation', 'Formation suivie', 'text'],
                ['texte', 'Témoignage', 'textarea', ['requis' => true, 'lignes' => 4]],
                ['photo', 'Photo', 'image'],
                ['publie', 'Visible sur le site', 'checkbox', ['defaut' => 1]],
                ['ordre', 'Ordre', 'number', ['defaut' => 0]],
            ],
        ],
        'indicateurs' => [
            'titre' => 'Compteurs',
            'singulier' => 'un compteur',
            'table' => 'indicateurs',
            'ordre' => 'ordre, id',
            'aide' => 'Un compteur sans valeur reste masqué sur le site. Ne saisissez que des chiffres vérifiés.',
            'colonnes' => [
                'libelle' => ['Compteur', fn($r) => '<strong>' . e($r['libelle']) . '</strong>'],
                'valeur' => ['Valeur', fn($r) => $r['valeur'] === null ? '<span class="muted">Masqué (non renseigné)</span>' : e(number_format((int) $r['valeur'], 0, ',', ' ') . ($r['suffixe'] ?? ''))],
            ],
            'champs' => [
                ['libelle', 'Libellé', 'text', ['requis' => true, 'max' => 120]],
                ['valeur', 'Valeur', 'number', ['vide_null' => true, 'aide' => 'Laisser vide pour masquer le compteur.']],
                ['suffixe', 'Suffixe', 'text', ['max' => 10, 'aide' => 'Ex. : % ou +']],
                ['ordre', 'Ordre', 'number', ['defaut' => 0]],
            ],
        ],
        'faq' => [
            'titre' => 'Questions fréquentes',
            'singulier' => 'une question',
            'table' => 'faq',
            'ordre' => 'ordre, id',
            'aide' => 'Les questions cochées « Accueil » apparaissent sur la page d’accueil (huit conseillées). Toutes apparaissent sur la page FAQ.',
            'colonnes' => [
                'question' => ['Question', fn($r) => '<strong>' . e($r['question']) . '</strong><br><span class="muted">' . e($r['rubrique']) . '</span>'],
                'accueil' => ['Accueil', fn($r) => $r['accueil'] ? 'Oui' : '—'],
            ],
            'champs' => [
                ['question', 'Question', 'text', ['requis' => true, 'max' => 300]],
                ['reponse', 'Réponse', 'textarea', ['requis' => true, 'lignes' => 5]],
                ['rubrique', 'Rubrique', 'select', ['options' => array_combine(RUBRIQUES_FAQ, RUBRIQUES_FAQ)]],
                ['accueil', 'Afficher sur l’accueil', 'checkbox'],
                ['ordre', 'Ordre', 'number', ['defaut' => 0]],
            ],
        ],
        'categories' => [
            'titre' => 'Catégories',
            'singulier' => 'une catégorie',
            'table' => 'categories',
            'ordre' => 'ordre, id',
            'aide' => 'Les catégories forment les onglets du catalogue. L’identifiant (masterclass, data, ia, tech) ne se modifie pas.',
            'sans_suppression' => true,
            'colonnes' => [
                'onglet' => ['Onglet', fn($r) => '<strong>' . e($r['onglet']) . '</strong><br><span class="muted">' . e($r['slug']) . '</span>'],
                'accroche' => ['Texte d’introduction', fn($r) => e(tronquer((string) $r['accroche'], 80))],
            ],
            'champs' => [
                ['nom', 'Nom', 'text', ['requis' => true]],
                ['onglet', 'Titre de l’onglet', 'text', ['requis' => true]],
                ['slug', 'Identifiant', 'slug', ['depuis' => 'nom', 'verrouille' => true]],
                ['accroche', 'Texte d’introduction', 'textarea', ['lignes' => 2]],
                ['ordre', 'Ordre', 'number', ['defaut' => 0]],
            ],
        ],
    ];
}

const RUBRIQUES_FAQ = ['Inscription', 'Formats', 'Paiement', 'Certification', 'Entreprises', 'Espace apprenant'];

function ressource_ou_404(string $nom): array
{
    $r = ressources_admin()[$nom] ?? null;
    if (!$r) {
        page_introuvable();
    }
    $r['nom'] = $nom;
    return $r;
}

function admin_liste(string $ressource): void
{
    exiger_admin();
    $r = ressource_ou_404($ressource);
    $lignes = DB::tous('SELECT * FROM `' . $r['table'] . '` ORDER BY ' . $r['ordre']);
    afficher('admin/liste', ['r' => $r, 'lignes' => $lignes, 'meta' => ['titre' => $r['titre']]], 'admin');
}

function admin_formulaire(string $ressource, ?string $id = null): void
{
    exiger_admin();
    $r = ressource_ou_404($ressource);
    $ligne = null;
    if ($id !== null) {
        $ligne = DB::un('SELECT * FROM `' . $r['table'] . '` WHERE id = ?', [(int) $id]) ?? page_introuvable();
    }
    if (isset($_SESSION['saisie'])) {
        $ligne = array_merge($ligne ?? [], $_SESSION['saisie']);
        unset($_SESSION['saisie']);
    }
    afficher('admin/formulaire', [
        'r' => $r,
        'ligne' => $ligne,
        'id' => $id !== null ? (int) $id : null,
        'meta' => ['titre' => ($id ? 'Modifier ' : 'Ajouter ') . $r['singulier']],
    ], 'admin');
}

/** Convertit la saisie du formulaire en valeurs pour la base. Renvoie [données, erreurs]. */
function lire_champs(array $r, ?array $ancienne): array
{
    $donnees = [];
    $erreurs = [];
    foreach ($r['champs'] as $c) {
        if (isset($c['groupe'])) {
            continue;
        }
        [$nom, $libelle, $type] = $c;
        $o = $c[3] ?? [];
        $brut = $_POST[$nom] ?? null;
        switch ($type) {
            case 'checkbox':
                $val = !empty($brut) ? 1 : 0;
                break;
            case 'number':
                $s = is_string($brut) ? trim(str_replace([' ', "\u{202F}", "\u{00A0}"], '', $brut)) : '';
                $val = $s === '' ? (!empty($o['vide_null']) ? null : (int) ($o['defaut'] ?? 0)) : (int) $s;
                break;
            case 'liste':
                $val = json_encode(array_values(array_filter(array_map('trim', preg_split('/\R/', (string) $brut) ?: []))), JSON_UNESCAPED_UNICODE);
                break;
            case 'multicheck':
                $val = json_encode(array_values(array_intersect((array) $brut, array_keys($o['options']))), JSON_UNESCAPED_UNICODE);
                break;
            case 'faq':
                $blocs = preg_split('/\R\s*\R/', trim((string) $brut)) ?: [];
                $faq = [];
                foreach ($blocs as $b) {
                    $l = preg_split('/\R/', trim($b)) ?: [];
                    $q = trim((string) array_shift($l));
                    $rep = trim(implode("\n", $l));
                    if ($q !== '' && $rep !== '') {
                        $faq[] = ['q' => $q, 'r' => $rep];
                    }
                }
                $val = json_encode($faq, JSON_UNESCAPED_UNICODE);
                break;
            case 'image':
                $val = $ancienne[$nom] ?? null;
                if (!empty($_POST[$nom . '_supprimer'])) {
                    supprimer_fichier_public($val);
                    $val = null;
                }
                try {
                    if ($nouvelle = enregistrer_image($nom, $r['nom'])) {
                        supprimer_fichier_public($val);
                        $val = $nouvelle;
                    }
                } catch (RuntimeException $ex) {
                    $erreurs[$nom] = $libelle . ' : ' . $ex->getMessage();
                }
                break;
            case 'slug':
                if (!empty($o['verrouille']) && $ancienne) {
                    continue 2;
                }
                $s = slugifier(trim((string) $brut) ?: (string) ($_POST[$o['depuis']] ?? ''));
                $val = $s;
                break;
            case 'relation':
            case 'select':
                $val = is_string($brut) && $brut !== '' ? $brut : null;
                if ($type === 'relation') {
                    $val = $val !== null ? (int) $val : null;
                }
                break;
            default:
                $val = is_string($brut) ? trim($brut) : '';
                if (isset($o['max'])) {
                    $val = mb_substr($val, 0, (int) $o['max']);
                }
                if ($val === '' && in_array($type, ['url', 'date', 'time', 'email', 'text', 'textarea'], true)) {
                    $val = null;
                }
                if ($type === 'url' && $val !== null && !preg_match('#^https?://#i', $val)) {
                    $erreurs[$nom] = $libelle . ' : l’adresse doit commencer par https://';
                }
        }
        if (!empty($o['requis']) && ($val === null || $val === '' || $val === '[]')) {
            $erreurs[$nom] = $libelle . ' est obligatoire.';
        }
        $donnees[$nom] = $val;
    }
    return [$donnees, $erreurs];
}

function admin_enregistrer(string $ressource, ?string $id = null): void
{
    exiger_admin();
    $r = ressource_ou_404($ressource);
    $ancienne = $id !== null ? (DB::un('SELECT * FROM `' . $r['table'] . '` WHERE id = ?', [(int) $id]) ?? page_introuvable()) : null;
    [$donnees, $erreurs] = lire_champs($r, $ancienne);

    // Identifiant d'URL unique
    if (isset($donnees['slug'])) {
        $base = $donnees['slug'];
        $n = 2;
        while (DB::valeur('SELECT id FROM `' . $r['table'] . '` WHERE slug = ? AND id <> ?', [$donnees['slug'], (int) $id])) {
            $donnees['slug'] = $base . '-' . $n++;
        }
    }
    if ($ressource === 'indicateurs' && !$ancienne) {
        $donnees['cle'] = slugifier($donnees['libelle'] ?? 'compteur') . '-' . substr(generer_jeton(2), 0, 4);
    }

    if ($erreurs) {
        memoriser_saisie($_POST);
        flash('erreur', implode(' ', $erreurs));
        rediriger('/admin/' . $ressource . ($id ? '/' . $id : '/nouveau'));
    }
    if (!empty($r['horodatage'])) {
        if ($r['horodatage'] === true) {
            $donnees['maj_le'] = maintenant();
            if (!$ancienne) {
                $donnees['cree_le'] = maintenant();
            }
        } elseif (!$ancienne) {
            $donnees[$r['horodatage']] = maintenant();
        }
    }
    if ($ancienne) {
        DB::modifier($r['table'], $donnees, ['id' => (int) $id]);
        $nouvelId = (int) $id;
    } else {
        $nouvelId = DB::inserer($r['table'], $donnees);
    }
    flash('succes', 'Enregistré.');
    if ($ressource === 'formations' && !$ancienne) {
        flash('info', 'Ajoutez maintenant les modules et les contenus de la formation.');
        rediriger('/admin/formations/' . $nouvelId . '/contenus');
    }
    rediriger(champ('_continuer') ? '/admin/' . $ressource . '/' . $nouvelId : '/admin/' . $ressource);
}

function admin_supprimer(string $ressource, string $id): void
{
    exiger_admin();
    $r = ressource_ou_404($ressource);
    if (!empty($r['sans_suppression'])) {
        flash('erreur', 'Cet élément ne peut pas être supprimé.');
        rediriger('/admin/' . $ressource);
    }
    $ligne = DB::un('SELECT * FROM `' . $r['table'] . '` WHERE id = ?', [(int) $id]) ?? page_introuvable();
    if ($ressource === 'formations' && DB::valeur('SELECT COUNT(*) FROM inscriptions WHERE formation_id = ?', [$id])) {
        flash('erreur', 'Cette formation a des inscriptions : passez-la en « Brouillon » pour la masquer au lieu de la supprimer.');
        rediriger('/admin/formations/' . $id);
    }
    try {
        DB::supprimer($r['table'], ['id' => (int) $id]);
        foreach ($r['champs'] as $c) {
            if (!isset($c['groupe']) && $c[2] === 'image') {
                supprimer_fichier_public($ligne[$c[0]] ?? null);
            }
        }
        flash('succes', 'Supprimé.');
    } catch (PDOException) {
        flash('erreur', 'Suppression impossible : cet élément est utilisé ailleurs.');
    }
    rediriger('/admin/' . $ressource);
}

function admin_dupliquer(string $ressource, string $id): void
{
    exiger_admin();
    $r = ressource_ou_404($ressource);
    if (!in_array($ressource, ['sessions', 'formations'], true)) {
        page_introuvable();
    }
    $ligne = DB::un('SELECT * FROM `' . $r['table'] . '` WHERE id = ?', [(int) $id]) ?? page_introuvable();
    unset($ligne['id']);
    if ($ressource === 'formations') {
        $ligne['titre'] .= ' (copie)';
        $ligne['slug'] = $ligne['slug'] . '-copie-' . substr(generer_jeton(2), 0, 4);
        $ligne['statut'] = 'brouillon';
        $ligne['cree_le'] = $ligne['maj_le'] = maintenant();
        $nouvel = DB::inserer('formations', $ligne);
        foreach (modules_de((int) $id) as $m) {
            unset($m['id']);
            $m['formation_id'] = $nouvel;
            DB::inserer('modules', $m);
        }
    } else {
        $ligne['lien_visio'] = null;
        $ligne['replay_url'] = null;
        $ligne['cree_le'] = maintenant();
        $nouvel = DB::inserer('sessions', $ligne);
    }
    flash('succes', 'Copie créée : modifiez-la puis enregistrez.');
    rediriger('/admin/' . $ressource . '/' . $nouvel);
}

// ── Contenus pédagogiques ─────────────────────────────────────

const TYPES_LECON = [
    'video' => 'Vidéo (YouTube non répertorié, Vimeo, Google Drive)',
    'direct' => 'Séance en direct (puis replay)',
    'document' => 'Support téléchargeable',
    'lien' => 'Lien externe (exercice, dépôt GitHub, outil)',
];

function admin_contenus(string $id): void
{
    exiger_admin();
    $f = formation_par_id((int) $id) ?? page_introuvable();
    afficher('admin/contenus', [
        'f' => $f,
        'modules' => modules_de((int) $id),
        'lecons' => DB::tous('SELECT * FROM lecons WHERE formation_id = ? ORDER BY ordre, COALESCE(date_direct, cree_le), id', [$id]),
        'sessions' => DB::tous('SELECT id, date_debut, intitule FROM sessions WHERE formation_id = ? ORDER BY date_debut DESC', [$id]),
        'edition' => (int) param('lecon'),
        'editionModule' => (int) param('module'),
        'meta' => ['titre' => 'Contenus — ' . $f['titre']],
    ], 'admin');
}

function admin_enregistrer_module(string $id): void
{
    exiger_admin();
    $f = formation_par_id((int) $id) ?? page_introuvable();
    $donnees = [
        'code' => mb_substr(champ('code'), 0, 10) ?: null,
        'titre' => mb_substr(champ('titre'), 0, 190),
        'description' => champ('description') ?: null,
        'ordre' => (int) champ('ordre'),
    ];
    if ($donnees['titre'] === '') {
        flash('erreur', 'Le titre du module est obligatoire.');
        rediriger('/admin/formations/' . $id . '/contenus');
    }
    $mid = (int) champ('module_id');
    if ($mid) {
        DB::modifier('modules', $donnees, ['id' => $mid, 'formation_id' => $f['id']]);
    } else {
        $donnees['formation_id'] = $f['id'];
        DB::inserer('modules', $donnees);
    }
    DB::modifier('formations', ['maj_le' => maintenant()], ['id' => $f['id']]);
    flash('succes', 'Module enregistré.');
    rediriger('/admin/formations/' . $id . '/contenus#modules');
}

function admin_supprimer_module(string $id): void
{
    exiger_admin();
    $m = DB::un('SELECT * FROM modules WHERE id = ?', [(int) $id]) ?? page_introuvable();
    DB::supprimer('modules', ['id' => $m['id']]);
    flash('succes', 'Module supprimé. Ses contenus sont conservés dans « Sans module ».');
    rediriger('/admin/formations/' . $m['formation_id'] . '/contenus#modules');
}

function admin_enregistrer_lecon(string $id): void
{
    $admin = exiger_admin();
    $f = formation_par_id((int) $id) ?? page_introuvable();
    $lid = (int) champ('lecon_id');
    $ancienne = $lid ? DB::un('SELECT * FROM lecons WHERE id = ? AND formation_id = ?', [$lid, $f['id']]) : null;
    $type = array_key_exists(champ('type'), TYPES_LECON) ? champ('type') : 'video';
    $moduleId = (int) champ('module_id') ?: null;
    $sessionId = (int) champ('session_id') ?: null;
    if ($moduleId && !DB::valeur('SELECT 1 FROM modules WHERE id = ? AND formation_id = ?', [$moduleId, $f['id']])) {
        $moduleId = null;
    }
    if ($sessionId && !DB::valeur('SELECT 1 FROM sessions WHERE id = ? AND formation_id = ?', [$sessionId, $f['id']])) {
        $sessionId = null;
    }
    $dateDirect = champ('date_direct');
    $donnees = [
        'titre' => mb_substr(champ('titre'), 0, 190),
        'description' => champ('description') ?: null,
        'type' => $type,
        'module_id' => $moduleId,
        'session_id' => $sessionId,
        'video_url' => champ('video_url') ?: null,
        'date_direct' => $dateDirect ? date('Y-m-d H:i:s', strtotime($dateDirect)) : null,
        'lien_visio' => champ('lien_visio') ?: null,
        'lien_externe' => champ('lien_externe') ?: null,
        'duree_min' => (int) champ('duree_min') ?: null,
        'publie' => champ('publie') ? 1 : 0,
        'ordre' => (int) champ('ordre'),
    ];
    $erreurs = [];
    if ($donnees['titre'] === '') {
        $erreurs[] = 'Le titre est obligatoire.';
    }
    foreach (['video_url', 'lien_visio', 'lien_externe'] as $c) {
        if ($donnees[$c] && !preg_match('#^https?://#i', $donnees[$c])) {
            $erreurs[] = 'Les liens doivent commencer par https://';
            break;
        }
    }
    if ($type === 'video' && !$donnees['video_url']) {
        $erreurs[] = 'Indiquez le lien de la vidéo.';
    }
    if ($type === 'direct' && !$donnees['date_direct']) {
        $erreurs[] = 'Indiquez la date et l’heure de la séance en direct.';
    }
    if ($donnees['video_url'] && !video_integrable($donnees['video_url'])) {
        $erreurs[] = 'Lien vidéo non reconnu : utilisez un lien YouTube, Vimeo ou Google Drive.';
    }
    try {
        if ($support = enregistrer_support('fichier')) {
            if ($ancienne) {
                supprimer_support($ancienne['fichier']);
            }
            [$donnees['fichier'], $donnees['fichier_nom'], $donnees['fichier_taille']] = $support;
        } elseif ($type === 'document' && !($ancienne['fichier'] ?? null)) {
            $erreurs[] = 'Choisissez le fichier à mettre à disposition.';
        }
    } catch (RuntimeException $e) {
        $erreurs[] = $e->getMessage();
    }
    if ($erreurs) {
        flash('erreur', implode(' ', array_unique($erreurs)));
        rediriger('/admin/formations/' . $id . '/contenus' . ($lid ? '?lecon=' . $lid : '') . '#lecon');
    }

    $nouveauReplay = $ancienne && $ancienne['type'] === 'direct' && !$ancienne['video_url'] && $donnees['video_url'];
    if ($ancienne) {
        DB::modifier('lecons', $donnees, ['id' => $lid]);
    } else {
        $donnees['formation_id'] = $f['id'];
        $donnees['cree_le'] = maintenant();
        $lid = DB::inserer('lecons', $donnees);
    }

    // Prévenir les apprenants d'un nouveau contenu publié (option cochée).
    if ($donnees['publie'] && champ('prevenir')) {
        $titre = $nouveauReplay ? 'Nouveau replay disponible' : ($type === 'direct' ? 'Nouvelle séance en direct' : 'Nouveau contenu disponible');
        $msg = '« ' . $donnees['titre'] . ' » — ' . $f['titre'] . ($type === 'direct' && !$donnees['video_url'] ? ', le ' . date_heure_fr($donnees['date_direct']) . '.' : '.');
        $cibles = DB::tous("SELECT DISTINCT i.* FROM inscriptions i WHERE i.formation_id = ? AND i.statut <> 'annulee'" . ($sessionId ? ' AND i.session_id = ' . (int) $sessionId : ''), [$f['id']]);
        $n = 0;
        foreach ($cibles as $i) {
            if (acces_contenus($i)) {
                notifier((int) $i['utilisateur_id'], $titre, $msg, '/espace/formations/' . $f['slug']);
                $n++;
            }
        }
        flash('info', pluriel($n, 'apprenant') . ' prévenu' . ($n > 1 ? 's' : '') . ' par e-mail et dans leur espace.');
    }
    flash('succes', 'Contenu enregistré.');
    rediriger('/admin/formations/' . $id . '/contenus#lecons');
}

function admin_supprimer_lecon(string $id): void
{
    exiger_admin();
    $l = DB::un('SELECT * FROM lecons WHERE id = ?', [(int) $id]) ?? page_introuvable();
    supprimer_support($l['fichier']);
    DB::supprimer('lecons', ['id' => $l['id']]);
    flash('succes', 'Contenu supprimé.');
    rediriger('/admin/formations/' . $l['formation_id'] . '/contenus#lecons');
}

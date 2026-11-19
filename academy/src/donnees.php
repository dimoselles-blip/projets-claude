<?php
/**
 * Lecture du contenu : formations, catégories, sessions, témoignages, indicateurs, FAQ.
 */
defined('DTA') || exit;

const MODES_FORMATION = [
    'hybride' => 'Hybride : direct, vidéos et présentiel',
    'au_choix' => 'Présentiel ou en ligne, au choix',
    'en_ligne' => 'En ligne',
    'presentiel' => 'Présentiel',
    'selon_session' => 'Format précisé à chaque session',
];

const MODES_COURTS = [
    'hybride' => 'Hybride',
    'au_choix' => 'Présentiel ou en ligne',
    'en_ligne' => 'En ligne',
    'presentiel' => 'Présentiel',
    'selon_session' => 'Selon la session',
];

const FORMATS_SESSION = [
    'presentiel' => 'Présentiel',
    'en_ligne' => 'En ligne',
    'hybride' => 'Hybride',
];

const CERTIFICATIONS = [
    'aucune' => 'Sans certificat',
    'attestation' => 'Attestation',
    'certificat' => 'Certificat de fin de parcours',
];

const NIVEAUX = ['Débutant', 'Intermédiaire', 'Avancé'];

const OBJECTIFS_QUIZ = [
    'decouvrir-ia' => 'Je veux découvrir l’IA',
    'ia-business' => 'Je veux utiliser l’IA dans mon business',
    'metier-data' => 'Je veux apprendre un métier de la Data',
    'pro-ia' => 'Je veux devenir professionnel de l’IA',
    'cyber-iot' => 'Je veux me former à la cybersécurité ou à l’IoT',
    'equipe' => 'Je veux former mon équipe',
];

const TRANCHES_PRIX = [
    'gratuit' => 'Gratuit',
    'moins-50000' => 'Moins de 50 000 F CFA',
    '50000-500000' => 'De 50 000 à 500 000 F CFA',
    'plus-500000' => 'Plus de 500 000 F CFA',
];

/** Formules entreprises du catalogue 2026 (prix en F CFA). */
const FORMULES_ENTREPRISES = [
    ['nom' => 'Essentielle', 'participants' => '5 à 8 participants', 'format' => '2 jours en présentiel', 'prix' => 200000, 'ideal' => 'PME, startups', 'inclus' => ['Programme complet', 'Support pendant 1 mois']],
    ['nom' => 'Premium', 'participants' => '9 à 12 participants', 'format' => '2 jours en présentiel', 'prix' => 300000, 'ideal' => 'Entreprises moyennes, ONG', 'inclus' => ['Programme complet', 'Support', '1 session de suivi sur site'], 'vedette' => true],
    ['nom' => 'Corporate', 'participants' => '13 à 15 participants', 'format' => '2 jours en présentiel', 'prix' => 400000, 'ideal' => 'Grandes entreprises, organisations', 'inclus' => ['Programme complet', '2 sessions de suivi', 'Accompagnement de 3 mois']],
    ['nom' => 'Option en ligne', 'participants' => 'Équipes à distance', 'format' => '4 sessions de 3 h en visio', 'prix' => 180000, 'ideal' => 'Équipes à distance', 'inclus' => ['Programme adapté', 'Sessions en direct']],
];

function categories(): array
{
    static $c = null;
    return $c ??= DB::tous('SELECT * FROM categories ORDER BY ordre, id');
}

function categorie_par_slug(string $slug): ?array
{
    foreach (categories() as $c) {
        if ($c['slug'] === $slug) {
            return $c;
        }
    }
    return null;
}

/** Ajoute à une formation ses champs calculés (badge, prix affiché, URL…). */
function hydrater_formation(array $f): array
{
    $f['objectifs'] = liste($f['objectifs'] ?? null);
    $f['debouches'] = liste($f['debouches'] ?? null);
    $f['faq'] = liste($f['faq'] ?? null);
    $f['quiz'] = liste($f['quiz'] ?? null);
    $f['prix'] = (int) $f['prix'];
    $f['prix_en_ligne'] = $f['prix_en_ligne'] !== null && $f['prix_en_ligne'] !== '' ? (int) $f['prix_en_ligne'] : null;
    $f['gratuite'] = $f['prix'] === 0 && ($f['prix_en_ligne'] ?? 0) === 0;
    $f['badge'] = $f['gratuite'] ? 'GRATUIT' : ($f['certification'] === 'certificat' ? 'CERTIFIANT' : null);
    $f['url'] = url('/formations/' . $f['slug']);
    $f['format_affiche'] = $f['format_label'] ?: (MODES_FORMATION[$f['mode']] ?? '');
    $f['format_court'] = MODES_COURTS[$f['mode']] ?? '';
    $f['certification_label'] = CERTIFICATIONS[$f['certification']] ?? '';
    $f['choix_format'] = $f['mode'] === 'au_choix';
    $f['prix_min'] = $f['prix_en_ligne'] !== null ? min($f['prix'], $f['prix_en_ligne']) : $f['prix'];
    $f['prix_affiche'] = $f['gratuite'] ? 'Gratuit' : prix($f['prix']);
    $f['prix_detail'] = null;
    if (!$f['gratuite'] && $f['prix_en_ligne'] !== null && $f['prix_en_ligne'] !== $f['prix']) {
        $f['prix_detail'] = prix($f['prix'], false) . ' en présentiel · ' . prix($f['prix_en_ligne'], false) . ' en ligne';
    }
    $f['duree_affichee'] = $f['duree_label'] ?: (($f['categorie_slug'] ?? '') === 'masterclass' ? 'Session courte' : '');
    return $f;
}

/**
 * Liste des formations. Filtres : categorie (slug), niveau, mode, prix (clé TRANCHES_PRIX), q (recherche).
 */
function formations(array $filtres = [], bool $publieesSeulement = true): array
{
    $where = [];
    $params = [];
    if ($publieesSeulement) {
        $where[] = "f.statut = 'publie'";
    }
    if (!empty($filtres['categorie'])) {
        $where[] = 'c.slug = :cat';
        $params['cat'] = $filtres['categorie'];
    }
    if (!empty($filtres['niveau'])) {
        $where[] = 'f.niveau = :niv';
        $params['niv'] = $filtres['niveau'];
    }
    if (!empty($filtres['mode'])) {
        if ($filtres['mode'] === 'en_ligne') {
            $where[] = "f.mode IN ('en_ligne', 'au_choix', 'hybride')";
        } elseif ($filtres['mode'] === 'presentiel') {
            $where[] = "f.mode IN ('presentiel', 'au_choix', 'hybride')";
        } else {
            $where[] = 'f.mode = :mode';
            $params['mode'] = $filtres['mode'];
        }
    }
    switch ($filtres['prix'] ?? '') {
        case 'gratuit':
            $where[] = 'f.prix = 0';
            break;
        case 'moins-50000':
            $where[] = 'LEAST(f.prix, COALESCE(f.prix_en_ligne, f.prix)) > 0 AND LEAST(f.prix, COALESCE(f.prix_en_ligne, f.prix)) < 50000';
            break;
        case '50000-500000':
            $where[] = 'LEAST(f.prix, COALESCE(f.prix_en_ligne, f.prix)) BETWEEN 50000 AND 500000';
            break;
        case 'plus-500000':
            $where[] = 'LEAST(f.prix, COALESCE(f.prix_en_ligne, f.prix)) > 500000';
            break;
    }
    if (!empty($filtres['q'])) {
        $where[] = '(f.titre LIKE :q1 OR f.accroche LIKE :q2 OR f.public_cible LIKE :q3)';
        $params += array_fill_keys(['q1', 'q2', 'q3'], '%' . $filtres['q'] . '%');
    }
    $sql = 'SELECT f.*, c.slug AS categorie_slug, c.nom AS categorie_nom, c.onglet AS categorie_onglet
            FROM formations f JOIN categories c ON c.id = f.categorie_id'
        . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
        . ' ORDER BY c.ordre, f.ordre, f.titre';
    return array_map('hydrater_formation', DB::tous($sql, $params));
}

function formation_par_slug(string $slug, bool $inclureBrouillons = false): ?array
{
    $f = DB::un(
        'SELECT f.*, c.slug AS categorie_slug, c.nom AS categorie_nom, c.onglet AS categorie_onglet
         FROM formations f JOIN categories c ON c.id = f.categorie_id WHERE f.slug = ?'
        . ($inclureBrouillons ? '' : " AND f.statut = 'publie'"),
        [$slug]
    );
    return $f ? hydrater_formation($f) : null;
}

function formation_par_id(int $id): ?array
{
    $f = DB::un(
        'SELECT f.*, c.slug AS categorie_slug, c.nom AS categorie_nom, c.onglet AS categorie_onglet
         FROM formations f JOIN categories c ON c.id = f.categorie_id WHERE f.id = ?',
        [$id]
    );
    return $f ? hydrater_formation($f) : null;
}

/** Formations publiées regroupées par catégorie (onglets de l'accueil). */
function formations_par_categorie(): array
{
    $groupes = [];
    foreach (categories() as $c) {
        $groupes[$c['slug']] = ['categorie' => $c, 'formations' => []];
    }
    foreach (formations() as $f) {
        $groupes[$f['categorie_slug']]['formations'][] = $f;
    }
    return array_filter($groupes, fn($g) => $g['formations']);
}

/** Formations recommandées pour un objectif du mini-parcours. */
function formations_pour_objectifs(): array
{
    $res = array_fill_keys(array_keys(OBJECTIFS_QUIZ), []);
    foreach (formations() as $f) {
        foreach ($f['quiz'] as $cle) {
            if (isset($res[$cle])) {
                $res[$cle][] = $f;
            }
        }
    }
    return $res;
}

function modules_de(int $formationId): array
{
    return DB::tous('SELECT * FROM modules WHERE formation_id = ? ORDER BY ordre, id', [$formationId]);
}

function formateur_par_id(?int $id): ?array
{
    return $id ? DB::un('SELECT * FROM formateurs WHERE id = ?', [$id]) : null;
}

function formateurs_publies(): array
{
    return DB::tous('SELECT * FROM formateurs WHERE publie = 1 ORDER BY ordre, nom');
}

/** Complète une session : places restantes, ouverture, libellés. */
function hydrater_session(array $s): array
{
    $s['places'] = $s['places'] !== null ? (int) $s['places'] : null;
    $s['inscrits'] = (int) ($s['inscrits'] ?? 0);
    $s['places_restantes'] = $s['places'] !== null ? max(0, $s['places'] - $s['inscrits']) : null;
    $aVenir = $s['date_debut'] >= date('Y-m-d');
    $s['complete'] = $s['places_restantes'] === 0;
    $s['ouverte'] = (bool) $s['inscriptions_ouvertes'] && $s['statut'] === 'planifiee' && $aVenir && !$s['complete'];
    $s['format_label'] = FORMATS_SESSION[$s['format']] ?? $s['format'];
    $s['titre_affiche'] = $s['intitule'] ?: ($s['formation_titre'] ?? '');
    $s['debut'] = $s['date_debut'] . ' ' . ($s['heure_debut'] ?: '09:00:00');
    return $s;
}

const SQL_SESSIONS = "SELECT s.*, f.titre AS formation_titre, f.slug AS formation_slug, f.prix, f.prix_en_ligne, f.duree_label,
        f.mode AS formation_mode, c.slug AS categorie_slug, c.nom AS categorie_nom,
        (SELECT COUNT(*) FROM inscriptions i WHERE i.session_id = s.id AND i.statut <> 'annulee') AS inscrits
    FROM sessions s
    JOIN formations f ON f.id = s.formation_id
    JOIN categories c ON c.id = f.categorie_id";

/** Sessions à venir (non annulées), avec filtres : formation_id, categorie, format, mois (AAAA-MM). */
function sessions_a_venir(array $filtres = [], ?int $limite = null): array
{
    $where = ["s.date_debut >= CURDATE()", "s.statut = 'planifiee'", "f.statut = 'publie'"];
    $params = [];
    if (!empty($filtres['formation_id'])) {
        $where[] = 's.formation_id = :fid';
        $params['fid'] = (int) $filtres['formation_id'];
    }
    if (!empty($filtres['categorie'])) {
        $where[] = 'c.slug = :cat';
        $params['cat'] = $filtres['categorie'];
    }
    if (!empty($filtres['format'])) {
        $where[] = 's.format = :fmt';
        $params['fmt'] = $filtres['format'];
    }
    if (!empty($filtres['mois']) && preg_match('/^\d{4}-\d{2}$/', $filtres['mois'])) {
        $where[] = "DATE_FORMAT(s.date_debut, '%Y-%m') = :mois";
        $params['mois'] = $filtres['mois'];
    }
    $sql = SQL_SESSIONS . ' WHERE ' . implode(' AND ', $where) . ' ORDER BY s.inscriptions_ouvertes DESC, s.date_debut, s.heure_debut';
    if ($limite) {
        $sql .= ' LIMIT ' . (int) $limite;
    }
    $sessions = array_map('hydrater_session', DB::tous($sql, $params));
    // Sessions ouvertes d'abord, puis par date.
    usort($sessions, fn($a, $b) => [$b['ouverte'], $a['debut']] <=> [$a['ouverte'], $b['debut']]);
    return $sessions;
}

function session_par_id(int $id): ?array
{
    $s = DB::un(SQL_SESSIONS . ' WHERE s.id = ?', [$id]);
    return $s ? hydrater_session($s) : null;
}

/** Replays publics des masterclass passées. */
function replays_masterclass(): array
{
    return array_map('hydrater_session', DB::tous(
        SQL_SESSIONS . " WHERE c.slug = 'masterclass' AND s.replay_url IS NOT NULL AND s.replay_url <> '' ORDER BY s.date_debut DESC LIMIT 12"
    ));
}

function temoignages(): array
{
    return DB::tous('SELECT * FROM temoignages WHERE publie = 1 ORDER BY ordre, id');
}

/** Compteurs renseignés uniquement (un compteur vide reste masqué). */
function indicateurs_visibles(): array
{
    return DB::tous('SELECT * FROM indicateurs WHERE valeur IS NOT NULL ORDER BY ordre, id');
}

function faq_liste(bool $accueilSeulement = false): array
{
    return DB::tous('SELECT * FROM faq' . ($accueilSeulement ? ' WHERE accueil = 1' : '') . ' ORDER BY ordre, id');
}

function afficher_emplacements(): bool
{
    return reglage('afficher_emplacements') === '1';
}

function prix_entreprises_visibles(): bool
{
    return reglage('prix_entreprises') !== 'devis';
}

/** Liste courte pour les menus déroulants (formulaire d'inscription, devis). */
function formations_options(): array
{
    return DB::tous("SELECT f.id, f.slug, f.titre, f.prix, f.prix_en_ligne, f.mode, c.onglet AS categorie
        FROM formations f JOIN categories c ON c.id = f.categorie_id
        WHERE f.statut = 'publie' ORDER BY c.ordre, f.ordre, f.titre");
}

<?php
/**
 * Espace apprenant : connexion, tableau de bord, contenus, profil.
 */
defined('DTA') || exit;

function page_connexion(): void
{
    if ($u = utilisateur()) {
        rediriger($u['role'] === 'admin' ? '/admin' : '/espace');
    }
    afficher('espace/connexion', [
        'page' => 'espace',
        'meta' => ['titre' => 'Espace apprenant — Connexion | DIMO Tech Academy', 'robots' => 'noindex'],
    ]);
}

function traiter_connexion(): void
{
    $email = mb_strtolower(champ('email'));
    $mdp = (string) ($_POST['mot_de_passe'] ?? '');
    if (!limite('connexion', 40, 900) || !limite('connexion-compte', 8, 900, $email)) {
        flash('erreur', 'Trop de tentatives. Patientez 15 minutes ou demandez un lien de connexion par e-mail.');
        rediriger('/espace/connexion');
    }
    $u = utilisateur_par_email($email);
    if (!$u || !$u['mot_de_passe'] || !password_verify($mdp, $u['mot_de_passe'])) {
        memoriser_saisie(['email' => $email]);
        flash('erreur', 'E-mail ou mot de passe incorrect. Pas encore de mot de passe ? Recevez un lien de connexion par e-mail.');
        rediriger('/espace/connexion');
    }
    if (password_needs_rehash($u['mot_de_passe'], PASSWORD_DEFAULT)) {
        DB::modifier('utilisateurs', ['mot_de_passe' => password_hash($mdp, PASSWORD_DEFAULT)], ['id' => $u['id']]);
    }
    connecter((int) $u['id']);
    rediriger(destination_apres_connexion($u));
}

function destination_apres_connexion(array $u): string
{
    $cible = $_SESSION['apres_connexion'] ?? '';
    unset($_SESSION['apres_connexion']);
    $base = base_chemin();
    if (is_string($cible) && $cible !== '' && str_starts_with($cible, $base . '/') && !str_starts_with($cible, '//')) {
        return url_absolue(substr($cible, strlen($base)));
    }
    return $u['role'] === 'admin' ? '/admin' : '/espace';
}

function demander_lien_connexion(): void
{
    $email = mb_strtolower(champ('email'));
    if (est_email($email) && limite('lien', 30, 900) && limite('lien-compte', 3, 900, $email)) {
        if ($u = utilisateur_par_email($email)) {
            envoyer_lien_connexion($u);
        }
    }
    // Même réponse dans tous les cas : on ne révèle pas si un compte existe.
    flash('succes', 'Si un compte existe pour ' . $email . ', un lien de connexion vient d’être envoyé. Pensez à vérifier vos courriers indésirables.');
    rediriger('/espace/connexion');
}

function utiliser_lien_connexion(string $jeton): void
{
    if (!preg_match('/^[a-f0-9]{48}$/', $jeton) || !($id = consommer_lien_connexion($jeton))) {
        flash('erreur', 'Ce lien de connexion a expiré ou a déjà été utilisé. Demandez-en un nouveau.');
        rediriger('/espace/connexion');
    }
    connecter($id);
    $u = DB::un('SELECT * FROM utilisateurs WHERE id = ?', [$id]);
    if (!$u['mot_de_passe']) {
        flash('info', 'Bienvenue ! Vous pouvez créer un mot de passe dans « Mon profil » pour vous connecter plus vite la prochaine fois.');
    }
    rediriger(destination_apres_connexion($u));
}

function traiter_deconnexion(): void
{
    deconnecter();
    demarrer_session();
    flash('succes', 'Vous êtes déconnecté(e). À bientôt !');
    rediriger('/');
}

/** Identifiants des formations accessibles, avec la session (cohorte) de l'apprenant. */
function formations_accessibles(array $inscriptions): array
{
    $acces = [];
    foreach ($inscriptions as $i) {
        if ($i['acces']) {
            $acces[(int) $i['formation_id']][] = $i['session_id'] ? (int) $i['session_id'] : null;
        }
    }
    return $acces;
}

/** Leçons visibles pour l'apprenant dans une formation (les leçons d'une cohorte ne concernent que celle-ci). */
function lecons_visibles(int $formationId, array $sessionsApprenant, bool $tout = false): array
{
    $lecons = DB::tous('SELECT * FROM lecons WHERE formation_id = ? AND publie = 1 ORDER BY ordre, COALESCE(date_direct, cree_le), id', [$formationId]);
    if ($tout) {
        return $lecons;
    }
    return array_values(array_filter($lecons, fn($l) => $l['session_id'] === null || in_array((int) $l['session_id'], $sessionsApprenant, true)));
}

function progression_de(int $uid, array $lecons): array
{
    $suivables = array_filter($lecons, fn($l) => $l['type'] !== 'direct' || $l['video_url']);
    if (!$suivables) {
        return ['faites' => 0, 'total' => 0, 'pourcentage' => 0, 'ids' => []];
    }
    $ids = array_map(fn($l) => (int) $l['id'], $suivables);
    $place = implode(',', array_fill(0, count($ids), '?'));
    $faites = array_map('intval', DB::colonne("SELECT lecon_id FROM progression WHERE utilisateur_id = ? AND lecon_id IN ($place)", array_merge([$uid], $ids)));
    return [
        'faites' => count($faites),
        'total' => count($ids),
        'pourcentage' => (int) round(count($faites) * 100 / count($ids)),
        'ids' => $faites,
    ];
}

function page_espace(): void
{
    $u = exiger_connexion();
    $inscriptions = inscriptions_de((int) $u['id']);
    $acces = formations_accessibles($inscriptions);

    // Progression par formation accessible
    foreach ($inscriptions as &$i) {
        $i['progression'] = null;
        if ($i['acces']) {
            $i['progression'] = progression_de((int) $u['id'], lecons_visibles((int) $i['formation_id'], array_filter($acces[(int) $i['formation_id']] ?? [])));
        }
    }
    unset($i);

    // Prochains rendez-vous en direct : séances programmées + dates de session
    $directs = [];
    foreach ($acces as $fid => $sessions) {
        foreach (lecons_visibles($fid, array_filter($sessions)) as $l) {
            if ($l['type'] === 'direct' && $l['date_direct'] && strtotime($l['date_direct']) > time() - 3 * 3600) {
                $directs[] = [
                    'titre' => $l['titre'],
                    'formation' => DB::valeur('SELECT titre FROM formations WHERE id = ?', [$fid]),
                    'debut' => $l['date_direct'],
                    'lien' => lien_visio_visible($l['date_direct']) ? $l['lien_visio'] : null,
                    'lieu' => null,
                ];
            }
        }
    }
    foreach ($inscriptions as $i) {
        if ($i['acces'] && $i['date_debut'] && $i['date_debut'] >= date('Y-m-d')) {
            $debut = $i['date_debut'] . ' ' . ($i['heure_debut'] ?: '09:00:00');
            $directs[] = [
                'titre' => $i['session_intitule'] ?: 'Démarrage de la session',
                'formation' => $i['formation_titre'],
                'debut' => $debut,
                'lien' => $i['session_format'] !== 'presentiel' && lien_visio_visible($debut) ? $i['session_visio'] : null,
                'lieu' => $i['session_format'] === 'presentiel' ? ($i['session_lieu'] ?: 'Siège DIMO Tech Academy, Akpakpa (Cotonou)') : null,
            ];
        }
    }
    usort($directs, fn($a, $b) => strcmp($a['debut'], $b['debut']));

    // Dernières vidéos et replays publiés
    $recents = [];
    if ($acces) {
        $ids = array_keys($acces);
        $place = implode(',', array_fill(0, count($ids), '?'));
        $recents = DB::tous(
            "SELECT l.*, f.titre AS formation_titre, f.slug AS formation_slug FROM lecons l JOIN formations f ON f.id = l.formation_id
             WHERE l.formation_id IN ($place) AND l.publie = 1 AND l.video_url IS NOT NULL AND l.video_url <> '' ORDER BY l.cree_le DESC LIMIT 4",
            $ids
        );
    }

    $notifications = DB::tous('SELECT * FROM notifications WHERE utilisateur_id = ? ORDER BY cree_le DESC LIMIT 8', [$u['id']]);
    $nonLues = (int) DB::valeur('SELECT COUNT(*) FROM notifications WHERE utilisateur_id = ? AND lu_le IS NULL', [$u['id']]);

    afficher('espace/tableau', [
        'page' => 'espace',
        'u' => $u,
        'inscriptions' => $inscriptions,
        'directs' => array_slice($directs, 0, 3),
        'recents' => $recents,
        'notifications' => $notifications,
        'nonLues' => $nonLues,
        'meta' => ['titre' => 'Mon espace — DIMO Tech Academy', 'robots' => 'noindex'],
    ], 'espace');
}

function page_espace_formation(string $slug): void
{
    $u = exiger_connexion();
    $f = formation_par_slug($slug, true) ?? page_introuvable();
    $inscriptions = array_values(array_filter(inscriptions_de((int) $u['id']), fn($i) => (int) $i['formation_id'] === (int) $f['id'] && $i['statut'] !== 'annulee'));
    $admin = $u['role'] === 'admin';
    $ins = $inscriptions[0] ?? null;
    $acces = $admin || array_filter($inscriptions, fn($i) => $i['acces']);

    if (!$ins && !$admin) {
        flash('info', 'Vous n’êtes pas encore inscrit(e) à cette formation.');
        rediriger('/formations/' . $f['slug']);
    }

    $sessionsApprenant = array_values(array_filter(array_map(fn($i) => $i['session_id'] ? (int) $i['session_id'] : null, $inscriptions)));
    $lecons = $acces ? lecons_visibles((int) $f['id'], $sessionsApprenant, $admin) : [];
    $modules = modules_de((int) $f['id']);
    $parModule = [];
    foreach ($modules as $m) {
        $parModule[(int) $m['id']] = ['module' => $m, 'lecons' => []];
    }
    $sansModule = [];
    $directs = [];
    foreach ($lecons as $l) {
        if ($l['type'] === 'direct' && !$l['video_url']) {
            $l['lien_visible'] = lien_visio_visible($l['date_direct']);
            $directs[] = $l;
            continue;
        }
        if ($l['module_id'] && isset($parModule[(int) $l['module_id']])) {
            $parModule[(int) $l['module_id']]['lecons'][] = $l;
        } else {
            $sansModule[] = $l;
        }
    }
    usort($directs, fn($a, $b) => strcmp((string) $a['date_direct'], (string) $b['date_direct']));

    afficher('espace/formation', [
        'page' => 'espace',
        'u' => $u,
        'f' => $f,
        'ins' => $ins,
        'acces' => (bool) $acces,
        'parModule' => array_filter($parModule, fn($g) => $g['lecons']),
        'modulesVides' => array_filter($parModule, fn($g) => !$g['lecons']),
        'sansModule' => $sansModule,
        'directs' => $directs,
        'progression' => progression_de((int) $u['id'], $lecons),
        'meta' => ['titre' => $f['titre'] . ' — Mon espace | DIMO Tech Academy', 'robots' => 'noindex'],
    ], 'espace');
}

/** Vérifie que l'utilisateur a accès à une leçon. */
function lecon_accessible(array $u, array $lecon): bool
{
    if ($u['role'] === 'admin') {
        return true;
    }
    foreach (inscriptions_de((int) $u['id']) as $i) {
        if ((int) $i['formation_id'] === (int) $lecon['formation_id'] && $i['acces']
            && ($lecon['session_id'] === null || (int) $lecon['session_id'] === (int) $i['session_id'])) {
            return true;
        }
    }
    return false;
}

function marquer_lecon(string $id): void
{
    $u = exiger_connexion();
    $l = DB::un('SELECT * FROM lecons WHERE id = ?', [(int) $id]) ?? page_introuvable();
    if (!lecon_accessible($u, $l)) {
        json_reponse(['ok' => false], 403);
    }
    if (champ('etat') === '0') {
        DB::requete('DELETE FROM progression WHERE utilisateur_id = ? AND lecon_id = ?', [$u['id'], $l['id']]);
    } else {
        DB::requete('INSERT IGNORE INTO progression (utilisateur_id, lecon_id, terminee_le) VALUES (?, ?, ?)', [$u['id'], $l['id'], maintenant()]);
    }
    if (est_ajax()) {
        $slug = DB::valeur('SELECT slug FROM formations WHERE id = ?', [$l['formation_id']]);
        $ins = array_filter(inscriptions_de((int) $u['id']), fn($i) => (int) $i['formation_id'] === (int) $l['formation_id']);
        $sessions = array_values(array_filter(array_map(fn($i) => $i['session_id'] ? (int) $i['session_id'] : null, $ins)));
        json_reponse(['ok' => true, 'progression' => progression_de((int) $u['id'], lecons_visibles((int) $l['formation_id'], $sessions, $u['role'] === 'admin')), 'slug' => $slug]);
    }
    retour_arriere('/espace');
}

function telecharger_support(string $id): void
{
    $u = exiger_connexion();
    $l = DB::un('SELECT * FROM lecons WHERE id = ?', [(int) $id]);
    if (!$l || !$l['fichier'] || !lecon_accessible($u, $l)) {
        page_introuvable();
    }
    $chemin = RACINE . '/storage/fichiers/' . $l['fichier'];
    if (str_contains($l['fichier'], '..') || !is_file($chemin)) {
        page_introuvable();
    }
    $nom = $l['fichier_nom'] ?: basename($chemin);
    $type = (new finfo(FILEINFO_MIME_TYPE))->file($chemin) ?: 'application/octet-stream';
    header('Content-Type: ' . $type);
    header('Content-Length: ' . filesize($chemin));
    header('Content-Disposition: attachment; filename="' . str_replace(['"', "\r", "\n"], '', $nom) . '"; filename*=UTF-8\'\'' . rawurlencode($nom));
    header('Cache-Control: private, max-age=0');
    readfile($chemin);
    exit;
}

function page_profil(): void
{
    $u = exiger_connexion();
    afficher('espace/profil', [
        'page' => 'espace',
        'u' => $u,
        'meta' => ['titre' => 'Mon profil — DIMO Tech Academy', 'robots' => 'noindex'],
    ], 'espace');
}

function enregistrer_profil(): void
{
    $u = exiger_connexion();
    $nom = mb_substr(champ('nom'), 0, 190);
    $tel = mb_substr(nettoyer_telephone(champ('telephone')), 0, 40);
    if (mb_strlen($nom) < 3) {
        flash('erreur', 'Indiquez votre nom complet.');
        rediriger('/espace/profil');
    }
    DB::modifier('utilisateurs', ['nom' => $nom, 'telephone' => $tel ?: null], ['id' => $u['id']]);
    flash('succes', 'Profil mis à jour.');
    rediriger('/espace/profil');
}

function enregistrer_mot_de_passe(): void
{
    $u = exiger_connexion();
    $complet = DB::un('SELECT mot_de_passe FROM utilisateurs WHERE id = ?', [$u['id']]);
    $nouveau = (string) ($_POST['nouveau'] ?? '');
    if ($complet['mot_de_passe'] && !password_verify((string) ($_POST['actuel'] ?? ''), $complet['mot_de_passe'])) {
        flash('erreur', 'Le mot de passe actuel est incorrect.');
        rediriger('/espace/profil');
    }
    if (mb_strlen($nouveau) < 8) {
        flash('erreur', 'Le mot de passe doit contenir au moins 8 caractères.');
        rediriger('/espace/profil');
    }
    if ($nouveau !== (string) ($_POST['confirmation'] ?? '')) {
        flash('erreur', 'Les deux mots de passe ne correspondent pas.');
        rediriger('/espace/profil');
    }
    DB::modifier('utilisateurs', ['mot_de_passe' => password_hash($nouveau, PASSWORD_DEFAULT)], ['id' => $u['id']]);
    flash('succes', 'Mot de passe enregistré.');
    rediriger('/espace/profil');
}

function notifications_lues(): void
{
    $u = exiger_connexion();
    DB::requete('UPDATE notifications SET lu_le = ? WHERE utilisateur_id = ? AND lu_le IS NULL', [maintenant(), $u['id']]);
    est_ajax() ? json_reponse(['ok' => true]) : retour_arriere('/espace');
}

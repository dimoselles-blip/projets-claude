<?php
/**
 * Session, protection CSRF, limites anti-abus et en-têtes de sécurité.
 */
defined('DTA') || exit;

function est_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
        || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
}

function demarrer_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $dossier = RACINE . '/storage/sessions';
    if (is_dir($dossier) && is_writable($dossier)) {
        session_save_path($dossier);
    }
    session_name('dta_session');
    session_set_cookie_params([
        'lifetime' => 60 * 60 * 24 * 14, // l'apprenant reste connecté 14 jours
        'path' => base_chemin() ?: '/',
        'secure' => est_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.gc_maxlifetime', (string) (60 * 60 * 24 * 14));
    ini_set('session.gc_probability', '1');
    ini_set('session.gc_divisor', '200');
    session_start();
}

function entetes_securite(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    if (est_https()) {
        header('Strict-Transport-Security: max-age=31536000');
    }
}

function jeton_csrf(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = generer_jeton(32);
    }
    return $_SESSION['csrf'];
}

function champ_csrf(): string
{
    return '<input type="hidden" name="_csrf" value="' . e(jeton_csrf()) . '">';
}

/** Champ piège invisible : les robots le remplissent, les humains non. */
function champ_piege(): string
{
    return '<div class="piege" aria-hidden="true"><label>Ne pas remplir<input type="text" name="site_web" tabindex="-1" autocomplete="off"></label></div>';
}

function verifier_csrf(): void
{
    $recu = $_POST['_csrf'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!is_string($recu) || !hash_equals(jeton_csrf(), $recu)) {
        if (est_ajax()) {
            json_reponse(['ok' => false, 'erreurs' => ['_' => 'La page a expiré. Rechargez-la puis réessayez.']], 419);
        }
        flash('erreur', 'La page a expiré. Merci de réessayer.');
        retour_arriere();
    }
}

function est_robot(): bool
{
    return trim((string) ($_POST['site_web'] ?? '')) !== '';
}

function ip_client(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

/**
 * Compte une action et renvoie false si la limite est dépassée sur la fenêtre (en secondes).
 */
function limite(string $action, int $max, int $fenetre, ?string $identifiant = null): bool
{
    $cle = hash('sha256', $action . '|' . ($identifiant ?? ip_client()));
    $ligne = DB::un('SELECT compteur, debut FROM limites WHERE cle = ?', [$cle]);
    $now = time();
    if (!$ligne || strtotime($ligne['debut']) + $fenetre < $now) {
        DB::requete('REPLACE INTO limites (cle, compteur, debut) VALUES (?, 1, ?)', [$cle, maintenant()]);
        if (random_int(1, 50) === 1) {
            DB::requete('DELETE FROM limites WHERE debut < ?', [date('Y-m-d H:i:s', $now - 86400)]);
        }
        return true;
    }
    if ((int) $ligne['compteur'] >= $max) {
        return false;
    }
    DB::requete('UPDATE limites SET compteur = compteur + 1 WHERE cle = ?', [$cle]);
    return true;
}

/** Compteur de pages vues sans cookie ni donnée personnelle. */
function compter_vue(string $chemin): void
{
    $ua = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');
    if ($ua === '' || preg_match('/bot|crawl|spider|slurp|preview|monitor|curl|wget|headless|lighthouse/', $ua)) {
        return;
    }
    try {
        DB::requete(
            'INSERT INTO stats_vues (jour, chemin, vues) VALUES (CURDATE(), ?, 1) ON DUPLICATE KEY UPDATE vues = vues + 1',
            [mb_substr($chemin, 0, 190)]
        );
    } catch (Throwable) {
        // Les statistiques ne doivent jamais bloquer l'affichage.
    }
}

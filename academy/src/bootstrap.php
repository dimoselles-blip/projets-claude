<?php
/**
 * Démarrage commun : configuration, gestion des erreurs, base de données, session.
 */
defined('DTA') || exit;

mb_internal_encoding('UTF-8');

$fichierConfig = RACINE . '/config/config.php';
if (!is_file($fichierConfig)) {
    $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
    header('Location: ' . $base . '/install.php');
    exit;
}
$GLOBALS['DTA_CONFIG'] = require $fichierConfig;

require RACINE . '/src/helpers.php';
require RACINE . '/src/db.php';
require RACINE . '/src/securite.php';
require RACINE . '/src/auth.php';
require RACINE . '/src/mail.php';
require RACINE . '/src/donnees.php';
require RACINE . '/src/inscriptions.php';
require RACINE . '/src/fedapay.php';
require RACINE . '/src/fichiers.php';
require RACINE . '/src/contenu.php';
require RACINE . '/src/routeur.php';

date_default_timezone_set((string) cfg('site.fuseau', 'Africa/Porto-Novo'));

define('EN_DEV', cfg('site.environnement') === 'dev');
error_reporting(E_ALL);
ini_set('display_errors', EN_DEV ? '1' : '0');
ini_set('log_errors', '1');
ini_set('error_log', RACINE . '/storage/logs/erreurs.log');

set_exception_handler(function (Throwable $e): void {
    error_log('[' . date('c') . '] ' . get_class($e) . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        http_response_code(500);
    }
    if (EN_DEV) {
        echo '<pre style="white-space:pre-wrap;padding:20px">' . e((string) $e) . '</pre>';
        return;
    }
    try {
        echo vue('site/erreur', ['titre' => 'Une erreur est survenue', 'code' => 500]);
    } catch (Throwable) {
        echo '<h1>Une erreur est survenue</h1><p>Merci de réessayer dans quelques instants.</p>';
    }
});

demarrer_session();

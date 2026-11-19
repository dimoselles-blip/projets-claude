<?php
/**
 * DIMO Tech Academy — point d'entrée unique de la plateforme.
 */
declare(strict_types=1);

define('DTA', true);
define('RACINE', __DIR__);

// Serveur de développement PHP (php -S) : fichiers statiques servis directement.
if (PHP_SAPI === 'cli-server') {
    $fichier = __DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (is_file($fichier) && !preg_match('#/(config|src|views|storage|contenu)/#', $fichier)) {
        return false;
    }
}

require RACINE . '/src/bootstrap.php';
require RACINE . '/src/routes.php';
Routeur::lancer();

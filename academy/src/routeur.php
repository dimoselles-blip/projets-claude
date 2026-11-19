<?php
/**
 * Routeur minimal : associe une méthode HTTP et un chemin (« /formations/{slug} ») à une fonction.
 */
defined('DTA') || exit;

final class Routeur
{
    private static array $routes = [];

    public static function get(string $motif, callable $action): void
    {
        self::$routes[] = ['GET', $motif, $action];
    }

    public static function post(string $motif, callable $action): void
    {
        self::$routes[] = ['POST', $motif, $action];
    }

    public static function chemin_courant(): string
    {
        $chemin = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
        $base = base_chemin();
        if ($base !== '' && str_starts_with($chemin, $base)) {
            $chemin = substr($chemin, strlen($base));
        }
        $chemin = '/' . trim($chemin, '/');
        if ($chemin === '/index.php') {
            $chemin = '/';
        }
        return $chemin;
    }

    public static function lancer(): void
    {
        entetes_securite();
        $methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if ($methode === 'HEAD') {
            $methode = 'GET';
        }
        $chemin = self::chemin_courant();
        $methodeTrouvee = false;

        foreach (self::$routes as [$m, $motif, $action]) {
            $regex = '#^' . preg_replace('#\\\{([a-z_]+)\\\}#', '(?P<$1>[^/]+)', preg_quote($motif, '#')) . '$#';
            if (!preg_match($regex, $chemin, $correspondances)) {
                continue;
            }
            $methodeTrouvee = true;
            if ($m !== $methode) {
                continue;
            }
            if ($methode === 'POST' && !str_starts_with($chemin, '/webhooks/')) {
                verifier_csrf();
            }
            $params = array_filter($correspondances, 'is_string', ARRAY_FILTER_USE_KEY);
            $action(...array_values($params));
            return;
        }

        if ($methodeTrouvee) {
            http_response_code(405);
            echo 'Méthode non autorisée';
            return;
        }
        page_introuvable();
    }
}

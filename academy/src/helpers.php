<?php
/**
 * Fonctions utilitaires partagées par toute la plateforme.
 */
defined('DTA') || exit;

/** Lit un réglage du fichier config/config.php avec une clé « a.b.c ». */
function cfg(string $cle, mixed $defaut = null): mixed
{
    $valeur = $GLOBALS['DTA_CONFIG'] ?? [];
    foreach (explode('.', $cle) as $morceau) {
        if (!is_array($valeur) || !array_key_exists($morceau, $valeur)) {
            return $defaut;
        }
        $valeur = $valeur[$morceau];
    }
    return $valeur;
}

/** Échappe une valeur pour l'affichage HTML. */
function e(mixed $valeur): string
{
    return htmlspecialchars((string) ($valeur ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Chemin de base du site (vide si le site est à la racine du sous-domaine). */
function base_chemin(): string
{
    static $base = null;
    if ($base === null) {
        $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
        if ($base === '.' || $base === '/') {
            $base = '';
        }
    }
    return $base;
}

/** URL interne : url('/formations') → /formations (ou /sous-dossier/formations). */
function url(string $chemin = '/', array $params = []): string
{
    $u = base_chemin() . '/' . ltrim($chemin, '/');
    if ($params) {
        $params = array_filter($params, fn($v) => $v !== null && $v !== '');
        if ($params) {
            $u .= (str_contains($u, '?') ? '&' : '?') . http_build_query($params);
        }
    }
    return $u === '' ? '/' : $u;
}

/** URL absolue (e-mails, plan du site, Open Graph). */
function url_absolue(string $chemin = '/'): string
{
    $site = rtrim((string) cfg('site.url', ''), '/');
    if ($site === '') {
        $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $site = $proto . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . base_chemin();
    }
    return $site . '/' . ltrim($chemin, '/');
}

/** URL d'un fichier statique avec numéro de version (cache navigateur). */
function asset(string $chemin): string
{
    $fichier = RACINE . '/assets/' . ltrim($chemin, '/');
    $v = is_file($fichier) ? substr(md5((string) filemtime($fichier)), 0, 8) : '1';
    return url('/assets/' . ltrim($chemin, '/')) . '?v=' . $v;
}

/** URL d'une image envoyée depuis l'administration (dossier uploads/). */
function media(?string $fichier): ?string
{
    if (!$fichier) {
        return null;
    }
    if (preg_match('#^https?://#', $fichier)) {
        return $fichier;
    }
    return url('/uploads/' . ltrim($fichier, '/'));
}

function rediriger(string $chemin, int $code = 303): never
{
    $cible = preg_match('#^https?://#', $chemin) ? $chemin : url($chemin);
    header('Location: ' . $cible, true, $code);
    exit;
}

function retour_arriere(string $defaut = '/'): never
{
    $ref = $_SERVER['HTTP_REFERER'] ?? '';
    $hote = $_SERVER['HTTP_HOST'] ?? '';
    if ($ref && parse_url($ref, PHP_URL_HOST) === $hote) {
        header('Location: ' . $ref, true, 303);
        exit;
    }
    rediriger($defaut);
}

function est_post(): bool
{
    return ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
}

/** Valeur nettoyée d'un champ POST. */
function champ(string $nom, string $defaut = ''): string
{
    $v = $_POST[$nom] ?? $defaut;
    return is_string($v) ? trim($v) : $defaut;
}

/** Valeur nettoyée d'un paramètre GET. */
function param(string $nom, string $defaut = ''): string
{
    $v = $_GET[$nom] ?? $defaut;
    return is_string($v) ? trim($v) : $defaut;
}

function est_ajax(): bool
{
    return ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch'
        || str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
}

function json_reponse(array $donnees, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function maintenant(): string
{
    return date('Y-m-d H:i:s');
}

/** 75000 → « 75 000 F CFA » (espaces insécables). */
function prix(int|string|null $montant, bool $avecDevise = true): string
{
    $n = number_format((int) $montant, 0, ',', "\u{202F}");
    return $avecDevise ? $n . "\u{00A0}F\u{00A0}CFA" : $n;
}

const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_COURTS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JOURS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** « 2026-12-05 » → « samedi 5 décembre 2026 » (ou format court). */
function date_fr(?string $date, bool $avecJour = false, bool $court = false): string
{
    if (!$date) {
        return '';
    }
    $t = strtotime($date);
    if ($t === false) {
        return '';
    }
    $j = (int) date('j', $t);
    $mois = ($court ? MOIS_COURTS_FR : MOIS_FR)[(int) date('n', $t) - 1];
    $txt = ($j === 1 ? '1er' : (string) $j) . ' ' . $mois . ' ' . date('Y', $t);
    if ($avecJour) {
        $txt = JOURS_FR[(int) date('w', $t)] . ' ' . $txt;
    }
    return $txt;
}

function heure_fr(?string $heure): string
{
    if (!$heure) {
        return '';
    }
    $t = strtotime($heure);
    return $t === false ? '' : date('G\hi', $t);
}

function date_heure_fr(?string $dt): string
{
    if (!$dt) {
        return '';
    }
    return date_fr($dt, true) . ' à ' . heure_fr($dt);
}

/** Texte → identifiant d'URL (« Data Analyst & BI » → « data-analyst-bi »). */
function slugifier(string $texte): string
{
    $t = mb_strtolower($texte);
    $t = strtr($t, ['à' => 'a', 'â' => 'a', 'ä' => 'a', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'î' => 'i', 'ï' => 'i', 'ô' => 'o', 'ö' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ç' => 'c', 'œ' => 'oe', 'æ' => 'ae', '’' => '-', "'" => '-']);
    $t = preg_replace('/[^a-z0-9]+/', '-', $t) ?? '';
    return trim($t, '-') ?: 'element';
}

/** Décode une liste stockée en JSON (tolère du texte à une ligne par élément). */
function liste(mixed $valeur): array
{
    if (is_array($valeur)) {
        return $valeur;
    }
    if (!is_string($valeur) || trim($valeur) === '') {
        return [];
    }
    $d = json_decode($valeur, true);
    if (is_array($d)) {
        return $d;
    }
    return array_values(array_filter(array_map('trim', preg_split('/\R/', $valeur) ?: [])));
}

/** Paragraphes HTML à partir d'un texte brut (les lignes vides séparent les paragraphes). */
function paragraphes(?string $texte, string $classe = ''): string
{
    if (!$texte) {
        return '';
    }
    $blocs = preg_split('/\R{2,}/', trim($texte)) ?: [];
    $c = $classe ? ' class="' . e($classe) . '"' : '';
    return implode('', array_map(fn($b) => '<p' . $c . '>' . nl2br(e(trim($b))) . '</p>', $blocs));
}

function tronquer(string $texte, int $max = 160): string
{
    $texte = trim(preg_replace('/\s+/', ' ', $texte) ?? '');
    if (mb_strlen($texte) <= $max) {
        return $texte;
    }
    return rtrim(mb_substr($texte, 0, $max - 1)) . '…';
}

/** Messages flash (affichés une seule fois après une redirection). */
function flash(string $type, string $message): void
{
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

function flashs(): array
{
    $f = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $f;
}

/** Garde les valeurs d'un formulaire après une erreur de validation. */
function memoriser_saisie(array $valeurs): void
{
    $_SESSION['saisie'] = $valeurs;
}

function ancienne(string $nom, string $defaut = ''): string
{
    return (string) ($_SESSION['saisie_affichee'][$nom] ?? $defaut);
}

/**
 * Rend une vue (views/<nom>.php), éventuellement dans une mise en page (views/layouts/<layout>.php).
 */
function vue(string $nom, array $donnees = [], ?string $layout = 'site'): string
{
    if (isset($_SESSION['saisie'])) {
        $_SESSION['saisie_affichee'] = $_SESSION['saisie'];
        unset($_SESSION['saisie']);
    }
    $contenu = rendre_fichier(RACINE . '/views/' . $nom . '.php', $donnees);
    if ($layout === null) {
        return $contenu;
    }
    $resultat = rendre_fichier(RACINE . '/views/layouts/' . $layout . '.php', $donnees + ['contenu' => $contenu]);
    unset($_SESSION['saisie_affichee']);
    return $resultat;
}

function partiel(string $nom, array $donnees = []): string
{
    return rendre_fichier(RACINE . '/views/partiels/' . $nom . '.php', $donnees);
}

function rendre_fichier(string $__fichier, array $__donnees): string
{
    if (!is_file($__fichier)) {
        throw new RuntimeException('Vue introuvable : ' . $__fichier);
    }
    extract($__donnees, EXTR_SKIP);
    ob_start();
    try {
        include $__fichier;
    } catch (Throwable $e) {
        ob_end_clean();
        throw $e;
    }
    return (string) ob_get_clean();
}

/** Affiche une page complète et termine la requête. */
function afficher(string $nom, array $donnees = [], string $layout = 'site', int $code = 200): never
{
    http_response_code($code);
    echo vue($nom, $donnees, $layout);
    exit;
}

function page_introuvable(): never
{
    afficher('site/erreur', [
        'titre' => 'Page introuvable',
        'code' => 404,
        'meta' => ['titre' => 'Page introuvable', 'robots' => 'noindex'],
    ], 'site', 404);
}

/** Icônes en traits (SVG inline, style cohérent, 24×24). */
function icone(string $nom, string $classe = 'ico'): string
{
    static $chemins = null;
    $chemins ??= require RACINE . '/src/icones.php';
    $d = $chemins[$nom] ?? $chemins['point'];
    return '<svg class="' . e($classe) . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $d . '</svg>';
}

/** Lien de partage WhatsApp, sans jamais écrire le numéro dans la page (redirection serveur). */
function lien_whatsapp(string $message = '', ?string $jeton = null): string
{
    return url('/whatsapp', ['m' => $message ?: null, 'i' => $jeton]);
}

function generer_jeton(int $octets = 16): string
{
    return bin2hex(random_bytes($octets));
}

function texte_ou(string ...$valeurs): string
{
    foreach ($valeurs as $v) {
        if (trim($v) !== '') {
            return $v;
        }
    }
    return '';
}

function est_email(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

/** Garde chiffres et + d'un numéro de téléphone. */
function nettoyer_telephone(string $tel): string
{
    return preg_replace('/[^0-9+]/', '', $tel) ?? '';
}

function pluriel(int $n, string $singulier, ?string $plurielForme = null): string
{
    return $n . "\u{00A0}" . ($n > 1 ? ($plurielForme ?? $singulier . 's') : $singulier);
}

/** Extrait l'identifiant d'une vidéo YouTube ou renvoie null. */
function youtube_id(?string $url): ?string
{
    if (!$url) {
        return null;
    }
    if (preg_match('~(?:youtu\.be/|youtube(?:-nocookie)?\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/|live/))([A-Za-z0-9_-]{11})~', $url, $m)) {
        return $m[1];
    }
    return null;
}

/** URL intégrable (YouTube, Vimeo, Google Drive) ou null. */
function video_integrable(?string $url): ?string
{
    if (!$url) {
        return null;
    }
    if ($id = youtube_id($url)) {
        return 'https://www.youtube-nocookie.com/embed/' . $id . '?rel=0&modestbranding=1';
    }
    if (preg_match('~vimeo\.com/(?:video/)?(\d+)~', $url, $m)) {
        return 'https://player.vimeo.com/video/' . $m[1];
    }
    if (preg_match('~drive\.google\.com/file/d/([A-Za-z0-9_-]+)~', $url, $m)) {
        return 'https://drive.google.com/file/d/' . $m[1] . '/preview';
    }
    return null;
}

function taille_lisible(?int $octets): string
{
    if (!$octets) {
        return '';
    }
    if ($octets < 1024 * 1024) {
        return max(1, (int) round($octets / 1024)) . ' Ko';
    }
    return number_format($octets / 1024 / 1024, 1, ',', ' ') . ' Mo';
}

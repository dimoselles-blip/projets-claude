<?php
/**
 * Envoi de fichiers depuis l'administration.
 *  - Images publiques (photos, visuels) : converties en WebP compressé dans uploads/.
 *  - Supports de cours : stockés hors accès public dans storage/fichiers/, servis après contrôle d'accès.
 */
defined('DTA') || exit;

const EXTENSIONS_SUPPORTS = ['pdf', 'pptx', 'ppt', 'docx', 'doc', 'xlsx', 'xls', 'csv', 'zip', 'txt', 'ipynb', 'py', 'sql', 'pbix', 'png', 'jpg', 'jpeg', 'webp'];

function erreur_envoi(int $code): string
{
    return match ($code) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Le fichier est trop lourd pour l’hébergement.',
        UPLOAD_ERR_PARTIAL => 'Le fichier n’a été envoyé qu’en partie. Réessayez.',
        default => 'L’envoi du fichier a échoué.',
    };
}

/**
 * Enregistre une image envoyée (champ $nom) et renvoie le chemin relatif dans uploads/.
 * Renvoie null si aucun fichier n'a été choisi. Lève une exception si le fichier est invalide.
 */
function enregistrer_image(string $nom, string $sousDossier = 'images', int $largeurMax = 1000): ?string
{
    $f = $_FILES[$nom] ?? null;
    if (!$f || ($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ($f['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException(erreur_envoi((int) $f['error']));
    }
    if ($f['size'] > 8 * 1024 * 1024) {
        throw new RuntimeException('L’image dépasse 8 Mo.');
    }
    $info = @getimagesize($f['tmp_name']);
    if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP, IMAGETYPE_GIF], true)) {
        throw new RuntimeException('Format d’image non reconnu (JPG, PNG ou WebP attendu).');
    }
    $dossier = RACINE . '/uploads/' . $sousDossier;
    if (!is_dir($dossier)) {
        mkdir($dossier, 0755, true);
    }
    $base = $sousDossier . '/' . date('Ymd') . '-' . bin2hex(random_bytes(6));

    $source = match ($info[2]) {
        IMAGETYPE_JPEG => @imagecreatefromjpeg($f['tmp_name']),
        IMAGETYPE_PNG => @imagecreatefrompng($f['tmp_name']),
        IMAGETYPE_WEBP => @imagecreatefromwebp($f['tmp_name']),
        IMAGETYPE_GIF => @imagecreatefromgif($f['tmp_name']),
        default => false,
    };
    if ($source && function_exists('imagewebp')) {
        $l = imagesx($source);
        $h = imagesy($source);
        if ($l > $largeurMax) {
            $nh = (int) round($h * $largeurMax / $l);
            $redim = imagecreatetruecolor($largeurMax, $nh);
            imagealphablending($redim, false);
            imagesavealpha($redim, true);
            imagecopyresampled($redim, $source, 0, 0, 0, 0, $largeurMax, $nh, $l, $h);
            imagedestroy($source);
            $source = $redim;
        }
        imagepalettetotruecolor($source);
        imagesavealpha($source, true);
        imagewebp($source, RACINE . '/uploads/' . $base . '.webp', 80);
        imagedestroy($source);
        return $base . '.webp';
    }
    // Repli si GD/WebP indisponible : copie du fichier d'origine.
    $ext = image_type_to_extension($info[2], false);
    move_uploaded_file($f['tmp_name'], RACINE . '/uploads/' . $base . '.' . $ext);
    return $base . '.' . $ext;
}

/** Enregistre un support de cours privé. Renvoie [chemin interne, nom d'origine, taille] ou null. */
function enregistrer_support(string $nom): ?array
{
    $f = $_FILES[$nom] ?? null;
    if (!$f || ($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ($f['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException(erreur_envoi((int) $f['error']));
    }
    $original = basename((string) $f['name']);
    $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
    if (!in_array($ext, EXTENSIONS_SUPPORTS, true)) {
        throw new RuntimeException('Type de fichier non accepté (' . implode(', ', EXTENSIONS_SUPPORTS) . ').');
    }
    $dossier = RACINE . '/storage/fichiers/' . date('Y-m');
    if (!is_dir($dossier)) {
        mkdir($dossier, 0755, true);
    }
    $interne = date('Y-m') . '/' . bin2hex(random_bytes(12)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], RACINE . '/storage/fichiers/' . $interne)) {
        throw new RuntimeException('Impossible d’enregistrer le fichier sur le serveur.');
    }
    return [$interne, $original, (int) $f['size']];
}

function supprimer_fichier_public(?string $chemin): void
{
    if ($chemin && !preg_match('#^https?://#', $chemin) && !str_contains($chemin, '..')) {
        @unlink(RACINE . '/uploads/' . $chemin);
    }
}

function supprimer_support(?string $chemin): void
{
    if ($chemin && !str_contains($chemin, '..')) {
        @unlink(RACINE . '/storage/fichiers/' . $chemin);
    }
}

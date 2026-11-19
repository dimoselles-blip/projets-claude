<?php
/**
 * DIMO Tech Academy — installateur.
 * Crée les tables, importe le catalogue (contenu/catalogue.json), crée le compte administrateur
 * et écrit le fichier de réglages config/config.php. Se bloque une fois l'installation faite.
 */
declare(strict_types=1);

define('DTA', true);
define('RACINE', __DIR__);

session_name('dta_install');
session_start();

$dejaInstalle = is_file(RACINE . '/config/config.php');
$erreurs = [];
$ok = false;

$proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' ? 'https' : 'http';
$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
$urlDetectee = $proto . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . ($base === '/' ? '' : $base);

$v = [
    'db_hote' => 'localhost', 'db_port' => '3306', 'db_nom' => '', 'db_utilisateur' => '', 'db_mot_de_passe' => '',
    'url' => $urlDetectee, 'admin_nom' => '', 'admin_email' => '', 'admin_mdp' => '', 'contact_email' => 'contact@dimotech.fr', 'whatsapp' => '229433373686',
];

$verifications = [
    ['PHP 8.1 ou plus récent', version_compare(PHP_VERSION, '8.1.0', '>='), 'Version actuelle : ' . PHP_VERSION . '. hPanel → Avancé → Configuration PHP.'],
    ['Extension PDO MySQL', extension_loaded('pdo_mysql'), 'Activez « pdo_mysql » dans la configuration PHP.'],
    ['Extension mbstring', extension_loaded('mbstring'), 'Activez « mbstring » dans la configuration PHP.'],
    ['Extension GD (images WebP)', extension_loaded('gd') && function_exists('imagewebp'), 'Recommandé pour compresser les photos envoyées.'],
    ['Dossier config/ modifiable', is_writable(RACINE . '/config'), 'Donnez les droits d’écriture (755) au dossier config.'],
    ['Dossier storage/ modifiable', is_writable(RACINE . '/storage') && is_writable(RACINE . '/storage/logs') && is_writable(RACINE . '/storage/fichiers'), 'Donnez les droits d’écriture (755) au dossier storage et à ses sous-dossiers.'],
    ['Dossier uploads/ modifiable', is_writable(RACINE . '/uploads'), 'Donnez les droits d’écriture (755) au dossier uploads.'],
];
$bloquant = (bool) array_filter(array_slice($verifications, 0, 3), fn($c) => !$c[1])
    || !$verifications[4][1] || !$verifications[5][1];

if (empty($_SESSION['jeton'])) {
    $_SESSION['jeton'] = bin2hex(random_bytes(16));
}

if (!$dejaInstalle && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    foreach ($v as $k => $_) {
        $v[$k] = trim((string) ($_POST[$k] ?? ''));
    }
    $v['url'] = rtrim($v['url'], '/');
    if (!hash_equals($_SESSION['jeton'], (string) ($_POST['jeton'] ?? ''))) {
        $erreurs[] = 'La page a expiré, rechargez-la.';
    }
    if ($v['db_nom'] === '' || $v['db_utilisateur'] === '') {
        $erreurs[] = 'Indiquez le nom de la base et l’utilisateur MySQL.';
    }
    if (!filter_var($v['url'], FILTER_VALIDATE_URL)) {
        $erreurs[] = 'L’adresse du site n’est pas valide.';
    }
    if (mb_strlen($v['admin_nom']) < 3) {
        $erreurs[] = 'Indiquez le nom de l’administrateur.';
    }
    if (!filter_var($v['admin_email'], FILTER_VALIDATE_EMAIL)) {
        $erreurs[] = 'L’e-mail de l’administrateur n’est pas valide.';
    }
    if (mb_strlen($v['admin_mdp']) < 10) {
        $erreurs[] = 'Le mot de passe administrateur doit contenir au moins 10 caractères.';
    }
    if ($v['contact_email'] !== '' && !filter_var($v['contact_email'], FILTER_VALIDATE_EMAIL)) {
        $erreurs[] = 'L’e-mail de contact n’est pas valide.';
    }
    $v['whatsapp'] = preg_replace('/\D/', '', $v['whatsapp']) ?? '';

    if (!$erreurs && !$bloquant) {
        $GLOBALS['DTA_CONFIG'] = ['site' => ['url' => $v['url']]];
        require RACINE . '/src/helpers.php';
        require RACINE . '/src/db.php';
        require RACINE . '/src/donnees.php';
        require RACINE . '/src/contenu.php';
        date_default_timezone_set('Africa/Porto-Novo');
        try {
            $pdo = DB::connecter($v['db_hote'], (int) $v['db_port'], $v['db_nom'], $v['db_utilisateur'], $v['db_mot_de_passe']);
            DB::utiliser($pdo);

            // 1. Tables
            $sql = preg_replace('/^\s*--.*$/m', '', (string) file_get_contents(RACINE . '/src/schema.sql')) ?? '';
            foreach (array_filter(array_map('trim', explode(';', $sql))) as $instruction) {
                $pdo->exec($instruction);
            }

            // 2. Catalogue
            importer_catalogue(lire_catalogue((string) file_get_contents(RACINE . '/contenu/catalogue.json')));

            // 3. Administrateur
            $email = mb_strtolower($v['admin_email']);
            $existant = DB::valeur('SELECT id FROM utilisateurs WHERE email = ?', [$email]);
            $donnees = ['nom' => $v['admin_nom'], 'mot_de_passe' => password_hash($v['admin_mdp'], PASSWORD_DEFAULT), 'role' => 'admin'];
            $existant
                ? DB::modifier('utilisateurs', $donnees, ['id' => $existant])
                : DB::inserer('utilisateurs', $donnees + ['email' => $email, 'cree_le' => date('Y-m-d H:i:s')]);

            // 4. Fichier de réglages
            $q = fn(string $s) => "'" . addcslashes($s, "'\\") . "'";
            $conf = (string) file_get_contents(RACINE . '/config/config.example.php');
            $conf = str_replace("'url' => 'https://academy.dimotech.fr',", "'url' => " . $q($v['url']) . ',', $conf);
            $conf = str_replace('__CLE_APP__', bin2hex(random_bytes(32)), $conf);
            $conf = preg_replace("/'hote' => 'localhost',/", "'hote' => " . $q($v['db_hote']) . ',', $conf, 1);
            $conf = preg_replace("/'port' => 3306,/", "'port' => " . (int) $v['db_port'] . ',', $conf, 1);
            // Échappement pour preg_replace (les « \\ » et « $ » y sont spéciaux)
            $r = fn(string $s) => str_replace(['\\', '$'], ['\\\\', '\\$'], $q($s));
            $conf = preg_replace("/'nom' => '',/", "'nom' => " . $r($v['db_nom']) . ',', $conf, 1);
            $conf = preg_replace("/'utilisateur' => '',/", "'utilisateur' => " . $r($v['db_utilisateur']) . ',', $conf, 1);
            $conf = preg_replace("/'mot_de_passe' => '',/", "'mot_de_passe' => " . $r($v['db_mot_de_passe']) . ',', $conf, 1);
            if ($v['contact_email'] !== '') {
                $conf = str_replace('contact@dimotech.fr', $v['contact_email'], $conf);
            }
            $conf = preg_replace("/'whatsapp' => '[0-9]*',/", "'whatsapp' => " . $q($v['whatsapp']) . ',', $conf, 1);
            if (file_put_contents(RACINE . '/config/config.php', $conf, LOCK_EX) === false) {
                throw new RuntimeException('Impossible d’écrire config/config.php.');
            }
            @chmod(RACINE . '/config/config.php', 0640);
            $ok = true;
            $dejaInstalle = true;
        } catch (Throwable $e) {
            $erreurs[] = $e instanceof PDOException
                ? 'Connexion ou création des tables impossible : ' . $e->getMessage()
                : $e->getMessage();
        }
    }
}

function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}
?><!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Installation — DIMO Tech Academy</title>
<link rel="icon" href="favicon.ico">
<link rel="stylesheet" href="assets/css/app.css">
</head>
<body class="page-installation">
<main class="installation">
  <div class="installation-carte">
    <img src="assets/img/logo-160.webp" alt="DIMO Tech Academy" width="183" height="160" class="installation-logo">
    <?php if ($ok): ?>
      <h1>Installation terminée</h1>
      <p>La plateforme est prête : tables créées, catalogue 2026 importé, compte administrateur créé et fichier <code>config/config.php</code> écrit.</p>
      <ol class="installation-etapes">
        <li>Supprimez le fichier <code>install.php</code> depuis le gestionnaire de fichiers (il est de toute façon bloqué).</li>
        <li>Ouvrez <code>config/config.php</code> pour régler l’envoi des e-mails (SMTP), les réseaux sociaux et les numéros Mobile Money.</li>
        <li>Connectez-vous à l’administration pour ajouter les dates de sessions.</li>
      </ol>
      <p class="installation-actions"><a class="btn btn-corail" href="espace/connexion">Accéder à l’administration</a> <a class="btn btn-contour" href="./">Voir le site</a></p>
    <?php elseif ($dejaInstalle): ?>
      <h1>Plateforme déjà installée</h1>
      <p>Le fichier <code>config/config.php</code> existe : l’installateur est désactivé. Supprimez <code>install.php</code> du serveur.</p>
      <p class="installation-actions"><a class="btn btn-bleu" href="./">Aller sur le site</a></p>
    <?php else: ?>
      <h1>Installer la plateforme</h1>
      <p class="muted">Environ deux minutes. Créez d’abord une base MySQL dans hPanel → Bases de données → Gestion.</p>

      <ul class="installation-verifs">
        <?php foreach ($verifications as [$libelle, $reussi, $aide]): ?>
          <li class="<?= $reussi ? 'ok' : 'ko' ?>"><span><?= $reussi ? '✓' : '!' ?></span> <?= h($libelle) ?><?php if (!$reussi): ?> <small><?= h($aide) ?></small><?php endif; ?></li>
        <?php endforeach; ?>
      </ul>

      <?php if ($erreurs): ?>
        <div class="alerte alerte-erreur" role="alert"><?php foreach ($erreurs as $e): ?><p><?= h($e) ?></p><?php endforeach; ?></div>
      <?php endif; ?>

      <form method="post" class="formulaire" autocomplete="off">
        <input type="hidden" name="jeton" value="<?= h($_SESSION['jeton']) ?>">
        <fieldset>
          <legend>Base de données MySQL</legend>
          <div class="grille-2">
            <label class="champ"><span>Serveur</span><input name="db_hote" value="<?= h($v['db_hote']) ?>" required></label>
            <label class="champ"><span>Port</span><input name="db_port" value="<?= h($v['db_port']) ?>" inputmode="numeric" required></label>
          </div>
          <label class="champ"><span>Nom de la base</span><input name="db_nom" value="<?= h($v['db_nom']) ?>" placeholder="u123456789_academy" required></label>
          <div class="grille-2">
            <label class="champ"><span>Utilisateur</span><input name="db_utilisateur" value="<?= h($v['db_utilisateur']) ?>" required></label>
            <label class="champ"><span>Mot de passe</span><input type="password" name="db_mot_de_passe" value="<?= h($v['db_mot_de_passe']) ?>"></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Site</legend>
          <label class="champ"><span>Adresse du site</span><input name="url" type="url" value="<?= h($v['url']) ?>" required></label>
          <div class="grille-2">
            <label class="champ"><span>E-mail de contact</span><input name="contact_email" type="email" value="<?= h($v['contact_email']) ?>"></label>
            <label class="champ"><span>WhatsApp (facultatif)</span><input name="whatsapp" value="<?= h($v['whatsapp']) ?>" placeholder="229XXXXXXXXXX" inputmode="tel"></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Compte administrateur</legend>
          <label class="champ"><span>Nom</span><input name="admin_nom" value="<?= h($v['admin_nom']) ?>" required></label>
          <div class="grille-2">
            <label class="champ"><span>E-mail</span><input name="admin_email" type="email" value="<?= h($v['admin_email']) ?>" required></label>
            <label class="champ"><span>Mot de passe (10 caractères min.)</span><input name="admin_mdp" type="password" minlength="10" required></label>
          </div>
        </fieldset>
        <button class="btn btn-corail btn-large" type="submit" <?= $bloquant ? 'disabled' : '' ?>>Installer</button>
      </form>
    <?php endif; ?>
  </div>
</main>
</body>
</html>

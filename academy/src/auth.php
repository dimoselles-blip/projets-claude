<?php
/**
 * Comptes : apprenants et équipe (rôle admin). Connexion par mot de passe ou lien e-mail.
 */
defined('DTA') || exit;

function utilisateur(): ?array
{
    static $u = false;
    if ($u === false) {
        $u = null;
        if (!empty($_SESSION['uid'])) {
            $u = DB::un('SELECT id, nom, email, telephone, role, mot_de_passe IS NOT NULL AS a_mot_de_passe FROM utilisateurs WHERE id = ?', [(int) $_SESSION['uid']]);
            if (!$u) {
                unset($_SESSION['uid']);
            }
        }
    }
    return $u;
}

function est_admin(): bool
{
    return (utilisateur()['role'] ?? '') === 'admin';
}

function connecter(int $id): void
{
    session_regenerate_id(true);
    $_SESSION['uid'] = $id;
    unset($_SESSION['csrf']);
    DB::modifier('utilisateurs', ['derniere_connexion' => maintenant()], ['id' => $id]);
}

function deconnecter(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function exiger_connexion(): array
{
    $u = utilisateur();
    if (!$u) {
        $_SESSION['apres_connexion'] = $_SERVER['REQUEST_URI'] ?? url('/espace');
        flash('info', 'Connectez-vous pour accéder à votre espace.');
        rediriger('/espace/connexion');
    }
    return $u;
}

function exiger_admin(): array
{
    $u = exiger_connexion();
    if ($u['role'] !== 'admin') {
        http_response_code(403);
        afficher('site/erreur', ['titre' => 'Accès réservé à l’équipe', 'code' => 403, 'meta' => ['robots' => 'noindex']], 'site', 403);
    }
    return $u;
}

function utilisateur_par_email(string $email): ?array
{
    return DB::un('SELECT * FROM utilisateurs WHERE email = ?', [mb_strtolower(trim($email))]);
}

/** Retrouve ou crée le compte d'un apprenant. Renvoie [compte, nouveau?]. */
function compte_pour(string $nom, string $email, string $telephone): array
{
    $email = mb_strtolower(trim($email));
    $u = utilisateur_par_email($email);
    if ($u) {
        if (!$u['telephone'] && $telephone) {
            DB::modifier('utilisateurs', ['telephone' => $telephone], ['id' => $u['id']]);
        }
        return [$u, false];
    }
    $id = DB::inserer('utilisateurs', [
        'nom' => $nom,
        'email' => $email,
        'telephone' => $telephone,
        'role' => 'apprenant',
        'cree_le' => maintenant(),
    ]);
    return [DB::un('SELECT * FROM utilisateurs WHERE id = ?', [$id]), true];
}

/** Crée un lien de connexion à usage unique (valable 7 jours pour l'équipe, 1 heure par e-mail). */
function creer_lien_connexion(int $utilisateurId, int $dureeMinutes = 60): string
{
    $jeton = generer_jeton(24);
    DB::inserer('jetons_connexion', [
        'utilisateur_id' => $utilisateurId,
        'jeton_hash' => hash('sha256', $jeton),
        'expire_le' => date('Y-m-d H:i:s', time() + $dureeMinutes * 60),
        'cree_le' => maintenant(),
    ]);
    return url_absolue('/espace/lien/' . $jeton);
}

function consommer_lien_connexion(string $jeton): ?int
{
    $ligne = DB::un(
        'SELECT id, utilisateur_id FROM jetons_connexion WHERE jeton_hash = ? AND utilise_le IS NULL AND expire_le > NOW()',
        [hash('sha256', $jeton)]
    );
    if (!$ligne) {
        return null;
    }
    DB::modifier('jetons_connexion', ['utilise_le' => maintenant()], ['id' => $ligne['id']]);
    return (int) $ligne['utilisateur_id'];
}

function envoyer_lien_connexion(array $u): void
{
    $lien = creer_lien_connexion((int) $u['id'], 60);
    envoyer_email($u['email'], 'Votre lien de connexion — DIMO Tech Academy', 'lien-connexion', [
        'nom' => $u['nom'],
        'lien' => $lien,
    ]);
}

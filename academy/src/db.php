<?php
/**
 * Accès à la base MySQL (PDO, requêtes préparées uniquement).
 */
defined('DTA') || exit;

final class DB
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo === null) {
            self::$pdo = self::connecter(
                (string) cfg('db.hote', 'localhost'),
                (int) cfg('db.port', 3306),
                (string) cfg('db.nom', ''),
                (string) cfg('db.utilisateur', ''),
                (string) cfg('db.mot_de_passe', '')
            );
        }
        return self::$pdo;
    }

    public static function connecter(string $hote, int $port, string $nom, string $utilisateur, string $motDePasse): PDO
    {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $hote, $port, $nom);
        $pdo = new PDO($dsn, $utilisateur, $motDePasse, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
        $decalage = (new DateTime('now', new DateTimeZone(date_default_timezone_get())))->format('P');
        $pdo->exec("SET time_zone = '" . $decalage . "'");
        return $pdo;
    }

    public static function utiliser(PDO $pdo): void
    {
        self::$pdo = $pdo;
    }

    public static function requete(string $sql, array $params = []): PDOStatement
    {
        $st = self::pdo()->prepare($sql);
        $st->execute($params);
        return $st;
    }

    public static function tous(string $sql, array $params = []): array
    {
        return self::requete($sql, $params)->fetchAll();
    }

    public static function un(string $sql, array $params = []): ?array
    {
        $r = self::requete($sql, $params)->fetch();
        return $r === false ? null : $r;
    }

    public static function valeur(string $sql, array $params = []): mixed
    {
        $r = self::requete($sql, $params)->fetchColumn();
        return $r === false ? null : $r;
    }

    public static function colonne(string $sql, array $params = []): array
    {
        return self::requete($sql, $params)->fetchAll(PDO::FETCH_COLUMN);
    }

    public static function inserer(string $table, array $donnees): int
    {
        $cols = array_keys($donnees);
        $sql = sprintf(
            'INSERT INTO `%s` (%s) VALUES (%s)',
            $table,
            implode(', ', array_map(fn($c) => "`$c`", $cols)),
            implode(', ', array_map(fn($c) => ':' . $c, $cols))
        );
        self::requete($sql, $donnees);
        return (int) self::pdo()->lastInsertId();
    }

    public static function modifier(string $table, array $donnees, array $condition): int
    {
        $set = implode(', ', array_map(fn($c) => "`$c` = :s_$c", array_keys($donnees)));
        $where = implode(' AND ', array_map(fn($c) => "`$c` = :w_$c", array_keys($condition)));
        $params = [];
        foreach ($donnees as $k => $v) {
            $params['s_' . $k] = $v;
        }
        foreach ($condition as $k => $v) {
            $params['w_' . $k] = $v;
        }
        return self::requete("UPDATE `$table` SET $set WHERE $where", $params)->rowCount();
    }

    public static function supprimer(string $table, array $condition): int
    {
        $where = implode(' AND ', array_map(fn($c) => "`$c` = :$c", array_keys($condition)));
        return self::requete("DELETE FROM `$table` WHERE $where", $condition)->rowCount();
    }

    public static function transaction(callable $fn): mixed
    {
        $pdo = self::pdo();
        $pdo->beginTransaction();
        try {
            $r = $fn();
            $pdo->commit();
            return $r;
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}

/** Réglages modifiables depuis l'administration (table « reglages »). */
function reglage(string $cle, mixed $defaut = null): mixed
{
    static $cache = null;
    if ($cache === null) {
        $cache = [];
        try {
            foreach (DB::tous('SELECT cle, valeur FROM reglages') as $r) {
                $cache[$r['cle']] = $r['valeur'];
            }
        } catch (Throwable) {
            $cache = [];
        }
    }
    if (func_num_args() === 0) {
        return $cache;
    }
    return array_key_exists($cle, $cache) && $cache[$cle] !== null ? $cache[$cle] : (REGLAGES_DEFAUT[$cle] ?? $defaut);
}

function enregistrer_reglage(string $cle, ?string $valeur): void
{
    DB::requete('INSERT INTO reglages (cle, valeur) VALUES (:c, :v) ON DUPLICATE KEY UPDATE valeur = VALUES(valeur)', ['c' => $cle, 'v' => $valeur]);
}

const REGLAGES_DEFAUT = [
    // Part du montant total à régler pour ouvrir les contenus payants (paiement en plusieurs tranches).
    'seuil_acces_tranches' => '50',
    // 'formules' : affiche les formules entreprises et leurs prix ; 'devis' : affiche « Sur devis ».
    'prix_entreprises' => 'formules',
    // Affiche les emplacements « à remplacer » (photos, témoignages) tant qu'ils sont vides.
    'afficher_emplacements' => '1',
    // Le lien visio d'une séance en direct apparaît ce nombre d'heures avant le début.
    'delai_lien_visio' => '24',
    // Textes de la page À propos.
    'mot_fondatrice' => '',
    'phrase_cohorte' => 'Notre première cohorte a déjà trouvé un emploi.',
];

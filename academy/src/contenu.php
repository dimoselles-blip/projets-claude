<?php
/**
 * Fichier de contenu unique (contenu/catalogue.json) : import dans la base et export depuis la base.
 * L'import met à jour ou ajoute ; il ne supprime jamais ce qui n'est pas dans le fichier.
 */
defined('DTA') || exit;

function lire_catalogue(string $json): array
{
    $d = json_decode($json, true);
    if (!is_array($d)) {
        throw new RuntimeException('Le fichier n’est pas un JSON valide : ' . json_last_error_msg());
    }
    return $d;
}

/** Importe un catalogue. Renvoie un résumé (nombre d'éléments ajoutés / mis à jour). */
function importer_catalogue(array $d): array
{
    $bilan = [];
    $compter = function (string $type, bool $nouveau) use (&$bilan): void {
        $bilan[$type][$nouveau ? 'ajoutes' : 'mis_a_jour'] = ($bilan[$type][$nouveau ? 'ajoutes' : 'mis_a_jour'] ?? 0) + 1;
    };
    $maintenant = maintenant();

    return DB::transaction(function () use ($d, &$bilan, $compter, $maintenant) {
        foreach ($d['categories'] ?? [] as $i => $c) {
            $row = ['nom' => $c['nom'], 'onglet' => $c['onglet'] ?? $c['nom'], 'accroche' => $c['accroche'] ?? null, 'ordre' => (int) ($c['ordre'] ?? $i)];
            $id = DB::valeur('SELECT id FROM categories WHERE slug = ?', [$c['slug']]);
            $id ? DB::modifier('categories', $row, ['id' => $id]) : DB::inserer('categories', $row + ['slug' => $c['slug']]);
            $compter('categories', !$id);
        }

        foreach ($d['formateurs'] ?? [] as $i => $p) {
            $row = ['role' => $p['role'] ?? null, 'bio' => $p['bio'] ?? null, 'photo' => $p['photo'] ?? null, 'linkedin' => $p['linkedin'] ?? null, 'publie' => (int) ($p['publie'] ?? 1), 'ordre' => (int) ($p['ordre'] ?? $i)];
            $id = DB::valeur('SELECT id FROM formateurs WHERE nom = ?', [$p['nom']]);
            $id ? DB::modifier('formateurs', $row, ['id' => $id]) : DB::inserer('formateurs', $row + ['nom' => $p['nom']]);
            $compter('formateurs', !$id);
        }

        foreach ($d['formations'] ?? [] as $i => $f) {
            $cat = DB::valeur('SELECT id FROM categories WHERE slug = ?', [$f['categorie']]);
            if (!$cat) {
                throw new RuntimeException('Catégorie inconnue « ' . $f['categorie'] . ' » pour « ' . $f['titre'] . ' ».');
            }
            $formateur = !empty($f['formateur']) ? DB::valeur('SELECT id FROM formateurs WHERE nom = ?', [$f['formateur']]) : null;
            $row = [
                'titre' => $f['titre'],
                'categorie_id' => $cat,
                'statut' => ($f['statut'] ?? 'publie') === 'publie' ? 'publie' : 'brouillon',
                'niveau' => $f['niveau'] ?? 'Débutant',
                'accroche' => $f['accroche'] ?? null,
                'probleme' => $f['probleme'] ?? null,
                'objectifs' => json_encode($f['objectifs'] ?? [], JSON_UNESCAPED_UNICODE),
                'public_cible' => $f['public_cible'] ?? null,
                'prerequis' => $f['prerequis'] ?? null,
                'resultat' => $f['resultat'] ?? null,
                'debouches' => json_encode($f['debouches'] ?? [], JSON_UNESCAPED_UNICODE),
                'mode' => $f['mode'] ?? 'hybride',
                'format_label' => $f['format_label'] ?? null,
                'duree_label' => $f['duree'] ?? null,
                'prix' => (int) ($f['prix'] ?? 0),
                'prix_en_ligne' => isset($f['prix_en_ligne']) ? (int) $f['prix_en_ligne'] : null,
                'mention_prix' => $f['mention_prix'] ?? null,
                'certification' => $f['certification'] ?? 'aucune',
                'stage' => (int) ($f['stage'] ?? 0),
                'formateur_id' => $formateur ?: null,
                'faq' => json_encode($f['faq'] ?? [], JSON_UNESCAPED_UNICODE),
                'quiz' => json_encode($f['quiz'] ?? [], JSON_UNESCAPED_UNICODE),
                'ordre' => (int) ($f['ordre'] ?? $i),
                'maj_le' => $maintenant,
            ];
            $id = DB::valeur('SELECT id FROM formations WHERE slug = ?', [$f['slug']]);
            $nouvelle = !$id;
            if ($id) {
                DB::modifier('formations', $row, ['id' => $id]);
            } else {
                $id = DB::inserer('formations', $row + ['slug' => $f['slug'], 'cree_le' => $maintenant]);
            }
            $compter('formations', $nouvelle);

            // Modules : rapprochés par code (M1, S2…) ou par titre.
            $existants = modules_de((int) $id);
            $gardes = [];
            foreach ($f['modules'] ?? [] as $j => $m) {
                $trouve = null;
                foreach ($existants as $e) {
                    if ((($m['code'] ?? null) && $e['code'] === $m['code']) || $e['titre'] === $m['titre']) {
                        $trouve = $e;
                        break;
                    }
                }
                $mrow = ['code' => $m['code'] ?? null, 'titre' => $m['titre'], 'description' => $m['description'] ?? null, 'ordre' => $j];
                if ($trouve) {
                    DB::modifier('modules', $mrow, ['id' => $trouve['id']]);
                    $gardes[] = (int) $trouve['id'];
                } else {
                    $gardes[] = DB::inserer('modules', $mrow + ['formation_id' => $id]);
                }
            }
            if (isset($f['modules'])) {
                foreach ($existants as $e) {
                    if (!in_array((int) $e['id'], $gardes, true) && !DB::valeur('SELECT 1 FROM lecons WHERE module_id = ?', [$e['id']])) {
                        DB::supprimer('modules', ['id' => $e['id']]);
                    }
                }
            }
        }

        foreach ($d['sessions'] ?? [] as $s) {
            $fid = DB::valeur('SELECT id FROM formations WHERE slug = ?', [$s['formation']]);
            if (!$fid || empty($s['date_debut'])) {
                continue;
            }
            $row = [
                'formation_id' => $fid,
                'intitule' => $s['intitule'] ?? null,
                'date_debut' => $s['date_debut'],
                'heure_debut' => $s['heure_debut'] ?? null,
                'date_fin' => $s['date_fin'] ?? null,
                'horaires' => $s['horaires'] ?? null,
                'format' => $s['format'] ?? 'presentiel',
                'lieu' => $s['lieu'] ?? null,
                'places' => isset($s['places']) ? (int) $s['places'] : null,
                'inscriptions_ouvertes' => (int) ($s['inscriptions_ouvertes'] ?? 1),
                'lien_visio' => $s['lien_visio'] ?? null,
                'replay_url' => $s['replay_url'] ?? null,
                'statut' => $s['statut'] ?? 'planifiee',
                'note' => $s['note'] ?? null,
            ];
            $id = DB::valeur('SELECT id FROM sessions WHERE formation_id = ? AND date_debut = ? AND (intitule <=> ?)', [$fid, $s['date_debut'], $row['intitule']]);
            $id ? DB::modifier('sessions', $row, ['id' => $id]) : DB::inserer('sessions', $row + ['cree_le' => $maintenant]);
            $compter('sessions', !$id);
        }

        foreach ($d['temoignages'] ?? [] as $i => $t) {
            $row = ['formation' => $t['formation'] ?? null, 'texte' => $t['texte'], 'photo' => $t['photo'] ?? null, 'publie' => (int) ($t['publie'] ?? 1), 'ordre' => (int) ($t['ordre'] ?? $i)];
            $id = DB::valeur('SELECT id FROM temoignages WHERE nom = ? AND (formation <=> ?)', [$t['nom'], $row['formation']]);
            $id ? DB::modifier('temoignages', $row, ['id' => $id]) : DB::inserer('temoignages', $row + ['nom' => $t['nom']]);
            $compter('temoignages', !$id);
        }

        foreach ($d['indicateurs'] ?? [] as $i => $k) {
            $row = ['libelle' => $k['libelle'], 'valeur' => isset($k['valeur']) && $k['valeur'] !== '' ? (int) $k['valeur'] : null, 'suffixe' => $k['suffixe'] ?? null, 'ordre' => (int) ($k['ordre'] ?? $i)];
            $id = DB::valeur('SELECT id FROM indicateurs WHERE cle = ?', [$k['cle']]);
            $id ? DB::modifier('indicateurs', $row, ['id' => $id]) : DB::inserer('indicateurs', $row + ['cle' => $k['cle']]);
            $compter('indicateurs', !$id);
        }

        foreach ($d['faq'] ?? [] as $i => $q) {
            $row = ['reponse' => $q['reponse'], 'rubrique' => $q['rubrique'] ?? null, 'accueil' => (int) ($q['accueil'] ?? 0), 'ordre' => (int) ($q['ordre'] ?? $i)];
            $id = DB::valeur('SELECT id FROM faq WHERE question = ?', [$q['question']]);
            $id ? DB::modifier('faq', $row, ['id' => $id]) : DB::inserer('faq', $row + ['question' => $q['question']]);
            $compter('faq', !$id);
        }

        foreach ($d['reglages'] ?? [] as $cle => $valeur) {
            if (array_key_exists($cle, REGLAGES_DEFAUT) && !DB::valeur('SELECT 1 FROM reglages WHERE cle = ?', [$cle])) {
                enregistrer_reglage($cle, (string) $valeur);
            }
        }
        return $bilan;
    });
}

/** Exporte tout le contenu éditorial au format du fichier catalogue.json. */
function exporter_catalogue(): array
{
    $nul = fn($v) => $v === null || $v === '' ? null : $v;
    $formateurs = array_column(DB::tous('SELECT id, nom FROM formateurs'), 'nom', 'id');
    $cats = array_column(DB::tous('SELECT id, slug FROM categories'), 'slug', 'id');
    $slugs = array_column(DB::tous('SELECT id, slug FROM formations'), 'slug', 'id');

    $sortie = [
        'version' => 1,
        'exporte_le' => date('c'),
        'categories' => array_map(fn($c) => ['slug' => $c['slug'], 'nom' => $c['nom'], 'onglet' => $c['onglet'], 'accroche' => $c['accroche'], 'ordre' => (int) $c['ordre']], DB::tous('SELECT * FROM categories ORDER BY ordre')),
        'formateurs' => array_map(fn($p) => array_filter(['nom' => $p['nom'], 'role' => $p['role'], 'bio' => $p['bio'], 'photo' => $p['photo'], 'linkedin' => $p['linkedin'], 'publie' => (int) $p['publie'], 'ordre' => (int) $p['ordre']], fn($v) => $v !== null), DB::tous('SELECT * FROM formateurs ORDER BY ordre, nom')),
        'formations' => [],
        'sessions' => [],
        'temoignages' => array_map(fn($t) => array_filter(['nom' => $t['nom'], 'formation' => $t['formation'], 'texte' => $t['texte'], 'photo' => $t['photo'], 'publie' => (int) $t['publie'], 'ordre' => (int) $t['ordre']], fn($v) => $v !== null), DB::tous('SELECT * FROM temoignages ORDER BY ordre, id')),
        'indicateurs' => array_map(fn($k) => ['cle' => $k['cle'], 'libelle' => $k['libelle'], 'valeur' => $k['valeur'] !== null ? (int) $k['valeur'] : null, 'suffixe' => $k['suffixe'], 'ordre' => (int) $k['ordre']], DB::tous('SELECT * FROM indicateurs ORDER BY ordre, id')),
        'faq' => array_map(fn($q) => ['question' => $q['question'], 'reponse' => $q['reponse'], 'rubrique' => $q['rubrique'], 'accueil' => (int) $q['accueil'], 'ordre' => (int) $q['ordre']], DB::tous('SELECT * FROM faq ORDER BY ordre, id')),
    ];
    foreach (DB::tous('SELECT * FROM formations ORDER BY categorie_id, ordre, titre') as $f) {
        $sortie['formations'][] = array_filter([
            'slug' => $f['slug'],
            'titre' => $f['titre'],
            'categorie' => $cats[$f['categorie_id']] ?? null,
            'statut' => $f['statut'],
            'niveau' => $f['niveau'],
            'duree' => $nul($f['duree_label']),
            'prix' => (int) $f['prix'],
            'prix_en_ligne' => $f['prix_en_ligne'] !== null ? (int) $f['prix_en_ligne'] : null,
            'mention_prix' => $nul($f['mention_prix']),
            'mode' => $f['mode'],
            'format_label' => $nul($f['format_label']),
            'certification' => $f['certification'],
            'stage' => (int) $f['stage'] ?: null,
            'accroche' => $nul($f['accroche']),
            'probleme' => $nul($f['probleme']),
            'objectifs' => liste($f['objectifs']),
            'public_cible' => $nul($f['public_cible']),
            'prerequis' => $nul($f['prerequis']),
            'resultat' => $nul($f['resultat']),
            'debouches' => liste($f['debouches']),
            'formateur' => $f['formateur_id'] ? ($formateurs[$f['formateur_id']] ?? null) : null,
            'quiz' => liste($f['quiz']),
            'faq' => liste($f['faq']),
            'ordre' => (int) $f['ordre'],
            'modules' => array_map(fn($m) => array_filter(['code' => $m['code'], 'titre' => $m['titre'], 'description' => $m['description']], fn($v) => $v !== null), modules_de((int) $f['id'])),
        ], fn($v) => $v !== null && $v !== []);
    }
    foreach (DB::tous('SELECT * FROM sessions ORDER BY date_debut') as $s) {
        $sortie['sessions'][] = array_filter([
            'formation' => $slugs[$s['formation_id']] ?? null,
            'intitule' => $s['intitule'],
            'date_debut' => $s['date_debut'],
            'heure_debut' => $s['heure_debut'] ? substr($s['heure_debut'], 0, 5) : null,
            'date_fin' => $s['date_fin'],
            'horaires' => $s['horaires'],
            'format' => $s['format'],
            'lieu' => $s['lieu'],
            'places' => $s['places'] !== null ? (int) $s['places'] : null,
            'inscriptions_ouvertes' => (int) $s['inscriptions_ouvertes'],
            'lien_visio' => $s['lien_visio'],
            'replay_url' => $s['replay_url'],
            'statut' => $s['statut'],
            'note' => $s['note'],
        ], fn($v) => $v !== null);
    }
    return $sortie;
}

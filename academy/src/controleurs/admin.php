<?php
/**
 * Administration : tableau de bord, inscriptions et paiements, demandes, apprenants, réglages, import/export.
 */
defined('DTA') || exit;

function admin_tableau(): void
{
    exiger_admin();
    $debutMois = date('Y-m-01');
    $stats = [
        'attente' => (int) DB::valeur("SELECT COUNT(*) FROM inscriptions WHERE statut IN ('en_attente', 'partielle')"),
        'inscriptions30' => (int) DB::valeur("SELECT COUNT(*) FROM inscriptions WHERE cree_le >= DATE_SUB(NOW(), INTERVAL 30 DAY)"),
        'encaisse_mois' => (int) DB::valeur("SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE statut = 'valide' AND recu_le >= ?", [$debutMois]),
        'reste_total' => (int) DB::valeur("SELECT COALESCE(SUM(montant_total - montant_recu), 0) FROM inscriptions WHERE statut IN ('en_attente', 'partielle')"),
        'demandes' => (int) DB::valeur('SELECT COUNT(*) FROM demandes WHERE traitee = 0'),
        'visites30' => (int) DB::valeur('SELECT COALESCE(SUM(vues), 0) FROM stats_vues WHERE jour >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'),
        'apprenants' => (int) DB::valeur("SELECT COUNT(*) FROM utilisateurs WHERE role = 'apprenant'"),
    ];
    $visitesJours = DB::tous('SELECT jour, SUM(vues) AS vues FROM stats_vues WHERE jour >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) GROUP BY jour ORDER BY jour');
    $pages = DB::tous('SELECT chemin, SUM(vues) AS vues FROM stats_vues WHERE jour >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY chemin ORDER BY vues DESC LIMIT 6');
    $dernieres = DB::tous(
        'SELECT i.*, f.titre AS formation_titre FROM inscriptions i JOIN formations f ON f.id = i.formation_id ORDER BY i.cree_le DESC LIMIT 8'
    );
    afficher('admin/tableau', [
        'stats' => $stats,
        'visitesJours' => $visitesJours,
        'pages' => $pages,
        'dernieres' => $dernieres,
        'sessions' => sessions_a_venir([], 5),
        'branchements' => branchements_restants(),
        'meta' => ['titre' => 'Tableau de bord'],
    ], 'admin');
}

/** Liste des réglages encore à brancher (affichée à l'équipe). */
function branchements_restants(): array
{
    $r = [];
    if (!cfg('contact.whatsapp')) {
        $r[] = ['Numéro WhatsApp', 'Sans numéro, les boutons WhatsApp mènent à la page Contact.', 'contact.whatsapp'];
    }
    if (cfg('email.mode') === 'journal') {
        $r[] = ['Envoi des e-mails', 'Les e-mails (confirmations, liens de connexion) ne partent pas encore : ils sont enregistrés dans storage/logs/emails.log.', 'email'];
    }
    if (!cfg('reseaux.facebook') && !cfg('reseaux.linkedin') && !cfg('reseaux.tiktok')) {
        $r[] = ['Réseaux sociaux', 'Liens TikTok, Facebook et LinkedIn à renseigner.', 'reseaux'];
    }
    if (!cfg('paiement.fedapay.actif')) {
        $r[] = ['Paiement FedaPay (phase 2)', 'Le paiement passe par WhatsApp et votre validation. FedaPay s’active avec la clé secrète.', 'paiement.fedapay'];
    }
    if (!DB::valeur("SELECT COUNT(*) FROM sessions WHERE date_debut >= CURDATE() AND statut = 'planifiee'")) {
        $r[] = ['Dates des sessions', 'Aucune session à venir : le site affiche « Dates à venir » et une liste d’attente.', null];
    }
    return $r;
}

// ── Inscriptions ──────────────────────────────────────────────

function filtres_inscriptions(): array
{
    $f = [
        'statut' => array_key_exists(param('statut'), STATUTS_INSCRIPTION) || param('statut') === 'a_valider' ? param('statut') : '',
        'formation' => (int) param('formation') ?: '',
        'session' => (int) param('session') ?: '',
        'q' => mb_substr(param('q'), 0, 80),
    ];
    $where = [];
    $params = [];
    if ($f['statut'] === 'a_valider') {
        $where[] = "i.statut IN ('en_attente', 'partielle', 'payee')";
    } elseif ($f['statut']) {
        $where[] = 'i.statut = :st';
        $params['st'] = $f['statut'];
    }
    if ($f['formation']) {
        $where[] = 'i.formation_id = :fo';
        $params['fo'] = $f['formation'];
    }
    if ($f['session']) {
        $where[] = 'i.session_id = :se';
        $params['se'] = $f['session'];
    }
    if ($f['q'] !== '') {
        $where[] = '(i.nom LIKE :q1 OR i.email LIKE :q2 OR i.telephone LIKE :q3 OR i.reference LIKE :q4)';
        $params += array_fill_keys(['q1', 'q2', 'q3', 'q4'], '%' . $f['q'] . '%');
    }
    return [$f, $where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
}

const SQL_INSCRIPTIONS_ADMIN = 'SELECT i.*, f.titre AS formation_titre, s.date_debut, s.intitule AS session_intitule
    FROM inscriptions i JOIN formations f ON f.id = i.formation_id LEFT JOIN sessions s ON s.id = i.session_id ';

function admin_inscriptions(): void
{
    exiger_admin();
    [$f, $where, $params] = filtres_inscriptions();
    $page = max(1, (int) param('page', '1'));
    $total = (int) DB::valeur('SELECT COUNT(*) FROM inscriptions i ' . $where, $params);
    $lignes = DB::tous(SQL_INSCRIPTIONS_ADMIN . $where . ' ORDER BY i.cree_le DESC LIMIT 50 OFFSET ' . (($page - 1) * 50), $params);
    afficher('admin/inscriptions', [
        'lignes' => $lignes,
        'filtres' => $f,
        'total' => $total,
        'page' => $page,
        'formations' => DB::tous('SELECT id, titre FROM formations ORDER BY titre'),
        'meta' => ['titre' => 'Inscriptions'],
    ], 'admin');
}

function csv_telecharger(string $nomFichier, array $entetes, array $lignes): never
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $nomFichier . '"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF"); // BOM : Excel et Google Sheets lisent les accents
    fputcsv($out, $entetes, ';');
    foreach ($lignes as $l) {
        fputcsv($out, $l, ';');
    }
    fclose($out);
    exit;
}

function admin_export_inscriptions(): void
{
    exiger_admin();
    [, $where, $params] = filtres_inscriptions();
    $lignes = DB::tous(SQL_INSCRIPTIONS_ADMIN . $where . ' ORDER BY i.cree_le DESC', $params);
    csv_telecharger('inscriptions-' . date('Y-m-d') . '.csv',
        ['Référence', 'Date', 'Nom', 'E-mail', 'Téléphone WhatsApp', 'Pays', 'Formation', 'Session', 'Format', 'Montant total', 'Reçu', 'Reste à payer', 'Statut', 'Moyen de paiement'],
        array_map(fn($i) => [
            $i['reference'],
            date('d/m/Y H:i', strtotime($i['cree_le'])),
            $i['nom'],
            $i['email'],
            $i['telephone'],
            $i['pays'],
            $i['formation_titre'],
            $i['date_debut'] ? date('d/m/Y', strtotime($i['date_debut'])) . ($i['session_intitule'] ? ' — ' . $i['session_intitule'] : '') : 'À définir',
            FORMATS_SESSION[$i['format']] ?? '',
            (int) $i['montant_total'],
            (int) $i['montant_recu'],
            reste_a_payer($i),
            libelle_statut($i['statut']),
            MOYENS_PAIEMENT[$i['moyen_paiement']] ?? '',
        ], $lignes)
    );
}

function admin_inscription(string $id): void
{
    exiger_admin();
    $ins = inscription_detaillee((int) $id) ?? page_introuvable();
    afficher('admin/inscription', [
        'ins' => $ins,
        'paiements' => DB::tous("SELECT p.*, u.nom AS admin_nom FROM paiements p LEFT JOIN utilisateurs u ON u.id = p.enregistre_par WHERE p.inscription_id = ? ORDER BY COALESCE(p.recu_le, p.cree_le)", [$id]),
        'autres' => DB::tous("SELECT i.id, i.reference, i.statut, f.titre FROM inscriptions i JOIN formations f ON f.id = i.formation_id WHERE i.utilisateur_id = ? AND i.id <> ?", [$ins['utilisateur_id'], $id]),
        'acces' => acces_contenus($ins),
        'lienConnexion' => $_SESSION['lien_genere'][$ins['utilisateur_id']] ?? null,
        'meta' => ['titre' => 'Inscription ' . $ins['reference']],
    ], 'admin');
}

function admin_inscription_statut(string $id): void
{
    exiger_admin();
    $ins = inscription_detaillee((int) $id) ?? page_introuvable();
    $statut = champ('statut');
    if (!isset(STATUTS_INSCRIPTION[$statut])) {
        flash('erreur', 'Statut inconnu.');
        rediriger('/admin/inscriptions/' . $id);
    }
    changer_statut_inscription((int) $ins['id'], $statut);
    flash('succes', 'Statut mis à jour : ' . libelle_statut($statut) . '. L’apprenant est prévenu par e-mail et dans son espace.');
    rediriger('/admin/inscriptions/' . $id);
}

function admin_inscription_paiement(string $id): void
{
    $admin = exiger_admin();
    $ins = inscription_detaillee((int) $id) ?? page_introuvable();
    $montant = (int) preg_replace('/\D/', '', champ('montant'));
    $moyen = array_key_exists(champ('moyen'), MOYENS_PAIEMENT) ? champ('moyen') : 'autre';
    if ($montant <= 0) {
        flash('erreur', 'Indiquez le montant reçu.');
        rediriger('/admin/inscriptions/' . $id);
    }
    $date = champ('date');
    $ins2 = enregistrer_paiement((int) $ins['id'], $montant, $moyen, mb_substr(champ('reference'), 0, 120), $date ? $date . ' ' . date('H:i:s') : null, mb_substr(champ('note'), 0, 300), (int) $admin['id']);
    if (champ('confirmer') && $ins2['statut'] !== 'annulee') {
        changer_statut_inscription((int) $ins['id'], 'confirmee');
    }
    flash('succes', 'Paiement de ' . prix($montant) . ' enregistré. Reste à payer : ' . prix(reste_a_payer($ins2)) . '.');
    rediriger('/admin/inscriptions/' . $id);
}

function admin_inscription_supprimer_paiement(string $id, string $pid): void
{
    exiger_admin();
    DB::requete('DELETE FROM paiements WHERE id = ? AND inscription_id = ?', [(int) $pid, (int) $id]);
    recalculer_inscription((int) $id);
    flash('succes', 'Tranche supprimée, montants recalculés.');
    rediriger('/admin/inscriptions/' . $id);
}

function admin_inscription_note(string $id): void
{
    exiger_admin();
    DB::modifier('inscriptions', ['note_admin' => mb_substr(champ('note_admin'), 0, 5000) ?: null, 'maj_le' => maintenant()], ['id' => (int) $id]);
    flash('succes', 'Note enregistrée.');
    rediriger('/admin/inscriptions/' . $id);
}

/** Génère un lien de connexion (7 jours) à transmettre à l'apprenant, par exemple sur WhatsApp. */
function admin_inscription_lien(string $id): void
{
    exiger_admin();
    $ins = inscription_detaillee((int) $id) ?? page_introuvable();
    $_SESSION['lien_genere'][$ins['utilisateur_id']] = creer_lien_connexion((int) $ins['utilisateur_id'], 60 * 24 * 7);
    flash('succes', 'Lien de connexion créé (valable 7 jours, à usage unique).');
    rediriger('/admin/inscriptions/' . $id);
}

// ── Demandes ──────────────────────────────────────────────────

const TYPES_DEMANDE = ['devis' => 'Devis entreprise', 'contact' => 'Contact', 'liste_attente' => 'Liste d’attente'];

function admin_demandes(): void
{
    exiger_admin();
    $type = array_key_exists(param('type'), TYPES_DEMANDE) ? param('type') : '';
    $lignes = DB::tous(
        'SELECT d.*, f.titre AS formation_titre FROM demandes d LEFT JOIN formations f ON f.id = d.formation_id'
        . ($type ? ' WHERE d.type = ?' : '') . ' ORDER BY d.traitee, d.cree_le DESC LIMIT 300',
        $type ? [$type] : []
    );
    afficher('admin/demandes', ['lignes' => $lignes, 'type' => $type, 'meta' => ['titre' => 'Demandes']], 'admin');
}

function admin_export_demandes(): void
{
    exiger_admin();
    $type = array_key_exists(param('type'), TYPES_DEMANDE) ? param('type') : '';
    $lignes = DB::tous('SELECT d.*, f.titre AS formation_titre FROM demandes d LEFT JOIN formations f ON f.id = d.formation_id' . ($type ? ' WHERE d.type = ?' : '') . ' ORDER BY d.cree_le DESC', $type ? [$type] : []);
    csv_telecharger('demandes-' . date('Y-m-d') . '.csv',
        ['Date', 'Type', 'Nom', 'E-mail', 'Téléphone', 'Organisation', 'Formation', 'Sujet', 'Message', 'Détails', 'Traitée'],
        array_map(function ($d) {
            $details = json_decode((string) $d['details'], true) ?: [];
            $txt = [];
            foreach ($details as $k => $v) {
                if ($v !== '' && $v !== []) {
                    $txt[] = $k . ' : ' . (is_array($v) ? implode(', ', $v) : $v);
                }
            }
            return [date('d/m/Y H:i', strtotime($d['cree_le'])), TYPES_DEMANDE[$d['type']] ?? $d['type'], $d['nom'], $d['email'], $d['telephone'], $d['organisation'], $d['formation_titre'], $d['sujet'], $d['message'], implode(' | ', $txt), $d['traitee'] ? 'Oui' : 'Non'];
        }, $lignes)
    );
}

function admin_demande_traitee(string $id): void
{
    exiger_admin();
    DB::requete('UPDATE demandes SET traitee = 1 - traitee WHERE id = ?', [(int) $id]);
    retour_arriere('/admin/demandes');
}

// ── Apprenants ────────────────────────────────────────────────

function admin_apprenants(): void
{
    exiger_admin();
    $q = mb_substr(param('q'), 0, 80);
    $lignes = DB::tous(
        "SELECT u.*, (SELECT COUNT(*) FROM inscriptions i WHERE i.utilisateur_id = u.id AND i.statut <> 'annulee') AS nb
         FROM utilisateurs u" . ($q !== '' ? ' WHERE u.nom LIKE :q1 OR u.email LIKE :q2 OR u.telephone LIKE :q3' : '') . ' ORDER BY u.role = \'admin\' DESC, u.cree_le DESC LIMIT 300',
        $q !== '' ? array_fill_keys(['q1', 'q2', 'q3'], '%' . $q . '%') : []
    );
    afficher('admin/apprenants', ['lignes' => $lignes, 'q' => $q, 'liens' => $_SESSION['lien_genere'] ?? [], 'meta' => ['titre' => 'Apprenants et équipe']], 'admin');
}

function admin_apprenant_lien(string $id): void
{
    exiger_admin();
    $u = DB::un('SELECT id FROM utilisateurs WHERE id = ?', [(int) $id]) ?? page_introuvable();
    $_SESSION['lien_genere'][$u['id']] = creer_lien_connexion((int) $u['id'], 60 * 24 * 7);
    flash('succes', 'Lien de connexion créé (valable 7 jours, à usage unique). Copiez-le pour l’envoyer.');
    rediriger('/admin/apprenants?q=' . rawurlencode((string) DB::valeur('SELECT email FROM utilisateurs WHERE id = ?', [$u['id']])));
}

function admin_apprenant_role(string $id): void
{
    $moi = exiger_admin();
    if ((int) $id === (int) $moi['id']) {
        flash('erreur', 'Vous ne pouvez pas modifier votre propre rôle.');
        rediriger('/admin/apprenants');
    }
    $role = champ('role') === 'admin' ? 'admin' : 'apprenant';
    DB::modifier('utilisateurs', ['role' => $role], ['id' => (int) $id]);
    flash('succes', $role === 'admin' ? 'Accès à l’administration accordé.' : 'Accès à l’administration retiré.');
    rediriger('/admin/apprenants');
}

// ── Réglages ──────────────────────────────────────────────────

function admin_reglages(): void
{
    exiger_admin();
    afficher('admin/reglages', ['meta' => ['titre' => 'Réglages'], 'branchements' => branchements_restants()], 'admin');
}

function admin_enregistrer_reglages(): void
{
    exiger_admin();
    $seuil = max(0, min(100, (int) champ('seuil_acces_tranches')));
    enregistrer_reglage('seuil_acces_tranches', (string) $seuil);
    enregistrer_reglage('prix_entreprises', champ('prix_entreprises') === 'devis' ? 'devis' : 'formules');
    enregistrer_reglage('afficher_emplacements', champ('afficher_emplacements') ? '1' : '0');
    enregistrer_reglage('delai_lien_visio', (string) max(1, min(168, (int) champ('delai_lien_visio') ?: 24)));
    enregistrer_reglage('phrase_cohorte', mb_substr(champ('phrase_cohorte'), 0, 300));
    enregistrer_reglage('mot_fondatrice', mb_substr(champ('mot_fondatrice'), 0, 5000));
    flash('succes', 'Réglages enregistrés.');
    rediriger('/admin/reglages');
}

function admin_email_test(): void
{
    $u = exiger_admin();
    $ok = envoyer_email($u['email'], 'E-mail de test — DIMO Tech Academy', 'notification', [
        'nom' => $u['nom'],
        'titre' => 'Tout fonctionne',
        'message' => 'Si vous lisez ce message, l’envoi des e-mails de la plateforme est bien configuré.',
        'lien' => url_absolue('/admin'),
    ]);
    $mode = cfg('email.mode');
    flash($ok ? 'succes' : 'erreur', $ok
        ? ($mode === 'journal' ? 'Mode « journal » : l’e-mail a été écrit dans storage/logs/emails.log (rien n’est envoyé).' : 'E-mail de test envoyé à ' . $u['email'] . '.')
        : 'Échec de l’envoi. Vérifiez les réglages SMTP dans config/config.php (détail dans storage/logs/erreurs.log).');
    rediriger('/admin/reglages');
}

// ── Fichier de contenu ────────────────────────────────────────

function admin_contenu(): void
{
    exiger_admin();
    afficher('admin/contenu', ['meta' => ['titre' => 'Fichier de contenu']], 'admin');
}

function admin_export_contenu(): void
{
    exiger_admin();
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="catalogue-' . date('Y-m-d') . '.json"');
    echo json_encode(exporter_catalogue(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function admin_import_contenu(): void
{
    exiger_admin();
    try {
        if (champ('source') === 'serveur') {
            $json = (string) file_get_contents(RACINE . '/contenu/catalogue.json');
        } else {
            $f = $_FILES['fichier'] ?? null;
            if (!$f || $f['error'] !== UPLOAD_ERR_OK) {
                throw new RuntimeException('Choisissez un fichier .json.');
            }
            $json = (string) file_get_contents($f['tmp_name']);
        }
        $bilan = importer_catalogue(lire_catalogue($json));
        $resume = [];
        foreach ($bilan as $type => $n) {
            $resume[] = $type . ' : ' . ($n['ajoutes'] ?? 0) . ' ajouté(s), ' . ($n['mis_a_jour'] ?? 0) . ' mis à jour';
        }
        flash('succes', 'Import terminé. ' . implode(' · ', $resume));
    } catch (Throwable $e) {
        flash('erreur', 'Import impossible : ' . $e->getMessage());
    }
    rediriger('/admin/contenu');
}

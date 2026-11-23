<?php
/**
 * Inscriptions, échéancier de paiement, accès aux contenus et notifications.
 */
defined('DTA') || exit;

const STATUTS_INSCRIPTION = [
    'en_attente' => 'En attente de paiement',
    'partielle' => 'Partiellement payée',
    'payee' => 'Payée',
    'confirmee' => 'Confirmée',
    'annulee' => 'Annulée',
];

const MOYENS_PAIEMENT = [
    'mtn' => 'MTN Mobile Money',
    'moov' => 'Moov Money',
    'celtiis' => 'Celtiis',
    'fedapay' => 'Paiement en ligne (FedaPay)',
    'especes' => 'Espèces (au siège)',
    'virement' => 'Virement bancaire',
    'autre' => 'Autre',
];

const OPERATEURS_MOBILE_MONEY = ['mtn', 'moov', 'celtiis'];

/** Plus petit montant payable en ligne en une fois (F CFA), sauf s'il reste moins à payer. */
const MONTANT_MIN_EN_LIGNE = 1000;

function libelle_statut(string $statut): string
{
    return STATUTS_INSCRIPTION[$statut] ?? $statut;
}

function nouvelle_reference(): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    do {
        $ref = 'DTA-';
        for ($i = 0; $i < 6; $i++) {
            $ref .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
    } while (DB::valeur('SELECT 1 FROM inscriptions WHERE reference = ?', [$ref]));
    return $ref;
}

/** Montant dû selon le format choisi (certaines formations ont un prix en ligne différent). */
function montant_pour(array $formation, ?string $format): int
{
    if ($format === 'en_ligne' && $formation['prix_en_ligne'] !== null) {
        return (int) $formation['prix_en_ligne'];
    }
    return (int) $formation['prix'];
}

/**
 * Vérifie les champs du formulaire d'inscription. Renvoie [erreurs, valeurs propres].
 */
function valider_inscription(array $formation, array $saisie): array
{
    $erreurs = [];
    $v = [
        'nom' => trim(preg_replace('/\s+/', ' ', (string) ($saisie['nom'] ?? '')) ?? ''),
        'email' => mb_strtolower(trim((string) ($saisie['email'] ?? ''))),
        'telephone' => nettoyer_telephone((string) ($saisie['telephone'] ?? '')),
        'format' => (string) ($saisie['format'] ?? ''),
        'session_id' => (int) ($saisie['session_id'] ?? 0) ?: null,
        'pays' => trim((string) ($saisie['pays'] ?? '')),
        'consentement' => !empty($saisie['consentement']),
    ];
    if (mb_strlen($v['nom']) < 3 || mb_strlen($v['nom']) > 120) {
        $erreurs['nom'] = 'Indiquez votre nom complet.';
    }
    if (!est_email($v['email'])) {
        $erreurs['email'] = 'Indiquez une adresse e-mail valide.';
    }
    if (strlen(ltrim($v['telephone'], '+')) < 8 || strlen($v['telephone']) > 20) {
        $erreurs['telephone'] = 'Indiquez votre numéro WhatsApp, avec l’indicatif si vous n’êtes pas au Bénin.';
    }
    if ($formation['choix_format']) {
        if (!in_array($v['format'], ['en_ligne', 'presentiel'], true)) {
            $erreurs['format'] = 'Choisissez le format : en ligne ou présentiel.';
        }
    } else {
        $v['format'] = match ($formation['mode']) {
            'en_ligne' => 'en_ligne',
            'presentiel' => 'presentiel',
            default => null,
        };
    }
    if ($v['session_id']) {
        $s = session_par_id($v['session_id']);
        if (!$s || (int) $s['formation_id'] !== (int) $formation['id']) {
            $erreurs['session_id'] = 'Cette session n’existe pas.';
        } elseif (!$s['ouverte']) {
            $erreurs['session_id'] = $s['complete'] ? 'Cette session est complète. Choisissez une autre date.' : 'Les inscriptions à cette session sont fermées.';
        } elseif ($formation['choix_format'] && $s['format'] !== 'hybride' && $v['format'] && $s['format'] !== $v['format']) {
            $v['format'] = $s['format'];
        }
    }
    if (!$v['consentement']) {
        $erreurs['consentement'] = 'Merci d’accepter l’utilisation de vos données pour traiter votre inscription.';
    }
    return [$erreurs, $v];
}

/**
 * Crée l'inscription (et le compte apprenant si besoin).
 * Renvoie ['inscription' => …, 'nouveau_compte' => bool, 'doublon' => bool].
 */
function creer_inscription(array $formation, array $v): array
{
    [$compte, $nouveau] = compte_pour($v['nom'], $v['email'], $v['telephone']);

    $existante = DB::un(
        "SELECT * FROM inscriptions WHERE utilisateur_id = ? AND formation_id = ? AND statut <> 'annulee'
         AND (session_id <=> ?) ORDER BY id DESC LIMIT 1",
        [$compte['id'], $formation['id'], $v['session_id']]
    );
    if ($existante) {
        return ['inscription' => $existante, 'nouveau_compte' => $nouveau, 'doublon' => true, 'compte' => $compte];
    }

    $total = montant_pour($formation, $v['format']);
    $gratuit = $total === 0;
    $id = DB::inserer('inscriptions', [
        'reference' => nouvelle_reference(),
        'jeton_suivi' => generer_jeton(16),
        'utilisateur_id' => $compte['id'],
        'formation_id' => $formation['id'],
        'session_id' => $v['session_id'],
        'format' => $v['format'],
        'nom' => $v['nom'],
        'email' => $v['email'],
        'telephone' => $v['telephone'],
        'pays' => $v['pays'] ?: null,
        'montant_total' => $total,
        'montant_recu' => 0,
        'statut' => $gratuit ? 'confirmee' : 'en_attente',
        'consentement_le' => maintenant(),
        'confirmee_le' => $gratuit ? maintenant() : null,
        'cree_le' => maintenant(),
        'maj_le' => maintenant(),
    ]);
    $ins = inscription_detaillee($id);

    $session = $ins['session_id'] ? session_par_id((int) $ins['session_id']) : null;
    $lienSuivi = url_absolue('/inscription/suivi/' . $ins['jeton_suivi']);
    envoyer_email($ins['email'], $gratuit ? 'Inscription confirmée — ' . $formation['titre'] : 'Votre inscription — ' . $formation['titre'], 'inscription', [
        'ins' => $ins,
        'formation' => $formation,
        'session' => $session,
        'lien_suivi' => $lienSuivi,
        'lien_espace' => creer_lien_connexion((int) $compte['id'], 60 * 24 * 7),
    ]);
    prevenir_equipe('Nouvelle inscription : ' . $formation['titre'] . ' (' . $ins['reference'] . ')', 'equipe-inscription', [
        'ins' => $ins,
        'formation' => $formation,
        'session' => $session,
        'lien_admin' => url_absolue('/admin/inscriptions/' . $ins['id']),
    ], $ins['email']);
    notifier((int) $compte['id'], $gratuit ? 'Inscription confirmée' : 'Inscription enregistrée', $gratuit
        ? 'Votre place pour « ' . $formation['titre'] . ' » est confirmée.'
        : 'Votre inscription à « ' . $formation['titre'] . ' » est en attente de paiement.', '/espace', false);

    return ['inscription' => $ins, 'nouveau_compte' => $nouveau, 'doublon' => false, 'compte' => $compte];
}

function inscription_detaillee(int $id): ?array
{
    return DB::un(
        'SELECT i.*, f.titre AS formation_titre, f.slug AS formation_slug, f.mode AS formation_mode, f.certification,
                c.slug AS categorie_slug, s.date_debut, s.heure_debut, s.format AS session_format, s.lieu AS session_lieu, s.intitule AS session_intitule
         FROM inscriptions i
         JOIN formations f ON f.id = i.formation_id
         JOIN categories c ON c.id = f.categorie_id
         LEFT JOIN sessions s ON s.id = i.session_id
         WHERE i.id = ?',
        [$id]
    );
}

function inscription_par_jeton(string $jeton): ?array
{
    if (!preg_match('/^[a-f0-9]{32}$/', $jeton)) {
        return null;
    }
    $id = DB::valeur('SELECT id FROM inscriptions WHERE jeton_suivi = ?', [$jeton]);
    return $id ? inscription_detaillee((int) $id) : null;
}

/** Les contenus payants s'ouvrent à « Confirmée », ou dès que le seuil réglé (50 % par défaut) est payé. */
function acces_contenus(array $ins): bool
{
    if ($ins['statut'] === 'annulee') {
        return false;
    }
    if ($ins['statut'] === 'confirmee' || (int) $ins['montant_total'] === 0) {
        return true;
    }
    $recu = (int) $ins['montant_recu'];
    $total = (int) $ins['montant_total'];
    $seuil = max(0, min(100, (int) reglage('seuil_acces_tranches')));
    return $recu > 0 && $recu * 100 >= $seuil * $total;
}

function reste_a_payer(array $ins): int
{
    return max(0, (int) $ins['montant_total'] - (int) $ins['montant_recu']);
}

/** Recalcule le montant reçu et le statut à partir des tranches validées. */
function recalculer_inscription(int $id): array
{
    $ins = DB::un('SELECT * FROM inscriptions WHERE id = ?', [$id]);
    $recu = (int) DB::valeur("SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE inscription_id = ? AND statut = 'valide'", [$id]);
    $statut = $ins['statut'];
    if (!in_array($statut, ['confirmee', 'annulee'], true)) {
        $statut = $recu >= (int) $ins['montant_total'] && $recu > 0 ? 'payee' : ($recu > 0 ? 'partielle' : 'en_attente');
    }
    DB::modifier('inscriptions', ['montant_recu' => $recu, 'statut' => $statut, 'maj_le' => maintenant()], ['id' => $id]);
    return inscription_detaillee($id);
}

/** Enregistre une tranche reçue (validation manuelle par l'équipe). */
function enregistrer_paiement(int $inscriptionId, int $montant, string $moyen, ?string $reference, ?string $date, ?string $note, ?int $adminId, string $fournisseur = 'manuel', ?string $externeId = null): array
{
    $avant = inscription_detaillee($inscriptionId);
    $accesAvant = acces_contenus($avant);
    DB::inserer('paiements', [
        'inscription_id' => $inscriptionId,
        'montant' => $montant,
        'moyen' => $moyen,
        'fournisseur' => $fournisseur,
        'statut' => 'valide',
        'reference' => $reference ?: null,
        'externe_id' => $externeId,
        'recu_le' => $date ?: maintenant(),
        'enregistre_par' => $adminId,
        'note' => $note ?: null,
        'cree_le' => maintenant(),
    ]);
    $ins = recalculer_inscription($inscriptionId);
    $accesApres = acces_contenus($ins);
    $message = 'Nous avons bien reçu votre paiement de ' . prix($montant) . ' pour « ' . $ins['formation_titre'] . ' ».';
    $reste = reste_a_payer($ins);
    $message .= $reste > 0 ? ' Reste à payer : ' . prix($reste) . '.' : ' Votre formation est entièrement réglée.';
    if ($accesApres && !$accesAvant) {
        $message .= ' Vos contenus sont maintenant accessibles dans votre espace apprenant.';
    }
    notifier((int) $ins['utilisateur_id'], 'Paiement reçu', $message, '/espace');
    return $ins;
}

function changer_statut_inscription(int $id, string $statut): array
{
    if (!isset(STATUTS_INSCRIPTION[$statut])) {
        throw new InvalidArgumentException('Statut inconnu');
    }
    $donnees = ['statut' => $statut, 'maj_le' => maintenant()];
    if ($statut === 'confirmee') {
        $donnees['confirmee_le'] = maintenant();
    }
    DB::modifier('inscriptions', $donnees, ['id' => $id]);
    if (!in_array($statut, ['confirmee', 'annulee'], true)) {
        recalculer_inscription($id);
    }
    $ins = inscription_detaillee($id);
    if ($statut === 'confirmee') {
        $detail = $ins['session_id'] && $ins['date_debut']
            ? ' Rendez-vous le ' . date_fr($ins['date_debut'], true) . ($ins['format'] === 'presentiel' || $ins['session_format'] === 'presentiel' ? ', au siège d’Akpakpa (Cotonou).' : '.')
            : ' Vos contenus sont accessibles dans votre espace apprenant.';
        notifier((int) $ins['utilisateur_id'], 'Inscription confirmée', 'Votre inscription à « ' . $ins['formation_titre'] . ' » est confirmée.' . $detail, '/espace');
    } elseif ($statut === 'annulee') {
        notifier((int) $ins['utilisateur_id'], 'Inscription annulée', 'Votre inscription à « ' . $ins['formation_titre'] . ' » a été annulée. Écrivez-nous si c’est une erreur.', '/espace');
    }
    return $ins;
}

/** Message WhatsApp prérempli pour recevoir les instructions de paiement. */
function message_whatsapp_paiement(array $ins): string
{
    $lignes = [
        'Bonjour DIMO Tech Academy,',
        'je souhaite recevoir les instructions de paiement pour mon inscription.',
        '',
        'Formation : ' . $ins['formation_titre'],
    ];
    if ($ins['date_debut']) {
        $lignes[] = 'Session : ' . date_fr($ins['date_debut']);
    }
    if ($ins['format']) {
        $lignes[] = 'Format : ' . (FORMATS_SESSION[$ins['format']] ?? $ins['format']);
    }
    $lignes[] = 'Nom : ' . $ins['nom'];
    $lignes[] = 'E-mail : ' . $ins['email'];
    $lignes[] = 'Référence : ' . $ins['reference'];
    $lignes[] = 'Montant : ' . str_replace(["\u{202F}", "\u{00A0}"], ' ', prix((int) $ins['montant_total']));
    if ($ins['moyen_paiement'] && isset(MOYENS_PAIEMENT[$ins['moyen_paiement']])) {
        $lignes[] = 'Paiement par : ' . MOYENS_PAIEMENT[$ins['moyen_paiement']];
    }
    return implode("\n", $lignes);
}

/** Inscriptions d'un apprenant, avec indicateur d'accès. */
function inscriptions_de(int $utilisateurId): array
{
    $liste = DB::tous(
        'SELECT i.*, f.titre AS formation_titre, f.slug AS formation_slug, f.duree_label, f.certification, c.slug AS categorie_slug, c.nom AS categorie_nom,
                s.date_debut, s.heure_debut, s.format AS session_format, s.lieu AS session_lieu, s.lien_visio AS session_visio, s.replay_url AS session_replay, s.intitule AS session_intitule
         FROM inscriptions i
         JOIN formations f ON f.id = i.formation_id
         JOIN categories c ON c.id = f.categorie_id
         LEFT JOIN sessions s ON s.id = i.session_id
         WHERE i.utilisateur_id = ? ORDER BY i.statut = \'annulee\', i.cree_le DESC',
        [$utilisateurId]
    );
    foreach ($liste as &$i) {
        $i['acces'] = acces_contenus($i);
    }
    return $liste;
}

/** Notification dans l'espace apprenant, doublée d'un e-mail. */
function notifier(int $utilisateurId, string $titre, string $message, ?string $lien = null, bool $email = true): void
{
    DB::inserer('notifications', [
        'utilisateur_id' => $utilisateurId,
        'titre' => $titre,
        'message' => $message,
        'lien' => $lien,
        'cree_le' => maintenant(),
    ]);
    if ($email) {
        $u = DB::un('SELECT nom, email FROM utilisateurs WHERE id = ?', [$utilisateurId]);
        if ($u) {
            envoyer_email($u['email'], $titre . ' — DIMO Tech Academy', 'notification', [
                'nom' => $u['nom'],
                'titre' => $titre,
                'message' => $message,
                'lien' => $lien ? url_absolue($lien) : null,
            ]);
        }
    }
}

/** Le lien visio d'un direct n'apparaît que N heures avant le début (24 h par défaut). */
function lien_visio_visible(?string $debut): bool
{
    if (!$debut) {
        return false;
    }
    $t = strtotime($debut);
    $delai = (int) reglage('delai_lien_visio') * 3600;
    return $t !== false && time() >= $t - $delai && time() <= $t + 12 * 3600;
}

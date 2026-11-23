<?php
/**
 * Parcours d'inscription : choix → inscription → paiement → accès.
 */
defined('DTA') || exit;

/** Page d'inscription complète (sans JavaScript, ou lien direct depuis WhatsApp/réseaux). */
function page_inscription(): void
{
    $slug = param('formation');
    $formation = $slug ? formation_par_slug($slug) : null;
    afficher('site/inscription', [
        'page' => 'inscription',
        'formation' => $formation,
        'options' => formations_options(),
        'sessions' => $formation ? array_values(array_filter(sessions_a_venir(['formation_id' => $formation['id']]), fn($s) => $s['ouverte'])) : [],
        'sessionChoisie' => (int) param('session'),
        'meta' => [
            'titre' => ($formation ? 'Inscription — ' . $formation['titre'] : 'Je m’inscris') . ' | DIMO Tech Academy',
            'description' => 'Inscrivez-vous en quelques secondes. Paiement Mobile Money (MTN, Moov, Celtiis), en plusieurs tranches si besoin.',
            'robots' => 'noindex, follow',
        ],
    ]);
}

function enregistrer_inscription(): void
{
    $slug = champ('formation');
    $formation = $slug ? formation_par_slug($slug) : null;
    $retour = '/inscription' . ($slug ? '?formation=' . rawurlencode($slug) : '');

    if (est_robot()) {
        est_ajax() ? json_reponse(['ok' => true, 'redirection' => url('/')]) : rediriger('/');
    }
    if (!limite('inscription', 40, 3600)) {
        $msg = 'Trop de tentatives. Réessayez dans une heure ou écrivez-nous sur WhatsApp.';
        if (est_ajax()) {
            json_reponse(['ok' => false, 'erreurs' => ['_' => $msg]], 429);
        }
        flash('erreur', $msg);
        rediriger($retour);
    }
    if (!$formation) {
        $erreurs = ['formation' => 'Choisissez une formation.'];
        if (est_ajax()) {
            json_reponse(['ok' => false, 'erreurs' => $erreurs]);
        }
        memoriser_saisie($_POST);
        flash('erreur', $erreurs['formation']);
        rediriger($retour);
    }

    [$erreurs, $v] = valider_inscription($formation, $_POST);
    if ($erreurs) {
        if (est_ajax()) {
            json_reponse(['ok' => false, 'erreurs' => $erreurs]);
        }
        memoriser_saisie($_POST);
        flash('erreur', 'Merci de vérifier le formulaire : ' . implode(' ', $erreurs));
        rediriger($retour);
    }

    $r = creer_inscription($formation, $v);
    $ins = $r['inscription'];
    if ($r['doublon']) {
        flash('info', 'Vous étiez déjà inscrit(e) à cette formation : voici le suivi de votre inscription.');
    }
    $cible = url('/inscription/suivi/' . $ins['jeton_suivi']);
    est_ajax() ? json_reponse(['ok' => true, 'redirection' => $cible]) : rediriger($cible);
}

/** Étapes 3 et 4 : statut, paiement Mobile Money via WhatsApp, accès à l'espace. */
function page_suivi(string $jeton): void
{
    $ins = inscription_par_jeton($jeton) ?? page_introuvable();
    $formation = formation_par_id((int) $ins['formation_id']);
    $paiements = DB::tous("SELECT * FROM paiements WHERE inscription_id = ? AND statut = 'valide' ORDER BY recu_le", [$ins['id']]);
    $numeros = [];
    if (cfg('paiement.afficher_numeros_etape_paiement')) {
        foreach (OPERATEURS_MOBILE_MONEY as $op) {
            $numeros[$op] = cfg('paiement.mobile_money.' . $op);
        }
    }
    header('X-Robots-Tag: noindex');
    afficher('site/suivi', [
        'page' => 'inscription',
        'ins' => $ins,
        'formation' => $formation,
        'session' => $ins['session_id'] ? session_par_id((int) $ins['session_id']) : null,
        'paiements' => $paiements,
        'acces' => acces_contenus($ins),
        'reste' => reste_a_payer($ins),
        'numeros' => $numeros,
        'connecte' => (int) (utilisateur()['id'] ?? 0) === (int) $ins['utilisateur_id'],
        'meta' => ['titre' => 'Suivi de mon inscription — DIMO Tech Academy', 'robots' => 'noindex, nofollow'],
    ]);
}

function suivi_whatsapp(string $jeton): void
{
    $ins = inscription_par_jeton($jeton) ?? page_introuvable();
    $moyen = champ('moyen');
    if (in_array($moyen, OPERATEURS_MOBILE_MONEY, true)) {
        DB::modifier('inscriptions', ['moyen_paiement' => $moyen, 'maj_le' => maintenant()], ['id' => $ins['id']]);
    }
    rediriger(url('/whatsapp', ['i' => $jeton]), 302);
}

function suivi_paiement_en_ligne(string $jeton): void
{
    $ins = inscription_par_jeton($jeton) ?? page_introuvable();
    if (!fedapay_actif() || reste_a_payer($ins) <= 0 || $ins['statut'] === 'annulee') {
        rediriger('/inscription/suivi/' . $jeton);
    }
    $reste = reste_a_payer($ins);
    $montant = (int) preg_replace('/\D/', '', champ('montant', (string) $reste));
    $minimum = min($reste, MONTANT_MIN_EN_LIGNE);
    if ($montant < $minimum || $montant > $reste) {
        flash('erreur', 'Indiquez un montant entre ' . prix($minimum) . ' et ' . prix($reste) . '.');
        rediriger('/inscription/suivi/' . $jeton);
    }
    try {
        DB::modifier('inscriptions', ['moyen_paiement' => 'fedapay'], ['id' => $ins['id']]);
        rediriger(fedapay_demarrer($ins, $montant), 302);
    } catch (Throwable $e) {
        error_log('[fedapay] ' . $e->getMessage());
        flash('erreur', 'Le paiement en ligne est momentanément indisponible. Utilisez le paiement via WhatsApp.');
        rediriger('/inscription/suivi/' . $jeton);
    }
}

/** Envoie un lien de connexion à l'adresse de l'inscription (prouve que l'e-mail est bien le sien). */
function suivi_envoyer_acces(string $jeton): void
{
    $ins = inscription_par_jeton($jeton) ?? page_introuvable();
    if (limite('lien-suivi', 3, 900, $jeton)) {
        $u = DB::un('SELECT * FROM utilisateurs WHERE id = ?', [$ins['utilisateur_id']]);
        if ($u) {
            envoyer_lien_connexion($u);
        }
    }
    flash('succes', 'Un lien de connexion vient d’être envoyé à ' . masquer_email($ins['email']) . '. Ouvrez-le pour accéder à votre espace.');
    rediriger('/inscription/suivi/' . $jeton);
}

function masquer_email(string $email): string
{
    [$local, $domaine] = array_pad(explode('@', $email, 2), 2, '');
    return mb_substr($local, 0, 2) . str_repeat('•', max(1, min(6, mb_strlen($local) - 2))) . '@' . $domaine;
}

/** Retour du paiement FedaPay (phase 2). */
function retour_paiement(string $jeton, string $pid): void
{
    $p = DB::un(
        'SELECT p.*, i.jeton_suivi FROM paiements p JOIN inscriptions i ON i.id = p.inscription_id WHERE p.id = ? AND i.jeton_suivi = ?',
        [(int) $pid, $jeton]
    );
    if (!$p) {
        page_introuvable();
    }
    try {
        $p2 = fedapay_synchroniser((int) $p['id']);
        if (($p2['statut'] ?? '') === 'valide') {
            flash('succes', 'Paiement reçu, merci ! Votre inscription est à jour.');
        } elseif (($p2['statut'] ?? '') === 'echoue') {
            flash('erreur', 'Le paiement n’a pas abouti. Vous pouvez réessayer ou payer via WhatsApp.');
        } else {
            flash('info', 'Votre paiement est en cours de vérification. Cette page se mettra à jour dès sa validation.');
        }
    } catch (Throwable $e) {
        error_log('[fedapay retour] ' . $e->getMessage());
        flash('info', 'Votre paiement est en cours de vérification.');
    }
    rediriger('/inscription/suivi/' . $p['jeton_suivi']);
}

function webhook_fedapay(): void
{
    $brut = (string) file_get_contents('php://input');
    if (!fedapay_actif() || !fedapay_signature_valide($brut, (string) ($_SERVER['HTTP_X_FEDAPAY_SIGNATURE'] ?? ''))) {
        json_reponse(['erreur' => 'Signature invalide'], 400);
    }
    $evt = json_decode($brut, true) ?: [];
    $nom = (string) ($evt['name'] ?? $evt['type'] ?? 'inconnu');
    $objetId = (string) ($evt['entity']['id'] ?? $evt['object_id'] ?? '');
    $logId = DB::inserer('journal_webhooks', [
        'fournisseur' => 'fedapay',
        'evenement' => mb_substr($nom, 0, 80),
        'objet_id' => $objetId ?: null,
        'contenu' => $brut,
        'cree_le' => maintenant(),
    ]);
    try {
        if (str_starts_with($nom, 'transaction.') && $objetId !== '') {
            $pid = DB::valeur("SELECT id FROM paiements WHERE externe_id = ? AND fournisseur = 'fedapay'", [$objetId]);
            if ($pid) {
                fedapay_synchroniser((int) $pid);
            }
        }
        DB::modifier('journal_webhooks', ['traite' => 1], ['id' => $logId]);
    } catch (Throwable $e) {
        DB::modifier('journal_webhooks', ['erreur' => mb_substr($e->getMessage(), 0, 500)], ['id' => $logId]);
        json_reponse(['erreur' => 'Traitement impossible'], 500);
    }
    json_reponse(['recu' => true]);
}

<?php
/**
 * Phase 2 — paiement automatique FedaPay (Mobile Money et carte).
 * Désactivé tant que paiement.fedapay.actif vaut false dans config/config.php.
 * Le parcours ne change pas : l'apprenant voit simplement un bouton « Payer en ligne » en plus de WhatsApp.
 */
defined('DTA') || exit;

function fedapay_actif(): bool
{
    return (bool) cfg('paiement.fedapay.actif', false) && (string) cfg('paiement.fedapay.cle_secrete', '') !== '';
}

function fedapay_base(): string
{
    // Adresse de l'API imposée (tests uniquement) ; sinon déduite du préfixe de la clé.
    if ((string) cfg('paiement.fedapay.api_base', '') !== '') {
        return rtrim((string) cfg('paiement.fedapay.api_base'), '/');
    }
    return str_starts_with((string) cfg('paiement.fedapay.cle_secrete', ''), 'sk_live_')
        ? 'https://api.fedapay.com/v1'
        : 'https://sandbox-api.fedapay.com/v1';
}

function fedapay_requete(string $methode, string $chemin, ?array $corps = null): array
{
    $ch = curl_init(fedapay_base() . $chemin);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $methode,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . cfg('paiement.fedapay.cle_secrete'),
            'Content-Type: application/json',
            'Accept: application/json',
        ],
    ]);
    if ($corps !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($corps));
    }
    $reponse = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $erreur = curl_error($ch);
    curl_close($ch);
    if ($reponse === false) {
        throw new RuntimeException('FedaPay injoignable : ' . $erreur);
    }
    $json = json_decode((string) $reponse, true) ?: [];
    if ($code >= 400) {
        throw new RuntimeException('FedaPay : ' . ($json['message'] ?? 'erreur HTTP ' . $code));
    }
    return $json;
}

function fedapay_extraire(array $donnees, string $cle): array
{
    return $donnees['v1/' . $cle] ?? $donnees[$cle] ?? $donnees;
}

/**
 * Crée une transaction pour le reste à payer (ou un montant donné) et renvoie l'URL de paiement FedaPay.
 */
function fedapay_demarrer(array $ins, ?int $montant = null): string
{
    $montant ??= reste_a_payer($ins);
    if ($montant <= 0) {
        throw new RuntimeException('Rien à payer pour cette inscription.');
    }
    // Une tentative récente du même montant, encore en attente, est réutilisée (pas de doublon si l'on clique deux fois).
    $recente = DB::un(
        "SELECT * FROM paiements WHERE inscription_id = ? AND fournisseur = 'fedapay' AND statut = 'en_attente'
         AND montant = ? AND lien_paiement IS NOT NULL AND cree_le >= ? ORDER BY id DESC LIMIT 1",
        [$ins['id'], $montant, date('Y-m-d H:i:s', time() - 1800)]
    );
    if ($recente) {
        try {
            $recente = fedapay_synchroniser((int) $recente['id']);
        } catch (Throwable $e) {
            error_log('[fedapay] tentative précédente illisible : ' . $e->getMessage());
            $recente = null;
        }
        if (($recente['statut'] ?? '') === 'en_attente') {
            return (string) $recente['lien_paiement'];
        }
        if (($recente['statut'] ?? '') === 'valide') {
            throw new RuntimeException('Ce paiement vient d’être validé.');
        }
    }
    $morceaux = explode(' ', $ins['nom'], 2);
    $paiementId = DB::inserer('paiements', [
        'inscription_id' => $ins['id'],
        'montant' => $montant,
        'moyen' => 'fedapay',
        'fournisseur' => 'fedapay',
        'statut' => 'en_attente',
        'cree_le' => maintenant(),
    ]);
    $transaction = fedapay_extraire(fedapay_requete('POST', '/transactions', [
        'description' => mb_substr('DIMO Tech Academy ' . $ins['reference'] . ' — ' . $ins['formation_titre'], 0, 250),
        'amount' => $montant,
        'currency' => ['iso' => cfg('paiement.fedapay.devise', 'XOF')],
        // Retour après paiement : FedaPay ajoute ?id=…&status=… ; le jeton de suivi empêche de deviner l'adresse.
        'callback_url' => url_absolue('/paiement/retour/' . $ins['jeton_suivi'] . '/' . $paiementId),
        'customer' => [
            'firstname' => $morceaux[0],
            'lastname' => $morceaux[1] ?? $morceaux[0],
            'email' => $ins['email'],
        ],
    ]), 'transaction');
    $jeton = fedapay_requete('POST', '/transactions/' . $transaction['id'] . '/token', []);
    $lien = $jeton['url'] ?? ($jeton['v1/token']['url'] ?? null);
    if (!$lien) {
        throw new RuntimeException('FedaPay n’a pas renvoyé de lien de paiement.');
    }
    DB::modifier('paiements', ['externe_id' => (string) $transaction['id'], 'reference' => $transaction['reference'] ?? null, 'lien_paiement' => $lien], ['id' => $paiementId]);
    return $lien;
}

/** Relit le statut auprès de FedaPay et valide la tranche si elle est payée. */
function fedapay_synchroniser(int $paiementId): ?array
{
    $p = DB::un('SELECT * FROM paiements WHERE id = ?', [$paiementId]);
    if (!$p || !$p['externe_id'] || $p['statut'] !== 'en_attente') {
        return $p;
    }
    $t = fedapay_extraire(fedapay_requete('GET', '/transactions/' . $p['externe_id']), 'transaction');
    $statut = strtolower((string) ($t['status'] ?? 'pending'));
    if (in_array($statut, ['approved', 'transferred'], true)) {
        // Mise à jour conditionnelle : le retour du navigateur et le webhook peuvent arriver en même temps.
        $fait = DB::requete(
            "UPDATE paiements SET statut = 'valide', recu_le = ? WHERE id = ? AND statut = 'en_attente'",
            [maintenant(), $paiementId]
        )->rowCount();
        if ($fait) {
            $ins = recalculer_inscription((int) $p['inscription_id']);
            notifier((int) $ins['utilisateur_id'], 'Paiement reçu', 'Votre paiement en ligne de ' . prix((int) $p['montant']) . ' pour « ' . $ins['formation_titre'] . ' » est validé.', '/espace');
        }
    } elseif (in_array($statut, ['declined', 'canceled', 'cancelled', 'expired', 'refunded'], true)) {
        DB::requete("UPDATE paiements SET statut = 'echoue' WHERE id = ? AND statut = 'en_attente'", [$paiementId]);
    }
    return DB::un('SELECT * FROM paiements WHERE id = ?', [$paiementId]);
}

/** Vérifie la signature d'un webhook (en-tête X-FEDAPAY-SIGNATURE : t=…,s=…). */
function fedapay_signature_valide(string $corps, string $entete, int $tolerance = 300): bool
{
    $secret = (string) cfg('paiement.fedapay.secret_webhook', '');
    if ($secret === '' || $entete === '') {
        return false;
    }
    $t = -1;
    $signatures = [];
    foreach (explode(',', $entete) as $part) {
        [$k, $v] = array_pad(explode('=', $part, 2), 2, '');
        if (trim($k) === 't') {
            $t = (int) $v;
        } elseif (trim($k) === 's' && $v !== '') {
            $signatures[] = trim($v);
        }
    }
    if ($t < 0 || !$signatures || abs(time() - $t) > $tolerance) {
        return false;
    }
    $attendu = hash_hmac('sha256', $t . '.' . $corps, $secret);
    foreach ($signatures as $s) {
        if (hash_equals($attendu, $s)) {
            return true;
        }
    }
    return false;
}

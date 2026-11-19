<?php
/**
 * Envoi des e-mails : SMTP (boîte Hostinger), fonction mail() de PHP, ou journal (tests).
 * Les gabarits sont dans views/emails/.
 */
defined('DTA') || exit;

/**
 * Envoie un e-mail à partir d'un gabarit. Ne lève jamais d'exception : renvoie false en cas d'échec
 * (l'erreur est consignée dans storage/logs/erreurs.log) pour ne pas bloquer une inscription.
 */
function envoyer_email(string $destinataire, string $sujet, string $gabarit, array $donnees = [], ?string $repondreA = null): bool
{
    try {
        $corps = rendre_fichier(RACINE . '/views/emails/' . $gabarit . '.php', $donnees);
        $html = rendre_fichier(RACINE . '/views/emails/_mise-en-page.php', ['contenu' => $corps, 'sujet' => $sujet]);
        $texte = trim(html_entity_decode(strip_tags(preg_replace(['/<br\s*\/?>/i', '/<\/(p|h1|h2|li|tr)>/i', '/<\/t[dh]>/i', '/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/i'], ["\n", "\n\n", ' : ', '$2 : $1'], $corps) ?? ''), ENT_QUOTES, 'UTF-8'));
        $texte = preg_replace("/\n{3,}/", "\n\n", preg_replace('/[ \t]+/', ' ', $texte) ?? '') ?? '';
        return transmettre_email($destinataire, $sujet, $html, $texte, $repondreA);
    } catch (Throwable $e) {
        error_log('[email] ' . $e->getMessage());
        return false;
    }
}

/** Prévient l'équipe (copie des inscriptions et demandes). */
function prevenir_equipe(string $sujet, string $gabarit, array $donnees = [], ?string $repondreA = null): void
{
    $equipe = (string) cfg('email.copie_equipe', '');
    if ($equipe !== '') {
        envoyer_email($equipe, $sujet, $gabarit, $donnees, $repondreA);
    }
}

function transmettre_email(string $a, string $sujet, string $html, string $texte, ?string $repondreA = null): bool
{
    $mode = (string) cfg('email.mode', 'journal');
    $de = (string) cfg('email.expediteur', cfg('contact.email', ''));
    $nomDe = (string) cfg('email.nom_expediteur', 'DIMO Tech Academy');

    if ($mode === 'journal' || $de === '') {
        $ligne = sprintf("=== %s ===\nÀ : %s\nSujet : %s\n\n%s\n\n", date('c'), $a, $sujet, $texte);
        file_put_contents(RACINE . '/storage/logs/emails.log', $ligne, FILE_APPEND | LOCK_EX);
        return true;
    }

    $frontiere = 'dta_' . bin2hex(random_bytes(8));
    $sujetEnc = '=?UTF-8?B?' . base64_encode($sujet) . '?=';
    $entetes = [
        'MIME-Version: 1.0',
        'From: =?UTF-8?B?' . base64_encode($nomDe) . '?= <' . $de . '>',
        'Reply-To: ' . ($repondreA ?: $de),
        'Content-Type: multipart/alternative; boundary="' . $frontiere . '"',
        'X-Mailer: DIMO Tech Academy',
    ];
    $corps = "--$frontiere\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($texte))
        . "--$frontiere\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html))
        . "--$frontiere--\r\n";

    if ($mode === 'mail') {
        $ok = mail($a, $sujetEnc, $corps, implode("\r\n", $entetes), '-f' . $de);
        if (!$ok) {
            error_log('[email] mail() a échoué pour ' . $a);
        }
        return $ok;
    }

    try {
        smtp_envoyer($de, $a, array_merge(['To: ' . $a, 'Subject: ' . $sujetEnc, 'Date: ' . date('r'), 'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . (parse_url((string) cfg('site.url'), PHP_URL_HOST) ?: 'localhost') . '>'], $entetes), $corps);
        return true;
    } catch (Throwable $e) {
        error_log('[email SMTP] ' . $e->getMessage());
        return false;
    }
}

/** Client SMTP minimal (SSL 465 ou STARTTLS 587, authentification LOGIN). */
function smtp_envoyer(string $de, string $a, array $entetes, string $corps): void
{
    $hote = (string) cfg('email.smtp.hote');
    $port = (int) cfg('email.smtp.port', 465);
    $securite = (string) cfg('email.smtp.securite', 'ssl');
    $prefixe = $securite === 'ssl' ? 'ssl://' : 'tcp://';
    $flux = @stream_socket_client($prefixe . $hote . ':' . $port, $errno, $errstr, 15);
    if (!$flux) {
        throw new RuntimeException("Connexion SMTP impossible : $errstr ($errno)");
    }
    stream_set_timeout($flux, 15);

    $lire = function () use ($flux): string {
        $reponse = '';
        while (($ligne = fgets($flux, 515)) !== false) {
            $reponse .= $ligne;
            if (isset($ligne[3]) && $ligne[3] === ' ') {
                break;
            }
        }
        return $reponse;
    };
    $envoyer = function (string $commande, array $codesAttendus) use ($flux, $lire): string {
        fwrite($flux, $commande . "\r\n");
        $r = $lire();
        if (!in_array((int) substr($r, 0, 3), $codesAttendus, true)) {
            throw new RuntimeException('SMTP : réponse inattendue à « ' . strtok($commande, ' ') . ' » : ' . trim($r));
        }
        return $r;
    };

    $lire();
    $domaine = parse_url((string) cfg('site.url'), PHP_URL_HOST) ?: 'localhost';
    $envoyer('EHLO ' . $domaine, [250]);
    if ($securite === 'tls') {
        $envoyer('STARTTLS', [220]);
        if (!stream_socket_enable_crypto($flux, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) {
            throw new RuntimeException('SMTP : échec du chiffrement STARTTLS');
        }
        $envoyer('EHLO ' . $domaine, [250]);
    }
    $envoyer('AUTH LOGIN', [334]);
    $envoyer(base64_encode((string) cfg('email.smtp.utilisateur')), [334]);
    $envoyer(base64_encode((string) cfg('email.smtp.mot_de_passe')), [235]);
    $envoyer('MAIL FROM:<' . $de . '>', [250]);
    $envoyer('RCPT TO:<' . $a . '>', [250, 251]);
    $envoyer('DATA', [354]);
    $message = implode("\r\n", $entetes) . "\r\n\r\n" . $corps;
    $message = preg_replace('/^\./m', '..', $message) ?? $message;
    $envoyer($message . "\r\n.", [250]);
    fwrite($flux, "QUIT\r\n");
    fclose($flux);
}

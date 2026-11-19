<?php
/**
 * DIMO Tech Academy — FICHIER DE RÉGLAGES UNIQUE
 *
 * C'est le seul endroit où vivent les numéros (WhatsApp, Mobile Money), les adresses e-mail,
 * les liens des réseaux sociaux et les clés de paiement. Aucun numéro n'est écrit dans les pages :
 * ils ne servent que derrière les boutons WhatsApp et à l'étape de paiement.
 *
 * L'installateur (install.php) crée automatiquement config/config.php à partir de ce modèle.
 * Pour modifier un réglage ensuite : hPanel Hostinger → Gestionnaire de fichiers →
 * config/config.php → Modifier, puis Enregistrer. Ne partagez jamais ce fichier.
 */
defined('DTA') || exit;

return [

    // ── Site ─────────────────────────────────────────────────────────────
    'site' => [
        // Adresse publique, sans barre oblique finale (sous-domaine à confirmer).
        'url' => 'https://academy.dimotech.fr',
        'nom' => 'DIMO Tech Academy',
        // 'production' en ligne ; 'dev' pour afficher les erreurs pendant les tests.
        'environnement' => 'production',
        'fuseau' => 'Africa/Porto-Novo',
        // Clé secrète générée à l'installation (ne pas la modifier une fois en ligne).
        'cle_app' => '__CLE_APP__',
    ],

    // ── Base de données MySQL (hPanel → Bases de données → MySQL) ────────
    'db' => [
        'hote' => 'localhost',
        'port' => 3306,
        'nom' => '',
        'utilisateur' => '',
        'mot_de_passe' => '',
    ],

    // ── Contact ──────────────────────────────────────────────────────────
    'contact' => [
        // Le catalogue cite contact@dimotech.fr et contact@dimo-tech.net : choisir l'adresse officielle.
        'email' => 'contact@dimotech.fr',
        'email_assistance' => 'contact@dimotech.fr',
        // Numéro WhatsApp au format international, chiffres seulement (ex. 229XXXXXXXXXX).
        // Laisser vide tant qu'il n'est pas confirmé : les boutons WhatsApp mènent alors à la page Contact.
        'whatsapp' => '',
        'adresse' => 'Akpakpa, Cotonou (Bénin)',
        // Lien Google Maps du siège (facultatif).
        'carte' => '',
    ],

    // ── Paiement ─────────────────────────────────────────────────────────
    'paiement' => [
        // Numéros Mobile Money : jamais affichés dans les pages publiques.
        'mobile_money' => [
            'mtn' => ['libelle' => 'MTN Mobile Money', 'numero' => '', 'titulaire' => ''],
            'moov' => ['libelle' => 'Moov Money', 'numero' => '', 'titulaire' => ''],
            'celtiis' => ['libelle' => 'Celtiis', 'numero' => '', 'titulaire' => ''],
        ],
        // true : affiche le numéro de l'opérateur choisi à l'étape de paiement (après inscription).
        // false (par défaut) : l'apprenant reçoit les instructions uniquement sur WhatsApp.
        'afficher_numeros_etape_paiement' => false,

        // Phase 2 — paiement automatique FedaPay (Mobile Money et carte).
        // FedaPay → Paramètres → Clés API, puis Webhooks : https://<votre-site>/webhooks/fedapay
        'fedapay' => [
            'actif' => false,
            'cle_secrete' => '',      // sk_sandbox_... ou sk_live_...
            'secret_webhook' => '',   // wh_sandbox_... ou wh_live_...
            'devise' => 'XOF',
        ],
    ],

    // ── Réseaux sociaux (laisser vide pour masquer l'icône) ──────────────
    'reseaux' => [
        'tiktok' => '',    // TikTok « DIMO TECH ACADEMY »
        'facebook' => '',  // Facebook « DIMO TECH »
        'linkedin' => '',  // LinkedIn « DIMO TECH ACADEMY »
        'dimotech' => 'https://dimotech.fr',
    ],

    // ── Envoi des e-mails ────────────────────────────────────────────────
    'email' => [
        // 'smtp' (recommandé, boîte mail Hostinger), 'mail' (fonction PHP) ou 'journal' (tests : écrit dans storage/logs).
        'mode' => 'journal',
        'expediteur' => 'contact@dimotech.fr',
        'nom_expediteur' => 'DIMO Tech Academy',
        // Copie des nouvelles inscriptions et demandes à l'équipe.
        'copie_equipe' => 'contact@dimotech.fr',
        'smtp' => [
            'hote' => 'smtp.hostinger.com',
            'port' => 465,
            'securite' => 'ssl',   // 'ssl' (465) ou 'tls' (587)
            'utilisateur' => '',
            'mot_de_passe' => '',
        ],
    ],

    // ── Statistiques de visite ───────────────────────────────────────────
    // Un compteur sans cookie est toujours actif (Administration → Tableau de bord).
    // Google Analytics 4 (facultatif) : ne se charge qu'après accord du visiteur.
    'statistiques' => [
        'ga4' => '', // ex. G-XXXXXXXXXX
    ],
];

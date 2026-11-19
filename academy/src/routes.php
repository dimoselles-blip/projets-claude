<?php
/**
 * Toutes les adresses de la plateforme.
 */
defined('DTA') || exit;

require RACINE . '/src/controleurs/site.php';
require RACINE . '/src/controleurs/inscription.php';
require RACINE . '/src/controleurs/espace.php';
require RACINE . '/src/controleurs/admin.php';
require RACINE . '/src/controleurs/admin-contenus.php';

// ── Site public ─────────────────────────────────────────────
Routeur::get('/', 'page_accueil');
Routeur::get('/formations', 'page_formations');
Routeur::get('/formations/{slug}', 'page_formation');
Routeur::get('/masterclass', 'page_masterclass');
Routeur::get('/parcours', 'page_parcours');
Routeur::get('/entreprises', 'page_entreprises');
Routeur::post('/entreprises/devis', 'envoyer_devis');
Routeur::get('/sessions', 'page_sessions');
Routeur::post('/liste-attente', 'inscrire_liste_attente');
Routeur::get('/a-propos', 'page_a_propos');
Routeur::get('/contact', 'page_contact');
Routeur::post('/contact', 'envoyer_contact');
Routeur::get('/faq', 'page_faq');
Routeur::get('/mentions-legales', 'page_mentions');
Routeur::get('/confidentialite', 'page_confidentialite');
Routeur::get('/whatsapp', 'rediriger_whatsapp');
Routeur::get('/sitemap.xml', 'plan_du_site');
Routeur::get('/robots.txt', 'fichier_robots');

// ── Inscription et paiement ─────────────────────────────────
Routeur::get('/inscription', 'page_inscription');
Routeur::post('/inscription', 'enregistrer_inscription');
Routeur::get('/inscription/suivi/{jeton}', 'page_suivi');
Routeur::post('/inscription/suivi/{jeton}/whatsapp', 'suivi_whatsapp');
Routeur::post('/inscription/suivi/{jeton}/en-ligne', 'suivi_paiement_en_ligne');
Routeur::post('/inscription/suivi/{jeton}/acces', 'suivi_envoyer_acces');
Routeur::get('/paiement/retour', 'retour_paiement');
Routeur::post('/webhooks/fedapay', 'webhook_fedapay');

// ── Espace apprenant ────────────────────────────────────────
Routeur::get('/espace/connexion', 'page_connexion');
Routeur::post('/espace/connexion', 'traiter_connexion');
Routeur::post('/espace/lien', 'demander_lien_connexion');
Routeur::get('/espace/lien/{jeton}', 'utiliser_lien_connexion');
Routeur::post('/espace/deconnexion', 'traiter_deconnexion');
Routeur::get('/espace', 'page_espace');
Routeur::get('/espace/formations/{slug}', 'page_espace_formation');
Routeur::post('/espace/lecons/{id}/terminee', 'marquer_lecon');
Routeur::get('/espace/fichiers/{id}', 'telecharger_support');
Routeur::get('/espace/profil', 'page_profil');
Routeur::post('/espace/profil', 'enregistrer_profil');
Routeur::post('/espace/mot-de-passe', 'enregistrer_mot_de_passe');
Routeur::post('/espace/notifications/lues', 'notifications_lues');

// ── Administration ──────────────────────────────────────────
Routeur::get('/admin', 'admin_tableau');
Routeur::get('/admin/inscriptions', 'admin_inscriptions');
Routeur::get('/admin/inscriptions/export', 'admin_export_inscriptions');
Routeur::get('/admin/inscriptions/{id}', 'admin_inscription');
Routeur::post('/admin/inscriptions/{id}/statut', 'admin_inscription_statut');
Routeur::post('/admin/inscriptions/{id}/paiement', 'admin_inscription_paiement');
Routeur::post('/admin/inscriptions/{id}/paiement/{pid}/supprimer', 'admin_inscription_supprimer_paiement');
Routeur::post('/admin/inscriptions/{id}/note', 'admin_inscription_note');
Routeur::post('/admin/inscriptions/{id}/lien', 'admin_inscription_lien');
Routeur::get('/admin/demandes', 'admin_demandes');
Routeur::get('/admin/demandes/export', 'admin_export_demandes');
Routeur::post('/admin/demandes/{id}/traitee', 'admin_demande_traitee');
Routeur::get('/admin/apprenants', 'admin_apprenants');
Routeur::post('/admin/apprenants/{id}/lien', 'admin_apprenant_lien');
Routeur::post('/admin/apprenants/{id}/role', 'admin_apprenant_role');
Routeur::get('/admin/reglages', 'admin_reglages');
Routeur::post('/admin/reglages', 'admin_enregistrer_reglages');
Routeur::get('/admin/contenu', 'admin_contenu');
Routeur::get('/admin/contenu/export', 'admin_export_contenu');
Routeur::post('/admin/contenu/import', 'admin_import_contenu');
Routeur::post('/admin/email-test', 'admin_email_test');

// Contenus pédagogiques d'une formation (modules, vidéos, directs, supports)
Routeur::get('/admin/formations/{id}/contenus', 'admin_contenus');
Routeur::post('/admin/formations/{id}/modules', 'admin_enregistrer_module');
Routeur::post('/admin/modules/{id}/supprimer', 'admin_supprimer_module');
Routeur::post('/admin/formations/{id}/lecons', 'admin_enregistrer_lecon');
Routeur::post('/admin/lecons/{id}/supprimer', 'admin_supprimer_lecon');

// Collections génériques : formations, sessions, formateurs, témoignages, indicateurs, faq, catégories
Routeur::get('/admin/{ressource}', 'admin_liste');
Routeur::get('/admin/{ressource}/nouveau', 'admin_formulaire');
Routeur::get('/admin/{ressource}/{id}', 'admin_formulaire');
Routeur::post('/admin/{ressource}/enregistrer', 'admin_enregistrer');
Routeur::post('/admin/{ressource}/{id}/enregistrer', 'admin_enregistrer');
Routeur::post('/admin/{ressource}/{id}/supprimer', 'admin_supprimer');
Routeur::post('/admin/{ressource}/{id}/dupliquer', 'admin_dupliquer');

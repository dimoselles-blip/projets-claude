-- DIMO Tech Academy — schéma de la base de données (MySQL 5.7+ / MariaDB 10.3+)
-- Exécuté automatiquement par install.php. Toutes les tables sont en utf8mb4.

CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL,
  telephone VARCHAR(40) NULL,
  mot_de_passe VARCHAR(255) NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'apprenant',
  cree_le DATETIME NOT NULL,
  derniere_connexion DATETIME NULL,
  UNIQUE KEY uq_utilisateurs_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jetons_connexion (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL,
  jeton_hash CHAR(64) NOT NULL,
  expire_le DATETIME NOT NULL,
  utilise_le DATETIME NULL,
  cree_le DATETIME NOT NULL,
  UNIQUE KEY uq_jeton (jeton_hash),
  KEY idx_jeton_utilisateur (utilisateur_id),
  CONSTRAINT fk_jeton_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(60) NOT NULL,
  nom VARCHAR(120) NOT NULL,
  onglet VARCHAR(120) NOT NULL,
  accroche VARCHAR(300) NULL,
  ordre INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS formateurs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(190) NOT NULL,
  role VARCHAR(190) NULL,
  bio TEXT NULL,
  photo VARCHAR(255) NULL,
  linkedin VARCHAR(255) NULL,
  publie TINYINT(1) NOT NULL DEFAULT 1,
  ordre INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS formations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  titre VARCHAR(190) NOT NULL,
  categorie_id INT UNSIGNED NOT NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'brouillon',
  niveau VARCHAR(30) NOT NULL DEFAULT 'Débutant',
  accroche VARCHAR(300) NULL,
  probleme TEXT NULL,
  objectifs TEXT NULL,
  public_cible TEXT NULL,
  prerequis TEXT NULL,
  resultat TEXT NULL,
  debouches TEXT NULL,
  mode VARCHAR(20) NOT NULL DEFAULT 'hybride',
  format_label VARCHAR(190) NULL,
  duree_label VARCHAR(60) NULL,
  prix INT UNSIGNED NOT NULL DEFAULT 0,
  prix_en_ligne INT UNSIGNED NULL,
  mention_prix VARCHAR(120) NULL,
  certification VARCHAR(20) NOT NULL DEFAULT 'aucune',
  stage TINYINT(1) NOT NULL DEFAULT 0,
  formateur_id INT UNSIGNED NULL,
  faq TEXT NULL,
  quiz TEXT NULL,
  image VARCHAR(255) NULL,
  ordre INT NOT NULL DEFAULT 0,
  cree_le DATETIME NOT NULL,
  maj_le DATETIME NOT NULL,
  UNIQUE KEY uq_formations_slug (slug),
  KEY idx_formations_categorie (categorie_id),
  CONSTRAINT fk_formation_categorie FOREIGN KEY (categorie_id) REFERENCES categories(id),
  CONSTRAINT fk_formation_formateur FOREIGN KEY (formateur_id) REFERENCES formateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS modules (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formation_id INT UNSIGNED NOT NULL,
  code VARCHAR(10) NULL,
  titre VARCHAR(190) NOT NULL,
  description TEXT NULL,
  ordre INT NOT NULL DEFAULT 0,
  KEY idx_modules_formation (formation_id),
  CONSTRAINT fk_module_formation FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions = dates de démarrage (cohortes, masterclass, journées de formation)
CREATE TABLE IF NOT EXISTS sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formation_id INT UNSIGNED NOT NULL,
  intitule VARCHAR(190) NULL,
  date_debut DATE NOT NULL,
  heure_debut TIME NULL,
  date_fin DATE NULL,
  horaires VARCHAR(190) NULL,
  format VARCHAR(20) NOT NULL DEFAULT 'presentiel',
  lieu VARCHAR(190) NULL,
  places INT NULL,
  inscriptions_ouvertes TINYINT(1) NOT NULL DEFAULT 1,
  lien_visio VARCHAR(500) NULL,
  replay_url VARCHAR(500) NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'planifiee',
  note VARCHAR(300) NULL,
  cree_le DATETIME NOT NULL,
  KEY idx_sessions_formation (formation_id),
  KEY idx_sessions_date (date_debut),
  CONSTRAINT fk_session_formation FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leçons = vidéos, séances en direct (puis replays), supports téléchargeables, liens
CREATE TABLE IF NOT EXISTS lecons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formation_id INT UNSIGNED NOT NULL,
  module_id INT UNSIGNED NULL,
  session_id INT UNSIGNED NULL,
  titre VARCHAR(190) NOT NULL,
  description TEXT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'video',
  video_url VARCHAR(500) NULL,
  date_direct DATETIME NULL,
  lien_visio VARCHAR(500) NULL,
  lien_externe VARCHAR(500) NULL,
  fichier VARCHAR(255) NULL,
  fichier_nom VARCHAR(255) NULL,
  fichier_taille INT UNSIGNED NULL,
  duree_min INT UNSIGNED NULL,
  publie TINYINT(1) NOT NULL DEFAULT 1,
  ordre INT NOT NULL DEFAULT 0,
  cree_le DATETIME NOT NULL,
  KEY idx_lecons_formation (formation_id),
  KEY idx_lecons_module (module_id),
  CONSTRAINT fk_lecon_formation FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE CASCADE,
  CONSTRAINT fk_lecon_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL,
  CONSTRAINT fk_lecon_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inscriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(20) NOT NULL,
  jeton_suivi CHAR(32) NOT NULL,
  utilisateur_id INT UNSIGNED NOT NULL,
  formation_id INT UNSIGNED NOT NULL,
  session_id INT UNSIGNED NULL,
  format VARCHAR(20) NULL,
  nom VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL,
  telephone VARCHAR(40) NOT NULL,
  pays VARCHAR(80) NULL,
  montant_total INT UNSIGNED NOT NULL DEFAULT 0,
  montant_recu INT UNSIGNED NOT NULL DEFAULT 0,
  statut VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  moyen_paiement VARCHAR(20) NULL,
  note_admin TEXT NULL,
  consentement_le DATETIME NOT NULL,
  confirmee_le DATETIME NULL,
  cree_le DATETIME NOT NULL,
  maj_le DATETIME NOT NULL,
  UNIQUE KEY uq_inscriptions_reference (reference),
  UNIQUE KEY uq_inscriptions_jeton (jeton_suivi),
  KEY idx_inscriptions_statut (statut),
  KEY idx_inscriptions_utilisateur (utilisateur_id),
  CONSTRAINT fk_inscription_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  CONSTRAINT fk_inscription_formation FOREIGN KEY (formation_id) REFERENCES formations(id),
  CONSTRAINT fk_inscription_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Échéancier : chaque tranche reçue (Mobile Money validé à la main, ou FedaPay en phase 2)
CREATE TABLE IF NOT EXISTS paiements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inscription_id INT UNSIGNED NOT NULL,
  montant INT UNSIGNED NOT NULL,
  moyen VARCHAR(20) NOT NULL,
  fournisseur VARCHAR(20) NOT NULL DEFAULT 'manuel',
  statut VARCHAR(20) NOT NULL DEFAULT 'valide',
  reference VARCHAR(120) NULL,
  externe_id VARCHAR(60) NULL,
  lien_paiement VARCHAR(500) NULL,
  recu_le DATETIME NULL,
  enregistre_par INT UNSIGNED NULL,
  note VARCHAR(300) NULL,
  cree_le DATETIME NOT NULL,
  KEY idx_paiements_inscription (inscription_id),
  KEY idx_paiements_externe (externe_id),
  CONSTRAINT fk_paiement_inscription FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS temoignages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(190) NOT NULL,
  formation VARCHAR(190) NULL,
  texte TEXT NOT NULL,
  photo VARCHAR(255) NULL,
  publie TINYINT(1) NOT NULL DEFAULT 1,
  ordre INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS indicateurs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cle VARCHAR(60) NOT NULL,
  libelle VARCHAR(120) NOT NULL,
  valeur INT NULL,
  suffixe VARCHAR(10) NULL,
  ordre INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_indicateurs_cle (cle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faq (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(300) NOT NULL,
  reponse TEXT NOT NULL,
  rubrique VARCHAR(60) NULL,
  accueil TINYINT(1) NOT NULL DEFAULT 0,
  ordre INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Demandes reçues : contact, devis entreprise, liste d'attente
CREATE TABLE IF NOT EXISTS demandes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  nom VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL,
  telephone VARCHAR(40) NULL,
  organisation VARCHAR(190) NULL,
  formation_id INT UNSIGNED NULL,
  sujet VARCHAR(190) NULL,
  message TEXT NULL,
  details TEXT NULL,
  traitee TINYINT(1) NOT NULL DEFAULT 0,
  consentement_le DATETIME NOT NULL,
  cree_le DATETIME NOT NULL,
  KEY idx_demandes_type (type),
  CONSTRAINT fk_demande_formation FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED NOT NULL,
  titre VARCHAR(190) NOT NULL,
  message TEXT NULL,
  lien VARCHAR(255) NULL,
  lu_le DATETIME NULL,
  cree_le DATETIME NOT NULL,
  KEY idx_notifications_utilisateur (utilisateur_id),
  CONSTRAINT fk_notification_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS progression (
  utilisateur_id INT UNSIGNED NOT NULL,
  lecon_id INT UNSIGNED NOT NULL,
  terminee_le DATETIME NOT NULL,
  PRIMARY KEY (utilisateur_id, lecon_id),
  CONSTRAINT fk_progression_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  CONSTRAINT fk_progression_lecon FOREIGN KEY (lecon_id) REFERENCES lecons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phase 2 : quiz et certificats numériques (tables prêtes, fonctionnalités désactivées)
CREATE TABLE IF NOT EXISTS quiz (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formation_id INT UNSIGNED NOT NULL,
  module_id INT UNSIGNED NULL,
  titre VARCHAR(190) NOT NULL,
  questions TEXT NOT NULL,
  seuil_reussite INT NOT NULL DEFAULT 70,
  publie TINYINT(1) NOT NULL DEFAULT 0,
  cree_le DATETIME NOT NULL,
  CONSTRAINT fk_quiz_formation FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_tentatives (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT UNSIGNED NOT NULL,
  utilisateur_id INT UNSIGNED NOT NULL,
  score INT NOT NULL,
  reponses TEXT NULL,
  cree_le DATETIME NOT NULL,
  CONSTRAINT fk_tentative_quiz FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE,
  CONSTRAINT fk_tentative_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certificats (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inscription_id INT UNSIGNED NOT NULL,
  code VARCHAR(24) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'certificat',
  delivre_le DATE NOT NULL,
  fichier VARCHAR(255) NULL,
  cree_le DATETIME NOT NULL,
  UNIQUE KEY uq_certificats_code (code),
  CONSTRAINT fk_certificat_inscription FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reglages (
  cle VARCHAR(60) NOT NULL PRIMARY KEY,
  valeur TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Statistiques de visite sans cookie (pages vues par jour)
CREATE TABLE IF NOT EXISTS stats_vues (
  jour DATE NOT NULL,
  chemin VARCHAR(191) NOT NULL,
  vues INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (jour, chemin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Anti-abus : limite le nombre d'envois de formulaires et de tentatives de connexion
CREATE TABLE IF NOT EXISTS limites (
  cle CHAR(64) NOT NULL PRIMARY KEY,
  compteur INT UNSIGNED NOT NULL DEFAULT 0,
  debut DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS journal_webhooks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fournisseur VARCHAR(20) NOT NULL,
  evenement VARCHAR(80) NOT NULL,
  objet_id VARCHAR(60) NULL,
  contenu MEDIUMTEXT NULL,
  traite TINYINT(1) NOT NULL DEFAULT 0,
  erreur VARCHAR(500) NULL,
  cree_le DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

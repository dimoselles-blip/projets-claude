<?php
/**
 * Fenêtre d'inscription, ouverte par tous les boutons « S'inscrire » / « Je m'inscris ».
 * Les données des formations et des sessions ouvertes sont intégrées une seule fois (JSON léger).
 */
defined('DTA') || exit;
$sessionsParFormation = [];
foreach (sessions_a_venir() as $s) {
    if ($s['ouverte']) {
        $sessionsParFormation[(int) $s['formation_id']][] = [
            'id' => (int) $s['id'],
            'libelle' => date_fr($s['date_debut'], true) . ' · ' . $s['format_label'] . ($s['places_restantes'] !== null ? ' · ' . pluriel($s['places_restantes'], 'place restante', 'places restantes') : ''),
            'format' => $s['format'],
        ];
    }
}
$donnees = [];
foreach (formations_options() as $o) {
    $donnees[$o['slug']] = [
        'titre' => $o['titre'],
        'prix' => (int) $o['prix'],
        'prixEnLigne' => $o['prix_en_ligne'] !== null ? (int) $o['prix_en_ligne'] : null,
        'choixFormat' => $o['mode'] === 'au_choix',
        'sessions' => $sessionsParFormation[(int) $o['id']] ?? [],
    ];
}
?>
<dialog class="modale" id="modale-inscription" aria-labelledby="modale-inscription-titre" data-modale-inscription>
  <div class="modale-corps">
    <div class="modale-entete">
      <div>
        <p class="surtitre">Inscription</p>
        <h2 id="modale-inscription-titre" data-modale-titre>Je m’inscris</h2>
      </div>
      <button type="button" class="modale-fermer" data-modale-fermer aria-label="Fermer"><?= icone('fermer') ?></button>
    </div>
    <?= partiel('formulaire-inscription', ['prefixe' => 'modale']) ?>
  </div>
</dialog>
<script type="application/json" id="donnees-inscription"><?= json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?></script>

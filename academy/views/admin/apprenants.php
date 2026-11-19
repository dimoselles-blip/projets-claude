<?php defined('DTA') || exit; $moi = utilisateur(); ?>
<div class="admin-entete">
  <div><h1>Apprenants et équipe</h1><p>Les comptes apprenants sont créés automatiquement à l’inscription. Donnez l’accès à l’administration aux membres de l’équipe.</p></div>
</div>
<form class="filtres-admin" method="get" action="<?= e(url('/admin/apprenants')) ?>">
  <div class="champ"><label for="a-q">Recherche</label><input id="a-q" name="q" type="search" value="<?= e($q) ?>" placeholder="Nom, e-mail ou téléphone"></div>
  <button class="btn btn-bleu btn-petit" type="submit">Rechercher</button>
</form>
<section class="panneau">
  <div class="defilement">
    <table class="tableau tableau-cartes">
      <thead><tr><th>Compte</th><th>Inscriptions</th><th>Dernière connexion</th><th class="tableau-actions">Actions</th></tr></thead>
      <tbody>
        <?php foreach ($lignes as $l): ?>
          <tr>
            <td data-label="Compte"><strong><?= e($l['nom']) ?></strong><?= $l['role'] === 'admin' ? ' <span class="pastille pastille-ok">Équipe</span>' : '' ?><br><span class="muted"><?= e($l['email']) ?><?= $l['telephone'] ? ' · ' . e($l['telephone']) : '' ?></span>
              <?php if (!empty($liens[$l['id']])): ?><div class="lien-copie" style="margin-top:8px"><input readonly value="<?= e($liens[$l['id']]) ?>" aria-label="Lien de connexion"><button class="btn btn-fantome btn-petit" type="button" data-copier="<?= e($liens[$l['id']]) ?>">Copier</button></div><?php endif; ?>
            </td>
            <td data-label="Inscriptions"><a href="<?= e(url('/admin/inscriptions', ['q' => $l['email']])) ?>"><?= (int) $l['nb'] ?></a></td>
            <td data-label="Dernière connexion"><?= $l['derniere_connexion'] ? e(date_fr($l['derniere_connexion'], false, true)) : '<span class="muted">Jamais</span>' ?></td>
            <td class="tableau-actions">
              <form method="post" action="<?= e(url('/admin/apprenants/' . $l['id'] . '/lien')) ?>"><?= champ_csrf() ?><button class="btn-lien" type="submit">Lien de connexion</button></form>
              <?php if ((int) $l['id'] !== (int) $moi['id']): ?>
                <form method="post" action="<?= e(url('/admin/apprenants/' . $l['id'] . '/role')) ?>" data-confirmer="<?= $l['role'] === 'admin' ? 'Retirer l’accès à l’administration ?' : 'Donner accès à l’administration à ce compte ?' ?>"><?= champ_csrf() ?><input type="hidden" name="role" value="<?= $l['role'] === 'admin' ? 'apprenant' : 'admin' ?>"><button class="btn-lien" type="submit"><?= $l['role'] === 'admin' ? 'Retirer l’accès équipe' : 'Donner l’accès équipe' ?></button></form>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <p class="muted" style="font-size:.88rem;margin:14px 0 0">Pour ajouter un membre de l’équipe : il ou elle s’inscrit à une masterclass gratuite (ou vous lui créez une inscription), puis vous cliquez sur « Donner l’accès équipe ».</p>
</section>

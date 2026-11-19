<?php defined('DTA') || exit; ?><!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title><?= e($sujet) ?></title></head>
<body style="margin:0;padding:0;background:#F7F9FC;font-family:Arial,Helvetica,sans-serif;color:#12172A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#FFFFFF;border-radius:16px;border:1px solid #E4E9F2;">
      <tr><td style="padding:24px 28px 8px;"><img src="<?= e(url_absolue('/assets/img/logo-160.png')) ?>" alt="DIMO Tech Academy" width="92" height="80" style="display:block;border:0;"></td></tr>
      <tr><td style="padding:8px 28px 28px;font-size:15px;line-height:1.6;color:#12172A;"><?= $contenu ?></td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid #E4E9F2;font-size:12px;line-height:1.5;color:#5C6478;">
        DIMO Tech Academy — La Data et l’IA à votre portée…<br>
        <?= e(cfg('contact.adresse', 'Akpakpa, Cotonou (Bénin)')) ?> · <a href="<?= e(url_absolue('/')) ?>" style="color:#0057AD;"><?= e(parse_url(url_absolue('/'), PHP_URL_HOST)) ?></a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>

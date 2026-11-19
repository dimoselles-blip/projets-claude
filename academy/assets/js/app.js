/* DIMO Tech Academy — interactions (sans dépendance) */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function prix(n) {
    if (!n) return 'Gratuit';
    return n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' F CFA';
  }

  function csrf() {
    var c = $('input[name="_csrf"]');
    return c ? c.value : '';
  }

  /* ---------- Apparition au défilement ---------- */
  var aReveler = $$('[data-reveler]');
  aReveler.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('visible');
  });
  doc.classList.add('js');
  if ('IntersectionObserver' in window && !reduit) {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    aReveler.forEach(function (el) { if (!el.classList.contains('visible')) obs.observe(el); });
  } else {
    aReveler.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- En-tête ---------- */
  var entete = $('[data-entete]');
  if (entete) {
    var majEntete = function () { entete.classList.toggle('defile', window.scrollY > 8); };
    window.addEventListener('scroll', majEntete, { passive: true });
    majEntete();
  }

  /* ---------- Menu mobile ---------- */
  var menu = $('[data-menu]');
  var boutonMenu = $('[data-menu-ouvrir]');
  function fermerMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    document.body.classList.remove('menu-ouvert');
    boutonMenu.setAttribute('aria-expanded', 'false');
    boutonMenu.focus();
  }
  if (menu && boutonMenu) {
    boutonMenu.addEventListener('click', function () {
      menu.hidden = false;
      document.body.classList.add('menu-ouvert');
      boutonMenu.setAttribute('aria-expanded', 'true');
      var premier = $('a, button', menu);
      if (premier) premier.focus();
    });
    $('[data-menu-fermer]', menu).addEventListener('click', fermerMenu);
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) { menu.hidden = true; document.body.classList.remove('menu-ouvert'); boutonMenu.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerMenu(); });
  }

  /* ---------- Onglets ---------- */
  $$('[data-onglets]').forEach(function (bloc) {
    var onglets = $$('[role="tab"]', bloc);
    function activer(o, focus) {
      onglets.forEach(function (x) {
        var actif = x === o;
        x.setAttribute('aria-selected', actif ? 'true' : 'false');
        x.tabIndex = actif ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls'));
        if (p) {
          p.hidden = !actif;
          if (actif) $$('[data-reveler]', p).forEach(function (el) { el.classList.add('visible'); });
        }
      });
      if (focus) o.focus();
    }
    onglets.forEach(function (o, i) {
      o.addEventListener('click', function () { activer(o); });
      o.addEventListener('keydown', function (e) {
        var j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % onglets.length;
        if (e.key === 'ArrowLeft') j = (i - 1 + onglets.length) % onglets.length;
        if (e.key === 'Home') j = 0;
        if (e.key === 'End') j = onglets.length - 1;
        if (j !== null) { e.preventDefault(); activer(onglets[j], true); }
      });
    });
  });

  /* ---------- Mini-parcours « Trouvez votre formation » ---------- */
  $$('[data-quiz]').forEach(function (quiz) {
    var options = $$('[data-objectif]', quiz);
    options.forEach(function (b) {
      b.addEventListener('click', function () {
        options.forEach(function (x) {
          var actif = x === b;
          x.setAttribute('aria-pressed', actif ? 'true' : 'false');
          var r = document.getElementById(x.getAttribute('aria-controls'));
          if (r) r.hidden = !actif;
        });
        var res = document.getElementById(b.getAttribute('aria-controls'));
        if (res && window.innerWidth < 860) res.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'nearest' });
      });
    });
  });

  /* ---------- Fenêtre d'inscription ---------- */
  var modale = $('[data-modale-inscription]');
  var donnees = {};
  try { donnees = JSON.parse(($('#donnees-inscription') || {}).textContent || '{}'); } catch (e) { donnees = {}; }

  function majFormulaire(form, sessionVoulue) {
    var choix = $('[data-champ-formation]', form);
    var f = donnees[choix.value];
    var blocFormat = $('[data-bloc-format]', form);
    var selSession = $('[data-champ-session]', form);
    var aide = $('[data-aide-session]', form);
    var montant = $('[data-recap-montant]', form);
    var detail = $('[data-recap-detail]', form);
    var bouton = $('[data-bouton-inscription]', form);
    var titre = modale && modale.contains(form) ? $('[data-modale-titre]', modale) : null;

    if (!f) {
      blocFormat.hidden = true;
      montant.textContent = '—';
      detail.textContent = '';
      if (titre) titre.textContent = 'Je m’inscris';
      return;
    }
    if (titre) titre.textContent = f.titre;

    // Format au choix (prix en ligne éventuellement différent)
    blocFormat.hidden = !f.choixFormat;
    var pPres = $('[data-prix-format="presentiel"]', form);
    var pLigne = $('[data-prix-format="en_ligne"]', form);
    if (pPres) pPres.textContent = prix(f.prix);
    if (pLigne) pLigne.textContent = prix(f.prixEnLigne !== null ? f.prixEnLigne : f.prix);

    // Sessions ouvertes
    if (selSession && selSession.dataset.formation !== choix.value) {
      selSession.dataset.formation = choix.value;
      selSession.innerHTML = '';
      if (f.sessions.length) {
        f.sessions.forEach(function (s) {
          var o = document.createElement('option');
          o.value = s.id; o.textContent = s.libelle; o.dataset.format = s.format;
          selSession.appendChild(o);
        });
        var autre = document.createElement('option');
        autre.value = ''; autre.textContent = 'Une date ultérieure (me prévenir)';
        selSession.appendChild(autre);
        aide.textContent = '';
      } else {
        var o2 = document.createElement('option');
        o2.value = ''; o2.textContent = 'Prochaine session — dates à venir';
        selSession.appendChild(o2);
        aide.textContent = 'Les dates ne sont pas encore fixées : votre inscription vous réserve une place et nous vous prévenons dès l’ouverture.';
      }
    }
    if (sessionVoulue) selSession.value = String(sessionVoulue);

    // Une session en ligne ou en présentiel fixe le format
    var opt = selSession.options[selSession.selectedIndex];
    if (f.choixFormat && opt && opt.dataset.format && opt.dataset.format !== 'hybride') {
      var radio = $('input[name="format"][value="' + opt.dataset.format + '"]', form);
      if (radio) radio.checked = true;
    }

    var formatChoisi = ($('input[name="format"]:checked', form) || {}).value;
    var total = (formatChoisi === 'en_ligne' && f.prixEnLigne !== null) ? f.prixEnLigne : f.prix;
    if (f.choixFormat && !formatChoisi && f.prixEnLigne !== null && f.prixEnLigne !== f.prix) {
      montant.textContent = prix(Math.min(f.prix, f.prixEnLigne)) + ' – ' + prix(Math.max(f.prix, f.prixEnLigne)).replace(' F CFA', '') + ' F CFA';
    } else {
      montant.textContent = prix(total);
    }
    detail.textContent = total === 0 && f.prix === 0
      ? 'Aucun paiement : votre place est confirmée immédiatement.'
      : 'Mobile Money (MTN, Moov, Celtiis) · paiement en plusieurs tranches possible';
    bouton.textContent = f.prix === 0 && !f.prixEnLigne ? 'Réserver ma place' : 'Valider mon inscription';
  }

  function effacerErreurs(form) {
    $$('[data-erreur-pour]', form).forEach(function (el) { el.textContent = ''; });
    $$('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
    var g = $('[data-erreur-globale]', form) || $('[data-message-formulaire]', form);
    if (g) { g.hidden = true; g.textContent = ''; }
  }

  function afficherErreurs(form, erreurs) {
    var premier = null;
    Object.keys(erreurs).forEach(function (cle) {
      var cible = $('[data-erreur-pour="' + cle + '"]', form);
      var champ = form.elements[cle];
      if (cible) cible.textContent = erreurs[cle];
      if (champ && champ.setAttribute) { champ.setAttribute('aria-invalid', 'true'); premier = premier || champ; }
      if (!cible) {
        var g = $('[data-erreur-globale]', form) || $('[data-message-formulaire]', form);
        if (g) { g.hidden = false; g.className = 'alerte alerte-erreur'; g.textContent = erreurs[cle]; }
      }
    });
    if (premier && premier.focus) premier.focus();
  }

  function envoyer(form, bouton) {
    var texte = bouton ? bouton.textContent : '';
    if (bouton) { bouton.disabled = true; bouton.setAttribute('aria-busy', 'true'); bouton.textContent = 'Envoi…'; }
    return fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'X-Requested-With': 'fetch', 'Accept': 'application/json' },
      credentials: 'same-origin'
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, erreurs: { _: 'Une erreur est survenue. Réessayez.' } }; });
    }).catch(function () {
      return { ok: false, erreurs: { _: 'Connexion impossible. Vérifiez votre réseau puis réessayez.' } };
    }).then(function (rep) {
      if (bouton) { bouton.disabled = false; bouton.removeAttribute('aria-busy'); bouton.textContent = texte; }
      return rep;
    });
  }

  $$('[data-form-inscription]').forEach(function (form) {
    var choix = $('[data-champ-formation]', form);
    choix.addEventListener('change', function () { majFormulaire(form); });
    $('[data-champ-session]', form).addEventListener('change', function () { majFormulaire(form); });
    $$('input[name="format"]', form).forEach(function (r) { r.addEventListener('change', function () { majFormulaire(form); }); });
    if (choix.value) majFormulaire(form, ($('[data-champ-session]', form) || {}).value);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      effacerErreurs(form);
      var bouton = $('[data-bouton-inscription]', form);
      envoyer(form, bouton).then(function (rep) {
        if (rep.ok && rep.redirection) {
          bouton.disabled = true;
          bouton.textContent = 'Inscription enregistrée…';
          window.location.href = rep.redirection;
        } else {
          afficherErreurs(form, rep.erreurs || { _: 'Merci de vérifier le formulaire.' });
        }
      });
    });
  });

  function ouvrirInscription(slug, session) {
    var form = $('[data-form-inscription]', modale);
    var choix = $('[data-champ-formation]', form);
    effacerErreurs(form);
    choix.value = slug || '';
    var sel = $('[data-champ-session]', form);
    if (sel) sel.dataset.formation = '';
    majFormulaire(form, session);
    if (!modale.open) modale.showModal();
    var cible = slug ? form.elements.nom : choix;
    if (cible && !cible.value) cible.focus(); else if (cible) $('[data-modale-fermer]', modale).focus();
  }

  if (modale && typeof modale.showModal === 'function') {
    document.addEventListener('click', function (e) {
      var lien = e.target.closest('[data-inscription]');
      if (!lien || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      if (menu && !menu.hidden) { menu.hidden = true; document.body.classList.remove('menu-ouvert'); }
      ouvrirInscription(lien.getAttribute('data-inscription'), lien.getAttribute('data-session'));
    });
    $('[data-modale-fermer]', modale).addEventListener('click', function () { modale.close(); });
    modale.addEventListener('click', function (e) { if (e.target === modale) modale.close(); });
  }

  /* ---------- Formulaires simples en AJAX (liste d'attente, contact, devis) ---------- */
  $$('[data-form-ajax]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      effacerErreurs(form);
      var bouton = $('button[type="submit"]', form);
      envoyer(form, bouton).then(function (rep) {
        var zone = $('[data-message-formulaire]', form);
        if (rep.ok) {
          form.reset();
          if (zone) { zone.hidden = false; zone.className = 'alerte alerte-succes'; zone.textContent = rep.message; zone.focus && zone.setAttribute('tabindex', '-1'); zone.focus(); }
        } else {
          afficherErreurs(form, rep.erreurs || {});
        }
      });
    });
  });

  /* ---------- Filtres du catalogue : application immédiate ---------- */
  $$('[data-auto-submit]').forEach(function (form) {
    $$('select', form).forEach(function (s) { s.addEventListener('change', function () { form.submit(); }); });
  });

  /* ---------- Compteurs animés ---------- */
  var compteurs = $$('[data-compteur]');
  if (compteurs.length && 'IntersectionObserver' in window && !reduit) {
    var obsC = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        obsC.unobserve(e.target);
        var el = e.target, fin = parseInt(el.getAttribute('data-compteur'), 10) || 0, debut = null;
        function pas(t) {
          if (!debut) debut = t;
          var p = Math.min(1, (t - debut) / 1200);
          el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3))).toLocaleString('fr-FR');
          if (p < 1) requestAnimationFrame(pas);
        }
        requestAnimationFrame(pas);
      });
    }, { threshold: 0.4 });
    compteurs.forEach(function (c) { obsC.observe(c); });
  }

  /* ---------- Vidéos : chargées seulement au clic (économise les données mobiles) ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-video]');
    if (!b) return;
    var iframe = document.createElement('iframe');
    iframe.src = b.getAttribute('data-video') + (b.getAttribute('data-video').indexOf('?') > -1 ? '&' : '?') + 'autoplay=1';
    iframe.title = b.getAttribute('data-titre') || 'Vidéo';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    b.parentNode.replaceChild(iframe, b);
  });

  /* ---------- Progression : « Marquer comme terminé » ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-terminer]');
    if (!b) return;
    e.preventDefault();
    var fait = b.getAttribute('aria-pressed') === 'true';
    var corps = new FormData();
    corps.append('_csrf', csrf());
    corps.append('etat', fait ? '0' : '1');
    fetch(b.getAttribute('data-terminer'), { method: 'POST', body: corps, headers: { 'X-Requested-With': 'fetch', 'Accept': 'application/json' }, credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (rep) {
        if (!rep.ok) return;
        b.setAttribute('aria-pressed', fait ? 'false' : 'true');
        b.querySelector('span').textContent = fait ? 'Marquer comme terminé' : 'Terminé';
        var p = rep.progression;
        $$('[data-progression]').forEach(function (z) {
          var j = $('.jauge span', z); if (j) j.style.width = p.pourcentage + '%';
          var t = $('[data-progression-texte]', z); if (t) t.textContent = p.faites + ' / ' + p.total + ' contenus terminés';
          var pc = $('[data-progression-pourcentage]', z); if (pc) pc.textContent = p.pourcentage + ' %';
        });
      })
      .catch(function () {});
  });

  /* ---------- Copier dans le presse-papiers ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copier]');
    if (!b) return;
    var texte = b.getAttribute('data-copier');
    var fini = function () { var t = b.textContent; b.textContent = 'Copié !'; setTimeout(function () { b.textContent = t; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(texte).then(fini); else { window.prompt('Copiez ce lien :', texte); }
  });

  /* ---------- Notifications lues ---------- */
  var notifs = $('[data-notifs-lues]');
  if (notifs) {
    setTimeout(function () {
      var corps = new FormData(); corps.append('_csrf', csrf());
      fetch(notifs.getAttribute('data-notifs-lues'), { method: 'POST', body: corps, headers: { 'X-Requested-With': 'fetch', 'Accept': 'application/json' }, credentials: 'same-origin' });
    }, 2500);
  }

  /* ---------- Confirmation avant suppression (administration) ---------- */
  document.addEventListener('submit', function (e) {
    var msg = e.target.getAttribute('data-confirmer');
    if (msg && !window.confirm(msg)) e.preventDefault();
  });

  /* ---------- Consentement statistiques (Google Analytics, si configuré) ---------- */
  var bandeau = $('[data-consentement]');
  if (bandeau) {
    var choixGa = null;
    try { choixGa = localStorage.getItem('dta-stats'); } catch (e) {}
    var charger = function () {
      var id = bandeau.getAttribute('data-ga');
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', id, { anonymize_ip: true });
    };
    if (choixGa === 'oui') charger();
    else if (choixGa !== 'non') bandeau.hidden = false;
    $$('[data-consentement-choix]', bandeau).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-consentement-choix');
        try { localStorage.setItem('dta-stats', v); } catch (e) {}
        bandeau.hidden = true;
        if (v === 'oui') charger();
      });
    });
  }
})();

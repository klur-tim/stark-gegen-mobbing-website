/* Stark gegen Mobbing – main.js
   Scroll-Reveal (IntersectionObserver), Mobile-Navigation,
   Smooth-Scroll für Anker, Kontaktformular (mailto).
   Alles respektiert prefers-reduced-motion. */
(function () {
  'use strict';

  var html = document.documentElement;
  html.classList.add('js');

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Scroll-Reveal ----------
     Setzt .is-visible auf alle .reveal-Elemente, sobald sie in den Viewport kommen.
     Stagger über --i im Markup (z.B. style="--i:2"). Wird von späteren Sektionen wiederverwendet. */
  function initReveal() {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Mobile-Navigation ---------- */
  var burger = document.querySelector('.nav-burger');
  var panel = document.getElementById('nav-panel');

  function isMenuOpen() {
    return !!(burger && burger.getAttribute('aria-expanded') === 'true');
  }

  function setMenu(open) {
    if (!burger || !panel) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    panel.hidden = !open;
    html.classList.toggle('menu-open', open);
    if (open) {
      var first = panel.querySelector('a');
      if (first) first.focus();
    }
  }

  function initMenu() {
    if (!burger || !panel) return;

    burger.addEventListener('click', function () {
      setMenu(!isMenuOpen());
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && isMenuOpen()) {
        setMenu(false);
        burger.focus();
      }
    });

    document.addEventListener('click', function (ev) {
      if (!isMenuOpen()) return;
      if (panel.contains(ev.target) || burger.contains(ev.target)) return;
      setMenu(false);
    });

    var desktop = window.matchMedia('(min-width: 900px)');
    var onChange = function (e) { if (e.matches && isMenuOpen()) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else desktop.addListener(onChange);
  }

  /* ---------- Smooth-Scroll für Anker ----------
     Schließt das Mobile-Menü, scrollt zum Ziel und setzt den Fokus dorthin (Tastatur/Screenreader). */
  function initAnchors() {
    document.addEventListener('click', function (ev) {
      var link = ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var id = link.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;

      ev.preventDefault();
      setMenu(false);

      target.scrollIntoView({
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
        block: 'start'
      });

      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });

      if (history.pushState) history.pushState(null, '', '#' + id);
    });
  }

  /* ---------- Kontaktformular (ohne Backend) ----------
     Baut beim Absenden aus den Feldern einen mailto-Link an info@starkgegenmobbing.de
     mit Betreff und Text und öffnet ihn. Die HTML5-Validierung (required, type="email")
     läuft vorher im Browser; das submit-Event feuert erst bei gültigen Feldern.
     Sobald ein Formular-Endpoint (Formspree, Netlify Forms) eingetragen ist: diese Funktion
     nicht mehr aufrufen, dann sendet das action-Attribut. */
  var CONTACT_TO = 'info@starkgegenmobbing.de';

  function fieldValue(form, name) {
    var el = form.elements[name];
    return el ? String(el.value || '').trim() : '';
  }

  function buildMailto(form) {
    var name = fieldValue(form, 'name');
    var email = fieldValue(form, 'email');
    var topic = fieldValue(form, 'topic') || 'Allgemeine Frage';
    var message = fieldValue(form, 'message');
    var consent = form.elements.consent && form.elements.consent.checked;

    var subject = 'Anfrage: ' + topic + ' (' + name + ')';
    var lines = [
      'Name: ' + name,
      'E-Mail: ' + email,
      'Interesse: ' + topic,
      '',
      'Nachricht:',
      message
    ];
    if (consent) {
      lines.push('', 'Einwilligung: Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage verarbeitet werden.');
    }
    return 'mailto:' + CONTACT_TO +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
  }

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    var hint = document.getElementById('cf-hint');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var href = buildMailto(form);

      if (hint) {
        hint.textContent = 'Dein E-Mail-Programm öffnet sich mit der fertigen Nachricht. Falls nicht, schreib direkt an ' + CONTACT_TO + '.';
      }
      window.location.href = href;
    });
  }

  initMenu();
  initAnchors();
  initContactForm();
  initReveal();
})();

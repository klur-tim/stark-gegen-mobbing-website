/* ==========================================================================
   Stark gegen Mobbing – site.js (auf jeder öffentlichen Seite, nach main.js)
   1. Scroll-Uhr für die Illustrationen: .scene (in Ebenen zerlegt) und .solo (Einzelmotiv).
      --a/--sa = Abstand zur Viewport-Mitte (0 = mittig = Originalbild). Steht die Seite, steht die Bildwelt.
   2. index.html?texte=neu zeigt die überarbeiteten Texte (Tabelle: texte-neu.js), mit Knopf zum Zurückschalten.
   ========================================================================== */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1 · Scroll-Uhr ---------- */
  var scenes = [].slice.call(document.querySelectorAll('.scene')).map(function (el) { return { el: el, a: 0, r: 0 }; });
  var solos = [].slice.call(document.querySelectorAll('.solo')).map(function (el) { return { el: el, a: 0, r: 0 }; });
  var ease = function (x) { return 1 - Math.pow(1 - x, 1.9); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var running = false, idle = 0;

  function progress(el) {
    var r = el.getBoundingClientRect(), vh = innerHeight;
    if (!r.height) return 0;
    var d = ((r.top + r.height / 2) - vh / 2) / ((vh + r.height) / 2);
    return Math.max(-1, Math.min(1, d));
  }
  function drive(list, pa, pr, k) {
    var moved = false;
    list.forEach(function (s) {
      var p = progress(s.el), ta = ease(Math.min(1, Math.abs(p)));
      s.a = lerp(s.a, ta, k * 1.5); s.r = lerp(s.r, p, k * 1.5);
      if (Math.abs(s.a - ta) > 0.0015 || Math.abs(s.r - p) > 0.0015) moved = true;
      s.el.style.setProperty(pa, s.a.toFixed(4));
      s.el.style.setProperty(pr, s.r.toFixed(4));
    });
    return moved;
  }
  function step(k) {
    var a = drive(scenes, '--a', '--r', k);
    var b = drive(solos, '--sa', '--sr', k);
    return a || b;
  }
  function frame() {
    idle = step(0.12) ? 0 : idle + 1;
    if (idle < 20) requestAnimationFrame(frame); else running = false;
  }
  function kick() {
    if (reduce || (!scenes.length && !solos.length)) return;
    step(0.34);
    if (!running) { running = true; idle = 0; requestAnimationFrame(frame); }
  }
  window.__scrollStep = step; // Prüf-Haken
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick, { passive: true });
  kick();

  /* ---------- 2 · Überarbeitete Texte (nur mit ?texte=neu) ---------- */
  if (!/[?&]texte=neu\b/.test(location.search)) return;
  function load(src, done) {
    var s = document.createElement('script');
    s.src = src; s.onload = done; document.body.appendChild(s);
  }
  load('magic-copy.js', function () {
    load('texte-neu.js', function () {
      if (!window.MagicCopy || !window.SGM_TEXTE) return;
      MagicCopy.init({
        mount: document.body,
        accent: '#1B1513', ink: '#8E1F13', paper: '#FBF3EC',   // Buttons in Tinte, nie Rot
        label: 'Überarbeitete Texte', labelOn: 'Originaltexte',
        hint: 'Zwischen Original und Überarbeitung wechseln',
        hotkey: false, remember: false, button: true,
        variants: window.SGM_TEXTE
      });
      MagicCopy.set(true, { instant: true });
      // Alt+M über die physische Taste: auf dem Mac liefert Alt+M 'µ', nicht 'm'
      document.addEventListener('keydown', function (e) {
        if (e.altKey && !e.metaKey && !e.ctrlKey && e.code === 'KeyM') { e.preventDefault(); MagicCopy.toggle(); }
      });
    });
  });
})();

/* magic-copy.js — a toggle that swaps every line on a page for its rewritten version.
 *
 * Zero dependencies, one file, works on any static page.
 *
 *   MagicCopy.init({
 *     variants: {
 *       '.hero h1':      'Everyone uses AI. Almost nobody is good at it.',
 *       '.hero .lede':   { html: 'Five minutes a day. <b>Real</b> problems.' },
 *       '.hero h1@after':{ after: '<p class="lede">A line that only exists in the rewrite.</p>' }
 *     }
 *   })
 *
 * A key is a CSS selector. Anything after '@' is ignored, so you can register two
 * different operations against the same element. Value forms:
 *
 *   'string'          replace textContent
 *   { text }          same, explicit
 *   { html }          replace innerHTML
 *   { attr: {…} }     set attributes (aria-label, title, alt, placeholder …)
 *   { after }         insert HTML after the element; removed again on toggle off
 *
 * Originals are captured lazily on first swap, so toggling back is exact — the tool
 * never needs to know what the page said before it loaded.
 */
(function (root) {
  'use strict';

  var DEFAULTS = {
    variants: {},
    label: 'Magic copy',
    labelOn: 'Original copy',
    hint: 'Rewrite every line on this page',
    accent: '#E2643C',
    ink: '#1E2D4D',
    paper: '#FBF7EF',
    position: 'bottom-right',   // bottom-right | bottom-left | bottom-center
    stagger: 45,                // ms between elements, top of page first
    hotkey: 'm',                // with Alt
    remember: true,             // survive a reload within the tab
    mount: document.body,
    button: true                // false = no UI, drive it with MagicCopy.toggle()
  };

  var CSS = [
    '.mc-btn{position:fixed;z-index:9999;display:inline-flex;align-items:center;gap:9px;',
    'border:0;cursor:pointer;font:800 14px/1 var(--mc-font,inherit);letter-spacing:.2px;',
    'padding:14px 20px;border-radius:999px;color:#fff;background:var(--mc-accent);',
    'box-shadow:0 4px 0 var(--mc-shade),0 10px 26px rgba(30,45,77,.22);',
    'transition:transform .16s cubic-bezier(.2,.8,.2,1),box-shadow .16s,filter .16s}',
    '.mc-btn:hover{filter:brightness(1.06);transform:translateY(-2px);',
    'box-shadow:0 6px 0 var(--mc-shade),0 14px 30px rgba(30,45,77,.26)}',
    '.mc-btn:active{transform:translateY(4px);box-shadow:0 0 0 var(--mc-shade);transition-duration:0s}',
    '.mc-btn:focus-visible{outline:3px solid var(--mc-ink);outline-offset:3px}',
    '.mc-btn[aria-pressed="true"]{background:var(--mc-ink);--mc-shade:rgba(0,0,0,.35)}',
    '.mc-btn .mc-spark{width:17px;height:17px;flex:none}',
    '.mc-btn .mc-spark path{transform-origin:12px 12px}',
    '.mc-btn[aria-pressed="true"] .mc-spark{animation:mc-spin 9s linear infinite}',
    '@keyframes mc-spin{to{rotate:360deg}}',
    '.mc-hint{position:fixed;z-index:9998;font:700 12px/1.4 var(--mc-font,inherit);',
    'color:var(--mc-ink);background:var(--mc-paper);border:2px solid var(--mc-ink);',
    'padding:7px 11px;border-radius:10px;opacity:0;translate:0 6px;pointer-events:none;',
    'transition:opacity .2s,translate .2s;box-shadow:0 3px 0 rgba(30,45,77,.18)}',
    '.mc-btn:hover+.mc-hint,.mc-btn:focus-visible+.mc-hint{opacity:1;translate:0 0}',
    '.mc-swap{transition:opacity .22s ease,filter .22s ease,translate .22s ease}',
    '.mc-swap-out{opacity:0;filter:blur(3px);translate:0 -5px}',
    '.mc-swap-in{opacity:0;filter:blur(3px);translate:0 5px}',
    '.mc-added{animation:mc-drop .34s cubic-bezier(.2,.8,.2,1) both}',
    '@keyframes mc-drop{from{opacity:0;translate:0 -8px}to{opacity:1;translate:0 0}}',
    '@media(prefers-reduced-motion:reduce){',
    '.mc-swap,.mc-btn,.mc-hint{transition-duration:.01ms!important}',
    '.mc-added,.mc-btn[aria-pressed="true"] .mc-spark{animation:none!important}}'
  ].join('');

  var SPARK = '<svg class="mc-spark" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">' +
    '<path d="M12 2l1.9 5.6L19.5 9l-5.6 1.9L12 16.5l-1.9-5.6L4.5 9l5.6-1.4L12 2z"/>' +
    '<path d="M18.5 15l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" opacity=".65"/></svg>';

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  }

  function MagicCopy() {
    this.on = false;
    this.entries = [];
    this.opts = null;
  }

  MagicCopy.prototype.init = function (options) {
    var o = this.opts = Object.assign({}, DEFAULTS, options || {});

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // Resolve every selector once. A selector matching nothing is a silent no-op in
    // production but loud in the console, because a typo'd selector is the whole bug.
    var self = this;
    Object.keys(o.variants).forEach(function (key) {
      var sel = key.split('@')[0].trim();
      var nodes = document.querySelectorAll(sel);
      if (!nodes.length) {
        console.warn('[magic-copy] selector matched nothing:', sel);
        return;
      }
      var spec = o.variants[key];
      if (typeof spec === 'string') spec = { text: spec };
      nodes.forEach(function (node) {
        self.entries.push({ node: node, spec: spec, original: null, added: null });
      });
    });

    // Top of the document first, so the rewrite reads as a wave down the page.
    this.entries.sort(function (a, b) {
      var pos = a.node.compareDocumentPosition(b.node);
      return (pos & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
    });

    if (o.button) this._mountButton();

    if (o.hotkey) {
      document.addEventListener('keydown', function (e) {
        if (e.altKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === o.hotkey) {
          e.preventDefault();
          self.toggle();
        }
      });
    }

    if (o.remember && sessionStorage.getItem('magic-copy') === 'on') {
      this.set(true, { instant: true });
    }
    return this;
  };

  MagicCopy.prototype._mountButton = function () {
    var o = this.opts, self = this;
    var side = o.position === 'bottom-left' ? 'left:24px;'
      : o.position === 'bottom-center' ? 'left:50%;translate:-50% 0;' : 'right:24px;';

    var btn = el('<button class="mc-btn" type="button" aria-pressed="false"></button>');
    btn.innerHTML = SPARK + '<span class="mc-label"></span>';
    btn.style.cssText = 'bottom:24px;' + side +
      '--mc-accent:' + o.accent + ';--mc-ink:' + o.ink + ';--mc-paper:' + o.paper + ';' +
      '--mc-shade:rgba(0,0,0,.22);';

    var hint = el('<div class="mc-hint"></div>');
    hint.textContent = o.hint + (o.hotkey ? '  (alt+' + o.hotkey + ')' : '');
    hint.style.cssText = 'bottom:78px;' + side +
      '--mc-ink:' + o.ink + ';--mc-paper:' + o.paper + ';';

    var live = el('<div class="mc-live" role="status" aria-live="polite"></div>');
    live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)';

    btn.addEventListener('click', function () { self.toggle(); });
    o.mount.appendChild(btn);
    o.mount.appendChild(hint);
    o.mount.appendChild(live);

    this.btn = btn;
    this.live = live;
    this.labelEl = btn.querySelector('.mc-label');
    this._paint();
  };

  MagicCopy.prototype._paint = function () {
    if (!this.btn) return;
    this.btn.setAttribute('aria-pressed', String(this.on));
    this.labelEl.textContent = this.on ? this.opts.labelOn : this.opts.label;
    this.live.textContent = this.on
      ? 'Rewritten copy applied to ' + this.entries.length + ' places on the page.'
      : 'Original copy restored.';
  };

  MagicCopy.prototype.toggle = function () { return this.set(!this.on); };

  MagicCopy.prototype.set = function (on, cfg) {
    cfg = cfg || {};
    if (on === this.on) return this;
    this.on = on;
    var self = this, step = cfg.instant ? 0 : this.opts.stagger;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.entries.forEach(function (e, i) {
      var delay = (cfg.instant || reduce) ? 0 : i * step;
      setTimeout(function () { self._apply(e, on, cfg.instant || reduce); }, delay);
    });

    if (this.opts.remember) sessionStorage.setItem('magic-copy', on ? 'on' : 'off');
    this._paint();
    return this;
  };

  MagicCopy.prototype._apply = function (e, on, instant) {
    var node = e.node, spec = e.spec;

    // Capture the page as it shipped, once, the first time we touch it.
    if (e.original === null) {
      e.original = { html: node.innerHTML, attr: {} };
      if (spec.attr) Object.keys(spec.attr).forEach(function (k) {
        e.original.attr[k] = node.getAttribute(k);
      });
    }

    var write = function () {
      if (spec.attr) {
        Object.keys(spec.attr).forEach(function (k) {
          var v = on ? spec.attr[k] : e.original.attr[k];
          if (v === null) node.removeAttribute(k); else node.setAttribute(k, v);
        });
      }
      if (spec.html !== undefined) node.innerHTML = on ? spec.html : e.original.html;
      else if (spec.text !== undefined) {
        if (on) node.textContent = spec.text;
        else node.innerHTML = e.original.html;
      }
      if (spec.after !== undefined) {
        if (on && !e.added) {
          e.added = el(spec.after);
          e.added.classList.add('mc-added');
          node.insertAdjacentElement('afterend', e.added);
        } else if (!on && e.added) {
          e.added.remove();
          e.added = null;
        }
      }
    };

    // Nothing textual changed? Skip the flicker entirely.
    if (spec.html === undefined && spec.text === undefined) return write();

    if (instant) return write();

    // A rapid double-toggle must not let an older cross-fade finish on top of a newer one.
    var token = (e.token = (e.token || 0) + 1);
    var done = function () {
      if (e.token !== token) return;
      node.classList.remove('mc-swap', 'mc-swap-out', 'mc-swap-in');
    };

    node.classList.add('mc-swap', 'mc-swap-out');
    setTimeout(function () {
      if (e.token !== token) return;
      write();
      node.classList.remove('mc-swap-out');
      node.classList.add('mc-swap-in');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (e.token === token) node.classList.remove('mc-swap-in');
        });
      });
      // rAF is paused in a background tab, so the two lines above can never run there and
      // the text would sit at opacity 0 forever. setTimeout is throttled but still fires.
      // The class also has to come off entirely: .mc-swap animates `translate`, which is
      // the same property the page's own scroll reveals use.
      setTimeout(done, 300);
    }, 220);
  };

  root.MagicCopy = new MagicCopy();
})(window);


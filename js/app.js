/* ELORA ELEGANCE COLLECTIVE — site behaviour (no libraries). */
(function () {
  'use strict';

  var IG = 'https://www.instagram.com/eloraluxecollection/';
  var HANDLE = '@eloraluxecollection';
  var PRODUCTS = (window.ELORA_PRODUCTS || []).slice();
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeIO = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var CATS = [];
  PRODUCTS.forEach(function (p) { if (CATS.indexOf(p.category) < 0) CATS.push(p.category); });

  /* ---------------------------------------------------------------- helpers */
  function title(p) { return (p.brand ? p.brand + ' ' : '') + p.name; }
  function imgTag(im, alt, sizes, eager) {
    var h = Math.round(im.sw * im.h / im.w);
    return '<img src="' + im.sm + '" srcset="' + im.sm + ' ' + im.sw + 'w, ' + im.lg + ' ' + im.w + 'w" sizes="' + sizes + '" alt="' + esc(alt) + '" width="' + im.sw + '" height="' + h + '"' + (eager ? '' : ' loading="lazy"') + ' decoding="async">';
  }
  function priceText(p) { return p.price ? p.price : 'ASK FOR PRICE'; }
  var igIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/></svg>';

  function cardHTML(p, o) {
    o = o || {};
    var sizes = o.feat ? '(min-width:1180px) 46vw,(min-width:760px) 62vw,92vw' : (o.small ? '(min-width:760px) 22vw,46vw' : '(min-width:1180px) 23vw,(min-width:760px) 31vw,46vw');
    var multi = p.images.length > 1 ? '<span class="card-count" aria-hidden="true">' + p.images.length + ' photos</span>' : '';
    return '<article class="card' + (o.feat ? ' feat' : '') + '" style="--d:' + (o.d || 0) + '">' +
      '<a class="card-open" href="#/piece/' + p.id + '" data-open="' + p.id + '">' +
      '<div class="card-media">' + (p.newArrival ? '<span class="badge">NEW</span>' : '') + multi +
      imgTag(p.images[0], title(p) + ' — ' + p.category, sizes, o.eager) + '</div>' +
      '<div class="card-info"><span class="card-brand">' + esc(p.brand || '') + '</span>' +
      '<h3 class="card-name">' + esc(p.name) + '</h3>' +
      '<span class="card-cat">' + esc(p.category) + ' · ' + esc(priceText(p).toLowerCase() === 'ask for price' ? 'Ask for price' : p.price) + '</span></div></a>' +
      (o.noCta ? '' : '<div class="card-cta"><a href="' + IG + '" target="_blank" rel="noopener" aria-label="Ask for the price of ' + esc(title(p)) + ' on Instagram">ASK FOR PRICE</a></div>') +
      '</article>';
  }

  /* ---------------------------------------------------------------- search engine */
  var SYN = {
    jewellery: 'jewelry', jewelery: 'jewelry', handbag: 'bag', purse: 'bag', tote: 'bag', shoe: 'shoe', sneaker: 'shoe', trainer: 'shoe',
    heel: 'sandal', heels: 'sandal', slide: 'sandal', mule: 'sandal', slingback: 'sandal', timepiece: 'watch', cardholder: 'card'
  };
  function norm(w) { w = w.toLowerCase().replace(/[^a-z0-9&]/g, ''); if (SYN[w]) w = SYN[w]; if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) w = w.replace(/e?s$/, ''); return w; }
  function words(s) { return String(s).toLowerCase().split(/[^a-z0-9&]+/).filter(Boolean).map(norm); }
  PRODUCTS.forEach(function (p) {
    p._nameW = words(p.name + ' ' + p.brand);
    p._allW = words([p.name, p.brand, p.category, p.keywords, p.description].join(' '));
  });
  function search(q) {
    var toks = words(q);
    if (!toks.length) return PRODUCTS.slice();
    var out = [];
    PRODUCTS.forEach(function (p) {
      var score = 0, ok = toks.every(function (t) {
        var inName = p._nameW.some(function (w) { return w.indexOf(t) === 0; });
        var inAll = inName || p._allW.some(function (w) { return w.indexOf(t) === 0; });
        if (inName) score += 3; else if (inAll) score += 1;
        return inAll;
      });
      if (ok) out.push({ p: p, s: score });
    });
    out.sort(function (a, b) { return b.s - a.s; });
    return out.map(function (x) { return x.p; });
  }

  /* ---------------------------------------------------------------- collection grid */
  var state = { cat: 'All', q: '' };
  var grid = $('#grid'), filtersEl = $('#filters'), countEl = $('#count'), emptyEl = $('#empty'), inlineInput = $('#inlineSearchInput');

  function interleave(list) {
    var groups = {}, order = [];
    list.forEach(function (p) { if (!groups[p.category]) { groups[p.category] = []; order.push(p.category); } groups[p.category].push(p); });
    var out = [], more = true, i = 0;
    while (more) { more = false; order.forEach(function (c) { if (groups[c][i]) { out.push(groups[c][i]); more = true; } }); i++; }
    return out;
  }
  function renderFilters() {
    var labels = ['All'].concat(CATS);
    filtersEl.innerHTML = labels.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + esc(c) + '" aria-pressed="' + (state.cat === c) + '">' + esc(c) + '</button>';
    }).join('');
  }
  function renderGrid() {
    var list = search(state.q).filter(function (p) { return state.cat === 'All' || p.category === state.cat; });
    var all = state.cat === 'All' && !state.q;
    if (all) list = interleave(list);
    grid.classList.toggle('is-all', all);
    grid.innerHTML = list.map(function (p, i) { return cardHTML(p, { d: Math.min(i, 14), feat: all && p.featured, eager: false }); }).join('');
    grid.classList.remove('swap'); void grid.offsetWidth; grid.classList.add('swap');
    refreshCards();
    emptyEl.hidden = list.length > 0;
    var label = state.cat === 'All' ? 'the collection' : state.cat.toLowerCase();
    countEl.textContent = list.length ? 'Showing ' + list.length + (list.length === 1 ? ' piece' : ' pieces') + ' from ' + label + (state.q ? ' for “' + state.q + '”' : '') : '';
    $$('.chip', filtersEl).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-cat') === state.cat)); });
  }
  function setCategory(c, scroll) {
    state.cat = c; state.q = ''; inlineInput.value = ''; renderGrid();
    if (scroll) { var t = $('#collection'); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 0, behavior: reduced ? 'auto' : 'smooth' }); }
  }
  filtersEl.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) { state.cat = b.getAttribute('data-cat'); renderGrid(); } });
  inlineInput.addEventListener('input', function () { state.q = inlineInput.value.trim(); renderGrid(); });
  $('#inlineSearch').addEventListener('submit', function (e) { e.preventDefault(); inlineInput.blur(); });

  /* new arrivals rail */
  var rail = $('#rail');
  var arrivals = PRODUCTS.filter(function (p) { return p.newArrival; });
  if (arrivals.length) {
    rail.innerHTML = arrivals.map(function (p) { return cardHTML(p, { small: true }); }).join('');
    var step = function (dir) { rail.scrollBy({ left: dir * rail.clientWidth * .8, behavior: reduced ? 'auto' : 'smooth' }); };
    $('#railPrev').addEventListener('click', function () { step(-1); });
    $('#railNext').addEventListener('click', function () { step(1); });
  } else { $('#new-arrivals').hidden = true; $$('a[href="#new-arrivals"]').forEach(function (a) { a.hidden = true; }); }

  /* open product from any card link */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-open]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    var inSearch = a.closest('#search');
    if (inSearch) closeSearch(true);
    openProduct(a.getAttribute('data-open'));
  });

  renderFilters(); renderGrid();

  /* ---------------------------------------------------------------- product modal */
  var modal = $('#modal'), panel = $('#modalPanel'), modalOpen = false, cur = null, idx = 0, lastFocus = null;
  var pImg = $('#pImg'), pMain = $('#pMain'), pThumbs = $('#pThumbs'), pPrev = $('#pPrev'), pNext = $('#pNext');

  function lockScroll(on) { document.body.classList.toggle('no-scroll', on); }
  function setPhoto(i) {
    var p = cur; if (!p) return;
    idx = (i + p.images.length) % p.images.length;
    var im = p.images[idx];
    pMain.classList.remove('zoom');
    pImg.style.opacity = .0;
    var next = new Image();
    next.onload = next.onerror = function () { pImg.src = im.lg; pImg.width = im.w; pImg.height = im.h; pImg.alt = title(p) + ' — photo ' + (idx + 1) + ' of ' + p.images.length; pImg.style.opacity = 1; };
    next.src = im.lg;
    $$('button', pThumbs).forEach(function (b, k) { b.setAttribute('aria-current', String(k === idx)); });
  }
  function showProduct(p) {
    cur = p; idx = 0;
    $('#pCat').textContent = p.category;
    $('#pTitle').textContent = p.name;
    $('#pBrand').textContent = p.brand ? p.brand : '';
    $('#pBrand').hidden = !p.brand;
    $('#pPrice').textContent = priceText(p);
    $('#pDesc').textContent = p.description;
    $('#pDetails').innerHTML = '<dt>Category</dt><dd>' + esc(p.category) + '</dd>' +
      (p.brand ? '<dt>Brand shown</dt><dd>' + esc(p.brand) + '</dd>' : '') +
      '<dt>Photos</dt><dd>' + p.images.length + '</dd>' +
      '<dt>Availability</dt><dd>Message us on Instagram to confirm</dd>';
    pThumbs.innerHTML = p.images.map(function (im, k) { return '<button type="button" aria-label="Show photo ' + (k + 1) + '"><img src="' + im.sm + '" alt="" width="64" height="64" loading="lazy"></button>'; }).join('');
    pThumbs.hidden = pPrev.hidden = pNext.hidden = p.images.length < 2;
    var more = PRODUCTS.filter(function (x) { return x.category === p.category && x.id !== p.id; }).slice(0, 4);
    $('#pMore').innerHTML = more.length ? '<h3>More in ' + esc(p.category) + '</h3><div class="row">' + more.map(function (x) { return cardHTML(x, { small: true, noCta: true }); }).join('') + '</div>' : '';
    setPhoto(0);
    document.title = title(p) + ' | ELORA ELEGANCE COLLECTIVE';
    if (!modalOpen) { modalOpen = true; modal.hidden = false; lockScroll(true); panel.scrollTop = 0; modal.scrollTop = 0; setTimeout(function () { $('.modal-close', modal).focus(); }, 30); }
    else { modal.scrollTop = 0; }
  }
  function hideModal() {
    if (!modalOpen) return;
    modalOpen = false; modal.hidden = true; cur = null; lockScroll(false);
    document.title = 'ELORA ELEGANCE COLLECTIVE | Luxury Fashion & Accessories';
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) { }
  }
  function openProduct(id) {
    if (!byId[id]) return;
    if (!modalOpen) { lastFocus = document.activeElement; history.pushState({ m: 1 }, '', '#/piece/' + id); }
    else history.replaceState({ m: 1 }, '', '#/piece/' + id);
    showProduct(byId[id]);
  }
  function closeProduct() {
    if (!modalOpen) return;
    if (history.state && history.state.m) history.back();
    else { hideModal(); history.replaceState(null, '', location.pathname + location.search); }
  }
  function routeFromHash() {
    var m = location.hash.match(/^#\/piece\/([\w-]+)/);
    if (m && byId[m[1]]) showProduct(byId[m[1]]); else if (modalOpen) hideModal();
  }
  window.addEventListener('popstate', routeFromHash);
  $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', closeProduct); });
  pPrev.addEventListener('click', function () { setPhoto(idx - 1); });
  pNext.addEventListener('click', function () { setPhoto(idx + 1); });
  pThumbs.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setPhoto($$('button', pThumbs).indexOf(b)); });
  // swipe + zoom
  var sx = null;
  pMain.addEventListener('pointerdown', function (e) { sx = e.clientX; });
  pMain.addEventListener('pointerup', function (e) {
    if (sx === null) return; var dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 45 && cur && cur.images.length > 1) { setPhoto(idx + (dx < 0 ? 1 : -1)); return; }
    if (e.pointerType === 'mouse' && window.innerWidth > 860) {
      var r = pMain.getBoundingClientRect();
      pMain.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%');
      pMain.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%');
      pMain.classList.toggle('zoom');
    }
  });
  pMain.addEventListener('pointermove', function (e) {
    if (!pMain.classList.contains('zoom') || e.pointerType !== 'mouse') return;
    var r = pMain.getBoundingClientRect();
    pMain.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%');
    pMain.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%');
  });
  $('#pCopy').addEventListener('click', function () {
    if (!cur) return;
    copyText('Hello ELORA! I’m interested in: ' + title(cur) + ' (' + cur.category + '). Could you share the price and availability?');
  });
  var toastT;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 3200); }
  function copyText(txt) {
    var done = function () { toast('Copied. Paste it into your Instagram message.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed. Please type the piece name in your message.'); }
      document.body.removeChild(ta);
    }
  }

  /* focus trap helper */
  function trap(container, e) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href],button:not([disabled]),input,textarea,[tabindex]:not([tabindex="-1"])', container).filter(function (n) { return n.offsetParent !== null && !n.hidden; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  modal.addEventListener('keydown', function (e) { trap(panel, e); });

  /* ---------------------------------------------------------------- search overlay */
  var searchEl = $('#search'), searchInput = $('#searchInput'), searchRes = $('#searchResults'), searchChips = $('#searchChips'), searchFocus = null;
  searchChips.innerHTML = CATS.map(function (c) { return '<button type="button" class="chip" data-q="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
  function renderSearch() {
    var q = searchInput.value.trim();
    var list = q ? search(q) : PRODUCTS.filter(function (p) { return p.featured || p.newArrival; });
    if (!list.length) { searchRes.innerHTML = '<p class="none">No pieces found. Try another search.</p>'; return; }
    searchRes.innerHTML = list.slice(0, 16).map(function (p) { return cardHTML(p, { small: true, noCta: true }); }).join('');
  }
  function openSearch() { searchFocus = document.activeElement; searchEl.hidden = false; lockScroll(true); renderSearch(); setTimeout(function () { searchInput.focus(); }, 30); }
  function closeSearch(keepLock) { if (searchEl.hidden) return; searchEl.hidden = true; if (!keepLock) lockScroll(false); if (!keepLock && searchFocus && searchFocus.focus) searchFocus.focus(); }
  $('#searchOpen').addEventListener('click', openSearch);
  $('#searchClose').addEventListener('click', function () { closeSearch(); });
  searchInput.addEventListener('input', renderSearch);
  searchChips.addEventListener('click', function (e) { var b = e.target.closest('[data-q]'); if (b) { searchInput.value = b.getAttribute('data-q'); renderSearch(); searchInput.focus(); } });
  $('#searchForm').addEventListener('submit', function (e) {
    e.preventDefault(); var q = searchInput.value.trim(); if (!q) return;
    state.cat = 'All'; state.q = q; inlineInput.value = q; renderGrid(); closeSearch(); scrollToEl('#collection');
  });
  searchEl.addEventListener('keydown', function (e) { trap(searchEl, e); });
  function scrollToEl(sel) { var t = $(sel); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY, behavior: reduced ? 'auto' : 'smooth' }); }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!searchEl.hidden) closeSearch();
      else if (modalOpen) closeProduct();
      else if (!chatEl.hidden) closeChat();
      else if (menu.classList.contains('open')) toggleMenu(false);
    } else if (modalOpen && cur && cur.images.length > 1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      setPhoto(idx + (e.key === 'ArrowRight' ? 1 : -1));
    } else if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && searchEl.hidden && !modalOpen) { e.preventDefault(); openSearch(); }
  });

  /* ---------------------------------------------------------------- mobile menu */
  var menu = $('#menu'), burger = $('#burger');
  function toggleMenu(open) {
    menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); lockScroll(open);
    if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
  }
  menu.setAttribute('inert', '');
  burger.addEventListener('click', function () { toggleMenu(!menu.classList.contains('open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });

  /* ---------------------------------------------------------------- Elora Assistant */
  var chatEl = $('#chat'), chatLog = $('#chatLog'), chatQuick = $('#chatQuick'), chatForm = $('#chatForm'), chatInput = $('#chatInput'), launch = $('#chatLaunch'), greeted = false;
  function openChat() {
    chatEl.hidden = false; launch.setAttribute('aria-expanded', 'true');
    if (!greeted) { greeted = true; botSay('Welcome to ELORA ELEGANCE COLLECTIVE ✨\nHow can I help you today?', [], true); }
    setTimeout(function () { chatInput.focus(); }, 40);
  }
  function closeChat() { chatEl.hidden = true; launch.setAttribute('aria-expanded', 'false'); launch.focus(); }
  launch.addEventListener('click', openChat);
  $('#chatClose').addEventListener('click', closeChat);
  chatEl.addEventListener('keydown', function (e) { trap(chatEl, e); });

  var QUICK = ['What do you sell?', 'How do I order?', 'Ask for a price', 'New arrivals', 'Talk to someone'];
  chatQuick.innerHTML = QUICK.map(function (q) { return '<button type="button" class="chip">' + esc(q) + '</button>'; }).join('');
  chatQuick.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) userSay(b.textContent); });

  function scrollChat() { chatLog.scrollTop = chatLog.scrollHeight; }
  function addMsg(text, cls) { var d = document.createElement('div'); d.className = 'msg ' + cls; d.textContent = text; chatLog.appendChild(d); scrollChat(); return d; }
  function addActions(actions) {
    if (!actions || !actions.length) return;
    var w = document.createElement('div'); w.className = 'msg-actions';
    actions.forEach(function (a) {
      var el;
      if (a.t === 'ig') { el = document.createElement('a'); el.href = IG; el.target = '_blank'; el.rel = 'noopener'; el.className = 'btn btn-primary'; el.textContent = a.label; }
      else {
        el = document.createElement('button'); el.type = 'button';
        el.className = a.t === 'open' ? 'chip' : 'btn btn-secondary'; el.textContent = a.label;
        el.addEventListener('click', function () {
          if (a.t === 'cat') { setCategory(a.cat, true); if (innerWidth < 561) closeChat(); }
          else if (a.t === 'open') openProduct(a.id);
          else if (a.t === 'jump') { scrollToEl(a.sel); if (innerWidth < 561) closeChat(); }
        });
      }
      w.appendChild(el);
    });
    chatLog.appendChild(w); scrollChat();
  }
  function botSay(text, actions, instant) {
    if (instant) { addMsg(text, 'bot'); addActions(actions); return; }
    var t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>'; t.setAttribute('aria-label', 'Elora Assistant is typing'); chatLog.appendChild(t); scrollChat();
    setTimeout(function () { t.remove(); addMsg(text, 'bot'); addActions(actions); }, 420);
  }
  function userSay(text) { text = text.trim(); if (!text) return; addMsg(text, 'me'); botSay.apply(null, respond(text)); }
  chatForm.addEventListener('submit', function (e) { e.preventDefault(); var v = chatInput.value; chatInput.value = ''; userSay(v); });

  var CAT_RX = { Bags: /\b(bag|handbag|purse|tote|crossbody|clutch)/, Jewelry: /(jewel|necklace|earring|bracelet|\bring\b|pendant|choker)/, Watches: /(watch|timepiece|chronograph)/, Wallets: /(wallet|pouch|card ?holder)/, Belts: /\bbelt/, Shoes: /(shoe|sneaker|loafer|trainer|footwear)/, Sandals: /(sandal|heel|\bslide|mule|slingback)/ };
  function catCount(c) { return PRODUCTS.filter(function (p) { return p.category === c; }).length; }
  var IGA = function (label) { return { t: 'ig', label: label }; };
  var HUMAN_MSG = 'For personalized assistance, please contact us on Instagram ' + HANDLE + '.';

  function respond(raw) {
    var q = raw.toLowerCase();
    var brands = {}; PRODUCTS.forEach(function (p) { if (p.brand) p.brand.toLowerCase().split(/\s+/).forEach(function (w) { if (w.length > 2 && w !== 'and' && w !== '&') brands[w.replace(/[^a-z]/g, '')] = 1; }); });
    var brandHit = q.split(/[^a-z&]+/).some(function (w) { return brands[w]; });

    if (/^\s*(hi|hello|hey|hii|salam|assalam[\w\s-]*|good (morning|afternoon|evening))\W*$/.test(q)) return ['Hello! You can ask me about our categories, how to order, or the price of a piece.', []];
    if (/\b(thanks|thank you|thx|shukriya)\b/.test(q)) return ['You’re welcome. If you’d like to order or ask anything else, Instagram is the best place.', [IGA('CONTACT US ON INSTAGRAM')]];
    if (/(who|what) are you|are you (a |an )?(bot|human|real|ai|robot)|your name|did you (send|place|order|message|dm)|have you (sent|placed)/.test(q))
      return ['I’m Elora Assistant, an automated helper on this website. I can’t place orders or send messages for you. To order or ask a question, please message us on Instagram.', [IGA('CONTACT US ON INSTAGRAM')]];
    if (/(talk|speak|chat|connect).*(someone|person|human|team|agent|staff|owner|seller)|human|real person|customer (service|support)|support|help me|\bcall\b|phone|whatsapp|email|contact/.test(q))
      return ['Of course. Our team can assist you directly on Instagram. That’s our contact channel, and I don’t have other contact details here.', [IGA('CHAT ON INSTAGRAM')]];
    if (/(price|cost|how much|rate|discount|offer|sale|cheap|expensive|pricing)/.test(q)) {
      var m = brandHit || Object.keys(CAT_RX).some(function (c) { return CAT_RX[c].test(q) && catCount(c); }) ? search(q).slice(0, 3) : [];
      var acts = m.map(function (p) { return { t: 'open', id: p.id, label: title(p) }; });
      return ['Please contact us on Instagram for the latest price and availability.' + (acts.length ? '\nPieces you may mean:' : ''), acts.concat([IGA('DM ' + HANDLE)])];
    }
    if (/(order|buy|purchase|checkout|check out|cart|reserve|place an)/.test(q))
      return ['You can place your order by messaging us on Instagram. Tell us the name of the piece you like and we’ll take it from there.', [IGA('ORDER ON INSTAGRAM')]];
    if (/(availab|in stock|stock|restock|sold out|have it)/.test(q) && !/do you have/.test(q))
      return ['I can’t confirm live availability here. Please message us on Instagram for current availability.', [IGA('CONTACT US ON INSTAGRAM')]];
    if (/(where are you|where.*(located|based)|location|address|\bmap\b|dubai|\buae\b|emirates|visit|showroom|shop|store)/.test(q))
      return ['We’re in Dubai, United Arab Emirates. I don’t have a street address here, so for visit details please contact us on Instagram ' + HANDLE + '.', [{ t: 'jump', sel: '#location', label: 'VIEW THE MAP' }, IGA('CONTACT US ON INSTAGRAM')]];
    if (/(ship|deliver|courier|dispatch|return|refund|exchange|warrant|payment|\bpay\b|\bcod\b|cash|size|sizing|measure|dimension|material|leather|authentic|original|genuine|certificate|custom|bulk|wholesale|opening|hours|delivery time)/.test(q))
      return ['I don’t have that information here. ' + HUMAN_MSG, [IGA('CONTACT US ON INSTAGRAM')]];
    if (/(new arrival|new in|latest|just in|newest)/.test(q)) {
      return [arrivals.length ? 'You can see our newest pieces in the New Arrivals section. For current availability, message us on Instagram.' : 'For the newest pieces, please check our Instagram ' + HANDLE + '.', (arrivals.length ? [{ t: 'jump', sel: '#new-arrivals', label: 'VIEW NEW ARRIVALS' }] : []).concat([IGA('CONTACT INSTAGRAM')])];
    }
    if (/(what do you (sell|have|offer)|categor|collection|products|catalog|catalogue|what.*(available|sell)|show me|browse)/.test(q)) {
      return ['We currently show ' + PRODUCTS.length + ' pieces across: ' + CATS.map(function (c) { return c + ' (' + catCount(c) + ')'; }).join(', ') + '. Choose a category to browse.', CATS.map(function (c) { return { t: 'cat', cat: c, label: c.toUpperCase() }; })];
    }
    if (/(instagram|insta\b|\big\b|follow|social)/.test(q))
      return ['Our Instagram is ' + HANDLE + '. That’s where you can follow us, place orders and ask questions.', [IGA('FOLLOW US ON INSTAGRAM')]];
    if (/(about|brand|elora|story|who)/.test(q) && !brandHit)
      return ['ELORA ELEGANCE COLLECTIVE is a curated collection of fashion and accessories. You can read more in The Essence of Elora on this page.', [{ t: 'jump', sel: '#about', label: 'READ OUR STORY' }, IGA('VISIT INSTAGRAM')]];

    var cat = null; CATS.forEach(function (c) { if (!cat && CAT_RX[c] && CAT_RX[c].test(q)) cat = c; });
    if (cat && !brandHit) {
      return ['Yes, explore our ' + cat.toLowerCase() + ' collection above (' + catCount(cat) + ' pieces shown). For current availability, message us on Instagram.', [{ t: 'cat', cat: cat, label: 'VIEW ' + cat.toUpperCase() }, IGA('CONTACT INSTAGRAM')]];
    }
    var stop = /^(do|you|have|any|the|a|an|is|are|i|me|for|of|about|with|want|need|looking|find|show|tell|please|can|there|your|what|which)$/;
    var meaningful = q.split(/[^a-z0-9&]+/).filter(function (w) { return w && !stop.test(w); }).join(' ');
    var res = meaningful ? search(meaningful).slice(0, 4) : [];
    if (res.length && res.length < PRODUCTS.length) {
      return ['Here ' + (res.length === 1 ? 'is a piece' : 'are pieces') + ' that may match. For price and availability, message us on Instagram.', res.map(function (p) { return { t: 'open', id: p.id, label: title(p) }; }).concat([IGA('CONTACT INSTAGRAM')])];
    }
    return [HUMAN_MSG, [IGA('CONTACT US ON INSTAGRAM')]];
  }

  /* ---------------------------------------------------------------- structured data for products */
  (function () {
    var list = PRODUCTS.map(function (p, i) {
      var item = { '@type': 'Product', name: title(p), category: p.category, description: p.description, image: p.images.map(function (im) { return new URL(im.lg, location.href).href; }) };
      if (p.brand) item.brand = { '@type': 'Brand', name: p.brand };
      if (p.price) { var num = String(p.price).replace(/[^0-9.]/g, ''); if (num) item.offers = { '@type': 'Offer', price: num, url: IG }; }
      return { '@type': 'ListItem', position: i + 1, item: item };
    });
    var s = document.createElement('script'); s.type = 'application/ld+json';
    s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'ELORA ELEGANCE COLLECTIVE — The Collection', itemListElement: list });
    document.head.appendChild(s);
  })();

  /* ---------------------------------------------------------------- scroll engine
     One rAF loop drives everything from the scroll position (and, on desktop, the cursor):
     hero stages, pinned editorial sections, scrubbed reveals, parallax layers and the Dubai map.
     Only transform / opacity / a few CSS variables are written. */
  var nav = $('#nav'), progress = $('#progress');
  var track = $('[data-track]'), media = $('[data-hero-media]'), mInner = $('.hm-inner', media), tint = $('.hm-tint', media);
  var copy = $('[data-hero-copy]'), hTitle = $('.hero-title'), hTag = $('.hero-tag'), hCta = $('.hero-cta');
  var wash = $('.wash'), washDeep = $('.wash-deep'), silk1 = $('.silk-1'), silk2 = $('.silk-2'), silk3 = $('.silk-3');
  var lines = $$('.sl'), hint = $('[data-hint]');
  var mapStage = $('[data-map-stage]'), mapCard = $('[data-map-card]');
  var vw, vh, trackTop, trackLen, mobile, lite, target = 0, smooth = 0, raf = 0, cols = 4;
  var hasMouse = window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced;
  var mxT = 0, myT = 0, mx = 0, my = 0, tiltTx = 0, tiltTy = 0, tiltX = 0, tiltY = 0;
  var RISE = [], PLX = [], LINES = [], IMGS = [], PINS = [], MVARS = [], SCRUBS = [], CARDS = [];

  function docTop(el) { var t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; }
  function ease3(t) { return 1 - Math.pow(1 - t, 3); }
  function num(el, a, d) { var v = parseFloat(el.getAttribute(a)); return isNaN(v) ? d : v; }

  function collect() {
    RISE = $$('[data-rise]').map(function (el) { return { el: el, st: num(el, 'data-st', 0) }; });
    PLX = $$('[data-parallax]').map(function (el) { return { el: el, k: num(el, 'data-parallax', 0), m: num(el, 'data-mouse', 0) }; });
    LINES = $$('.reveal-lines').map(function (el) { return { el: el, sp: $$('.line>span', el) }; });
    IMGS = $$('.reveal-img').map(function (el) { return { el: el, img: el.querySelector('img'), m: num(el, 'data-mouse', 0) }; });
    PINS = $$('[data-pin]'); MVARS = $$('[data-mouse-var]'); SCRUBS = $$('[data-scrub]');
    refreshCards();
  }
  function refreshCards() {
    CARDS = $$('#grid .card');
    var g = $('#grid'); if (g) { var n = getComputedStyle(g).gridTemplateColumns.split(' ').length; cols = n > 0 ? n : 4; }
    schedule();
  }
  function measure() {
    vw = window.innerWidth; vh = window.innerHeight; mobile = vw < 760; lite = vw < 760;
    trackTop = track.offsetTop; trackLen = Math.max(1, track.offsetHeight - vh);
    var g = $('#grid'); if (g) { var n = getComputedStyle(g).gridTemplateColumns.split(' ').length; cols = n > 0 ? n : 4; }
  }

  function renderHero(p) {
    var a = easeIO(clamp(p / .42)), b = clamp((p - .36) / .3), c = clamp((p - .6) / .3), ex = clamp((p - .8) / .2);
    var sL, sT, sW, sH;
    if (mobile) { sL = vw * .15; sT = vh * .44; sW = vw * .7; sH = vh * .47; }
    else { sL = vw * .56; sT = vh * .12; sW = vw * .385; sH = vh * .78; }
    var L = lerp(sL, 0, a), T = lerp(sT, 0, a), W = lerp(sW, vw, a), H = lerp(sH, vh, a), r = (W / 2) * (1 - a);
    media.style.left = L + 'px'; media.style.top = T + 'px'; media.style.width = W + 'px'; media.style.height = H + 'px';
    media.style.borderRadius = r + 'px ' + r + 'px 0 0';
    media.style.opacity = 1 - clamp((p - .52) / .22);
    // slow continuous zoom on the hero visual, plus a hint of cursor parallax
    mInner.style.transform = 'translate3d(' + (mx * -16).toFixed(1) + 'px,' + (my * -12).toFixed(1) + 'px,0) scale(' + lerp(1.04, 1.28, clamp(p / .62)).toFixed(4) + ')';
    mInner.style.filter = b > .01 && !lite ? 'blur(' + (b * 12).toFixed(1) + 'px)' : 'none';
    tint.style.opacity = b * .95;
    // brand title lifts first, tagline fades next, CTAs go last
    hTitle.style.opacity = (1 - clamp(a * 1.45 - .1)).toFixed(3);
    hTitle.style.transform = 'translate3d(0,' + (-a * 170).toFixed(1) + 'px,0)';
    hTag.style.opacity = (1 - clamp(a * 2.3)).toFixed(3);
    hTag.style.transform = 'translate3d(0,' + (-a * 120).toFixed(1) + 'px,0)';
    hCta.style.opacity = (1 - clamp(a * 1.9 - .15)).toFixed(3);
    hCta.style.transform = 'translate3d(0,' + (-a * 70).toFixed(1) + 'px,0) scale(' + (1 - a * .06).toFixed(3) + ')';
    copy.style.visibility = a > .72 ? 'hidden' : 'visible';
    wash.style.opacity = clamp((p - .3) / .3);
    washDeep.style.opacity = c;
    silk1.style.transform = 'translate3d(' + (-p * vw * .12 + mx * vw * .014).toFixed(1) + 'px,' + (-p * vh * .08 + my * vh * .014).toFixed(1) + 'px,0) scale(' + (1 + p * .55) + ')';
    silk2.style.transform = 'translate3d(' + (-p * vw * .2 + mx * vw * .026).toFixed(1) + 'px,' + (p * vh * .14 + my * vh * .02).toFixed(1) + 'px,0) rotate(' + (-p * 6) + 'deg) scale(' + (1 + p * .7) + ')';
    silk3.style.transform = 'translate3d(' + (p * vw * .08 + mx * vw * .01).toFixed(1) + 'px,' + (my * vh * .008).toFixed(1) + 'px,0) scale(' + (1 + p * .3) + ')';
    silk3.style.opacity = 1 - c * .82;
    lines.forEach(function (l, i) {
      var t = easeIO(clamp((p - .6 - i * .06) / .15));
      l.style.opacity = t; l.style.filter = t < .99 && !lite ? 'blur(' + ((1 - t) * 14).toFixed(1) + 'px)' : 'none';
      l.style.transform = 'translate3d(0,' + ((1 - t) * 46 - ex * 50).toFixed(1) + 'px,0)';
    });
    hint.style.opacity = 1 - clamp(p / .06);
  }

  /* scrubbed reveals: every value is computed from the element's position in the viewport, so it reverses when scrolling up */
  function fx(y) {
    var dist = lite ? 34 : 60, k = lite ? .5 : 1, i, n, o, el, top, h, raw, t;
    // 1) rise (opacity + translateY + scale)
    for (i = 0; i < RISE.length; i++) {
      o = RISE[i]; el = o.el; top = docTop(el) - y; h = el.offsetHeight;
      if (top > vh * 1.3 || top + h < -vh * .3) continue;
      raw = clamp((vh * .98 - top) / (vh * .38));
      t = ease3(clamp((raw - o.st * .07) / (1 - o.st * .07)));
      el.style.opacity = t < .999 ? t.toFixed(3) : '1';
      el.style.transform = t > .999 ? 'none' : 'translate3d(0,' + ((1 - t) * dist).toFixed(1) + 'px,0)' + (lite ? '' : ' scale(' + (.96 + .04 * t).toFixed(3) + ')');
    }
    // 2) headings: line mask reveal with blur-to-sharp
    for (i = 0; i < LINES.length; i++) {
      o = LINES[i]; el = o.el; top = docTop(el) - y; h = el.offsetHeight;
      if (top > vh * 1.3 || top + h < -vh * .3) continue;
      raw = clamp((vh * .98 - top) / (vh * .42)); n = o.sp.length;
      o.sp.forEach(function (s, j) {
        var d = .2 * j, tl = ease3(clamp((raw - d) / (1 - d * (n > 1 ? 1 : 0))));
        s.style.transform = tl > .999 ? 'none' : 'translate3d(0,' + ((1 - tl) * 112).toFixed(1) + '%,0)';
        s.style.filter = tl > .99 || lite ? 'none' : 'blur(' + ((1 - tl) * 7).toFixed(1) + 'px)';
      });
    }
    // 3) image reveals (mask + slow zoom + parallax inside the frame)
    for (i = 0; i < IMGS.length; i++) {
      o = IMGS[i]; el = o.el; top = docTop(el) - y; h = el.offsetHeight;
      if (top > vh * 1.3 || top + h < -vh * .3) continue;
      t = ease3(clamp((vh * .95 - top) / (vh * .6)));
      var py = ((top + h / 2) - vh / 2) * -.05 * k;
      o.img.style.clipPath = t > .999 ? 'none' : 'inset(' + ((1 - t) * 100).toFixed(1) + '% 0 0 0)';
      o.img.style.transform = 'translate3d(' + (mx * o.m).toFixed(1) + 'px,' + (py + my * o.m).toFixed(1) + 'px,0) scale(' + (1.3 - .18 * t).toFixed(3) + ')';
    }
    // 4) parallax layers (negative speed = moves a little faster than the page)
    for (i = 0; i < PLX.length; i++) {
      o = PLX[i]; el = o.el; top = docTop(el) - y; h = el.offsetHeight;
      if (top > vh * 1.4 || top + h < -vh * .4) continue;
      el.style.transform = 'translate3d(' + (mx * o.m * .3).toFixed(1) + 'px,' + (((top + h / 2) - vh / 2) * o.k * k).toFixed(1) + 'px,0)';
    }
    // 5) product cards: staggered rise, depth-dependent drift, zoom-in
    var depth = [0, .05, .025, .07];
    for (i = 0; i < CARDS.length; i++) {
      el = CARDS[i]; top = docTop(el) - y; h = el.offsetHeight;
      if (top > vh * 1.3 || top + h < -vh * .4) continue;
      var col = i % cols;
      raw = clamp((vh * .99 - top) / (vh * .42));
      t = ease3(clamp((raw - col * .07) / (1 - col * .07)));
      var dy = (1 - t) * (lite ? 40 : 76) + ((top + h / 2) - vh / 2) * depth[col % 4] * k;
      el.style.opacity = t < .999 ? t.toFixed(3) : '1';
      el.style.transform = 'translate3d(0,' + dy.toFixed(1) + 'px,0)';
      el.firstChild && el.firstChild.firstChild && el.firstChild.firstChild.style.setProperty('--z', (1.14 - .14 * t).toFixed(3));
    }
    // 6) cursor-following decorative layers
    if (hasMouse) for (i = 0; i < MVARS.length; i++) {
      var kk = num(MVARS[i], 'data-mouse-var', 10);
      MVARS[i].style.setProperty('--mx', (mx * kk * 2).toFixed(1) + 'px'); MVARS[i].style.setProperty('--my', (my * kk * 2).toFixed(1) + 'px');
    }
  }

  /* Dubai map: position in the viewport controls rise, tilt, rotation and scale. It settles at rotation 0. */
  function renderMap() {
    var r = mapStage.getBoundingClientRect();
    if (r.top > vh * 1.3 || r.bottom < -vh * .3) return false;
    var p = clamp((vh - r.top) / (vh / 2 + r.height / 2));
    var s = clamp((p - .04) / .96), e = s * s * (3 - 2 * s);          // smoothstep
    var settled = e > .9995, again = false;
    if (settled) {
      if (hasMouse && (Math.abs(tiltTx - tiltX) + Math.abs(tiltTy - tiltY) > .0008 || Math.abs(tiltX) + Math.abs(tiltY) > .002)) {
        tiltX += (tiltTx - tiltX) * .1; tiltY += (tiltTy - tiltY) * .1; again = true;
        mapCard.style.transform = 'perspective(1400px) rotateX(' + (-tiltY * 5).toFixed(2) + 'deg) rotateY(' + (tiltX * 6).toFixed(2) + 'deg)';
      } else mapCard.style.transform = 'none';
      mapCard.style.opacity = '1';
    } else {
      var d = 1 - e;
      var ty = d * vh * (lite ? .22 : .42), rz = d * (lite ? -4 : -11), rx = d * (lite ? 10 : 26), ry = d * (lite ? 0 : -17), sc = (lite ? .92 : .82) + (lite ? .08 : .18) * e;
      mapCard.style.transform = 'perspective(1400px) translate3d(0,' + ty.toFixed(1) + 'px,0) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
      mapCard.style.opacity = clamp(p * 2.6).toFixed(3);
    }
    return again;
  }

  function frame() {
    raf = 0;
    var y = window.scrollY, again = false;
    nav.classList.toggle('scrolled', y > 40);
    var doc = document.documentElement.scrollHeight - vh;
    progress.style.transform = 'scaleX(' + (doc > 0 ? y / doc : 0) + ')';
    if (!reduced) {
      target = clamp((y - trackTop) / trackLen);
      smooth += (target - smooth) * .14;
      if (Math.abs(target - smooth) < .0006) smooth = target; else again = true;
      if (hasMouse) {
        mx += (mxT - mx) * .07; my += (myT - my) * .07;
        if (Math.abs(mxT - mx) + Math.abs(myT - my) > .0008) again = true; else { mx = mxT; my = myT; }
      }
      if (y < trackTop + trackLen + vh) renderHero(smooth);
      SCRUBS.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        el.style.setProperty('--sp', clamp((vh - r.top) / (vh + r.height)).toFixed(4));
      });
      PINS.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        el.style.setProperty('--pp', clamp(-r.top / Math.max(1, r.height - vh)).toFixed(4));
      });
      fx(y);
      if (mapStage && renderMap()) again = true;
      if (again) schedule();
    }
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { measure(); refreshCards(); schedule(); });
  window.addEventListener('load', function () { measure(); schedule(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); schedule(); });
  measure(); collect(); if (!reduced) { smooth = target = clamp((window.scrollY - trackTop) / trackLen); } schedule();
  if (reduced) { media.style.cssText = ''; }

  /* cursor: layers follow, cards tilt in 3D, buttons pull gently toward the pointer */
  if (hasMouse) {
    document.addEventListener('mousemove', function (e) { mxT = e.clientX / vw - .5; myT = e.clientY / vh - .5; schedule(); }, { passive: true });
    var tiltEl = null;
    var resetTilt = function (m) { if (m) { m.style.setProperty('--rx', '0deg'); m.style.setProperty('--ry', '0deg'); } };
    document.addEventListener('mousemove', function (e) {
      var m = e.target.closest && e.target.closest('.card-media');
      if (tiltEl && tiltEl !== m) resetTilt(tiltEl);
      tiltEl = m;
      if (m) { var r = m.getBoundingClientRect(); m.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 9).toFixed(2) + 'deg'); m.style.setProperty('--rx', ((.5 - (e.clientY - r.top) / r.height) * 7).toFixed(2) + 'deg'); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { resetTilt(tiltEl); tiltEl = null; });
    var magBtn = null;
    document.addEventListener('mousemove', function (e) {
      var b = e.target.closest && e.target.closest('.btn');
      if (magBtn && magBtn !== b) { magBtn.style.removeProperty('--mx'); magBtn.style.removeProperty('--my'); }
      magBtn = b;
      if (b) { var r = b.getBoundingClientRect(); b.style.setProperty('--mx', clamp(((e.clientX - r.left) / r.width - .5) * 14, -8, 8).toFixed(1) + 'px'); b.style.setProperty('--my', clamp(((e.clientY - r.top) / r.height - .5) * 10, -6, 6).toFixed(1) + 'px'); }
    }, { passive: true });
    if (mapCard) {
      mapCard.addEventListener('mousemove', function (e) { var r = mapCard.getBoundingClientRect(); tiltTx = (e.clientX - r.left) / r.width - .5; tiltTy = (e.clientY - r.top) / r.height - .5; schedule(); });
      mapCard.addEventListener('mouseleave', function () { tiltTx = tiltTy = 0; schedule(); });
    }
  }

  /* map: the page keeps scrolling until the visitor chooses to use the map */
  if (mapCard) {
    var shield = $('.map-shield', mapCard), done = $('.map-done', mapCard);
    var setActive = function (on) { mapCard.classList.toggle('active', on); done.hidden = !on; };
    shield.addEventListener('click', function () { setActive(true); });
    done.addEventListener('click', function () { setActive(false); });
    mapCard.addEventListener('mouseleave', function () { if (window.matchMedia('(hover:hover)').matches) setActive(false); });
    document.addEventListener('pointerdown', function (e) { if (mapCard.classList.contains('active') && !e.target.closest('[data-map-card]')) setActive(false); });
    if (reduced && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es, ob) { es.forEach(function (x) { if (x.isIntersecting) { mapCard.classList.add('in'); ob.disconnect(); } }); }, { threshold: .25 }).observe(mapStage);
    } else if (reduced) mapCard.classList.add('in');
  }

  /* active nav link */
  var links = $$('.nav-links a');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'about', 'collection', 'new-arrivals', 'contact'].forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------------------------------------------------------------- loader */
  var loader = $('#loader'), seen = false;
  try { seen = sessionStorage.getItem('elora-seen') === '1'; sessionStorage.setItem('elora-seen', '1'); } catch (e) { }
  if (seen) { loader.style.display = 'none'; document.body.classList.remove('is-loading'); }
  else setTimeout(function () { document.body.classList.remove('is-loading'); }, reduced ? 500 : 2300);

  /* ---------------------------------------------------------------- hero video (optional) */
  var vid = $('#heroVideo');
  if (vid && !reduced && !(navigator.connection && navigator.connection.saveData)) {
    var src = vid.querySelector('source');
    var tryPlay = function () { vid.preload = 'auto'; vid.load(); };
    vid.addEventListener('canplay', function () { vid.classList.add('ready'); var pr = vid.play(); if (pr && pr.catch) pr.catch(function () { vid.classList.remove('ready'); }); });
    src.addEventListener('error', function () { vid.classList.remove('ready'); });
    if ('requestIdleCallback' in window) requestIdleCallback(tryPlay, { timeout: 3000 }); else setTimeout(tryPlay, 1500);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (!vid.classList.contains('ready')) return; if (e.isIntersecting) vid.play().catch(function () { }); else vid.pause(); }); }).observe(track);
  }

  /* ---------------------------------------------------------------- floating motes (subtle) */
  (function () {
    var cv = $('#motes'); if (!cv || reduced) return;
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5), P = [], last = 0, running = true;
    function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function make() {
      var n = W < 760 ? 16 : 34; P = [];
      for (var i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: .7 + Math.random() * 1.9, vy: -(.05 + Math.random() * .16), ph: Math.random() * 6.28, sp: .15 + Math.random() * .3, glint: Math.random() < .5 });
    }
    function draw(t) {
      if (!running) return;
      var dt = t - last; if (dt < 30) { requestAnimationFrame(draw); return; } last = t; dt = Math.min(dt, 80);
      ctx.clearRect(0, 0, W, H);
      P.forEach(function (p) {
        p.y += p.vy * dt * .06; p.x += Math.sin(t / 1800 * p.sp + p.ph) * .18;
        if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
        var tw = .55 + .45 * Math.sin(t / 900 * p.sp + p.ph);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = p.glint ? 'rgba(255,250,240,' + (.55 * tw) + ')' : 'rgba(110,10,18,' + (.2 * tw) + ')';
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    size(); make(); requestAnimationFrame(draw);
    window.addEventListener('resize', function () { size(); make(); });
    document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) requestAnimationFrame(draw); });
  })();

  /* ---------------------------------------------------------------- cursor */
  (function () {
    var c = $('#cursor'); if (!c || !window.matchMedia('(hover:hover) and (pointer:fine)').matches || reduced) return;
    var x = -100, y = -100, cx = x, cy = y, run = false;
    document.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; c.classList.add('on'); if (!run) { run = true; requestAnimationFrame(loop); } });
    document.addEventListener('mouseleave', function () { c.classList.remove('on'); });
    document.addEventListener('mouseover', function (e) { c.classList.toggle('big', !!e.target.closest('a,button,.card-media,.pd-main')); });
    function loop() { cx += (x - cx) * .22; cy += (y - cy) * .22; c.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)'; if (Math.abs(x - cx) + Math.abs(y - cy) > .3) requestAnimationFrame(loop); else run = false; }
  })();

  /* deep link on load */
  routeFromHash();
})();

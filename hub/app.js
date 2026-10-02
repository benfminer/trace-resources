/* Para Resource Hub: rendering, faceted filtering, URL-hash state. No build step. */
(function () {
  "use strict";
  var DATA = window.HUB_DATA;
  if (!DATA) {
    document.getElementById("results").innerHTML =
      '<div class="empty"><h3>The resource list did not load.</h3><p>data.js is missing. Run <code>python3 build.py</code> in the resource-hub folder, then reload.</p></div>';
    return;
  }
  var R = DATA.resources;
  var F = DATA.facets;

  /* ---------- vocabulary ---------- */
  var GROUPS = [
    { key: "work", name: "Work and careers", color: "var(--blue)", purposes: ["career-exploration", "job-coaching", "soft-skills"], shape: "circle" },
    { key: "plan", name: "Assessment and planning", color: "var(--butter)", purposes: ["transition-assessment"], shape: "grid" },
    { key: "voice", name: "Self-advocacy and rights", color: "var(--lilac)", purposes: ["self-determination", "legal"], shape: "half" },
    { key: "living", name: "Daily living and health", color: "var(--sage)", purposes: ["independent-living", "health"], shape: "house" },
    { key: "money", name: "Benefits and money", color: "var(--clay)", purposes: ["benefits"], shape: "rings" },
    { key: "family", name: "Family and college", color: "var(--teal)", purposes: ["family-support", "postsecondary"], shape: "arch" },
    { key: "fun", name: "Recreation and social life", color: "var(--rose)", purposes: ["recreation-leisure"], shape: "spark" }
  ];
  var GROUP_OF = {};
  GROUPS.forEach(function (g) { g.purposes.forEach(function (p) { GROUP_OF[p] = g; }); });

  var LABELS = {
    audience: { para: "Paras", "transition-specialist": "Transition specialists", teacher: "Teachers", family: "Families", student: "Students" },
    user: { "student-facing": "Student uses it", "staff-facing": "Staff use it" },
    reading_load: { "none-picture": "No reading (pictures)", low: "Low reading", "grade-level": "Grade-level reading" },
    response_mode: { "point-select": "Point or tap", "speak-write": "Speak or write", "staff-scribes": "Staff can scribe" },
    purpose: {
      "career-exploration": "Career exploration", "job-coaching": "Job coaching and placement", "soft-skills": "Soft and social skills",
      "transition-assessment": "Transition assessment", "self-determination": "Self-determination", legal: "Legal and decision-making",
      "independent-living": "Independent living", health: "Health care", benefits: "Benefits and money",
      "family-support": "Family support", postsecondary: "College and training", "recreation-leisure": "Recreation and leisure"
    },
    format: { printable: "Printable", "web-tool": "Web tool", curriculum: "Curriculum", course: "Online course", database: "Directory or database", reference: "Reference or agency" },
    access: { "free-no-login": "Free, no login", "free-account": "Free account needed", paid: "Costs money" },
    time: { "under-15-min": "Under 15 minutes", "one-session": "One session", "multi-session": "Several sessions or ongoing" },
    geography: { national: "National", california: "California", "san-diego": "San Diego" },
    language: { en: "English", es: "Spanish", other: "Other languages" },
    link: { ok: "Link checked", check: "Check before use" }
  };
  var TITLES = {
    purpose: "Topic", user: "Who uses it", reading_load: "Reading load", response_mode: "How the student responds",
    geography: "Where", format: "Format", access: "Cost and login", time: "Time it takes", audience: "Written for",
    language: "Language", link: "Link status"
  };
  var FACET_KEYS = ["purpose", "user", "reading_load", "response_mode", "geography", "format", "access", "time", "audience", "language", "link"];
  var GATED = ["reading_load", "response_mode"];

  function vals(r, f) {
    if (f === "link") return [r.verify_status === "ok" ? "ok" : "check"];
    var v = r[f];
    if (v === null || v === undefined) return [];
    return Array.isArray(v) ? v : [v];
  }
  function options(f) {
    if (f === "link") return ["ok", "check"];
    if (f === "purpose") { var o = []; GROUPS.forEach(function (g) { o = o.concat(g.purposes); }); return o; }
    return F[f].filter(function (x) { return x !== null; });
  }

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function linkify(s) {
    return esc(s).replace(/https?:\/\/[^\s<]+[^\s<.,;:)'"]/g, function (u) {
      return '<a href="' + u + '" rel="noopener" target="_blank">' + u + "</a>";
    });
  }
  function fmtDate(iso) {
    var m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var p = String(iso).split("-");
    return m[+p[1] - 1] + " " + (+p[2]) + ", " + p[0];
  }
  function groupOf(r) { return GROUP_OF[(r.purpose || [])[0]] || GROUPS[0]; }

  var SHAPES = {
    circle: '<circle cx="32" cy="32" r="24" fill="#141414"/><circle cx="32" cy="32" r="9" fill="currentColor"/>',
    grid: '<rect x="8" y="8" width="20" height="20" rx="4" fill="#141414"/><rect x="36" y="8" width="20" height="20" rx="4" fill="#141414"/><rect x="8" y="36" width="20" height="20" rx="4" fill="#141414"/><rect x="36" y="36" width="20" height="20" rx="10" fill="#141414"/>',
    half: '<path d="M8 40a24 24 0 0 1 48 0z" fill="#141414"/><rect x="8" y="46" width="48" height="8" rx="4" fill="#141414"/>',
    house: '<path d="M32 8 56 30v26H8V30z" fill="#141414"/><rect x="26" y="38" width="12" height="18" rx="2" fill="currentColor"/>',
    rings: '<circle cx="24" cy="32" r="16" fill="none" stroke="#141414" stroke-width="7"/><circle cx="42" cy="32" r="16" fill="none" stroke="#141414" stroke-width="7"/>',
    arch: '<path d="M10 56V32a22 22 0 0 1 44 0v24H42V32a10 10 0 0 0-20 0v24z" fill="#141414"/>',
    spark: '<path d="M32 6 38 26 58 32 38 38 32 58 26 38 6 32 26 26z" fill="#141414"/><circle cx="50" cy="12" r="5" fill="#141414"/>'
  };
  function shapeSvg(g, size) {
    return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true" style="color:' + g.color + '">' + SHAPES[g.shape] + "</svg>";
  }
  var ICON = {
    check: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#141414"/><path d="m4.8 8.2 2.1 2.1 4.3-4.6" fill="none" stroke="#F4F2ED" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warn: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 1.5 15 14H1z" fill="#141414"/><rect x="7.2" y="5.6" width="1.6" height="4.6" rx=".8" fill="#F2B33D"/><circle cx="8" cy="12" r=".95" fill="#F2B33D"/></svg>',
    eye: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8s2.6-4.5 7-4.5S15 8 15 8s-2.6 4.5-7 4.5S1 8 1 8z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>',
    hand: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg>',
    pin: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 15s5-4.6 5-8.5a5 5 0 0 0-10 0C3 10.4 8 15 8 15z" fill="currentColor"/><circle cx="8" cy="6.5" r="1.8" fill="#F4F2ED"/></svg>',
    clock: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5V8l2.3 1.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  var WARN_TEXT = {
    "bot-blocked": "This site blocks automated link checkers, so we could not confirm it. Open it in a browser before you share it.",
    "needs-manual-check": "Our link checker could not confirm this one. Open it and make sure it still works before you share it.",
    intermittent: "This link loads some of the time. Try it before you share it.",
    dead: "This link appears dead."
  };

  /* ---------- cards ---------- */
  function card(r, compact) {
    var g = groupOf(r);
    var ok = r.verify_status === "ok";
    var badges = [];
    (r.purpose || []).forEach(function (p) {
      var pg = GROUP_OF[p];
      badges.push('<li class="badge" style="background:' + pg.color + '">' + esc(LABELS.purpose[p]) + "</li>");
    });
    if (r.user === "student-facing") {
      badges.push('<li class="badge">' + ICON.eye + esc(LABELS.reading_load[r.reading_load]) + "</li>");
      badges.push('<li class="badge">' + ICON.hand + esc((r.response_mode || []).map(function (m) { return LABELS.response_mode[m]; }).join(", ")) + "</li>");
    }
    badges.push('<li class="badge">' + esc(LABELS.user[r.user]) + "</li>");
    if (!compact) {
      badges.push('<li class="badge">' + esc(LABELS.format[r.format]) + "</li>");
      badges.push('<li class="badge">' + ICON.clock + esc(LABELS.time[r.time]) + "</li>");
    }
    badges.push('<li class="badge">' + esc(LABELS.access[r.access]) + "</li>");
    var geo = (r.geography || []).indexOf("san-diego") > -1 ? "san-diego" : (r.geography || []).indexOf("california") > -1 ? "california" : null;
    if (geo) badges.push('<li class="badge">' + ICON.pin + esc(LABELS.geography[geo]) + "</li>");
    if ((r.language || []).indexOf("es") > -1) badges.push('<li class="badge">En español</li>');

    var status = ok
      ? '<span class="link-ok">' + ICON.check + "Link checked " + esc(fmtDate(r.verified_on)) + "</span>"
      : '<span class="link-warn">' + ICON.warn + "Check before use</span>";
    var warn = ok ? "" : '<p class="warn-note">' + esc(WARN_TEXT[r.verify_status] || WARN_TEXT["needs-manual-check"]) + " Last tried " + esc(fmtDate(r.verified_on)) + ".</p>";
    var notes = r.notes
      ? "<details><summary>" + ICON.chev + "What it is and how it helps</summary><p>" + linkify(r.notes) + "</p></details>"
      : "";
    return '<article class="card" aria-labelledby="t-' + (compact ? "c-" : "") + esc(r.id) + '">' +
      '<div class="top"><div class="glyph" style="background:' + g.color + '">' + shapeSvg(g, 26) + "</div>" +
      "<div><h3 id=\"t-" + (compact ? "c-" : "") + esc(r.id) + '"><a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.name) + '<span class="visually-hidden"> (opens in a new tab)</span></a></h3>' +
      '<p class="pub">' + esc(r.publisher) + "</p></div></div>" +
      '<p class="desc">' + esc(r.description) + "</p>" +
      warn +
      '<ul class="badges" aria-label="Tags">' + badges.join("") + "</ul>" +
      notes +
      '<div class="foot">' + status + "</div>" +
      "</article>";
  }

  /* ---------- state <-> hash ---------- */
  var state = { q: "", sel: {} };
  FACET_KEYS.forEach(function (f) { state.sel[f] = []; });

  function readHash() {
    var h = location.hash.replace(/^#/, "");
    FACET_KEYS.forEach(function (f) { state.sel[f] = []; });
    state.q = "";
    if (!h || h.indexOf("=") < 0) return false;
    h.split("&").forEach(function (part) {
      var kv = part.split("=");
      var k = decodeURIComponent(kv[0] || "");
      var v = decodeURIComponent((kv[1] || "").replace(/\+/g, " "));
      if (k === "q") state.q = v;
      else if (state.sel[k]) {
        var allowed = options(k);
        state.sel[k] = v.split(",").filter(function (x) { return allowed.indexOf(x) > -1; });
      }
    });
    return true;
  }
  function writeHash() {
    var parts = [];
    if (state.q) parts.push("q=" + encodeURIComponent(state.q));
    FACET_KEYS.forEach(function (f) { if (state.sel[f].length) parts.push(f + "=" + state.sel[f].map(encodeURIComponent).join(",")); });
    var h = parts.length ? "#" + parts.join("&") : location.pathname + location.search;
    if (parts.length) history.replaceState(null, "", h);
    else history.replaceState(null, "", location.pathname + location.search);
  }

  /* ---------- filtering ---------- */
  var HAY = {};
  R.forEach(function (r) {
    HAY[r.id] = [r.name, r.publisher, r.description, r.notes, (r.keywords || []).join(" "),
      (r.purpose || []).map(function (p) { return LABELS.purpose[p]; }).join(" ")].join(" ").toLowerCase();
  });
  function matches(r, skip) {
    if (state.q) {
      var terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < terms.length; i++) if (HAY[r.id].indexOf(terms[i]) < 0) return false;
    }
    for (var j = 0; j < FACET_KEYS.length; j++) {
      var f = FACET_KEYS[j];
      if (f === skip || !state.sel[f].length) continue;
      var v = vals(r, f);
      if (!state.sel[f].some(function (x) { return v.indexOf(x) > -1; })) return false;
    }
    return true;
  }
  function sortList(list) {
    return list.slice().sort(function (a, b) {
      var sa = a.verify_status === "ok" ? 0 : 1, sb = b.verify_status === "ok" ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return a.name.localeCompare(b.name);
    });
  }
  window.HUB_FILTER = function (sel, q) { // test hook: count results for a given selection
    var saved = JSON.parse(JSON.stringify(state));
    state.q = q || "";
    FACET_KEYS.forEach(function (f) { state.sel[f] = (sel && sel[f]) || []; });
    var n = R.filter(function (r) { return matches(r); }).length;
    state.q = saved.q; state.sel = saved.sel;
    return n;
  };

  /* ---------- filter panel ---------- */
  var filtersEl = document.getElementById("filters");
  function chipHtml(f, v, label, dot) {
    var id = "f-" + f + "-" + v;
    return '<div class="chip"><input type="checkbox" id="' + id + '" data-f="' + f + '" value="' + esc(v) + '">' +
      '<label for="' + id + '">' + (dot ? '<span class="dot" style="background:' + dot + '"></span>' : "") +
      esc(label) + ' <span class="n" data-n="' + f + ":" + esc(v) + '"></span></label></div>';
  }
  function fieldset(f, hint) {
    var html = '<fieldset><legend>' + esc(TITLES[f]) + "</legend>" + (hint ? '<p class="hint">' + hint + "</p>" : "") + '<div class="chips">';
    options(f).forEach(function (v) {
      html += chipHtml(f, v, LABELS[f][v], f === "purpose" ? GROUP_OF[v].color : null);
    });
    return html + "</div></fieldset>";
  }
  filtersEl.innerHTML =
    '<form class="browse-search" role="search" onsubmit="return false"><label class="visually-hidden" for="q-browse">Search resources</label>' +
    '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>' +
    '<input id="q-browse" type="search" placeholder="Search" autocomplete="off"></form>' +
    fieldset("purpose") +
    fieldset("user", "Student-facing means the student uses it directly. Staff-facing means you read it, run it or refer to it.") +
    '<div class="gated" id="gated" role="group" aria-labelledby="gate-title" aria-describedby="gate-hint">' +
    '<p class="gate-title" id="gate-title">' + ICON.eye + "For student-facing tools only</p>" +
    '<p class="hint" id="gate-hint">Reading load and response mode only apply to tools a student uses directly. Picking any of these hides staff-facing resources.</p>' +
    fieldset("reading_load") + fieldset("response_mode") + "</div>" +
    fieldset("geography") + fieldset("format") + fieldset("access") + fieldset("time") +
    fieldset("audience") + fieldset("language") +
    fieldset("link", "Check before use means our checker could not confirm the link, usually because the site blocks automated checks.");

  /* ---------- render ---------- */
  var resultsEl = document.getElementById("results");
  var countEl = document.getElementById("count");
  var activeEl = document.getElementById("active-chips");
  var bannerEl = document.getElementById("gate-banner");
  var qHero = document.getElementById("q-hero");
  var qBrowse = document.getElementById("q-browse");

  function render() {
    var list = sortList(R.filter(function (r) { return matches(r); }));
    resultsEl.innerHTML = list.length
      ? list.map(function (r) { return card(r, false); }).join("")
      : '<div class="empty"><h3>Nothing matches all of these filters.</h3><p>Remove a filter above, or clear them all to see every resource.</p><p><button class="btn" type="button" data-clear>Clear all filters</button></p></div>';
    countEl.textContent = list.length === R.length
      ? "All " + R.length + " resources"
      : list.length + " of " + R.length + " resources";

    // facet counts given every other facet
    FACET_KEYS.forEach(function (f) {
      var base = R.filter(function (r) { return matches(r, f); });
      options(f).forEach(function (v) {
        var n = base.filter(function (r) { return vals(r, f).indexOf(v) > -1; }).length;
        var span = filtersEl.querySelector('[data-n="' + f + ":" + v + '"]');
        if (span) span.textContent = n;
        var input = document.getElementById("f-" + f + "-" + v);
        if (input) {
          input.checked = state.sel[f].indexOf(v) > -1;
          input.classList.toggle("zero", n === 0);
        }
      });
    });

    // gating: if only staff-facing is selected, reading/response filters cannot apply
    var staffOnly = state.sel.user.length === 1 && state.sel.user[0] === "staff-facing";
    var gated = document.getElementById("gated");
    gated.classList.toggle("is-off", staffOnly);
    gated.querySelectorAll("input").forEach(function (i) { i.disabled = staffOnly && !i.checked; });
    var gateOn = state.sel.reading_load.length || state.sel.response_mode.length;
    bannerEl.hidden = !gateOn && !staffOnly;
    bannerEl.textContent = staffOnly
      ? "Showing staff-facing resources. Reading load and response mode filters are turned off because they only describe tools a student uses."
      : "Showing student-facing tools only, because reading load and response mode only describe tools a student uses directly.";

    // active filter chips
    var chips = [];
    if (state.q) chips.push('<li><button type="button" data-rm="q">Search: ' + esc(state.q) + ' <span aria-hidden="true">&times;</span><span class="visually-hidden">, remove</span></button></li>');
    FACET_KEYS.forEach(function (f) {
      state.sel[f].forEach(function (v) {
        chips.push('<li><button type="button" data-rm="' + f + '" data-v="' + esc(v) + '">' + esc(LABELS[f][v]) + ' <span aria-hidden="true">&times;</span><span class="visually-hidden">, remove filter</span></button></li>');
      });
    });
    activeEl.innerHTML = chips.join("");
    document.getElementById("clear-all").hidden = !chips.length;
    if (qHero.value !== state.q && document.activeElement !== qHero) qHero.value = state.q;
    if (qBrowse.value !== state.q && document.activeElement !== qBrowse) qBrowse.value = state.q;
    var nToggle = chips.length;
    document.getElementById("filter-toggle").textContent = (filtersEl.classList.contains("open") ? "Hide filters" : "Show filters") + (nToggle ? " (" + nToggle + ")" : "");
  }
  function update() { writeHash(); render(); }

  filtersEl.addEventListener("change", function (e) {
    var t = e.target;
    if (!t.dataset || !t.dataset.f) return;
    var arr = state.sel[t.dataset.f];
    var i = arr.indexOf(t.value);
    if (t.checked && i < 0) arr.push(t.value);
    if (!t.checked && i > -1) arr.splice(i, 1);
    update();
  });
  var qTimer;
  function onQuery(e) {
    clearTimeout(qTimer);
    var v = e.target.value.trim();
    qTimer = setTimeout(function () { state.q = v; update(); }, 160);
  }
  qBrowse.addEventListener("input", onQuery);
  document.getElementById("hero-search").addEventListener("submit", function (e) {
    e.preventDefault();
    state.q = qHero.value.trim();
    update();
    document.getElementById("browse").scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
    countEl.setAttribute("tabindex", "-1");
    countEl.focus({ preventScroll: true });
  });
  activeEl.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.rm === "q") state.q = "";
    else { var a = state.sel[b.dataset.rm]; a.splice(a.indexOf(b.dataset.v), 1); }
    update();
    countEl.setAttribute("tabindex", "-1");
    countEl.focus();
  });
  function clearAll() { state.q = ""; FACET_KEYS.forEach(function (f) { state.sel[f] = []; }); qHero.value = ""; qBrowse.value = ""; update(); }
  document.getElementById("clear-all").addEventListener("click", clearAll);
  resultsEl.addEventListener("click", function (e) { if (e.target.closest("[data-clear]")) clearAll(); });
  document.getElementById("copy-link").addEventListener("click", function () {
    var btn = this, url = location.href;
    function done(msg) { btn.textContent = msg; setTimeout(function () { btn.textContent = "Copy link to this view"; }, 2200); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { done("Link copied"); }, function () { done("Copy the address bar"); });
    else done("Copy the address bar");
  });
  var toggle = document.getElementById("filter-toggle");
  toggle.addEventListener("click", function () {
    var open = filtersEl.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    render();
  });
  window.addEventListener("hashchange", function () { readHash(); render(); });

  /* ---------- hero, domains, rails, gaps ---------- */
  function reduced() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }
  var sdList = sortList(R.filter(function (r) { return r.geography.indexOf("san-diego") > -1; }));
  var nrList = sortList(R.filter(function (r) { return r.reading_load === "none-picture"; }));
  var lowCount = R.filter(function (r) { return r.reading_load === "low"; }).length;
  var studentCount = R.filter(function (r) { return r.user === "student-facing"; }).length;
  var okCount = R.filter(function (r) { return r.verify_status === "ok"; }).length;

  document.getElementById("hero-stats").innerHTML =
    "<li><b>" + R.length + "</b> free resources</li>" +
    "<li><b>" + sdList.length + "</b> in San Diego</li>" +
    "<li><b>" + okCount + "</b> links confirmed working in October 2026</li>";

  document.getElementById("domain-grid").innerHTML = GROUPS.map(function (g, i) {
    var n = R.filter(function (r) { return (r.purpose || []).some(function (p) { return g.purposes.indexOf(p) > -1; }); }).length;
    return '<button class="domain" type="button" data-group="' + g.key + '" style="background:' + g.color + ';animation-delay:' + (0.25 + i * 0.06) + 's">' +
      shapeSvg(g, 64) + '<span><span class="d-name">' + esc(g.name) + '</span><span class="d-count" style="display:block">' + n + " resources</span></span></button>";
  }).join("");
  document.getElementById("domain-grid").addEventListener("click", function (e) {
    var b = e.target.closest("[data-group]");
    if (!b) return;
    var g = GROUPS.filter(function (x) { return x.key === b.dataset.group; })[0];
    FACET_KEYS.forEach(function (f) { state.sel[f] = []; });
    state.q = "";
    state.sel.purpose = g.purposes.slice();
    update();
    document.getElementById("browse").scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
    countEl.setAttribute("tabindex", "-1");
    countEl.focus({ preventScroll: true });
  });

  document.getElementById("rail-sd").innerHTML = sdList.map(function (r) { return card(r, true); }).join("");
  document.getElementById("sd-sub").textContent =
    sdList.length + " local agencies, programs and directories our students actually get referred to. Call before you refer: staff and programs change.";
  document.getElementById("rail-nr").innerHTML = nrList.map(function (r) { return card(r, true); }).join("");
  document.getElementById("nr-sub").textContent =
    "Honestly, only " + nrList.length + " of the " + studentCount + " student-facing tools here need no reading at all. Plenty of tools that look visual still expect some reading. Another " + lowCount + " are low-reading and work if you read along.";
  document.getElementById("nr-more").addEventListener("click", function (e) {
    e.preventDefault();
    FACET_KEYS.forEach(function (f) { state.sel[f] = []; });
    state.q = "";
    state.sel.reading_load = ["none-picture", "low"];
    update();
    document.getElementById("browse").scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
  });

  document.querySelectorAll(".rail-controls").forEach(function (c) {
    var rail = document.getElementById(c.dataset.rail);
    c.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      rail.scrollBy({ left: +b.dataset.dir * rail.clientWidth * 0.85, behavior: reduced() ? "auto" : "smooth" });
    });
  });

  document.getElementById("gap-list").innerHTML = DATA.known_gaps.map(function (g) {
    return "<li><h3>" + esc(g.gap) + "</h3><p>" + esc(g.detail) + "</p></li>";
  }).join("");
  document.getElementById("removed-summary").textContent = "Links we took out (" + DATA.dead_do_not_link.length + ")";
  document.getElementById("removed-list").innerHTML = DATA.dead_do_not_link.map(function (d) {
    return '<li><div class="r-name">' + esc(d.name) + '</div><div class="r-url">' + esc(d.url) + '</div><span class="r-status">' + esc(d.status) + '</span><p class="r-note">' + esc(d.note) + "</p></li>";
  }).join("");

  /* ---------- reveals ---------- */
  var reveals = document.querySelectorAll(".reveal");
  var isStatic = document.documentElement.classList.contains("static");
  if (isStatic || reduced() || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- go ---------- */
  var hadHash = readHash();
  render();
  if (hadHash) {
    // a shared filtered link: land on the results
    setTimeout(function () { document.getElementById("browse").scrollIntoView(); }, 0);
  }
})();

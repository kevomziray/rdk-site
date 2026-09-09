/* ============================================================
   RDK Emergency Care — admin panel (CMS)
   Loads assets/js/data.js, i18n.js and config.js from the
   GitHub Contents API, lets the owner edit them in friendly
   forms, and commits regenerated files back. GitHub Pages
   redeploys automatically after each save.
   ============================================================ */
(function () {
  "use strict";

  /* ======================= constants ======================= */

  var TOKEN_KEY = "rdk-cms-token";
  var BRANCH_KEY = "rdk-cms-branch";
  var API = "https://api.github.com";
  var FILE_PATHS = {
    data: "assets/js/data.js",
    i18n: "assets/js/i18n.js",
    config: "assets/js/config.js"
  };

  var state = {
    token: null,
    branch: "main",
    user: null,
    repoPrivate: null,
    files: {},   /* key -> { sha, text } */
    model: {
      data: null,   /* { topics, categories, courses, packages, questions, quizTimeBudget, quizRoleFlagship, gallery } */
      i18n: null,   /* { en: {...}, sw: {...} } */
      config: null  /* parsed window.RDK_CONFIG */
    },
    dirty: { data: false, i18n: false, config: false },
    tab: "overview"
  };

  /* ======================= tiny helpers ======================= */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64decode(b64) { return decodeURIComponent(escape(atob(String(b64).replace(/\s/g, "")))); }

  var toastTimer = null;
  function toast(msg, isErr) {
    var el = $("#adm-toast");
    el.textContent = msg;
    el.className = "adm-toast is-on" + (isErr ? " err" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = "adm-toast"; }, 4000);
  }

  function repoId() {
    /* kevomziray.github.io/rdk-site/... -> kevomziray/rdk-site */
    var m = /^([a-z0-9-]+)\.github\.io$/i.exec(location.hostname);
    if (m) {
      var seg = location.pathname.replace(/^\/+/, "").split("/")[0];
      if (seg) return m[1] + "/" + seg;
    }
    return "kevomziray/rdk-site"; /* local preview fallback */
  }

  /* ======================= GitHub API ======================= */

  function gh(method, path, body, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, API + path, true);
    xhr.setRequestHeader("Authorization", "Bearer " + state.token);
    xhr.setRequestHeader("Accept", "application/vnd.github+json");
    xhr.setRequestHeader("X-GitHub-Api-Version", "2022-11-28");
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      var data = null;
      try { data = JSON.parse(xhr.responseText); } catch (e) { /* non-JSON */ }
      cb(xhr.status, data);
    };
    xhr.send(body ? JSON.stringify(body) : null);
  }

  function ghMessage(status, data) {
    if (data && data.message) return data.message + (data.errors ? " (" + data.errors.length + " detail(s))" : "");
    return "GitHub API error " + status;
  }

  /* ======================= parsers =======================
     The site files are JS IIFEs. We evaluate them with a small
     dump hook injected before the closing brace, which exposes
     the data objects without touching the live page.        */

  function runInjected(text, injection) {
    var patched = text.replace(/\}\)\(\);\s*$/, injection + "\n})();\n");
    if (patched === text) throw new Error("file structure not recognised");
    return (new Function(patched))();
  }

  function parseData(text) {
    runInjected(text,
      "window.__rdkAdminDump = { topics: T, categories: CATEGORIES, courses: COURSES, packages: PACKAGES, " +
      "questions: QUESTIONS, quizTimeBudget: QUIZ_TIME_BUDGET, quizRoleFlagship: QUIZ_ROLE_FLAGSHIP, gallery: GALLERY };");
    var d = window.__rdkAdminDump;
    window.__rdkAdminDump = null;
    if (!d || !d.courses || !d.courses.length) throw new Error("data.js parsed but looks empty");
    return d;
  }

  function parseI18n(text) {
    runInjected(text, "window.__rdkI18nDump = DICT;");
    var d = window.__rdkI18nDump;
    window.__rdkI18nDump = null;
    if (!d || !d.en || !d.sw) throw new Error("i18n.js parsed but missing en/sw dictionaries");
    return d;
  }

  function parseConfig(text) {
    var cfg = (new Function(text + "\n;return window.RDK_CONFIG;"))();
    if (!cfg || !cfg.social || !cfg.office) throw new Error("config.js parsed but looks wrong");
    return cfg;
  }

  function parseAll() {
    state.model.data = parseData(state.files.data.text);
    state.model.i18n = parseI18n(state.files.i18n.text);
    state.model.config = parseConfig(state.files.config.text);
    state.dirty = { data: false, i18n: false, config: false };
  }

  /* ======================= generators =======================
     Deterministic templates — the same model always produces
     the same file text, so admin saves make minimal diffs.  */

  function indented(value) {
    return JSON.stringify(value, null, 2).replace(/^/gm, "  ");
  }

  var DATA_EXPORTS = [
    "  /* ---------- exports ---------- */",
    "  window.RDK = {",
    "    topics: T,",
    "    categories: CATEGORIES,",
    "    courses: COURSES,",
    "    packages: PACKAGES,",
    "    questions: QUESTIONS,",
    "    quizTimeBudget: QUIZ_TIME_BUDGET,",
    "    quizRoleFlagship: QUIZ_ROLE_FLAGSHIP,",
    "    gallery: GALLERY,",
    "    courseById: function (id) {",
    "      for (var i = 0; i < COURSES.length; i++) if (COURSES[i].id === id) return COURSES[i];",
    "      return null;",
    "    },",
    "    topicList: function (course, lang) {",
    "      var out = [];",
    "      for (var i = 0; i < course.topics.length; i++) {",
    "        var t = T[course.topics[i]];",
    "        if (t) out.push(t[lang] || t.en);",
    "      }",
    "      return out;",
    "    },",
    "    price: function (tzs) {",
    '      return "TZS " + Number(tzs).toLocaleString("en-GB");',
    "    }",
    "  };"
  ].join("\n");

  var I18N_ENGINE = [
    "  var current = null;",
    "",
    "  function detect() {",
    "    try {",
    '      var saved = localStorage.getItem("rdk-lang");',
    "      if (saved && DICT[saved]) return saved;",
    "    } catch (e) { /* private mode */ }",
    '    var nav = (navigator.language || "en").toLowerCase();',
    '    return nav.indexOf("sw") === 0 ? "sw" : "en";',
    "  }",
    "",
    "  function t(key) {",
    "    var d = DICT[current];",
    "    if (d && Object.prototype.hasOwnProperty.call(d, key)) return d[key];",
    "    var e = DICT.en;",
    "    if (e && Object.prototype.hasOwnProperty.call(e, key)) return e[key];",
    "    return key;",
    "  }",
    "",
    "  function apply(root) {",
    "    var scope = root || document;",
    '    var nodes = scope.querySelectorAll("[data-i18n]");',
    "    for (var i = 0; i < nodes.length; i++) {",
    '      nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));',
    "    }",
    '    var attrs = scope.querySelectorAll("[data-i18n-attr]");',
    "    for (var j = 0; j < attrs.length; j++) {",
    '      var spec = attrs[j].getAttribute("data-i18n-attr").split(":"); // e.g. "placeholder:misc.x"',
    "      if (spec.length === 2) attrs[j].setAttribute(spec[0], t(spec[1]));",
    "    }",
    "  }",
    "",
    "  function setLang(lang, silent) {",
    "    if (!DICT[lang]) lang = \"en\";",
    "    current = lang;",
    "    document.documentElement.lang = lang;",
    '    try { localStorage.setItem("rdk-lang", lang); } catch (e) { }',
    "    apply(document);",
    '    var btns = document.querySelectorAll("[data-lang-btn]");',
    "    for (var i = 0; i < btns.length; i++) {",
    '      btns[i].classList.toggle("is-active", btns[i].getAttribute("data-lang-btn") === lang);',
    "    }",
    "    if (!silent) {",
    '      try { document.dispatchEvent(new CustomEvent("rdk:lang", { detail: { lang: lang } })); }',
    "      catch (e) { /* IE */ }",
    "    }",
    "  }",
    "",
    "  window.RDK_I18N = {",
    "    t: t,",
    "    apply: apply,",
    "    setLang: setLang,",
    "    getLang: function () { return current; },",
    "    dict: DICT",
    "  };",
    "  /* Shorthand used by renderers */",
    "  window.t = t;",
    "",
    '  document.addEventListener("DOMContentLoaded", function () {',
    "    setLang(detect(), true);",
    '    document.dispatchEvent(new CustomEvent("rdk:lang", { detail: { lang: current } }));',
    "  });"
  ].join("\n");

  var CONFIG_HELPER = [
    "/* Build a WhatsApp deep link with a prefilled message. */",
    "window.rdkWhatsApp = function (message) {",
    "  var cfg = window.RDK_CONFIG;",
    '  if (!cfg.whatsapp) return "mailto:" + cfg.email +',
    '    "?subject=" + encodeURIComponent("Training enquiry — RDK Emergency Care") +',
    '    "&body=" + encodeURIComponent(message || "");',
    '  var text = message ? "?text=" + encodeURIComponent(message) : "";',
    '  return "https://wa.me/" + cfg.whatsapp + text;',
    "};"
  ].join("\n");

  function genData(d) {
    return [
      "/* ============================================================",
      "   RDK Emergency Care — content database (EN / SW)",
      "   Generated by the RDK admin panel — please edit there,",
      "   not directly in this file.",
      "   ============================================================ */",
      "(function () {",
      '  "use strict";',
      "",
      "  /* ---------- shared bilingual topic vocabulary ---------- */",
      "  var T =" + indented(d.topics) + ";",
      "",
      "  /* ---------- landing page categories ---------- */",
      "  var CATEGORIES =" + indented(d.categories) + ";",
      "",
      "  /* ---------- courses ---------- */",
      "  var COURSES =" + indented(d.courses) + ";",
      "",
      "  /* ---------- corporate & group packages ---------- */",
      "  var PACKAGES =" + indented(d.packages) + ";",
      "",
      "  /* ---------- quiz: questions, time budgets & flagship map ---------- */",
      "  var QUESTIONS =" + indented(d.questions) + ";",
      "",
      "  var QUIZ_TIME_BUDGET =" + indented(d.quizTimeBudget) + ";",
      "",
      "  var QUIZ_ROLE_FLAGSHIP =" + indented(d.quizRoleFlagship) + ";",
      "",
      "  /* ---------- home page photo gallery ---------- */",
      "  var GALLERY =" + indented(d.gallery) + ";",
      "",
      DATA_EXPORTS,
      "})();",
      ""
    ].join("\n");
  }

  function genI18n(dict) {
    return [
      "/* ============================================================",
      "   RDK Emergency Care — bilingual engine (English / Kiswahili)",
      "   Wording generated by the RDK admin panel; the engine below",
      "   is fixed site code — do not edit by hand.",
      "   ============================================================ */",
      "(function () {",
      '  "use strict";',
      "",
      "  var DICT =" + indented(dict) + ";",
      "",
      I18N_ENGINE,
      "})();",
      ""
    ].join("\n");
  }

  function genConfig(c) {
    return [
      "/* ============================================================",
      "   RDK Emergency Care — site configuration",
      "   Generated by the RDK admin panel — please edit there.",
      "   ============================================================ */",
      "window.RDK_CONFIG =" + indented(c) + ";",
      "",
      CONFIG_HELPER,
      ""
    ].join("\n");
  }

  function generate(key) {
    if (key === "data") return genData(state.model.data);
    if (key === "i18n") return genI18n(state.model.i18n);
    if (key === "config") return genConfig(state.model.config);
    throw new Error("unknown file key " + key);
  }

  /* Exposed for automated round-trip tests */
  window.RDK_ADMIN = {
    parseData: parseData, parseI18n: parseI18n, parseConfig: parseConfig,
    genData: genData, genI18n: genI18n, genConfig: genConfig,
    b64encode: b64encode, b64decode: b64decode, repoId: repoId
  };

  /* ======================= load & save ======================= */

  function loadFile(key, cb) {
    var path = FILE_PATHS[key];
    gh("GET", "/repos/" + repoId() + "/contents/" + path + "?ref=" + encodeURIComponent(state.branch), null,
      function (status, data) {
        if (status !== 200 || !data || typeof data.content !== "string") {
          return cb(new Error("Could not load " + path + " from branch " + state.branch + " — " + ghMessage(status, data)));
        }
        state.files[key] = { sha: data.sha, text: b64decode(data.content) };
        cb(null);
      });
  }

  function loadAll(cb) {
    var keys = Object.keys(FILE_PATHS);
    var left = keys.length;
    var firstErr = null;
    keys.forEach(function (k) {
      loadFile(k, function (err) {
        if (err && !firstErr) firstErr = err;
        if (--left === 0) {
          if (firstErr) return cb(firstErr);
          try { parseAll(); } catch (e) { return cb(e); }
          cb(null);
        }
      });
    });
  }

  function commitFile(key, message, cb) {
    var path = FILE_PATHS[key];
    var text = generate(key);
    gh("PUT", "/repos/" + repoId() + "/contents/" + path, {
      message: message,
      content: b64encode(text),
      sha: state.files[key].sha,
      branch: state.branch
    }, function (status, data) {
      if ((status === 200 || status === 201) && data && data.content) {
        state.files[key].sha = data.content.sha;
        state.files[key].text = text;
        state.dirty[key] = false;
        cb(null);
      } else if (status === 409 || status === 422) {
        cb(new Error(path + " was changed on GitHub after you loaded it. Copy any edits you need, click “Reload from GitHub”, then make them again."));
      } else {
        cb(new Error(path + ": " + ghMessage(status, data)));
      }
    });
  }

  /* ======================= UI ======================= */

  function startUI() {
    document.body.classList.add("adm");
    document.body.insertAdjacentHTML("beforeend", '<div class="adm-toast" id="adm-toast"></div>');
    state.token = localStorage.getItem(TOKEN_KEY) || null;
    state.branch = localStorage.getItem(BRANCH_KEY) || "main";
    render();

    window.addEventListener("beforeunload", function (e) {
      if (state.dirty.data || state.dirty.i18n || state.dirty.config) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  }

  function dirtyCount() {
    return (state.dirty.data ? 1 : 0) + (state.dirty.i18n ? 1 : 0) + (state.dirty.config ? 1 : 0);
  }

  function markDirty(key) {
    state.dirty[key] = true;
    updateSavePill();
  }

  function updateSavePill() {
    var btn = $("#adm-save");
    if (!btn) return;
    var n = dirtyCount();
    if (n === 0) { btn.textContent = "No changes"; btn.className = "adm-save-pill is-clean"; btn.disabled = true; }
    else { btn.textContent = "Review & save (" + n + " file" + (n > 1 ? "s" : "") + ")"; btn.className = "adm-save-pill"; btn.disabled = false; }
  }

  /* ---------- login view ---------- */

  function renderLogin() {
    $("#admin-root").innerHTML =
      '<div class="adm-login"><div class="adm-login-card">' +
      '<img src="assets/img/rdk-logo.png" alt="RDK Emergency Care">' +
      "<h1>RDK Admin — website editor</h1>" +
      '<p class="sub">Log in with a GitHub token to edit courses, text and photos on the live site.</p>' +
      '<div class="adm-steps"><strong>One-time setup — create your token:</strong>' +
      "<ol>" +
      "<li>Go to <strong>github.com → Settings → Developer settings → Fine-grained tokens → Generate new token</strong>.</li>" +
      "<li><strong>Repository access:</strong> choose <em>Only select repositories</em> → pick <code>" + esc(repoId()) + "</code>.</li>" +
      "<li><strong>Permissions → Repository permissions → Contents:</strong> set to <em>Read and write</em>. Leave everything else as <em>No access</em>.</li>" +
      "<li>Generate, copy the token (starts with <code>github_pat_</code>) and paste it below.</li>" +
      "</ol></div>" +
      '<div class="adm-field"><label for="adm-token">GitHub token</label>' +
      '<input type="password" id="adm-token" placeholder="github_pat_…" autocomplete="off"></div>' +
      '<div class="adm-error" id="adm-login-err"></div>' +
      '<button class="adm-btn accent" id="adm-connect">Connect</button>' +
      '<p class="adm-note" style="margin-top:1rem;">The token is stored only in this browser (localStorage). Use <em>Logout</em> on shared computers. ' +
      "This page is unlisted and hidden from search engines.</p>" +
      "</div></div>";

    function connect() {
      var token = $("#adm-token").value.trim();
      var err = $("#adm-login-err");
      err.classList.remove("is-on");
      if (!token) { err.textContent = "Please paste your token first."; err.classList.add("is-on"); return; }
      $("#adm-connect").disabled = true;
      $("#adm-connect").textContent = "Connecting…";
      state.token = token;
      gh("GET", "/user", null, function (status, data) {
        if (status === 200 && data && data.login) {
          state.user = data.login;
          gh("GET", "/repos/" + repoId(), null, function (s2, repo) {
            if (s2 === 200 && repo) {
              state.repoPrivate = !!repo.private;
              localStorage.setItem(TOKEN_KEY, token);
              localStorage.setItem(BRANCH_KEY, state.branch);
              render();
              loadAll(function (e) {
                if (e) { toast(e.message, true); state.token = null; localStorage.removeItem(TOKEN_KEY); renderLogin(); return; }
                toast("Connected — content loaded from branch “" + state.branch + "”.");
                render();
              });
              renderLoading();
            } else {
              showErr("Token works, but cannot see the repository " + repoId() + ". Check that the token grants access to exactly this repo (Contents: Read and write).");
            }
          });
        } else if (status === 401) {
          showErr("That token was rejected. Generate a fresh one and paste it again.");
        } else {
          showErr(ghMessage(status, data));
        }
      });
      function showErr(msg) {
        $("#adm-connect").disabled = false;
        $("#adm-connect").textContent = "Connect";
        err.textContent = msg;
        err.classList.add("is-on");
        state.token = localStorage.getItem(TOKEN_KEY) || null;
      }
    }

    $("#adm-connect").addEventListener("click", connect);
    $("#adm-token").addEventListener("keydown", function (e) { if (e.key === "Enter") connect(); });
  }

  function renderLoading() {
    $("#admin-root").innerHTML =
      '<div class="adm-topbar"><img src="assets/img/rdk-logo.png" alt=""><span class="title">RDK Admin</span>' +
      '<span class="meta">loading content from GitHub…</span></div>' +
      '<div class="adm-loading">Loading…</div>';
  }

  /* ---------- app shell ---------- */

  function render() {
    if (!state.token) { renderLogin(); return; }
    if (!state.model.config) { renderLoading(); return; }
    renderApp();
  }

  function renderApp() {
    var n = dirtyCount();
    $("#admin-root").innerHTML =
      '<header class="adm-topbar">' +
      '<img src="assets/img/rdk-logo.png" alt="">' +
      '<span class="title">RDK Admin</span>' +
      '<span class="meta">' + esc(repoId()) + " · " + esc(state.user || "") + (state.repoPrivate ? " · private" : "") + "</span>" +
      '<span class="spacer"></span>' +
      '<label class="meta">Branch <select id="adm-branch"><option value="main">main (live)</option><option value="cms-test"' +
      (state.branch === "cms-test" ? " selected" : "") + '>cms-test (safe test)</option></select></label>' +
      '<button class="adm-save-pill' + (n ? "" : " is-clean") + '" id="adm-save"' + (n ? "" : " disabled") + ">" +
      (n ? "Review & save (" + n + " file" + (n > 1 ? "s" : "") + ")" : "No changes") + "</button>" +
      '<button class="adm-btn ghost sm" id="adm-reload">Reload</button>' +
      '<button class="adm-btn ghost sm" id="adm-logout">Logout</button>' +
      "</header>" +
      '<div class="adm-body">' +
      '<nav class="adm-side" id="adm-side"></nav>' +
      '<main class="adm-main" id="adm-main"></main>' +
      "</div>";

    wireChrome();
    renderSide();
    renderTab();
  }

  var TABS = [
    { id: "overview", label: "Overview" },
    { id: "settings", label: "Settings" },
    { id: "courses", label: "Courses", soon: true },
    { id: "packages", label: "Packages", soon: true },
    { id: "vocab", label: "Categories & Topics", soon: true },
    { id: "text", label: "Site text", soon: true },
    { id: "photos", label: "Photos", soon: true }
  ];

  function renderSide() {
    $("#adm-side").innerHTML = TABS.map(function (t) {
      return "<button data-tab=\"" + t.id + "\"" + (state.tab === t.id ? " class=\"is-active\"" : "") + ">" +
        t.label + (t.soon ? ' <span class="soon">soon</span>' : "") + "</button>";
    }).join("");
    $$("#adm-side button").forEach(function (b) {
      b.addEventListener("click", function () {
        var tab = TABS.filter(function (t) { return t.id === b.getAttribute("data-tab"); })[0];
        if (tab.soon) { toast("“" + tab.label + "” is the next tab being built — Settings works now."); return; }
        state.tab = tab.id;
        renderSide();
        renderTab();
      });
    });
  }

  function wireChrome() {
    $("#adm-logout").addEventListener("click", function () {
      if (dirtyCount() && !confirm("You have unsaved changes. Log out anyway?")) return;
      localStorage.removeItem(TOKEN_KEY);
      state.token = null; state.user = null; state.model = { data: null, i18n: null, config: null };
      render();
    });
    $("#adm-reload").addEventListener("click", function () {
      if (dirtyCount() && !confirm("Discard your unsaved edits and reload from GitHub?")) return;
      loadAll(function (err) {
        if (err) { toast(err.message, true); return; }
        toast("Reloaded from GitHub.");
        render();
      });
    });
    $("#adm-branch").addEventListener("change", function () {
      if (dirtyCount() && !confirm("Switching branch discards unsaved edits. Continue?")) {
        $("#adm-branch").value = state.branch; return;
      }
      state.branch = $("#adm-branch").value;
      localStorage.setItem(BRANCH_KEY, state.branch);
      loadAll(function (err) {
        if (err) { toast(err.message, true); return; }
        toast("Now editing branch “" + state.branch + "”.");
        render();
      });
    });
    $("#adm-save").addEventListener("click", openSaveModal);
  }

  /* ---------- tabs ---------- */

  function renderTab() {
    var main = $("#adm-main");
    if (state.tab === "overview") renderOverview(main);
    else if (state.tab === "settings") renderSettings(main);
  }

  function fileStatusRow(label, key) {
    var f = state.files[key];
    return "<dt>" + label + "</dt><dd>" + (f ? "<span class=\"sha\">" + f.sha.slice(0, 8) + "</span> " : "") +
      '<span class="adm-status ' + (state.dirty[key] ? "dirty" : "ok") + '">' +
      (state.dirty[key] ? "unsaved edits" : "in sync") + "</span></dd>";
  }

  function renderOverview(main) {
    var d = state.model.data;
    main.innerHTML =
      "<h2>Overview</h2>" +
      '<p class="lead">Everything you save here is committed to GitHub — the live site updates about a minute later.</p>' +
      '<div class="adm-panel"><h3>Content on branch “' + esc(state.branch) + "”</h3>" +
      '<dl class="adm-kv">' +
      "<dt>Courses</dt><dd>" + d.courses.length + " (" + d.courses.filter(function (c) { return c.featured; }).length + " featured)</dd>" +
      "<dt>Packages</dt><dd>" + d.packages.length + "</dd>" +
      "<dt>Topics vocabulary</dt><dd>" + Object.keys(d.topics).length + " entries</dd>" +
      "<dt>Quiz questions</dt><dd>" + d.questions.length + "</dd>" +
      "<dt>Gallery photos</dt><dd>" + d.gallery.length + "</dd>" +
      "<dt>Text keys</dt><dd>" + Object.keys(state.model.i18n.en).length + " EN / " + Object.keys(state.model.i18n.sw).length + " SW</dd>" +
      fileStatusRow("assets/js/data.js", "data") +
      fileStatusRow("assets/js/i18n.js", "i18n") +
      fileStatusRow("assets/js/config.js", "config") +
      "</dl></div>" +
      '<div class="adm-panel"><h3>How saving works</h3>' +
      '<p class="adm-muted">Edits are held in this tab until you press <strong>Review &amp; save</strong>. ' +
      "Saving commits the changed files to GitHub with the SHA you loaded, so if anything changed on GitHub in the " +
      "meantime the panel warns you instead of overwriting it.</p>" +
      '<p class="adm-muted">Use the <strong>cms-test</strong> branch to try things safely — it never affects the live site. ' +
      "Switch back to <strong>main</strong> for real edits.</p></div>";
  }

  function field(label, id, value, placeholder) {
    return '<div class="adm-field"><label for="' + id + '">' + esc(label) + "</label>" +
      '<input id="' + id + '" value="' + esc(value) + '"' + (placeholder ? ' placeholder="' + esc(placeholder) + '"' : "") + "></div>";
  }

  function renderSettings(main) {
    var c = state.model.config;
    main.innerHTML =
      "<h2>Settings</h2>" +
      '<p class="lead">Contact channels, social links, office address and legal numbers used across the site.</p>' +

      '<div class="adm-panel"><h3>Contact</h3><div class="adm-grid2">' +
      field("WhatsApp number (digits only, international format)", "set-wa", c.whatsapp, "255684114433") +
      field("WhatsApp display text", "set-wa-display", c.whatsappDisplay, "+255 684 114 433") +
      field("Email address", "set-email", c.email, "info@rdk.co.tz") +
      "</div></div>" +

      '<div class="adm-panel"><h3>Social profiles</h3><p class="adm-muted">Leave a field empty to hide that icon on the site.</p><div class="adm-grid2">' +
      field("Instagram URL", "set-ig", (c.social || {}).instagram || "") +
      field("Facebook URL", "set-fb", (c.social || {}).facebook || "") +
      field("TikTok URL", "set-tt", (c.social || {}).tiktok || "") +
      "</div></div>" +

      '<div class="adm-panel"><h3>Head office</h3><div class="adm-grid2">' +
      field("Address line 1", "set-office1", (c.office || {}).line1 || "") +
      field("Address line 2", "set-office2", (c.office || {}).line2 || "") +
      field("City / country", "set-office3", (c.office || {}).city || "") +
      "</div></div>" +

      '<div class="adm-panel"><h3>Legal & compliance</h3><div class="adm-grid2">' +
      field("Incorporation No.", "set-legal1", (c.legal || {}).incorporationNo || "") +
      field("Business license", "set-legal2", (c.legal || {}).businessLicense || "") +
      field("TIN", "set-legal3", (c.legal || {}).tin || "") +
      "</div></div>";

    var map = [
      ["set-wa", ["whatsapp"]],
      ["set-wa-display", ["whatsappDisplay"]],
      ["set-email", ["email"]],
      ["set-ig", ["social", "instagram"]],
      ["set-fb", ["social", "facebook"]],
      ["set-tt", ["social", "tiktok"]],
      ["set-office1", ["office", "line1"]],
      ["set-office2", ["office", "line2"]],
      ["set-office3", ["office", "city"]],
      ["set-legal1", ["legal", "incorporationNo"]],
      ["set-legal2", ["legal", "businessLicense"]],
      ["set-legal3", ["legal", "tin"]]
    ];
    map.forEach(function (pair) {
      var input = $("#" + pair[0]);
      input.addEventListener("input", function () {
        var obj = c;
        var path = pair[1];
        for (var i = 0; i < path.length - 1; i++) obj = obj[path[i]];
        obj[path[path.length - 1]] = input.value;
        markDirty("config");
      });
    });
  }

  /* ---------- save modal ---------- */

  function openSaveModal() {
    var keys = ["config", "data", "i18n"].filter(function (k) { return state.dirty[k]; });
    var mask = document.createElement("div");
    mask.className = "adm-modal-mask";
    mask.innerHTML =
      '<div class="adm-modal"><h3>Review &amp; save</h3>' +
      '<p class="adm-muted">These files will be committed to <strong>' + esc(state.branch) + "</strong>" +
      (state.branch === "main" ? " — the live site updates in about a minute." : " — this branch is NOT the live site.") + "</p>" +
      "<ul>" + keys.map(function (k) { return "<li><code>" + FILE_PATHS[k] + "</code></li>"; }).join("") + "</ul>" +
      '<div class="adm-field"><label for="adm-commit-msg">Commit message</label>' +
      '<input id="adm-commit-msg" value="CMS: update settings"></div>' +
      '<div class="row">' +
      '<button class="adm-btn ghost" id="adm-cancel">Cancel</button>' +
      '<button class="adm-btn accent" id="adm-confirm">Save ' + keys.length + " file" + (keys.length > 1 ? "s" : "") + "</button>" +
      "</div></div>";
    document.body.appendChild(mask);

    function close() { mask.remove(); }
    $("#adm-cancel", mask).addEventListener("click", close);
    mask.addEventListener("click", function (e) { if (e.target === mask) close(); });
    $("#adm-confirm", mask).addEventListener("click", function () {
      var msg = $("#adm-commit-msg", mask).value.trim() || "CMS: update";
      var btn = $("#adm-confirm", mask);
      btn.disabled = true; btn.textContent = "Saving…";
      var i = 0;
      (function next() {
        if (i >= keys.length) {
          close();
          toast("Saved to " + state.branch + (state.branch === "main" ? " — live in ~1 minute." : "."));
          renderApp();
          return;
        }
        var k = keys[i++];
        commitFile(k, msg, function (err) {
          if (err) {
            btn.disabled = false; btn.textContent = "Save";
            toast(err.message, true);
            if (k === "config" && /changed on GitHub/.test(err.message)) close();
            return;
          }
          toast("Committed " + FILE_PATHS[k] + "…");
          next();
        });
      })();
    });
  }

  /* ---------- boot ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("admin-root")) return;
    startUI();
  });
})();

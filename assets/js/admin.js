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
    tab: "overview",
    ui: {} /* per-tab view state (edit modes, filters) */
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

  function pendingUploads() {
    return (state.ui.photos && state.ui.photos.uploads) || [];
  }

  function updateSavePill() {
    var btn = $("#adm-save");
    if (!btn) return;
    var n = dirtyCount() + pendingUploads().length;
    if (n === 0) { btn.textContent = "No changes"; btn.className = "adm-save-pill is-clean"; btn.disabled = true; }
    else { btn.textContent = "Review & save (" + n + " change" + (n > 1 ? "s" : "") + ")"; btn.className = "adm-save-pill"; btn.disabled = false; }
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
    { id: "courses", label: "Courses" },
    { id: "packages", label: "Packages" },
    { id: "vocab", label: "Categories & Topics" },
    { id: "text", label: "Site text" },
    { id: "photos", label: "Photos" }
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
    else if (state.tab === "courses") renderCourses(main);
    else if (state.tab === "packages") renderPackages(main);
    else if (state.tab === "vocab") renderVocab(main);
    else if (state.tab === "text") renderText(main);
    else if (state.tab === "photos") renderPhotos(main);
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

  /* ---------- shared form helpers for bilingual model objects ---------- */

  function biRow(label, obj, prop, rows1, rows2) {
    var id = "f-" + prop + "-" + Math.floor(Math.random() * 1e6).toString(36);
    var ta = function (lang, rows) {
      var v = (obj[prop] && obj[prop][lang]) || "";
      if (rows) return '<textarea id="' + id + "-" + lang + '" rows="' + rows + '">' + esc(v) + "</textarea>";
      return '<input id="' + id + "-" + lang + '" value="' + esc(v) + '">';
    };
    return '<div class="adm-field"><label>' + esc(label) + '</label><div class="bi-pair">' +
      '<div class="bi-cell"><span class="bi-lang">EN</span>' + ta("en", rows1) + "</div>" +
      '<div class="bi-cell"><span class="bi-lang">SW</span>' + ta("sw", rows2 || rows1) + "</div>" +
      "</div></div>";
  }
  function numRow(label, obj, prop, step) {
    var id = "n-" + prop + "-" + Math.floor(Math.random() * 1e6).toString(36);
    return '<div class="adm-field"><label for="' + id + '">' + esc(label) + "</label>" +
      '<input type="number" id="' + id + '" step="' + (step || 1) + '" value="' + esc(obj[prop] == null ? "" : obj[prop]) + '"></div>';
  }
  function txtRow(label, obj, prop, ph) {
    var id = "t-" + prop + "-" + Math.floor(Math.random() * 1e6).toString(36);
    return '<div class="adm-field"><label for="' + id + '">' + esc(label) + "</label>" +
      '<input id="' + id + '" value="' + esc(obj[prop] == null ? "" : obj[prop]) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : "") + "></div>";
  }
  function checkRow(label, obj, prop, hint) {
    var id = "c-" + prop + "-" + Math.floor(Math.random() * 1e6).toString(36);
    return '<div class="adm-check"><input type="checkbox" id="' + id + '"' + (obj[prop] ? " checked" : "") + ">" +
      '<label for="' + id + '">' + esc(label) + "</label>" + (hint ? '<span class="adm-note"> — ' + esc(hint) + "</span>" : "") + "</div>";
  }
  /* wire a generated input back into the model; skips helper controls
     (search filters, checkbox lists wired separately) */
  function wireInputs(root, apply) {
    $$("input, textarea, select", root).forEach(function (el) {
      if (el.getAttribute("data-cat") || el.getAttribute("data-topic") || el.id === "crs-topic-filter") return;
      var handler = function () { apply(el); markDirty("data"); };
      if (el.type === "checkbox" || el.tagName === "SELECT") el.addEventListener("change", handler);
      else el.addEventListener("input", handler);
    });
  }

  /* ======================= Courses tab ======================= */

  var ROLE_HINT = "parent, teacher, office, hospitality, driver, security, industrial, healthcare, coach, student, abroad, general";
  var ENV_HINT = "home, school, office, industrial, road, outdoors, public, events";

  function renderCourses(main) {
    var ui = state.ui.courses = state.ui.courses || { mode: "list", showArchived: false };
    var courses = state.model.data.courses;
    if (ui.mode === "edit") {
      var isNew = ui.id === "__new__";
      var c = isNew ? ui.draft : courses.filter(function (x) { return x.id === ui.id; })[0];
      if (!c) { ui.mode = "list"; } else { return renderCourseEditor(main, c, isNew, ui); }
    }
    renderCourseList(main);
  }

  function renderCourseList(main) {
    var ui = state.ui.courses;
    var courses = state.model.data.courses;
    var rows = courses.filter(function (c) { return ui.showArchived || !c.hidden; }).map(function (c) {
      var flags =
        (c.featured ? '<span class="adm-tag ok">featured</span>' : "") +
        (c.abroad && c.abroad.length ? '<span class="adm-tag">abroad</span>' : "") +
        (c.hidden ? '<span class="adm-tag warn">archived</span>' : "");
      return "<tr" + (c.hidden ? ' class="is-archived"' : "") + ">" +
        "<td><strong>" + esc(biText(c.name)) + "</strong><div class=\"adm-note\">" + esc(c.id) + "</div></td>" +
        "<td>" + (c.price ? "TZS " + Number(c.price).toLocaleString("en-GB") : "—") + "</td>" +
        "<td>" + esc(biText(c.duration)) + "</td>" +
        "<td>" + (c.cats ? c.cats.length : 0) + " / " + (c.topics ? c.topics.length : 0) + "</td>" +
        "<td>" + (flags || "—") + "</td>" +
        '<td><button class="adm-btn ghost sm" data-edit="' + esc(c.id) + '">Edit</button></td>' +
        "</tr>";
    }).join("");
    main.innerHTML =
      "<h2>Courses</h2>" +
      '<p class="lead">The training catalogue — shown on the home page, the training page and inside the quiz. Archiving hides a course everywhere without deleting it.</p>' +
      '<div class="adm-panel adm-toolbar">' +
      '<button class="adm-btn accent sm" id="crs-add">+ Add course</button>' +
      '<label class="adm-check" style="margin-left:1rem;"><input type="checkbox" id="crs-arch"' + (ui.showArchived ? " checked" : "") + "> Show archived</label>" +
      '<span class="adm-note">' + courses.length + " courses total</span>" +
      "</div>" +
      '<div class="adm-panel adm-tablewrap"><table class="adm-table"><thead><tr>' +
      "<th>Course</th><th>Price</th><th>Duration</th><th>Cats/Topics</th><th>Flags</th><th></th>" +
      "</tr></thead><tbody>" + (rows || '<tr><td colspan="6" class="adm-note">No courses.</td></tr>') + "</tbody></table></div>";
    $("#crs-add").addEventListener("click", function () {
      ui.mode = "edit";
      ui.id = "__new__";
      ui.draft = {
        id: "", cats: [], hours: 8, price: 100000,
        name: { en: "", sw: "" }, audience: { en: "", sw: "" }, duration: { en: "1 day", sw: "Siku 1" },
        topics: [], roles: ["general"], env: []
      };
      renderTab();
    });
    $("#crs-arch").addEventListener("change", function () { ui.showArchived = this.checked; renderTab(); });
    $$("[data-edit]", main).forEach(function (b) {
      b.addEventListener("click", function () { ui.mode = "edit"; ui.id = b.getAttribute("data-edit"); renderTab(); });
    });
  }

  function biText(o) { return o ? (o.en || o.sw || "") : ""; }

  function renderCourseEditor(main, c, isNew, ui) {
    var d = state.model.data;
    var topicKeys = Object.keys(d.topics);
    var catBoxes = d.categories.map(function (cat) {
      return '<label class="adm-check"><input type="checkbox" data-cat="' + esc(cat.id) + '"' +
        (c.cats.indexOf(cat.id) !== -1 ? " checked" : "") + "> " + esc(biText(cat.name)) + ' <span class="adm-note">(' + esc(cat.id) + ")</span></label>";
    }).join("");

    main.innerHTML =
      '<h2>' + (isNew ? "Add course" : "Edit course") + "</h2>" +
      '<p class="lead"><a href="#" id="crs-back">← Back to the course list</a></p>' +

      '<div class="adm-panel"><h3>Basics</h3><div class="adm-grid2">' +
      (isNew
        ? txtRow("Course id (lowercase-with-dashes, permanent)", c, "id", "e.g. advanced-first-aid")
        : '<div class="adm-field"><label>Course id</label><input value="' + esc(c.id) + '" disabled><p class="adm-note">The id is permanent — it is used in links.</p></div>') +
      numRow("Price (TZS per person)", c, "price", 1000) +
      numRow("Teaching hours (quiz time matching)", c, "hours", 0.5) +
      "</div>" +
      biRow("Course name", c, "name") +
      biRow("Duration label (shown on cards)", c, "duration") +
      biRow("Who it is for (audience line)", c, "audience") +
      biRow("Optional note (e.g. bundle info — leave empty if none)", c, "note") +
      "</div>" +

      '<div class="adm-panel"><h3>Classification</h3>' +
      '<div class="adm-field"><label>Categories</label><div class="adm-checkgrid">' + catBoxes + "</div></div>" +
      txtRow("Quiz role tags (comma-separated)", c, "roles", ROLE_HINT) +
      txtRow("Quiz environment tags (comma-separated)", c, "env", ENV_HINT) +
      '<div class="adm-checkgrid">' +
      checkRow("Featured on the home page", c, "featured") +
      checkRow("Recognised for working abroad (quiz)", c, "abroadFlag") +
      checkRow("Refresher course (quiz: “trained before”)", c, "refresher") +
      checkRow("School-focused course", c, "school") +
      checkRow("Archived — hide from the whole site", c, "hidden") +
      "</div></div>" +

      '<div class="adm-panel"><h3>Topics covered</h3>' +
      '<div class="adm-field"><label>Filter topics</label><input id="crs-topic-filter" placeholder="Type to filter…"></div>' +
      '<div class="adm-checkgrid adm-topics" id="crs-topics"></div>' +
      '<p class="adm-note">Selected: <span id="crs-topic-count">' + c.topics.length + "</span> topics. Manage the vocabulary itself under Categories &amp; Topics.</p></div>" +

      '<div class="adm-panel adm-toolbar">' +
      '<button class="adm-btn accent" id="crs-save">Keep changes</button>' +
      '<span class="adm-note">Changes are held in this tab until you press Review &amp; save at the top.</span>' +
      "</div>";

    /* ---- topics checkbox list with filter ---- */
    function topicBoxes(filter) {
      var f = (filter || "").toLowerCase();
      return topicKeys.map(function (k) {
        var t = d.topics[k];
        var label = (t.en || "") + " / " + (t.sw || "");
        if (f && k.indexOf(f) === -1 && label.toLowerCase().indexOf(f) === -1) return "";
        return '<label class="adm-check"><input type="checkbox" data-topic="' + esc(k) + '"' +
          (c.topics.indexOf(k) !== -1 ? " checked" : "") + "> <span>" + esc(t.en || k) + ' <span class="adm-note">' + esc(k) + "</span></span></label>";
      }).join("") || '<p class="adm-note">No topic matches.</p>';
    }
    var topicBox = $("#crs-topics");
    topicBox.innerHTML = topicBoxes("");
    $("#crs-topic-filter").addEventListener("input", function () {
      topicBox.innerHTML = topicBoxes(this.value);
      wireTopicBoxes();
    });
    function wireTopicBoxes() {
      $$("[data-topic]", topicBox).forEach(function (box) {
        box.addEventListener("change", function () {
          var k = box.getAttribute("data-topic");
          var i = c.topics.indexOf(k);
          if (box.checked && i === -1) c.topics.push(k);
          if (!box.checked && i !== -1) c.topics.splice(i, 1);
          c.topics = topicKeys.filter(function (tk) { return c.topics.indexOf(tk) !== -1; });
          $("#crs-topic-count").textContent = c.topics.length;
          markDirty("data");
        });
      });
    }
    wireTopicBoxes();

    /* ---- wiring ---- */
    wireInputs(main, function (el) {
      var num = el.type === "number";
      var v = num ? (el.value === "" ? null : Number(el.value)) : el.value;
      if (el.id.indexOf("f-name-") === 0) c.name[el.id.slice(-2)] = el.value;
      else if (el.id.indexOf("f-duration-") === 0) c.duration[el.id.slice(-2)] = el.value;
      else if (el.id.indexOf("f-audience-") === 0) c.audience[el.id.slice(-2)] = el.value;
      else if (el.id.indexOf("f-note-") === 0) {
        c.note = c.note || {};
        c.note[el.id.slice(-2)] = el.value;
        if (!c.note.en && !c.note.sw) delete c.note;
      } else if (el.id.indexOf("n-price-") === 0) c.price = v;
      else if (el.id.indexOf("n-hours-") === 0) c.hours = v;
      else if (el.id.indexOf("t-id-") === 0) c.id = el.value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
      else if (el.id.indexOf("t-roles-") === 0) c.roles = el.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      else if (el.id.indexOf("t-env-") === 0) c.env = el.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      else if (el.id.indexOf("c-featured-") === 0) c.featured = el.checked;
      else if (el.id.indexOf("c-abroadFlag-") === 0) c.abroad = el.checked ? (c.abroad && c.abroad.length ? c.abroad : ["general"]) : undefined;
      else if (el.id.indexOf("c-refresher-") === 0) c.refresher = el.checked || undefined;
      else if (el.id.indexOf("c-school-") === 0) c.school = el.checked || undefined;
      else if (el.id.indexOf("c-hidden-") === 0) c.hidden = el.checked || undefined;
    });
    $$("[data-cat]", main).forEach(function (box) {
      box.addEventListener("change", function () {
        var k = box.getAttribute("data-cat");
        var i = c.cats.indexOf(k);
        if (box.checked && i === -1) c.cats.push(k);
        if (!box.checked && i !== -1) c.cats.splice(i, 1);
        markDirty("data");
      });
    });

    $("#crs-back").addEventListener("click", function (e) { e.preventDefault(); state.ui.courses.mode = "list"; renderTab(); });
    $("#crs-save").addEventListener("click", function () {
      if (isNew) {
        if (!/^[a-z0-9-]+$/.test(c.id || "")) { toast("Give the course a valid id first (lowercase letters, numbers, dashes).", true); return; }
        if (!c.name.en && !c.name.sw) { toast("Give the course a name first.", true); return; }
        if (state.model.data.courses.some(function (x) { return x.id === c.id; })) { toast("A course with this id already exists.", true); return; }
        state.model.data.courses.push(c);
        ui.id = c.id;
        ui.draft = null;
        toast("Course added to the list — remember to Review & save.");
      } else {
        toast("Changes kept — remember to Review & save.");
      }
      ui.mode = "list";
      renderTab();
    });
  }

  /* ======================= Packages tab ======================= */

  function renderPackages(main) {
    var ui = state.ui.packages = state.ui.packages || { mode: "list" };
    var pkgs = state.model.data.packages;
    if (ui.mode === "edit") {
      var isNew = ui.id === "__new__";
      var p = isNew ? ui.draft : pkgs.filter(function (x) { return x.id === ui.id; })[0];
      if (!p) ui.mode = "list";
      else return renderPackageEditor(main, p, isNew, ui);
    }
    var rows = pkgs.map(function (p) {
      return "<tr><td><strong>" + esc(biText(p.name)) + "</strong><div class=\"adm-note\">" + esc(p.id) + "</div></td>" +
        "<td>" + (p.group ? "up to " + p.group : "—") + "</td>" +
        "<td>" + (p.price ? "TZS " + Number(p.price).toLocaleString("en-GB") + (p.priceNote ? "+" : "") : "—") + "</td>" +
        "<td>" + (p.popular ? '<span class="adm-tag ok">most popular</span>' : "") + "</td>" +
        '<td><button class="adm-btn ghost sm" data-edit="' + esc(p.id) + '">Edit</button></td></tr>';
    }).join("");
    main.innerHTML =
      "<h2>Packages</h2>" +
      '<p class="lead">Corporate & group offers shown on the home page, the training page and in quiz results for teams.</p>' +
      '<div class="adm-panel adm-toolbar"><button class="adm-btn accent sm" id="pkg-add">+ Add package</button>' +
      '<span class="adm-note">' + pkgs.length + " packages</span></div>" +
      '<div class="adm-panel adm-tablewrap"><table class="adm-table"><thead><tr>' +
      "<th>Package</th><th>Group</th><th>Price</th><th>Flags</th><th></th></tr></thead><tbody>" + rows + "</tbody></table></div>";
    $("#pkg-add").addEventListener("click", function () {
      ui.mode = "edit"; ui.id = "__new__";
      ui.draft = {
        id: "", group: 15, price: 1500000, popular: false,
        name: { en: "", sw: "" }, audience: { en: "", sw: "" },
        features: { en: [], sw: [] }
      };
      renderTab();
    });
    $$("[data-edit]", main).forEach(function (b) {
      b.addEventListener("click", function () { ui.mode = "edit"; ui.id = b.getAttribute("data-edit"); renderTab(); });
    });
  }

  function renderPackageEditor(main, p, isNew, ui) {
    main.innerHTML =
      "<h2>" + (isNew ? "Add package" : "Edit package") + "</h2>" +
      '<p class="lead"><a href="#" id="pkg-back">← Back to the package list</a></p>' +
      '<div class="adm-panel"><h3>Basics</h3>' +
      (isNew ? txtRow("Package id (lowercase-with-dashes, permanent)", p, "id") :
        '<div class="adm-field"><label>Package id</label><input value="' + esc(p.id) + '" disabled></div>') +
      biRow("Package name", p, "name") +
      biRow("Who it is for", p, "audience") +
      '<div class="adm-grid2">' +
      numRow("Group size (people included — leave empty if quote-based)", p, "group") +
      numRow("Price (TZS)", p, "price", 100000) +
      "</div>" +
      biRow("Price note (optional “from…” line — leave empty if none)", p, "priceNote") +
      '<div class="adm-checkgrid">' + checkRow("Show “Most popular” badge", p, "popular") + "</div></div>" +
      '<div class="adm-panel"><h3>Feature list (one per line)</h3>' +
      '<div class="adm-field"><label>Features — English</label>' +
      '<textarea id="pkg-feat-en" rows="6">' + esc((p.features.en || []).join("\n")) + "</textarea></div>" +
      '<div class="adm-field"><label>Features — Kiswahili</label>' +
      '<textarea id="pkg-feat-sw" rows="6">' + esc((p.features.sw || []).join("\n")) + "</textarea></div>" +
      "</div>" +
      '<div class="adm-panel adm-toolbar"><button class="adm-btn accent" id="pkg-save">Keep changes</button>' +
      '<span class="adm-note">Held in this tab until Review &amp; save.</span></div>';

    wireInputs(main, function (el) {
      if (el.id.indexOf("f-name-") === 0) p.name[el.id.slice(-2)] = el.value;
      else if (el.id.indexOf("f-audience-") === 0) p.audience[el.id.slice(-2)] = el.value;
      else if (el.id.indexOf("f-priceNote-") === 0) {
        p.priceNote = p.priceNote || {};
        p.priceNote[el.id.slice(-2)] = el.value;
        if (!p.priceNote.en && !p.priceNote.sw) delete p.priceNote;
      } else if (el.id === "pkg-feat-en") p.features.en = el.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      else if (el.id === "pkg-feat-sw") p.features.sw = el.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      else if (el.id.indexOf("n-group-") === 0) p.group = el.value === "" ? null : Number(el.value);
      else if (el.id.indexOf("n-price-") === 0) p.price = el.value === "" ? null : Number(el.value);
      else if (el.id.indexOf("t-id-") === 0) p.id = el.value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
      else if (el.id.indexOf("c-popular-") === 0) p.popular = el.checked || undefined;
    });

    $("#pkg-back").addEventListener("click", function (e) { e.preventDefault(); state.ui.packages.mode = "list"; renderTab(); });
    $("#pkg-save").addEventListener("click", function () {
      if (isNew) {
        if (!/^[a-z0-9-]+$/.test(p.id || "")) { toast("Give the package a valid id first.", true); return; }
        if (state.model.data.packages.some(function (x) { return x.id === p.id; })) { toast("A package with this id already exists.", true); return; }
        state.model.data.packages.push(p);
        ui.id = p.id; ui.draft = null;
      }
      state.ui.packages.mode = "list";
      renderTab();
      toast("Kept — remember to Review & save.");
    });
  }

  /* ======================= Categories & Topics tab ======================= */

  function renderVocab(main) {
    var d = state.model.data;
    var ui = state.ui.vocab = state.ui.vocab || { filter: "" };
    var usage = {};
    d.courses.forEach(function (c) {
      (c.topics || []).forEach(function (k) { usage[k] = (usage[k] || 0) + 1; });
    });

    var f = ui.filter.toLowerCase();
    var topicKeys = Object.keys(d.topics).filter(function (k) {
      if (!f) return true;
      var t = d.topics[k];
      return k.indexOf(f) !== -1 || (t.en || "").toLowerCase().indexOf(f) !== -1 || (t.sw || "").toLowerCase().indexOf(f) !== -1;
    });

    var catCards = d.categories.map(function (cat, idx) {
      return '<div class="adm-panel" data-catcard="' + esc(cat.id) + '"><h3>' + esc(biText(cat.name)) +
        ' <span class="adm-note">(' + esc(cat.id) + ")</span></h3>" +
        biRow("Category name", cat, "name") +
        biRow("Summary line", cat, "summary") +
        txtRow("Icon name (reserved for future use)", cat, "icon") +
        '<div class="adm-check"><input type="checkbox" id="cat-hidden-' + idx + '"' + (cat.hidden ? " checked" : "") + ">" +
        '<label for="cat-hidden-' + idx + '">Hide this category and its filter chip</label></div>' +
        "</div>";
    }).join("");

    var topicRows = topicKeys.map(function (k) {
      var t = d.topics[k];
      return "<tr><td><code>" + esc(k) + "</code></td>" +
        '<td><input data-tk="' + esc(k) + '--en" value="' + esc(t.en || "") + '"></td>' +
        '<td><input data-tk="' + esc(k) + '--sw" value="' + esc(t.sw || "") + '"></td>' +
        "<td>" + (usage[k] || 0) + " course" + (usage[k] === 1 ? "" : "s") + "</td>" +
        "<td>" + (usage[k] ? '<span class="adm-note">in use</span>' : '<button class="adm-btn danger sm" data-deltopic="' + esc(k) + '">Delete</button>') + "</td></tr>";
    }).join("");

    main.innerHTML =
      "<h2>Categories & Topics</h2>" +
      '<p class="lead">Categories are the catalogue filters. Topics are the shared EN/SW skill vocabulary reused across courses.</p>' +

      '<div class="adm-panel"><h3>Categories</h3>' + catCards + "</div>" +

      '<div class="adm-panel"><h3>Add a topic</h3><div class="adm-grid2">' +
      txtRow("Topic key (camelCase, permanent)", ui, "newKey", "e.g. heatRash") +
      "</div>" +
      '<div class="adm-grid2">' +
      '<div class="adm-field"><label>English</label><input id="voc-new-en"></div>' +
      '<div class="adm-field"><label>Kiswahili</label><input id="voc-new-sw"></div>' +
      "</div>" +
      '<button class="adm-btn accent sm" id="voc-add">+ Add topic</button></div>' +

      '<div class="adm-panel"><h3>Topics (' + Object.keys(d.topics).length + ")</h3>" +
      '<div class="adm-field"><label>Filter</label><input id="voc-filter" value="' + esc(ui.filter) + '" placeholder="key or wording…"></div>' +
      '<div class="adm-tablewrap adm-topics"><table class="adm-table"><thead><tr><th>Key</th><th>English</th><th>Kiswahili</th><th>Used by</th><th></th></tr></thead>' +
      "<tbody>" + (topicRows || '<tr><td colspan="5" class="adm-note">No match.</td></tr>') + "</tbody></table></div></div>";

    /* categories */
    $$("[data-catcard]", main).forEach(function (card) {
      var id = card.getAttribute("data-catcard");
      var cat = d.categories.filter(function (x) { return x.id === id; })[0];
      wireInputs(card, function (el) {
        if (el.id.indexOf("f-name-") === 0) cat.name[el.id.slice(-2)] = el.value;
        else if (el.id.indexOf("f-summary-") === 0) cat.summary[el.id.slice(-2)] = el.value;
        else if (el.id.indexOf("t-icon-") === 0) cat.icon = el.value.trim();
      });
      var hide = $('input[type="checkbox"][id^="cat-hidden-"]', card);
      var idx = Number(hide.id.replace("cat-hidden-", ""));
      hide.addEventListener("change", function () {
        d.categories[idx].hidden = hide.checked || undefined;
        markDirty("data");
      });
    });

    /* topics */
    $$("[data-tk]", main).forEach(function (inp) {
      inp.addEventListener("input", function () {
        var parts = inp.getAttribute("data-tk").split("--");
        var k = parts[0], lang = parts[1];
        d.topics[k][lang] = inp.value;
        markDirty("data");
      });
    });
    $$("[data-deltopic]", main).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-deltopic");
        if (!confirm("Delete topic “" + k + "”? It is not used by any course.")) return;
        delete d.topics[k];
        markDirty("data");
        renderTab();
      });
    });
    $("#voc-add").addEventListener("click", function () {
      var k = (ui.newKey || "").trim();
      if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(k)) { toast("Topic key must be camelCase letters/numbers (no spaces or dashes).", true); return; }
      if (d.topics[k]) { toast("That key already exists.", true); return; }
      var en = $("#voc-new-en").value.trim(), sw = $("#voc-new-sw").value.trim();
      if (!en && !sw) { toast("Give the topic at least one language.", true); return; }
      d.topics[k] = { en: en, sw: sw };
      ui.newKey = "";
      markDirty("data");
      toast("Topic added — attach it to courses in the Courses tab.");
      renderTab();
    });
    $("#voc-filter").addEventListener("input", function () { ui.filter = this.value; renderTab(); });
  }

  /* ======================= Site text tab ======================= */

  function renderText(main) {
    var dict = state.model.i18n;
    var ui = state.ui.text = state.ui.text || { filter: "", group: "" };
    var allKeys = Object.keys(dict.en).concat(Object.keys(dict.sw).filter(function (k) { return !(k in dict.en); }));

    var groups = [];
    allKeys.forEach(function (k) {
      var g = k.split(".")[0];
      if (groups.indexOf(g) === -1) groups.push(g);
    });

    var f = ui.filter.toLowerCase();
    function row(k) {
      if (ui.group && k.split(".")[0] !== ui.group) return "";
      var en = dict.en[k], sw = dict.sw[k];
      if (f && k.toLowerCase().indexOf(f) === -1 &&
        String(en || "").toLowerCase().indexOf(f) === -1 &&
        String(sw || "").toLowerCase().indexOf(f) === -1) return "";
      var badge = "";
      if (en === undefined) badge = '<span class="adm-tag warn">missing EN</span>';
      if (sw === undefined) badge = '<span class="adm-tag warn">missing SW</span>';
      return "<tr><td><code>" + esc(k) + "</code> " + badge + "</td>" +
        '<td><textarea data-tx="' + esc(k) + '|en">' + esc(en == null ? "" : en) + "</textarea></td>" +
        '<td><textarea data-tx="' + esc(k) + '|sw">' + esc(sw == null ? "" : sw) + "</textarea></td></tr>";
    }
    var rows = allKeys.map(row).join("");

    main.innerHTML =
      "<h2>Site text</h2>" +
      '<p class="lead">Every heading, paragraph, button and quiz sentence on the site — English and Kiswahili side by side. Search by key or wording.</p>' +
      '<div class="adm-panel adm-toolbar">' +
      '<input id="tx-filter" value="' + esc(ui.filter) + '" placeholder="Search key or text…" style="min-width:240px;">' +
      '<select id="tx-group"><option value="">All groups</option>' +
      groups.map(function (g) { return '<option value="' + esc(g) + '"' + (ui.group === g ? " selected" : "") + ">" + esc(g) + "</option>"; }).join("") +
      "</select>" +
      '<span class="adm-note">' + Object.keys(dict.en).length + " EN · " + Object.keys(dict.sw).length + " SW keys</span>" +
      "</div>" +
      '<div class="adm-panel adm-tablewrap"><table class="adm-table adm-texttable"><thead><tr><th style="width:24%">Key</th><th>English</th><th>Kiswahili</th></tr></thead>' +
      "<tbody>" + (rows || '<tr><td colspan="3" class="adm-note">No match.</td></tr>') + "</tbody></table></div>";

    $("#tx-filter").addEventListener("input", function () { ui.filter = this.value; renderTab(); });
    $("#tx-group").addEventListener("change", function () { ui.group = this.value; renderTab(); });
    $$("[data-tx]", main).forEach(function (ta) {
      ta.addEventListener("input", function () {
        var parts = ta.getAttribute("data-tx").split("|");
        dict[parts[1]][parts[0]] = ta.value;
        markDirty("i18n");
      });
    });
  }

  /* ======================= Photos tab ======================= */

  function putFile(path, contentB64, message, cb) {
    gh("GET", "/repos/" + repoId() + "/contents/" + path + "?ref=" + encodeURIComponent(state.branch), null,
      function (status, data) {
        var sha = status === 200 && data ? data.sha : null;
        var body = { message: message, content: contentB64, branch: state.branch };
        if (sha) body.sha = sha;
        gh("PUT", "/repos/" + repoId() + "/contents/" + path, body, function (s2, d2) {
          if (s2 === 200 || s2 === 201) cb(null);
          else cb(new Error("Upload " + path + " failed — " + ghMessage(s2, d2)));
        });
      });
  }

  function renderPhotos(main) {
    var ui = state.ui.photos = state.ui.photos || { uploads: [] };
    var gallery = state.model.data.gallery;

    var slots = gallery.map(function (g, i) {
      return '<div class="adm-photo-row" data-slot="' + i + '">' +
        '<img class="adm-photo-thumb" src="' + esc(g.src) + '" alt="" loading="lazy">' +
        '<div class="adm-photo-fields">' +
        '<div class="adm-note">' + esc(g.src) + "</div>" +
        txtRow("Image file (assets/img/…)", g, "src") +
        txtRow("Alt text (describe the photo for screen readers)", g, "alt") +
        biRow("Caption", g, "caption") +
        '<div class="adm-toolbar">' +
        '<button class="adm-btn ghost sm" data-up="' + i + '"' + (i === 0 ? " disabled" : "") + '>↑ Up</button>' +
        '<button class="adm-btn ghost sm" data-down="' + i + '"' + (i === gallery.length - 1 ? " disabled" : "") + ">↓ Down</button>" +
        '<button class="adm-btn danger sm" data-remove="' + i + '">Remove slot</button>' +
        "</div></div></div>";
    }).join("") || '<p class="adm-note">No gallery photos.</p>';

    var uploads = (ui.uploads || []).map(function (u, i) {
      return '<div class="adm-photo-row adm-pending">' +
        '<img class="adm-photo-thumb" src="' + u.dataUrl + '" alt="">' +
        '<div><strong>' + esc(u.path) + "</strong> — new image, uploads on save" +
        '<div class="adm-toolbar" style="margin-top:.4rem;"><button class="adm-btn ghost sm" data-unqueue="' + i + '">Cancel upload</button></div>' +
        "</div></div>";
    }).join("");

    main.innerHTML =
      "<h2>Photos</h2>" +
      '<p class="lead">The photo gallery on the home page, plus the hero and leadership photos. New images are resized to max 1200px and compressed in your browser before upload.</p>' +

      '<div class="adm-panel"><h3>Home page gallery</h3>' + slots +
      '<div class="adm-toolbar" style="margin-top:1rem;">' +
      '<input type="file" id="ph-file" accept="image/*" style="display:none;">' +
      '<button class="adm-btn accent sm" id="ph-add">+ Add photo slot (upload)</button>' +
      '<button class="adm-btn ghost sm" id="ph-pick">Use an existing image…</button>' +
      '<select id="ph-existing" style="display:none;"></select>' +
      "</div>" + uploads + "</div>" +

      '<div class="adm-panel"><h3>Replace the hero photo</h3>' +
      '<div class="adm-photo-row"><img class="adm-photo-thumb" src="assets/img/hero-firstaid.jpg" alt="" loading="lazy">' +
      '<div><p class="adm-note">assets/img/hero-firstaid.jpg — the big photo on the home page.</p>' +
      '<input type="file" id="ph-hero" accept="image/*"></div></div></div>' +

      '<div class="adm-panel"><h3>Replace leadership photos</h3>' +
      '<div class="adm-photo-row"><img class="adm-photo-thumb" src="assets/img/leader-reinfrida.jpg" alt="" loading="lazy">' +
      '<div><p class="adm-note">assets/img/leader-reinfrida.jpg</p><input type="file" data-replace="assets/img/leader-reinfrida.jpg" accept="image/*"></div></div>' +
      '<div class="adm-photo-row"><img class="adm-photo-thumb" src="assets/img/leader-kelvin.jpg" alt="" loading="lazy">' +
      '<div><p class="adm-note">assets/img/leader-kelvin.jpg</p><input type="file" data-replace="assets/img/leader-kelvin.jpg" accept="image/*"></div></div>' +
      "</div>";

    function wireSlot(i) {
      var rowEl = $('[data-slot="' + i + '"]', main);
      var g = gallery[i];
      wireInputs(rowEl, function (el) {
        if (el.id.indexOf("f-caption-") === 0) g.caption[el.id.slice(-2)] = el.value;
        else if (el.id.indexOf("t-src-") === 0) g.src = el.value.trim();
        else if (el.id.indexOf("t-alt-") === 0) g.alt = el.value;
      });
    }
    for (var i = 0; i < gallery.length; i++) wireSlot(i);

    $$("[data-up]", main).forEach(function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.getAttribute("data-up"));
        gallery.splice(i - 1, 0, gallery.splice(i, 1)[0]);
        markDirty("data"); renderTab();
      });
    });
    $$("[data-down]", main).forEach(function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.getAttribute("data-down"));
        gallery.splice(i + 1, 0, gallery.splice(i, 1)[0]);
        markDirty("data"); renderTab();
      });
    });
    $$("[data-remove]", main).forEach(function (b) {
      b.addEventListener("click", function () {
        if (!confirm("Remove this photo from the gallery? (The image file stays in the repository.)")) return;
        gallery.splice(Number(b.getAttribute("data-remove")), 1);
        markDirty("data"); renderTab();
      });
    });
    $$("[data-unqueue]", main).forEach(function (b) {
      b.addEventListener("click", function () {
        ui.uploads.splice(Number(b.getAttribute("data-unqueue")), 1);
        renderTab();
      });
    });

    function queueUpload(file, suggestedName, onQueued) {
      resizeImage(file, function (err, out) {
        if (err) return toast(err.message, true);
        ui.uploads.push({ path: "assets/img/" + suggestedName, content: out.b64, dataUrl: out.dataUrl });
        onQueued("assets/img/" + suggestedName);
        updateSavePill();
      });
    }

    $("#ph-add").addEventListener("click", function () { $("#ph-file").click(); });
    $("#ph-file").addEventListener("change", function () {
      var f = this.files[0];
      if (!f) return;
      var name = "gallery-" + f.name.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-") + ".jpg";
      queueUpload(f, name, function (path) {
        state.model.data.gallery.push({
          src: path, alt: "",
          caption: { en: "New photo — add a caption", sw: "Picha mpya — ongeza maelezo" }
        });
        markDirty("data");
        renderTab();
        toast("Photo added — it uploads when you press Review & save.");
      });
      this.value = "";
    });

    $("#ph-pick").addEventListener("click", function () {
      var sel = $("#ph-existing");
      if (sel.style.display === "none") {
        sel.style.display = "";
        sel.innerHTML = '<option value="">Loading…</option>';
        gh("GET", "/repos/" + repoId() + "/contents/assets/img?ref=" + encodeURIComponent(state.branch), null, function (status, data) {
          if (status !== 200 || !Array.isArray(data)) { sel.innerHTML = '<option value="">Could not list images</option>'; return; }
          sel.innerHTML = '<option value="">Choose an image…</option>' + data.map(function (f) {
            return '<option value="' + esc(f.path) + '">' + esc(f.name) + "</option>";
          }).join("");
        });
      } else sel.style.display = "none";
    });
    $("#ph-existing").addEventListener("change", function () {
      var path = this.value;
      if (!path) return;
      state.model.data.gallery.push({ src: path, alt: "", caption: { en: "New photo — add a caption", sw: "Picha mpya — ongeza maelezo" } });
      markDirty("data");
      renderTab();
    });

    $("#ph-hero").addEventListener("change", function () {
      var f = this.files[0];
      if (!f) return;
      if (!confirm("Replace the hero photo? It uploads when you press Review & save.")) { this.value = ""; return; }
      queueUpload(f, "hero-firstaid.jpg", function () { toast("Hero photo queued."); });
      this.value = "";
    });
    $$("[data-replace]", main).forEach(function (inp) {
      inp.addEventListener("change", function () {
        var f = this.files[0];
        var target = this.getAttribute("data-replace");
        if (!f) return;
        if (!confirm("Replace " + target + "? It uploads when you press Review & save.")) { this.value = ""; return; }
        queueUpload(f, target.split("/").pop(), function () { toast("Photo queued."); });
        this.value = "";
      });
    });
  }

  /* Resize + JPEG-compress an image file entirely in the browser.
     Max edge 1200px, quality 0.82 — matches the site's existing images. */
  function resizeImage(file, cb) {
    if (!/^image\//.test(file.type)) return cb(new Error("Please choose an image file."));
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var MAX = 1200;
        var scale = Math.min(1, MAX / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff"; /* flatten transparency for JPEG */
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        var dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        cb(null, { dataUrl: dataUrl, b64: dataUrl.split(",")[1] });
      };
      img.onerror = function () { cb(new Error("That image could not be read.")); };
      img.src = reader.result;
    };
    reader.onerror = function () { cb(new Error("That file could not be read.")); };
    reader.readAsDataURL(file);
  }

  /* ---------- save modal ---------- */
  function openSaveModal() {
    var keys = ["config", "data", "i18n"].filter(function (k) { return state.dirty[k]; });
    var uploads = pendingUploads();
    var mask = document.createElement("div");
    mask.className = "adm-modal-mask";
    mask.innerHTML =
      '<div class="adm-modal"><h3>Review &amp; save</h3>' +
      '<p class="adm-muted">Committed to <strong>' + esc(state.branch) + "</strong>" +
      (state.branch === "main" ? " — the live site updates in about a minute." : " — this branch is NOT the live site.") + "</p>" +
      "<ul>" +
      uploads.map(function (u) { return "<li><code>" + esc(u.path) + "</code> — new image</li>"; }).join("") +
      keys.map(function (k) { return "<li><code>" + FILE_PATHS[k] + "</code></li>"; }).join("") +
      "</ul>" +
      '<div class="adm-field"><label for="adm-commit-msg">Commit message</label>' +
      '<input id="adm-commit-msg" value="CMS: update content"></div>' +
      '<div class="row">' +
      '<button class="adm-btn ghost" id="adm-cancel">Cancel</button>' +
      '<button class="adm-btn accent" id="adm-confirm">Save ' + (keys.length + uploads.length) + " change" + (keys.length + uploads.length > 1 ? "s" : "") + "</button>" +
      "</div></div>";
    document.body.appendChild(mask);

    function close() { mask.remove(); }
    $("#adm-cancel", mask).addEventListener("click", close);
    mask.addEventListener("click", function (e) { if (e.target === mask) close(); });
    $("#adm-confirm", mask).addEventListener("click", function () {
      var msg = $("#adm-commit-msg", mask).value.trim() || "CMS: update";
      var btn = $("#adm-confirm", mask);
      btn.disabled = true; btn.textContent = "Saving…";
      var u = 0;
      (function nextUpload() {
        if (u >= uploads.length) return nextFile();
        var up = uploads[u++];
        toast("Uploading " + up.path + "…");
        putFile(up.path, up.content, msg, function (err) {
          if (err) { fail(err); return; }
          state.ui.photos.uploads.splice(state.ui.photos.uploads.indexOf(up), 1);
          nextUpload();
        });
      })();
      var i = 0;
      function nextFile() {
        if (i >= keys.length) {
          close();
          toast("Saved to " + state.branch + (state.branch === "main" ? " — live in ~1 minute." : "."));
          renderApp();
          return;
        }
        var k = keys[i++];
        commitFile(k, msg, function (err) {
          if (err) { fail(err); return; }
          toast("Committed " + FILE_PATHS[k] + "…");
          nextFile();
        });
      }
      function fail(err) {
        btn.disabled = false; btn.textContent = "Save";
        toast(err.message, true);
      }
    });
  }

  /* ---------- boot ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("admin-root")) return;
    startUI();
  });

  /* Automated-test hook: renders the app shell from an already-parsed
     model, bypassing login. Not reachable without dev tools. */
  window.RDK_ADMIN._testBoot = function (model) {
    state.token = state.token || "test";
    state.user = state.user || "test";
    state.branch = state.branch || "main";
    state.model = model;
    state.files = state.files || { data: { sha: "t", text: "" }, i18n: { sha: "t", text: "" }, config: { sha: "t", text: "" } };
    state.tab = state.tab === "overview" ? state.tab : state.tab;
    renderApp();
  };
  window.RDK_ADMIN._testState = function () {
    return { dirty: { data: state.dirty.data, i18n: state.dirty.i18n, config: state.dirty.config } };
  };
})();

/* ============================================================
   RDK Emergency Care — shared layout & behaviour
   Renders nav + footer on every page, wires the language
   toggle, mobile menu, WhatsApp float and scroll reveals.
   ============================================================ */
(function () {
  "use strict";

  var SVG_ICONS = {
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>'
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pageName() {
    var p = location.pathname.split("/").pop();
    return p === "" ? "index.html" : p;
  }

  /* ---------- navigation ---------- */
  function renderNav() {
    var mount = document.getElementById("nav-mount");
    if (!mount) return;
    var page = pageName();
    var links = [
      { href: "about.html", key: "nav.about", page: "about.html" },
      { href: "training.html", key: "nav.training", page: "training.html" },
      { href: "quiz.html", key: "nav.quiz", page: "quiz.html", cta: true },
      { href: "work-abroad.html", key: "nav.abroad", page: "work-abroad.html" },
      { href: "blog.html", key: "nav.blog", page: "blog.html" },
      { href: "contact.html", key: "nav.contact", page: "contact.html" }
    ];
    var lis = links.map(function (l) {
      var cls = l.cta ? "nav-cta" : (page === l.page ? "is-current" : "");
      return '<li><a class="' + cls + '" href="' + l.href + '" data-i18n="' + l.key + '"></a></li>';
    }).join("");

    mount.outerHTML =
      '<header class="site-nav" id="site-nav">' +
      '<div class="container nav-inner">' +
      '<a class="nav-logo" href="/" aria-label="RDK Emergency Care">' +
      '<img src="assets/img/rdk-logo.png" alt="RDK Emergency Care logo" width="74" height="53">' +
      "</a>" +
      '<nav aria-label="Main"><ul class="nav-links" id="nav-links">' + lis + "</ul></nav>" +
      '<div class="lang-toggle" role="group" aria-label="Language">' +
      '<button type="button" data-lang-btn="en">EN</button>' +
      '<button type="button" data-lang-btn="sw">SW</button>' +
      "</div>" +
      '<button class="nav-burger" id="nav-burger" aria-label="Menu" aria-expanded="false" aria-controls="nav-links">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
      "</button>" +
      "</div></header>";
  }

  /* ---------- footer ---------- */
  function socialRowHTML() {
    var s = window.RDK_CONFIG.social || {};
    var icon = function (label, href, svg) {
      if (!href) return "";
      return '<a href="' + esc(href) + '" target="_blank" rel="noopener" aria-label="' + label +
        '" title="' + label + '">' + svg + "</a>";
    };
    return '<div class="social-row">' +
      icon("Instagram", s.instagram,
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>') +
      icon("Facebook", s.facebook,
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8h2.5V4.5H14c-2.5 0-4 1.6-4 4V11H7.5v3H10v8h3.5v-8h2.6l.4-3h-3V9c0-.6.4-1 1-1z"/></svg>') +
      icon("TikTok", s.tiktok,
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12V9.77a5.76 5.76 0 0 0-.77-.05 5.66 5.66 0 1 0 5.66 5.66V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.22-1.48z"/></svg>') +
      "</div>";
  }
  function renderFooter() {
    var mount = document.getElementById("footer-mount");
    if (!mount) return;
    var cfg = window.RDK_CONFIG;
    var wa = window.rdkWhatsApp("Hello RDK Emergency Care!");
    var waText = cfg.whatsappDisplay || cfg.whatsapp || "";

    mount.outerHTML =
      '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      "<div>" +
      '<img class="footer-logo" src="assets/img/rdk-logo.png" alt="RDK Emergency Care" width="82" height="59">' +
      '<p data-i18n="footer.about"></p>' +
      '<p class="footer-motto" data-i18n="footer.motto"></p>' +
      socialRowHTML() +
      "</div>" +
      "<div><h4 data-i18n=\"footer.quickLinks\"></h4><ul>" +
      '<li><a href="training.html" data-i18n="nav.training"></a></li>' +
      '<li><a href="quiz.html" data-i18n="nav.quiz"></a></li>' +
      '<li><a href="work-abroad.html" data-i18n="nav.abroad"></a></li>' +
      '<li><a href="about.html" data-i18n="nav.about"></a></li>' +
      '<li><a href="blog.html" data-i18n="nav.blog"></a></li>' +
      '<li><a href="contact.html" data-i18n="nav.contact"></a></li>' +
      "</ul></div>" +
      "<div><h4 data-i18n=\"footer.contact\"></h4><ul>" +
      '<li><a href="mailto:' + esc(cfg.email) + '">' + esc(cfg.email) + "</a></li>" +
      '<li>' + esc(cfg.office.line1) + "</li>" +
      '<li>' + esc(cfg.office.city) + "</li>" +
      (waText ? '<li><a href="' + wa + '" target="_blank" rel="noopener">' + esc(waText) + "</a></li>" : "") +
      "</ul></div>" +
      "<div><h4 data-i18n=\"footer.legal\"></h4><ul class=\"footer-legal\">" +
      '<li><a href="privacy.html" data-i18n="footer.privacy"></a></li>' +
      '<li data-i18n="footer.incorp"></li>' +
      '<li data-i18n="footer.license"></li>' +
      '<li data-i18n="footer.tin"></li>' +
      "</ul></div>" +
      "</div>" +
      '<div class="footer-bottom">' +
      "<span>© " + new Date().getFullYear() + " RDK Emergency Care Company Limited — <span data-i18n=\"footer.rights\"></span></span>" +
      "<span>Kigamboni, Dar es Salaam, Tanzania</span>" +
      "</div></div></footer>";
  }

  /* ---------- floating WhatsApp bubble ---------- */
  function renderWaFloat() {
    if (!window.RDK_CONFIG.whatsapp) return;
    var a = document.createElement("a");
    a.className = "wa-float is-visible";
    a.href = window.rdkWhatsApp("Hello RDK Emergency Care! I would like to ask about your training.");
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Chat on WhatsApp");
    a.innerHTML = SVG_ICONS.whatsapp;
    document.body.appendChild(a);
  }

  /* ---------- dynamic content renderers ---------- */
  function lang() { return window.RDK_I18N ? window.RDK_I18N.getLang() : "en"; }

  function bi(obj) { return (obj && (obj[lang()] || obj.en)) || ""; }

  function tagList(arr) {
    return '<ul class="tags">' + arr.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
  }

  function courseCardHTML(c) {
    var l = lang();
    var topics = window.RDK.topicList(c, l);
    var name = bi(c.name);
    var msg = (l === "sw"
      ? "Habari RDK! Nataka kuweka nafasi ya kozi: "
      : "Hello RDK! I would like to book the course: ") + name + " (" + window.RDK.price(c.price) + ").";
    return (
      '<article class="card course-card" id="course-' + esc(c.id) + '">' +
      '<div class="course-head"><h3>' + esc(name) + '</h3>' +
      '<span class="pill price">' + window.RDK.price(c.price) + "</span></div>" +
      '<div class="course-meta"><span class="pill outline">' + esc(bi(c.duration)) + '</span>' +
      '<span class="pill">' + esc(window.t("misc.perPerson")) + "</span></div>" +
      '<p class="audience mb-0"><strong>' + esc(window.t("course.audienceLabel")) + ":</strong> " + esc(bi(c.audience)) + "</p>" +
      "<p class=\"muted mb-0\" style=\"font-size:.82rem;font-weight:600;\">" + esc(window.t("course.topics")) + "</p>" +
      tagList(topics.slice(0, 6)) +
      (topics.length > 6
        ? '<details><summary>' + esc(window.t("course.allTopics")) + " (+" + (topics.length - 6) + ")</summary>" +
          tagList(topics.slice(6)) + "</details>"
        : "") +
      '<div class="card-actions">' +
      '<a class="btn btn-primary" target="_blank" rel="noopener" href="' + window.rdkWhatsApp(msg) + '">' + esc(window.t("cta.book")) + "</a>" +
      "</div></article>"
    );
  }

  function packageCardHTML(p) {
    var l = lang();
    var group = p.group
      ? esc(window.t("packages.upTo")) + " " + p.group + " " + esc(window.t("packages.people"))
      : esc(bi(p.audience));
    var priceHTML = p.priceNote
      ? '<span class="pkg-price">' + window.RDK.price(p.price) + '+</span>' +
        '<div><small>' + esc(bi(p.priceNote)) + "</small></div>"
      : '<span class="pkg-price">' + window.RDK.price(p.price) + '</span>' +
        '<div><small>' + esc(window.t("packages.from")) + " · " + group + "</small></div>";
    var msg = (l === "sw"
      ? "Habari RDK! Naomba bei ya paket: "
      : "Hello RDK! I would like a quote for the package: ") + bi(p.name) + ".";
    return (
      '<article class="card package-card">' +
      (p.popular ? '<span class="pop-badge">' + esc(window.t("packages.popular")) + "</span>" : "") +
      "<h3>" + esc(bi(p.name)) + "</h3>" +
      '<p class="muted" style="font-size:.88rem;">' + esc(bi(p.audience)) + "</p>" +
      priceHTML +
      '<ul class="feat">' + (p.features[l] || p.features.en).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" +
      '<a class="btn btn-accent" target="_blank" rel="noopener" href="' + window.rdkWhatsApp(msg) + '">' + esc(window.t("packages.cta")) + "</a>" +
      "</article>"
    );
  }

  var trainingFilter = "all";

  function renderFeatured() {
    var mount = document.getElementById("featured-courses");
    if (!mount) return;
    mount.innerHTML = window.RDK.courses
      .filter(function (c) { return c.featured && !c.hidden; })
      .map(courseCardHTML).join("");
  }

  function renderPackages() {
    var mount = document.getElementById("packages-grid");
    if (!mount) return;
    var only = mount.getAttribute("data-packages");
    var list = window.RDK.packages;
    if (only) {
      var ids = only.split(",");
      list = list.filter(function (p) { return ids.indexOf(p.id) !== -1; });
    }
    mount.innerHTML = list.map(packageCardHTML).join("");
  }

  function renderFilterChips() {
    var mount = document.getElementById("filter-chips");
    if (!mount) return;
    var chips = ['<button type="button" class="chip-btn' + (trainingFilter === "all" ? " is-active" : "") + '" data-cat="all">' + esc(window.t("training.all")) + "</button>"];
    window.RDK.categories.forEach(function (cat) {
      chips.push(
        '<button type="button" class="chip-btn' + (trainingFilter === cat.id ? " is-active" : "") +
        '" data-cat="' + cat.id + '">' + esc(bi(cat.name)) + "</button>"
      );
    });
    mount.innerHTML = chips.join("");
  }

  function renderCourseGrid() {
    var mount = document.getElementById("courses-grid");
    if (!mount) return;
    var list = window.RDK.courses.filter(function (c) {
      return !c.hidden && (trainingFilter === "all" || c.cats.indexOf(trainingFilter) !== -1);
    });
    mount.innerHTML = list.map(courseCardHTML).join("");
    var count = document.getElementById("result-count");
    if (count) count.textContent = list.length + " " + window.t("training.count");
  }

  function wireDynamicContent() {
    renderFeatured();
    renderPackages();
    renderFilterChips();
    renderCourseGrid();
    renderSectors();
    renderGallery();
    var chips = document.getElementById("filter-chips");
    if (chips) {
      chips.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-cat]");
        if (!btn) return;
        trainingFilter = btn.getAttribute("data-cat");
        renderFilterChips();
        renderCourseGrid();
      });
    }
    document.addEventListener("rdk:lang", function () {
      renderFeatured();
      renderPackages();
      renderFilterChips();
      renderCourseGrid();
      renderSectors();
      renderGallery();
      observeReveals();
    });
  }

  /* ---------- work-abroad sectors ---------- */
  var ABROAD_SECTORS = [
    { id: "healthcare", icon: "🏥", courses: ["cpr-aed-bls", "standard-first-aid", "child-infant"] },
    { id: "oilgas", icon: "🛢️", courses: ["industrial", "comprehensive", "cpr-aed-bls"] },
    { id: "maritime", icon: "🚢", courses: ["cpr-aed-bls", "hospitality-tourism"] },
    { id: "hospitality", icon: "🏨", courses: ["hospitality-tourism", "standard-first-aid"] },
    { id: "construction", icon: "🏗️", courses: ["construction", "industrial"] },
    { id: "childcare", icon: "🧸", courses: ["child-infant", "standard-first-aid"] },
    { id: "security", icon: "🛡️", courses: ["security-first-aid", "cpr-aed-bls"] }
  ];

  function sectorCardHTML(sector) {
    var courseLinks = sector.courses.map(function (cid) {
      var c = window.RDK.courseById(cid);
      if (!c) return "";
      return '<a class="pill" href="training.html#course-' + cid + '">' + esc(bi(c.name)) + "</a>";
    }).join("");
    return (
      '<article class="card sector-card reveal">' +
      '<span class="chip green" style="font-size:1.3rem;">' + sector.icon + "</span>" +
      "<h3>" + esc(window.t("sec." + sector.id + ".t")) + "</h3>" +
      '<p class="muted">' + esc(window.t("sec." + sector.id + ".d")) + "</p>" +
      '<p class="muted mb-0" style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">' +
      esc(window.t("abroadPage.coursesLabel")) + "</p>" +
      '<div class="course-meta" style="margin-top:.5rem;">' + courseLinks + "</div>" +
      "</article>"
    );
  }

  function renderSectors() {
    var mount = document.getElementById("sectors-grid");
    if (!mount) return;
    mount.innerHTML = ABROAD_SECTORS.map(sectorCardHTML).join("");
  }

  /* ---------- home photo gallery (RDK.gallery) ---------- */
  function galleryItemHTML(g) {
    return (
      '<figure class="gallery-item reveal">' +
      '<img src="' + esc(g.src) + '" alt="' + esc(g.alt) + '" loading="lazy" width="900" height="600">' +
      "<figcaption>" + esc(bi(g.caption)) + "</figcaption></figure>"
    );
  }

  function renderGallery() {
    var mount = document.getElementById("gallery-grid");
    if (!mount) return;
    mount.innerHTML = (window.RDK.gallery || []).map(galleryItemHTML).join("");
  }

  /* ---------- behaviours ---------- */
  var revealIO = null;
  if ("IntersectionObserver" in window) {
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); revealIO.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
  }
  /* observe every .reveal that is not revealed yet — safe to call again
     after dynamic content has been (re)rendered */
  function observeReveals() {
    document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var aboveViewport = rect.bottom < 0; /* scrolled past — observer would never fire */
      if (!revealIO || aboveViewport) el.classList.add("is-in");
      else revealIO.observe(el);
    });
  }

  function wireBehaviours() {
    var burger = document.getElementById("nav-burger");
    var links = document.getElementById("nav-links");
    if (burger && links) {
      burger.addEventListener("click", function () {
        var open = links.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      links.addEventListener("click", function (e) {
        if (e.target.tagName === "A") links.classList.remove("is-open");
      });
    }
    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.addEventListener("click", function () {
        window.RDK_I18N.setLang(b.getAttribute("data-lang-btn"));
      });
    });
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderNav();
    renderFooter();
    renderWaFloat();
    wireBehaviours();
    wireDynamicContent();
    observeReveals();
    /* i18n ran first (its own DOMContentLoaded); re-apply to freshly rendered chrome */
    if (window.RDK_I18N) window.RDK_I18N.apply(document);
  });
})();

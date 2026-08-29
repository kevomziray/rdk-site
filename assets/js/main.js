/* ============================================================
   RDK Emergency Care — shared layout & behaviour
   Renders nav + footer on every page, wires the language
   toggle, mobile menu, WhatsApp float and scroll reveals.
   ============================================================ */
(function () {
  "use strict";

  var SVG_ICONS = {
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    whatsapp: '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 2.7C8.7 2.7 2.8 8.6 2.8 15.9c0 2.3.6 4.5 1.7 6.5L2.7 29.3l7.1-1.8c1.9 1 4 1.6 6.3 1.6 7.3 0 13.2-5.9 13.2-13.2S23.3 2.7 16 2.7zm0 24.1c-2 0-4-.5-5.7-1.6l-.4-.2-4.2 1.1 1.1-4.1-.3-.4a10.9 10.9 0 0 1-1.7-5.7c0-6 4.9-11 11-11s11 4.9 11 11-4.9 11-11 11zm6-8.2c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.9 8.9 0 0 1-2.6-1.6 9.8 9.8 0 0 1-1.8-2.2c-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.6s0-.4 0-.6-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.5 5.5 4.9.8.3 1.4.5 1.8.7.8.2 1.5.2 2 .1.6-.1 1.9-.8 2.2-1.5s.3-1.4.2-1.5c0-.1-.2-.2-.5-.3z"/></svg>'
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
      { href: "index.html", key: "nav.home", page: "index.html" },
      { href: "training.html", key: "nav.training", page: "training.html" },
      { href: "quiz.html", key: "nav.quiz", page: "quiz.html", cta: true },
      { href: "work-abroad.html", key: "nav.abroad", page: "work-abroad.html" },
      { href: "about.html", key: "nav.about", page: "about.html" },
      { href: "contact.html", key: "nav.contact", page: "contact.html" }
    ];
    var lis = links.map(function (l) {
      var cls = l.cta ? "nav-cta" : (page === l.page ? "is-current" : "");
      return '<li><a class="' + cls + '" href="' + l.href + '" data-i18n="' + l.key + '"></a></li>';
    }).join("");

    mount.outerHTML =
      '<header class="site-nav" id="site-nav">' +
      '<div class="container nav-inner">' +
      '<a class="nav-logo" href="index.html" aria-label="RDK Emergency Care">' +
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
      "</div>" +
      "<div><h4 data-i18n=\"footer.quickLinks\"></h4><ul>" +
      '<li><a href="training.html" data-i18n="nav.training"></a></li>' +
      '<li><a href="quiz.html" data-i18n="nav.quiz"></a></li>' +
      '<li><a href="work-abroad.html" data-i18n="nav.abroad"></a></li>' +
      '<li><a href="about.html" data-i18n="nav.about"></a></li>' +
      '<li><a href="contact.html" data-i18n="nav.contact"></a></li>' +
      "</ul></div>" +
      "<div><h4 data-i18n=\"footer.contact\"></h4><ul>" +
      '<li><a href="mailto:' + esc(cfg.email) + '">' + esc(cfg.email) + "</a></li>" +
      '<li>' + esc(cfg.office.line1) + "</li>" +
      '<li>' + esc(cfg.office.city) + "</li>" +
      (waText ? '<li><a href="' + wa + '" target="_blank" rel="noopener">' + esc(waText) + "</a></li>" : "") +
      "</ul></div>" +
      "<div><h4 data-i18n=\"footer.legal\"></h4><ul class=\"footer-legal\">" +
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
      '<article class="card course-card">' +
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
      .filter(function (c) { return c.featured; })
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
      return trainingFilter === "all" || c.cats.indexOf(trainingFilter) !== -1;
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
    });
  }

  /* ---------- behaviours ---------- */
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
    /* scroll reveal */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
    }
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderNav();
    renderFooter();
    renderWaFloat();
    wireBehaviours();
    wireDynamicContent();
    /* i18n ran first (its own DOMContentLoaded); re-apply to freshly rendered chrome */
    if (window.RDK_I18N) window.RDK_I18N.apply(document);
  });
})();

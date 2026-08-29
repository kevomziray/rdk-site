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
    /* i18n ran first (its own DOMContentLoaded); re-apply to freshly rendered chrome */
    if (window.RDK_I18N) window.RDK_I18N.apply(document);
  });
})();

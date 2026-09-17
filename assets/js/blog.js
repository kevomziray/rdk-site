/* ============================================================
   RDK Emergency Care — blog rendering
   Reads window.RDK_POSTS (assets/js/posts.js), shows the post
   list or a single article based on the URL hash (#slug).
   Re-renders when the visitor switches language.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function lang() { return window.RDK_I18N ? window.RDK_I18N.getLang() : "en"; }
  function bi(obj) { return (obj && (obj[lang()] || obj.en)) || ""; }
  function t(key) { return window.t ? window.t(key) : key; }

  function posts() { return window.RDK_POSTS || []; }

  function findBySlug(slug) {
    for (var i = 0; i < posts().length; i++) {
      if (posts()[i].slug === slug) return posts()[i];
    }
    return null;
  }

  function renderList() {
    var mount = document.getElementById("blog-list");
    var postView = document.getElementById("blog-post");
    if (!mount) return;
    mount.classList.remove("hidden");
    if (postView) postView.classList.add("hidden");

    if (!posts().length) {
      mount.innerHTML = '<p class="muted">' + esc(t("blog.empty")) + "</p>";
      return;
    }
    mount.innerHTML =
      '<div class="blog-grid">' +
      posts().map(function (p) {
        return (
          '<article class="card post-card reveal">' +
          '<span class="post-date">' + esc(p.date) + "</span>" +
          "<h2>" + esc(bi(p.title)) + "</h2>" +
          '<p class="muted mb-0">' + esc(bi(p.summary)) + "</p>" +
          '<a class="btn btn-outline" href="blog.html#' + esc(p.slug) + '">' + esc(t("blog.readMore")) + "</a>" +
          "</article>"
        );
      }).join("") +
      "</div>";
  }

  function renderPost(slug) {
    var mount = document.getElementById("blog-list");
    var postView = document.getElementById("blog-post");
    if (!postView) return;
    var p = findBySlug(slug);
    if (!p) { renderList(); return; }

    mount.classList.add("hidden");
    postView.classList.remove("hidden");
    var paras = (p.body[lang()] || p.body.en) || [];
    var img = p.image
      ? '<figure class="post-figure"><img src="' + esc(p.image.src) + '" alt="' + esc(p.image.alt) + '" loading="lazy"></figure>'
      : "";
    postView.innerHTML =
      '<a class="back-link" href="blog.html">' + esc(t("blog.back")) + "</a>" +
      '<article class="article">' +
      "<h1>" + esc(bi(p.title)) + "</h1>" +
      '<p class="post-date">' + esc(t("blog.published")) + ": " + esc(p.date) + "</p>" +
      img +
      paras.map(function (para) { return "<p>" + esc(para) + "</p>"; }).join("") +
      "</article>";
  }

  function route() {
    var slug = location.hash.replace(/^#/, "");
    if (slug) renderPost(slug);
    else renderList();
  }

  document.addEventListener("rdk:lang", route);
  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", function () {
    route();
    /* let main.js reveal animations pick up freshly rendered cards */
    if (window.RDK_I18N) window.RDK_I18N.apply(document);
  });
})();

/* ============================================================
   RDK Emergency Care — cookie notice
   Shows a small banner until the visitor accepts. Stores the
   choice in localStorage. No tracking, no external scripts.
   ============================================================ */
(function () {
  "use strict";
  var KEY = "rdk-cookie-consent";

  function accepted() {
    try { return localStorage.getItem(KEY) === "1"; } catch (e) { return true; }
  }

  function render() {
    if (accepted() || document.getElementById("cookie-notice")) return;
    var t = window.t || function (k) { return k; };
    var bar = document.createElement("div");
    bar.id = "cookie-notice";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Cookies");
    bar.innerHTML =
      '<p>' + t("cookie.text") + ' <a href="privacy.html">' + t("cookie.more") + "</a></p>" +
      '<button type="button" class="btn btn-primary" id="cookie-accept">' + t("cookie.accept") + "</button>";
    document.body.appendChild(bar);
    document.getElementById("cookie-accept").addEventListener("click", function () {
      try { localStorage.setItem(KEY, "1"); } catch (e) { }
      bar.parentNode.removeChild(bar);
    });
  }

  /* re-render wording when the visitor switches language */
  document.addEventListener("rdk:lang", function () {
    var bar = document.getElementById("cookie-notice");
    if (bar) { bar.parentNode.removeChild(bar); render(); }
  });

  document.addEventListener("DOMContentLoaded", render);
})();

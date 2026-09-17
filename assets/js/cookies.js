/* ============================================================
   RDK Emergency Care — cookie notice
   The banner is shown for at least 5 minutes from the moment
   the visitor first sees it (tracked across pages), and can be
   dismissed earlier with the Accept button. Once 5 minutes
   have passed it is not shown again. No tracking, no external
   scripts.
   ============================================================ */
(function () {
  "use strict";
  var KEY = "rdk-cookie-consent";
  var SHOWN_KEY = "rdk-cookie-shown-at";
  var MIN_MS = 5 * 60 * 1000;
  var hideTimer = null;

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function firstShownAt() {
    var saved = parseInt(read(SHOWN_KEY), 10);
    if (saved) return saved;
    var now = Date.now();
    store(SHOWN_KEY, String(now));
    return now;
  }

  function accept() { store(KEY, "1"); }

  function dismiss(bar) {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  function render() {
    if (document.getElementById("cookie-notice")) return;
    if (read(KEY) === "1") return;
    var elapsed = Date.now() - firstShownAt();
    if (elapsed >= MIN_MS) { accept(); return; }

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
      accept();
      dismiss(bar);
    });
    hideTimer = setTimeout(function () {
      accept();
      dismiss(bar);
    }, MIN_MS - elapsed);
  }

  /* re-render wording when the visitor switches language */
  document.addEventListener("rdk:lang", function () {
    var bar = document.getElementById("cookie-notice");
    if (bar) { dismiss(bar); render(); }
  });

  document.addEventListener("DOMContentLoaded", render);
})();

/* ============================================================
   RDK Emergency Care — cookie notice with consent choice
   The banner is shown for at least 5 minutes from the moment
   the visitor first sees it (tracked across pages). Visitors
   choose "Accept all cookies" or "Essential only"; if the
   banner closes itself after 5 minutes without a choice,
   essential-only is applied. The choice is stored and exposed
   as window.RDK_COOKIE_CONSENT.get() -> "all" | "essential"
   for any future optional-cookie scripts. No tracking.
   ============================================================ */
(function () {
  "use strict";
  var KEY = "rdk-cookie-consent"; /* "all" | "essential" (legacy "1" = all) */
  var SHOWN_KEY = "rdk-cookie-shown-at";
  var MIN_MS = 5 * 60 * 1000;
  var hideTimer = null;

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function consentValue() {
    var v = read(KEY);
    if (v === "all" || v === "1") return "all";
    if (v === "essential") return "essential";
    return null;
  }

  window.RDK_COOKIE_CONSENT = { get: consentValue };

  function consent(choice) { store(KEY, choice); }

  function dismiss(bar) {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  function render() {
    if (document.getElementById("cookie-notice")) return;
    if (consentValue()) return;
    var elapsed = Date.now() - firstShownAt();
    if (elapsed >= MIN_MS) { consent("essential"); return; }

    var t = window.t || function (k) { return k; };
    var bar = document.createElement("div");
    bar.id = "cookie-notice";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Cookies");
    bar.innerHTML =
      '<p>' + t("cookie.text") + ' <a href="privacy.html">' + t("cookie.more") + "</a></p>" +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-outline" id="cookie-essential">' + t("cookie.essential") + "</button>" +
      '<button type="button" class="btn btn-primary" id="cookie-accept-all">' + t("cookie.acceptAll") + "</button>" +
      "</div>";
    document.body.appendChild(bar);
    document.getElementById("cookie-accept-all").addEventListener("click", function () {
      consent("all");
      dismiss(bar);
    });
    document.getElementById("cookie-essential").addEventListener("click", function () {
      consent("essential");
      dismiss(bar);
    });
    /* no explicit choice after 5 minutes -> safest default */
    hideTimer = setTimeout(function () {
      consent("essential");
      dismiss(bar);
    }, MIN_MS - elapsed);
  }

  function firstShownAt() {
    var saved = parseInt(read(SHOWN_KEY), 10);
    if (saved) return saved;
    var now = Date.now();
    store(SHOWN_KEY, String(now));
    return now;
  }

  /* re-render wording when the visitor switches language */
  document.addEventListener("rdk:lang", function () {
    var bar = document.getElementById("cookie-notice");
    if (bar) { dismiss(bar); render(); }
  });

  document.addEventListener("DOMContentLoaded", render);
})();

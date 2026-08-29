/* ============================================================
   RDK Emergency Care — bilingual engine (English / Kiswahili)
   Usage: elements carry data-i18n="key" — text is swapped on
   load and on language change. Dynamic renderers listen for
   the "rdk:lang" event and rebuild.
   ============================================================ */
(function () {
  "use strict";

  var DICT = {
    /* ---------- English ---------- */
    en: {
      "nav.home": "Home",
      "nav.training": "Training",
      "nav.quiz": "Find Your Training",
      "nav.abroad": "Work Abroad",
      "nav.about": "About Us",
      "nav.contact": "Contact",
      "nav.tagline": "Emergency care & first-aid training",

      "hero.badge": "Licensed & incorporated in Tanzania",
      "hero.title": "Every Second Counts. Every Life Matters.",
      "hero.sub": "Professional emergency care and first-aid training across Tanzania — for families, workplaces, schools, and everyone building a future at home or abroad.",
      "hero.ctaQuiz": "Find Your Training — 60 seconds",
      "hero.ctaContact": "Talk to us",
      "hero.cardTitle": "Training that travels with you",
      "hero.cardSub": "First-aid certificates that count at home — and on your CV abroad.",
      "hero.statCourses": "training courses",
      "hero.statResponse": "emergency response",
      "hero.statCertified": "certified training",

      "trust.registered": "Fully registered company",
      "trust.registeredNo": "Incorporation No. 189166923",
      "trust.licensed": "Licensed by Kigamboni Municipal Council",
      "trust.licensedNo": "Business License 2026/27",
      "trust.always": "24/7 emergency response",
      "trust.alwaysSub": "Ambulance & rapid response teams",

      "cta.enrol": "Enrol now",
      "cta.viewCourse": "View course",
      "cta.learnMore": "Learn more",
      "cta.book": "Book this course",

      "misc.perPerson": "per person",
      "misc.langName": "Kiswahili",

      "footer.about": "RDK Emergency Care Company Limited is a Tanzanian emergency medical services and training company. We save lives through rapid response, professional medical care, and innovative emergency solutions.",
      "footer.quickLinks": "Quick links",
      "footer.contact": "Contact",
      "footer.legal": "Legal & compliance",
      "footer.incorp": "Incorporation No. 189166923 — Companies Act, 2002",
      "footer.license": "Business License BL01396942025-2600004032",
      "footer.tin": "TIN 189-166-923",
      "footer.rights": "All rights reserved.",
      "footer.motto": "Every Second Counts — Every Life Matters."
    },

    /* ---------- Kiswahili ---------- */
    sw: {
      "nav.home": "Nyumbani",
      "nav.training": "Mafunzo",
      "nav.quiz": "Pata Mafunzo Yako",
      "nav.abroad": "Kazi za Nje ya Nchi",
      "nav.about": "Kutuhusu",
      "nav.contact": "Wasiliana Nasi",
      "nav.tagline": "Huduma za dharura na mafunzo ya huduma ya kwanza",

      "hero.badge": "Imesajiliwa na kupewa leseni Tanzania",
      "hero.title": "Kila Sekunde Inahesabika. Kila Uhai Unathamani.",
      "hero.sub": "Huduma bora za dharura na mafunzo ya huduma ya kwanza kote Tanzania — kwa familia, maeneo ya kazi, shule, na kila mtu anayeijenga mustakabali hapa nchini au nje ya nchi.",
      "hero.ctaQuiz": "Pata Mafunzo Yako — sekunde 60",
      "hero.ctaContact": "Wasiliana nasi",
      "hero.cardTitle": "Mafunzo yanayosafiri nawe",
      "hero.cardSub": "Vyeti vya huduma ya kwanza vinavyothaminiwa hapa nchini — na kwenye CV yako ng'ambo.",
      "hero.statCourses": "kozi za mafunzo",
      "hero.statResponse": "mwitikio wa dharura",
      "hero.statCertified": "mafunzo yenye cheti",

      "trust.registered": "Kampuni iliyosajiliwa kikamilifu",
      "trust.registeredNo": "Namba ya Usajili 189166923",
      "trust.licensed": "Leseni ya Manispaa ya Kigamboni",
      "trust.licensedNo": "Leseni ya Biashara 2026/27",
      "trust.always": "Huduma za dharura saa 24/7",
      "trust.alwaysSub": "Gari la wagonjwa na timu za haraka",

      "cta.enrol": "Jiandikishe sasa",
      "cta.viewCourse": "Ona kozi",
      "cta.learnMore": "Jifunze zaidi",
      "cta.book": "Booku kozi hii",

      "misc.perPerson": "kwa kila mtu",
      "misc.langName": "English",

      "footer.about": "RDK Emergency Care Company Limited ni kampuni ya Tanzania ya huduma za dharura za kimatibabu na mafunzo. Tuokoa maisha kwa mwitikio wa haraka, huduma bora ya kimatibabu, na suluhisho bora za dharura.",
      "footer.quickLinks": "Viungo vya haraka",
      "footer.contact": "Mawasiliano",
      "footer.legal": "Kisheria na uidhinishaji",
      "footer.incorp": "Namba ya Usajili 189166923 — Sheria ya Makampuni, 2002",
      "footer.license": "Leseni ya Biashara BL01396942025-2600004032",
      "footer.tin": "TIN 189-166-923",
      "footer.rights": "Haki zote zimehifadhiwa.",
      "footer.motto": "Kila Sekunde Inahesabika — Kila Uhai Unathamani."
    }
  };

  var current = null;

  function detect() {
    try {
      var saved = localStorage.getItem("rdk-lang");
      if (saved && DICT[saved]) return saved;
    } catch (e) { /* private mode */ }
    var nav = (navigator.language || "en").toLowerCase();
    return nav.indexOf("sw") === 0 ? "sw" : "en";
  }

  function t(key) {
    var d = DICT[current];
    if (d && Object.prototype.hasOwnProperty.call(d, key)) return d[key];
    var e = DICT.en;
    if (e && Object.prototype.hasOwnProperty.call(e, key)) return e[key];
    return key;
  }

  function apply(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));
    }
    var attrs = scope.querySelectorAll("[data-i18n-attr]");
    for (var j = 0; j < attrs.length; j++) {
      var spec = attrs[j].getAttribute("data-i18n-attr").split(":"); // e.g. "placeholder:misc.x"
      if (spec.length === 2) attrs[j].setAttribute(spec[0], t(spec[1]));
    }
  }

  function setLang(lang, silent) {
    if (!DICT[lang]) lang = "en";
    current = lang;
    document.documentElement.lang = lang;
    try { localStorage.setItem("rdk-lang", lang); } catch (e) { }
    apply(document);
    var btns = document.querySelectorAll("[data-lang-btn]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("is-active", btns[i].getAttribute("data-lang-btn") === lang);
    }
    if (!silent) {
      try { document.dispatchEvent(new CustomEvent("rdk:lang", { detail: { lang: lang } })); }
      catch (e) { /* IE */ }
    }
  }

  window.RDK_I18N = {
    t: t,
    apply: apply,
    setLang: setLang,
    getLang: function () { return current; },
    dict: DICT
  };
  /* Shorthand used by renderers */
  window.t = t;

  document.addEventListener("DOMContentLoaded", function () {
    setLang(detect(), true);
    document.dispatchEvent(new CustomEvent("rdk:lang", { detail: { lang: current } }));
  });
})();

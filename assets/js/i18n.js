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
      "footer.motto": "Every Second Counts — Every Life Matters.",

      "services.eyebrow": "What we do",
      "services.title": "Emergency care, end to end",
      "services.sub": "From 24/7 ambulances to workplace safety programmes — one partner for every emergency.",
      "svc.ambulance.t": "Emergency Ambulance Services",
      "svc.ambulance.d": "Fully equipped ambulances with trained paramedics, available 24/7 for critical transport.",
      "svc.onsite.t": "On-Site Emergency Response",
      "svc.onsite.d": "Rapid response teams for workplaces, schools, events and public gatherings.",
      "svc.training.t": "First Aid & Emergency Training",
      "svc.training.d": "Professional training for individuals, institutions and corporate staff — from CPR to industrial safety.",
      "svc.evac.t": "Medical Evacuations",
      "svc.evac.d": "Ground and, where required, air evacuation coordination to hospitals in Tanzania and beyond.",
      "svc.event.t": "Event Medical Cover",
      "svc.event.d": "Standby medical teams for corporate events, concerts, sports and community activities.",
      "svc.corporate.t": "Corporate Health & Safety",
      "svc.corporate.d": "Tailored emergency response plans for organizations, NGOs, government agencies and industry.",

      "quizband.title": "Not sure where to start?",
      "quizband.sub": "Answer 5 quick questions and we'll match you to the right course — in 60 seconds.",
      "quizband.cta": "Take the quiz",
      "quizband.note": "Free · No sign-up · Instant result",

      "featured.eyebrow": "Popular courses",
      "featured.title": "Start with a course that fits you",
      "featured.sub": "Certified, practical training — priced for Tanzania.",
      "featured.all": "View all 20 courses",

      "abroad.eyebrow": "Work abroad",
      "abroad.title": "First aid: the life skill that opens doors abroad",
      "abroad.sub": "Nurses, caregivers, oil & gas crews, seafarers, chefs, guards — employers in the world's highest-paying sectors expect certified first-aid skills. An RDK certificate strengthens your CV wherever you go.",
      "abroad.cta": "See how it pays off",
      "abroad.cta2": "Find your course",
      "abroad.sectorsCount": "high-paying sectors abroad where certified first aid is expected — one certificate, many doors",

      "packages.eyebrow": "For teams",
      "packages.title": "Corporate & group packages",
      "packages.sub": "Train your whole team at once — certificates, materials and an emergency response guide included.",
      "packages.popular": "Most popular",
      "packages.upTo": "up to",
      "packages.people": "people",
      "packages.from": "From",
      "packages.cta": "Request a quote",
      "packages.schoolNote": "Schools: train 15 staff for TZS 1,500,000 — that is the School Package above, the same value as 15 individual courses.",

      "training.eyebrow": "Training catalogue",
      "training.title": "First-aid training for every walk of life",
      "training.sub": "20 courses — from half-day essentials to 3-day industrial certification. Filter by category, or let the 60-second quiz choose for you.",
      "training.filterLabel": "Filter by category",
      "training.all": "All",
      "training.count": "courses",
      "course.topics": "What you'll learn",
      "course.allTopics": "Show all topics",
      "course.audienceLabel": "Who it's for",

      "quiz.title": "Find your training",
      "quiz.sub": "5 quick questions — we'll match you to the right RDK course and show the price instantly.",
      "quiz.step": "Question",
      "quiz.stepOf": "of 5",
      "quiz.choose": "Select an answer…",
      "quiz.back": "Back",
      "quiz.next": "Next",
      "quiz.seeResults": "See my result",

      "quiz.q1": "Who is this training for?",
      "quiz.q1.personal": "Myself",
      "quiz.q1.team": "My team / staff",
      "quiz.q1.school": "My school",
      "quiz.q1.company": "My company",

      "quiz.q2": "Which describes you best?",
      "quiz.q2.parent": "Parent / caregiver",
      "quiz.q2.teacher": "Teacher / school staff",
      "quiz.q2.office": "Office worker",
      "quiz.q2.hospitality": "Hotel / tourism",
      "quiz.q2.driver": "Driver / transport",
      "quiz.q2.security": "Security personnel",
      "quiz.q2.industrial": "Construction / factory / mining",
      "quiz.q2.healthcare": "Healthcare / lifeguard / fitness",
      "quiz.q2.coach": "Coach / sports",
      "quiz.q2.student": "Student / general public",
      "quiz.q2.abroad": "I plan to work abroad",

      "quiz.q3": "Where will you use it most?",
      "quiz.q3.home": "Home & family",
      "quiz.q3.school": "School",
      "quiz.q3.office": "Office / workplace",
      "quiz.q3.industrial": "Industrial site",
      "quiz.q3.road": "On the road",
      "quiz.q3.outdoors": "Outdoors / events",

      "quiz.q4": "Your first-aid experience?",
      "quiz.q4.none": "Complete beginner",
      "quiz.q4.some": "Trained before — need a refresher",
      "quiz.q4.advanced": "Advanced / professional",

      "quiz.q5": "How much time can you give?",
      "quiz.q5.half": "Half a day",
      "quiz.q5.day": "One full day",
      "quiz.q5.multi": "2–3 days",
      "quiz.q5.flexible": "Flexible — whatever it takes",

      "quiz.results.title": "Your recommendation",
      "quiz.results.sub": "Based on your answers, this is where you should start.",
      "quiz.results.best": "Best match",
      "quiz.results.alternatives": "Also consider",
      "quiz.results.why": "Why this fits you",
      "quiz.results.groupTitle": "For your team",
      "quiz.results.groupSub": "Training a group is cheaper per person — this package fits your answers best.",
      "quiz.results.perPerson": "or train individually at",
      "quiz.results.abroadTitle": "Working abroad?",
      "quiz.results.abroadBody": "Certified first aid is expected by employers in the highest-paying sectors abroad — healthcare, oil & gas, maritime, hospitality and more. Your certificate travels with you.",
      "quiz.results.abroadCta": "See the sectors",
      "quiz.results.restart": "Start over",
      "quiz.results.allCourses": "View all courses",

      "quiz.why.role": "Matches your situation and role",
      "quiz.why.env": "Covers the environment you picked",
      "quiz.why.time": "Fits the time you have",
      "quiz.why.refresher": "Builds on your existing training",
      "quiz.why.advanced": "Deep, professional-level content",
      "quiz.why.abroad": "Recognized by employers abroad",
      "quiz.why.price": "Straightforward per-person pricing"
    },

    /* ---------- Kiswahili ---------- */
    sw: {
      "nav.home": "Nyumbani",
      "nav.training": "Mafunzo",
      "nav.quiz": "Mafunzo yapi yanakufaa?",
      "nav.abroad": "Kazi za Nje ya Nchi",
      "nav.about": "Kutuhusu",
      "nav.contact": "Wasiliana Nasi",
      "nav.tagline": "Huduma za dharura na mafunzo ya huduma ya kwanza",

      "hero.badge": "Imesajiliwa na kupewa leseni Tanzania",
      "hero.title": "Kila Sekunde Inahesabika. Kila Uhai Unathamani.",
      "hero.sub": "Huduma bora za dharura na mafunzo ya huduma ya kwanza kote Tanzania — kwa familia, maeneo ya kazi, shule, na kila mtu anayeijenga mustakabali hapa nchini au nje ya nchi.",
      "hero.ctaQuiz": "Mafunzo yapi yanakufaa? — sekunde 60",
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
      "cta.book": "Weka nafasi yako",

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
      "footer.motto": "Kila Sekunde Inahesabika — Kila Uhai Unathamani.",

      "services.eyebrow": "Tunachofanya",
      "services.title": "Huduma za dharura, kuanzia mwanzo hadi mwisho",
      "services.sub": "Kutoka magari ya wagonjwa saa 24/7 hadi mipango ya usalama kazini — mshirika mmoja kwa kila dharura.",
      "svc.ambulance.t": "Huduma za Gari la Wagonjwa",
      "svc.ambulance.d": "Magari ya wagonjwa yenye vifaa kamili na wataalamu, saa 24/7 kwa usafiri wa dharura.",
      "svc.onsite.t": "Mwitikio wa Dharura Maeneo ya Kazi",
      "svc.onsite.d": "Timu za mwitikio wa haraka kwa maeneo ya kazi, shule, matukio na mikusano ya umma.",
      "svc.training.t": "Mafunzo ya Huduma ya Kwanza na Dharura",
      "svc.training.d": "Mafunzo bora kwa watu binafsi, taasisi na wafanyakazi — kutoka CPR hadi usalama wa viwanda.",
      "svc.evac.t": "Uhamishaji wa Kimatibabu",
      "svc.evac.d": "Uratibu wa uhamishaji barabarani na kwa ndege hadi hospitali Tanzania na nje ya nchi.",
      "svc.event.t": "Uangalizi wa Matukio",
      "svc.event.d": "Timu za kimatibabu tayari kwa matukio ya kampuni, konserti, michezo na shughuli za jamii.",
      "svc.corporate.t": "Usalama na Afya ya Makampuni",
      "svc.corporate.d": "Mipango maalum ya mwitikio wa dharura kwa taasisi, NGO, mashirika ya serikali na viwanda.",

      "quizband.title": "Haujui kuanzia wapi?",
      "quizband.sub": "Jibu maswali 5 mafupi na tutakupa kozi sahihi — kwa sekunde 60.",
      "quizband.cta": "Anza jaribio",
      "quizband.note": "Bure · Hakuna usajili · Jibu la papo hapo",

      "featured.eyebrow": "Kozi maarufu",
      "featured.title": "Anza na kozi inayokufaa",
      "featured.sub": "Mafunzo ya vitendo yenye cheti — kwa bei ya Tanzania.",
      "featured.all": "Ona kozi zote 20",

      "abroad.eyebrow": "Kazi za nje ya nchi",
      "abroad.title": "Huduma ya kwanza: ujuzi unaofungua milango ng'ambo",
      "abroad.sub": "WaNesa, walezi, wafanyakazi wa mafuta na gesi, baharia, wapishi, walinzi — sekta za malipo ya juu zaidi duniani zinatarajia ujuzi wa huduma ya kwanza wenye cheti. Cheti cha RDK kinaimarisha CV yako popote ulipo.",
      "abroad.cta": "Ona jinsi kunavyolipa",
      "abroad.cta2": "Pata kozi yako",
      "abroad.sectorsCount": "sekta za malipo ya juu ng'ambo zinazotarajia cheti cha huduma ya kwanza — cheti moja, milango mingi",

      "packages.eyebrow": "Kwa timu",
      "packages.title": "Paket za makampuni na makundi",
      "packages.sub": "Fundisha timu yako yote kwa pamoja — vyeti, vifaa na mwongozo wa dharura vimemo.",
      "packages.popular": "Maarufu zaidi",
      "packages.upTo": "hadi",
      "packages.people": "watu",
      "packages.from": "Kuanzia",
      "packages.cta": "Omba bei",
      "packages.schoolNote": "Shule: fundisha wafanyakazi 15 kwa TZS 1,500,000 — hiyo ni Paket ya Shule hapo juu, thamani ile ile ya kozi 15 binafsi.",

      "training.eyebrow": "Orodha ya mafunzo",
      "training.title": "Mafunzo ya huduma ya kwanza kwa kila mtu",
      "training.sub": "Kozi 20 — kutoka mafunzo mafupi ya nusu siku hadi cheti cha siku 3 cha viwanda. Chuja kwa kategoria, au acha jaribio la sekunde 60 lichague kwa ajili yako.",
      "training.filterLabel": "Chuja kwa kategoria",
      "training.all": "Zote",
      "training.count": "kozi",
      "course.topics": "Utajifunza nini",
      "course.allTopics": "Ona mada zote",
      "course.audienceLabel": "Kwa nani",

      "quiz.title": "Mafunzo yapi yanakufaa?",
      "quiz.sub": "Maswali 5 mafupi — tutakupa kozi sahihi ya RDK na bei yake papo hapo.",
      "quiz.step": "Swali",
      "quiz.stepOf": "kati ya 5",
      "quiz.choose": "Chagua jibu…",
      "quiz.back": "Rudi",
      "quiz.next": "Endelea",
      "quiz.seeResults": "Ona jibu langu",

      "quiz.q1": "Swali la 1 kati ya 5 — Mafunzo haya ni kwa ajili ya nani?",
      "quiz.q1.personal": "Mimi mwenyewe",
      "quiz.q1.team": "Timu yangu / wafanyakazi",
      "quiz.q1.school": "Shule yangu",
      "quiz.q1.company": "Kampuni yangu",

      "quiz.q2": "Swali la 2 kati ya 5 — Wewe ni nani?",
      "quiz.q2.parent": "Mzazi / mlezi",
      "quiz.q2.teacher": "Mwalimu / wafanyakazi wa shule",
      "quiz.q2.office": "Mfanyakazi wa ofisi",
      "quiz.q2.hospitality": "Hoteli / utalii",
      "quiz.q2.driver": "Dereva / usafiri",
      "quiz.q2.security": "Walinda usalama",
      "quiz.q2.industrial": "Ujenzi / kiwanda / madini",
      "quiz.q2.healthcare": "Afya / kuokoa majini / mazoezi",
      "quiz.q2.coach": "Kocha / michezo",
      "quiz.q2.student": "Mwanafunzi / umma",
      "quiz.q2.abroad": "Napanga kufanya kazi nje ya nchi",

      "quiz.q3": "Swali la 3 kati ya 5 — Elimu utakayopata, itaitajika wapi zaidi?",
      "quiz.q3.home": "Nyumbani na familia",
      "quiz.q3.school": "Shuleni",
      "quiz.q3.office": "Ofisi / mahali pa kazi",
      "quiz.q3.industrial": "Eneo la viwanda",
      "quiz.q3.road": "Barabarani",
      "quiz.q3.outdoors": "Nje ya nyumba / matukio",

      "quiz.q4": "Swali la 4 kati ya 5 — Chagua kiwango chako cha huduma ya kwanza",
      "quiz.q4.none": "Mwanzo kabisa",
      "quiz.q4.some": "Nilifunzwa — nahitaji marudio",
      "quiz.q4.advanced": "Pevu / kitaalamu",

      "quiz.q5": "Swali la 5 kati ya 5 — Una muda kiasi gani wa kujifunza?",
      "quiz.q5.half": "Nusu siku",
      "quiz.q5.day": "Siku moja kamili",
      "quiz.q5.multi": "Siku 2–3",
      "quiz.q5.flexible": "Nyumbulishi — kwa muda wowote",

      "quiz.results.title": "Mapendekezo yako",
      "quiz.results.sub": "Kulingana na majibu yako, hapa pa kuanzia.",
      "quiz.results.best": "Ulinganisho bora",
      "quiz.results.alternatives": "Pia zingatia",
      "quiz.results.why": "Kwa nini hii inakufaa",
      "quiz.results.groupTitle": "Kwa timu yako",
      "quiz.results.groupSub": "Kufundisha kundi ni nafuu zaidi kwa kila mtu — paket hii inalingana na majibu yako.",
      "quiz.results.perPerson": "au fundishwa binafsi kwa",
      "quiz.results.abroadTitle": "Unafanya kazi nje ya nchi?",
      "quiz.results.abroadBody": "Cheti cha huduma ya kwanza kinatarajiwa na wafanyakazi wa sekta za malipo ya juu zaidi ng'ambo — afya, mafuta na gesi, bahari, utalii na zaidi. Cheti chako kinasafiri nawe.",
      "quiz.results.abroadCta": "Ona sekta zote",
      "quiz.results.restart": "Anza upya",
      "quiz.results.allCourses": "Ona kozi zote",

      "quiz.why.role": "Inalingana na hali yako na wadhifa wako",
      "quiz.why.env": "Inashughulikia mazingira uliyochagua",
      "quiz.why.time": "Inaendana na muda ulionao",
      "quiz.why.refresher": "Inajenga juu ya mafunzo yako ya awali",
      "quiz.why.advanced": "Maudhui ya kina, kitaalamu",
      "quiz.why.abroad": "Kinatambuliwa na waajiri wa ng'ambo",
      "quiz.why.price": "Bei wazi ya kila mtu"
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

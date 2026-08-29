/* ============================================================
   RDK Emergency Care — "Find Your Training" quiz
   5-question wizard with weighted scoring over RDK.courses,
   a corporate/group branch and a work-abroad branch.
   ============================================================ */
(function () {
  "use strict";

  var QUESTIONS = [
    {
      id: "audience", key: "quiz.q1", cols: 2,
      options: [
        { value: "personal", label: "quiz.q1.personal" },
        { value: "team", label: "quiz.q1.team" },
        { value: "school", label: "quiz.q1.school" },
        { value: "company", label: "quiz.q1.company" }
      ]
    },
    {
      id: "role", key: "quiz.q2", cols: 2,
      options: [
        { value: "parent", label: "quiz.q2.parent" },
        { value: "teacher", label: "quiz.q2.teacher" },
        { value: "office", label: "quiz.q2.office" },
        { value: "hospitality", label: "quiz.q2.hospitality" },
        { value: "driver", label: "quiz.q2.driver" },
        { value: "security", label: "quiz.q2.security" },
        { value: "industrial", label: "quiz.q2.industrial" },
        { value: "healthcare", label: "quiz.q2.healthcare" },
        { value: "coach", label: "quiz.q2.coach" },
        { value: "student", label: "quiz.q2.student" },
        { value: "abroad", label: "quiz.q2.abroad" }
      ]
    },
    {
      id: "environment", key: "quiz.q3", cols: 2,
      options: [
        { value: "home", label: "quiz.q3.home" },
        { value: "school", label: "quiz.q3.school" },
        { value: "office", label: "quiz.q3.office" },
        { value: "industrial", label: "quiz.q3.industrial" },
        { value: "road", label: "quiz.q3.road" },
        { value: "outdoors", label: "quiz.q3.outdoors" }
      ]
    },
    {
      id: "experience", key: "quiz.q4", cols: 1,
      options: [
        { value: "none", label: "quiz.q4.none" },
        { value: "some", label: "quiz.q4.some" },
        { value: "advanced", label: "quiz.q4.advanced" }
      ]
    },
    {
      id: "time", key: "quiz.q5", cols: 2,
      options: [
        { value: "half", label: "quiz.q5.half" },
        { value: "day", label: "quiz.q5.day" },
        { value: "multi", label: "quiz.q5.multi" },
        { value: "flexible", label: "quiz.q5.flexible" }
      ]
    }
  ];

  var TIME_BUDGET = { half: 5, day: 8, multi: 24, flexible: 99 };
  /* the flagship course for each role — gets a small boost so the top
     recommendation is the most complete fit, not just the cheapest tie */
  var ROLE_FLAGSHIP = {
    parent: "child-infant",
    teacher: "school-first-aid",
    office: "work-first-aid",
    hospitality: "hospitality-tourism",
    driver: "drivers-first-aid",
    security: "security-first-aid",
    industrial: "industrial",
    healthcare: "cpr-aed-bls",
    coach: "sports-first-aid",
    student: "community-first-aid",
    abroad: "cpr-aed-bls"
  };

  var step = 0;
  var answers = {};
  var el = function (id) { return document.getElementById(id); };

  function t(k) { return window.t ? window.t(k) : k; }
  function lang() { return window.RDK_I18N ? window.RDK_I18N.getLang() : "en"; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function bi(o) { return (o && (o[lang()] || o.en)) || ""; }

  /* ---------- scoring ---------- */
  function scoreCourses() {
    var role = answers.role;
    var env = answers.environment;
    var exp = answers.experience;
    var budget = TIME_BUDGET[answers.time] || 99;

    return window.RDK.courses.map(function (c) {
      var s = 0, why = [];
      if (c.roles && c.roles.indexOf(role) !== -1) { s += 4; why.push("role"); }
      if (c.roles && c.roles.indexOf("general") !== -1 && role === "student") { s += 2; }
      if (c.env && c.env.indexOf(env) !== -1) { s += 2; why.push("env"); }

      if (exp === "some" && c.refresher) { s += 4; why.push("refresher"); }
      if (exp === "some" && c.id === "occupational-refresher") { s += 3; }
      if (exp === "advanced" && c.hours >= 16) { s += 2; why.push("advanced"); }
      if (exp === "none" && c.hours <= 8) { s += 1; }

      if (answers.time === "flexible") { s += 2; why.push("time"); }
      else if (c.hours <= budget) { s += 3; why.push("time"); }
      else if (c.hours <= budget * 2) { s += 1; }

      if (role === "abroad" && c.abroad) { s += 5; why.push("abroad"); }
      if (ROLE_FLAGSHIP[role] && c.id === ROLE_FLAGSHIP[role]) { s += 2; }

      why.push("price");
      return { course: c, score: s, why: why };
    }).sort(function (a, b) { return b.score - a.score || a.course.price - b.course.price; });
  }

  function bestPackage() {
    var a = answers.audience;
    var find = function (id) {
      return window.RDK.packages.filter(function (p) { return p.id === id; })[0];
    };
    if (a === "school") return find("school");
    if (a === "team") return find("sme");
    if (a === "company") {
      return answers.role === "industrial" ? find("industrial-package") : find("corporate");
    }
    return null;
  }

  /* ---------- rendering ---------- */
  function renderQuestion() {
    var q = QUESTIONS[step];
    var html =
      '<div class="quiz-progress">' +
      '<div class="meta"><span>' + esc(t("quiz.step")) + " " + (step + 1) + " " + esc(t("quiz.stepOf")) +
      '</span><span>' + Math.round((step / QUESTIONS.length) * 100) + "%</span></div>" +
      '<div class="progress-track"><div class="progress-fill" style="width:' + (step / QUESTIONS.length * 100) + '%"></div></div></div>' +
      '<h2 class="quiz-q">' + esc(t(q.key)) + "</h2>" +
      '<div class="opts' + (q.cols === 2 ? " two-col" : "") + '" role="radiogroup" aria-label="' + esc(t(q.key)) + '">';

    q.options.forEach(function (o) {
      html +=
        '<label class="opt"><input type="radio" name="quiz-' + q.id + '" value="' + o.value + '"' +
        (answers[q.id] === o.value ? " checked" : "") + ">" +
        '<span class="opt-body">' + esc(t(o.label)) + "</span></label>";
    });
    html += "</div>";

    html += '<div class="quiz-nav">' +
      (step > 0
        ? '<button type="button" class="btn btn-ghost" id="quiz-back">' + esc(t("quiz.back")) + "</button>"
        : "<span></span>") +
      '<button type="button" class="btn btn-primary" id="quiz-next" disabled>' +
      (step === QUESTIONS.length - 1 ? esc(t("quiz.seeResults")) : esc(t("quiz.next"))) +
      "</button></div>";

    el("quiz-body").innerHTML = html;

    var nextBtn = el("quiz-next");
    var inputs = el("quiz-body").querySelectorAll("input[type=radio]");
    Array.prototype.forEach.call(inputs, function (inp) {
      inp.addEventListener("change", function () {
        answers[q.id] = inp.value;
        nextBtn.disabled = false;
      });
    });
    if (answers[q.id]) nextBtn.disabled = false;

    el("quiz-back") && el("quiz-back").addEventListener("click", function () {
      step--; renderQuestion();
    });
    nextBtn.addEventListener("click", function () {
      if (step < QUESTIONS.length - 1) { step++; renderQuestion(); }
      else renderResults();
    });
  }

  function courseResultCard(r, best) {
    var c = r.course;
    var msg = (lang() === "sw"
      ? "Habari RDK! Kutoka jaribio: napenda kozi "
      : "Hello RDK! From the quiz: I'd like the course ") + bi(c.name) + " (" + window.RDK.price(c.price) + ").";
    return (
      '<div class="' + (best ? "result-best" : "card") + '">' +
      (best ? '<span class="best-tag">' + esc(t("quiz.results.best")) + "</span>" : "") +
      "<h3>" + esc(bi(c.name)) + "</h3>" +
      '<div class="course-meta"><span class="pill outline">' + esc(bi(c.duration)) + '</span>' +
      '<span class="pill price">' + window.RDK.price(c.price) + " · " + esc(t("misc.perPerson")) + "</span></div>" +
      (best ? '<ul class="why-list">' + r.why.slice(0, 4).map(function (w) {
        return "<li>" + esc(t("quiz.why." + w)) + "</li>";
      }).join("") + "</ul>" : '<p class="muted" style="font-size:.9rem;margin-top:.5rem;">' + esc(bi(c.audience)) + "</p>") +
      '<div class="quiz-result-actions">' +
      '<a class="btn ' + (best ? "btn-accent" : "btn-primary") + '" target="_blank" rel="noopener" href="' +
      window.rdkWhatsApp(msg) + '">' + esc(t("cta.book")) + "</a>" +
      (best ? '<a class="btn btn-outline" href="training.html">' + esc(t("quiz.results.allCourses")) + "</a>" : "") +
      "</div></div>"
    );
  }

  function renderResults() {
    var ranked = scoreCourses();
    var pkg = answers.audience !== "personal" ? bestPackage() : null;
    var html = '<h2 class="quiz-q">' + esc(t("quiz.results.title")) + "</h2>" +
      '<p class="muted" style="margin-top:-.6rem;">' + esc(t("quiz.results.sub")) + "</p>";

    if (pkg) {
      var perHead = answers.role === "industrial" ? null : Math.round(pkg.price / (pkg.group || 1));
      html += "<h3 style=\"margin-top:1.2rem;\">" + esc(t("quiz.results.groupTitle")) + "</h3>" +
        "<p class=\"muted\" style=\"font-size:.92rem;\">" + esc(t("quiz.results.groupSub")) + "</p>" +
        '<div class="result-best"><span class="best-tag">' + esc(t("quiz.results.best")) + "</span>" +
        "<h3>" + esc(bi(pkg.name)) + "</h3>" +
        '<div class="course-meta"><span class="pill price">' + window.RDK.price(pkg.price) +
        (pkg.priceNote ? "+" : "") + '</span><span class="pill outline">' +
        (pkg.group ? pkg.group + " " + (lang() === "sw" ? "watu" : "people") : esc(bi(pkg.audience))) + "</span></div>" +
        '<ul class="why-list"><li>' + esc(t("quiz.why.role")) + "</li>" +
        (pkg.group ? "<li>≈ " + window.RDK.price(perHead) + " / " + esc(t("misc.perPerson")) + "</li>" : "") +
        "</ul>" +
        '<div class="quiz-result-actions">' +
        '<a class="btn btn-accent" target="_blank" rel="noopener" href="' +
        window.rdkWhatsApp((lang() === "sw" ? "Habari RDK! Naomba bei ya paket: " : "Hello RDK! Quote request for: ") + bi(pkg.name)) +
        '">' + esc(t("packages.cta")) + "</a></div></div>";

      html += '<h3 style="margin-top:1.4rem;">' + esc(t("quiz.results.alternatives")) + "</h3>";
      html += '<div class="card-grid">' + ranked.slice(0, 2).map(function (r) {
        return courseResultCard(r, false);
      }).join("") + "</div>";
      html += '<p class="muted" style="font-size:.86rem;margin-top:.8rem;">' +
        esc(t("quiz.results.perPerson")) + " " + window.RDK.price(ranked[0].course.price) + " " + esc(t("misc.perPerson")) + "</p>";
    } else {
      html += courseResultCard(ranked[0], true);
      html += '<h3 style="margin-top:1.6rem;">' + esc(t("quiz.results.alternatives")) + "</h3>";
      html += '<div class="card-grid">' + ranked.slice(1, 3).map(function (r) {
        return courseResultCard(r, false);
      }).join("") + "</div>";
    }

    if (answers.role === "abroad") {
      html += '<div class="abroad-note"><h4>' + esc(t("quiz.results.abroadTitle")) + "</h4>" +
        "<p>" + esc(t("quiz.results.abroadBody")) + "</p>" +
        '<a class="btn btn-outline" href="work-abroad.html">' + esc(t("quiz.results.abroadCta")) + "</a></div>";
    }

    html += '<div class="quiz-result-actions">' +
      '<button type="button" class="btn btn-ghost" id="quiz-restart">' + esc(t("quiz.results.restart")) + "</button></div>";

    el("quiz-body").innerHTML = html;
    el("quiz-restart").addEventListener("click", function () {
      step = 0; answers = {}; renderQuestion();
    });
    document.dispatchEvent(new CustomEvent("rdk:quiz-result", { detail: { top: ranked[0].course.id } }));
  }

  /* ---------- boot & language ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (!el("quiz-body")) return;
    renderQuestion();
    document.addEventListener("rdk:lang", function () {
      /* re-render the current screen in the new language, keeping progress */
      if (el("quiz-restart")) renderResults();
      else renderQuestion();
    });
  });
})();

(function () {
  "use strict";

  const ids = [
    "who", "where", "issue", "involvement", "changed", "why", "quote",
    "howmany", "timeframe", "results", "donor", "partner", "phase", "link"
  ];
  const fields = {};
  ids.forEach((id) => { fields[id] = document.getElementById(id); });

  const outputs = {
    meta: document.getElementById("meta-output"),
    linkedin: document.getElementById("linkedin-output"),
    website: document.getElementById("website-output"),
  };
  const meters = {
    meta: document.getElementById("meta-meter"),
    linkedin: document.getElementById("linkedin-meter"),
    website: document.getElementById("website-meter"),
  };
  const photoReminder = document.getElementById("photo-reminder");
  const scanCard = document.getElementById("scan-card");
  const scanList = document.getElementById("scan-list");

  // ---------- text helpers ----------

  function clean(s) {
    return (s || "").trim().replace(/[.\s]+$/, "");
  }
  function upper1(s) {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function lower1(s) {
    if (!s) return s;
    return s.charAt(0).toLowerCase() + s.slice(1);
  }
  function sentenceFrom(raw) {
    const c = clean(raw);
    if (!c) return "";
    return upper1(c) + ".";
  }
  function firstName(who) {
    const c = clean(who);
    if (!c) return "";
    return c.split(",")[0].trim();
  }
  function stripQuotes(s) {
    let t = (s || "").trim();
    t = t.replace(/^["“”']+/, "").replace(/["“”']+$/, "");
    t = t.trim();
    if (t && !/[.!?]$/.test(t)) t += ".";
    return t;
  }
  function stripLeadingSince(s) {
    return (s || "").replace(/^since\s+/i, "");
  }
  function joinSentences(list) {
    return list.filter(Boolean).join(" ");
  }
  function countSentences(text) {
    if (!text) return 0;
    const matches = text.match(/[.!?]+(?=\s|$)/g);
    return matches ? matches.length : (text.trim() ? 1 : 0);
  }

  // ---------- caption builders ----------

  function val(id) {
    return clean(fields[id].value);
  }

  function buildMeta(v) {
    const sentences = [];

    if (v.who && v.where) sentences.push(`${upper1(v.who)}, from ${v.where}.`);
    else if (v.who) sentences.push(`${upper1(v.who)}.`);
    else if (v.where) sentences.push(`${upper1(v.where)}.`);

    if (v.issue) sentences.push(sentenceFrom(v.issue));

    if (v.involvement || v.changed) {
      let s = "";
      if (v.donor) s += `With the support of ${v.donor}, `;
      if (v.involvement) s += v.donor ? lower1(v.involvement) : upper1(v.involvement);
      if (v.changed) {
        s += s ? ", and now " : (v.donor ? `With the support of ${v.donor}, now ` : "Now ");
        s += lower1(v.changed);
      }
      s = clean(s) + ".";
      sentences.push(s);
    }

    return joinSentences(sentences);
  }

  function buildLinkedin(v) {
    const sentences = [];

    let s1 = "";
    if (v.timeframe) s1 += `Since ${stripLeadingSince(v.timeframe)}, `;
    if (v.where) s1 += `our team in ${v.where} `;
    else s1 += s1 ? "our team " : "Our team ";
    if (v.howmany) s1 += `has reached ${v.howmany}`;
    else s1 += "has been at work";
    if (v.results) s1 += `; ${lower1(v.results)}`;
    s1 = clean(upper1(s1)) + ".";
    sentences.push(s1);

    if (v.donor || v.changed) {
      let s2 = "";
      if (v.donor) {
        s2 += `With the support of ${v.donor}`;
        if (v.partner) s2 += ` and ${v.partner}`;
        s2 += ", ";
      }
      s2 += v.changed ? (v.donor ? lower1(v.changed) : upper1(v.changed)) : "";
      s2 = clean(s2) + ".";
      if (s2 !== ".") sentences.push(s2);
    }

    if (v.why) sentences.push(sentenceFrom(v.why));
    if (v.phase) sentences.push(sentenceFrom(v.phase));
    if (v.link) sentences.push(`Read the full story on our website: ${v.link}.`);

    return joinSentences(sentences);
  }

  function buildWebsite(v) {
    const sentences = [];

    if (v.quote) {
      const q = upper1(stripQuotes(v.quote));
      const name = firstName(v.who) || "they say";
      sentences.push(`“${q}” — ${name}.`);
    }

    if (v.who && v.where) sentences.push(`${upper1(v.who)}, from ${v.where}.`);
    else if (v.who) sentences.push(`${upper1(v.who)}.`);
    else if (v.where) sentences.push(`${upper1(v.where)}.`);

    if (v.issue) sentences.push(sentenceFrom(v.issue));
    if (v.why) sentences.push(sentenceFrom(v.why));

    if (v.donor || v.partner || v.involvement) {
      let s = "";
      if (v.donor || v.partner) {
        s += "With the support of ";
        s += v.donor ? v.donor : "our partners";
        if (v.partner) s += ` and ${v.partner}`;
        s += ", ";
      }
      s += v.involvement ? (s ? lower1(v.involvement) : upper1(v.involvement)) : "";
      s = clean(s) + ".";
      if (s !== ".") sentences.push(s);
    }

    if (v.changed) sentences.push(sentenceFrom(v.changed));

    if (v.howmany || v.timeframe || v.results) {
      let s = "";
      if (v.timeframe) s += `${upper1(v.timeframe)}, `;
      if (v.howmany) s += `the program has reached ${v.howmany}`;
      else s += s ? "the program has grown" : "The program has grown";
      if (v.results) s += `${v.howmany ? ";" : ","} ${lower1(v.results)}`;
      s = clean(s) + ".";
      sentences.push(s);
    }

    return joinSentences(sentences);
  }

  // ---------- cliché / AI-tell scanner ----------

  const HARD_PHRASES = [
    "in today's world", "in today's fast-paced", "delve into", "delve",
    "moreover", "furthermore", "it is important to note", "it's important to note",
    "unwavering", "tapestry", "testament to", "a testament", "boundless",
    "embark on", "embark upon", "the journey of", "unlock the power",
    "harness the power", "in conclusion", "at the end of the day",
    "game-changer", "game changer", "revolutionize", "seamless", "cutting-edge",
    "leverage the power", "in a world where", "join us in", "together we can",
    "the power of", "make a difference", "changing lives", "changed forever",
    "against all odds", "living proof", "a beacon of hope", "shine a light",
    "paint a picture", "navigate the complexities", "underscores the importance",
    "plays a crucial role", "plays a vital role", "ever-evolving landscape",
    "stands as a", "serves as a reminder", "when it comes to"
  ];

  const SOFT_WORDS = [
    "vulnerable", "resilient", "resilience", "empower", "empowering",
    "voiceless", "underprivileged", "less fortunate", "give back",
    "make an impact", "champion", "passionate about"
  ];

  function scanText(label, text) {
    const hits = [];
    if (!text) return hits;
    const lower = text.toLowerCase();
    HARD_PHRASES.forEach((phrase) => {
      if (lower.includes(phrase)) {
        hits.push({ phrase, label, tier: "hard" });
      }
    });
    SOFT_WORDS.forEach((word) => {
      const re = new RegExp(`\\b${word}\\b`, "i");
      if (re.test(text)) {
        hits.push({ phrase: word, label, tier: "soft" });
      }
    });
    return hits;
  }

  function renderScan(allHits) {
    if (!allHits.length) {
      scanCard.hidden = true;
      scanList.innerHTML = "";
      return;
    }
    scanCard.hidden = false;
    scanList.innerHTML = "";
    allHits.forEach((hit) => {
      const li = document.createElement("li");
      const tierNote = hit.tier === "hard"
        ? "reads like stock AI copy — cut it or replace with a concrete detail"
        : "overused nonprofit shorthand — consider naming the specific detail instead";
      li.innerHTML = `<span class="flag-word">${hit.phrase}</span> in ${hit.label} &mdash; <span class="flag-loc">${tierNote}</span>`;
      scanList.appendChild(li);
    });
  }

  // ---------- meter ----------

  function setMeter(el, count, min, softMax) {
    el.classList.remove("ok", "warn");
    if (count === 0) {
      el.textContent = "";
      return;
    }
    if (count < min || (softMax && count > softMax)) {
      el.classList.add("warn");
    } else {
      el.classList.add("ok");
    }
    el.textContent = `${count} sentence${count === 1 ? "" : "s"}`;
  }

  // ---------- main render ----------

  function render() {
    const v = {};
    ids.forEach((id) => { v[id] = val(id); });

    const metaText = buildMeta(v);
    const linkedinText = buildLinkedin(v);
    const websiteText = buildWebsite(v);

    outputs.meta.textContent = metaText;
    outputs.linkedin.textContent = linkedinText;
    outputs.website.textContent = websiteText;

    setMeter(meters.meta, countSentences(metaText), 2, 4);
    setMeter(meters.linkedin, countSentences(linkedinText), 3, null);
    setMeter(meters.website, countSentences(websiteText), 5, null);

    photoReminder.hidden = !websiteText;

    const hits = [
      ...scanText("Instagram/Facebook", metaText),
      ...scanText("LinkedIn", linkedinText),
      ...scanText("Website", websiteText),
      ...scanText("your Quote box", v.quote),
      ...scanText("your Why box", v.why),
    ];
    renderScan(hits);
  }

  // ---------- events ----------

  ids.forEach((id) => {
    fields[id].addEventListener("input", render);
  });

  document.getElementById("toggle-guide").addEventListener("click", () => {
    const guide = document.getElementById("guide");
    guide.hidden = !guide.hidden;
  });

  document.getElementById("clear-btn").addEventListener("click", () => {
    ids.forEach((id) => { fields[id].value = ""; });
    render();
  });

  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetId = btn.getAttribute("data-target");
      const text = document.getElementById(targetId).textContent;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      const original = btn.textContent;
      btn.textContent = "Copied";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("copied");
      }, 1400);
    });
  });

  render();
})();

(function () {
  "use strict";

  const ids = [
    "who", "where", "issue", "involvement", "changed", "why", "quote",
    "howmany", "timeframe", "results", "donor", "partner",
    "donorHandle", "partnerHandle", "orgHandle", "programme",
    "phase", "link"
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

  const variantIndex = { meta: 0, linkedin: 0, website: 0 };

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
  function pick(bank, variant) {
    return bank[variant % bank.length];
  }

  // ---------- phrasing variants (for "Regenerate") ----------

  const WHERE_LEADINS = [
    (w) => `from ${w}`,
    (w) => `based in ${w}`,
    (w) => `in ${w}`,
  ];
  const DONOR_LEADINS = [
    (d) => `With the support of ${d}`,
    (d) => `Thanks to ${d}`,
    (d) => `With ${d}'s support`,
  ];
  const NOW_WORDS = ["now", "today", "since then"];
  const TIMEFRAME_LEADINS = ["Since", "As of", "Starting"];
  const LINK_LEADINS = [
    "Read the full story on our website:",
    "Full story on our website:",
    "See the full story at",
  ];
  const DONOR_CREDIT_TAILS = [
    (d) => `${DONOR_LEADINS[0](d)}, our team was able to respond.`,
    (d) => `${DONOR_LEADINS[1](d)}, we were able to act quickly.`,
    (d) => `${DONOR_LEADINS[2](d)}, this response was possible.`,
  ];
  const PARTNER_PHRASES = [
    (p) => `${upper1(p)} worked alongside us on the ground throughout.`,
    (p) => `${upper1(p)} was a critical partner in making this happen.`,
    (p) => `Our local partner, ${p}, carried out much of this work directly.`,
  ];

  // ---------- caption builders ----------

  function val(id) {
    const el = fields[id];
    if (!el) return "";
    return clean(el.value);
  }

  function buildMeta(v, variant) {
    const sentences = [];
    const whereLeadin = WHERE_LEADINS[variant % WHERE_LEADINS.length];
    const donorLeadin = DONOR_LEADINS[variant % DONOR_LEADINS.length];
    const nowWord = NOW_WORDS[variant % NOW_WORDS.length];

    if (v.who && v.where) sentences.push(`${upper1(v.who)}, ${whereLeadin(v.where)}.`);
    else if (v.who) sentences.push(`${upper1(v.who)}.`);
    else if (v.where) sentences.push(`${upper1(v.where)}.`);

    if (v.issue) sentences.push(sentenceFrom(v.issue));

    if (v.involvement || v.changed) {
      let s = "";
      if (v.donor) s += `${donorLeadin(v.donor)}, `;
      if (v.involvement) s += v.donor ? lower1(v.involvement) : upper1(v.involvement);
      if (v.changed) {
        s += s ? `, and ${nowWord} ` : (v.donor ? `${donorLeadin(v.donor)}, ${nowWord} ` : `${upper1(nowWord)} `);
        s += lower1(v.changed);
      }
      s = clean(s) + ".";
      sentences.push(s);
    }

    return joinSentences(sentences);
  }

  function buildLinkedin(v, variant) {
    const sentences = [];
    const timeframeLeadin = pick(TIMEFRAME_LEADINS, variant);
    const donorLeadin = DONOR_LEADINS[variant % DONOR_LEADINS.length];
    const linkLeadin = pick(LINK_LEADINS, variant);
    const whereLeadin = WHERE_LEADINS[variant % WHERE_LEADINS.length];

    if (v.who && v.where) sentences.push(`${upper1(v.who)}, ${whereLeadin(v.where)}.`);
    else if (v.who) sentences.push(`${upper1(v.who)}.`);

    if (v.issue) sentences.push(sentenceFrom(v.issue));

    let s1 = "";
    if (v.timeframe) s1 += `${timeframeLeadin} ${stripLeadingSince(v.timeframe)}, `;
    if (v.where) s1 += `our team in ${v.where} `;
    else s1 += s1 ? "our team " : "Our team ";
    if (v.howmany) s1 += `has reached ${v.howmany}`;
    else s1 += "has been at work";
    s1 = clean(upper1(s1)) + ".";
    sentences.push(s1);

    if (v.results) sentences.push(sentenceFrom(v.results));

    if (v.donor || v.changed) {
      let s2 = "";
      if (v.donor) {
        s2 += donorLeadin(v.donor);
        if (v.partner) s2 += ` and ${v.partner}`;
        s2 += ", ";
      }
      s2 += v.changed ? (v.donor ? lower1(v.changed) : upper1(v.changed)) : "";
      s2 = clean(s2) + ".";
      if (s2 !== ".") sentences.push(s2);
    }

    if (v.why) sentences.push(sentenceFrom(v.why));
    if (v.phase) sentences.push(sentenceFrom(v.phase));
    if (v.link) sentences.push(`${linkLeadin} ${v.link}.`);

    return joinSentences(sentences);
  }

  function buildWebsite(v, variant) {
    const sentences = [];
    const whereLeadin = WHERE_LEADINS[variant % WHERE_LEADINS.length];
    const timeframeLeadin = pick(TIMEFRAME_LEADINS, variant);

    if (v.quote) {
      const q = upper1(stripQuotes(v.quote));
      const name = firstName(v.who) || "they say";
      sentences.push(`“${q}” — ${name}.`);
    }

    if (v.who && v.where) sentences.push(`${upper1(v.who)}, ${whereLeadin(v.where)}.`);
    else if (v.who) sentences.push(`${upper1(v.who)}.`);
    else if (v.where) sentences.push(`${upper1(v.where)}.`);

    if (v.issue) sentences.push(sentenceFrom(v.issue));
    if (v.why) sentences.push(sentenceFrom(v.why));

    if (v.donor) sentences.push(pick(DONOR_CREDIT_TAILS, variant)(v.donor));
    if (v.partner) sentences.push(pick(PARTNER_PHRASES, variant)(v.partner));
    if (v.involvement) sentences.push(sentenceFrom(v.involvement));
    if (v.changed) sentences.push(sentenceFrom(v.changed));

    if (v.timeframe || v.howmany) {
      let s = "";
      if (v.timeframe) s += `${timeframeLeadin} ${stripLeadingSince(v.timeframe)}, `;
      s += v.howmany ? `the program has reached ${v.howmany}` : (s ? "the program has grown" : "The program has grown");
      s = clean(s) + ".";
      sentences.push(s);
    }
    if (v.results) sentences.push(sentenceFrom(v.results));

    return joinSentences(sentences);
  }

  // ---------- programme -> hashtag map ----------

  const PROGRAM_HASHTAGS = {
    pim: ["PIM"],
    cp: ["ChildProtection"],
    cbp: ["CommunityBasedProtection"],
    gbv: ["GBV"],
    legal: ["LegalAid"],
    mhpss: ["MHPSS"],
    protcoord: ["ProtectionCoordination"],
    food: ["FoodSecurity"],
    finclusion: ["FinancialInclusion"],
    livelihoods: ["DecentLivelihoods"],
    eore: ["EORE"],
    landrelease_nts: ["LandRelease"],
    landrelease_clearance: ["EOD"],
    victimassist: ["VictimAssistance"],
    peacebuilding: ["Peacebuilding"],
    nfi: ["NFIs"],
    wash: ["WASH"],
    shelter: ["Shelter"],
    infrastructure: ["Infrastructure"],
    anticipatory: ["AnticipatoryAction"],
    youthemployment: ["YouthEmployment"],
    digital: ["DigitalInnovation"],
    privatesector: ["PrivateSectorEngagement"],
    globalevents: ["GlobalEvents"],
    climatefinance: ["ClimateResilience"],
    standby: ["StandbyRoster"],
    diaspora: ["DiasporaProgramme"],
    csostrategy: ["CivilSocietyEngagement"],
  };

  const KEYWORD_HASHTAGS = [
    [/school|educat/i, "Education"],
    [/health/i, "Health"],
    [/legal|document/i, "LegalAid"],
    [/water|sanitation|hygiene|\bwash\b/i, "WASH"],
    [/shelter/i, "Shelter"],
    [/\bfood\b|nutrition/i, "FoodSecurity"],
    [/livelihood|income|employment|\bjob/i, "Livelihoods"],
    [/refugee|displaced|displacement/i, "Refugees"],
    [/women|girls|gender/i, "GenderEquality"],
    [/child|children/i, "ChildProtection"],
    [/mental health|psychosocial|mhpss/i, "MentalHealth"],
    [/\bcash\b|financial/i, "CashAssistance"],
    [/disabilit/i, "Disability"],
    [/mine|explosive|ordnance/i, "MineAction"],
  ];

  // ---------- mentions & hashtags ----------

  function handleToTag(h) {
    let t = (h || "").trim();
    t = t.replace(/^@+/, "");
    t = t.replace(/[^A-Za-z0-9_]/g, "");
    return t;
  }
  function nameToTag(name) {
    if (!name) return "";
    const acronym = name.match(/\(([A-Za-z]{2,10})\)/);
    if (acronym) return acronym[1];
    const words = name.replace(/[^A-Za-z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    if (words.length <= 3) return words.map((w) => upper1(w)).join("");
    return words.map((w) => w.charAt(0).toUpperCase()).join("");
  }
  function locationTag(where) {
    if (!where) return "";
    const parts = where.split(",");
    const place = parts[parts.length - 1].trim();
    const words = place.replace(/[^A-Za-z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
    return words.map((w) => upper1(w.toLowerCase())).join("");
  }
  function toHashtagCase(raw) {
    const cleaned = handleToTag(raw);
    const parts = cleaned.split(/_+/).filter(Boolean);
    if (!parts.length) return "";
    return parts.map((p) => upper1(p)).join("");
  }
  function entityHashtag(handle, name) {
    if (handle) {
      const t = toHashtagCase(handle);
      if (t) return t;
    }
    if (name) {
      const t = nameToTag(name);
      if (t) return t;
    }
    return "";
  }

  function generateMentions(v) {
    const mentions = [];
    if (v.orgHandle) mentions.push("@" + handleToTag(v.orgHandle));
    if (v.donorHandle) mentions.push("@" + handleToTag(v.donorHandle));
    if (v.partnerHandle) mentions.push("@" + handleToTag(v.partnerHandle));
    return mentions;
  }

  function generateHashtags(v) {
    const tags = [];
    const pushTag = (t) => { if (t && !tags.includes(t)) tags.push(t); };

    if (v.programme && PROGRAM_HASHTAGS[v.programme]) {
      PROGRAM_HASHTAGS[v.programme].forEach(pushTag);
    }
    pushTag(toHashtagCase(v.orgHandle));
    pushTag(entityHashtag(v.donorHandle, v.donor));
    pushTag(entityHashtag(v.partnerHandle, v.partner));
    pushTag(locationTag(v.where));

    const contentText = [v.issue, v.involvement, v.changed, v.why].join(" ").toLowerCase();
    KEYWORD_HASHTAGS.forEach(([re, tag]) => {
      if (re.test(contentText)) pushTag(tag);
    });

    return tags.slice(0, 8).map((t) => "#" + t);
  }

  function appendTags(text, v, includeMentions) {
    if (!text) return text;
    let out = text;
    if (includeMentions) {
      const mentions = generateMentions(v);
      if (mentions.length) out += `\n\n${mentions.join(" ")}`;
    }
    const hashtags = generateHashtags(v);
    if (hashtags.length) out += `\n\n${hashtags.join(" ")}`;
    return out;
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

  let hasGenerated = false;

  function generateCaptions() {
    const v = {};
    ids.forEach((id) => { v[id] = val(id); });

    const metaBase = buildMeta(v, variantIndex.meta);
    const linkedinBase = buildLinkedin(v, variantIndex.linkedin);
    const websiteBase = buildWebsite(v, variantIndex.website);

    outputs.meta.textContent = appendTags(metaBase, v, true);
    outputs.linkedin.textContent = appendTags(linkedinBase, v, true);
    outputs.website.textContent = appendTags(websiteBase, v, false);

    setMeter(meters.meta, countSentences(metaBase), 2, 4);
    setMeter(meters.linkedin, countSentences(linkedinBase), 3, null);
    setMeter(meters.website, countSentences(websiteBase), 5, null);

    photoReminder.hidden = !websiteBase;

    const hits = [
      ...scanText("Instagram/Facebook", metaBase),
      ...scanText("LinkedIn", linkedinBase),
      ...scanText("Website", websiteBase),
      ...scanText("your Quote box", v.quote),
      ...scanText("your Why box", v.why),
    ];
    renderScan(hits);
  }

  // ---------- suggestions ----------

  const SUGGESTIONS = {
    issue: [
      "the family's documents were lost when they fled",
      "she had no access to clean water for months",
      "the nearest clinic was hours away on foot",
    ],
    involvement: [
      "our mobile team worked on their case for four months",
      "our outreach workers visited the community every week",
      "our team provided cash assistance within days",
    ],
    changed: [
      "her children can now enroll in school",
      "the family can access clean water at home",
      "she no longer has to walk for hours to fetch water",
    ],
    why: [
      "without this support, families cannot access basic services",
      "this remains one of the biggest barriers facing displaced families",
      "the need is growing as the crisis continues",
    ],
    quote: [
      "Now my children will go to school.",
      "I never thought I'd see this day.",
      "This changed everything for my family.",
    ],
  };

  Object.keys(SUGGESTIONS).forEach((fieldId) => {
    const field = fields[fieldId];
    if (!field) return;

    const box = document.createElement("div");
    box.className = "suggestions";
    box.hidden = true;

    const label = document.createElement("span");
    label.className = "suggestions-label";
    label.textContent = "Try:";
    box.appendChild(label);

    SUGGESTIONS[fieldId].forEach((text) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = text;
      chip.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const current = field.value.trim();
        field.value = current ? `${current} ${text}` : upper1(text);
        field.dispatchEvent(new Event("input"));
        field.focus();
      });
      box.appendChild(chip);
    });

    field.insertAdjacentElement("afterend", box);

    field.addEventListener("focus", () => { box.hidden = false; });
    field.addEventListener("blur", () => {
      setTimeout(() => { box.hidden = true; }, 150);
    });
  });

  // ---------- events ----------

  document.getElementById("toggle-guide").addEventListener("click", () => {
    const guide = document.getElementById("guide");
    guide.hidden = !guide.hidden;
  });

  document.getElementById("clear-btn").addEventListener("click", () => {
    ids.forEach((id) => { fields[id].value = fields[id].tagName === "SELECT" ? "na" : ""; });
    variantIndex.meta = 0;
    variantIndex.linkedin = 0;
    variantIndex.website = 0;
    hasGenerated = false;
    generateCaptions();
  });

  async function copyText(text) {
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
  }

  function flashCopied(btn) {
    const original = btn.textContent;
    btn.textContent = "Copied";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("copied");
    }, 1400);
  }

  document.querySelectorAll(".copy-btn[data-target]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetId = btn.getAttribute("data-target");
      const text = document.getElementById(targetId).textContent;
      if (!text) return;
      await copyText(text);
      flashCopied(btn);
    });
  });

  document.querySelectorAll(".regen-btn[data-channel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!hasGenerated) return;
      const channel = btn.getAttribute("data-channel");
      variantIndex[channel] = (variantIndex[channel] + 1) % 3;
      generateCaptions();
    });
  });

  // ---------- account / auth / usage gating ----------

  const API_BASE = window.CAPTION_API_BASE || "http://localhost:4000";
  const TOKEN_KEY = "captiongen_token";

  const authPanelWrap = document.getElementById("auth-panel-wrap");
  const appMain = document.getElementById("app-main");
  const accountBar = document.getElementById("account-bar");
  const accountStatus = document.getElementById("account-status");
  const logoutBtn = document.getElementById("logout-btn");
  const upgradeLinkBtn = document.getElementById("upgrade-link-btn");
  const authForm = document.getElementById("auth-form");
  const authEmail = document.getElementById("auth-email");
  const authPassword = document.getElementById("auth-password");
  const authError = document.getElementById("auth-error");
  const authHeading = document.getElementById("auth-heading");
  const authSubmit = document.getElementById("auth-submit");
  const authToggleMode = document.getElementById("auth-toggle-mode");
  const generateBtn = document.getElementById("generate-btn");
  const usageNote = document.getElementById("usage-note");
  const quotaBanner = document.getElementById("quota-banner");
  const quotaUpgradeBtn = document.getElementById("quota-upgrade-btn");

  let authMode = "signup";

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  async function apiFetch(path, options) {
    options = options || {};
    const token = getToken();
    const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    if (token) headers.Authorization = "Bearer " + token;
    let res;
    try {
      res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
    } catch (e) {
      const err = new Error("network_error");
      err.status = 0;
      throw err;
    }
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok) {
      const err = new Error((data && data.error) || "request_failed");
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function showAuthPanel() {
    authPanelWrap.hidden = false;
    appMain.hidden = true;
    accountBar.hidden = true;
  }

  function showApp() {
    authPanelWrap.hidden = true;
    appMain.hidden = false;
    accountBar.hidden = false;
  }

  function renderUsage(status) {
    if (status.isSubscribed) {
      accountStatus.textContent = `${authEmailCache || "Signed in"} · unlimited (subscribed)`;
      upgradeLinkBtn.hidden = true;
      usageNote.textContent = "Unlimited generations — thanks for subscribing.";
      quotaBanner.hidden = true;
    } else {
      accountStatus.textContent = `${authEmailCache || "Signed in"} · ${status.freeRemaining} of ${status.freeLimit} free generations left`;
      upgradeLinkBtn.hidden = false;
      usageNote.textContent = status.freeRemaining > 0
        ? `${status.freeRemaining} of ${status.freeLimit} free generations left`
        : "No free generations left.";
      quotaBanner.hidden = status.canGenerate;
    }
  }

  let authEmailCache = "";

  async function refreshSession() {
    const token = getToken();
    if (!token) {
      showAuthPanel();
      return;
    }
    try {
      const [{ user }, status] = await Promise.all([
        apiFetch("/api/auth/me"),
        apiFetch("/api/usage/status"),
      ]);
      authEmailCache = user.email;
      showApp();
      renderUsage(status);
    } catch (e) {
      clearToken();
      showAuthPanel();
    }
  }

  function setAuthMode(mode) {
    authMode = mode;
    authError.hidden = true;
    if (mode === "signup") {
      authHeading.textContent = "Sign up to get started";
      authSubmit.textContent = "Sign up";
      authToggleMode.textContent = "Already have an account? Log in";
      authPassword.setAttribute("autocomplete", "new-password");
    } else {
      authHeading.textContent = "Log in";
      authSubmit.textContent = "Log in";
      authToggleMode.textContent = "New here? Sign up";
      authPassword.setAttribute("autocomplete", "current-password");
    }
  }

  authToggleMode.addEventListener("click", () => {
    setAuthMode(authMode === "signup" ? "login" : "signup");
  });

  const AUTH_ERROR_COPY = {
    invalid_email: "Enter a valid email address.",
    password_too_short: "Password must be at least 8 characters.",
    email_taken: "An account with that email already exists — try logging in instead.",
    invalid_credentials: "Incorrect email or password.",
    network_error: "Couldn't reach the server. Is the API running?",
  };

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authError.hidden = true;
    authSubmit.disabled = true;
    try {
      const path = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const data = await apiFetch(path, {
        method: "POST",
        body: JSON.stringify({ email: authEmail.value, password: authPassword.value }),
      });
      setToken(data.token);
      authPassword.value = "";
      await refreshSession();
    } catch (err) {
      authError.textContent = AUTH_ERROR_COPY[err.data && err.data.error] || AUTH_ERROR_COPY[err.message] || "Something went wrong — try again.";
      authError.hidden = false;
    } finally {
      authSubmit.disabled = false;
    }
  });

  logoutBtn.addEventListener("click", () => {
    clearToken();
    hasGenerated = false;
    ids.forEach((id) => { fields[id].value = fields[id].tagName === "SELECT" ? "na" : ""; });
    variantIndex.meta = 0;
    variantIndex.linkedin = 0;
    variantIndex.website = 0;
    generateCaptions();
    quotaBanner.hidden = true;
    showAuthPanel();
  });

  generateBtn.addEventListener("click", async () => {
    generateBtn.disabled = true;
    const original = generateBtn.textContent;
    generateBtn.textContent = "Generating…";
    try {
      const status = await apiFetch("/api/usage/generate", { method: "POST" });
      renderUsage(status);
      hasGenerated = true;
      generateCaptions();
    } catch (err) {
      if (err.status === 402) {
        renderUsage(err.data);
      } else if (err.status === 401) {
        clearToken();
        showAuthPanel();
      } else {
        usageNote.textContent = "Couldn't reach the server — try again.";
      }
    } finally {
      generateBtn.textContent = original;
      generateBtn.disabled = false;
    }
  });

  async function attemptUpgrade(btn) {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Working…";
    try {
      const data = await apiFetch("/api/billing/dev-simulate-upgrade", { method: "POST" });
      if (data.simulated) {
        alert("Dev mode: upgrade simulated — no real payment was made. Real billing isn't wired up yet.");
      }
      await refreshSession();
    } catch (err) {
      if (err.status === 404) {
        alert("Online upgrades aren't available yet — payment isn't set up. Check back soon.");
      } else {
        alert("Couldn't process that — try again.");
      }
    } finally {
      btn.textContent = original;
      btn.disabled = false;
    }
  }

  upgradeLinkBtn.addEventListener("click", () => attemptUpgrade(upgradeLinkBtn));
  quotaUpgradeBtn.addEventListener("click", () => attemptUpgrade(quotaUpgradeBtn));

  setAuthMode("signup");
  refreshSession();

  // ---------- image caption (needs the Claude "sample" runtime capability) ----------

  (async function setupImageCaptioner() {
    const fileInput = document.getElementById("image-input");
    const statusEl = document.getElementById("image-status");
    const previewWrap = document.getElementById("image-preview");
    const previewImg = document.getElementById("image-preview-img");
    const captionOut = document.getElementById("image-caption-output");
    const regenBtn = document.getElementById("image-regen-btn");
    const copyBtn = document.getElementById("image-copy-btn");
    const availabilityEl = document.getElementById("image-availability");
    const uploaderEl = document.getElementById("image-uploader");

    function unavailable(message) {
      availabilityEl.textContent = message;
      availabilityEl.hidden = false;
      uploaderEl.hidden = true;
    }

    if (!window.claude || typeof window.claude.use !== "function") {
      unavailable("Image captioning only works when this page is opened as a Claude artifact — not from a plain HTML file or another host.");
      return;
    }

    let sample;
    try {
      sample = await window.claude.use("sample");
    } catch (e) {
      sample = null;
    }
    if (!sample) {
      unavailable("Image captioning isn't available for this account or in this view.");
      return;
    }

    let limits;
    try {
      limits = await sample.limits();
    } catch (e) {
      unavailable("Couldn't check image captioning availability — try reloading the page.");
      return;
    }
    if (!limits.images) {
      unavailable("This view can't send images to Claude, so image captioning isn't available here.");
      return;
    }

    availabilityEl.hidden = true;
    uploaderEl.hidden = false;
    fileInput.accept = limits.images.mediaTypes.join(",");

    let currentFile = null;
    let currentController = null;

    function errorCopy(code) {
      switch (code) {
        case "not_granted":
          return "Image captioning needs your permission — choose the image again to allow it.";
        case "rate_limited":
          return "Too many requests right now — try again in a moment.";
        case "image_rejected":
          return "That image couldn't be used — try a different file.";
        case "images_unavailable":
          return "Image captioning isn't available in this view.";
        case "refused":
          return "Claude couldn't caption this image — try a different one.";
        case "cancelled":
          return "";
        default:
          return "Couldn't generate a caption — try again.";
      }
    }

    async function runCaption(file, forceFresh) {
      currentFile = file;
      previewImg.src = URL.createObjectURL(file);
      previewWrap.hidden = false;
      captionOut.textContent = "";
      copyBtn.hidden = true;
      regenBtn.hidden = true;
      statusEl.textContent = "Thinking…";

      if (currentController) currentController.abort();
      currentController = new AbortController();

      const prompt = "Look at this image and write a short caption for its file name / alt text metadata. "
        + "Exactly 3 to 4 words. Plain, concrete, descriptive language only — no marketing language, "
        + "no ending punctuation, no hashtags, no quotation marks. Reply with only the caption, nothing else.";

      try {
        const { text } = await sample(prompt, {
          images: file,
          modelTier: "quick",
          cache: forceFresh ? false : true,
          signal: currentController.signal,
          onText: ({ text }) => {
            statusEl.textContent = "";
            captionOut.textContent = text;
          },
        });
        captionOut.textContent = text.trim();
        statusEl.textContent = "";
        copyBtn.hidden = false;
        regenBtn.hidden = false;
      } catch (e) {
        statusEl.textContent = errorCopy(e.code);
        regenBtn.hidden = !currentFile;
      }
    }

    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (file) runCaption(file, false);
    });

    regenBtn.addEventListener("click", () => {
      if (currentFile) runCaption(currentFile, true);
    });

    copyBtn.addEventListener("click", async () => {
      const text = captionOut.textContent;
      if (!text) return;
      await copyText(text);
      flashCopied(copyBtn);
    });
  })();
})();

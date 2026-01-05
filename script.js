const CONFIG = {
  soundtrackUrl: "https://display.soundtrack.io/BLLARJ",
  calendarEmbedUrl: "https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=Europe%2FBudapest&showPrint=0&showTabs=0&showCalendars=0&showTz=0&showTitle=0&src=hedonist1234%40hotmail.com&color=%23e4c441",
  calendarId: "hedonist1234@hotmail.com",
  googleApiKey: "AIzaSyDGuGmtn49ViR5SYYMFpJ4PLnf1ce0tPFI",
  gaMeasurementId: "G-VY0CKKGRDP",
  placeQuery: "Hedonist Lounge Budapest",
  lat: 47.4979,
  lon: 19.0402,
  timezone: "Europe/Budapest"
};

window.dataLayer = window.dataLayer || [];
function gtag(){ window.dataLayer.push(arguments); }
gtag("js", new Date());
if (CONFIG.gaMeasurementId) {
  gtag("config", CONFIG.gaMeasurementId, { anonymize_ip: true });
}

function $(id){ return document.getElementById(id); }

function safeSetText(el, text){ if (el) el.textContent = text; }

function buildMapsDirectionsUrl() {
  const q = encodeURIComponent(CONFIG.placeQuery);
  return "https://www.google.com/maps/search/?api=1&query=" + q;
}

function initLinks() {
  const url = buildMapsDirectionsUrl();
  const ids = ["btnDirections", "dockDirections", "btnDirectionsTop"];
  for (const id of ids) {
    const el = $(id);
    if (el) el.setAttribute("href", url);
  }
}

function initPlayer() {
  const frame = $("playerFrame");
  const overlay = $("loading");
  const refreshBtn = $("refreshBtn");
  const toggleBtn = $("togglePlayer");
  const wrap = $("playerWrap");

  if (frame) frame.setAttribute("src", CONFIG.soundtrackUrl);

  function hideOverlaySoon() {
    if (!overlay) return;
    setTimeout(() => (overlay.style.opacity = "0"), 150);
    setTimeout(() => (overlay.style.display = "none"), 350);
  }

  if (frame) frame.addEventListener("load", hideOverlaySoon);

  if (refreshBtn && frame && overlay) {
    refreshBtn.addEventListener("click", () => {
      overlay.style.display = "flex";
      overlay.style.opacity = "1";
      const src = frame.getAttribute("src") || "";
      frame.setAttribute("src", src.split("?")[0] + "?t=" + Date.now());
    });
  }

  function setPlayerHidden(hidden) {
    if (!wrap || !toggleBtn) return;
    wrap.style.display = hidden ? "none" : "block";
    toggleBtn.textContent = hidden ? "Show" : "Hide";
    toggleBtn.setAttribute("aria-expanded", String(!hidden));
    try { localStorage.setItem("playerHidden", hidden ? "true" : "false"); } catch {}
  }

  let hidden = false;
  try { hidden = localStorage.getItem("playerHidden") === "true"; } catch {}
  setPlayerHidden(hidden);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      let isHiddenNow = wrap && wrap.style.display === "none";
      setPlayerHidden(!isHiddenNow);
    });
  }

  const dockPlayer = $("dockPlayer");
  if (dockPlayer) {
    dockPlayer.addEventListener("click", () => {
      const isHiddenNow = wrap && wrap.style.display === "none";
      setPlayerHidden(!isHiddenNow);
      if (!isHiddenNow) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  const copyBtn = $("copyLink");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        copyBtn.textContent = "Copied";
        setTimeout(() => (copyBtn.textContent = "Copy Link"), 1200);
      } catch {
        copyBtn.textContent = "Copy failed";
        setTimeout(() => (copyBtn.textContent = "Copy Link"), 1200);
      }
    });
  }
}

function initCalendar() {
  const iframe = document.querySelector(".calendar-frame");
  const block = $("calendarBlock");
  const btn = $("toggleCalendar");
  if (iframe) iframe.setAttribute("src", CONFIG.calendarEmbedUrl);

  function setHidden(hidden) {
    if (!block || !btn) return;
    block.classList.toggle("hidden", hidden);
    btn.textContent = hidden ? "Show Calendar" : "Hide Calendar";
    btn.setAttribute("aria-expanded", String(!hidden));
  }

  setHidden(true);

  if (btn) {
    btn.addEventListener("click", () => {
      const hidden = block ? block.classList.contains("hidden") : true;
      setHidden(!hidden);
    });
  }
}

function detectEventType(title) {
  const t = (title || "").toLowerCase();
  const rules = [
    ["comedy", "comedy"],
    ["stand up", "comedy"],
    ["stand-up", "comedy"],
    ["techno", "techno"],
    ["dj", "techno"],
    ["open mic", "openmic"],
    ["quiz", "quiz"]
  ];
  for (const [k, v] of rules) {
    if (t.includes(k)) return v;
  }
  return "generic";
}

function extractFacebookEventUrl(text) {
  const s = String(text || "");
  const m = s.match(/https?:\/\/(?:www\.)?facebook\.com\/events\/\d+/i);
  return m ? m[0] : null;
}

function fetchNextEvent() {
  const nowIso = new Date().toISOString();
  const url =
    "https://www.googleapis.com/calendar/v3/calendars/" +
    encodeURIComponent(CONFIG.calendarId) +
    "/events?key=" +
    encodeURIComponent(CONFIG.googleApiKey) +
    "&timeMin=" +
    encodeURIComponent(nowIso) +
    "&singleEvents=true&orderBy=startTime&maxResults=1";
  return fetch(url)
    .then((r) => r.json())
    .then((d) => (d && d.items && d.items.length ? d.items[0] : null))
    .catch(() => null);
}

function fetchWeather() {
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=" +
    CONFIG.lat +
    "&longitude=" +
    CONFIG.lon +
    "&current_weather=true&timezone=" +
    encodeURIComponent(CONFIG.timezone);
  return fetch(url).then((r) => r.json()).catch(() => null);
}

function predictCrowdLevel(eventType, startDate, weather) {
  let score = 0;
  const day = startDate.getDay();
  const hour = startDate.getHours();

  if (eventType === "techno") score += 3;
  if (eventType === "comedy" || eventType === "openmic" || eventType === "quiz") score += 2;
  if (day === 5 || day === 6) score += 2;
  if (hour >= 20 && hour <= 23) score += 2;

  let temp = null;
  if (weather && weather.current_weather) temp = weather.current_weather.temperature;
  if (temp != null) {
    if (temp >= 27) score += 1;
    else if (temp <= 3) score -= 1;
  }

  if (score >= 6) return { label: "Busy night expected.", level: "high" };
  if (score >= 3) return { label: "Moderate crowd expected.", level: "medium" };
  return { label: "Mellow night expected.", level: "low" };
}

function formatDateTime(dt) {
  try {
    return dt.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });
  } catch {
    return String(dt);
  }
}

function startCountdown(startDate, title) {
  const el = $("countdown");
  if (!el) return;
  const t = String(title || "This");
  function tick() {
    const diff = startDate.getTime() - Date.now();
    if (diff <= 0) {
      el.textContent = "Happening now.";
      return;
    }
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    el.textContent = t + " starts in " + hours + "h " + minutes + "m.";
  }
  tick();
  setInterval(tick, 30000);
}

function initNextNight() {
  const card = $("nextNightCard");
  const link = $("eventLink");
  const titleEl = $("eventTitle");
  const dtEl = $("eventDatetime");
  const crowdEl = $("crowdLevel");

  Promise.all([fetchNextEvent(), fetchWeather()]).then(([event, weather]) => {
    if (!event) {
      if (card) {
        safeSetText(titleEl, "See upcoming events");
        safeSetText(dtEl, "Open the events list for the latest schedule.");
        safeSetText(crowdEl, "");
      }
      return;
    }

    const title = event.summary || "Hedonist Night";
    let startStr = null;
    if (event.start) {
      if (event.start.dateTime) startStr = event.start.dateTime;
      else if (event.start.date) startStr = event.start.date + "T20:00:00";
    }
    const startDate = new Date(startStr || new Date().toISOString());
    safeSetText(titleEl, title);
    safeSetText(dtEl, formatDateTime(startDate));

    const fb = extractFacebookEventUrl(event.description);
    if (link) {
      link.setAttribute("href", fb || link.getAttribute("href") || "#");
      link.textContent = fb ? "Open FB Event" : "Open";
    }

    const eventType = detectEventType(title);
    const crowd = predictCrowdLevel(eventType, startDate, weather);
    if (crowdEl) {
      safeSetText(crowdEl, crowd.label);
      crowdEl.classList.remove("crowd-high", "crowd-medium", "crowd-low");
      crowdEl.classList.add(
        crowd.level === "high" ? "crowd-high" : crowd.level === "medium" ? "crowd-medium" : "crowd-low"
      );
    }

    startCountdown(startDate, title);
  });
}

function initGame() {
  const startBtn = $("gameStart");
  const resetBtn = $("gameReset");
  const arena = $("arena");
  const target = $("target");
  const hint = $("gameHint");
  const timeEl = $("gameTime");
  const scoreEl = $("gameScore");
  const bestEl = $("gameBest");

  if (!startBtn || !resetBtn || !arena || !target || !hint || !timeEl || !scoreEl || !bestEl) return;

  let running = false;
  let score = 0;
  let best = 0;
  let startAt = 0;
  let raf = 0;

  try {
    best = Number(localStorage.getItem("neonBest") || "0") || 0;
  } catch {}
  bestEl.textContent = String(best);

  function placeTarget() {
    const rect = arena.getBoundingClientRect();
    const pad = 18;
    const x = pad + Math.random() * Math.max(1, rect.width - pad * 2);
    const y = pad + Math.random() * Math.max(1, rect.height - pad * 2);
    target.style.left = x + "px";
    target.style.top = y + "px";
  }

  function setRunning(on) {
    running = on;
    if (on) {
      score = 0;
      startAt = performance.now();
      scoreEl.textContent = "0";
      hint.style.display = "none";
      target.style.display = "block";
      placeTarget();
      loop();
    } else {
      target.style.display = "none";
      hint.style.display = "grid";
      cancelAnimationFrame(raf);
      raf = 0;
      if (score > best) {
        best = score;
        bestEl.textContent = String(best);
        try { localStorage.setItem("neonBest", String(best)); } catch {}
      }
    }
  }

  function loop() {
    if (!running) return;
    const elapsed = (performance.now() - startAt) / 1000;
    const left = Math.max(0, 10 - elapsed);
    timeEl.textContent = left.toFixed(1);
    if (left <= 0) {
      setRunning(false);
      timeEl.textContent = "0.0";
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  target.addEventListener("click", () => {
    if (!running) return;
    score += 1;
    scoreEl.textContent = String(score);
    placeTarget();
  });

  startBtn.addEventListener("click", () => {
    if (running) return;
    setRunning(true);
  });

  resetBtn.addEventListener("click", () => {
    setRunning(false);
    score = 0;
    scoreEl.textContent = "0";
    timeEl.textContent = "10.0";
    try { localStorage.removeItem("neonBest"); } catch {}
    best = 0;
    bestEl.textContent = "0";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLinks();
  initPlayer();
  initCalendar();
  initNextNight();
  initGame();
});

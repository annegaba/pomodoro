(function () {
  "use strict";

  // ---------- Config ----------
  var DURATIONS = { focus: 25 * 60, break: 5 * 60 };
  var RING_LEN = 2 * Math.PI * 54;

  var THEMES = {
    purple: { name: "Purple", body: "#8b5cf6", shade: "#5b34b3" },
    pink:   { name: "Pink",   body: "#f472b6", shade: "#be3a82" },
    cyan:   { name: "Cyan",   body: "#22d3ee", shade: "#0e8fa5" },
    lime:   { name: "Lime",   body: "#84cc16", shade: "#4d7c0f" },
    red:    { name: "Red",    body: "#ef4444", shade: "#a51d1d" },
    yellow: { name: "Yellow", body: "#facc15", shade: "#b08a06" },
    white:  { name: "White",  body: "#e5e7eb", shade: "#9ca3af" }
  };

  var HYPE_TITLES = [
    "LET'S GO GIRLYPOP!",
    "SLAY QUEEN!",
    "YOU ATE THAT!",
    "MAIN CHARACTER ENERGY!",
    "SHE'S SO SMART!",
    "PERIOD. 💅",
    "BIG BRAIN BEAN!",
    "ICONIC BEHAVIOR!"
  ];

  var HYPE_MSGS = [
    "25 whole minutes of focus. You're literally unstoppable 💜",
    "Your brain is glowing right now, bestie ✨",
    "That test tomorrow? You're SO ready for it.",
    "Mom is so proud of you. Like, so proud. 💜",
    "Every session counts. You're stacking those wins!",
    "Not sus at all, just a certified smart cookie 🍪",
    "You showed up and did the work. That's the whole secret.",
    "Studying looks good on you, girlie 💖",
    "One more step closer to acing it. Keep shining!",
    "Hard work + cute vibes = unstoppable 🌟"
  ];

  var SELF_CARE = [
    "💧 Drink some water, bestie! Hydrated girls ace tests.",
    "🧘‍♀️ Stand up and stretch those arms up high!",
    "👀 Look at something far away for 20 seconds. Rest those pretty eyes.",
    "🍎 Grab a healthy snack. Brain food time!",
    "🌬️ Take 3 deep breaths. In... and out... 💜",
    "🚶‍♀️ Walk around for a bit and shake it out!",
    "💧 Water check! Take a few big sips.",
    "🪟 Get a little fresh air or sunshine if you can ☀️",
    "💃 Dance to one song. You earned it!"
  ];

  var FOCUS_TIPS = [
    "You've got this, girlypop 💜",
    "Phone face down, brain switched on ✨",
    "One page at a time, cutie 📚",
    "Future you is cheering for you right now!",
    "Tiny steps still get you to the finish line 💖",
    "You're smarter than you think, bestie 🌟"
  ];

  var BREAK_TIPS = [
    "Break time! Drink some water 💧",
    "Rest those eyes, superstar ✨",
    "Stretch it out, girlie 🧘‍♀️",
    "Snack break? Snack break. 🍓"
  ];

  var BREAK_OVER = [
    "Ready for another round? You're doing amazing.",
    "Recharged and ready to slay 💜",
    "Let's get that next win, bestie!",
    "Your brain had a little nap. Now let's go!"
  ];

  // ---------- Pixel bean sprite ----------
  var GRID = [
    "................",
    ".....KKKKKK.....",
    "....KPPPPPPK....",
    "...KPPPPPPPPK...",
    "...KPPPKKKKKKK..",
    "..KKPPKVVVVWWVK.",
    ".KDKPPKVVVVVWVK.",
    ".KDKPPKVVVVVVVK.",
    ".KDKPPPKKKKKKK..",
    ".KDKPPPPPPPPPK..",
    ".KDKPPPPPPPPPK..",
    ".KDKDPPPPPPPPK..",
    "..KKDDPPPPPPDK..",
    "...KDDPPKKDPDK..",
    "...KDDDK.KDDDK..",
    "...KKKKK.KKKKK.."
  ];

  function beanSVG(themeKey) {
    var t = THEMES[themeKey] || THEMES.purple;
    var colors = { K: "#1a1030", P: t.body, D: t.shade, V: "#7dd3fc", W: "#f0f9ff" };
    var rects = "";
    for (var y = 0; y < GRID.length; y++) {
      var row = GRID[y];
      for (var x = 0; x < row.length; x++) {
        var c = colors[row[x]];
        if (c) rects += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + c + '"/>';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">' + rects + "</svg>";
  }

  // ---------- Storage (safe) ----------
  function load(key, fallback) {
    try {
      var v = localStorage.getItem("beanfocus:" + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem("beanfocus:" + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  // ---------- Elements ----------
  var $ = function (id) { return document.getElementById(id); };
  var el = {
    time: $("time"), label: $("label"), ringFg: $("ringFg"), bean: $("bean"),
    startBtn: $("startBtn"), resetBtn: $("resetBtn"), skipBtn: $("skipBtn"),
    tabs: document.querySelectorAll(".tab[data-mode]"), todayCount: $("todayCount"), dots: $("dots"), tip: $("tip"),
    celebrate: $("celebrate"), celebrateTitle: $("celebrateTitle"), celebrateMsg: $("celebrateMsg"),
    celebrateCare: $("celebrateCare"), celebrateBtn: $("celebrateBtn"), celebrateBean: $("celebrateBean"),
    confetti: $("confetti"), breakOver: $("breakOver"), breakMsg: $("breakMsg"), breakOverBtn: $("breakOverBtn"),
    breakBean: $("breakBean"), themes: $("themes"), themeBtn: $("themeBtn"), themeGrid: $("themeGrid"),
    themesClose: $("themesClose"), soundToggle: $("soundToggle"), vibeToggle: $("vibeToggle"), autoToggle: $("autoToggle")
  };

  // ---------- State ----------
  var state = {
    mode: "focus",
    remaining: DURATIONS.focus,
    endAt: null,
    theme: load("theme", "purple"),
    sound: load("sound", true),
    vibe: load("vibe", true),
    auto: load("auto", false)
  };
  var stats = load("stats", { day: todayKey(), count: 0 });
  if (stats.day !== todayKey()) stats = { day: todayKey(), count: 0 };

  var saved = load("timer", null);
  if (saved && saved.mode && DURATIONS[saved.mode]) {
    state.mode = saved.mode;
    state.endAt = saved.endAt || null;
    state.remaining = typeof saved.remaining === "number" ? saved.remaining : DURATIONS[saved.mode];
  }

  var ticker = null;
  var wakeLock = null;

  function persistTimer() {
    save("timer", { mode: state.mode, endAt: state.endAt, remaining: state.remaining });
  }

  // ---------- Rendering ----------
  function fmt(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function currentRemaining() {
    if (state.endAt) return Math.max(0, (state.endAt - Date.now()) / 1000);
    return state.remaining;
  }

  function renderTime() {
    var rem = currentRemaining();
    var total = DURATIONS[state.mode];
    el.time.textContent = fmt(rem);
    el.ringFg.style.strokeDashoffset = String(RING_LEN * (1 - rem / total));
    var emoji = state.mode === "focus" ? "📚" : "☕";
    document.title = state.endAt ? fmt(rem) + " " + emoji + " Bean Focus" : "Bean Focus";
  }

  function renderMode() {
    document.body.setAttribute("data-mode", state.mode);
    el.tabs.forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-mode") === state.mode); });
    el.label.textContent = state.mode === "focus" ? "time to focus ✨" : "break time 💧";
    el.tip.textContent = state.mode === "focus" ? pick(FOCUS_TIPS) : pick(BREAK_TIPS);
  }

  function renderRunning() {
    var running = !!state.endAt;
    document.body.classList.toggle("running", running);
    el.startBtn.textContent = running ? "PAUSE" : (currentRemaining() < DURATIONS[state.mode] ? "RESUME" : "START");
  }

  function renderStats() {
    el.todayCount.textContent = String(stats.count);
    var html = "";
    var shown = Math.min(stats.count, 12);
    for (var i = 0; i < shown; i++) html += '<div class="mini">' + beanSVG(state.theme) + "</div>";
    if (stats.count > 12) html += '<b style="font-size:12px">+' + (stats.count - 12) + "</b>";
    el.dots.innerHTML = html;
  }

  function applyTheme(key) {
    if (!THEMES[key]) key = "purple";
    state.theme = key;
    save("theme", key);
    document.body.setAttribute("data-theme", key);
    var svg = beanSVG(key);
    el.bean.innerHTML = svg;
    el.celebrateBean.innerHTML = svg;
    el.breakBean.innerHTML = svg;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", getComputedStyle(document.body).getPropertyValue("--bg1").trim() || "#1e123c");
    renderStats();
    renderThemeGrid();
  }

  function renderThemeGrid() {
    var html = "";
    Object.keys(THEMES).forEach(function (k) {
      html += '<button class="theme-opt' + (k === state.theme ? " selected" : "") + '" data-theme="' + k + '">' +
        '<div class="mini">' + beanSVG(k) + "</div>" + THEMES[k].name + "</button>";
    });
    el.themeGrid.innerHTML = html;
  }

  // ---------- Timer control ----------
  function start() {
    unlockAudio();
    askNotifyPermission();
    if (currentRemaining() <= 0) state.remaining = DURATIONS[state.mode];
    state.endAt = Date.now() + state.remaining * 1000;
    persistTimer();
    startTicker();
    requestWakeLock();
    renderRunning();
  }

  function pause() {
    state.remaining = currentRemaining();
    state.endAt = null;
    persistTimer();
    stopTicker();
    releaseWakeLock();
    renderRunning();
    renderTime();
  }

  function reset() {
    state.endAt = null;
    state.remaining = DURATIONS[state.mode];
    persistTimer();
    stopTicker();
    releaseWakeLock();
    renderRunning();
    renderTime();
  }

  function setMode(mode) {
    state.mode = mode;
    state.endAt = null;
    state.remaining = DURATIONS[mode];
    persistTimer();
    stopTicker();
    releaseWakeLock();
    renderMode();
    renderRunning();
    renderTime();
  }

  function startTicker() {
    stopTicker();
    ticker = setInterval(tick, 250);
    tick();
  }
  function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }

  function tick() {
    renderTime();
    if (state.endAt && currentRemaining() <= 0) complete();
  }

  function complete() {
    var finished = state.mode;
    stopTicker();
    releaseWakeLock();
    state.endAt = null;

    if (finished === "focus") {
      if (stats.day !== todayKey()) stats = { day: todayKey(), count: 0 };
      stats.count++;
      save("stats", stats);
      renderStats();
      setMode("break");
      celebrateFocus();
    } else {
      setMode("focus");
      showBreakOver();
    }
  }

  // ---------- Celebrations ----------
  function celebrateFocus() {
    var title = pick(HYPE_TITLES);
    var msg = pick(HYPE_MSGS);
    var care = pick(SELF_CARE);
    el.celebrateTitle.textContent = title;
    el.celebrateMsg.textContent = msg;
    el.celebrateCare.textContent = care;
    el.celebrate.hidden = false;
    burstConfetti();
    chime("win");
    buzz([200, 100, 200, 100, 400]);
    notify(title, msg + " " + care);
    if (state.auto) { start(); }
  }

  function showBreakOver() {
    el.breakMsg.textContent = pick(BREAK_OVER);
    el.breakOver.hidden = false;
    chime("bell");
    buzz([300, 150, 300]);
    notify("Break's over, cutie! 💜", "Ready for another focus round?");
    if (state.auto) { start(); }
  }

  function burstConfetti() {
    var t = THEMES[state.theme];
    var colors = [t.body, t.shade, "#7dd3fc", "#fbcfe8", "#fef08a", "#ffffff"];
    var html = "";
    for (var i = 0; i < 40; i++) {
      var left = Math.random() * 100;
      var dur = 1.6 + Math.random() * 1.6;
      var delay = Math.random() * 0.6;
      var size = 6 + Math.floor(Math.random() * 6);
      html += '<i style="left:' + left + "%;width:" + size + "px;height:" + size + "px;background:" + pick(colors) +
        ";animation-duration:" + dur + "s;animation-delay:" + delay + 's"></i>';
    }
    el.confetti.innerHTML = html;
  }

  // ---------- Sound ----------
  var audioCtx = null;
  function unlockAudio() {
    try {
      if (!audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      }
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) { /* ignore */ }
  }

  function chime(kind) {
    if (!state.sound) return;
    unlockAudio();
    if (!audioCtx) return;
    var notes = kind === "win" ? [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5] : [783.99, 659.25, 783.99];
    var step = kind === "win" ? 0.13 : 0.22;
    var now = audioCtx.currentTime + 0.02;
    notes.forEach(function (f, i) {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = "square";
      o.frequency.value = f;
      var t0 = now + i * step;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + step * 1.6);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0);
      o.stop(t0 + step * 1.8);
    });
  }

  function buzz(pattern) {
    if (!state.vibe) return;
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }

  // ---------- Notifications ----------
  function askNotifyPermission() {
    try {
      if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    } catch (e) { /* ignore */ }
  }

  function notify(title, body) {
    if (!document.hidden) return;
    try {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      var opts = { body: body, icon: "icons/icon-192.png", badge: "icons/favicon.png", vibrate: [200, 100, 200], tag: "beanfocus" };
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(function (reg) { reg.showNotification(title, opts); });
      } else {
        new Notification(title, opts);
      }
    } catch (e) { /* ignore */ }
  }

  // ---------- Wake lock (keeps screen on while timer runs) ----------
  function requestWakeLock() {
    try {
      if ("wakeLock" in navigator && !wakeLock) {
        navigator.wakeLock.request("screen").then(function (lock) {
          wakeLock = lock;
          lock.addEventListener("release", function () { wakeLock = null; });
        }).catch(function () { /* ignore */ });
      }
    } catch (e) { /* ignore */ }
  }
  function releaseWakeLock() {
    try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) { /* ignore */ }
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && state.endAt) {
      requestWakeLock();
      tick();
    }
  });

  // ---------- Starfield ----------
  function starfield() {
    var c = $("stars");
    var ctx = c.getContext("2d");
    var stars = [];
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = innerWidth * dpr; c.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var n = Math.round((innerWidth * innerHeight) / 5000);
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight,
          s: Math.random() < 0.15 ? 2 : 1, v: 0.05 + Math.random() * 0.25, p: Math.random() * 6.28 });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        st.p += 0.03;
        if (!reduce) { st.x -= st.v; if (st.x < 0) st.x = innerWidth; }
        ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(st.p));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(Math.round(st.x), Math.round(st.y), st.s, st.s);
      }
      if (!reduce) requestAnimationFrame(draw);
    }
    addEventListener("resize", resize);
    resize();
    draw();
  }

  // ---------- Events ----------
  el.startBtn.addEventListener("click", function () { state.endAt ? pause() : start(); });
  el.resetBtn.addEventListener("click", reset);
  el.skipBtn.addEventListener("click", function () { setMode(state.mode === "focus" ? "break" : "focus"); });
  el.tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      var m = t.getAttribute("data-mode");
      if (m !== state.mode) setMode(m);
    });
  });

  el.celebrateBtn.addEventListener("click", function () {
    el.celebrate.hidden = true;
    el.confetti.innerHTML = "";
    if (!state.endAt) start();
  });
  el.breakOverBtn.addEventListener("click", function () {
    el.breakOver.hidden = true;
    if (!state.endAt) start();
  });

  el.themeBtn.addEventListener("click", function () { el.themes.hidden = false; });
  el.themesClose.addEventListener("click", function () { el.themes.hidden = true; });
  el.themes.addEventListener("click", function (e) { if (e.target === el.themes) el.themes.hidden = true; });
  el.themeGrid.addEventListener("click", function (e) {
    var b = e.target.closest(".theme-opt");
    if (b) applyTheme(b.getAttribute("data-theme"));
  });

  el.soundToggle.checked = state.sound;
  el.vibeToggle.checked = state.vibe;
  el.autoToggle.checked = state.auto;
  el.soundToggle.addEventListener("change", function () { state.sound = el.soundToggle.checked; save("sound", state.sound); if (state.sound) { unlockAudio(); chime("bell"); } });
  el.vibeToggle.addEventListener("change", function () { state.vibe = el.vibeToggle.checked; save("vibe", state.vibe); buzz(120); });
  el.autoToggle.addEventListener("change", function () { state.auto = el.autoToggle.checked; save("auto", state.auto); });

  // ---------- Install panel ----------
  var installPrompt = null;
  var installEl = $("install");
  var installNow = $("installNow");
  function isStandalone() {
    return window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  }
  function guessOS() {
    var ua = navigator.userAgent;
    if (/android/i.test(ua)) return "android";
    if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
    return "pc";
  }
  function setOS(os) {
    document.querySelectorAll("[data-os]").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-os") === os); });
    document.querySelectorAll("[data-steps]").forEach(function (s) { s.hidden = s.getAttribute("data-steps") !== os; });
  }
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installPrompt = e; });
  window.addEventListener("appinstalled", function () { installPrompt = null; installEl.hidden = true; $("installOpen").hidden = true; });
  $("installOpen").addEventListener("click", function () {
    setOS(guessOS());
    installNow.hidden = !installPrompt;
    installEl.hidden = false;
  });
  $("installClose").addEventListener("click", function () { installEl.hidden = true; });
  installEl.addEventListener("click", function (e) { if (e.target === installEl) installEl.hidden = true; });
  document.querySelectorAll("[data-os]").forEach(function (b) {
    b.addEventListener("click", function () { setOS(b.getAttribute("data-os")); });
  });
  installNow.addEventListener("click", function () {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(function () { installPrompt = null; installNow.hidden = true; });
  });
  if (isStandalone()) $("installOpen").hidden = true;

  // ---------- Init ----------
  applyTheme(state.theme);
  renderMode();
  renderTime();
  renderRunning();
  starfield();
  if (state.endAt) {
    if (currentRemaining() <= 0) complete();
    else startTicker();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* ignore */ });
    });
  }
})();

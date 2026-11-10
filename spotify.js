// Spotify music: plays her chosen playlists while the timer runs.
// Uses Spotify's PKCE login, so it needs no server and no secret.
// Playback control needs Spotify Premium.
(function () {
  "use strict";

  // Public Client ID from the Spotify developer dashboard.
  // Leave it empty and the music section stays hidden.
  var CLIENT_ID = "681cdcacd65d4bcaa61d6b0f527d9d6d";

  var SCOPES = "playlist-read-private playlist-read-collaborative user-read-playback-state user-modify-playback-state";
  var API = "https://api.spotify.com/v1";

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
  function drop(key) {
    try { localStorage.removeItem("beanfocus:" + key); } catch (e) { /* ignore */ }
  }

  var auth = load("spotify", null);                                  // { access, refresh, expiresAt }
  var prefs = load("music", { on: true, focus: null, break: null }); // focus / break: { uri, name }
  if (!prefs || typeof prefs !== "object") prefs = { on: true, focus: null, break: null };

  var playlists = null;  // her playlists, loaded when settings open
  var loadError = false;
  var current = null;    // playlist we last started, so RESUME continues the same song
  var playing = false;   // true only while music we started is playing

  // ---------- Helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Must match a Redirect URI in the dashboard exactly.
  function redirectUri() {
    return location.origin + location.pathname.replace(/index\.html$/, "");
  }

  function openUrl(uri) {
    // spotify:playlist:ID -> https://open.spotify.com/playlist/ID (opens the Spotify app on phones)
    var parts = String(uri).split(":");
    return "https://open.spotify.com/" + parts[1] + "/" + parts[2];
  }

  // ---------- Status line under the timer ----------
  function setStatus(text, link, retry) {
    var el = document.getElementById("musicStatus");
    if (!el) return;
    el.textContent = text || "";
    if (retry) {
      el.appendChild(document.createTextNode(" "));
      var b = document.createElement("button");
      b.type = "button";
      b.className = "retry-btn";
      b.textContent = "Try again";
      b.addEventListener("click", retry);
      el.appendChild(b);
    }
    if (link) {
      el.appendChild(document.createTextNode(" "));
      var a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Open Spotify";
      el.appendChild(a);
    }
    el.hidden = !text;
  }

  // ---------- Login (PKCE) ----------
  function randomString(n) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var bytes = crypto.getRandomValues(new Uint8Array(n));
    var s = "";
    for (var i = 0; i < n; i++) s += chars[bytes[i] % chars.length];
    return s;
  }

  async function challengeFor(verifier) {
    var hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    return btoa(String.fromCharCode.apply(null, new Uint8Array(hash)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  async function connect() {
    var verifier = randomString(64);
    var state = randomString(16);
    save("spotifyLogin", { verifier: verifier, state: state });
    var params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      scope: SCOPES,
      code_challenge_method: "S256",
      code_challenge: await challengeFor(verifier),
      redirect_uri: redirectUri(),
      state: state
    });
    location.href = "https://accounts.spotify.com/authorize?" + params.toString();
  }

  async function tokenRequest(body) {
    body.client_id = CLIENT_ID;
    var res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body)
    });
    if (!res.ok) {
      var err = new Error("token " + res.status);
      err.status = res.status;
      throw err;
    }
    var j = await res.json();
    auth = {
      access: j.access_token,
      refresh: j.refresh_token || (auth && auth.refresh),
      expiresAt: Date.now() + (j.expires_in || 3600) * 1000
    };
    save("spotify", auth);
  }

  // Spotify sends her back here with ?code=... after she logs in.
  async function handleRedirect() {
    var q = new URLSearchParams(location.search);
    if (!q.has("code") && !q.has("error")) return false;
    var login = load("spotifyLogin", null);
    drop("spotifyLogin");
    history.replaceState(null, "", redirectUri());
    if (q.get("error") || !login || q.get("state") !== login.state) {
      setStatus("Spotify didn't connect. Try again from 🎨 💜");
      return true;
    }
    try {
      await tokenRequest({
        grant_type: "authorization_code",
        code: q.get("code"),
        redirect_uri: redirectUri(),
        code_verifier: login.verifier
      });
    } catch (e) {
      setStatus("Spotify didn't connect. Try again from 🎨 💜");
    }
    return true;
  }

  async function token(force) {
    if (!auth) return null;
    if (force || Date.now() > auth.expiresAt - 60000) {
      try {
        await tokenRequest({ grant_type: "refresh_token", refresh_token: auth.refresh });
      } catch (e) {
        // 400 means the login was revoked or expired. Anything else (like being offline) keeps it.
        if (e.status === 400) {
          disconnect();
          setStatus("Spotify logged out. Reconnect it in 🎨 💜");
        }
        return null;
      }
    }
    return auth.access;
  }

  function disconnect() {
    auth = null;
    playlists = null;
    current = null;
    playing = false;
    drop("spotify");
    setStatus("");
    renderSettings();
  }

  // ---------- Web API ----------
  async function api(method, path, body, retried) {
    var t = await token(false);
    if (!t) {
      var e0 = new Error("NOT_CONNECTED");
      e0.status = 401;
      throw e0;
    }
    var headers = { Authorization: "Bearer " + t };
    if (body) headers["Content-Type"] = "application/json";
    var res = await fetch(API + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 401 && !retried) {
      if (!(await token(true))) {
        var e1 = new Error("NOT_CONNECTED");
        e1.status = 401;
        throw e1;
      }
      return api(method, path, body, true);
    }
    if (!res.ok) {
      var reason = "";
      try {
        var j = await res.json();
        reason = (j.error && j.error.reason) || "";
      } catch (e) { /* no body */ }
      var err = new Error(reason || "HTTP " + res.status);
      err.status = res.status;
      err.reason = reason;
      throw err;
    }
    var text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function loadPlaylists() {
    var all = [];
    var path = "/me/playlists?limit=50";
    for (var i = 0; i < 4 && path; i++) {
      var page = await api("GET", path);
      ((page && page.items) || []).forEach(function (p) {
        if (p && p.uri) all.push({ uri: p.uri, name: p.name || "Untitled playlist" });
      });
      path = page && page.next ? page.next.replace(API, "") : null;
    }
    playlists = all;
  }

  // Picks her phone/computer if Spotify is open there but not playing yet.
  async function pickDevice() {
    var d = await api("GET", "/me/player/devices");
    var list = ((d && d.devices) || []).filter(function (x) { return !x.is_restricted; });
    var dev = list.filter(function (x) { return x.is_active; })[0] || list[0];
    return dev ? dev.id : null;
  }

  async function playContext(uri, resume) {
    try {
      await api("PUT", "/me/player/play", resume ? undefined : { context_uri: uri });
    } catch (e) {
      if (e.status !== 404) throw e; // 404 = no active device
      var id = await pickDevice();
      if (!id) throw e;
      var dev = "device_id=" + encodeURIComponent(id);
      await api("PUT", "/me/player/shuffle?state=true&" + dev).catch(function () { /* not important */ });
      await api("PUT", "/me/player/play?" + dev, { context_uri: uri });
    }
  }

  function showError(e, pick, mode) {
    if (e.status === 401) return; // status already explains it
    if (e.status === 404) {
      setStatus("Open Spotify on this phone for a sec, then come back 🎧", openUrl(pick.uri),
        function () { onStart(mode, false); });
    } else if (e.status === 403) {
      setStatus("Spotify needs Premium to play from I've Bean Focused 💜");
    } else {
      setStatus("Spotify hiccup, the music didn't start 😿", openUrl(pick.uri));
    }
  }

  // ---------- Hooks the timer calls ----------
  async function onStart(mode, resumed) {
    if (!CLIENT_ID || !auth || !prefs.on) return;
    var pick = mode === "focus" ? prefs.focus : prefs.break;
    if (!pick) { // "No music" picked for this mode
      pause();
      setStatus(mode === "focus" ? "" : "🤫 Quiet break, no music");
      return;
    }
    var resume = resumed && current && current.uri === pick.uri;
    try {
      if (!resume) await api("PUT", "/me/player/shuffle?state=true").catch(function () { /* no device yet */ });
      await playContext(pick.uri, resume);
      current = pick;
      playing = true;
      setStatus("🎧 " + pick.name);
    } catch (e) {
      current = null;
      playing = false;
      showError(e, pick, mode);
    }
  }

  function pause() {
    if (!auth || !playing) return;
    playing = false;
    if (current) setStatus("⏸ " + current.name);
    api("PUT", "/me/player/pause").catch(function () { /* already paused */ });
  }

  // ---------- Settings section (inside the 🎨 panel) ----------
  function renderSettings() {
    var box = document.getElementById("musicSettings");
    if (!box) return;
    if (!CLIENT_ID) { box.hidden = true; return; }
    box.hidden = false;

    if (!auth) {
      box.innerHTML = "<h2>Music 🎧</h2>" +
        '<p class="hint">Connect Spotify to play your playlists while the timer runs. Needs Spotify Premium.</p>' +
        '<button class="main-btn" id="spConnect">CONNECT SPOTIFY</button>';
      return;
    }

    function options(sel, emptyLabel) {
      var html = '<option value="">' + esc(emptyLabel) + "</option>";
      var found = false;
      (playlists || []).forEach(function (p) {
        var on = !!sel && sel.uri === p.uri;
        if (on) found = true;
        html += '<option value="' + esc(p.uri) + '"' + (on ? " selected" : "") + ">" + esc(p.name) + "</option>";
      });
      if (sel && !found) html += '<option value="' + esc(sel.uri) + '" selected>' + esc(sel.name) + "</option>";
      return html;
    }

    var note = "";
    if (loadError) note = '<p class="hint">Couldn\'t load your playlists. Close and reopen 🎨 to try again.</p>';
    else if (!playlists) note = '<p class="hint">Loading your playlists…</p>';

    box.innerHTML = "<h2>Music 🎧</h2>" +
      '<label class="pick">Focus playlist<select id="spFocus">' + options(prefs.focus, "No music") + "</select></label>" +
      '<label class="pick">Break playlist<select id="spBreak">' + options(prefs.break, "No music (quiet break)") + "</select></label>" +
      note +
      '<label class="toggle"><input type="checkbox" id="spOn"' + (prefs.on ? " checked" : "") + "> Play music with the timer</label>" +
      '<button class="link-btn" id="spDisconnect">Disconnect Spotify</button>';
  }

  function openSettings() {
    renderSettings();
    if (CLIENT_ID && auth && !playlists) {
      loadError = false;
      loadPlaylists().catch(function () { loadError = true; }).then(renderSettings);
    }
  }

  function pickFrom(select) {
    if (!select.value) return null;
    return { uri: select.value, name: select.options[select.selectedIndex].text };
  }

  function bindSettings() {
    var box = document.getElementById("musicSettings");
    if (!box) return;
    box.addEventListener("click", function (e) {
      if (e.target.id === "spConnect") connect().catch(function () { setStatus("Spotify didn't connect. Try again 💜"); });
      if (e.target.id === "spDisconnect") disconnect();
    });
    box.addEventListener("change", function (e) {
      if (e.target.id === "spFocus") prefs.focus = pickFrom(e.target);
      else if (e.target.id === "spBreak") prefs.break = pickFrom(e.target);
      else if (e.target.id === "spOn") {
        prefs.on = e.target.checked;
        if (!prefs.on) { pause(); setStatus(""); }
      } else return;
      save("music", prefs);
    });
  }

  // ---------- Init ----------
  window.BeanMusic = { onStart: onStart, pause: pause, openSettings: openSettings };

  if (!CLIENT_ID) return;
  bindSettings();
  handleRedirect().then(function (cameBack) {
    // Just logged in: open the 🎨 panel so she can pick her playlists.
    if (cameBack && auth) {
      var btn = document.getElementById("themeBtn");
      if (btn) btn.click();
    }
  });
})();

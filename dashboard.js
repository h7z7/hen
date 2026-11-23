/* NEON HOST — dashboard.js
 * ES5 puro: o navegador do PS4 e um WebKit antigo.
 * Detecta firmware, gerencia tema/escolhas, mostra cache e inicia a cadeia.
 *
 * Fluxo: INICIAR -> jb.html?log=1&afterglow=run&mode=... (ou payload=hen.bin)
 * O guard de referrer do jb.js exige vir de index.html — este arquivo. */

(function () {
  "use strict";

  var SUPPORTED = ["14.02", "14.00", "13.52", "13.50", "13.04", "13.02",
                   "13.00", "12.52", "12.50", "12.02", "12.00"];
  var STORE = "neonhost.choice";     /* payload + autostart */
  var THEME_KEY = "neonhost.theme";
  var SWAP_KEY = "neonhost.swapped";

  /* ---------- utilidades de armazenamento (podem lancar no PS4) ---------- */
  function lsGet(k) {
    try { return window.localStorage.getItem(k); } catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { window.localStorage.setItem(k, v); } catch (e) {}
  }

  /* ---------- deteccao de firmware (mesma regex do ps4_offsets.js) ---------- */
  function detectFirmware() {
    var ua = navigator.userAgent || "";
    var m = ua.match(/PlayStation\s+4[\/ ](\d+)\.(\d+)/);
    if (!m) return null;
    var minor = parseInt(m[2], 16).toString(16);
    if (minor.length < 2) minor = "0" + minor;
    return m[1] + "." + minor;
  }

  function isPS4() { return detectFirmware() !== null; }

  /* ---------- navegacao entre paginas ---------- */
  function go(name) {
    var pages = document.querySelectorAll(".page");
    var i;
    for (i = 0; i < pages.length; i++) pages[i].className = "page";
    var target = document.getElementById("page-" + name);
    if (target) target.className = "page active";
    window.scrollTo(0, 0);
  }

  /* ---------- badges do topo ---------- */
  function renderBadges() {
    var net = document.getElementById("netBadge");
    var fw = document.getElementById("fwBadge");
    var online = true;
    try { online = navigator.onLine !== false; } catch (e) {}
    net.textContent = online ? "ONLINE" : "OFFLINE";
    net.className = "badge " + (online ? "on" : "bad");

    var v = detectFirmware();
    if (!v) {
      fw.textContent = "NAO E PS4";
      fw.className = "badge bad";
    } else if (SUPPORTED.indexOf(v) >= 0) {
      fw.textContent = "FW " + v;
      fw.className = "badge fw";
    } else {
      fw.textContent = "FW " + v + " ?";
      fw.className = "badge bad";
    }
  }

  /* ---------- escolhas (payload / autostart) ----------
   * O radio nativo nao atualiza visualmente no navegador do PS4,
   * entao a selecao e feita com botoes + classe .sel. */
  var currentPayload = "goldhen";

  function payload() { return currentPayload; }

  function selectPayload(v) {
    if (v !== "goldhen" && v !== "hen") return;
    currentPayload = v;
    var opts = document.querySelectorAll(".opt");
    var i;
    for (i = 0; i < opts.length; i++) {
      var on = opts[i].getAttribute("data-payload") === v;
      opts[i].className = "opt" + (on ? " sel" : "");
      try { opts[i].setAttribute("aria-pressed", on ? "true" : "false"); }
      catch (e) {}
    }
  }

  function remember() {
    lsSet(STORE, JSON.stringify({
      payload: currentPayload,
      autostart: document.getElementById("autoChk").checked
    }));
  }

  function restore() {
    var raw = lsGet(STORE);
    if (!raw) return;
    var saved = null;
    try { saved = JSON.parse(raw); } catch (e) { return; }
    if (saved.payload === "goldhen" || saved.payload === "hen") {
      selectPayload(saved.payload);
    }
    if (typeof saved.autostart === "boolean") {
      document.getElementById("autoChk").checked = saved.autostart;
    }
  }

  /* ---------- tema ---------- */
  function applyTheme(name) {
    if (name !== "neon" && name !== "rubi" && name !== "brasil") name = "neon";
    document.body.setAttribute("data-theme", name);
    lsSet(THEME_KEY, name);
    var btns = document.querySelectorAll(".theme-btn");
    var i;
    for (i = 0; i < btns.length; i++) {
      /* preserva as classes t-neon/t-rubi/t-brasil (cor da bolinha) */
      var keep = "";
      var parts = btns[i].className.split(/\s+/);
      var p;
      for (p = 0; p < parts.length; p++) {
        if (parts[p].indexOf("t-") === 0) keep += " " + parts[p];
      }
      btns[i].className = "theme-btn" + keep +
        (btns[i].getAttribute("data-theme") === name ? " sel" : "");
    }
  }

  /* ---------- cache offline (AppCache) ---------- */
  var appCache = null;
  try { appCache = window.applicationCache || null; } catch (e) {}

  function cacheText() {
    var el = document.getElementById("cacheNote");
    if (!el) return;
    if (!appCache) { el.textContent = ""; return; }
    var t = "";
    try {
      if (appCache.status === appCache.CHECKING)
        t = "verificando cache...";
      else if (appCache.status === appCache.DOWNLOADING)
        t = "baixando arquivos - aguarde";
      else if (appCache.status === appCache.UPDATEREADY)
        t = "versao nova em cache - recarregando";
      else if (appCache.status === appCache.OBSOLETE)
        t = "cache removido - servindo direto";
      else if (appCache.status === appCache.IDLE && appCache.status !== 0)
        t = "";
    } catch (e) {}
    el.textContent = t;
  }

  function swapAndReload() {
    var last = 0;
    try { last = parseInt(lsGet(SWAP_KEY) || "0", 10) || 0; } catch (e) {}
    if (Date.now() - last < 10000) return false;
    lsSet(SWAP_KEY, String(Date.now()));
    try { if (appCache) appCache.swapCache(); } catch (e) {}
    window.location.reload();
    return true;
  }

  function onCacheEvent() {
    cacheText();
    try {
      if (appCache && appCache.status === appCache.UPDATEREADY) {
        swapAndReload();
      }
    } catch (e) {}
  }

  if (appCache) {
    var evts = ["checking", "downloading", "progress", "cached",
                "noupdate", "updateready", "error", "obsolete"];
    for (var ei = 0; ei < evts.length; ei++) {
      try { appCache.addEventListener(evts[ei], onCacheEvent, false); }
      catch (e) {}
    }
  }

  /* ---------- inicio do desbloqueio ---------- */
  var ticker = null;
  var gone = false;

  function stopClock() {
    if (ticker !== null) { window.clearInterval(ticker); ticker = null; }
    document.getElementById("countdown").textContent = "";
  }

  function start() {
    if (gone) return;
    /* Troca de cache pendente: pega a versao nova e volta como load novo. */
    try {
      if (appCache && appCache.status === appCache.UPDATEREADY) {
        if (swapAndReload()) return;
      }
    } catch (e) {}
    gone = true;
    stopClock();

    var q = "log=1&afterglow=run";
    if (payload() === "hen") q += "&payload=hen.bin";
    else q += "&mode=goldhen";
    window.location.href = "jb.html?" + q;
  }

  function startClock() {
    var left = 5;
    var el = document.getElementById("countdown");
    el.textContent = "iniciando em " + left + "s";
    ticker = window.setInterval(function () {
      left -= 1;
      if (left <= 0) { start(); return; }
      el.textContent = "iniciando em " + left + "s";
    }, 1000);
  }

  /* ---------- diagnostico ---------- */
  function buildDiag() {
    var lines = [];
    var v = detectFirmware();
    var online = true;
    try { online = navigator.onLine !== false; } catch (e) {}
    var cacheStatus = "sem AppCache";
    if (appCache) {
      try {
        var s = appCache.status;
        var names = ["IDLE", "CHECKING", "DOWNLOADING", "UPDATEREADY",
                     "OBSOLETE"];
        cacheStatus = (s <= 4 ? names[s] : "status " + s) + " (" + s + ")";
      } catch (e) { cacheStatus = "indisponivel"; }
    }
    var storage = "ok";
    try {
      window.localStorage.setItem("__t", "1");
      window.localStorage.removeItem("__t");
    } catch (e) { storage = "bloqueado"; }

    lines.push("H7 PAINEL - diagnostico");
    lines.push("data: " + new Date().toISOString());
    lines.push("firmware: " + (v ? v + " (" +
      (SUPPORTED.indexOf(v) >= 0 ? "suportado" : "NAO listado") + ")"
      : "nao detectado (nao e PS4)"));
    lines.push("user-agent: " + (navigator.userAgent || "?"));
    lines.push("rede: " + (online ? "online" : "offline"));
    lines.push("appcache: " + cacheStatus);
    lines.push("localStorage: " + storage);
    lines.push("idioma: " + (navigator.language || "?"));
    lines.push("tela: " + window.screen.width + "x" + window.screen.height);
    lines.push("modo: " + (payload() === "hen" ? "alternativo" : "padrao"));
    return lines.join("\n");
  }

  function renderDiag() {
    document.getElementById("diag").textContent = buildDiag();
  }

  function copyDiag() {
    var text = buildDiag();
    var ok = false;
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (e) {}
    document.getElementById("diag").textContent =
      (ok ? "relatorio copiado!\n\n" : "nao foi possivel copiar - selecione manualmente:\n\n") +
      text;
  }

  /* ---------- ligacao dos elementos ---------- */
  function bind() {
    var i;
    /* botoes de navegacao (tiles e voltar) */
    var navs = document.querySelectorAll("[data-go]");
    for (i = 0; i < navs.length; i++) {
      navs[i].onclick = function () {
        var name = this.getAttribute("data-go");
        if (name === "system") renderDiag();
        go(name);
      };
    }

    /* payload (botoes .opt) + autostart */
    var opts = document.querySelectorAll(".opt");
    for (i = 0; i < opts.length; i++) {
      opts[i].onclick = function () {
        selectPayload(this.getAttribute("data-payload"));
        remember();
      };
    }
    var auto = document.getElementById("autoChk");
    auto.onchange = function () {
      remember();
      if (auto.checked) { gone = false; startClock(); }
      else stopClock();
    };

    /* iniciar */
    document.getElementById("startBtn").onclick = function () {
      stopClock();
      start();
    };

    /* temas */
    var tbtns = document.querySelectorAll(".theme-btn");
    for (i = 0; i < tbtns.length; i++) {
      tbtns[i].onclick = function () {
        applyTheme(this.getAttribute("data-theme"));
      };
    }

    /* diagnostico */
    document.getElementById("diagRefresh").onclick = renderDiag;
    document.getElementById("diagCopy").onclick = copyDiag;

    /* rede */
    try {
      window.addEventListener("online", renderBadges, false);
      window.addEventListener("offline", renderBadges, false);
    } catch (e) {}
  }

  /* ---------- aviso se nao for PS4 ---------- */
  function warnIfNotPS4() {
    if (isPS4()) return;
    document.getElementById("startWarn").textContent =
      "aviso: esta pagina nao foi aberta no PS4 - o desbloqueio so funciona " +
      "no navegador do console.";
  }

  /* ---------- init ---------- */
  function init() {
    var theme = lsGet(THEME_KEY) || "neon";
    applyTheme(theme);
    restore();
    renderBadges();
    warnIfNotPS4();
    cacheText();
    bind();
    /* autostart restaurado */
    if (document.getElementById("autoChk").checked) startClock();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, false);
  } else {
    init();
  }
})();

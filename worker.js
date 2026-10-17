/**
 * ULTIMATE DOWNLOADER - V6
 *
 * UI:      light/dark/auto theme, FA/EN, batch mode, history, installable (PWA) + share target,
 *          category/format filters, include/exclude search, sorting, selection, lazy file sizes,
 *          media/image preview player, export (TXT, aria2, wget, curl, M3U, JSON, CSV).
 * Server:  resumable proxy (Range), inline media streaming, custom Referer / file name,
 *          automatic Referer fallback on 403, redirect-checked fetching (SSRF guard),
 *          HTMLRewriter link extraction (relative URLs, <base>, og:video, JSON in scripts),
 *          optional deep scan of same-site pages, file inspector.
 *
 * Optional environment variable (Settings > Variables in Cloudflare):
 *   ALLOWED_HOSTS = "example.com,cdn.example.org"   (restricts the proxy to these hosts + subdomains)
 */

const CONFIG = {
    title_fa: "ابزار جامع دانلود",
    title_en: "Ultimate Downloader",
    color: "#e74c3c",
    maxLinks: 2000,
    scanTimeoutMs: 20000,
    infoTimeoutMs: 15000,
    maxRedirects: 5,
    deepMaxPages: 8,
    maxScriptChars: 400000
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const FILE_EXTS = ["exe", "msi", "zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz", "apk", "xapk", "ipa", "dmg", "pkg", "deb", "rpm", "appimage", "iso", "img", "bin", "jar", "torrent", "mkv", "mp4", "avi", "mov", "webm", "m4v", "wmv", "flv", "mp3", "wav", "flac", "m4a", "ogg", "opus", "aac", "m3u8", "mpd", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "txt", "epub", "mobi", "srt", "ass", "ttf", "otf"];
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "bmp", "psd"];
const FILE_EXT = new RegExp("\\.(" + FILE_EXTS.join("|") + ")$", "i");
const IMAGE_EXT = new RegExp("\\.(" + IMAGE_EXTS.join("|") + ")$", "i");

const MIME_BY_EXT = {
    mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime", mkv: "video/x-matroska",
    mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg", opus: "audio/ogg", wav: "audio/wav", flac: "audio/flac",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", avif: "image/avif"
};
const INLINE_OK = /^(video|audio)\/|^image\/(jpeg|png|gif|webp|avif|bmp)/i;
const RISKY_TYPE = /html|xml|javascript|ecmascript|svg|json/i;

const CSP = "default-src 'self'; script-src 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src https://cdn.jsdelivr.net; img-src 'self' data:; media-src 'self'; connect-src 'self'; manifest-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

const HTML_PAGE = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="${CONFIG.color}">
<meta name="robots" content="noindex, nofollow">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Downloader">
<title>${CONFIG.title_fa}</title>
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet">
<style>
  :root { --primary:${CONFIG.color}; --primary-2:#c0392b; --bg:#f3f5f9; --card:#ffffff; --text:#22272e; --muted:#6b7280; --border:#e3e7ee; --shadow:0 10px 30px rgba(15,23,42,.07); --soft:rgba(231,76,60,.08); }
  :root[data-theme="dark"] { --bg:#0f1115; --card:#181b22; --text:#e8ecf2; --muted:#9aa4b2; --border:#2a2f3a; --shadow:0 10px 30px rgba(0,0,0,.4); --soft:rgba(231,76,60,.14); }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { --bg:#0f1115; --card:#181b22; --text:#e8ecf2; --muted:#9aa4b2; --border:#2a2f3a; --shadow:0 10px 30px rgba(0,0,0,.4); --soft:rgba(231,76,60,.14); }
  }
  *, *::before, *::after { box-sizing:border-box; }
  [hidden] { display:none !important; }
  html, body { margin:0; }
  html { -webkit-text-size-adjust:100%; text-size-adjust:100%; }
  body { font-family:'Vazirmatn', system-ui, sans-serif; background:var(--bg); color:var(--text); min-height:100vh; line-height:1.7; overflow-x:hidden; transition:background .3s, color .3s; }
  button, input, select, textarea { font-family:inherit; font-size:1rem; color:inherit; }
  button { cursor:pointer; }
  button:active { transform:scale(.98); }
  :focus-visible { outline:2px solid var(--primary); outline-offset:2px; }

  header { position:sticky; top:0; z-index:10; display:flex; align-items:center; justify-content:space-between; height:60px; padding:0 20px; background:color-mix(in srgb, var(--card) 94%, transparent); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-bottom:1px solid var(--border); }
  .brand { display:flex; align-items:center; gap:10px; font-weight:700; color:var(--primary); font-size:1.1rem; min-width:0; }
  .brand img { width:30px; height:30px; border-radius:8px; flex-shrink:0; }
  .brand span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .hero .logo { display:block; width:76px; height:76px; margin:0 auto 12px; border-radius:20px; box-shadow:0 10px 26px rgba(231,76,60,.35); }
  .controls { display:flex; gap:8px; }
  .ibtn { background:none; border:1px solid var(--border); border-radius:10px; padding:6px 10px; color:var(--muted); }
  .ibtn:hover { color:var(--primary); border-color:var(--primary); }

  .wrap { max-width:820px; margin:0 auto; padding:32px 16px 60px; }
  .hero { text-align:center; margin-bottom:24px; }
  .hero h1 { margin:0 0 6px; font-size:2rem; background:linear-gradient(135deg, var(--primary), #ff8a65); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .hero p { margin:0; color:var(--muted); }

  .card { background:var(--card); border:1px solid var(--border); border-radius:18px; padding:24px; box-shadow:var(--shadow); }
  label { display:block; font-weight:700; margin-bottom:8px; }
  .lbl-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:8px; }
  .lbl-row label { margin:0; }
  .lbl-tools { display:flex; gap:12px; flex-wrap:wrap; }
  .link-btn { background:none; border:none; padding:0; color:var(--primary); font-weight:600; font-size:.85rem; }
  .link-btn:hover { text-decoration:underline; }
  .row { display:flex; gap:8px; }
  .row input { flex:1; min-width:0; padding:14px 16px; border:2px solid var(--border); border-radius:12px; background:var(--bg); direction:ltr; text-align:left; transition:border-color .2s; }
  .row input:focus, textarea:focus { border-color:var(--primary); outline:none; }
  textarea { width:100%; padding:12px 14px; border:2px solid var(--border); border-radius:12px; background:var(--bg); direction:ltr; text-align:left; font-family:monospace; font-size:.9rem; resize:vertical; }
  .paste { padding:0 16px; border:2px solid var(--border); border-radius:12px; background:var(--bg); }
  .paste:hover { border-color:var(--primary); }
  .actions { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-top:16px; }
  .btn-main, .btn-alt, .btn-ghost { border:none; border-radius:12px; padding:13px 10px; font-weight:700; text-decoration:none; text-align:center; display:inline-flex; align-items:center; justify-content:center; transition:background .2s, transform .1s; }
  .btn-main { background:var(--primary); color:#fff; }
  .btn-main:hover { background:var(--primary-2); }
  .btn-alt { background:var(--text); color:var(--bg); }
  .btn-alt:hover { opacity:.88; }
  .btn-ghost { background:var(--bg); border:1px solid var(--border); color:var(--text); padding:9px 14px; font-weight:600; font-size:.9rem; }
  .btn-ghost:hover { border-color:var(--primary); color:var(--primary); }
  .btn-sm { padding:9px 16px; font-size:.9rem; border-radius:10px; }

  details.adv { margin-top:16px; border:1px dashed var(--border); border-radius:12px; padding:10px 14px; }
  details.adv summary { cursor:pointer; font-weight:700; color:var(--muted); }
  .adv-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px 16px; margin-top:12px; }
  .fld { margin:0; font-size:.85rem; }
  .fld input { display:block; width:100%; margin-top:6px; padding:10px 12px; border:2px solid var(--border); border-radius:10px; background:var(--bg); direction:ltr; text-align:left; font-weight:400; font-size:.9rem; }
  .fld input:focus { border-color:var(--primary); outline:none; }
  .check { display:flex; align-items:center; gap:8px; margin:0; font-weight:600; cursor:pointer; font-size:.9rem; }
  .check input { width:18px; height:18px; accent-color:var(--primary); }

  .panel { margin-top:20px; background:var(--card); border:1px solid var(--border); border-radius:18px; padding:20px; box-shadow:var(--shadow); animation:fade .25s ease; }
  @keyframes fade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
  .link-line { word-break:break-all; direction:ltr; font-family:monospace; font-size:.9rem; padding:12px; background:var(--soft); border-radius:10px; margin-bottom:12px; text-align:left; }
  .link-line a { color:var(--primary); text-decoration:none; }
  .row-btns { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .cmds { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-inline-start:auto; }
  .status { text-align:center; color:var(--muted); font-weight:600; padding:12px; }
  .loader { text-align:center; color:var(--muted); padding:20px; }
  .err { color:var(--primary); font-weight:700; text-align:center; padding:12px; }
  .muted { color:var(--muted); font-size:.85rem; }
  .preview { margin-bottom:14px; }

  .res-head { margin-bottom:12px; }
  .res-title { font-weight:700; word-break:break-word; unicode-bidi:plaintext; }
  .toolbar { display:flex; gap:8px; margin-bottom:6px; }
  .toolbar input, .toolbar select { padding:10px 12px; border:2px solid var(--border); border-radius:10px; background:var(--bg); }
  .toolbar input { flex:1; min-width:0; }
  .toolbar input:focus, .toolbar select:focus { outline:none; border-color:var(--primary); }
  .chips { display:flex; gap:6px; flex-wrap:wrap; margin:10px 0 0; }
  .chip { border:1px solid var(--border); background:var(--bg); border-radius:999px; padding:4px 12px; font-size:.85rem; }
  .chip.on { background:var(--primary); border-color:var(--primary); color:#fff; }
  .chip.sub { direction:ltr; font-size:.8rem; padding:2px 10px; }
  .bar { display:flex; align-items:center; gap:14px; flex-wrap:wrap; padding:10px 0; border-top:1px dashed var(--border); border-bottom:1px dashed var(--border); margin:12px 0; font-size:.9rem; }
  .bar .grow { flex:1; }
  .progress { height:6px; background:var(--border); border-radius:999px; overflow:hidden; margin-bottom:12px; }
  .progress i { display:block; height:100%; width:0; background:var(--primary); transition:width .2s; }
  .exportbar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:6px; }
  .exportbar select { padding:9px 10px; border:2px solid var(--border); border-radius:10px; background:var(--bg); }
  .seg { display:inline-flex; border:1px solid var(--border); border-radius:10px; overflow:hidden; }
  .seg button { background:var(--bg); border:none; padding:9px 12px; font-size:.85rem; font-weight:600; }
  .seg button.on { background:var(--text); color:var(--bg); }

  .list { display:flex; flex-direction:column; gap:8px; max-height:560px; overflow-y:auto; padding-inline-end:4px; margin-top:10px; }
  .item { display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg); border:1px solid var(--border); border-inline-start:4px solid var(--primary); border-radius:10px; }
  .item input[type="checkbox"] { width:18px; height:18px; accent-color:var(--primary); flex-shrink:0; }
  .info { display:flex; align-items:center; gap:8px; flex:1; min-width:0; }
  .badge { background:var(--text); color:var(--bg); font-size:.72rem; font-weight:700; padding:2px 7px; border-radius:6px; min-width:44px; text-align:center; direction:ltr; flex-shrink:0; }
  .fname { font-family:monospace; font-size:.9rem; direction:ltr; unicode-bidi:plaintext; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0; }
  .size { font-size:.78rem; color:var(--muted); white-space:nowrap; direction:ltr; flex-shrink:0; }
  .acts { display:flex; gap:5px; flex-shrink:0; }
  .icon-btn-sm { width:34px; height:34px; display:inline-flex; align-items:center; justify-content:center; background:var(--card); border:1px solid var(--border); border-radius:8px; text-decoration:none; font-size:1rem; }
  .icon-btn-sm:hover { border-color:var(--primary); background:var(--soft); }
  .more { display:flex; margin:12px auto 0; }

  .kv { display:grid; grid-template-columns:max-content 1fr; gap:10px 16px; margin:0 0 16px; }
  .kv dt { color:var(--muted); font-weight:600; }
  .kv dd { margin:0; word-break:break-all; direction:ltr; text-align:left; font-family:monospace; font-size:.9rem; }

  dialog { border:none; border-radius:16px; padding:0; width:min(920px, 94vw); background:var(--card); color:var(--text); box-shadow:var(--shadow); }
  dialog::backdrop { background:rgba(0,0,0,.65); }
  .pl-head { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:10px 16px; border-bottom:1px solid var(--border); }
  .pl-title { direction:ltr; unicode-bidi:plaintext; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:monospace; font-size:.9rem; }
  .pl-media { display:block; width:100%; max-height:72vh; background:#000; object-fit:contain; }

  .foot { margin-top:28px; text-align:center; color:var(--muted); font-size:.82rem; }
  .foot code { direction:ltr; unicode-bidi:isolate; background:var(--soft); padding:1px 6px; border-radius:6px; display:inline-block; max-width:100%; overflow-x:auto; vertical-align:middle; white-space:nowrap; }

  #toastBox { position:fixed; bottom:calc(24px + env(safe-area-inset-bottom, 0px)); left:50%; transform:translate(-50%, 120px); background:var(--text); color:var(--bg); padding:10px 18px; border-radius:999px; font-weight:600; transition:transform .3s; z-index:50; pointer-events:none; max-width:92vw; text-align:center; }
  #toastBox.show { transform:translate(-50%, 0); }

  @media (max-width:640px) {
    header { height:auto; min-height:56px; padding:env(safe-area-inset-top, 0px) max(14px, env(safe-area-inset-right, 0px)) 0 max(14px, env(safe-area-inset-left, 0px)); }
    .brand { font-size:1rem; }
    .ibtn { min-height:40px; min-width:44px; }
    .wrap { padding:18px 12px calc(70px + env(safe-area-inset-bottom, 0px)); }
    .hero { margin-bottom:16px; }
    .hero .logo { width:64px; height:64px; border-radius:17px; }
    .hero h1 { font-size:1.5rem; }
    .hero p { font-size:.9rem; }
    .card { padding:16px; border-radius:16px; }
    .panel { padding:14px; border-radius:16px; }
    .lbl-row { gap:6px; }
    .lbl-tools { gap:14px; }
    .link-btn { padding:6px 0; font-size:.88rem; }
    .row input { padding:12px 12px; }
    .paste { min-width:46px; padding:0 10px; }
    .actions { grid-template-columns:1fr; }
    .btn-main, .btn-alt { padding:14px 10px; }
    .adv-grid { grid-template-columns:1fr; }
    .check { padding:4px 0; }
    .check input { width:20px; height:20px; }

    .row-btns { gap:8px; }
    .row-btns > .btn-ghost { flex:1 1 calc(50% - 8px); padding:12px 10px; }
    .cmds { margin-inline-start:0; width:100%; }
    .cmds > .muted { width:100%; }
    .cmds .btn-ghost { flex:1; padding:11px 8px; }
    .link-line { font-size:.82rem; }
    .kv { grid-template-columns:1fr; gap:2px 0; }
    .kv dd { margin-bottom:10px; }

    .toolbar { flex-direction:column; }
    .toolbar input, .toolbar select { padding:12px; }
    .chips { flex-wrap:nowrap; overflow-x:auto; overscroll-behavior-x:contain; -webkit-overflow-scrolling:touch; scrollbar-width:none; padding-bottom:4px; margin-inline:-2px; }
    .chips::-webkit-scrollbar { display:none; }
    .chip { flex:none; white-space:nowrap; padding:7px 14px; }
    .chip.sub { padding:5px 12px; }
    .bar { gap:8px 12px; }
    .bar .grow { display:none; }
    #sizesBtn { width:100%; padding:12px; }

    .exportbar { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .exportbar .seg { grid-column:1 / -1; display:flex; }
    .exportbar .seg button { flex:1; padding:12px 8px; }
    .exportbar select { grid-column:1 / -1; width:100%; padding:12px 10px; }
    .exportbar .btn-sm { width:100%; padding:13px 8px; }

    .list { max-height:none; overflow:visible; padding-inline-end:0; gap:10px; }
    .item { display:grid; grid-template-columns:auto 1fr; align-items:start; gap:8px 10px; padding:12px; }
    .item input[type="checkbox"] { width:22px; height:22px; margin-top:2px; }
    .info { flex-wrap:wrap; gap:6px 8px; }
    .info .badge { order:1; }
    .info .size { order:2; margin-inline-start:auto; }
    .info .fname { order:3; flex:1 1 100%; white-space:normal; overflow-wrap:anywhere; word-break:break-all; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; line-height:1.5; }
    .acts { grid-column:1 / -1; width:100%; gap:8px; }
    .acts .icon-btn-sm { flex:1; width:auto; height:42px; font-size:1.1rem; }
    .more { width:100%; justify-content:center; padding:13px; }

    dialog { width:96vw; max-width:96vw; }
    .pl-media { max-height:60vh; }
  }
</style>
</head>
<body>
<header>
  <div class="brand"><img src="/icon.svg" width="30" height="30" alt=""><span data-i18n="title"></span></div>
  <div class="controls">
    <button class="ibtn" id="langBtn" type="button">🌐 <span id="langLbl">FA</span></button>
    <button class="ibtn" id="themeBtn" type="button" title="Theme">🌓</button>
  </div>
</header>

<main class="wrap">
  <section class="hero">
    <img class="logo" src="/icon.svg" width="76" height="76" alt="">
    <h1 data-i18n="hero"></h1>
    <p data-i18n="sub"></p>
  </section>

  <section class="card">
    <div class="lbl-row">
      <label for="urlInput" id="lblMain" data-i18n="lblUrl"></label>
      <div class="lbl-tools">
        <button class="link-btn" id="batchToggle" type="button" data-i18n="batchOn"></button>
        <button class="link-btn" id="clearHist" type="button" data-i18n="clearHist"></button>
      </div>
    </div>
    <div class="row" id="singleRow">
      <input id="urlInput" type="text" dir="ltr" autocomplete="off" spellcheck="false" list="hist" data-i18n-ph="phUrl">
      <button class="paste" id="pasteBtn" type="button" title="Paste">📋</button>
      <button class="paste" id="clearBtn" type="button" title="Clear">✖</button>
    </div>
    <textarea id="batchInput" rows="6" spellcheck="false" hidden data-i18n-ph="phBatch"></textarea>
    <datalist id="hist"></datalist>
    <div class="actions">
      <button class="btn-main" id="btnProxy" type="button" data-i18n="btnProxy"></button>
      <button class="btn-alt" id="btnScan" type="button" data-i18n="btnScan"></button>
      <button class="btn-alt" id="btnInfo" type="button" data-i18n="btnInfo"></button>
    </div>
    <details class="adv">
      <summary data-i18n="advanced"></summary>
      <div class="adv-grid">
        <label class="fld"><span data-i18n="optRef"></span><input id="optRef" type="text" autocomplete="off" spellcheck="false" data-i18n-ph="optRefPh"></label>
        <label class="fld"><span data-i18n="optName"></span><input id="optName" type="text" autocomplete="off" spellcheck="false" data-i18n-ph="optNamePh"></label>
        <label class="check"><input id="optDeep" type="checkbox"> <span data-i18n="optDeep"></span></label>
        <label class="check"><input id="optImg" type="checkbox"> <span data-i18n="optImg"></span></label>
      </div>
    </details>
  </section>

  <section class="panel" id="proxyBox" hidden>
    <div class="link-line"><a id="proxyLink" target="_blank" rel="noopener"></a></div>
    <div class="row-btns" id="proxyActs"></div>
  </section>

  <section class="panel" id="infoBox" hidden>
    <div id="infoBody"></div>
  </section>

  <section class="panel" id="scanBox" hidden>
    <div id="scanStatus" class="status"></div>
    <div id="scanResults" hidden>
      <div class="res-head">
        <div id="resTitle" class="res-title"></div>
        <div id="resMeta" class="muted"></div>
      </div>
      <div class="toolbar">
        <input id="searchInput" type="search" autocomplete="off" data-i18n-ph="search">
        <select id="sortSel">
          <option value="name" data-i18n="sortName"></option>
          <option value="ext" data-i18n="sortExt"></option>
          <option value="size" data-i18n="sortSize"></option>
        </select>
      </div>
      <div class="muted"><span data-i18n="searchHint"></span> <bdi dir="ltr">1080 -sample</bdi></div>
      <div class="chips" id="catChips"></div>
      <div class="chips" id="extChips"></div>
      <div class="bar">
        <label class="check"><input type="checkbox" id="selectAll"> <span data-i18n="selectAll"></span></label>
        <span id="selCount"></span>
        <span id="countInfo" class="muted"></span>
        <span class="grow"></span>
        <button class="btn-ghost btn-sm" id="sizesBtn" type="button" data-i18n="sizes"></button>
      </div>
      <div class="progress" id="sizeProg" hidden><i id="sizeProgBar"></i></div>
      <div class="exportbar">
        <div class="seg">
          <button id="outRaw" class="on" type="button" data-i18n="outRaw"></button>
          <button id="outDirect" type="button" data-i18n="outDirect"></button>
        </div>
        <select id="fmtSel" aria-label="Format">
          <option value="txt" data-i18n="fmtTxt"></option>
          <option value="aria" data-i18n="fmtAria"></option>
          <option value="wget" data-i18n="fmtWget"></option>
          <option value="curl" data-i18n="fmtCurl"></option>
          <option value="m3u" data-i18n="fmtM3u"></option>
          <option value="json" data-i18n="fmtJson"></option>
          <option value="csv" data-i18n="fmtCsv"></option>
        </select>
        <button class="btn-ghost btn-sm" id="expCopy" type="button" data-i18n="btnCopy"></button>
        <button class="btn-main btn-sm" id="expDl" type="button" data-i18n="btnDl"></button>
      </div>
      <div class="muted" data-i18n="bulkHint"></div>
      <div class="list" id="linkList"></div>
      <button class="btn-ghost more" id="moreBtn" type="button" hidden></button>
    </div>
  </section>

  <div class="foot"><span data-i18n="tip"></span> <code>aria2c -i aria2-input.txt -c -x16 -s16</code></div>
</main>

<dialog id="player">
  <div class="pl-head">
    <div class="pl-title" id="playerTitle"></div>
    <button class="btn-ghost btn-sm" id="playerClose" type="button" data-i18n="close"></button>
  </div>
  <div id="playerBody"></div>
</dialog>

<div id="toastBox" role="status"></div>

<script>
var LS = { lang: "udl_lang", theme: "udl_theme", hist: "udl_hist", opts: "udl_opts" };
var HIST_MAX = 20, SIZE_MAX = 80, PAGE_STEP = 300, BATCH_MAX = 300;
var NL = String.fromCharCode(10), CR = String.fromCharCode(13), DQ = String.fromCharCode(34);
var SQ = String.fromCharCode(39), BS = String.fromCharCode(92), BOM = String.fromCharCode(65279);

var CATS = {
  video: "mkv mp4 avi mov webm m4v wmv flv".split(" "),
  audio: "mp3 wav flac m4a ogg aac opus".split(" "),
  archive: "zip rar 7z tar gz tgz bz2 xz".split(" "),
  app: "exe msi apk xapk ipa dmg pkg deb rpm appimage iso img bin jar".split(" "),
  doc: "pdf doc docx xls xlsx ppt pptx csv txt epub mobi srt ass".split(" "),
  image: "jpg jpeg png gif webp avif svg bmp psd".split(" ")
};
var CAT_ORDER = ["video", "audio", "archive", "app", "doc", "image", "other"];
var CAT_ICON = { video: "🎬", audio: "🎵", archive: "🗜️", app: "💾", doc: "📄", image: "🖼️", other: "📦" };
var CAT_OF = {};
Object.keys(CATS).forEach(function (c) { CATS[c].forEach(function (e) { CAT_OF[e] = c; }); });
var PREVIEW_EXT = "mp4 m4v webm mov mp3 m4a aac ogg opus wav flac jpg jpeg png gif webp avif".split(" ");

var DICT = {
  fa: {
    title: "ابزار جامع دانلود",
    hero: "ابزار جامع دانلود",
    sub: "لینک مستقیم بسازید، فایل‌های یک صفحه را پیدا کنید، مشخصات فایل را ببینید و خروجی آماده‌ی مدیر دانلود بگیرید.",
    lblUrl: "آدرس (URL)",
    lblBatch: "فهرست آدرس‌ها",
    phUrl: "https://example.com/file.zip",
    phBatch: "هر خط یک آدرس…",
    btnProxy: "🚀 لینک مستقیم",
    btnLoad: "📚 بارگذاری فهرست",
    btnScan: "🕵️ شکارچی فایل",
    btnInfo: "ℹ️ بررسی فایل",
    batchOn: "📚 حالت دسته‌ای",
    batchOff: "↩️ حالت تکی",
    batchTitle: "فهرست دسته‌ای",
    clearHist: "🗑 پاک‌کردن تاریخچه",
    histCleared: "تاریخچه پاک شد",
    advanced: "⚙️ تنظیمات پیشرفته",
    optRef: "Referer دلخواه",
    optRefPh: "خالی = آدرس خود سایت",
    optName: "نام فایل دلخواه (فقط لینک تکی)",
    optNamePh: "مثلاً movie.mkv",
    optDeep: "اسکن عمیق (چند صفحه‌ی هم‌دامنه)",
    optImg: "شامل تصاویر",
    copy: "📋 کپی لینک",
    copyRaw: "کپی لینک اصلی",
    copyProxy: "کپی لینک مستقیم",
    download: "📥 دانلود",
    share: "📤 اشتراک",
    play: "▶️ پیش‌نمایش",
    close: "✖ بستن",
    cmdLbl: "کپی دستور:",
    noUrl: "لطفاً آدرس را وارد کنید",
    noBatch: "آدرس معتبری در فهرست نیست",
    scanning: "⏳ در حال اسکن صفحه…",
    loading: "⏳ در حال بررسی…",
    scanEmpty: "فایلی در این صفحه پیدا نشد 😔",
    scanErr: "خطا در ارتباط با سایت مبدأ",
    isFileAuto: "این آدرس خودش یک فایل است؛ مشخصاتش نمایش داده شد",
    search: "جستجو در نام یا آدرس…",
    searchHint: "چند کلمه = همه باید باشند. با خط تیره حذف می‌کند، مثلاً:",
    sortName: "مرتب‌سازی: نام",
    sortExt: "مرتب‌سازی: فرمت",
    sortSize: "مرتب‌سازی: حجم",
    all: "همه",
    cat_video: "ویدیو",
    cat_audio: "صوت",
    cat_archive: "فشرده",
    cat_app: "برنامه",
    cat_doc: "سند",
    cat_image: "تصویر",
    cat_other: "سایر",
    selectAll: "انتخاب همه نمایش‌داده‌شده‌ها",
    selected: function (n) { return nf(n) + " انتخاب شده"; },
    more: function (n) { return "نمایش بیشتر (" + nf(n) + " مورد دیگر)"; },
    pagesNote: function (n) { return nf(n) + " صفحه اسکن شد"; },
    truncated: "تعداد نتایج محدود شد",
    bulkHint: "اگر موردی انتخاب نشده باشد، خروجی روی همه‌ی موارد نمایش‌داده‌شده اعمال می‌شود.",
    outRaw: "لینک اصلی",
    outDirect: "لینک مستقیم",
    fmtTxt: "فهرست متنی (TXT)",
    fmtAria: "ورودی aria2",
    fmtWget: "اسکریپت wget",
    fmtCurl: "اسکریپت curl",
    fmtM3u: "پلی‌لیست M3U",
    fmtJson: "JSON",
    fmtCsv: "CSV (اکسل)",
    btnCopy: "📋 کپی",
    btnDl: "💾 ذخیره فایل",
    copied: "کپی شد ✓",
    empty: "موردی برای عملیات وجود ندارد",
    pasteFail: "امکان خواندن کلیپ‌بورد نیست؛ دستی Paste کنید",
    sizes: "📏 دریافت حجم‌ها",
    sizesRun: function (a, b) { return "در حال دریافت حجم… " + nf(a) + " از " + nf(b); },
    sizesDone: "حجم همه‌ی موارد نمایش‌داده‌شده دریافت شده است",
    fname: "نام فایل",
    fsize: "حجم",
    ftype: "نوع محتوا",
    fresume: "قابلیت ادامه دانلود",
    fmod: "آخرین تغییر",
    fsrc: "آدرس نهایی",
    yes: "بله",
    no: "خیر",
    tip: "نکته: برای دانلود گروهی، خروجی «ورودی aria2» را ذخیره کنید و این دستور را اجرا کنید:"
  },
  en: {
    title: "Ultimate Downloader",
    hero: "Ultimate Downloader",
    sub: "Generate direct links, grab files from a page, inspect a link and export lists ready for your download manager.",
    lblUrl: "URL",
    lblBatch: "URL list",
    phUrl: "https://example.com/file.zip",
    phBatch: "One URL per line…",
    btnProxy: "🚀 Direct link",
    btnLoad: "📚 Load list",
    btnScan: "🕵️ File grabber",
    btnInfo: "ℹ️ Inspect file",
    batchOn: "📚 Batch mode",
    batchOff: "↩️ Single mode",
    batchTitle: "Batch list",
    clearHist: "🗑 Clear history",
    histCleared: "History cleared",
    advanced: "⚙️ Advanced options",
    optRef: "Custom Referer",
    optRefPh: "Empty = the site itself",
    optName: "Custom file name (single link only)",
    optNamePh: "e.g. movie.mkv",
    optDeep: "Deep scan (several same-site pages)",
    optImg: "Include images",
    copy: "📋 Copy link",
    copyRaw: "Copy original link",
    copyProxy: "Copy direct link",
    download: "📥 Download",
    share: "📤 Share",
    play: "▶️ Preview",
    close: "✖ Close",
    cmdLbl: "Copy command:",
    noUrl: "Please enter a URL",
    noBatch: "No valid URL in the list",
    scanning: "⏳ Scanning page…",
    loading: "⏳ Checking…",
    scanEmpty: "No files found on this page 😔",
    scanErr: "Could not reach the source site",
    isFileAuto: "This URL is a file itself; showing its details",
    search: "Search by name or URL…",
    searchHint: "Several words = all must match. A leading dash excludes, e.g.:",
    sortName: "Sort: name",
    sortExt: "Sort: format",
    sortSize: "Sort: size",
    all: "All",
    cat_video: "Video",
    cat_audio: "Audio",
    cat_archive: "Archives",
    cat_app: "Apps",
    cat_doc: "Documents",
    cat_image: "Images",
    cat_other: "Other",
    selectAll: "Select all visible",
    selected: function (n) { return nf(n) + " selected"; },
    more: function (n) { return "Show more (" + nf(n) + " left)"; },
    pagesNote: function (n) { return nf(n) + " pages scanned"; },
    truncated: "results were capped",
    bulkHint: "If nothing is selected, the export applies to all visible items.",
    outRaw: "Original links",
    outDirect: "Direct links",
    fmtTxt: "Plain list (TXT)",
    fmtAria: "aria2 input file",
    fmtWget: "wget script",
    fmtCurl: "curl script",
    fmtM3u: "M3U playlist",
    fmtJson: "JSON",
    fmtCsv: "CSV (Excel)",
    btnCopy: "📋 Copy",
    btnDl: "💾 Save file",
    copied: "Copied ✓",
    empty: "Nothing to act on",
    pasteFail: "Clipboard access denied — paste manually",
    sizes: "📏 Get sizes",
    sizesRun: function (a, b) { return "Fetching sizes… " + nf(a) + " of " + nf(b); },
    sizesDone: "Sizes are already loaded for all visible items",
    fname: "File name",
    fsize: "Size",
    ftype: "Content type",
    fresume: "Resumable",
    fmod: "Last modified",
    fsrc: "Final URL",
    yes: "Yes",
    no: "No",
    tip: "Tip: for bulk downloads save the «aria2 input file» export and run:"
  }
};

var state = { lang: "fa", batch: false, links: [], selected: {}, cat: "all", ext: "all", text: "", sort: "name", out: "raw", limit: PAGE_STEP, sizing: false };
var scanCtl = null;

function T(key, a, b) {
  var v = DICT[state.lang][key];
  return typeof v === "function" ? v(a, b) : v;
}
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}
function nf(n) {
  try { return new Intl.NumberFormat(state.lang === "fa" ? "fa-IR" : "en-US").format(n); } catch (e) { return String(n); }
}
function fmtSize(b) {
  if (b === null || b === undefined || b < 0) return "—";
  var u = ["B", "KB", "MB", "GB", "TB"], i = 0, n = Number(b);
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  var k = i ? 100 : 1;
  return nf(Math.round(n * k) / k) + " " + u[i];
}

function toast(msg) {
  var t = $("toastBox");
  t.textContent = msg;
  t.className = "show";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(function () { t.className = ""; }, 2000);
}

function fallbackCopy(text) {
  var ta = el("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
}

function copyText(text, btn) {
  var done = function () {
    if (btn) {
      var old = btn.textContent;
      btn.textContent = "✓";
      setTimeout(function () { btn.textContent = old; }, 1200);
    }
    toast(T("copied"));
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
  } else {
    fallbackCopy(text);
    done();
  }
}

function downloadText(text, filename, mime, bom) {
  var blob = new Blob([(bom ? BOM : "") + text], { type: (mime || "text/plain") + ";charset=utf-8" });
  var a = el("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
}

function shq(s) { return SQ + String(s).split(SQ).join(SQ + BS + SQ + SQ) + SQ; }

function safeName(s) {
  var bad = "/" + BS + ":*?" + DQ + "<>|";
  var out = String(s || "download");
  for (var i = 0; i < bad.length; i++) out = out.split(bad.charAt(i)).join("_");
  return out || "download";
}

function extractUrl(text) {
  var parts = String(text || "").split(NL).join(" ").split(CR).join(" ").split(" ");
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (p.indexOf("http://") === 0 || p.indexOf("https://") === 0) return p;
  }
  return "";
}

function normalizeInput(v) {
  v = (v || "").trim();
  if (!v) return "";
  var u = extractUrl(v);
  if (u) return u;
  if (v.indexOf(" ") !== -1) return "";
  if (v.indexOf("://") === -1) v = "https://" + v;
  return v;
}

function parseUrls(text) {
  var lines = String(text || "").split(CR).join("").split(NL), out = [], seen = {};
  for (var i = 0; i < lines.length && out.length < BATCH_MAX; i++) {
    var u = normalizeInput(lines[i]);
    if (u && !seen[u]) { seen[u] = true; out.push(u); }
  }
  return out;
}

function getOpts() {
  return { ref: $("optRef").value.trim(), name: $("optName").value.trim(), deep: $("optDeep").checked, img: $("optImg").checked };
}
function saveOpts() {
  var o = getOpts();
  try { localStorage.setItem(LS.opts, JSON.stringify({ ref: o.ref, deep: o.deep, img: o.img })); } catch (e) {}
}
function loadOpts() {
  try {
    var o = JSON.parse(localStorage.getItem(LS.opts) || "{}");
    $("optRef").value = o.ref || "";
    $("optDeep").checked = !!o.deep;
    $("optImg").checked = !!o.img;
  } catch (e) {}
}

function proxyUrl(raw, o) {
  o = o || {};
  var ref = getOpts().ref;
  var u = location.origin + "/?url=" + encodeURIComponent(raw);
  if (ref) u += "&ref=" + encodeURIComponent(ref);
  if (o.name) u += "&name=" + encodeURIComponent(o.name);
  if (o.inline) u += "&inline=1";
  return u;
}
function apiQs(forScan) {
  var o = getOpts(), q = "";
  if (o.ref) q += "&ref=" + encodeURIComponent(o.ref);
  if (forScan && o.deep) q += "&deep=1";
  if (forScan && o.img) q += "&img=1";
  return q;
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS.hist) || "[]"); } catch (e) { return []; }
}
function saveHistory(v) {
  var h = loadHistory().filter(function (x) { return x !== v; });
  h.unshift(v);
  h = h.slice(0, HIST_MAX);
  try { localStorage.setItem(LS.hist, JSON.stringify(h)); } catch (e) {}
  renderHistory();
}
function renderHistory() {
  var dl = $("hist");
  dl.textContent = "";
  loadHistory().forEach(function (v) {
    var o = el("option");
    o.value = v;
    dl.appendChild(o);
  });
}

function getTarget() {
  var v = normalizeInput($("urlInput").value);
  if (!v) {
    toast(T("noUrl"));
    $("urlInput").focus();
    return "";
  }
  $("urlInput").value = v;
  saveHistory(v);
  return v;
}

function showPanel(id) {
  ["proxyBox", "scanBox", "infoBox"].forEach(function (p) { $(p).hidden = p !== id; });
}

function readJson(r) {
  return r.json().then(function (d) {
    if (!r.ok || d.error) throw new Error(d.error || T("scanErr"));
    return d;
  }, function () { throw new Error(T("scanErr")); });
}

function btnEl(label, fn, cls) {
  var b = el("button", cls || "btn-ghost", label);
  b.type = "button";
  b.onclick = function () { fn(b); };
  return b;
}
function linkBtn(label, href) {
  var a = el("a", "btn-ghost", label);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  return a;
}
function iconBtn(icon, title, fn) {
  var b = el("button", "icon-btn-sm", icon);
  b.type = "button";
  b.title = title;
  b.setAttribute("aria-label", title);
  b.onclick = function () { fn(b); };
  return b;
}
function iconLink(icon, title, href) {
  var a = el("a", "icon-btn-sm", icon);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  a.title = title;
  a.setAttribute("aria-label", title);
  return a;
}

/* ---------- Items ---------- */

function catOf(ext) { return CAT_OF[ext] || "other"; }

function makeItem(raw) {
  var name = raw.split("#")[0].split("?")[0].split("/").pop();
  try { name = decodeURIComponent(name); } catch (e) {}
  var dot = name.lastIndexOf(".");
  var ext = dot > -1 ? name.slice(dot + 1).toLowerCase() : "";
  if (ext.length > 8) ext = "";
  return { raw: raw, name: name || raw, ext: ext, cat: catOf(ext), size: undefined, sizeEl: null };
}

function canPreview(it) { return PREVIEW_EXT.indexOf(it.ext) !== -1; }

function openPlayer(it) {
  var d = $("player"), body = $("playerBody");
  body.textContent = "";
  var src = proxyUrl(it.raw, { inline: true });
  var node;
  if (it.cat === "video") { node = el("video"); node.controls = true; node.autoplay = true; node.src = src; }
  else if (it.cat === "audio") { node = el("audio"); node.controls = true; node.autoplay = true; node.src = src; }
  else { node = el("img"); node.src = src; node.alt = it.name; }
  node.className = "pl-media";
  body.appendChild(node);
  $("playerTitle").textContent = it.name;
  if (typeof d.showModal === "function") { if (!d.open) d.showModal(); } else { d.setAttribute("open", ""); }
}
function closePlayer() {
  var d = $("player");
  $("playerBody").textContent = "";
  if (typeof d.close === "function") { if (d.open) d.close(); } else { d.removeAttribute("open"); }
}

function buildActions(box, raw, name, link) {
  var item = makeItem(raw);
  var fname = safeName(name || item.name);
  box.textContent = "";
  box.appendChild(btnEl(T("copy"), function (b) { copyText(link, b); }));
  box.appendChild(linkBtn(T("download"), link));
  if (navigator.share) {
    box.appendChild(btnEl(T("share"), function () {
      try { navigator.share({ url: link, title: fname }).catch(function () {}); } catch (e) {}
    }));
  }
  if (canPreview(item)) box.appendChild(btnEl(T("play"), function () { openPlayer(item); }));
  var cmds = el("div", "cmds");
  cmds.appendChild(el("span", "muted", T("cmdLbl")));
  cmds.appendChild(btnEl("curl", function (b) { copyText("curl -L -C - -o " + shq(fname) + " " + shq(link), b); }));
  cmds.appendChild(btnEl("wget", function (b) { copyText("wget -c -O " + shq(fname) + " " + shq(link), b); }));
  cmds.appendChild(btnEl("aria2", function (b) { copyText("aria2c -c -x16 -s16 -o " + shq(fname) + " " + shq(link), b); }));
  box.appendChild(cmds);
}

/* ---------- Actions ---------- */

function actProxy() {
  if (state.batch) return actBatch();
  var t = getTarget();
  if (!t) return;
  showPanel("proxyBox");
  var o = getOpts();
  var link = proxyUrl(t, { name: o.name });
  $("proxyLink").href = link;
  $("proxyLink").textContent = link;
  buildActions($("proxyActs"), t, o.name, link);
}

function actBatch() {
  var urls = parseUrls($("batchInput").value);
  if (!urls.length) return toast(T("noBatch"));
  showPanel("scanBox");
  $("scanStatus").textContent = "";
  setLinks(urls, { title: T("batchTitle") });
  $("scanResults").hidden = false;
}

function showInfo(t) {
  showPanel("infoBox");
  var box = $("infoBody");
  box.textContent = "";
  box.appendChild(el("div", "loader", T("loading")));
  return fetch("/api/info?url=" + encodeURIComponent(t) + apiQs(false)).then(readJson).then(function (d) {
    box.textContent = "";
    var item = makeItem(t);
    item.name = d.filename || item.name;
    if (d.type && d.type.indexOf("video/") === 0) item.cat = "video";
    else if (d.type && d.type.indexOf("audio/") === 0) item.cat = "audio";
    else if (d.type && d.type.indexOf("image/") === 0) item.cat = "image";
    var rows = [
      [T("fname"), d.filename],
      [T("fsize"), fmtSize(d.size)],
      [T("ftype"), d.type || "—"],
      [T("fresume"), d.resumable ? T("yes") : T("no")],
      [T("fmod"), d.lastModified || "—"],
      [T("fsrc"), d.url]
    ];
    var dl = el("dl", "kv");
    rows.forEach(function (r) {
      dl.appendChild(el("dt", "", r[0]));
      dl.appendChild(el("dd", "", r[1]));
    });
    box.appendChild(dl);
    var acts = el("div", "row-btns");
    var link = proxyUrl(t, { name: getOpts().name });
    buildActions(acts, t, getOpts().name || d.filename, link);
    box.appendChild(acts);
  }).catch(function (e) {
    box.textContent = "";
    box.appendChild(el("div", "err", e.message || T("scanErr")));
  });
}

function actInfo() {
  var t = getTarget();
  if (!t) return;
  showInfo(t);
}

function actScan() {
  var t = getTarget();
  if (!t) return;
  if (scanCtl) { try { scanCtl.abort(); } catch (e) {} }
  scanCtl = window.AbortController ? new AbortController() : null;
  showPanel("scanBox");
  $("scanStatus").textContent = T("scanning");
  $("scanResults").hidden = true;
  fetch("/api/extract?url=" + encodeURIComponent(t) + apiQs(true), scanCtl ? { signal: scanCtl.signal } : {}).then(readJson).then(function (d) {
    $("scanStatus").textContent = "";
    if (d.isFile) { toast(T("isFileAuto")); return showInfo(t); }
    if (!d.links.length) { $("scanStatus").textContent = T("scanEmpty"); return; }
    setLinks(d.links, { title: d.title, pages: d.pages, truncated: d.truncated });
    $("scanResults").hidden = false;
  }).catch(function (e) {
    if (e && e.name === "AbortError") return;
    $("scanStatus").textContent = e.message || T("scanErr");
  });
}

/* ---------- Results ---------- */

function setLinks(urls, meta) {
  meta = meta || {};
  state.links = urls.map(makeItem);
  state.selected = {};
  state.cat = "all";
  state.ext = "all";
  state.text = "";
  state.limit = PAGE_STEP;
  $("searchInput").value = "";
  $("resTitle").textContent = meta.title || "";
  var note = [];
  if (meta.pages && meta.pages > 1) note.push(T("pagesNote", meta.pages));
  if (meta.truncated) note.push(T("truncated"));
  $("resMeta").textContent = note.join(" · ");
  refresh();
}

function refresh() {
  state.limit = PAGE_STEP;
  renderChips();
  renderList();
}

function chipBtn(label, on, fn, cls) {
  var b = el("button", "chip" + (cls ? " " + cls : "") + (on ? " on" : ""), label);
  b.type = "button";
  b.onclick = fn;
  return b;
}

function renderChips() {
  var cbox = $("catChips"), ebox = $("extChips");
  cbox.textContent = "";
  ebox.textContent = "";
  var cc = {}, ec = {};
  state.links.forEach(function (it) {
    cc[it.cat] = (cc[it.cat] || 0) + 1;
    if (state.cat === "all" || it.cat === state.cat) ec[it.ext] = (ec[it.ext] || 0) + 1;
  });
  cbox.appendChild(chipBtn(T("all") + " (" + nf(state.links.length) + ")", state.cat === "all", function () { state.cat = "all"; state.ext = "all"; refresh(); }));
  CAT_ORDER.forEach(function (c) {
    if (!cc[c]) return;
    cbox.appendChild(chipBtn(CAT_ICON[c] + " " + T("cat_" + c) + " (" + nf(cc[c]) + ")", state.cat === c, function () { state.cat = c; state.ext = "all"; refresh(); }));
  });
  var keys = Object.keys(ec).sort();
  if (keys.length > 1) {
    ebox.appendChild(chipBtn(T("all"), state.ext === "all", function () { state.ext = "all"; refresh(); }, "sub"));
    keys.forEach(function (k) {
      ebox.appendChild(chipBtn("." + (k || "?").toUpperCase() + " (" + nf(ec[k]) + ")", state.ext === k, function () { state.ext = k; refresh(); }, "sub"));
    });
  }
}

function visibleItems() {
  var terms = state.text.toLowerCase().split(" ").filter(Boolean);
  var inc = [], exc = [];
  terms.forEach(function (t) {
    if (t.charAt(0) === "-" && t.length > 1) exc.push(t.slice(1)); else inc.push(t);
  });
  var items = state.links.filter(function (it) {
    if (state.cat !== "all" && it.cat !== state.cat) return false;
    if (state.ext !== "all" && it.ext !== state.ext) return false;
    var hay = (it.raw + " " + it.name).toLowerCase();
    for (var i = 0; i < inc.length; i++) if (hay.indexOf(inc[i]) === -1) return false;
    for (var j = 0; j < exc.length; j++) if (hay.indexOf(exc[j]) !== -1) return false;
    return true;
  });
  items.sort(function (a, b) {
    if (state.sort === "ext") return a.ext.localeCompare(b.ext) || a.name.localeCompare(b.name);
    if (state.sort === "size") {
      var sa = a.size > 0 ? a.size : -1, sb = b.size > 0 ? b.size : -1;
      return sb - sa || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });
  return items;
}

function selectedCount() { return Object.keys(state.selected).length; }

function updateSelInfo(items) {
  $("selCount").textContent = T("selected", selectedCount());
  var all = items.length > 0 && items.every(function (it) { return state.selected[it.raw]; });
  $("selectAll").checked = all;
}

function sizeText(it) {
  if (it.size === undefined) return "";
  return it.size < 0 ? "?" : fmtSize(it.size);
}

function buildItem(it) {
  var row = el("div", "item");
  var cb = el("input");
  cb.type = "checkbox";
  cb.checked = !!state.selected[it.raw];
  cb.onchange = function () {
    if (cb.checked) state.selected[it.raw] = true;
    else delete state.selected[it.raw];
    $("selCount").textContent = T("selected", selectedCount());
  };
  var info = el("div", "info");
  info.title = it.raw;
  info.appendChild(el("span", "badge", (it.ext || "?").toUpperCase()));
  info.appendChild(el("span", "fname", it.name));
  it.sizeEl = el("span", "size", sizeText(it));
  info.appendChild(it.sizeEl);
  var acts = el("div", "acts");
  acts.appendChild(iconBtn("🔗", T("copyRaw"), function (b) { copyText(it.raw, b); }));
  acts.appendChild(iconBtn("📋", T("copyProxy"), function (b) { copyText(proxyUrl(it.raw), b); }));
  if (canPreview(it)) acts.appendChild(iconBtn("▶️", T("play"), function () { openPlayer(it); }));
  acts.appendChild(iconLink("📥", T("download"), proxyUrl(it.raw)));
  row.appendChild(cb);
  row.appendChild(info);
  row.appendChild(acts);
  return row;
}

function renderList() {
  var items = visibleItems();
  var list = $("linkList");
  list.textContent = "";
  var shown = items.slice(0, state.limit);
  shown.forEach(function (it) { list.appendChild(buildItem(it)); });
  $("countInfo").textContent = nf(items.length) + " / " + nf(state.links.length);
  var more = $("moreBtn");
  if (items.length > shown.length) {
    more.hidden = false;
    more.textContent = T("more", items.length - shown.length);
  } else {
    more.hidden = true;
  }
  updateSelInfo(items);
}

/* ---------- Sizes ---------- */

function loadSizes() {
  if (state.sizing) return;
  var items = visibleItems().filter(function (it) { return it.size === undefined; }).slice(0, SIZE_MAX);
  if (!items.length) return toast(T("sizesDone"));
  state.sizing = true;
  var total = items.length, done = 0, idx = 0, active = 0, LIMIT = 4;
  var prog = $("sizeProg"), bar = $("sizeProgBar");
  prog.hidden = false;
  bar.style.width = "0%";
  $("sizesBtn").textContent = T("sizesRun", 0, total);

  function finish() {
    state.sizing = false;
    prog.hidden = true;
    $("sizesBtn").textContent = T("sizes");
    if (state.sort === "size") renderList();
  }
  function run(it) {
    active++;
    fetch("/api/info?url=" + encodeURIComponent(it.raw) + apiQs(false)).then(readJson).then(function (d) {
      it.size = d.size === null || d.size === undefined ? -1 : d.size;
    }).catch(function () {
      it.size = -1;
    }).then(function () {
      active--;
      done++;
      if (it.sizeEl) it.sizeEl.textContent = sizeText(it);
      bar.style.width = Math.round((done / total) * 100) + "%";
      $("sizesBtn").textContent = T("sizesRun", done, total);
      if (done === total) finish(); else pump();
    });
  }
  function pump() {
    while (active < LIMIT && idx < total) run(items[idx++]);
  }
  pump();
}

/* ---------- Export ---------- */

function bulkTargets() {
  var vis = visibleItems();
  var sel = vis.filter(function (it) { return state.selected[it.raw]; });
  return sel.length ? sel : vis;
}

function linkFor(it) { return state.out === "direct" ? proxyUrl(it.raw) : it.raw; }

function uniqueNames(items) {
  var used = {};
  return items.map(function (it) {
    var n = safeName(it.name), base = n, ext = "", dot = n.lastIndexOf(".");
    if (dot > 0) { base = n.slice(0, dot); ext = n.slice(dot); }
    var k = 1;
    while (used[n.toLowerCase()]) { k++; n = base + "_" + k + ext; }
    used[n.toLowerCase()] = true;
    return n;
  });
}

function csvCell(v) {
  var s = String(v === null || v === undefined ? "" : v);
  var c = s.charAt(0);
  if (c === "=" || c === "+" || c === "-" || c === "@") s = SQ + s;
  return DQ + s.split(DQ).join(DQ + DQ) + DQ;
}

function buildExport(kind, items) {
  var names = uniqueNames(items), lines = [];
  if (kind === "aria") {
    items.forEach(function (it, i) { lines.push(linkFor(it)); lines.push("  out=" + names[i]); });
    return { text: lines.join(NL), file: "aria2-input.txt", mime: "text/plain", bom: false };
  }
  if (kind === "wget") {
    lines.push("#!/bin/sh");
    items.forEach(function (it, i) { lines.push("wget -c -O " + shq(names[i]) + " " + shq(linkFor(it))); });
    return { text: lines.join(NL) + NL, file: "download-wget.sh", mime: "text/x-shellscript", bom: false };
  }
  if (kind === "curl") {
    lines.push("#!/bin/sh");
    items.forEach(function (it, i) { lines.push("curl -L -C - -o " + shq(names[i]) + " " + shq(linkFor(it))); });
    return { text: lines.join(NL) + NL, file: "download-curl.sh", mime: "text/x-shellscript", bom: false };
  }
  if (kind === "m3u") {
    lines.push("#EXTM3U");
    items.forEach(function (it, i) { lines.push("#EXTINF:-1," + names[i]); lines.push(linkFor(it)); });
    return { text: lines.join(NL) + NL, file: "playlist.m3u", mime: "audio/x-mpegurl", bom: false };
  }
  if (kind === "json") {
    var data = items.map(function (it, i) {
      return { name: names[i], ext: it.ext, size: it.size > 0 ? it.size : null, url: it.raw, direct: proxyUrl(it.raw) };
    });
    return { text: JSON.stringify(data, null, 2), file: "links.json", mime: "application/json", bom: false };
  }
  if (kind === "csv") {
    lines.push(["name", "ext", "size", "url", "direct"].map(csvCell).join(","));
    items.forEach(function (it, i) {
      lines.push([names[i], it.ext, it.size > 0 ? it.size : "", it.raw, proxyUrl(it.raw)].map(csvCell).join(","));
    });
    return { text: lines.join(CR + NL), file: "links.csv", mime: "text/csv", bom: true };
  }
  items.forEach(function (it) { lines.push(linkFor(it)); });
  return { text: lines.join(NL), file: "links.txt", mime: "text/plain", bom: true };
}

function doExport(mode) {
  var items = bulkTargets();
  if (!items.length) return toast(T("empty"));
  var out = buildExport($("fmtSel").value, items);
  if (mode === "copy") copyText(out.text);
  else downloadText(out.text, out.file, out.mime, out.bom);
}

function setOut(mode) {
  state.out = mode;
  $("outRaw").className = mode === "raw" ? "on" : "";
  $("outDirect").className = mode === "direct" ? "on" : "";
}

/* ---------- Theme, language, mode ---------- */

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(function (n) {
    n.textContent = T(n.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(function (n) {
    n.placeholder = T(n.getAttribute("data-i18n-ph"));
  });
}

function applyLang(lang) {
  state.lang = lang;
  try { localStorage.setItem(LS.lang, lang); } catch (e) {}
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  document.title = T("title");
  applyI18n();
  $("langLbl").textContent = lang.toUpperCase();
  $("lblMain").textContent = T(state.batch ? "lblBatch" : "lblUrl");
  if (state.links.length) { renderChips(); renderList(); }
}

function applyTheme(mode) {
  try { localStorage.setItem(LS.theme, mode); } catch (e) {}
  if (mode === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", mode);
}

function toggleTheme() {
  var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var current = document.documentElement.getAttribute("data-theme") || (dark ? "dark" : "light");
  applyTheme(current === "dark" ? "light" : "dark");
}

function setBatch(on) {
  state.batch = on;
  $("singleRow").hidden = on;
  $("batchInput").hidden = !on;
  $("btnScan").hidden = on;
  $("btnInfo").hidden = on;
  $("btnProxy").setAttribute("data-i18n", on ? "btnLoad" : "btnProxy");
  $("batchToggle").setAttribute("data-i18n", on ? "batchOff" : "batchOn");
  $("lblMain").setAttribute("for", on ? "batchInput" : "urlInput");
  $("lblMain").textContent = T(on ? "lblBatch" : "lblUrl");
  applyI18n();
  document.querySelector(".actions").style.gridTemplateColumns = on ? "1fr" : "";
}

function launchFromParams() {
  var p;
  try { p = new URLSearchParams(location.search); } catch (e) { return; }
  var q = p.get("q") || p.get("q2") || "";
  var u = extractUrl(q) || normalizeInput(q);
  if (!u) return;
  $("urlInput").value = u;
  var go = p.get("go");
  try { window.history.replaceState(null, "", location.pathname); } catch (e) {}
  if (go === "scan") actScan();
  else if (go === "info") actInfo();
  else if (go === "direct") actProxy();
}

/* ---------- Init ---------- */

function init() {
  var savedLang = null, savedTheme = null;
  try {
    savedLang = localStorage.getItem(LS.lang);
    savedTheme = localStorage.getItem(LS.theme);
  } catch (e) {}
  loadOpts();
  applyTheme(savedTheme || "auto");
  applyLang(savedLang === "en" ? "en" : "fa");
  renderHistory();

  $("btnProxy").onclick = actProxy;
  $("btnScan").onclick = actScan;
  $("btnInfo").onclick = actInfo;
  $("pasteBtn").onclick = function () {
    if (!navigator.clipboard || !navigator.clipboard.readText) return toast(T("pasteFail"));
    navigator.clipboard.readText().then(function (t) { $("urlInput").value = t.trim(); }, function () { toast(T("pasteFail")); });
  };
  $("clearBtn").onclick = function () { $("urlInput").value = ""; $("urlInput").focus(); };
  $("clearHist").onclick = function () {
    try { localStorage.removeItem(LS.hist); } catch (e) {}
    renderHistory();
    toast(T("histCleared"));
  };
  $("batchToggle").onclick = function () { setBatch(!state.batch); };
  $("langBtn").onclick = function () { applyLang(state.lang === "fa" ? "en" : "fa"); };
  $("themeBtn").onclick = toggleTheme;
  ["optRef", "optDeep", "optImg"].forEach(function (id) {
    $(id).addEventListener("change", saveOpts);
  });

  $("urlInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") actProxy();
  });
  document.addEventListener("keydown", function (e) {
    var tag = e.target && e.target.tagName;
    if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
      e.preventDefault();
      (state.batch ? $("batchInput") : $("urlInput")).focus();
    }
  });

  $("searchInput").oninput = function () {
    state.text = this.value.trim();
    state.limit = PAGE_STEP;
    renderList();
  };
  $("sortSel").onchange = function () { state.sort = this.value; renderList(); };
  $("selectAll").onchange = function () {
    var on = this.checked;
    visibleItems().forEach(function (it) {
      if (on) state.selected[it.raw] = true;
      else delete state.selected[it.raw];
    });
    renderList();
  };
  $("moreBtn").onclick = function () { state.limit += PAGE_STEP; renderList(); };
  $("sizesBtn").onclick = loadSizes;
  $("outRaw").onclick = function () { setOut("raw"); };
  $("outDirect").onclick = function () { setOut("direct"); };
  $("expCopy").onclick = function () { doExport("copy"); };
  $("expDl").onclick = function () { doExport("download"); };
  $("playerClose").onclick = closePlayer;
  $("player").addEventListener("close", function () { $("playerBody").textContent = ""; });

  launchFromParams();
}

init();
</script>
</body>
</html>`;

const MANIFEST = JSON.stringify({
    name: CONFIG.title_fa,
    short_name: "Downloader",
    description: "Direct links, file grabber and download-manager exports",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0f1115",
    theme_color: CONFIG.color,
    lang: "fa",
    dir: "rtl",
    icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ],
    share_target: { action: "/", method: "GET", params: { title: "t", text: "q2", url: "q" } }
});

// Logo: an "M" over a download tray line (SVG) + pre-rendered, palette-quantised PNG versions.
const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a59"/><stop offset="1" stop-color="#c0392b"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/><path d="M132 324V128l124 126 124-126v196" fill="none" stroke="#fff" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/><path d="M148 392h216" stroke="#fff" stroke-opacity=".6" stroke-width="30" stroke-linecap="round"/></svg>';

const ICON_PNG_B64 = {
    "/icon-192.png": "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",
    "/icon-512.png": "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",
    "/icon-maskable-512.png": "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",
    "/apple-touch-icon.png": "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",
    "/favicon.ico": "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAkFBMVEXlX0bpZEfGQC73xrz65+S/QDD/AADEPi7EQC7GQC/6dVbjXUX/gIDsZkvPSDbZUz3iXET+/v7dV0D2cVMAAADvt67429XaZ1bphnTFPi7ropXom4/64dzsraTgWELlemfbU0D/dVP6dlb5dFXEPC3FPi7IQS3GQDDbVD3aVD3bVUDbdmfiXUXkXUTlYEb5c1QiFtncAAAAMHRSTlOaIl7//xACvjiYccgC//7+/v/+/gD//////P////9L/xURSqNMlRnHisNS/ylszMwq/pA+AAABrElEQVR42pWW15aDIBRFb8r0EQUSxZiJKZPe/v/vBkSKiA6eBx9077MuLJcCsyqjz92TVom8ecD9JkkQl82O0j48SkRgpIQtpf1CUmclhS0N6VcGzDah/UlCyIgLu+B+QgjMYDOgn5B4DdsB/Vy4AAzpj+MTPC2c+flS98fxGUx/gXFK23yU4imtcR4w/ROM8ZK2+CW/PdG8LaS4aRgep5oXggIqAS89fK+gDJvHaawDZuRakIZarysgjyCMJm8E5AoSSSOLTy0BtYQ500bNl3MjII8QKaPmGTEC8grKUHysBdQhJAzrML7/P7WAOgS+WmZ4DtYC6hCq/WSmXwmoV5AGk69DJaB/hIRN05IMEcz7HyZYfJBg891CogUSJCSVsHD7Y7TwCxwUT0q3H6GM3y5agtzLBW3182TFFbmC+32zeSfg/b5185Wg8ahYmBQ6xBFMP5t7c20K1jzUL2QN4WHPn4kVZU4aEx0Bgvenygfcg/dHJB/DaEh/nr/D99eA/vztFWa3AXx+ED/2VTj/K48Oq8D5BS8PJ2sI6d+/6NMMVy6ncx9/3I8PkvwDs0GSHOPqJ1MAAAAASUVORK5CYII="
};
const ICON_CACHE = {};

function iconResponse(path) {
    const b64 = ICON_PNG_B64[path];
    if (!b64) return null;
    if (!ICON_CACHE[path]) ICON_CACHE[path] = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return new Response(ICON_CACHE[path], { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=604800" } });
}

/* ================= SERVER ================= */

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function parseAllowed(env) {
    const raw = (env && env.ALLOWED_HOSTS) || "";
    return String(raw).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function hostAllowed(host, list) {
    if (!list.length) return true;
    return list.some((a) => host === a || host.endsWith("." + a));
}

// Blocks private / local targets so the proxy cannot be used to reach internal networks.
const IPV4_LITERAL = /^\d{1,3}(\.\d{1,3}){3}$/;
const PRIVATE_IPV4 = /^(0\.|10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|192\.0\.0\.|198\.1[89]\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|2(2[4-9]|[3-5]\d)\.)/;

function isSafeUrl(u, ctx) {
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (u.username || u.password) return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return false;
    if (h.startsWith("[")) return false; // IPv6 literals are not supported
    if (!h.includes(".")) return false;
    if (IPV4_LITERAL.test(h) && PRIVATE_IPV4.test(h)) return false;
    if (ctx) {
        if (h === ctx.self) return false;
        if (!hostAllowed(h, ctx.allowed)) return false;
    }
    return true;
}

function normalizeTarget(raw, ctx) {
    if (!raw || !raw.trim()) throw new HttpError(400, "آدرس وارد نشده است");
    let u;
    try { u = new URL(raw.trim()); } catch (e) { throw new HttpError(400, "آدرس نامعتبر است"); }
    if (!isSafeUrl(u, ctx)) throw new HttpError(403, "این آدرس مجاز نیست");
    return u;
}

// Follows redirects manually so every hop is checked against isSafeUrl.
async function fetchSafe(startUrl, init, ctx, timeoutMs = 0) {
    let current = startUrl;
    for (let hop = 0; hop <= CONFIG.maxRedirects; hop++) {
        if (!isSafeUrl(current, ctx)) throw new HttpError(403, "مقصد ریدایرکت مجاز نیست");
        const opts = { ...init, redirect: "manual" };
        if (timeoutMs) opts.signal = AbortSignal.timeout(timeoutMs);
        const res = await fetch(current.href, opts);
        const loc = res.headers.get("Location");
        if (res.status >= 300 && res.status < 400 && loc) {
            if (res.body) res.body.cancel().catch(() => {});
            try { current = new URL(loc, current); } catch (e) { throw new HttpError(502, "ریدایرکت نامعتبر از سرور مبدأ"); }
            continue;
        }
        return { res, url: current };
    }
    throw new HttpError(508, "تعداد ریدایرکت بیش از حد مجاز است");
}

function refererFor(target, refParam) {
    if (refParam) {
        try {
            const r = new URL(refParam);
            if (r.protocol === "http:" || r.protocol === "https:") return r.href;
        } catch (e) { /* ignore invalid custom referer */ }
    }
    return target.origin + "/";
}

// Many hosts reject hotlinking: try the site's own origin first, then Google, then no Referer.
async function fetchWithFallback(target, init, ctx, timeoutMs, refParam) {
    const refs = [];
    for (const r of [refererFor(target, refParam), "https://www.google.com/", ""]) {
        if (!refs.includes(r)) refs.push(r);
    }
    let last = null;
    for (let i = 0; i < refs.length; i++) {
        const headers = new Headers(init.headers);
        if (refs[i]) headers.set("Referer", refs[i]); else headers.delete("Referer");
        const out = await fetchSafe(target, { ...init, headers }, ctx, timeoutMs);
        if (out.res.status !== 403 || i === refs.length - 1) return out;
        if (out.res.body) out.res.body.cancel().catch(() => {});
        last = out;
    }
    return last;
}

function baseHeaders() {
    return new Headers({
        "User-Agent": UA,
        "Accept": "*/*",
        "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "identity"
    });
}

function pageHeaders() {
    const h = baseHeaders();
    h.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
    return h;
}

function safeDecode(s) {
    try { return decodeURIComponent(s); } catch (e) { return s || ""; }
}

// HTMLRewriter hands back attribute values with HTML entities still encoded (e.g. "&amp;").
const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decodeEntities(s) {
    return String(s).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (m, e) => {
        const k = e.toLowerCase();
        if (k[0] !== "#") return NAMED_ENTITIES[k];
        const code = k[1] === "x" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
        try { return String.fromCodePoint(code); } catch (err) { return m; }
    });
}

function sanitizeName(s) {
    return String(s || "").replace(/[\\\/:*?"<>|\r\n\u0000-\u001f]+/g, "_").replace(/^\.+/, "").slice(0, 200);
}

function extOf(pathname) {
    const m = /\.([a-z0-9]{1,8})$/i.exec(pathname || "");
    return m ? m[1].toLowerCase() : "";
}

function pickFilename(cd, url, override) {
    let name = sanitizeName(override);
    if (!name && cd) {
        const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(cd);
        const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(cd);
        if (star) name = sanitizeName(safeDecode(star[1].trim()));
        else if (plain) name = sanitizeName(plain[1].trim());
    }
    if (!name) name = sanitizeName(safeDecode(url.pathname.split("/").pop()));
    return name || "download";
}

function contentDisposition(name, disp) {
    const enc = encodeURIComponent(name).replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
    const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
    return disp + '; filename="' + ascii + "\"; filename*=UTF-8''" + enc;
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
        }
    });
}

// --- Proxy core: streams the file, supports Range (resume / multi-connection downloaders / seeking) ---
async function handleProxy(request, params, ctx) {
    if (request.method !== "GET" && request.method !== "HEAD") throw new HttpError(405, "Method not allowed");
    const target = normalizeTarget(params.get("url"), ctx);
    const wantInline = params.get("inline") === "1";

    const headers = baseHeaders();
    for (const k of ["Range", "If-Range", "If-None-Match", "If-Modified-Since"]) {
        const v = request.headers.get(k);
        if (v) headers.set(k, v);
    }

    const { res: up, url } = await fetchWithFallback(target, { method: request.method, headers }, ctx, 0, params.get("ref"));
    if (up.status >= 400 && up.status !== 416) {
        if (up.body) up.body.cancel().catch(() => {});
        return new Response("خطا از سرور مبدأ: " + up.status, {
            status: up.status,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
        });
    }

    let type = up.headers.get("Content-Type") || "application/octet-stream";
    const ext = extOf(url.pathname);
    if (wantInline && /octet-stream|binary/i.test(type) && MIME_BY_EXT[ext]) type = MIME_BY_EXT[ext];

    // Never serve active content (HTML/SVG/JS/JSON) from our origin as a page; force download instead.
    const risky = RISKY_TYPE.test(type);
    const inline = wantInline && !risky && INLINE_OK.test(type);
    if (risky) type = "application/octet-stream";

    const h = new Headers();
    h.set("Content-Type", type);
    h.set("Content-Disposition", contentDisposition(pickFilename(up.headers.get("Content-Disposition"), url, params.get("name")), inline ? "inline" : "attachment"));

    const enc = (up.headers.get("Content-Encoding") || "").toLowerCase();
    const encoded = enc && enc !== "identity";
    const passthrough = ["Accept-Ranges", "ETag", "Last-Modified"];
    if (!encoded) passthrough.push("Content-Length", "Content-Range");
    for (const k of passthrough) {
        const v = up.headers.get(k);
        if (v) h.set(k, v);
    }
    h.set("Access-Control-Allow-Origin", "*");
    h.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges, Content-Disposition");
    h.set("X-Content-Type-Options", "nosniff");
    h.set("Content-Security-Policy", "sandbox; default-src 'none'");
    h.set("X-Robots-Tag", "noindex, nofollow");

    return new Response(request.method === "HEAD" ? null : up.body, { status: up.status, headers: h });
}

// --- Link extraction: HTMLRewriter handles relative URLs, <base>, and HTML entities correctly ---
async function scanPage(pageUrl, ctx, refParam, wantImg) {
    const { res, url } = await fetchWithFallback(pageUrl, { headers: pageHeaders() }, ctx, CONFIG.scanTimeoutMs, refParam);
    if (!res.ok) {
        if (res.body) res.body.cancel().catch(() => {});
        throw new HttpError(res.status, "دسترسی به صفحه ممکن نیست (کد " + res.status + ")");
    }
    const type = res.headers.get("Content-Type") || "";
    if (!/html|xml/i.test(type)) {
        if (res.body) res.body.cancel().catch(() => {});
        return { isFile: true, url: url.href, files: [], pages: [], title: "" };
    }

    const files = new Set();
    const pages = new Set();
    let base = url.href;
    let title = "";
    let sbuf = "";

    const isFileUrl = (abs) => FILE_EXT.test(abs.pathname) || (wantImg && IMAGE_EXT.test(abs.pathname));

    const resolve = (value, decode = true) => {
        if (!value) return null;
        let abs;
        try { abs = new URL((decode ? decodeEntities(value) : value).trim(), base); } catch (e) { return null; }
        if (!isSafeUrl(abs, ctx)) return null;
        abs.hash = "";
        return abs;
    };
    const addFile = (value, force = false, decode = true) => {
        if (files.size >= CONFIG.maxLinks) return;
        const abs = resolve(value, decode);
        if (abs && (force || isFileUrl(abs))) files.add(abs.href);
    };
    const addPage = (value) => {
        if (pages.size >= 200) return;
        const abs = resolve(value);
        if (abs && abs.origin === url.origin && !isFileUrl(abs) && abs.href !== url.href) pages.add(abs.href);
    };
    const scanText = (text) => {
        const cleaned = text.replace(/\\\//g, "/").replace(/\\u0026/g, "&");
        const found = cleaned.match(/https?:\/\/[^\s"'<>\\()]+/gi);
        if (!found) return;
        for (const candidate of found) addFile(candidate, false, false); // script text is not HTML-escaped
    };

    const rw = new HTMLRewriter()
        .on("base[href]", { element(el) { try { base = new URL(decodeEntities(el.getAttribute("href")), url.href).href; } catch (e) { /* ignore */ } } })
        .on("title", { text(t) { if (title.length < 300) title += t.text; } })
        .on("a[href]", {
            element(el) {
                const href = el.getAttribute("href");
                addFile(href, el.hasAttribute("download"));
                addPage(href);
            }
        })
        .on("link[href], area[href]", { element(el) { addFile(el.getAttribute("href")); } })
        .on("video[src], audio[src], source[src], embed[src]", { element(el) { addFile(el.getAttribute("src")); } })
        .on("meta[property='og:video'], meta[property='og:video:url'], meta[property='og:video:secure_url'], meta[property='og:audio'], meta[name='twitter:player:stream']", {
            element(el) { addFile(el.getAttribute("content"), true); }
        })
        .on("script", {
            text(t) {
                if (sbuf.length < CONFIG.maxScriptChars) sbuf += t.text;
                if (t.lastInTextNode) {
                    scanText(sbuf);
                    sbuf = "";
                }
            }
        });
    if (wantImg) rw.on("img[src]", { element(el) { addFile(el.getAttribute("src")); } });

    await rw.transform(res).arrayBuffer();
    return { isFile: false, url: url.href, files: [...files], pages: [...pages], title: title.replace(/\s+/g, " ").trim().slice(0, 200) };
}

async function handleExtract(params, ctx) {
    const start = normalizeTarget(params.get("url"), ctx);
    const ref = params.get("ref") || "";
    const deep = params.get("deep") === "1";
    const wantImg = params.get("img") === "1";

    const first = await scanPage(start, ctx, ref, wantImg);
    if (first.isFile) return { links: [], isFile: true, url: first.url };

    const found = new Set(first.files);
    let scanned = 1;

    if (deep && first.pages.length) {
        const queue = first.pages
            .sort((a, b) => (b.endsWith("/") ? 1 : 0) - (a.endsWith("/") ? 1 : 0))
            .slice(0, CONFIG.deepMaxPages);
        const results = await Promise.allSettled(queue.map((p) => scanPage(new URL(p), ctx, ref, wantImg)));
        for (const r of results) {
            if (r.status === "fulfilled" && !r.value.isFile) {
                scanned++;
                for (const f of r.value.files) found.add(f);
            }
        }
    }

    const all = [...found];
    return { links: all.slice(0, CONFIG.maxLinks), isFile: false, title: first.title, pages: scanned, truncated: all.length > CONFIG.maxLinks, url: first.url };
}

// --- File inspector: size, name, type and resume support via a 1-byte ranged request ---
async function handleInfo(params, ctx) {
    const target = normalizeTarget(params.get("url"), ctx);
    const headers = baseHeaders();
    headers.set("Range", "bytes=0-0");

    const { res, url } = await fetchWithFallback(target, { headers }, ctx, CONFIG.infoTimeoutMs, params.get("ref"));
    if (res.body) res.body.cancel().catch(() => {});
    if (res.status >= 400 && res.status !== 416) throw new HttpError(res.status, "سرور مبدأ پاسخ نداد (کد " + res.status + ")");

    const status = res.status;
    const cr = res.headers.get("Content-Range");
    const m = cr ? /\/(\d+)\s*$/.exec(cr) : null;
    const size = status === 206
        ? (m ? Number(m[1]) : null)
        : (Number(res.headers.get("Content-Length")) || null);

    return {
        url: url.href,
        filename: pickFilename(res.headers.get("Content-Disposition"), url, ""),
        size,
        type: res.headers.get("Content-Type") || "",
        resumable: status === 206 || /bytes/i.test(res.headers.get("Accept-Ranges") || ""),
        lastModified: res.headers.get("Last-Modified") || ""
    };
}

const PAGE_HEADERS = {
    "Content-Type": "text/html; charset=UTF-8",
    "Content-Security-Policy": CSP,
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
    "Cache-Control": "no-cache"
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const ctx = { self: url.hostname.toLowerCase(), allowed: parseAllowed(env) };

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                    "Access-Control-Allow-Headers": "Range, If-Range, If-None-Match, If-Modified-Since",
                    "Access-Control-Max-Age": "86400"
                }
            });
        }

        try {
            if (url.pathname === "/api/extract") return json(await handleExtract(url.searchParams, ctx));
            if (url.pathname === "/api/info") return json(await handleInfo(url.searchParams, ctx));
            if (url.pathname === "/manifest.webmanifest") {
                return new Response(MANIFEST, { headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
            }
            if (url.pathname === "/icon.svg") {
                return new Response(ICON_SVG, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=604800", "Content-Security-Policy": "sandbox; default-src 'none'" } });
            }
            if (ICON_PNG_B64[url.pathname]) return iconResponse(url.pathname);
            if (url.pathname === "/dl" || (url.pathname === "/" && url.searchParams.has("url"))) {
                return await handleProxy(request, url.searchParams, ctx);
            }
            if (url.pathname === "/") return new Response(HTML_PAGE, { headers: PAGE_HEADERS });
            return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        } catch (e) {
            const status = e instanceof HttpError ? e.status : 502;
            return json({ error: e.message || "خطای ناشناخته" }, status);
        }
    }
};

/**
 * ULTIMATE DOWNLOADER - V7
 *
 * UI:      light/dark/auto theme, FA/EN, batch mode, history, installable (PWA) + share target,
 *          category/format filters, include/exclude search, sorting, selection, lazy file sizes,
 *          media/image preview player, export (TXT, aria2, wget, curl, M3U, JSON, CSV).
 * Server:  resumable proxy (Range), inline media streaming, custom Referer / file name,
 *          automatic Referer fallback on 403, redirect-checked fetching (SSRF guard),
 *          HTMLRewriter link extraction (relative URLs, <base>, og:video, JSON in scripts,
 *          GitHub release expanded_assets fragments & release anchor tags),
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

const FILE_EXTS = ["exe", "msi", "zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz", "apk", "xapk", "ipa", "dmg", "pkg", "deb", "rpm", "appimage", "iso", "img", "bin", "jar", "torrent", "mkv", "mp4", "avi", "mov", "webm", "m4v", "wmv", "flv", "mp3", "wav", "flac", "m4a", "ogg", "opus", "aac", "m3u8", "mpd", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "txt", "epub", "mobi", "srt", "ass", "ttf", "otf", "sig", "asc", "gpg", "pgp", "sha256", "sha512", "md5"];
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "bmp", "psd"];
const FILE_EXT = new RegExp("\\.(" + FILE_EXTS.join("|") + ")$", "i");
const IMAGE_EXT = new RegExp("\\.(" + IMAGE_EXTS.join("|") + ")$", "i");
const GH_ASSET = /^\/[^/]+\/[^/]+\/(?:releases\/download\/|archive\/refs\/)/i;

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
  .brand img { width:30px; height:30px; border-radius:7px; flex-shrink:0; }
  .brand span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .hero .logo { display:block; width:76px; height:76px; margin:0 auto 12px; border-radius:17px; box-shadow:0 12px 30px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.04); }
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
    .hero .logo { width:64px; height:64px; border-radius:14px; }
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

// Logo: a 3D "M" whose centre stroke becomes a download arrow, sitting on a tray (SVG),
// plus pre-rendered, palette-quantised PNG versions for the manifest, iOS and favicon.
const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none"><defs><radialGradient id="bg" cx="256" cy="240" r="290" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#1E2330"/><stop offset="65%" stop-color="#11141C"/><stop offset="100%" stop-color="#090B10"/></radialGradient><radialGradient id="crimsonGlow" cx="256" cy="110" r="240" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#E74C3C" stop-opacity="0.38"/><stop offset="100%" stop-color="#E74C3C" stop-opacity="0"/></radialGradient><radialGradient id="cyanGlow" cx="256" cy="430" r="200" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#06B6D4" stop-opacity="0.28"/><stop offset="100%" stop-color="#06B6D4" stop-opacity="0"/></radialGradient><linearGradient id="rim" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#FF7A59" stop-opacity="0.8"/><stop offset="50%" stop-color="#2A2F3A" stop-opacity="0.5"/><stop offset="100%" stop-color="#06B6D4" stop-opacity="0.7"/></linearGradient><linearGradient id="pillarBlue" x1="100" y1="120" x2="170" y2="350" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#38BDF8"/><stop offset="50%" stop-color="#0284C7"/><stop offset="100%" stop-color="#1E3A8A"/></linearGradient><linearGradient id="innerWall" x1="150" y1="150" x2="150" y2="340" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#0369A1"/><stop offset="100%" stop-color="#0F172A"/></linearGradient><linearGradient id="fireArrow" x1="256" y1="96" x2="256" y2="355" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#FDE047"/><stop offset="35%" stop-color="#FF7A59"/><stop offset="75%" stop-color="#E74C3C"/><stop offset="100%" stop-color="#C0392B"/></linearGradient><linearGradient id="trayGrad" x1="104" y1="395" x2="408" y2="395" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#E74C3C"/><stop offset="50%" stop-color="#FF8A65"/><stop offset="100%" stop-color="#22D3EE"/></linearGradient><filter id="sh" x="-15%" y="-15%" width="130%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity="0.6"/></filter></defs><rect x="12" y="12" width="488" height="488" rx="114" fill="url(#bg)" stroke="url(#rim)" stroke-width="5"/><rect x="12" y="12" width="488" height="488" rx="114" fill="url(#crimsonGlow)"/><rect x="12" y="12" width="488" height="488" rx="114" fill="url(#cyanGlow)"/><g opacity="0.22"><circle cx="256" cy="236" r="175" stroke="#FF7A59" stroke-width="1.5" stroke-dasharray="8 10"/><circle cx="256" cy="236" r="130" stroke="#38BDF8" stroke-width="1.5"/><path d="M20 330 C 150 240, 360 410, 492 290" stroke="#E74C3C" stroke-width="2.5"/><path d="M20 170 C 170 260, 340 80, 492 195" stroke="#38BDF8" stroke-width="2" stroke-dasharray="6 8"/></g><rect x="58" y="190" width="28" height="10" rx="5" fill="#FF7A59" opacity="0.85"/><rect x="46" y="214" width="40" height="10" rx="5" fill="#FACC15" opacity="0.9"/><rect x="64" y="238" width="22" height="10" rx="5" fill="#38BDF8" opacity="0.85"/><rect x="426" y="190" width="28" height="10" rx="5" fill="#38BDF8" opacity="0.85"/><rect x="426" y="214" width="40" height="10" rx="5" fill="#FF7A59" opacity="0.9"/><rect x="426" y="238" width="22" height="10" rx="5" fill="#FACC15" opacity="0.85"/><g filter="url(#sh)"><path d="M148 134 L184 166 L168 320 L126 320 Z" fill="url(#innerWall)"/><path d="M364 134 L328 166 L344 320 L386 320 Z" fill="url(#innerWall)"/><path d="M100 308 L124 138 C127 118 150 110 166 124 L172 130 L146 316 C143 332 126 340 112 332 C102 326 98 318 100 308 Z" fill="url(#pillarBlue)"/><path d="M412 308 L388 138 C385 118 362 110 346 124 L340 130 L366 316 C369 332 386 340 400 332 C410 326 414 318 412 308 Z" fill="url(#pillarBlue)"/><path d="M136 122 C148 110 168 112 180 126 L256 210 L332 126 C344 112 364 110 376 122 C386 132 386 150 374 164 L296 250 L296 270 L330 270 C342 270 348 284 339 293 L269 360 C262 367 250 367 243 360 L173 293 C164 284 170 270 182 270 L216 270 L216 250 L138 164 C126 150 126 132 136 122 Z" fill="url(#fireArrow)"/><path d="M256 226 L296 282 H272 V328 L256 344 L240 328 V282 H216 L256 226 Z" fill="#FFF" fill-opacity="0.22"/></g><g filter="url(#sh)"><path d="M112 374 V392 C112 407 125 420 140 420 H372 C387 420 400 407 400 392 V374" stroke="url(#trayGrad)" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/><circle cx="152" cy="420" r="6" fill="#FFF"/><circle cx="360" cy="420" r="6" fill="#22D3EE"/></g></svg>';

const ICON_PNG_B64 = {
    "/icon-192.png": "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",
    "/icon-512.png": "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",
    "/icon-maskable-512.png": "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",
    "/apple-touch-icon.png": "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",
    "/favicon.ico": "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"
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
async function scanPage(pageUrl, ctx, refParam, wantImg, followFragments = true) {
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
    const fragments = new Set();
    let base = url.href;
    let title = "";
    let sbuf = "";

    const isGhAsset = (abs) => (abs.hostname === "github.com" || abs.hostname === "www.github.com") && GH_ASSET.test(abs.pathname);
    const isFileUrl = (abs) => FILE_EXT.test(abs.pathname) || (wantImg && IMAGE_EXT.test(abs.pathname)) || isGhAsset(abs);

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
        .on("include-fragment", {
            element(el) {
                if (!followFragments || fragments.size >= 20) return;
                const src = el.getAttribute("src") || el.getAttribute("data-deferred-src") || el.getAttribute("data-src");
                if (src && /\/releases\/expanded_assets\//i.test(src)) {
                    const abs = resolve(src);
                    if (abs && abs.origin === url.origin) fragments.add(abs.href);
                }
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

    if (followFragments && fragments.size) {
        const sub = await Promise.allSettled([...fragments].map((f) => scanPage(new URL(f), ctx, refParam, wantImg, false)));
        for (const r of sub) {
            if (r.status === "fulfilled" && !r.value.isFile) {
                for (const f of r.value.files) {
                    if (files.size < CONFIG.maxLinks) files.add(f);
                }
            }
        }
    }

    return { isFile: false, url: url.href, files: [...files], pages: [...pages], title: title.replace(/\s+/g, " ").trim().slice(0, 200) };
}

async function handleExtract(params, ctx) {
    const start = normalizeTarget(params.get("url"), ctx);
    const ref = params.get("ref") || "";
    const deep = params.get("deep") === "1";
    const wantImg = params.get("img") === "1";

    let first;
    const ghRel = /^(?:www\.)?github\.com$/i.test(start.hostname) && /^\/([^/]+\/[^/]+)\/releases\/?$/i.exec(start.pathname);
    const ghTag = ghRel && start.hash.length > 1 ? safeDecode(start.hash.slice(1).replace(/^release-/i, "")).trim() : "";
    if (ghTag) {
        const tagUrl = new URL(start.href);
        tagUrl.pathname = "/" + ghRel[1] + "/releases/tag/" + ghTag.split("/").map(encodeURIComponent).join("/");
        tagUrl.hash = "";
        try {
            first = await scanPage(tagUrl, ctx, ref, wantImg);
        } catch (e) {
            first = await scanPage(start, ctx, ref, wantImg);
        }
    } else {
        first = await scanPage(start, ctx, ref, wantImg);
    }
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

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
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="${CONFIG.color}">
<meta name="robots" content="noindex, nofollow">
<title>${CONFIG.title_fa}</title>
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
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
  body { font-family:'Vazirmatn', system-ui, sans-serif; background:var(--bg); color:var(--text); min-height:100vh; line-height:1.7; transition:background .3s, color .3s; }
  button, input, select, textarea { font-family:inherit; font-size:1rem; color:inherit; }
  button { cursor:pointer; }
  button:active { transform:scale(.98); }
  :focus-visible { outline:2px solid var(--primary); outline-offset:2px; }

  header { position:sticky; top:0; z-index:10; display:flex; align-items:center; justify-content:space-between; height:60px; padding:0 20px; background:color-mix(in srgb, var(--card) 85%, transparent); backdrop-filter:blur(10px); border-bottom:1px solid var(--border); }
  .brand { font-weight:700; color:var(--primary); font-size:1.1rem; }
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
  .foot code { direction:ltr; unicode-bidi:isolate; background:var(--soft); padding:1px 6px; border-radius:6px; }

  #toastBox { position:fixed; bottom:24px; left:50%; transform:translate(-50%, 120px); background:var(--text); color:var(--bg); padding:10px 18px; border-radius:999px; font-weight:600; transition:transform .3s; z-index:50; pointer-events:none; max-width:92vw; text-align:center; }
  #toastBox.show { transform:translate(-50%, 0); }

  @media (max-width:640px) {
    .actions { grid-template-columns:1fr; }
    .adv-grid { grid-template-columns:1fr; }
    .toolbar { flex-direction:column; }
    .item { flex-wrap:wrap; }
    .acts { width:100%; justify-content:flex-end; }
    .kv { grid-template-columns:1fr; }
    .cmds { margin-inline-start:0; }
  }
</style>
</head>
<body>
<header>
  <div class="brand">🎯 <span data-i18n="title"></span></div>
  <div class="controls">
    <button class="ibtn" id="langBtn" type="button">🌐 <span id="langLbl">FA</span></button>
    <button class="ibtn" id="themeBtn" type="button" title="Theme">🌓</button>
  </div>
</header>

<main class="wrap">
  <section class="hero">
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
      <div class="muted" data-i18n="searchHint"></div>
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
    searchHint: "چند کلمه = همه باید باشند. با خط تیره حذف می‌کند، مثلاً: 1080 -sample",
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
    searchHint: "Several words = all must match. A leading dash excludes, e.g.: 1080 -sample",
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
    start_url: "/",
    display: "standalone",
    background_color: "#0f1115",
    theme_color: CONFIG.color,
    lang: "fa",
    dir: "rtl",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
    share_target: { action: "/", method: "GET", params: { title: "t", text: "q2", url: "q" } }
});

const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#e74c3c"/><path d="M256 112v190m0 0-76-76m76 76 76-76M132 380h248" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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
                return new Response(ICON_SVG, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400", "Content-Security-Policy": "sandbox; default-src 'none'" } });
            }
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

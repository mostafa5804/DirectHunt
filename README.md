<div align="center">

<img src="logo.svg" width="128" height="128" alt="DirectHunt logo">

# DirectHunt (V8)

**A self-hosted download helper, smart cloud resolver, and file grabber that runs entirely on Cloudflare Workers.**
Direct links, smart cloud/repository URL resolution, page file grabber, visual file inspector, cinema media player, offline QR generator, and download-manager exports—all in one dependency-free file.

[English](README.md) · [فارسی](README.fa.md)

![Version](https://img.shields.io/badge/version-8.0-crimson)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![Single file](https://img.shields.io/badge/single-file-blue)
![RTL](https://img.shields.io/badge/UI-FA%20%2F%20EN-red)

</div>

---

## Table of contents

- [What's new in V8](#whats-new-in-v8)
- [Features](#features)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [Export formats & bulk rename](#export-formats--bulk-rename)
- [API reference](#api-reference)
- [How it works](#how-it-works)
- [Security](#security)
- [Limitations](#limitations)
- [Development](#development)
- [Responsible use](#responsible-use)
- [License](#license)

## What's new in V8

- **Glassmorphic UI & 4 Accent Themes**: Modern frosted-glass layout (`940px` workspace) with instant switching between **Crimson**, **Ocean**, **Violet**, and **Emerald** accent palettes alongside Dark/Light/Auto modes.
- **Smart Cloud & Repository Resolver**: Automatically converts share/view links from **GitHub** (`/blob/`), **GitLab** (`/-/blob/`), **Google Drive** (`/file/d/…`), **Dropbox** (`?dl=0`), and **Pixeldrain** (`/u/…`) into direct downloadable streams.
- **Smart Quality & Tag Detection**: Automatically extracts resolution and release tags (`4K`, `1080p`, `720p`, `480p`, `x265`, `10bit`, `Dubbed`, `Sub`) from filenames and URLs, with dedicated one-click filter chips.
- **IDM (`.ef2`) & PowerShell (`.ps1`) Exports**: Native Internet Download Manager import files (including `referer` and `User-Agent` headers) and zero-dependency Windows PowerShell download scripts (`Start-BitsTransfer` with `curl.exe` fallback).
- **Bulk Rename Pattern Engine**: Rename exported files in bulk using placeholders like `{num}_{name}_{qual}.{ext}` with automatic zero-padding.
- **Cinema Media Player & External Launchers**: Upgraded in-page player with playback speed (`0.5x`–`2x`), Picture-in-Picture (`PiP`), playlist navigation (`⏮ Prev` / `⏭ Next`), and one-click streaming to **VLC**, **PotPlayer**, and **MX Player** (Android Intent).
- **Offline SVG QR Code Generator**: Built-in, zero-dependency ISO/IEC 18004 QR generator with Reed-Solomon error correction—scan any direct link with your phone without sending URLs to third-party servers.
- **Drag & Drop File/URL Zone**: Drop `.txt`, `.lst`, `.m3u` files or raw text onto the input card (or use the file picker) to load batch lists immediately.
- **Cancellable Size Loader & Total Size Counter**: Stop batch size checks at any time (`⏹ Stop`), view a visual progress bar, automatically resolve real filenames for extensionless links, and see the live total size of selected files.
- **Subrequest Budget Guard & `HEAD` Fallback**: Prevents hitting Cloudflare Workers' 50-subrequest limit during deep scans (`maxSubrequests: 42`) and falls back to `HEAD` when upstream servers reject `Range: bytes=0-0`.

---

## Features

### Three tools, one address bar

| Tool | What it does |
| --- | --- |
| **Direct link** | Wraps any file or cloud share URL in a high-speed link served by your own Worker, with full resume (`Range`) support. |
| **File grabber** | Scans a web page (and optionally up to 8 subpages) and lists every downloadable file it finds. |
| **File inspector** | Displays visual stat cards for filename, size, MIME type, resume support, cloud provider conversion, and last-modified date before you download. |

### Smart file grabber

- Finds files in `<a>`, `<video>`, `<audio>`, `<source>`, `<embed>`, `<link>`, `<area>`, lazy-loaded attributes (`data-src`, `data-href`, `srcset`), `og:video` / `og:audio` meta tags, and **URLs hidden inside inline scripts / JSON** (escaped slashes and `&` included).
- Detects file extensions both in URL paths and inside query parameters (`?file=…`, `?filename=…`, `?download=…`).
- Understands `<base href>`, relative URLs, HTML entities (`&amp;`, `&#x26;`) and strips URL fragments. Links with a `download` attribute are always included.
- **Deep scan**: crawls up to 8 pages of the same site while respecting a strict subrequest budget (`maxSubrequests: 42`) so Cloudflare's runtime limit is never exceeded.
- Optional **image mode**, so page icons and thumbnails do not clutter results by default.
- Deduplicates results and caps them at 2000 links.

### Results workspace

- **Color-coded categories** (`video`, `audio`, `archive`, `app`, `doc`, `image`, `other`), per-format chips, and **Smart Quality chips** (`4K`, `1080p`, `720p`, `480p`, `x265`, `10bit`, `Dubbed`, `Sub`) with live counts.
- **Multi-term search** with exclusions: `1080 x265 -sample` keeps items matching `1080` and `x265` while excluding `sample`.
- **Sort** by name, format, or size, with **cancellable parallel size loading** (4 concurrent requests + progress bar + automatic filename/extension discovery).
- **Live total size** calculation for selected (or visible) items in the toolbar.
- **Cinema Media Player** for MP4/WebM/MOV/MKV video, common audio formats, and images—streamed through the Worker with seeking, speed control (`0.5x`–`2x`), Picture-in-Picture (`PiP`), and Prev/Next playlist buttons.
- **External player launchers**: open streams directly in **VLC**, **PotPlayer**, or **MX Player**.
- **Per-item actions**: copy original link, copy Worker direct link, generate **offline QR code**, preview in player, download, or copy ready-made `curl`, `wget`, and `aria2` commands.

### Download & Cloud handling

- **Smart Cloud Resolver**: transparently rewrites GitHub blob links, GitLab blob links, Google Drive file links, Dropbox share links, and Pixeldrain links into direct file streams.
- Streams files straight through the Worker with full **`Range`** support: pause/resume and multi-connection download managers (IDM, aria2, FDM) work seamlessly.
- Smart **Referer strategy** for hotlink-protected hosts: tries the target's own origin first, then a search-engine Referer, then no Referer. You can also specify a custom Referer.
- Preserves accurate filenames, including **Persian / Unicode names** (RFC 5987), plus an optional custom filename or bulk rename pattern.
- Follows redirects manually and re-validates every hop against SSRF rules.

### Interface

- **Glassmorphic design** with **Light, Dark, or Auto** theme + **4 Accent Color themes** (Crimson, Ocean, Violet, Emerald) and **Persian (RTL) / English (LTR)** locales, all saved per browser.
- **Batch mode & Drag-and-Drop**: paste up to 300 URLs (one per line) or drag & drop `.txt` / `.lst` / `.m3u` files directly into the workspace.
- History autocomplete for recent URLs, keyboard shortcut `/` to focus the input.
- **Installable PWA** with Web Share Target support, allowing you to share links from mobile apps straight into DirectHunt.
- Deep links: `/?q=<url>&go=scan|info|direct`.

---

## Quick start

You need a free [Cloudflare account](https://dash.cloudflare.com/sign-up). There are no packages or build tools to install.

### Option A: Cloudflare dashboard (about 2 minutes)

1. Open **Workers & Pages → Create → Create Worker**, give it a name, and deploy the template.
2. Click **Edit code**, replace everything with the contents of [`worker-v8.js`](worker-v8.js) (or [`worker.js`](worker.js)), and click **Deploy**.
3. Open your `*.workers.dev` address.

### Option B: Wrangler CLI

```bash
git clone https://github.com/<your-username>/directhunt.git
cd directhunt
npx wrangler login
npx wrangler deploy
```

Minimal `wrangler.toml`:

```toml
name = "directhunt"
main = "worker-v8.js"
compatibility_date = "2025-01-01"

# [vars]
# ALLOWED_HOSTS = "example.com,cdn.example.org"
```

Run it locally with `npx wrangler dev`.

---

## Configuration

### Environment variable

| Variable | Example | Description |
| --- | --- | --- |
| `ALLOWED_HOSTS` | `example.com,cdn.example.org` | Optional. Restricts the proxy, inspector, and scanner to these hosts **and their subdomains**. Strongly recommended for any public deployment. |

Set it in the Cloudflare dashboard (**Settings → Variables and Secrets**) or in `wrangler.toml` under `[vars]`.

### `CONFIG` object

Edit the constants at the top of `worker-v8.js`:

| Key | Default | Description |
| --- | --- | --- |
| `title_fa` / `title_en` | – | Application title in Persian and English. |
| `color` | `#e11d48` | Default accent colour of the UI (users can also switch themes in the header). |
| `maxLinks` | `2000` | Maximum links returned by one scan. |
| `scanTimeoutMs` | `20000` | Timeout (ms) for fetching a web page. |
| `infoTimeoutMs` | `15000` | Timeout (ms) for the file inspector. |
| `maxRedirects` | `5` | Maximum redirect hops followed before aborting. |
| `deepMaxPages` | `8` | Extra same-site pages scanned in deep mode. |
| `maxSubrequests` | `42` | Subrequest safety ceiling per Worker invocation (prevents hitting Cloudflare's 50-subrequest limit). |

File types recognised by the grabber live in the `FILE_EXTS` and `IMAGE_EXTS` arrays.

---

## Usage

1. Paste a URL (a bare `example.com/file.zip` or a GitHub/Google Drive/Dropbox/Pixeldrain link works too) or **drag & drop a `.txt` file** onto the input card.
2. **Direct link**: copy, download, display an **offline QR code**, stream in **VLC / PotPlayer / MX Player**, preview in the **Cinema Player**, or copy a `curl` / `wget` / `aria2` command.
3. **File grabber**: filter by category, extension, or **quality tag** (`1080p`, `x265`, `Dubbed`, etc.), search with exclusions, fetch file sizes, and export.
4. **Advanced options** (collapsible panel under the input): custom Referer, custom filename (single link), deep scan, and include images.
5. **Batch mode**: toggle with the `📚 Batch` button or drop a `.txt` file with up to 300 URLs.

---

## Export formats & bulk rename

Exports apply to the selected items, or to everything visible if nothing is selected. First choose **Original** or **Direct** (through your Worker) links.

### Bulk Rename Pattern

Use the **Rename pattern** input in the export bar to standardize filenames across all exported scripts and download manager lists:

- `{num}` — Zero-padded sequential number (`01`, `02`, …)
- `{name}` — Original base filename without extension
- `{ext}` — File extension
- `{qual}` — Detected quality tag (`1080p`, `720p`, `4K`, etc.)

*Example:* `Episode_{num}_{qual}.{ext}` → `Episode_01_1080p.mkv`

### Supported export formats

| Format | File | Use it with |
| --- | --- | --- |
| **Plain list** | `links.txt` | Any download manager that accepts a URL list. |
| **IDM Import (`.ef2`)** | `links-idm.ef2` | **Internet Download Manager** (*Tasks → Import → From IDM export file*), complete with `referer` and `User-Agent` headers. |
| **PowerShell (`.ps1`)** | `download-ps1.ps1` | Native Windows PowerShell (`.\download-ps1.ps1`) using `Start-BitsTransfer` with automatic `curl.exe` fallback. |
| **aria2 input file** | `aria2-input.txt` | `aria2c -i aria2-input.txt -c -x16 -s16` (includes custom/renamed `out=` filenames and `referer=`). |
| **wget script** | `download-wget.sh` | `sh download-wget.sh` |
| **curl script** | `download-curl.sh` | `sh download-curl.sh` |
| **M3U playlist** | `playlist.m3u` | VLC, PotPlayer, mpv, MX Player, and IPTV players (`#EXTINF` titles included). |
| **JSON** | `links.json` | Scripts, APIs, and automation (includes `name`, `url`, `ext`, `category`, `tags`, `size`). |
| **CSV** | `links.csv` | Excel / Google Sheets (UTF-8 BOM included, formula-injection safe). |

Duplicate filenames are automatically numbered (`file (2).zip`) and shell-quoted safely.

---

## API reference

All endpoints are `GET`. Errors are returned as `{ "error": "message" }` with a matching HTTP status.

### `GET /?url=<target>`  (alias: `/dl?url=<target>`)

Streams the target file through the Worker (automatically resolving supported cloud share links first). `HEAD` is supported, and `Range`, `If-Range`, `If-None-Match`, and `If-Modified-Since` request headers are forwarded.

| Parameter | Description |
| --- | --- |
| `url` | **Required.** Absolute `http(s)` URL (URL-encoded). |
| `ref` | Custom Referer to send upstream. |
| `name` | Override the downloaded file name (sanitised). |
| `inline=1` | Serve audio, video, and common images inline for playback. Other types, and anything HTML-like, are always forced to download. |

### `GET /api/info?url=<target>[&ref=<referer>]`

```json
{
  "url": "https://raw.githubusercontent.com/user/repo/main/release.zip",
  "filename": "release.zip",
  "size": 12345678,
  "type": "application/zip",
  "resumable": true,
  "lastModified": "Wed, 01 Jan 2025 00:00:00 GMT",
  "provider": "GitHub"
}
```

`size` is `null` when the server does not disclose it. `provider` is populated when a cloud/repository link was automatically resolved.

### `GET /api/extract?url=<page>[&ref=<referer>][&deep=1][&img=1]`

```json
{
  "links": ["https://example.com/files/movie.1080p.x265.mkv"],
  "isFile": false,
  "title": "Page title",
  "pages": 1,
  "truncated": false,
  "url": "https://example.com/page"
}
```

When the target URL is itself a direct file (or resolves to a direct cloud file), the response is `{ "links": [], "isFile": true, "url": "..." }` and the UI automatically switches to the File Inspector.

### Other routes

| Route | Purpose |
| --- | --- |
| `/` | The web application UI. |
| `/manifest.webmanifest` | PWA manifest with Share Target configuration. |
| `/icon.svg`, `/icon-192.png`, `/icon-512.png`, `/icon-maskable-512.png`, `/apple-touch-icon.png`, `/favicon.ico` | Vector and raster icons embedded directly inside the Worker script (no static asset hosting required). |

---

## How it works

- **Proxy & Cloud Resolver**: Resolves known cloud patterns (`resolveCloudUrl`), then calls `fetch()` to the origin with `redirect: "manual"`, validating each hop and streaming the upstream response body so memory usage stays flat even for multi-gigabyte files.
- **Scanner**: Parses HTML on the fly with Cloudflare's streaming [`HTMLRewriter`](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/) alongside regex extraction for inline scripts/JSON, resolving candidate URLs against `<base href>` or the page URL.
- **Inspector**: Sends a one-byte `Range: bytes=0-0` probe (reading total size from `Content-Range` and cancelling the body stream immediately), with an automatic `HEAD` fallback if the upstream server rejects `Range` requests.
- **UI**: A single self-contained HTML string served by the Worker, written in vanilla JavaScript with zero external JS dependencies.

---

## Security

DirectHunt fetches arbitrary URLs on behalf of visitors, so it is engineered defensively:

- **Strict SSRF Protection**: Only `http` and `https` are allowed. URLs with embedded credentials, `localhost` (including trailing-dot FQDNs like `localhost.`), `.local`, `.internal`, `.arpa`, single-label hosts, and IPv6 literals are blocked.
- **Private IPv4 Filtering**: Loopback (`127.0.0.0/8`), private RFC 1918 ranges, link-local / cloud metadata (`169.254.0.0/16`), CGNAT (`100.64.0.0/10`), benchmarking, multicast, and reserved IPv4 ranges are rejected, as is the Worker's own hostname (preventing self-loops).
- **Per-Hop Redirect Validation**: Every redirect hop is manually inspected and re-validated against SSRF and `ALLOWED_HOSTS` rules before following.
- **XSS & Content-Sniffing Prevention**: HTML, SVG, XML, JavaScript, and JSON responses are **never rendered as pages** from your Worker domain; they are forced to download as `application/octet-stream` with `Content-Security-Policy: sandbox; default-src 'none'` and `X-Content-Type-Options: nosniff`.
- **Hardened App Headers**: The web UI sends a strict `Content-Security-Policy`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and `X-Robots-Tag: noindex, nofollow`.
- **Safe Exports**: Generated CSV files neutralise spreadsheet formula injection (`=`, `+`, `-`, `@`), and generated shell/PowerShell scripts safely escape filenames and URLs.
- **Host Allowlisting**: Setting `ALLOWED_HOSTS` locks the Worker down to specific domains and their subdomains.

If your deployment is public, consider adding [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) or a [WAF Rate Limiting rule](https://developers.cloudflare.com/waf/rate-limiting-rules/) in front of your Worker route.

---

## Limitations

- Subject to your Cloudflare plan's Workers limits (CPU time, request duration, and up to 50 subrequests per invocation on the Free plan—guarded automatically by `CONFIG.maxSubrequests`).
- The grabber inspects server-rendered HTML and inline scripts. Client-side SPAs that render links exclusively via post-load XHR/fetch or pages behind interactive CAPTCHAs/logins cannot be scanned.
- `.m3u8` and `.mpd` manifests are detected and listed, but multi-segment HLS/DASH streams are not rewritten for proxied in-page playback (use the VLC / PotPlayer / MX Player buttons instead).
- Browsers can only preview codecs they support natively inside `<video>` / `<audio>`; for unsupported codecs (such as HEVC/AC3 in MKV on some browsers), use the external player buttons or download directly.

---

## Development

```bash
npx wrangler dev        # run locally
npx wrangler deploy     # publish to Cloudflare Workers
```

The entire project is contained in [`worker-v8.js`](worker-v8.js) (with the legacy version in [`worker.js`](worker.js)). Vector and PNG icons are embedded directly in the script. Note that the client UI lives inside an outer JavaScript template literal (`HTML_PAGE`), so backslashes and template expressions inside the client code are escaped accordingly.

---

## Responsible use

Use DirectHunt only for content you have the right to access and download, and respect the terms of service of target websites and Cloudflare. Restrict public deployments using `ALLOWED_HOSTS` and Cloudflare Access controls.

## License

Released under the [MIT License](LICENSE).

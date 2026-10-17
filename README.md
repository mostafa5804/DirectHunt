<div align="center">

<img src="logo.svg" width="128" height="128" alt="EdgeFetch logo">

# DirectHunt

**A self-hosted download helper that runs entirely on Cloudflare Workers.**
Direct links, a smart file grabber, a file inspector and export lists for your download manager, all in one dependency-free file.

[English](README.md) · [فارسی](README.fa.md)

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![Single file](https://img.shields.io/badge/single-file-blue)
![RTL](https://img.shields.io/badge/UI-FA%20%2F%20EN-red)

</div>

---

## Table of contents

- [Features](#features)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [Export formats](#export-formats)
- [API reference](#api-reference)
- [How it works](#how-it-works)
- [Security](#security)
- [Limitations](#limitations)
- [Development](#development)
- [Responsible use](#responsible-use)
- [License](#license)

## Features

### Three tools, one address bar

| Tool | What it does |
| --- | --- |
| **Direct link** | Wraps any file URL in a link served by your own Worker, with resume support. |
| **File grabber** | Scans a web page and lists every downloadable file it finds. |
| **File inspector** | Shows name, size, content type, resume support and last-modified date before you download. |

### File grabber

- Finds files in `<a>`, `<video>`, `<audio>`, `<source>`, `<embed>`, `<link>`, `<area>`, `og:video` meta tags and **URLs hidden inside inline scripts / JSON** (escaped slashes and `&` included).
- Understands `<base href>`, relative URLs, HTML entities (`&amp;`, `&#x26;`) and strips URL fragments. Links with a `download` attribute are always included.
- **Deep scan**: also scans up to 8 pages of the same site, which suits directory listings.
- Optional **image mode**, so logos and icons do not pollute results by default.
- Deduplicates results and caps them at 2000 links.

### Results workspace

- **Categories** (video, audio, archives, apps, documents, images) and per-format chips with counts.
- **Search** with several words and exclusions: `1080 -sample` keeps names containing `1080` and drops those containing `sample`.
- **Sort** by name, format or size, with **lazy size loading** (4 parallel requests) for the visible items.
- Select individual files or everything visible; long lists load 300 at a time.
- **In-page preview** for MP4/WebM/MOV video, common audio formats and images, streamed through the Worker with seeking.
- Per-item copy buttons for the original link, the direct link and ready-made `curl`, `wget` and `aria2` commands.

### Download handling

- Streams files straight through the Worker with full **`Range`** support: pause/resume and multi-connection download managers work.
- Smart **Referer strategy** for hotlink-protected hosts: your own origin of the target first, then a search-engine Referer, then none. You can also set a custom Referer.
- Correct file names, including **Persian / Unicode names** (RFC 5987), plus an optional custom file name.
- Follows redirects manually and re-validates every hop.

### Interface

- Light, dark or automatic theme; **Persian (RTL) and English**; remembered per browser.
- **Batch mode**: paste up to 300 URLs, one per line, and work with them like scan results.
- History suggestions for recent URLs, keyboard shortcut `/` to focus the input.
- **Installable PWA** with a share target, so you can share a link from another app straight into EdgeFetch (browser support varies).
- Deep links: `/?q=<url>&go=scan|info|direct`.

## Quick start

You need a free [Cloudflare account](https://dash.cloudflare.com/sign-up). There are no packages to install.

### Option A: Cloudflare dashboard (about 2 minutes)

1. Open **Workers & Pages → Create → Create Worker**, give it a name, and deploy the template.
2. Click **Edit code**, replace everything with the contents of [`worker.js`](worker.js), and click **Deploy**.
3. Open your `*.workers.dev` address.

### Option B: Wrangler CLI

```bash
git clone https://github.com/<your-username>/edgefetch.git
cd edgefetch
npx wrangler login
npx wrangler deploy
```

Minimal `wrangler.toml`:

```toml
name = "edgefetch"
main = "worker.js"
compatibility_date = "2025-01-01"

# [vars]
# ALLOWED_HOSTS = "example.com,cdn.example.org"
```

Run it locally with `npx wrangler dev`.

## Configuration

### Environment variable

| Variable | Example | Description |
| --- | --- | --- |
| `ALLOWED_HOSTS` | `example.com,cdn.example.org` | Optional. Restricts the proxy, inspector and scanner to these hosts **and their subdomains**. Strongly recommended for any public deployment. |

Set it in the dashboard (**Settings → Variables and Secrets**) or in `wrangler.toml` under `[vars]`.

### `CONFIG` object

Edit the constants at the top of `worker.js`:

| Key | Default | Description |
| --- | --- | --- |
| `title_fa` / `title_en` | – | App name in each language. |
| `color` | `#e74c3c` | Accent colour of the UI. |
| `maxLinks` | `2000` | Maximum links returned by one scan. |
| `scanTimeoutMs` | `20000` | Timeout for fetching a page. |
| `infoTimeoutMs` | `15000` | Timeout for the file inspector. |
| `maxRedirects` | `5` | Redirect hops followed before giving up. |
| `deepMaxPages` | `8` | Extra same-site pages scanned in deep mode. |

File types recognised by the grabber live in the `FILE_EXTS` and `IMAGE_EXTS` arrays.

## Usage

1. Paste a URL (a bare `example.com/file.zip` works too) and choose an action.
2. **Direct link**: copy, open, share, preview or copy a `curl` / `wget` / `aria2` command.
3. **File grabber**: filter, sort, select, then export.
4. **Advanced options** (collapsed under the input): custom Referer, custom file name (single link), deep scan, include images. Referer, deep scan and image options are remembered.
5. **Batch mode**: switch with the 📚 toggle above the input, paste one URL per line and press *Load list*.

## Export formats

Exports apply to the selected items, or to everything visible if nothing is selected. Choose **original** or **direct** (through your Worker) links first.

| Format | File | Use it with |
| --- | --- | --- |
| Plain list | `links.txt` | Any download manager that accepts a list. |
| aria2 input file | `aria2-input.txt` | `aria2c -i aria2-input.txt -c -x16 -s16` (includes output names). |
| wget script | `download-wget.sh` | `sh download-wget.sh` |
| curl script | `download-curl.sh` | `sh download-curl.sh` |
| M3U playlist | `playlist.m3u` | VLC, mpv and other players. |
| JSON | `links.json` | Scripts and automation. |
| CSV | `links.csv` | Excel (UTF-8 BOM included, formula-injection safe). |

File names are de-duplicated and shell-quoted safely in the generated scripts.

## API reference

All endpoints are `GET`. Errors are returned as `{ "error": "message" }` with a matching HTTP status.

### `GET /?url=<target>`  (alias: `/dl?url=<target>`)

Streams the target file through the Worker. `HEAD` is supported, and `Range`, `If-Range`, `If-None-Match` and `If-Modified-Since` request headers are forwarded.

| Parameter | Description |
| --- | --- |
| `url` | **Required.** Absolute `http(s)` URL (URL-encoded). |
| `ref` | Custom Referer to send upstream. |
| `name` | Override the downloaded file name (sanitised). |
| `inline=1` | Serve audio, video and common images inline for playback. Other types, and anything HTML-like, are always forced to download. |

### `GET /api/info?url=<target>[&ref=<referer>]`

```json
{
  "url": "https://example.com/files/report.zip",
  "filename": "report.zip",
  "size": 12345678,
  "type": "application/zip",
  "resumable": true,
  "lastModified": "Wed, 01 Jan 2025 00:00:00 GMT"
}
```

`size` is `null` when the server does not disclose it.

### `GET /api/extract?url=<page>[&ref=<referer>][&deep=1][&img=1]`

```json
{
  "links": ["https://example.com/files/movie.mkv"],
  "isFile": false,
  "title": "Page title",
  "pages": 1,
  "truncated": false,
  "url": "https://example.com/page"
}
```

When the URL is itself a file, the response is `{ "links": [], "isFile": true, "url": "..." }`.

### Other routes

| Route | Purpose |
| --- | --- |
| `/` | The web app. |
| `/manifest.webmanifest` | PWA manifest. |
| `/icon.svg`, `/icon-192.png`, `/icon-512.png`, `/icon-maskable-512.png`, `/apple-touch-icon.png`, `/favicon.ico` | Logo and icons, embedded in `worker.js` (no static assets needed). |

## How it works

- **Proxy**: `fetch()` to the origin with `redirect: "manual"`, validating each hop, then returning the upstream body as a stream, so memory use stays flat for large files.
- **Scanner**: the page is parsed with Cloudflare's streaming [`HTMLRewriter`](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/); candidate URLs are resolved against the page (or `<base>`) and filtered by file extension.
- **Inspector**: sends a one-byte `Range: bytes=0-0` request, reading the total size from `Content-Range`, and cancels the body.
- **UI**: a single HTML string served by the Worker, written in plain JavaScript with no build step and no external scripts (only the Vazirmatn font is loaded from a CDN).

## Security

EdgeFetch fetches arbitrary URLs on behalf of visitors, so it is built defensively:

- Only `http` and `https`; URLs with embedded credentials, `localhost`, `.local`, `.internal`, single-label hosts and IPv6 literals are rejected.
- Private, loopback, link-local, carrier-grade NAT, benchmarking, multicast and reserved IPv4 ranges are blocked, as is the Worker's own hostname (no request loops).
- **Every redirect hop is re-validated**; redirects to internal addresses are refused.
- HTML, SVG, XML, JavaScript and JSON responses are **never served as a page** from your domain; they are forced to download as `application/octet-stream`. Proxied responses also carry `Content-Security-Policy: sandbox` and `X-Content-Type-Options: nosniff`.
- The web app ships a strict Content-Security-Policy, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` and `noindex` headers. The JSON APIs do not send permissive CORS headers.
- Generated CSV files neutralise spreadsheet formulas, and generated shell scripts quote file names safely.
- `ALLOWED_HOSTS` turns the Worker from a general-purpose proxy into a private tool for specific sites.

> **Note:** The checks are based on host names and IP literals. A Worker cannot inspect DNS answers, and the Worker runs on Cloudflare's edge rather than inside your network, which limits what an attacker could reach. Treat the guard as defence in depth, not as a replacement for access control.

If your deployment is public, add your own protection in front of it, for example [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) or a [Rate Limiting rule](https://developers.cloudflare.com/waf/rate-limiting-rules/).

## Limitations

- Subject to your Cloudflare plan's Workers limits (CPU time, subrequests per request, request duration). Deep scan and Referer fallbacks use extra subrequests.
- The grabber reads server-rendered HTML and inline scripts. Pages that build their links with JavaScript after loading, or that sit behind a bot challenge or login, cannot be scanned.
- `.m3u8` and `.mpd` manifests are listed, but streams made of many segments are not rewritten for in-page playback.
- Browsers can only preview formats they support natively (MKV, AVI and similar are download-only).
- Hosts that block Cloudflare's IP ranges will refuse requests no matter which headers are sent.

## Development

```bash
npx wrangler dev        # run locally
npx wrangler deploy     # publish
```

The whole project is `worker.js` (the logo and PNG icons are embedded in it); `logo.svg` is the editable source of the logo and works well as the repository's social preview image. In `worker.js` the UI string comes first, followed by the server code. When editing the UI, remember it lives inside a JavaScript template literal, so avoid backslashes, backticks and `${…}` in the page's script and CSS (build special characters with `String.fromCharCode` instead).

Contributions are welcome. Please open an issue to discuss larger changes first.

## Responsible use

Use EdgeFetch only for content you have the right to access and download, and respect the terms of service of the sites you connect to and of Cloudflare. You are responsible for how you operate your deployment; restrict it with `ALLOWED_HOSTS` and access controls rather than leaving it open to the public.

## License

Released under the [MIT License](LICENSE).

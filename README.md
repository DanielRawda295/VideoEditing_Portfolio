# Daniel Rawda — Cinematic Video Editing Portfolio

A complete, local static portfolio built with semantic HTML, custom CSS, vanilla ES modules, Canvas and native video. It uses Daniel's actual portrait, résumé and all 19 supplied video projects. There is no build step and no production dependency.

## Preview

From this folder, with Node.js 22 or later:

```powershell
npm run dev
```

Open **http://127.0.0.1:4173**. Stop the server with **Ctrl+C**. `node docs/serve.mjs` works without npm as well. The server supports byte-range requests, so video seeking works locally. Use an HTTP server rather than double-clicking `index.html`; browsers restrict ES modules on `file://` URLs.

## What's included

- A cinematic hero using a silent full-length delivery copy of an actual entertainment edit, plus a poster fallback and motion pause control.
- A clearly labeled **featured cut**, rather than a fabricated showreel. Native playback controls provide seeking, volume, fullscreen and keyboard controls after the custom play button is activated.
- All 19 projects with actual WebP posters, accurate durations, category filters, restrained mouse previews and accessible video dialogs. Dialogs support Escape, focus restoration and previous/next navigation; arrow navigation applies outside the native video controls.
- About, real CV download, verified software and capabilities, two experience entries, education, documented training, a general four-stage creative process and working email/phone/LinkedIn links.
- Scroll reveals, a particle network, an additive desktop cursor, magnetic buttons, parallax, editing timelines and hover effects. The native cursor remains available. Touch devices get explicit play buttons.
- Mobile navigation, semantic landmarks, a skip link, visible focus states, reduced-motion support, Save-Data handling, deferred video loading, aspect-preserving playback and page-visibility pausing.
- Search and sharing metadata, a DR favicon, a sharing image and verified Person structured data.

## Structure

```text
index.html                 All page sections, résumé copy and metadata
css/styles.css             Design system and base layout
css/animations.css         Motion and reduced-motion fallbacks
css/responsive.css         Tablet, phone and narrow-screen layouts
js/main.js                 Gallery, filters, navigation and hero logic
js/projects.js             Project content and delivery asset paths
js/video-player.js         Modal, featured player and limited previews
js/animations.js           Reveals, cursor, particles and timeline effects
assets/videos/             19 web delivery MP4s plus a silent hero copy
assets/thumbnails/         19 posters extracted from the actual videos
assets/images/             Real portrait, favicon and sharing image
assets/documents/          Unchanged supplied résumé PDF
docs/ASSET-AUDIT.md         Inventory, curation, sources and assumptions
docs/asset-audit.json       Full machine-readable source metadata
docs/TESTING.md             Verification results and practical limits
docs/serve.mjs              Dependency-free local HTTP preview
docs/qa.mjs                 Optional Playwright integration checks
```

## Projects and where they appear

The complete source-to-title mapping and presentation order live in `js/projects.js`.

| Source | Section | Working title / group |
|---|---|---|
| Entertainment7.m4v | Hero, featured player, gallery | Worlds in motion |
| Promotional.mp4 | Gallery | Street Snitch / App promo |
| Fitness.mp4 | Gallery | Built in motion |
| Entertainment6.mp4 | Gallery | Animated dimensions |
| Entertainment1–5, 8–9.mp4 | Gallery | Character, portrait and dialogue edits |
| UGC1–2.mp4 | Gallery | Digital tools; Platform walkthrough |
| LogoReveal1–6.mp4 | Gallery | Orbit; Particles; Green planet; Cube; Neon; Character |

The titles are descriptive working names requiring Daniel's confirmation. Categories reflect the filenames and visible footage. No client relationship is implied by a brand or character appearing in a video. There is no dedicated combined showreel in the supplied files.

## Add or replace a project

1. Keep your original file outside the website delivery folder. Export a browser-ready H.264 MP4 with AAC audio, yuv420p pixel format and fast-start metadata into `assets/videos/`.
2. Extract an intentional, recognizable frame into `assets/thumbnails/`. WebP works well; retain the video's aspect ratio.
3. Add or edit an object in `js/projects.js`. Use a unique `id`, `title`, `category`, factual `description`, `techniques`, numeric `duration` in seconds, source `width` and `height`, and relative `video` and `poster` paths. `source` records the original filename for maintenance.
4. For a new category, add a matching filter button in `index.html`; update the All work count, hero collection count and About collection count if the number of projects changes. The live gallery status and modal numbering are computed automatically.
5. Run the preview and test playback, seeking, poster quality, the filter and the project dialog on a narrow screen.

Example project entry:

```js
{
  id: 'new-project',
  title: 'Your confirmed project title',
  category: 'Promotional',
  description: 'A short description supported by the actual work.',
  techniques: ['Motion graphics'],
  duration: 25.5,
  width: 1080,
  height: 1920,
  video: 'assets/videos/new-project.mp4',
  poster: 'assets/thumbnails/new-project.webp',
  source: 'OriginalFile.mp4'
}
```

The featured and hero paths are intentionally explicit. To change the lead project, update the hero image/video paths and feature metadata in `index.html`, the featured source in `js/video-player.js`, and the sharing image. Use the whole project, or a separately approved showreel; do not relabel an arbitrary montage as an existing reel.

To replace the portrait, encode the real replacement image at `assets/images/daniel-portrait.webp`, and update the alt text and dimensions. Replace the CV at `assets/documents/daniel-rawda-resume.pdf`; also update the site copy if résumé facts change.

## Media preparation

The originals in `E:\PortfolioVideos` were only read. Delivery copies use H.264 CRF 21, preserve frame rates, cap width at 1080 and retain source proportions; source files with larger frames are available separately at original quality. The silent hero copy uses CRF 26 at 960 pixels wide. Original media totals 442.3 MB; delivery videos total approximately 174.5 MB including the hero. The entire collection is **not** downloaded on page load.

Optional regeneration scripts require Python with Pillow and pypdf, plus FFmpeg/ffprobe on PATH. Their source paths reflect this computer and can be edited:

```powershell
python docs/audit_assets.py
python docs/prepare_media.py
python docs/write_audit.py
```

Existing encoded videos are skipped by the preparation script. For a changed source, choose a new delivery filename or remove only the specific derived file before regeneration. Never overwrite the original footage.

## Verification

```powershell
npm run check
```

This checks JavaScript syntax. The optional `node docs/qa.mjs` performs browser integration checks using an existing Playwright installation and Chrome. It creates an isolated local server at port 4174, runs the checks, records `docs/qa-results.json` and screenshots, and closes its browser and server. `--layout-only` skips already-verified video playback checks. Set `CHROME_PATH` if Chrome is installed elsewhere. Install Playwright as a development dependency only if you want to run this suite on another computer.

See `docs/TESTING.md` for the actual checks performed and device-testing limits.

## Before publishing

This work has **not been deployed**. Public deployment requires Daniel's approval.

Confirm the working project titles and featured selection. Once a domain is chosen, add an absolute canonical URL, `og:url`, and an absolute `og:image` URL in `index.html`. Google Fonts is the only external visual dependency; system font fallbacks are available when offline.

Any static host supporting HTTPS, MP4 MIME types and HTTP range requests can serve this folder; no backend is needed. For a public media-heavy portfolio, a static frontend plus object storage/CDN for video is a good fit. Update each project's video URL if using a media CDN. Upload the actual files, not filesystem references to `E:\PortfolioVideos`. Keep development reports, scripts and raw sources out of the public publishing bundle. The contact action uses a real mail link and does not claim to submit a form.

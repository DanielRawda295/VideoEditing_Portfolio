# Verification — 9 November 2026

The final source passed `npm run check` and a full `node docs/qa.mjs` browser integration run using installed Chrome through Playwright. No production dependency was added.

## Passed checks

- All 19 actual projects appear in the gallery.
- Every project delivery file loads metadata, decodes frames, starts playback, and seeks near its end without a media error.
- Featured video playback works and reveals native playback, seek, volume and fullscreen controls.
- Actual portrait and hero poster load; all 19 gallery posters load successfully and were visually reviewed against the extracted source frames.
- The résumé download responds with a valid PDF. Its SHA-256 hash matches the supplied original: `FF895752C68FCFEFF98BAF3B4FB9D1CDF8C0AF40E6D92A7DACB49CF0337FB6C7`.
- Category counts are Entertainment 9, Promotional 1, Fitness 1, Logo animation 6 and UGC 2. All work restores 19 projects.
- Project dialogs play media, navigate next/previous, retain keyboard focus inside the modal, close with Escape and return focus to the originating project.
- Mouse previews play one at a time; leaving a card pauses playback and releases its source.
- Mobile navigation opens, follows section links and closes correctly.
- No horizontal overflow at viewport widths 1440, 820, 390 and 320 pixels.
- A reduced-motion browser context requests no MP4 before explicit playback.
- A simulated Save-Data connection requests no automatic or hover-triggered MP4.
- No uncaught JavaScript exceptions or HTTP errors for local assets were observed.
- Desktop, tablet and mobile screenshots were inspected. Narrow-screen headings and the tilted hero frame were corrected during QA. Complete-page screenshots were taken after scrolling all lazy posters into view.

Machine-readable results are in `docs/qa-results.json`. Visual QA captures are `docs/qa-desktop.png`, `docs/qa-tablet.png`, `docs/qa-mobile.png`, `docs/qa-narrow.png` and the complete-page variants. These are local development artifacts, ignored by Git.

## Practical limits

These were real Chrome playback checks with responsive viewports, not physical Android/iPhone tests. Safari/iOS, Firefox, screen-reader output and native OS fullscreen/volume interactions were not separately tested. The controls use native HTML video behavior. Save-Data was simulated because this desktop connection does not expose a metered mobile connection.

Public hosting, domain metadata resolution, CDN behavior and social-platform link previews have not been tested because the user requested approval before publication. There is no contact backend; the working contact action opens the visitor's mail application.

The original source videos were never modified. Encoding and extraction commands read them and write separate delivery assets inside the website project. The résumé was also rendered and visually reviewed before its verified facts were used in the site.

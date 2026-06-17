---
name: responsive-screenshots
description: Capture this project's standard responsive screenshot set after layout, CSS, homepage, post, category, archive, page, header, card, or visual changes. Use when the user asks for responsive screenshots, screeny responsywnosci, viewport checks, page-specific screenshots, visual iteration snapshots, or proof of how the site looks across mobile, tablet, desktop, and breakpoint sizes.
---

# Responsive Screenshots

Use this project-local skill to create the same responsive screenshot set after each visual iteration. Do not invent viewport sizes unless the user explicitly asks for extra ones.

When the user asks for a non-homepage surface, use the page targets listed in [PAGES.md](PAGES.md). If unsure which target covers the requested surface, run `--list-pages`.

## Output Contract

Always save artifacts under:

```text
output/playwright/responsive/<YYYYMMDD-HHMMSS>-<label>/
```

Each single-page run must contain:

- one PNG per standard viewport
- `manifest.json` with viewport metadata and layout metrics

Each multi-page run must contain one folder per page target, each with one PNG per standard viewport.

Use a short lowercase label, for example `logo-fix`, `featured-card`, or `after-spacing-change`.

## Standard Viewports

Capture exactly these viewports:

```text
mobile-320x568
mobile-360x800
mobile-375x812
mobile-390x844
mobile-414x896
tablet-768x1024
tablet-820x1180
tablet-landscape-1024x768
boundary-1180x820
boundary-1181x821
desktop-1280x720
desktop-1366x768
desktop-1440x900
desktop-1536x864
desktop-1920x1080
desktop-2120x1252
```

These include common mobile/tablet sizes plus this site's important CSS boundaries around `900/901`, `1180/1181`, and `820/821` height behavior.

## Workflow

1. Build the current site before screenshots unless the user explicitly points to an already-running URL:

   ```bash
   docker compose run --rm build
   ```

2. Run the bundled script from the repository root:

   ```bash
   node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --label <label>
   ```

   The script prepares a Playwright runtime and Chromium under `output/playwright/.runtime` if needed, starts a temporary static server for `_site`, captures the standard viewport set for the homepage, writes `manifest.json`, and stops the server.

3. To capture another page target, use:

   ```bash
   node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --page post-piraci-4 --label <label>
   ```

   Useful selectors:

   ```bash
   node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --page categories --label categories
   node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --page category-devlog --label category-devlog
   node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --page home,post-piraci-4,categories --label key-pages
   node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --page all --label all-pages
   node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --path /posts/piraci-4/ --label custom-path
   node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --list-pages
   ```

4. If the user provides an already-running URL, use:

   ```bash
   node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --url http://localhost:4000 --label <label> --no-build
   ```

   With `--page`, the `--url` value is treated as the site base URL. Without `--page`, the exact URL is captured for backwards compatibility.

5. After capture, report:

   - artifact folder path
   - target page ids captured
   - count of PNG files
   - any nonzero `horizontalOverflowPx`
   - any nonzero `titleAsideOverlapPx` on non-stacked hero layouts
   - whether console errors look layout-related or only local analytics/network noise

## Notes

- Use full-page screenshots.
- Do not stage or commit screenshots unless the user asks.
- First run may need network approval to install Playwright and Chromium into `output/playwright/.runtime`.
- If Docker is unavailable, ask whether to use an existing local URL or run the project's dev server another way; do not capture stale `_site` unless the user accepts that.

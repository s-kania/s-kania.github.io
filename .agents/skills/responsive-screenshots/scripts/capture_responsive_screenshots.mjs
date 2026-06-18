#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const VIEWPORTS = [
  ["mobile-320x568", 320, 568],
  ["mobile-360x800", 360, 800],
  ["mobile-375x812", 375, 812],
  ["mobile-390x844", 390, 844],
  ["mobile-414x896", 414, 896],
  ["tablet-768x1024", 768, 1024],
  ["tablet-820x1180", 820, 1180],
  ["tablet-landscape-1024x768", 1024, 768],
  ["boundary-1180x820", 1180, 820],
  ["boundary-1181x821", 1181, 821],
  ["desktop-1280x720", 1280, 720],
  ["desktop-1366x768", 1366, 768],
  ["desktop-1440x900", 1440, 900],
  ["desktop-1536x864", 1536, 864],
  ["desktop-1920x1080", 1920, 1080],
  ["desktop-2120x1252", 2120, 1252],
];

const PAGE_TARGETS = [
  { id: "home", path: "/", description: "Homepage with hero, post cards, browser, categories, and system panels." },
  { id: "posts", path: "/posts/", description: "Posts index explorer." },
  { id: "archives", path: "/archives/", description: "Archive tab." },
  { id: "categories", path: "/categories/", description: "Categories index tab." },
  { id: "about", path: "/about/", description: "About page tab." },
  { id: "privacy-policy", path: "/privacy-policy/", description: "Hidden privacy policy page." },

  { id: "category-ciekawostki", path: "/categories/ciekawostki/", description: "Category archive: Ciekawostki." },
  { id: "category-devlog", path: "/categories/devlog/", description: "Category archive: Devlog." },
  { id: "category-galerie", path: "/categories/galerie/", description: "Category archive: Galerie." },
  { id: "category-inne", path: "/categories/inne/", description: "Category archive: Inne." },
  { id: "category-piraci", path: "/categories/piraci/", description: "Category archive: Piraci." },
  { id: "category-poradniki", path: "/categories/poradniki/", description: "Category archive: Poradniki." },
  { id: "category-recenzje", path: "/categories/recenzje/", description: "Category archive: Recenzje." },

  { id: "post-piraci-4", path: "/posts/piraci-4/", description: "Latest post; devlog post with featured image." },
  { id: "post-aukcja-duch-kijowa", path: "/posts/aukcja-duch-kijowa/", description: "Post with image and short text." },
  { id: "post-klockowe-ciekawostki-3", path: "/posts/klockowe-ciekawostki-3/", description: "Long post with images." },
  { id: "post-piraci-3", path: "/posts/piraci-3/", description: "Devlog post with YouTube embed." },
  { id: "post-klockowe-ciekawostki-2", path: "/posts/klockowe-ciekawostki-2/", description: "Post with object-fit image metadata." },
  { id: "post-piraci-2", path: "/posts/piraci-2/", description: "Devlog post with YouTube embed." },
  { id: "post-bricks-and-figs-masters", path: "/posts/bricks-and-figs-masters/", description: "Long gallery/event post." },
  { id: "post-piraci-1", path: "/posts/piraci-1/", description: "Piraci devlog post." },
  { id: "post-astronauci-w-stratosferze", path: "/posts/astronauci-w-stratosferze/", description: "Post page." },
  { id: "post-fiat-500-galeria", path: "/posts/fiat-500-galeria/", description: "Gallery post." },
  { id: "post-zamek-w-czchowie", path: "/posts/zamek-w-czchowie/", description: "Post page." },
  { id: "post-recenzja-jagdpanther", path: "/posts/recenzja-jagdpanther/", description: "Review post." },
  { id: "post-wizyta-w-bricks-and-figs", path: "/posts/wizyta-w-bricks-and-figs/", description: "Long post with image gallery." },
  { id: "post-cashback", path: "/posts/cashback/", description: "Guide post." },
  { id: "post-klockowe-ciekawostki-1", path: "/posts/klockowe-ciekawostki-1/", description: "Ciekawostki post." },
  { id: "post-ciekawostki", path: "/posts/ciekawostki/", description: "Post page." },
  { id: "post-klockowe-urodziny", path: "/posts/klockowe-urodziny-i-marzenia-o-tworzeniu-gier/", description: "First post; long text without post image." },
];

const PAGE_TARGETS_BY_ID = new Map(PAGE_TARGETS.map((target) => [target.id, target]));

function parseArgs(argv) {
  const args = {
    build: true,
    customPaths: [],
    label: "iteration",
    listPages: false,
    outputBase: "output/playwright/responsive",
    pageIds: [],
    pageOptionUsed: false,
    port: 4173,
    runtimeDir: "output/playwright/.runtime",
    url: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--label") {
      args.label = next;
      index += 1;
    } else if (arg === "--page" || arg === "--pages") {
      args.pageOptionUsed = true;
      args.pageIds.push(...splitCsvArg(next, arg));
      index += 1;
    } else if (arg === "--path") {
      args.customPaths.push(next);
      index += 1;
    } else if (arg === "--list-pages") {
      args.listPages = true;
    } else if (arg === "--output-base") {
      args.outputBase = next;
      index += 1;
    } else if (arg === "--port") {
      args.port = Number(next);
      index += 1;
    } else if (arg === "--runtime-dir") {
      args.runtimeDir = next;
      index += 1;
    } else if (arg === "--url") {
      args.url = next;
      args.build = false;
      index += 1;
    } else if (arg === "--no-build") {
      args.build = false;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  args.label = slugify(args.label || "iteration");
  return args;
}

function printHelp() {
  console.log(`Usage:
  npx --yes --package playwright node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --label <label>
  node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --page post-piraci-4 --label post-check
  node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --page home,post-piraci-4,categories --label multi-page
  node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --page all --label all-pages
  node .agents/skills/responsive-screenshots/scripts/capture_responsive_screenshots.mjs --path /posts/piraci-4/ --label custom-path

Options:
  --label <label>          Folder suffix. Default: iteration
  --page <id[,id]>         Named page target. Repeatable. Default: home. Use all for every known page.
  --path <path>            Custom site path, for example /posts/piraci-4/. Repeatable.
  --list-pages             Print known page targets and exit.
  --url <url>              Capture an existing running site instead of _site
  --no-build               Skip docker compose build
  --port <port>            First port to try for the temporary _site server
  --output-base <path>     Default: output/playwright/responsive
  --runtime-dir <path>     Default: output/playwright/.runtime
`);
}

function splitCsvArg(value, argName) {
  if (!value) throw new Error(`${argName} requires a value`);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "iteration";
}

function normalizeSitePath(value) {
  if (!value) throw new Error("--path requires a value");
  if (/^https?:\/\//i.test(value)) return value;

  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

function pageTargetListText() {
  const longestId = Math.max(...PAGE_TARGETS.map((target) => target.id.length));
  return PAGE_TARGETS
    .map((target) => `${target.id.padEnd(longestId)}  ${target.path.padEnd(55)}  ${target.description}`)
    .join("\n");
}

function printPageTargets() {
  console.log("Known responsive screenshot page targets:");
  console.log(pageTargetListText());
}

function resolveCaptureTargets(args) {
  if (args.customPaths.length > 0) {
    return args.customPaths.map((customPath, index) => {
      const normalizedPath = normalizeSitePath(customPath);
      const id = /^https?:\/\//i.test(normalizedPath)
        ? `url-${index + 1}`
        : `path-${slugify(normalizedPath)}`;
      return {
        id,
        path: /^https?:\/\//i.test(normalizedPath) ? null : normalizedPath,
        url: /^https?:\/\//i.test(normalizedPath) ? normalizedPath : null,
        description: `Custom path: ${customPath}`,
      };
    });
  }

  if (args.url && !args.pageOptionUsed) {
    return [{
      id: "custom-url",
      path: null,
      url: args.url,
      description: `Exact URL: ${args.url}`,
    }];
  }

  const requestedIds = args.pageOptionUsed ? args.pageIds : ["home"];
  const expandedIds = requestedIds.includes("all")
    ? PAGE_TARGETS.map((target) => target.id)
    : requestedIds;

  const seen = new Set();
  return expandedIds
    .filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((id) => {
      const target = PAGE_TARGETS_BY_ID.get(id);
      if (!target) {
        const available = PAGE_TARGETS.map((item) => item.id).join(", ");
        throw new Error(`Unknown page target "${id}". Use --list-pages. Available: ${available}`);
      }
      return target;
    });
}

function resolveTargetUrl(baseUrl, target) {
  if (target.url) return target.url;
  return new URL(target.path, baseUrl).toString();
}

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

function runBuild() {
  console.log("[responsive-screenshots] Building _site with docker compose run --rm build");
  const result = spawnSync("docker", ["compose", "run", "--rm", "build"], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error("Build failed. Fix the build or rerun with --url <running-site> --no-build.");
  }
}

async function ensurePlaywright(runtimeDir) {
  const absoluteRuntimeDir = path.resolve(runtimeDir);
  const packageJsonPath = path.join(absoluteRuntimeDir, "package.json");
  const nodeModulesPlaywright = path.join(absoluteRuntimeDir, "node_modules", "playwright");

  if (!existsSync(nodeModulesPlaywright)) {
    console.log(`[responsive-screenshots] Installing Playwright runtime in ${absoluteRuntimeDir}`);
    await mkdir(absoluteRuntimeDir, { recursive: true });
    await writeFile(
      packageJsonPath,
      `${JSON.stringify({ private: true, dependencies: { playwright: "latest" } }, null, 2)}\n`,
    );

    const result = spawnSync("npm", ["install", "--no-audit", "--no-fund"], {
      cwd: absoluteRuntimeDir,
      stdio: "inherit",
    });

    if (result.status !== 0) {
      throw new Error("Unable to install Playwright runtime. Approve network access or install Playwright manually in the runtime directory.");
    }
  }

  const runtimeRequire = createRequire(packageJsonPath);
  const playwright = runtimeRequire("playwright");
  const chromiumPath = playwright.chromium.executablePath();

  if (!existsSync(chromiumPath)) {
    console.log("[responsive-screenshots] Installing Playwright Chromium browser");
    const result = spawnSync(process.execPath, [path.join(nodeModulesPlaywright, "cli.js"), "install", "chromium"], {
      cwd: absoluteRuntimeDir,
      stdio: "inherit",
    });

    if (result.status !== 0) {
      throw new Error("Unable to install Playwright Chromium browser.");
    }
  }

  return playwright;
}

async function findFreePort(startPort) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    const available = await new Promise((resolve) => {
      const server = createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      server.listen(port, "127.0.0.1");
    });

    if (available) return port;
  }

  throw new Error(`No free port found from ${startPort} to ${startPort + 19}`);
}

async function startStaticServer(port) {
  const child = spawn("python3", ["-m", "http.server", String(port), "--directory", "_site"], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  await waitForUrl(`http://127.0.0.1:${port}/`);
  return child;
}

async function waitForUrl(url) {
  const deadline = Date.now() + 8000;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError?.message || "no response"}`);
}

async function stopServer(child) {
  if (!child) return;
  if (child.exitCode !== null) return;

  child.kill("SIGINT");
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, 2000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function capture({ playwright, baseUrl, targets, outputDir }) {
  const { chromium } = playwright;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleEntries = [];
  const viewports = [];
  const useTargetSubdirectories = targets.length > 1 || !["home", "custom-url"].includes(targets[0]?.id);

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleEntries.push({
        type: message.type(),
        text: message.text(),
      });
    }
  });

  try {
    for (const target of targets) {
      const targetUrl = resolveTargetUrl(baseUrl, target);
      const targetOutputDir = useTargetSubdirectories
        ? path.join(outputDir, target.id)
        : outputDir;

      await mkdir(targetOutputDir, { recursive: true });
      await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

      for (const [name, width, height] of VIEWPORTS) {
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(250);

        const file = `${name}.png`;
        const relativeFile = useTargetSubdirectories ? path.join(target.id, file) : file;
        await page.screenshot({
          fullPage: true,
          path: path.join(targetOutputDir, file),
        });

        const metrics = await page.evaluate(() => {
          const title = document.querySelector(".home-hero h1");
          const aside = document.querySelector(".hero-aside");
          const horizontalOverflowPx = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);

          if (!title || !aside) {
            return {
              horizontalOverflowPx,
              titleAsideOverlapPx: null,
              heroIsStacked: null,
            };
          }

          const range = document.createRange();
          range.selectNodeContents(title);
          const textBox = range.getBoundingClientRect();
          const titleBox = title.getBoundingClientRect();
          const asideBox = aside.getBoundingClientRect();
          const verticalOverlap = Math.max(0, Math.min(textBox.bottom, asideBox.bottom) - Math.max(textBox.top, asideBox.top));
          const heroIsStacked = verticalOverlap === 0;
          const titleAsideOverlapPx = heroIsStacked ? 0 : Math.max(0, Math.round(textBox.right - asideBox.left));

          return {
            titleFontSize: getComputedStyle(title).fontSize,
            titleBoxWidth: Math.round(titleBox.width),
            titleTextWidth: Math.round(textBox.width),
            titleInternalOverflowPx: Math.max(0, Math.round(textBox.width - titleBox.width)),
            gapToAsidePx: heroIsStacked ? null : Math.round(asideBox.left - textBox.right),
            titleAsideOverlapPx,
            heroIsStacked,
            horizontalOverflowPx,
          };
        });

        viewports.push({
          targetId: target.id,
          targetPath: target.path,
          targetUrl,
          name,
          width,
          height,
          file: relativeFile,
          metrics,
        });
        console.log(`[responsive-screenshots] ${target.id} ${name} -> ${relativeFile}`);
      }
    }
  } finally {
    await browser.close();
  }

  return { viewports, consoleEntries };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.listPages) {
    printPageTargets();
    return;
  }

  const targets = resolveCaptureTargets(args);
  const outputDir = path.resolve(args.outputBase, `${timestamp()}-${args.label}`);
  let server = null;
  let baseUrl = args.url;

  if (args.build) runBuild();

  await mkdir(outputDir, { recursive: true });

  try {
    const playwright = await ensurePlaywright(args.runtimeDir);

    if (!baseUrl) {
      const port = await findFreePort(args.port);
      server = await startStaticServer(port);
      baseUrl = `http://127.0.0.1:${port}/`;
    }

    const result = await capture({ playwright, baseUrl, targets, outputDir });
    const manifest = {
      createdAt: new Date().toISOString(),
      source: baseUrl,
      outputDir,
      targets: targets.map((target) => ({
        id: target.id,
        path: target.path,
        url: resolveTargetUrl(baseUrl, target),
        description: target.description,
      })),
      viewports: result.viewports,
      consoleEntries: result.consoleEntries,
    };

    await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

    const horizontalOverflow = result.viewports.filter((item) => item.metrics?.horizontalOverflowPx > 0);
    const titleOverlap = result.viewports.filter((item) => item.metrics?.titleAsideOverlapPx > 0);

    console.log(`[responsive-screenshots] Output: ${outputDir}`);
    console.log(`[responsive-screenshots] Targets: ${targets.map((target) => target.id).join(", ")}`);
    console.log(`[responsive-screenshots] PNG files: ${result.viewports.length}`);
    console.log(`[responsive-screenshots] Horizontal overflow cases: ${horizontalOverflow.length}`);
    console.log(`[responsive-screenshots] Title/aside overlap cases: ${titleOverlap.length}`);

    if (result.consoleEntries.length > 0) {
      console.log(`[responsive-screenshots] Console warnings/errors: ${result.consoleEntries.length}`);
    }
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(`[responsive-screenshots] ${error.stack || error.message}`);
  process.exit(1);
});

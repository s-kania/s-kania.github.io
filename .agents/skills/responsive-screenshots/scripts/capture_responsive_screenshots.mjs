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

function parseArgs(argv) {
  const args = {
    build: true,
    label: "iteration",
    outputBase: "output/playwright/responsive",
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

Options:
  --label <label>          Folder suffix. Default: iteration
  --url <url>              Capture an existing running site instead of _site
  --no-build               Skip docker compose build
  --port <port>            First port to try for the temporary _site server
  --output-base <path>     Default: output/playwright/responsive
  --runtime-dir <path>     Default: output/playwright/.runtime
`);
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "iteration";
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

async function capture({ playwright, url, outputDir }) {
  const { chromium } = playwright;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleEntries = [];
  const viewports = [];

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleEntries.push({
        type: message.type(),
        text: message.text(),
      });
    }
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    for (const [name, width, height] of VIEWPORTS) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(250);

      const file = `${name}.png`;
      await page.screenshot({
        fullPage: true,
        path: path.join(outputDir, file),
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

      viewports.push({ name, width, height, file, metrics });
      console.log(`[responsive-screenshots] ${name} -> ${file}`);
    }
  } finally {
    await browser.close();
  }

  return { viewports, consoleEntries };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir = path.resolve(args.outputBase, `${timestamp()}-${args.label}`);
  let server = null;
  let targetUrl = args.url;

  if (args.build) runBuild();

  await mkdir(outputDir, { recursive: true });

  try {
    const playwright = await ensurePlaywright(args.runtimeDir);

    if (!targetUrl) {
      const port = await findFreePort(args.port);
      server = await startStaticServer(port);
      targetUrl = `http://127.0.0.1:${port}/`;
    }

    const result = await capture({ playwright, url: targetUrl, outputDir });
    const manifest = {
      createdAt: new Date().toISOString(),
      source: targetUrl,
      outputDir,
      viewports: result.viewports,
      consoleEntries: result.consoleEntries,
    };

    await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

    const horizontalOverflow = result.viewports.filter((item) => item.metrics?.horizontalOverflowPx > 0);
    const titleOverlap = result.viewports.filter((item) => item.metrics?.titleAsideOverlapPx > 0);

    console.log(`[responsive-screenshots] Output: ${outputDir}`);
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

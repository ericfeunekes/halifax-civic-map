#!/usr/bin/env node

import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile, readdir } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize, resolve, relative } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const DEFAULT_PLACE = {
  label: "6241 Quinpool Road perf fixture",
  lat: 44.64462,
  lon: -63.60768,
};
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

const CIVIC_PROVIDER_PATTERNS = [
  "arcgis.com",
  "arcgisonline.com",
  "hrm.maps.arcgis.com",
  "services2.arcgis.com",
  "services.arcgis.com",
  "socrata.com",
  "data.novascotia.ca",
  "nominatim.openstreetmap.org",
];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".sqlite": "application/octet-stream",
  ".wasm": "application/wasm",
  ".pbf": "application/x-protobuf",
  ".bin": "application/octet-stream",
  ".br": "application/octet-stream",
  ".gz": "application/gzip",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const args = parseArgs(process.argv.slice(2));
const outputDir = resolve(ROOT, args.outputDir || "performance-results");
const dataDir = resolve(ROOT, args.dataDir || "data");
const port = Number(args.port || 8765);
const basePath = normalizeBasePath(args.basePath || "/halifax-civic-map");
const baseUrl = `http://127.0.0.1:${port}${basePath}/`;

await assertLocalDataSurface();
await mkdir(outputDir, { recursive: true });

const server = await serveStatic(ROOT, port);
let browser;

try {
  browser = await chromium.launch({
    executablePath: args.chromePath || findChromeExecutable(),
    headless: !args.headed,
    args: ["--disable-background-networking", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const network = { local: [], externalAssets: [], assetsStubbed: [], blocked: [], providerViolations: [] };
  await installLocalRoutes(context, network);

  const page = await context.newPage();
  await installBrowserInstrumentation(page);

  const session = await context.newCDPSession(page);
  await session.send("Performance.enable");

  const report = {
    generatedAt: new Date().toISOString(),
    appUrl: baseUrl,
    basePath,
    assetMode: args.offlineAssets ? "offline-stubbed" : "production-external",
    dataDir,
    place: DEFAULT_PLACE,
    localData: await describeLocalDataSurface(),
    scenarios: [],
    network,
  };

  report.scenarios.push(await runColdLoad(page, session));
  report.scenarios.push(await runRefreshScenario(page, session, "default-500m", { radius: 500, allLayers: false }));
  report.scenarios.push(await runRedrawScenario(page, session, "default-redraws", { radius: 500, allLayers: false }));
  report.scenarios.push(await runMapInteractionScenario(page, session, { radius: 500, allLayers: false }));
  report.scenarios.push(await runRefreshScenario(page, session, "all-layers-500m", { radius: 500, allLayers: true }));
  report.scenarios.push(await runRedrawScenario(page, session, "all-layers-redraws", { radius: 500, allLayers: true }));
  report.scenarios.push(await runInteractionStressScenario(page, session, "all-layers-interaction-stress", { radius: 500, allLayers: true }));
  report.scenarios.push(await runRefreshScenario(page, session, "all-layers-5km", { radius: 5000, allLayers: true }));
  report.scenarios.push(await runRefreshScenario(page, session, "all-layers-10km-guarded", { radius: 10000, allLayers: true }));

  report.summary = summarize(report);
  const jsonPath = join(outputDir, "local-performance-report.json");
  const markdownPath = join(outputDir, "local-performance-report.md");
  const csvPath = join(outputDir, "local-performance-report.csv");
  await writeFile(jsonPath, JSON.stringify(report, null, 2));
  await writeFile(markdownPath, renderMarkdown(report));
  await writeFile(csvPath, renderScenarioCsv(report));

  printConsoleSummary(report, jsonPath, markdownPath, csvPath);

  if (report.summary.providerViolationCount > 0) {
    throw new Error(`Civic data local-only contract failed: ${report.summary.providerViolationCount} live provider requests`);
  }
  if (report.summary.blockedRequestCount > 0) {
    throw new Error(`Unexpected external request contract failed: ${report.summary.blockedRequestCount} blocked non-asset requests`);
  }
  if (args.failOnBudget && report.summary.budgetWarnings.length) {
    throw new Error(`Performance budget warnings: ${report.summary.budgetWarnings.join("; ")}`);
  }
} finally {
  if (browser) await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function normalizeBasePath(value) {
  if (!value || value === "/") return "";
  const trimmed = String(value).replace(/^\/+|\/+$/g, "");
  return `/${trimmed}`;
}

async function assertLocalDataSurface() {
  const manifestPath = join(dataDir, "manifest.json");
  if (!existsSync(dataDir) || !existsSync(manifestPath)) {
    throw new Error(
      `Missing local static data at ${dataDir}. Build or copy a GitHub Pages-compatible candidate with manifest.json there first, then run npm run perf:local.`,
    );
  }
}

async function describeLocalDataSurface() {
  const manifestPath = join(dataDir, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const layers = Object.values(manifest.layers || {});
  const files = await summarizeStaticFiles(dataDir);
  return {
    manifestGeneratedAt: manifest.generated_at,
    manifestMode: manifest.mode,
    schemaVersion: manifest.schema_version,
    coverage: manifest.coverage,
    layerCount: layers.length,
    recordCount: layers.reduce((sum, layer) => sum + Number(layer.record_count || 0), 0),
    chunkCount: layers.reduce((sum, layer) => sum + Number(layer.chunks?.length || 0), 0),
    fileCount: files.fileCount,
    totalBytes: files.totalBytes,
    totalMb: formatMbNumber(files.totalBytes),
    byExtension: files.byExtension,
  };
}

async function summarizeStaticFiles(dir) {
  const summary = { fileCount: 0, totalBytes: 0, byExtension: {} };
  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(path);
      } else if (entry.isFile()) {
        const fileStat = await stat(path);
        const extension = extname(path) || "(none)";
        summary.fileCount += 1;
        summary.totalBytes += fileStat.size;
        summary.byExtension[extension] ||= { fileCount: 0, totalBytes: 0, totalMb: 0 };
        summary.byExtension[extension].fileCount += 1;
        summary.byExtension[extension].totalBytes += fileStat.size;
        summary.byExtension[extension].totalMb = formatMbNumber(summary.byExtension[extension].totalBytes);
      }
    }
  }
  await visit(dir);
  return summary;
}

async function serveStatic(root, requestedPort) {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://127.0.0.1:${requestedPort}`);
      const rawPathname = decodeURIComponent(url.pathname);
      const pathname = routePathToAppPath(rawPathname);
      if (pathname === null) {
        response.writeHead(404).end("Not found");
        return;
      }
      const servingData = pathname === "/data" || pathname.startsWith("/data/");
      const filePath = servingData
        ? resolve(dataDir, `.${pathname.slice("/data".length) || "/manifest.json"}`)
        : resolve(root, `.${pathname}`);
      const allowedRoot = servingData ? dataDir : root;
      if (!isPathInside(filePath, allowedRoot)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": MIME_TYPES[extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(requestedPort, "127.0.0.1", resolveListen);
  });
  return server;
}

function routePathToAppPath(pathname) {
  if (pathname === "/") return "/index.html";
  if (!basePath) return pathname === "/" ? "/index.html" : pathname;
  if (pathname === basePath || pathname === `${basePath}/`) return "/index.html";
  if (pathname.startsWith(`${basePath}/`)) {
    const appPath = pathname.slice(basePath.length);
    return appPath === "/" ? "/index.html" : appPath;
  }
  return null;
}

function isPathInside(path, root) {
  const rel = relative(root, path);
  return rel === "" || (!rel.startsWith("..") && !normalize(rel).startsWith(".."));
}

function findChromeExecutable() {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error("Chrome/Chromium executable not found. Pass --chrome-path /path/to/chrome.");
  }
  return found;
}

async function installLocalRoutes(context, network) {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
      network.local.push(request.url());
      await route.continue();
      return;
    }
    if (!args.offlineAssets && isProductionExternalAsset(url)) {
      network.externalAssets.push(request.url());
      await route.continue();
      return;
    }
    if (args.offlineAssets && url.hostname === "unpkg.com" && url.pathname.includes("/leaflet@1.9.4/dist/leaflet.css")) {
      network.assetsStubbed.push(request.url());
      await route.fulfill({
        status: 200,
        contentType: "text/css; charset=utf-8",
        path: join(ROOT, "node_modules", "leaflet", "dist", "leaflet.css"),
      });
      return;
    }
    if (args.offlineAssets && url.hostname === "unpkg.com" && url.pathname.includes("/leaflet@1.9.4/dist/leaflet.js")) {
      network.assetsStubbed.push(request.url());
      await route.fulfill({
        status: 200,
        contentType: "text/javascript; charset=utf-8",
        path: join(ROOT, "node_modules", "leaflet", "dist", "leaflet.js"),
      });
      return;
    }
    if (args.offlineAssets && url.hostname.endsWith("tile.openstreetmap.org")) {
      network.assetsStubbed.push(request.url());
      await route.fulfill({ status: 200, contentType: "image/png", body: TRANSPARENT_PNG });
      return;
    }
    if (isCivicProviderRequest(url)) {
      network.providerViolations.push(request.url());
      await route.abort("blockedbyclient");
      return;
    }
    network.blocked.push(request.url());
    await route.abort("blockedbyclient");
  });
}

function isProductionExternalAsset(url) {
  return url.hostname === "unpkg.com" || url.hostname.endsWith("tile.openstreetmap.org");
}

function isCivicProviderRequest(url) {
  return CIVIC_PROVIDER_PATTERNS.some((pattern) => url.hostname.includes(pattern));
}

async function installBrowserInstrumentation(page) {
  await page.addInitScript(() => {
    window.__perfMarks = [];
    window.__longTasks = [];
    window.__eventTimings = [];
    window.__perfErrors = [];
    window.addEventListener("error", (event) => {
      window.__perfErrors.push(String(event.message || event.error || "error"));
    });
    window.addEventListener("unhandledrejection", (event) => {
      window.__perfErrors.push(String(event.reason || "unhandled rejection"));
    });
    try {
      new PerformanceObserver((list) => {
        window.__longTasks.push(
          ...list.getEntries().map((entry) => ({
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
          })),
        );
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // LongTask is not available in every browser mode.
    }
    try {
      new PerformanceObserver((list) => {
        window.__eventTimings.push(
          ...list.getEntries().map((entry) => ({
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            interactionId: entry.interactionId,
          })),
        );
      }).observe({ type: "event", buffered: true, durationThreshold: 16 });
    } catch {
      // Event Timing is not available in every browser mode.
    }
    window.waitForPerfCondition = async (callback, timeoutMs = 10000) => {
      const start = performance.now();
      while (performance.now() - start < timeoutMs) {
        if (callback()) return performance.now() - start;
        await new Promise((resolve) => setTimeout(resolve, 16));
      }
      return null;
    };
    window.waitForDataSummary = async () =>
      window.waitForPerfCondition(() => {
        const total = Array.from(state.recordsByLayer.values()).reduce((sum, features) => sum + features.length, 0);
        const summaryText = document.querySelector("#summary")?.innerText || "";
        return total > 0 && summaryText.includes(`Showing ${total.toLocaleString()} of`);
      });
    window.__collectPerfAppState = () => {
      const records = Array.from(state.recordsByLayer.entries()).map(([layerId, features]) => [layerId, features.length]);
      const rawRecords = Array.from(state.rawGeoJsonByLayer.entries()).map(([layerId, geojson]) => [
        layerId,
        geojson?.features?.length || 0,
      ]);
      return {
        status: document.querySelector("#status-pill")?.textContent?.trim(),
        inspectionCount: document.querySelector("#inspection-count")?.textContent?.trim(),
        summaryTextLength: document.querySelector("#summary")?.innerText?.length || 0,
        activeLayerCount: state.selectedLayerIds.size,
        renderedLayerCount: state.leafletLayers.size,
        recordCount: records.reduce((sum, [, count]) => sum + count, 0),
        rawRecordCount: rawRecords.reduce((sum, [, count]) => sum + count, 0),
        recordsByLayer: Object.fromEntries(records),
        rawRecordsByLayer: Object.fromEntries(rawRecords),
        snapshotMode: state.snapshot.mode,
        liveFallbacks: Array.from(state.snapshot.liveFallbacks),
        skippedLayers: Array.from(state.snapshot.skippedLayers),
        prefetchCappedLayers: LAYERS.filter((layer) => layer.snapshotPrefetchCapped).map((layer) => layer.label),
        displayCappedLayers: LAYERS.filter((layer) => layer.snapshotDisplayCapped).map((layer) => layer.label),
      };
    };
  });
}

async function runColdLoad(page, session) {
  const started = performance.now();
  const milestones = {};
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  milestones.dom_content_loaded_wall_ms = performance.now() - started;
  await page.waitForSelector("#map", { state: "visible", timeout: 15000 });
  milestones.map_container_visible_wall_ms = performance.now() - started;
  await page.waitForFunction(() => Boolean(window.L && document.querySelector("#map .leaflet-pane")), null, { timeout: 15000 });
  milestones.leaflet_ready_wall_ms = performance.now() - started;
  await page.waitForFunction(() => !document.querySelector("#refresh-button").disabled, null, { timeout: 15000 });
  milestones.controls_ready_wall_ms = performance.now() - started;
  await page.waitForFunction(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    return navigation && navigation.loadEventEnd > 0;
  }, null, { timeout: 15000 });
  milestones.load_event_wall_ms = performance.now() - started;
  await settleFrames(page);
  return buildScenario("cold-load", started, { ...(await collectPageMetrics(page, session, { includeNavigation: true })), milestones });
}

async function runRefreshScenario(page, session, name, options) {
  await loadFreshApp(page);
  await resetMeasurementBuffers(page);
  const started = performance.now();
  const result = await page.evaluate(async ({ place, radius, allLayers }) => {
    const milestones = {};
    const start = performance.now();
    if (allLayers) {
      document.querySelectorAll("#layer-toggles input[type='checkbox']").forEach((input) => {
        if (!input.checked) input.click();
      });
    }
    document.querySelector("#radius-input").value = String(radius);
    state.radius = Number(radius);
    window.setSelectedPlace(place.lat, place.lon, place.label);
    milestones.selection_graphics_ms = performance.now() - start;
    const refreshPromise = window.refreshData();
    milestones.fetching_status_ms = await window.waitForPerfCondition(() =>
      document.querySelector("#status-pill")?.textContent?.includes("Fetching"),
    );
    milestones.first_records_visible_ms = await window.waitForPerfCondition(() =>
      Array.from(state.recordsByLayer.values()).some((features) => features.length > 0),
    );
    const summaryReachedMs = await window.waitForDataSummary();
    milestones.summary_visible_ms = summaryReachedMs === null ? null : performance.now() - start;
    await refreshPromise;
    milestones.refresh_promise_resolved_ms = performance.now() - start;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    milestones.render_settled_ms = performance.now() - start;
    return { state: window.__collectPerfAppState(), milestones };
  }, { place: DEFAULT_PLACE, radius: options.radius, allLayers: options.allLayers });
  const metrics = await collectPageMetrics(page, session);
  return buildScenario(name, started, { ...metrics, app: result.state, milestones: result.milestones });
}

async function runRedrawScenario(page, session, name, options) {
  await prepareRefreshState(page, options);
  await resetMeasurementBuffers(page);
  const started = performance.now();
  const result = await page.evaluate(async () => {
    const measures = [];
    function measure(label, callback) {
      const start = performance.now();
      callback();
      const durationMs = performance.now() - start;
      measures.push({ label, durationMs });
    }
    measure("period-last-year", () => {
      document.querySelector("#period-filter").value = "365";
      window.readFilters();
      window.redrawFromRawData();
    });
    measure("open-permits", () => {
      document.querySelector("#completion-filter").value = "open";
      window.readFilters();
      window.redrawFromRawData();
    });
    measure("traffic-study-type", () => {
      document.querySelector("#traffic-type-filter").value = "SPD";
      window.readFilters();
      window.redrawFromRawData();
    });
    measure("traffic-visual-style", () => {
      document.querySelector("#traffic-type-filter").value = "all";
      document.querySelector("#traffic-color-by").value = "study-type";
      document.querySelector("#traffic-size-by").value = "speed";
      document.querySelector("#traffic-line-metric").value = "count";
      window.readFilters();
      document.querySelector("#traffic-color-by").dispatchEvent(new Event("change", { bubbles: true }));
      document.querySelector("#traffic-size-by").dispatchEvent(new Event("change", { bubbles: true }));
      document.querySelector("#traffic-line-metric").dispatchEvent(new Event("change", { bubbles: true }));
    });
    measure("clear-filters", () => {
      document.querySelector("#period-filter").value = "all";
      document.querySelector("#completion-filter").value = "all";
      document.querySelector("#traffic-type-filter").value = "all";
      document.querySelector("#traffic-color-by").value = "speed";
      document.querySelector("#traffic-size-by").value = "volume";
      document.querySelector("#traffic-line-metric").value = "volume";
      window.readFilters();
      window.readVisualSettings();
      window.redrawFromRawData();
    });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { measures, state: window.__collectPerfAppState() };
  });
  const metrics = await collectPageMetrics(page, session);
  return buildScenario(name, started, { ...metrics, app: result.state, redrawMeasures: result.measures });
}

async function runInteractionStressScenario(page, session, name, options) {
  await prepareRefreshState(page, options);
  await resetMeasurementBuffers(page);
  const started = performance.now();
  const result = await page.evaluate(async () => {
    const measures = [];
    function measure(label, callback) {
      const start = performance.now();
      callback();
      measures.push({ label, durationMs: performance.now() - start });
    }
    for (let index = 0; index < 12; index += 1) {
      measure(`toggle-traffic-lines-${index + 1}`, () => {
        const input = document.querySelector("#traffic-lines-toggle");
        input.click();
      });
    }
    for (const period of ["30", "90", "365", "all"]) {
      measure(`period-${period}`, () => {
        const input = document.querySelector("#period-filter");
        input.value = period;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }
    const start = performance.now();
    map.panBy([90, -70], { animate: false });
    map.panBy([-90, 70], { animate: false });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    measures.push({ label: "pan-roundtrip", durationMs: performance.now() - start });
    return { measures, state: window.__collectPerfAppState() };
  });
  const metrics = await collectPageMetrics(page, session);
  return buildScenario(name, started, { ...metrics, app: result.state, interactionMeasures: result.measures });
}

async function runMapInteractionScenario(page, session, options) {
  await prepareRefreshState(page, options);
  await resetMeasurementBuffers(page);
  const started = performance.now();
  const mapBox = await page.locator("#map").boundingBox();
  const result = await page.evaluate(async () => {
    const start = performance.now();
    map.panBy([160, 90], { animate: false });
    map.setZoom(map.getZoom() + 1, { animate: false });
    map.setZoom(map.getZoom() - 1, { animate: false });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { scriptedMapInteractionMs: performance.now() - start, state: window.__collectPerfAppState() };
  });

  if (mapBox) {
    await page.mouse.click(mapBox.x + mapBox.width * 0.58, mapBox.y + mapBox.height * 0.52);
    await page.waitForFunction(() => !document.querySelector("#refresh-button").disabled, null, { timeout: 20000 });
  }

  const metrics = await collectPageMetrics(page, session);
  return buildScenario("map-pan-zoom-click", started, {
    ...metrics,
    scriptedMapInteractionMs: result.scriptedMapInteractionMs,
    app: await page.evaluate(() => window.__collectPerfAppState()),
  });
}

async function loadFreshApp(page) {
  await page.goto(baseUrl, { waitUntil: "load" });
  await page.waitForSelector("#map", { state: "visible", timeout: 15000 });
  await page.waitForFunction(() => Boolean(window.L && document.querySelector("#map .leaflet-pane")), null, { timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector("#refresh-button").disabled, null, { timeout: 15000 });
  await settleFrames(page);
}

async function prepareRefreshState(page, options) {
  await loadFreshApp(page);
  await page.evaluate(async ({ place, radius, allLayers }) => {
    if (allLayers) {
      document.querySelectorAll("#layer-toggles input[type='checkbox']").forEach((input) => {
        if (!input.checked) input.click();
      });
    }
    document.querySelector("#radius-input").value = String(radius);
    state.radius = Number(radius);
    window.setSelectedPlace(place.lat, place.lon, place.label);
    await window.refreshData();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, { place: DEFAULT_PLACE, radius: options.radius, allLayers: options.allLayers });
}

async function resetMeasurementBuffers(page) {
  await page.evaluate(() => {
    performance.clearResourceTimings();
    window.__longTasks = [];
    window.__eventTimings = [];
    window.__perfErrors = [];
  });
}

async function settleFrames(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function collectPageMetrics(page, session, options = {}) {
  const browserMetrics = await session.send("Performance.getMetrics");
  const heap = await session.send("Runtime.getHeapUsage").catch(() => null);
  const pageMetrics = await page.evaluate((includeNavigation) => {
    const resources = performance.getEntriesByType("resource").map((entry) => ({
      name: entry.name,
      initiatorType: entry.initiatorType,
      duration: entry.duration,
      transferSize: entry.transferSize || 0,
      decodedBodySize: entry.decodedBodySize || 0,
    }));
    const navigation = includeNavigation
      ? performance.getEntriesByType("navigation").map((entry) => ({
          domContentLoadedMs: entry.domContentLoadedEventEnd,
          loadEventMs: entry.loadEventEnd,
          responseEndMs: entry.responseEnd,
          transferSize: entry.transferSize || 0,
          decodedBodySize: entry.decodedBodySize || 0,
        }))[0]
      : null;
    return {
      navigation,
      resourceCount: resources.length,
      dataResourceCount: resources.filter((entry) => entry.name.includes("/data/")).length,
      dataDecodedBytes: resources
        .filter((entry) => entry.name.includes("/data/"))
        .reduce((sum, entry) => sum + entry.decodedBodySize, 0),
      slowestResources: resources
        .slice()
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      longTasks: window.__longTasks.slice(),
      eventTimings: window.__eventTimings.slice(-20),
      pageErrors: window.__perfErrors.slice(),
    };
  }, Boolean(options.includeNavigation));

  return {
    ...pageMetrics,
    browserMetrics: Object.fromEntries(browserMetrics.metrics.map((entry) => [entry.name, entry.value])),
    heap,
  };
}

function buildScenario(name, started, payload) {
  const durationMs = performance.now() - started;
  return {
    name,
    durationMs,
    ...payload,
    warnings: scenarioWarnings(name, durationMs, payload),
  };
}

function scenarioWarnings(name, durationMs, payload) {
  const warnings = [];
  if (durationMs > 10000) warnings.push(`${name} took ${Math.round(durationMs)} ms`);
  if ((payload.longTasks || []).some((task) => task.duration > 250)) warnings.push(`${name} had a >250 ms long task`);
  if (payload.app?.liveFallbacks?.length) warnings.push(`${name} used live fallback: ${payload.app.liveFallbacks.join(", ")}`);
  if (payload.pageErrors?.length) warnings.push(`${name} had page errors`);
  return warnings;
}

function summarize(report) {
  const warnings = report.scenarios.flatMap((scenario) => scenario.warnings || []);
  return {
    scenarioCount: report.scenarios.length,
    providerViolationCount: report.network.providerViolations.length,
    localRequestCount: report.network.local.length,
    externalAssetRequestCount: report.network.externalAssets.length,
    stubbedAssetCount: report.network.assetsStubbed.length,
    blockedRequestCount: report.network.blocked.length,
    maxScenarioDurationMs: Math.max(...report.scenarios.map((scenario) => scenario.durationMs)),
    maxLongTaskMs: Math.max(0, ...report.scenarios.flatMap((scenario) => scenario.longTasks || []).map((task) => task.duration)),
    budgetWarnings: warnings,
  };
}

function scenarioMetricRow(scenario) {
  const longTasks = scenario.longTasks || [];
  const taskDurations = longTasks.map((task) => task.duration);
  const app = scenario.app || {};
  const row = {
    scenario: scenario.name,
    duration_ms: round(scenario.durationMs),
    dom_content_loaded_ms: round(scenario.navigation?.domContentLoadedMs),
    load_event_ms: round(scenario.navigation?.loadEventMs),
    data_resource_count: scenario.dataResourceCount || 0,
    data_decoded_mb: formatMbNumber(scenario.dataDecodedBytes || 0),
    resource_count: scenario.resourceCount || 0,
    long_task_count: longTasks.length,
    max_long_task_ms: round(Math.max(0, ...taskDurations)),
    total_long_task_ms: round(taskDurations.reduce((sum, value) => sum + value, 0)),
    js_heap_used_mb: formatMbNumber((scenario.browserMetrics?.JSHeapUsedSize || 0)),
    nodes: round(scenario.browserMetrics?.Nodes),
    js_event_listeners: round(scenario.browserMetrics?.JSEventListeners),
    active_layer_count: app.activeLayerCount ?? "",
    rendered_layer_count: app.renderedLayerCount ?? "",
    record_count: app.recordCount ?? "",
    raw_record_count: app.rawRecordCount ?? "",
    live_fallback_count: app.liveFallbacks?.length ?? "",
    skipped_layer_count: app.skippedLayers?.length ?? "",
    prefetch_capped_layer_count: app.prefetchCappedLayers?.length ?? "",
    display_capped_layer_count: app.displayCappedLayers?.length ?? "",
    page_error_count: scenario.pageErrors?.length || 0,
    warning_count: scenario.warnings?.length || 0,
  };
  if (scenario.redrawMeasures?.length) {
    row.redraw_measure_count = scenario.redrawMeasures.length;
    row.max_redraw_measure_ms = round(Math.max(...scenario.redrawMeasures.map((measure) => measure.durationMs)));
    row.total_redraw_measure_ms = round(scenario.redrawMeasures.reduce((sum, measure) => sum + measure.durationMs, 0));
  }
  if (scenario.interactionMeasures?.length) {
    row.interaction_measure_count = scenario.interactionMeasures.length;
    row.max_interaction_measure_ms = round(Math.max(...scenario.interactionMeasures.map((measure) => measure.durationMs)));
    row.total_interaction_measure_ms = round(scenario.interactionMeasures.reduce((sum, measure) => sum + measure.durationMs, 0));
  }
  for (const [key, value] of Object.entries(scenario.milestones || {})) {
    row[key] = round(value);
  }
  return row;
}

function renderMarkdown(report) {
  const lines = [
    "# Local Performance Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Surface: ${report.appUrl}`,
    `Route mode: ${report.basePath || "/"} with ${report.assetMode} assets`,
    `Data dir: ${report.dataDir}`,
    `Local data: ${report.localData.layerCount} layers, ${report.localData.recordCount.toLocaleString()} records, ${report.localData.fileCount.toLocaleString()} files, ${report.localData.totalMb} MB on disk`,
    "",
    "## Summary",
    "",
    `- Civic provider requests: ${report.summary.providerViolationCount}`,
    `- Local requests: ${report.summary.localRequestCount}`,
    `- Production external asset requests: ${report.summary.externalAssetRequestCount}`,
    `- Stubbed assets: ${report.summary.stubbedAssetCount}`,
    `- Max scenario duration: ${Math.round(report.summary.maxScenarioDurationMs)} ms`,
    `- Max long task: ${Math.round(report.summary.maxLongTaskMs)} ms`,
    "",
    "## Scenarios",
    "",
    "| Scenario | Duration ms | Records | Rendered layers | Data resources | Data decoded MB | Long tasks | Max long task ms | JS heap MB | Warnings |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ];

  for (const scenario of report.scenarios) {
    const row = scenarioMetricRow(scenario);
    lines.push(
      `| ${scenario.name} | ${row.duration_ms} | ${row.record_count} | ${row.rendered_layer_count} | ${row.data_resource_count} | ${row.data_decoded_mb} | ${row.long_task_count} | ${row.max_long_task_ms} | ${row.js_heap_used_mb} | ${(scenario.warnings || []).join("<br>")} |`,
    );
  }

  lines.push("", "## Redraw Measures", "");
  for (const scenario of report.scenarios.filter((entry) => entry.redrawMeasures)) {
    lines.push(`### ${scenario.name}`, "");
    for (const measure of scenario.redrawMeasures) {
      lines.push(`- ${measure.label}: ${Math.round(measure.durationMs)} ms`);
    }
    lines.push("");
  }

  lines.push("## Interaction Measures", "");
  for (const scenario of report.scenarios.filter((entry) => entry.interactionMeasures)) {
    lines.push(`### ${scenario.name}`, "");
    const slowest = scenario.interactionMeasures
      .slice()
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 10);
    for (const measure of slowest) {
      lines.push(`- ${measure.label}: ${Math.round(measure.durationMs)} ms`);
    }
    lines.push("");
  }

  lines.push("## UX Milestones", "");
  for (const scenario of report.scenarios.filter((entry) => entry.milestones)) {
    lines.push(`### ${scenario.name}`, "");
    for (const [label, value] of Object.entries(scenario.milestones)) {
      lines.push(`- ${label}: ${value === null ? "not reached" : `${Math.round(value)} ms`}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function formatMb(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

function formatMbNumber(bytes) {
  return Number(formatMb(bytes));
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value) : "";
}

function renderScenarioCsv(report) {
  const rows = report.scenarios.map(scenarioMetricRow);
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
    "",
  ].join("\n");
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function printConsoleSummary(report, jsonPath, markdownPath, csvPath) {
  console.log(`Wrote ${pathToFileURL(jsonPath).href}`);
  console.log(`Wrote ${pathToFileURL(markdownPath).href}`);
  console.log(`Wrote ${pathToFileURL(csvPath).href}`);
  console.log(`Scenarios: ${report.summary.scenarioCount}`);
  console.log(`Civic provider requests: ${report.summary.providerViolationCount}`);
  console.log(`Production external asset requests: ${report.summary.externalAssetRequestCount}`);
  console.log(`Stubbed asset requests: ${report.summary.stubbedAssetCount}`);
  console.log(`Max scenario duration: ${Math.round(report.summary.maxScenarioDurationMs)} ms`);
  console.log(`Max long task: ${Math.round(report.summary.maxLongTaskMs)} ms`);
  if (report.summary.budgetWarnings.length) {
    console.log("Warnings:");
    for (const warning of report.summary.budgetWarnings) console.log(`- ${warning}`);
  }
}

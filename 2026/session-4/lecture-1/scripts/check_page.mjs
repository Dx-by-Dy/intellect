#!/usr/bin/env node
// Smoke test for docs/index.html in headless Chrome, driven over the DevTools protocol.
// Needs Node 22+ (built-in WebSocket) and a Chrome binary.
//
// Usage: node scripts/check_page.mjs [path/to/chrome]
// Chrome is also taken from $CHROME, otherwise from ~/.cache/puppeteer.
// Screenshots go to .check/ (git-ignored).

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = pathToFileURL(join(ROOT, "docs", "index.html")).href;
const OUT = join(ROOT, ".check");

function findChrome() {
  if (process.argv[2]) return process.argv[2];
  if (process.env.CHROME) return process.env.CHROME;
  const base = join(homedir(), ".cache", "puppeteer");
  for (const [kind, sub, bin] of [
    ["chrome-headless-shell", "chrome-headless-shell-linux64", "chrome-headless-shell"],
    ["chrome", "chrome-linux64", "chrome"],
  ]) {
    const dir = join(base, kind);
    if (!existsSync(dir)) continue;
    const versions = readdirSync(dir).sort().reverse();
    for (const v of versions) {
      const p = join(dir, v, sub, bin);
      if (existsSync(p)) return p;
    }
  }
  throw new Error("Chrome not found: pass its path as an argument or set $CHROME");
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch(chrome) {
  const profile = join(OUT, "profile");
  rmSync(profile, { recursive: true, force: true });
  const proc = spawn(chrome, [
    "--headless", "--no-first-run", "--no-default-browser-check", "--disable-gpu",
    "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  const wsUrl = await new Promise((res, rej) => {
    let buf = "";
    const t = setTimeout(() => rej(new Error("Chrome did not print a DevTools URL within 15 s")), 15000);
    proc.stderr.on("data", d => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(t); res(m[1]); }
    });
    proc.on("exit", c => rej(new Error(`Chrome exited with code ${c}`)));
  });
  return { proc, wsUrl };
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.wait = new Map(); this.handlers = []; }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && c.wait.has(m.id)) {
        const { res, rej } = c.wait.get(m.id); c.wait.delete(m.id);
        m.error ? rej(new Error(`${m.error.message}`)) : res(m.result);
      } else if (m.method) c.handlers.forEach(h => h(m));
    };
    return c;
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((res, rej) => this.wait.set(id, { res, rej }));
  }
}

const failures = [];
function check(cond, what) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${what}`);
  if (!cond) failures.push(what);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { proc, wsUrl } = await launch(findChrome());
  const cdp = await CDP.connect(wsUrl);
  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    const S = (m, p) => cdp.send(m, p, sessionId);
    const errors = [];
    cdp.handlers.push(m => {
      if (m.sessionId !== sessionId) return;
      if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map(a => a.value ?? a.description).join(" "));
      if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/fonts\.(googleapis|gstatic)/.test(m.params.entry.url || ""))
        errors.push(`${m.params.entry.text} ${m.params.entry.url || ""}`);
    });
    await S("Runtime.enable"); await S("Log.enable"); await S("Page.enable");

    const evaluate = async expr => {
      const r = await S("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(`evaluate failed: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
      return r.result.value;
    };
    const setViewport = (width, height, mobile, dark) => Promise.all([
      S("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile }),
      S("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }] }),
    ]);
    const load = async () => { await S("Page.navigate", { url: PAGE }); await sleep(2500); };
    const shot = async (name, selector) => {
      if (selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block: "start", behavior: "instant"})`); await sleep(300); }
      const { data } = await S("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(OUT, `${name}.png`), Buffer.from(data, "base64"));
    };
    const noOverflow = () => evaluate(`document.documentElement.scrollWidth <= window.innerWidth`);

    // ---- desktop, light: functional checks ----
    await setViewport(1280, 900, false, false);
    await load();
    check(await evaluate(`document.compatMode`) === "CSS1Compat", "page renders in standards mode");
    check(await noOverflow(), "desktop: no horizontal page scroll");
    check(await evaluate(`document.querySelectorAll("#rep-svg [data-v]").length`) === 8, "representation graph shows 8 vertices");

    await evaluate(`document.querySelector('#rep-matrix button[data-i="1"][data-j="4"]').click()`);
    check((await evaluate(`document.getElementById("rep-nm").textContent`)) === "n = 8, m = 11", "matrix click adds an edge (m = 11)");
    check(await evaluate(`document.querySelector('#rep-matrix button[data-i="4"][data-j="1"]').textContent`) === "1", "undirected edge is mirrored in the matrix");
    await evaluate(`document.querySelector('#rep-matrix button[data-i="1"][data-j="4"]').click()`);
    check((await evaluate(`document.getElementById("rep-nm").textContent`)) === "n = 8, m = 10", "second click removes the edge");

    const runToEnd = id => evaluate(`(() => { const b = document.querySelector('#${id} [data-role="next"]'); let k = 0; while (!b.disabled && k < 1000) { b.click(); k++; } return k; })()`);
    const msg = id => evaluate(`document.querySelector('#${id} [data-role="msg"]').textContent`);
    const steps = await runToEnd("dfs-player");
    check(steps > 10, `DFS player steps through to the end (${steps} clicks)`);
    check((await msg("dfs-player")).includes("достижимы 8 вершин"), "DFS final message: 8 vertices reachable");
    const order = await evaluate(`[...document.querySelectorAll('#dfs-player svg .lab text')].map(t => t.textContent).join(",")`);
    check(order === "1,2,4,3,8,7,5,6", `DFS entry order labels match the quiz answer (${order})`);

    await runToEnd("bfs-player");
    await evaluate(`document.querySelector('#bfs-player svg [data-v="8"]').dispatchEvent(new MouseEvent("click", {bubbles: true}))`);
    check((await msg("bfs-player")).includes("1 → 3 → 7 → 8"), "BFS path to vertex 8 is 1 → 3 → 7 → 8");
    check(await evaluate(`document.querySelectorAll('#bfs-player svg .e.path').length`) === 3, "BFS path highlights 3 edges");
    await shot("desktop-bfs", "#bfs");

    await evaluate(`(() => { const s = document.querySelector('#dfs-player .preset-select'); s.value = "comps"; s.dispatchEvent(new Event("change")); const a = document.querySelector('#dfs-player [data-role="all"]'); a.checked = true; a.dispatchEvent(new Event("change")); })()`);
    await runToEnd("dfs-player");
    check((await msg("dfs-player")).includes("3 компоненты"), "DFS all-components mode finds 3 components");
    check(await evaluate(`document.getElementById("rep-nm").textContent`) === "n = 9, m = 7", "preset change propagates to the representation section");
    await shot("desktop-dfs-components", "#dfs");

    await evaluate(`(() => { const s = document.getElementById("rep-preset"); s.value = "example"; s.dispatchEvent(new Event("change")); })()`);
    await evaluate(`document.getElementById("grid-run").click()`);
    await sleep(5000);
    check((await evaluate(`document.getElementById("grid-msg").textContent`)).startsWith("Кратчайший путь от S до F"), "grid BFS wave reaches the finish");
    check(await evaluate(`document.querySelectorAll("#field .cell.path").length`) > 0, "grid BFS draws the path");
    await shot("desktop-grid", "#grid");

    check(await evaluate(`document.querySelectorAll("#levels li a").length`) === 37, "problem list has 37 links");
    await load();
    await shot("desktop-top");
    await shot("desktop-store", "#store");
    await shot("desktop-practice", "#practice");

    // ---- desktop, dark ----
    await setViewport(1280, 900, false, true);
    await load();
    check(await evaluate(`getComputedStyle(document.body).backgroundColor`) === "rgb(16, 20, 27)", "dark theme applies to the page background");
    await shot("dark-store", "#store");
    await shot("dark-dfs", "#dfs");

    // ---- phone ----
    await setViewport(390, 844, true, false);
    await load();
    check(await noOverflow(), "phone: no horizontal page scroll");
    await shot("phone-top");
    await shot("phone-store", "#store");
    await shot("phone-dfs", "#dfs-player");
    await shot("phone-grid", "#grid");

    check(errors.length === 0, `no JavaScript errors${errors.length ? ": " + errors.join(" | ") : ""}`);
  } finally {
    proc.kill();
  }
  console.log(failures.length ? `\n${failures.length} check(s) failed` : "\nAll checks passed");
  console.log(`Screenshots: ${OUT}`);
  process.exit(failures.length ? 1 : 0);
}

main().catch(e => { console.error(`error: ${e.message}`); process.exit(2); });

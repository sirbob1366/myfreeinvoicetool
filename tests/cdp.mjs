// Minimal Chrome DevTools Protocol driver (no dependencies — uses Node's
// built-in WebSocket). Usage:
//   node tests/cdp.mjs <url> [--shot out.png] [--wait ms] [--expr "JS expression"] [--expr-file f.js]
//   node tests/cdp.mjs --script steps.json     (steps: [{url, expr|exprFile, wait, shot}, …]
//                                               — one browser session, IndexedDB persists)
// Prints console messages, page errors, and the result of each expression.

import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const url = args[0];
const shotIdx = args.indexOf('--shot');
const shotPath = shotIdx > -1 ? args[shotIdx + 1] : null;
const waitIdx = args.indexOf('--wait');
const waitMs = waitIdx > -1 ? +args[waitIdx + 1] : 2500;
const exprIdx = args.indexOf('--expr');
let expr = exprIdx > -1 ? args[exprIdx + 1] : null;
const exprFileIdx = args.indexOf('--expr-file');
if (exprFileIdx > -1) expr = readFileSync(args[exprFileIdx + 1], 'utf8');

const port = 9222 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\cdp-profile-${port}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('Chrome did not start');
}

let msgId = 0;
const pending = new Map();

function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

try {
  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

  const logs = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      logs.push(`[console.${msg.params.type}] ${msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      logs.push(`[EXCEPTION] ${d.text} ${d.exception?.description || ''}`);
    }
  };

  await send(ws, 'Runtime.enable');
  await send(ws, 'Page.enable');

  const scriptIdx = args.indexOf('--script');
  const steps = scriptIdx > -1
    ? JSON.parse(readFileSync(args[scriptIdx + 1], 'utf8'))
    : [{ url, expr, wait: waitMs, shot: shotPath }];

  for (const [i, step] of steps.entries()) {
    if (step.size) {
      const [w, h] = step.size.split('x').map(Number);
      await send(ws, 'Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    }
    if (step.reducedMotion) {
      await send(ws, 'Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      });
    }
    if (step.offline !== undefined) {
      await send(ws, 'Network.enable');
      await send(ws, 'Network.emulateNetworkConditions', {
        offline: !!step.offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
      });
    }
    if (step.url) await send(ws, 'Page.navigate', { url: step.url }); // url:null = stay on current page
    await sleep(step.wait ?? 2500);
    const stepExpr = step.exprFile ? readFileSync(step.exprFile, 'utf8') : step.expr;
    if (stepExpr) {
      const res = await send(ws, 'Runtime.evaluate', { expression: stepExpr, returnByValue: true, awaitPromise: true });
      console.log(`EXPR[${i}]:`, JSON.stringify(res.result.value ?? res.result.description));
    }
    if (step.shot) {
      if (!step.size) {
        await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 1440, height: 2200, deviceScaleFactor: 1, mobile: false });
      }
      const shot = await send(ws, 'Page.captureScreenshot', { format: step.shot.endsWith('.webp') ? 'webp' : 'png' });
      writeFileSync(step.shot, Buffer.from(shot.data, 'base64'));
      console.log(`SHOT[${i}]:`, step.shot);
    }
  }

  console.log(logs.length ? logs.join('\n') : '(no console output)');
  ws.close();
} catch (err) {
  console.error('DRIVER ERROR:', err.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
}

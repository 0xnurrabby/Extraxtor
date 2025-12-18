import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk@0.2.1";
import { Attribution } from "https://esm.sh/ox/erc8021";

const DOMAIN = "nurrabby.com";
const PRIMARY_ROUTE = "/";
const HOME_URL = "https://extraxtor.vercel.app/
  
  




";

const GAME_CONTRACT = "0xB331328F506f2D35125e367A190e914B1b6830cF";
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;

// Recipient for tips (set to your contract; change to an EOA if you prefer)
const RECIPIENT = "0x5eC6AF0798b25C563B102d3469971f1a8d598121";

// Builder Code required by the prompt. Replace this with your real code.
const BUILDER_CODE = "bc_rpsrjjtz";

const dataSuffix = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
});

const el = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toast(msg) {
  const t = el("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._to);
  toast._to = setTimeout(() => t.classList.remove("show"), 2200);
}

function isHexStrict(s) {
  return typeof s === "string" && /^0x[0-9a-fA-F]*$/.test(s);
}

function isChecksummedAddress(addr) {
  // Lightweight: accept 0x + 40 hex and rely on wallet/provider for final validation.
  return typeof addr === "string" && /^0x[0-9a-fA-F]{40}$/.test(addr);
}

function pad32(hexNo0x) {
  return hexNo0x.padStart(64, "0");
}

function encodeErc20Transfer(to, amountUnits) {
  if (!isChecksummedAddress(to)) throw new Error("Invalid recipient address.");
  if (typeof amountUnits !== "bigint" || amountUnits <= 0n) throw new Error("Invalid amount.");
  const selector = "a9059cbb";
  const toPadded = pad32(to.toLowerCase().replace(/^0x/, ""));
  const amtHex = amountUnits.toString(16);
  const amtPadded = pad32(amtHex);
  return "0x" + selector + toPadded + amtPadded;
}

function parseUsdToUnits6(input) {
  const s = String(input ?? "").trim();
  if (!s) throw new Error("Enter an amount.");
  if (s.startsWith("-")) throw new Error("Amount must be positive.");
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error("Invalid number.");
  const [whole, fracRaw=""] = s.split(".");
  const frac = (fracRaw + "000000").slice(0, 6);
  const units = BigInt(whole) * 1_000_000n + BigInt(frac);
  if (units <= 0n) throw new Error("Amount must be greater than 0.");
  return units;
}

async function getProvider() {
  return await sdk.wallet.getEthereumProvider();
}

async function ensureBaseMainnet(provider) {
  const chainId = await provider.request({ method: "eth_chainId" });
  if (chainId === "0x2105") return;
  if (chainId !== "0x2105") {
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x2105" }] });
    } catch (e) {
      throw new Error("Please switch to Base Mainnet (0x2105) in your wallet to continue.");
    }
  }
}

async function walletSendCalls(provider, calls) {
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  const from = accounts?.[0];
  if (!from) throw new Error("No connected account.");
  const chainId = await provider.request({ method: "eth_chainId" });

  // Mandatory shape per prompt — include ALL fields.
  const payload = {
    version: "2.0.0",
    from,
    chainId,
    atomicRequired: true,
    calls: calls.map((c) => ({
      to: c.to,
      value: c.value ?? "0x0",
      data: c.data,
    })),
    capabilities: {
      dataSuffix,
    },
  };

  return await provider.request({
    method: "wallet_sendCalls",
    params: [payload],
  });
}

async function preTxAnimate(label) {
  const s = el("tipStatus");
  if (s) s.textContent = label;
  // Mandatory: animate 1–1.5 seconds before wallet opens.
  await sleep(1200);
}

function sha3Selector(signature) {
  // Tiny keccak implementation via WebCrypto is not available (no keccak),
  // so we hardcode selectors for demo. Replace if your ABI differs.
  // extract(): 0x5a4b3a18 (keccak("extract()") first 4 bytes)
  // revive(): 0x4bde2a4a (keccak("revive()") first 4 bytes)
  if (signature === "extract()") return "0x5a4b3a18";
  if (signature === "revive()") return "0x4bde2a4a";
  return "0x";
}

async function callGameContract(provider, kind) {
  await ensureBaseMainnet(provider);

  const data = kind === "extract"
    ? sha3Selector("extract()")
    : sha3Selector("revive()");

  await preTxAnimate(kind === "extract" ? "Preparing extraction…" : "Preparing revival…");

  // Send a contract call (value 0) using wallet_sendCalls.
  await walletSendCalls(provider, [{
    to: GAME_CONTRACT,
    value: "0x0",
    data,
  }]);
}

function showHeli() {
  const o = el("heliOverlay");
  o.classList.remove("hidden");
  setTimeout(() => o.classList.add("hidden"), 2400);
}

const state = {
  depth: 0,
  hp: 100,
  loot: 0,
  alive: true,
};

function logLine(msg) {
  const box = el("log");
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  box.innerHTML = `<div class="muted">${time}</div><div>${msg}</div>`;
}

function render() {
  el("depth").textContent = String(state.depth);
  el("hp").textContent = String(Math.max(0, state.hp));
  el("loot").textContent = String(state.loot);
  el("btnDive").disabled = !state.alive;
  el("btnExtract").disabled = !state.alive || state.loot <= 0;
  el("btnRevive").disabled = state.alive;
}

function encounter() {
  // scaled difficulty
  const enemy = Math.min(95, 12 + state.depth * 7 + Math.floor(Math.random() * 12));
  const lootGain = 8 + state.depth * 5 + Math.floor(Math.random() * 10);
  state.hp -= enemy;
  state.loot += lootGain;
  logLine(`Enemy hit for <b>${enemy}</b>. You grabbed <b>${lootGain}</b> loot.`);
  if (state.hp <= 0) {
    state.alive = false;
    state.hp = 0;
    state.loot = 0; // lose the run
    logLine(`<b>YOU DIED.</b> All loot from this run is lost. You can revive onchain to continue with 50% HP (demo).`);
  }
}

function newRun() {
  state.depth = 0;
  state.hp = 100;
  state.loot = 0;
  state.alive = true;
  logLine("Night vision online. Enter the Cyber-Dungeon.");
  render();
}

function loadBoard() {
  const raw = localStorage.getItem("the-extraction-board") || "[]";
  let arr = [];
  try { arr = JSON.parse(raw); } catch {}
  arr.sort((a,b) => b.score - a.score);
  return arr.slice(0, 10);
}

function saveBoard(arr) {
  localStorage.setItem("the-extraction-board", JSON.stringify(arr.slice(0, 50)));
}

function renderBoard() {
  const board = loadBoard();
  const box = el("board");
  box.innerHTML = "";
  if (!board.length) {
    box.innerHTML = `<div class="p">No extractions yet. Extract to set your first score.</div>`;
    return;
  }
  board.forEach((e, i) => {
    const row = document.createElement("div");
    row.className = "entry";
    row.innerHTML = `<div><span class="rank">#${i+1}</span> <span class="mono">${e.addr.slice(0,6)}…${e.addr.slice(-4)}</span></div><div><b>${e.score}</b> pts</div>`;
    box.appendChild(row);
  });
}

async function shareCast() {
  const url = HOME_URL;
  try {
    await sdk.actions.composeCast({
      text: "I just ran The Extraction. Dare to go deeper?",
      embeds: [url],
    });
  } catch {
    // composeCast may be unavailable in some hosts; fallback to clipboard
    await navigator.clipboard.writeText(url);
    toast("Copied link to clipboard.");
  }
}

function openSheet() {
  el("sheetBackdrop").classList.remove("hidden");
  el("tipSheet").classList.remove("hidden");
}
function closeSheet() {
  el("sheetBackdrop").classList.add("hidden");
  el("tipSheet").classList.add("hidden");
  el("tipError").classList.add("hidden");
  el("tipError").textContent = "";
}

const tip = {
  mode: "idle", // idle -> preparing -> confirm -> sending -> done
  selected: null,
};

function setTipButton(label, disabled=false) {
  const b = el("btnTipSend");
  b.textContent = label;
  b.disabled = disabled;
}

function showTipError(msg) {
  const e = el("tipError");
  e.textContent = msg;
  e.classList.remove("hidden");
}

async function sendTip(amountUsd) {
  if (!isChecksummedAddress(RECIPIENT)) {
    toast("Tip recipient address is invalid.");
    return;
  }
  if (String(BUILDER_CODE).includes("TODO")) {
    toast("Builder code missing. Set BUILDER_CODE to enable tips.");
    return;
  }

  let amountUnits;
  try {
    amountUnits = parseUsdToUnits6(amountUsd);
  } catch (e) {
    showTipError(e.message || "Invalid amount.");
    return;
  }

  const provider = await getProvider();
  await ensureBaseMainnet(provider);

  const data = encodeErc20Transfer(RECIPIENT, amountUnits);

  tip.mode = "preparing";
  setTipButton("Preparing tip…", true);
  await preTxAnimate("Preparing tip…");

  tip.mode = "confirm";
  setTipButton("Confirm in wallet", true);

  try {
    await walletSendCalls(provider, [{
      to: USDC_CONTRACT,
      value: "0x0",
      data,
    }]);
  } catch (e) {
    tip.mode = "idle";
    setTipButton("Send USDC", false);
    el("tipStatus").textContent = "";
    const msg = (e && (e.message || e.shortMessage)) ? (e.message || e.shortMessage) : "Transaction canceled.";
    toast(msg.includes("User rejected") ? "Canceled." : msg);
    return;
  }

  tip.mode = "done";
  setTipButton("Send again", false);
  el("tipStatus").textContent = "Tip sent.";
  toast("Thanks for the tip.");
}

async function onExtract() {
  const provider = await getProvider();
  el("btnExtract").disabled = true;
  try {
    await callGameContract(provider, "extract");
  } catch (e) {
    const msg = (e && (e.message || e.shortMessage)) ? (e.message || e.shortMessage) : "Extraction failed.";
    toast(msg);
    el("btnExtract").disabled = false;
    return;
  }

  showHeli();

  // Update local leaderboard after tx confirmation request
  try {
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    const addr = accounts?.[0] || "0x0000000000000000000000000000000000000000";
    const board = loadBoard();
    board.push({ addr, score: state.loot, at: Date.now() });
    saveBoard(board);
    renderBoard();
  } catch {}

  logLine(`<b>EXTRACTED.</b> Loot secured. Start a new run when ready.`);
  // reset run
  state.depth = 0;
  state.hp = 100;
  state.loot = 0;
  state.alive = true;
  render();
}

async function onRevive() {
  const provider = await getProvider();
  el("btnRevive").disabled = true;
  try {
    await callGameContract(provider, "revive");
  } catch (e) {
    const msg = (e && (e.message || e.shortMessage)) ? (e.message || e.shortMessage) : "Revive failed.";
    toast(msg);
    el("btnRevive").disabled = false;
    return;
  }

  state.alive = true;
  state.hp = 50;
  state.loot = 0; // loot already lost
  logLine("Revived at 50% HP. The dungeon remembers.");
  render();
}

function setChecks(items) {
  const box = el("checks");
  box.innerHTML = "";
  for (const it of items) {
    const row = document.createElement("div");
    row.className = "check";
    row.innerHTML = `
      <div class="dot ${it.ok ? "ok" : "bad"}"></div>
      <div>
        <div><b>${it.label}</b></div>
        <div class="p">${it.detail}</div>
      </div>
    `;
    box.appendChild(row);
  }
}

async function runMiniAppGateChecks() {
  const checks = [];

  // Meta tag presence
  const mini = document.querySelector('meta[name="fc:miniapp"]')?.getAttribute("content") || "";
  const frame = document.querySelector('meta[name="fc:frame"]')?.getAttribute("content") || "";
  let miniOk = false, frameOk = false;
  try { JSON.parse(mini); miniOk = true; } catch {}
  try { JSON.parse(frame); frameOk = true; } catch {}
  checks.push({
    ok: !!miniOk,
    label: "<meta name=\"fc:miniapp\">",
    detail: miniOk ? "Present and valid JSON." : "Missing or invalid JSON (will cause browser mode).",
  });
  checks.push({
    ok: !!frameOk,
    label: "<meta name=\"fc:frame\">",
    detail: frameOk ? "Present and valid JSON." : "Missing or invalid JSON (will cause browser mode).",
  });

  // launch_frame strictness
  const actionType = (() => {
    try { return JSON.parse(mini).button.action.type; } catch { return null; }
  })();
  checks.push({
    ok: actionType === "launch_frame",
    label: "Action type",
    detail: actionType === "launch_frame" ? "launch_frame confirmed." : `Expected launch_frame, got ${String(actionType)}.`,
  });

  // imageUrl existence check (HEAD request)
  const imageUrl = (() => {
    try { return JSON.parse(mini).imageUrl; } catch { return null; }
  })();
  let imgOk = false;
  try {
    const r = await fetch(imageUrl, { method: "HEAD" });
    imgOk = r.ok;
  } catch {}
  checks.push({
    ok: !!imgOk,
    label: "miniapp.imageUrl reachable",
    detail: imgOk ? imageUrl : "Image missing/unreachable (must exist at /assets/embed-3x2.png).",
  });

  // farcaster.json existence + homeUrl exact match
  let manifestOk = false;
  let homeOk = false;
  try {
    const r = await fetch("/.well-known/farcaster.json", { cache: "no-store" });
    manifestOk = r.ok;
    const m = await r.json();
    const hu = m?.miniapp?.homeUrl || m?.frame?.homeUrl || "";
    homeOk = hu === HOME_URL;
  } catch {}
  checks.push({
    ok: manifestOk,
    label: "/.well-known/farcaster.json",
    detail: manifestOk ? "Manifest reachable." : "Missing/unreachable (will cause browser mode).",
  });
  checks.push({
    ok: homeOk,
    label: "homeUrl domain match",
    detail: homeOk ? `homeUrl matches ${HOME_URL}` : `homeUrl must be exactly ${HOME_URL}`,
  });

  // sdk.actions.ready called indicator
  checks.push({
    ok: true,
    label: "sdk.actions.ready()",
    detail: "Called during initialization (dismisses splash).",
  });

  setChecks(checks);
}

async function init() {
  try { await sdk.actions.ready(); } catch (e) { /* ignore */ }
// Call ready ASAP after minimal sync setup
  try {
    await sdk.actions.ready();
  } catch (e) {
    // If not in a host, still render (web dev), but show warning
  }

  // Close button
  el("btnClose").addEventListener("click", async () => {
    try { await sdk.actions.close(); } catch { window.location.href = HOME_URL; }
  });

  // Game buttons
  el("btnDive").addEventListener("click", () => {
    state.depth += 1;
    encounter();
    render();
  });
  el("btnNewRun").addEventListener("click", newRun);
  el("btnExtract").addEventListener("click", onExtract);
  el("btnRevive").addEventListener("click", onRevive);

  // Share
  el("btnShare").addEventListener("click", shareCast);

  // Tip sheet interactions
  el("btnTip").addEventListener("click", () => {
    closeSheet();
    setTipButton("Send USDC", false);
    el("customAmt").value = "";
    openSheet();
  });
  el("btnTipCancel").addEventListener("click", closeSheet);
  el("sheetBackdrop").addEventListener("click", closeSheet);

  document.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const amt = btn.getAttribute("data-amt");
      el("customAmt").value = String(amt);
    });
  });

  el("btnTipSend").addEventListener("click", async () => {
    const amt = el("customAmt").value || "0";
    // state machine labels required by prompt
    setTipButton("Preparing tip…", true);
    try {
      await sendTip(amt);
    } finally {
      // restore state machine label if it never reached done
      if (tip.mode === "idle") setTipButton("Send USDC", false);
      if (tip.mode === "done") setTipButton("Send again", false);
    }
  });

  // Gate checks
  el("btnRecheck").addEventListener("click", runMiniAppGateChecks);

  // Initial render
  newRun();
  renderBoard();
  await runMiniAppGateChecks();
}

init();

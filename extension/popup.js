// popup.js — UI glue. Talks to the content script via chrome.tabs.sendMessage,
// receives streamed progress via chrome.runtime.onMessage.

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const runBtn = $('run');
const previewBtn = $('preview');
const stopBtn = $('stop');
const keepEl = $('keeplist');
const summaryEl = $('summary');
const linesEl = $('lines');

let counts = { done: 0, kept: 0, skipped: 0, would: 0 };

// Restore saved keep-list.
chrome.storage.local.get(['keepList'], (r) => {
  if (r.keepList) keepEl.value = r.keepList;
});
keepEl.addEventListener('input', () => {
  chrome.storage.local.set({ keepList: keepEl.value });
});

async function activeGmailTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !/^https:\/\/mail\.google\.com\//.test(tab.url || '')) return null;
  return tab;
}

function setRunningState(running) {
  previewBtn.disabled = running;
  runBtn.disabled = running;
  stopBtn.disabled = !running;
}

async function refreshStatus() {
  const tab = await activeGmailTab();
  if (!tab) {
    setStatus('Open Gmail to use this.', 'error');
    previewBtn.disabled = true;
    runBtn.disabled = true;
    stopBtn.disabled = true;
    return;
  }
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { cmd: 'count' });
    if (!res.onPage) {
      setStatus('Go to Manage subscriptions (#subscriptions).', 'error');
      previewBtn.disabled = true;
      runBtn.disabled = true;
      stopBtn.disabled = true;
    } else {
      setStatus(`${res.count} senders found.`, 'ready');
      setRunningState(false);
    }
  } catch (_) {
    setStatus('Reload the Gmail tab, then reopen this.', 'error');
    previewBtn.disabled = true;
    runBtn.disabled = true;
    stopBtn.disabled = true;
  }
}

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = 'status' + (cls ? ' ' + cls : '');
}

function keepList() {
  return keepEl.value.split('\n').map((s) => s.trim()).filter(Boolean);
}

function resetLog() {
  counts = { done: 0, kept: 0, skipped: 0, would: 0 };
  linesEl.innerHTML = '';
  summaryEl.textContent = '';
}

function addLine(status, email) {
  const li = document.createElement('li');
  const mark = { done: '✔', kept: '⏭', skipped: '⚠', would: '○' }[status] || '·';
  li.textContent = `${mark} ${email}`;
  li.className = status;
  linesEl.appendChild(li);
  linesEl.scrollTop = linesEl.scrollHeight;
}

async function send(cmd, opts) {
  const tab = await activeGmailTab();
  if (!tab) throw new Error('Open Gmail to use this.');
  return chrome.tabs.sendMessage(tab.id, { cmd, opts });
}

async function startRun(dryRun) {
  resetLog();
  setRunningState(true);

  try {
    const response = await send('run', { dryRun, keepList: keepList() });
    if (!response?.started) {
      setRunningState(false);
      if (response?.reason === 'running') {
        setStatus('A bulk unsubscribe run is already in progress.', 'error');
      }
    }
  } catch (_) {
    setRunningState(false);
    setStatus('Reload the Gmail tab, then reopen this.', 'error');
  }
}

previewBtn.addEventListener('click', () => {
  startRun(true);
});
runBtn.addEventListener('click', () => {
  if (!confirm('Unsubscribe from all listed senders? This cannot be undone.')) return;
  startRun(false);
});
stopBtn.addEventListener('click', () => {
  send('stop').catch(() => {
    setStatus('Could not stop the run. Reload Gmail if needed.', 'error');
  });
});

// Progress stream from content script.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.from !== 'content') return;
  const p = msg.payload;
  if (p.type === 'start') {
    setRunningState(true);
    summaryEl.textContent = p.dryRun
      ? `Previewing ${p.total} senders…`
      : `Unsubscribing from ${p.total}…`;
  } else if (p.type === 'progress') {
    counts[p.status] = (counts[p.status] || 0) + 1;
    addLine(p.status, p.email);
  } else if (p.type === 'done') {
    setRunningState(false);
    const verb = p.dryRun ? 'Would unsubscribe' : 'Unsubscribed';
    summaryEl.textContent =
      `${verb} ${p.done}, kept ${p.kept}, skipped ${p.skipped}` +
      (p.stopped ? ' (stopped)' : '') + '.';
    if (!p.dryRun) refreshStatus();
  } else if (p.type === 'error') {
    setRunningState(false);
    setStatus(p.message, 'error');
  }
});

refreshStatus();

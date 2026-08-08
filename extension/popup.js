// popup.js — UI glue. Talks to the content script via chrome.tabs.sendMessage,
// receives streamed progress via chrome.runtime.onMessage.

async function loadBundledFont(weight, paths) {
  const encodedParts = await Promise.all(
    paths.map(async (path) => {
      const response = await fetch(chrome.runtime.getURL(path));
      if (!response.ok) throw new Error(`Could not load ${path}`);
      return (await response.text()).trim();
    })
  );
  const binary = atob(encodedParts.join(''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const face = new FontFace('Clarity City', bytes.buffer, {
    style: 'normal',
    weight,
  });
  await face.load();
  document.fonts.add(face);
}

const fontsReady = Promise.all([
  loadBundledFont('500', ['fonts/medium.b64', 'fonts/medium.b64.2']),
  loadBundledFont('600', ['fonts/semibold.b64', 'fonts/semibold.b64.2']),
])
  .catch((error) => console.warn('Could not load bundled Clarity City fonts.', error))
  .finally(() => document.documentElement.classList.add('fonts-ready'));

const $ = (id) => document.getElementById(id);
const statusBar = $('statusBar');
const statusEl = $('status');
const runBtn = $('run');
const previewBtn = $('preview');
const stopBtn = $('stop');
const helpBtn = $('help');
const keepEl = $('keeplist');
const resultsPanel = $('resultsPanel');
const summaryEl = $('summary');
const linesEl = $('lines');

let counts = { done: 0, kept: 0, skipped: 0, would: 0 };

// Restore saved keep-list. If none exists, keep the safe defaults in the HTML.
chrome.storage.local.get(['keepList'], (r) => {
  if (typeof r.keepList === 'string') keepEl.value = r.keepList;
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

function setStatus(text, tone = 'neutral') {
  statusEl.textContent = text;
  statusBar.dataset.tone = tone;
}

function showResults() {
  resultsPanel.classList.remove('is-hidden');
}

function hideResults() {
  resultsPanel.classList.add('is-hidden');
}

async function refreshStatus() {
  const tab = await activeGmailTab();
  if (!tab) {
    setStatus('Open Gmail to use this.', 'danger');
    previewBtn.disabled = true;
    runBtn.disabled = true;
    stopBtn.disabled = true;
    return;
  }

  try {
    const res = await chrome.tabs.sendMessage(tab.id, { cmd: 'count' });
    if (!res.onPage) {
      setStatus('Open Manage subscriptions to use this.', 'danger');
      previewBtn.disabled = true;
      runBtn.disabled = true;
      stopBtn.disabled = true;
      return;
    }

    const count = Number(res.count || 0);
    const noun = count === 1 ? 'sender' : 'senders';
    setStatus(`${count} ${noun} found.`, 'neutral');
    setRunningState(false);
    runBtn.disabled = count === 0;
  } catch (_) {
    setStatus('Reload the Gmail tab, then reopen this.', 'danger');
    previewBtn.disabled = true;
    runBtn.disabled = true;
    stopBtn.disabled = true;
  }
}

function keepList() {
  return keepEl.value.split('\n').map((s) => s.trim()).filter(Boolean);
}

function resetLog({ hide = true } = {}) {
  counts = { done: 0, kept: 0, skipped: 0, would: 0 };
  linesEl.innerHTML = '';
  summaryEl.textContent = '';
  if (hide) hideResults();
}

function addLine(status, email) {
  const li = document.createElement('li');
  const mark = { done: '✔', kept: '⏭', skipped: '⚠', would: '○' }[status] || '·';
  li.textContent = `${mark} ${email}`;
  li.className = status;
  linesEl.appendChild(li);
  linesEl.scrollTop = linesEl.scrollHeight;
  showResults();
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
        setStatus('A bulk unsubscribe run is already in progress.', 'danger');
      }
      return;
    }

    showResults();
    setStatus(dryRun ? 'Previewing senders…' : 'Unsubscribing…', 'neutral');
  } catch (_) {
    setRunningState(false);
    setStatus('Reload the Gmail tab, then reopen this.', 'danger');
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
  setStatus('Stopping…', 'neutral');
  send('stop').catch(() => {
    setStatus('Could not stop the run. Reload Gmail if needed.', 'danger');
  });
});

helpBtn.addEventListener('click', () => {
  chrome.tabs.create({
    url: 'https://github.com/heykerim/gmail-bulk-unsubscribe#readme',
  });
});

// Progress stream from content script.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.from !== 'content') return;
  const p = msg.payload;

  if (p.type === 'start') {
    setRunningState(true);
    showResults();
    const text = p.dryRun
      ? `Previewing ${p.total} senders…`
      : `Unsubscribing from ${p.total}…`;
    summaryEl.textContent = text;
    setStatus(text, 'neutral');
    return;
  }

  if (p.type === 'progress') {
    counts[p.status] = (counts[p.status] || 0) + 1;
    addLine(p.status, p.email);
    return;
  }

  if (p.type === 'done') {
    setRunningState(false);
    showResults();
    const verb = p.dryRun ? 'Would unsubscribe' : 'Unsubscribed';
    const text =
      `${verb} ${p.done}, kept ${p.kept}, skipped ${p.skipped}` +
      (p.stopped ? ' (stopped)' : '') + '.';
    summaryEl.textContent = text;
    setStatus(text, 'neutral');

    if (!p.dryRun) {
      setTimeout(() => refreshStatus(), 350);
    }
    return;
  }

  if (p.type === 'error') {
    setRunningState(false);
    showResults();
    summaryEl.textContent = p.message || 'Something went wrong.';
    setStatus(p.message || 'Something went wrong.', 'danger');
  }
});

resetLog();
fontsReady.finally(refreshStatus);

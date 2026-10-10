// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "other";
  }
}

async function getStash() {
  const { stash = [] } = await chrome.storage.local.get("stash");
  return stash;
}

async function setStash(stash) {
  await chrome.storage.local.set({ stash });
}

// ---------- open tabs ----------
async function renderOpenTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const container = $("#open-tabs");
  container.innerHTML = "";

  // group by domain
  const groups = {};
  for (const t of tabs) {
    const d = domainOf(t.url || "");
    (groups[d] ||= []).push(t);
  }

  for (const [domain, items] of Object.entries(groups)) {
    const title = document.createElement("div");
    title.className = "group-title";
    title.textContent = `${domain} (${items.length})`;
    container.appendChild(title);

    for (const tab of items) {
      container.appendChild(tabRow(tab, "open"));
    }
  }
}

// ---------- row builder ----------
function tabRow(tab, mode) {
  const row = document.createElement("div");
  row.className = "tab";

  const fav = document.createElement("img");
  fav.src = tab.favIconUrl || "";
  fav.onerror = () => (fav.style.visibility = "hidden");

  const title = document.createElement("div");
  title.className = "title";
  title.textContent = tab.title || tab.url;

  const actions = document.createElement("div");
  actions.className = "actions";

  if (mode === "open") {
    row.onclick = () => {
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
      window.close();
    };

    const stashBtn = document.createElement("button");
    stashBtn.textContent = "💾";
    stashBtn.title = "Stash this tab";
    stashBtn.onclick = async (e) => {
      e.stopPropagation();
      const stash = await getStash();
      stash.push({
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        ts: Date.now(),
      });
      await setStash(stash);
      await chrome.tabs.remove(tab.id);
      render();
    };
    actions.appendChild(stashBtn);
  } else {
    // stashed
    row.onclick = async () => {
      await chrome.tabs.create({ url: tab.url });
      const stash = await getStash();
      const idx = stash.findIndex((s) => s.ts === tab.ts);
      if (idx > -1) stash.splice(idx, 1);
      await setStash(stash);
      render();
    };

    const del = document.createElement("button");
    del.textContent = "✕";
    del.title = "Remove from stash";
    del.onclick = async (e) => {
      e.stopPropagation();
      const stash = await getStash();
      const idx = stash.findIndex((s) => s.ts === tab.ts);
      if (idx > -1) stash.splice(idx, 1);
      await setStash(stash);
      render();
    };
    actions.appendChild(del);
  }

  row.append(fav, title, actions);
  return row;
}

// ---------- stashed list ----------
async function renderStashed() {
  const stash = await getStash();
  $("#stash-count").textContent = stash.length ? `(${stash.length})` : "";
  const container = $("#stashed");
  container.innerHTML = "";

  if (!stash.length) {
    container.innerHTML = '<div class="empty">Nothing stashed yet.</div>';
    return;
  }

  [...stash].reverse().forEach((t) => container.appendChild(tabRow(t, "stashed")));
}

// ---------- stash current tab ----------
$("#stash-current").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  const stash = await getStash();
  stash.push({
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl,
    ts: Date.now(),
  });
  await setStash(stash);
  await chrome.tabs.remove(tab.id);
  render();
};

// ---------- render ----------
async function render() {
  await renderOpenTabs();
  await renderStashed();
}

render();
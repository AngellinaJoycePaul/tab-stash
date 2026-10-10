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
    stashBtn.textContent = "S";
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
    row.onclick = async () => {
      await chrome.tabs.create({ url: tab.url });
      const stash = await getStash();
      const idx = stash.findIndex((s) => s.ts === tab.ts);
      if (idx > -1) stash.splice(idx, 1);
      await setStash(stash);
      render();
    };

    const del = document.createElement("button");
    del.textContent = "x";
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
let searchTerm = "";

async function renderStashed() {
  const stash = await getStash();
  $("#stash-count").textContent = stash.length ? `(${stash.length})` : "";
  const container = $("#stashed");
  container.innerHTML = "";

  if (!stash.length) {
    container.innerHTML = '<div class="empty">Nothing stashed yet.</div>';
    return;
  }

  const reversed = [...stash].reverse();

  const filtered = searchTerm
    ? reversed.filter((t) => {
        const haystack = `${t.title || ""} ${t.url || ""}`.toLowerCase();
        return haystack.includes(searchTerm);
      })
    : reversed;

  if (!filtered.length) {
    container.innerHTML = '<div class="empty">No matches.</div>';
    return;
  }

  filtered.forEach((t) => container.appendChild(tabRow(t, "stashed")));
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

// ---------- search ----------
const searchInput = $("#search");

searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  renderStashed();
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchInput.value = "";
    searchTerm = "";
    renderStashed();
  }
});

// ---------- group tabs by domain ----------
$("#group-tabs").onclick = async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  const groups = {};
  for (const t of tabs) {
    const d = domainOf(t.url || "");
    (groups[d] ||= []).push(t);
  }

  const colorPalette = [
    "grey", "blue", "red", "yellow",
    "green", "pink", "purple", "cyan", "orange",
  ];

  let colorIdx = 0;

  for (const [domain, items] of Object.entries(groups)) {
    if (items.length < 2) continue;

    const tabIds = items.map((t) => t.id);
    const groupId = await chrome.tabs.group({ tabIds });

    await chrome.tabGroups.update(groupId, {
      title: domain,
      color: colorPalette[colorIdx % colorPalette.length],
      collapsed: false,
    });

    colorIdx++;
  }

  window.close();
};

// ---------- render ----------
async function render() {
  await renderOpenTabs();
  await renderStashed();
}

render();
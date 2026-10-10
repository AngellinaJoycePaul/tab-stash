async function updateBadge() {
  const { stash = [] } = await chrome.storage.local.get("stash");
  const count = stash.length;
  await chrome.action.setBadgeText({ text: count ? String(count) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#4f46e5" });
}

// Run when extension is installed or updated
chrome.runtime.onInstalled.addListener(updateBadge);

// Run when Chrome starts
chrome.runtime.onStartup.addListener(updateBadge);

// Run whenever stash changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.stash) updateBadge();
});

// Also run once when the service worker spins up
updateBadge();

// ---------- keyboard command: stash active tab ----------
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "stash-active-tab") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  // Don't stash chrome:// pages, extension pages, or blank tabs
  const url = tab.url || "";
  if (
    !url ||
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:")
  ) {
    console.warn("Tab Stash: can't stash this page type");
    return;
  }

  const { stash = [] } = await chrome.storage.local.get("stash");
  stash.push({
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl,
    ts: Date.now(),
  });
  await chrome.storage.local.set({ stash });

  await chrome.tabs.remove(tab.id);
});
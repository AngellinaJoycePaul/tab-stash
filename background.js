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
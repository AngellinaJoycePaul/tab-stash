# Tab Stash

A Chrome extension to group open tabs by domain, stash the ones you're not using, and restore them later.

## Features

- **Group by domain** — see all your open tabs organized by site
- **Stash tabs** — save a tab for later and close it in one click
- **Restore anytime** — click a stashed tab to reopen it
- **Badge counter** — see how many tabs you've stashed right on the icon
- **Persistent** — stash survives browser restarts (via chrome.storage)

## Install (dev mode)

1. Clone this repo:
   git clone https://github.com/AngellinaJoycePaul/tab-stash.git

2. Open Chrome and go to: chrome://extensions

3. Toggle **Developer mode** ON (top-right)

4. Click **Load unpacked** and select the `tab-stash` folder

5. Pin the extension from the puzzle-piece menu

## Usage

- **Click any tab row** — jump to that tab
- **Click the save icon on a tab** — stash it (closes the tab, saves it)
- **Click "+ Stash current"** — stash the active tab
- **Click a stashed row** — reopen it
- **Click X on a stashed row** — remove from stash without opening

## Tech

- Manifest V3
- Vanilla JS (no build step)
- chrome.tabs, chrome.storage, chrome.action APIs

## Roadmap

- [ ] Auto-group open tabs
- [ ] Keyboard shortcut to stash instantly
- [ ] Search / filter stash
- [ ] Sync across devices
- [ ] Export / import stash as JSON

## License

MIT
# Installation & Testing Guide

## Shamelessly Vibe-Coded Form Filler

One Manifest V3 package runs in both **Chrome** (and other Chromium browsers) and **Firefox 140+**.

## Build

```bash
./build.sh
```

This creates:
- `build/extension/`: the unpacked extension
- `build/shamelessly-vibe-coded-form-filler.zip`: the same files, for the Chrome Web Store or addons.mozilla.org

## Chrome

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and pick `build/extension/` (or this folder itself while developing)

## Firefox

1. Go to `about:debugging` > **This Firefox**
2. Click **Load Temporary Add-on** and pick `build/extension/manifest.json`

Or with web-ext: `cd build/extension && npx web-ext run`

## Testing

Open `test-form.html` (see "Local files" below), click the toolbar icon, then **Fill Forms Now**.
The form picker should list:

- **personalInfo**: 9 text fields
- **preferences**: 2 dropdowns, 7 radios, 9 checkboxes
- **additionalFields**: 1 text field (password, date, time, range and color inputs are left alone)

The other test pages:
- `dynamic-test-form.html`: fields appear as you choose options; filling should also fill the fields the page reveals
- `test-refill-behavior.html`: with **Only fill empty/blank fields** on, pre-filled fields stay as they are

## How it reaches the page

The extension has no content script running on every site. When you use the popup,
it injects `content.js` into the current tab (`activeTab` + `scripting` permissions),
so the extension can't see pages you haven't asked it to fill.

It works on the tab's top-level page only, not on forms inside iframes.

## Troubleshooting

### "Cannot access this page"
Browsers don't let extensions run on `chrome://`, `about:`, extension store pages or
other extensions' pages.

### Local files
- **Chrome**: `chrome://extensions/` > the extension's **Details** > enable **Allow access to file URLs**
- **Firefox**: temporary add-ons can open `file://` pages already

### After editing the code
Reload the extension (`chrome://extensions/` refresh icon, or **Reload** in `about:debugging`),
then reopen the popup. There's no need to reload the web page.

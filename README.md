# Social-Focus

## Overview

`facebook.js` is a combined content filtering script for Facebook and YouTube. It automatically detects which site it is running on and applies custom filtering and redirection logic to help users avoid distracting or unwanted content.

---

## Features

- **Automatic Site Detection:** Runs the appropriate logic for Facebook or YouTube based on the current site.
- **Facebook Filtering:**
  - Redirects users away from forbidden sections (e.g., Watch, Reels).
  - Allows navigation only on permitted sections (e.g., profile, groups, stories).
  - Redirects to the user's profile page if on an unapproved section.
  - Skips filtering if the user is not logged in.
- **YouTube Filtering:**
  - Redirects users away from unapproved sections to the search page.
  - Removes distracting elements (e.g., endscreen, "For You" sections).
  - Adds a button to skip ads using a simulated numpad keypress.
  - Cleans up library and search pages.
- **Modular and Clean:**
  - Encapsulated logic for each site.
  - No global variable collisions.
  - Easy to extend for other sites.

---

## Usage

1. **Copy or inject `social_filter.js`** into your browser extension or user script manager (such as Tampermonkey or Greasemonkey).
2. **Set the script to run on both Facebook and YouTube domains:**
   - `https://www.facebook.com/*`
   - `https://www.youtube.com/*`
3. The script will automatically detect the site and apply the correct filtering logic.

---

## How It Works

### Site Detection
```js
const hostname = window.location.hostname;
if (hostname.includes('facebook.com')) {
    runFacebookFilter();
} else if (hostname.includes('youtube.com')) {
    runYouTubeFilter();
}
```

### Facebook Logic
- Checks if the user is logged in.
- If on a forbidden path (e.g., `/watch`, `/reels`), copies the URL to clipboard and redirects to a third-party site.
- If not on an allowed path or user profile, redirects to the profile page.
- Runs checks periodically to catch navigation changes.

### YouTube Logic
- If not on an allowed path, redirects to the search page.
- On video pages, removes endscreen overlays and adds a button to skip ads.
- On search/library pages, removes distracting sections.
- Runs checks periodically to catch navigation changes.

---

## Example: Injecting with a User Script Manager
```js
// ==UserScript==
// @name         Social Filter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Filter distracting content on Facebook and YouTube
// @match        https://www.facebook.com/*
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

// Paste the contents of social_filter.js here
```

---

## Customization
- You can edit the lists of allowed and forbidden paths for each site to suit your needs.
- The script is modular and can be extended to support more sites or custom behaviors.

---

## License
This script is provided as-is for personal use. Modify and distribute as you see fit.

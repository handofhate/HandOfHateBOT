# ✅ VOiD 2.0 TODO.md

---

## 🏁 FINAL RELEASE CHECKLIST

- [ ] Update `version.js` to `2.0.0`
- [ ] Write `CHANGELOG.md` for 2.0
- [ ] Tag the release in Git
- [ ] Create ZIP and release build
- [ ] Post update on Discord or social

---

## 📈 OPTIONAL POLISH FEATURES

### 🧱 Application Polish + UX

- [ ] Add splash screen on startup  
       ⏱ 1 hr

- [ ] Add an About window, and/or links to Discord/Twitch/Github and/or an update system and/or changelog  
       ⏱ 1–2 hrs

- [ ] Try and package for a release using `electron-builder` or similar  
       ⏱ 2–3 hrs

- [ ] Explore 'first run' flow for new users  
       ⏱ 2 hrs

---

## 🧪 FUTURE RELEASE IDEAS (POST 2.0)

> These are cool, but not blocking for the 2.0 launch.

### 🔁 System Refactors

- [ ] Create `messageChat.js` utility to unify Twitch message handling (simulation, logging, errors)
- [ ] Modularize Twitch, OBS, Discord, and GUI logging into a centralized `logRouter.js`
- [ ] Refactor module system to allow runtime enable/disable toggles per feature without restart
- [ ] Refactor settings save/load to support profiles or presets
- [ ] Split `dashboardManager.js` and `configManager.js` into modular files per feature  
       _Move large render blocks like `renderColorButtons()` and `renderSoundEffects()` into separate files (e.g., `colorUI.js`, `soundUI.js`, `statusIndicators.js`). Simplify `dashboardManager.js` and `configManager.js` into a lightweight loader that pulls render functions from modular sources._  
       ⏱ 2–3 hrs
- [ ] Create a `renderModuleCard()` helper to reduce `dashboardManager.js` duplication  
       _Pass in a title, icon, module key, and content HTML — this will clean up repetitive `.render()` functions and make it easier to maintain or style cards globally._  
       ⏱ 1–2 hrs

### 🎨 GUI + UX Enhancements

- [ ] Add drag-and-drop reordering for Dashboard modules
- [ ] Add a "Theme" dropdown for GUI color presets (cyberpunk, dark glass, retro, etc.)
- [ ] Improve wrapped log lines with optional visual indent or style prefixing
- [ ] Add customizable chat prefix/suffix (e.g., auto-insert emojis or branding)
- [ ] Test for color wheel and/or slider and/or rainbow mode for Color Control Module  
       ⏱ 2–4 hrs

### 🧠 Smarter Behavior + Automations

- [ ] Add auto-reconnect logic for Twitch/OBS/Discord with exponential backoff
- [ ] Add dynamic cooldown system based on chat activity
- [ ] Add fallback "offline mode" for clip saving when Discord is down
- [ ] Support smart responses to unknown !commands via GPT or a local AI engine

### 📦 Release & Dev Tools

- [ ] Add plugin support or third-party module loading
- [ ] Publish as open-source template with onboarding docs
- [ ] Integrate Sentry or logging to file for error tracking

### 🎮 Streaming Enhancements

- [ ] Add a Media Control Module  
       _Basic play/pause/skip/toggle integration for Spotify or system audio._  
       ⏱ 2–4 hrs

- [ ] Add Spotify Lyrics Overlay  
       _Display current song lyrics as an overlay for viewers._  
       ⏱ 3–5 hrs

---

## ✅ COMPLETED

### 🔧 Core Functionality Cleanup

- [x] Add needed logs and delete unneeded ones  
       ⏱ 1–2 hrs

- [x] Rework Debug Flags to a simple Show/Hide OK Logs, Show/Hide Warn Logs, Show/Hide Error Logs system  
       ⏱ 1–2 hrs

- [x] Color code logs (green, yellow, red, gray, etc.)  
       ⏱ 30–60 min

### 🧪 Dev/Test Improvements

- [x] Decouple the Logs tab from bot runtime so GUI events (like toggling test flags) can log even when the bot isn't running, and prevent logs from being cleared on bot launch  
       ⏱ 1–2 hrs

### 🧩 Dashboard / Config Styling

- [x] Tweak options on Dashboard module cards (spacing, alignment, responsiveness)  
       ⏱ 1 hr

- [x] Tweak options on Config module cards (label clarity, grouping, layout)  
       ⏱ 1–2 hrs

### 🎮 Streaming Enhancements

- [x] Add a Chat Overlay Module  
       _Display chat messages as an overlay in OBS or GUI._  
       ⏱ 2 hrs

- [x] Add commands to Chat Links (!commands, !discord, !socials)  
       ⏱ 30–60 min

### 📂 Dev Ops + Maintenance

- [x] Organize config.js and update config.blank.js to match  
       ⏱ 30–60 min

### 🎨 GUI + UX Enhancements

- [x] Add tooltips/help icons to Config Tab inputs

# Changelog

## [1.2.1] - 2025-04-23

### 🚨 Major Update: Dynamic Module Reordering & Enhanced OBS Source Toggles
- **Live Module Reordering**: Now reflects changes in both the dashboard and the config tab in real time.
- **OBS Source Toggles**: Improved with dynamic input fields for better usability.
- **Sound Effect Management**: Added a refresh button for sound effects and improved button functionality in the GUI.

### ✨ Added
- Live reordering of modules in the config tab and dashboard.
- Dynamic input fields for OBS source toggles.
- Sound effect refresh functionality in the GUI.
- Config tab improvements for better UI clarity and navigation.

### 🔧 Improved
- Streamlined UI elements for the config tab.
- Enhanced handling of module visibility during reordering.
- Refined OBS WebSocket connection handling and error messages.

### 🐛 Fixed
- Fixed broken visibility of modules after reordering in the config tab.
- Corrected issues with OBS WebSocket connection stability.
- Addressed layout problems with the config tab, improving consistency and responsiveness.

---

## [1.2.0] - 2025-04-21

### 🚨 Major Update: ClipWatcher + Test Mode Enhancements
- ClipWatcher is now built into `bot.js` — no external process needed
- Dynamic test mode control: `!testflags` lets you simulate Twitch, OBS, and Discord live
- Simulated Discord webhook allows test uploads without spamming your server
- Centralized logic for cleaner modular development going forward

### ✨ Added
- Merged ClipWatcher directly into the main bot process
- Added runtime test flag handling (simulateTwitch, simulateOBS, simulateDiscord)
- GUI flag changes send live updates via stdin
- Fake Discord webhook posts for testing

### 🔧 Improved
- ClipWatcher logs more transparent and structured
- Simplified logic around clip uploads and webhook state
- Config flags now dynamically respected across all systems

### 🐛 Fixed
- Logging when Discord test mode was active
- Failsafe for empty or misconfigured clip folder path

---

## [1.2.0] - 2025-04-15

### 🎉 Major GUI Upgrade
- GUI interface fully rebuilt using DaisyUI and Tailwind with cyberpunk theme
- Dashboard now includes toggles, indicators, buttons, and testing modules
- Config and Debug tabs support real-time updates and flag management

### ✨ Added
- Full GUI interface using DaisyUI + Cyberpunk theme
- Dashboard tab with:
  - Start/Stop buttons
  - Stream status and viewer count
  - Color control buttons
  - Sound effect triggers
  - OBS Source toggle
  - Manual command entry
- Logs tab with auto-scrolling output window
- Config tab with dynamically rendered input fields from config.js
- Debug tab with toggles for all debug flags in config.js

### 🧪 Testing
- Toggle test flags for Twitch and OBS (Simulate/simulate) directly from GUI
- Test flag logic flows through to bot process without restart

### 🔧 Improved
- Modular rendering logic for config and debug tabs
- Much cleaner layout using Tailwind spacing utilities
- Buttons and inputs now visually distinct with DaisyUI theming
- Stream indicators and bot status more responsive

### 🐛 Fixed
- Sound effect buttons fully functional and styled
- Manual command input now disabled when bot is stopped
- Tabs properly toggle content without hard reload

---

## [1.1.1] - 2025-04-13

### ⚙️ Minor Update
- Bumped version to **1.1.1**

### 🔧 Configuration Cleanup
- Moved hardcoded channel name (`handofhate`) to `config.twitch.channel`
- Introduced `config.twitch.streamerName` to allow customization of the display name in `!uptime` responses
- Resolved version-lock strategy: the `!version` command is now fully tied to bot releases, not user customization

### 🛠️ Bug Fix
- Fixed `!uptime` and `!subscribers` Twitch API calls by refreshing the OAuth token

---

## [1.1.0] - 2025-04-13

### 🔺 Major Upgrade
- Bumped version to **1.1.0**

### 🎯 Highlights
- **Nightbot fully replaced** — All Nightbot functionality migrated into the custom bot.
- **Twitch Helix API integration** — Live subscriber count (`!subscribers`) and stream uptime (`!uptime`) now pull real-time data via the official Twitch API.
- **Emoji-enhanced branding** — Updated all static commands for consistent, on-brand emoji usage in messages.
- **Improved command structure** — Clearer separation between static commands, dynamic Twitch API responses, and sound/light functions.
- **Codebase polish** — Refactored text command handling, resolved duplication, removed dead code.
- **Bot personality refinements** — Reworded messages to better reflect the channel’s dark, irreverent tone.

### 🧪 Stability
- Verified command output for all supported inputs
- Version reflected in both `bot.js` and the `!version` response

---

## [1.0.0] - 2025-04-13 (baseline)

### ✅ Initial Public Version
- Custom Twitch chatbot launched
- Supported: Hue light color changes, OBS scene toggling, sound effects, static Nightbot-style commands
- Debug flag system, cooldowns, and error handling
- Initial OBS process monitoring
- Twitch raid auto-response

> “The HAND OF HATE grips the fearful.”

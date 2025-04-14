# Changelog

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
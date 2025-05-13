# Changelog

## [2.0.0] - 2025-05-12

### 🚀 Major Release: VOiD 2.0

- Complete architectural overhaul with modular system design
- Advanced GUI with customizable dashboard and configuration panels
- Enhanced logging and debug capabilities

### 📊 New Chat Overlay System

- **Live Chat Overlay Window**: Floating, resizable window to display chat messages in real-time
- **Click-Through Mode**: Toggle between interactive and click-through modes with "VOiD" button
- **Auto-fading Messages**: Messages automatically fade out after 15 seconds
- **Sample Message Preview**: Shows example messages on first launch for positioning
- **Position Indicator**: Visual guide that shows briefly when positioning the overlay
- **Automatic Scrolling**: Smart scroll behavior that respects user interaction
- **VOiD Mode**: Completely transparent background for clean gaming integration

### 👤 Authentication Improvements

- **Login with Twitch**: New secure OAuth authentication flow directly in the app
- **Token Management**: Automatic refresh of authentication tokens
- **Simplified Setup**: Streamlined configuration for new users

### 🖥️ OBS Integration

- **OBS Dock Mode**: Support for OBS Custom Window Docks plugin for direct integration
- **Persistent Layout**: Saved position and size for docked panels in OBS
- **Streamlined Controls**: Quick access to VOiD controls directly from OBS interface

### 🧙‍♂️ New Setup Wizard

- **First-Run Experience**: Interactive step-by-step setup guide for new users
- **Twitch Integration**: Simplified OAuth authentication flow with direct login
- **Module Selection**: Easy toggling of features during initial setup
- **Guided Configuration**: Clear instructions for connecting Hue lights, OBS, and more
- **Progressive Disclosure**: Only shows relevant configuration options based on selected modules
- **Config Persistence**: Real-time saving of configuration during setup process
- **Reusable Experience**: Setup wizard can be re-launched from the Config tab at any time

### ℹ️ Enhanced Help & Documentation

- **Info Modal**: Easily accessible application information and contact details
- **Contextual Help**: Inline help tooltips throughout the configuration interface
- **Improved Documentation**: Comprehensive explanations for all configuration options
- **Command References**: Clear documentation of available bot commands and variables
- **Markdown Rendering**: Rich text formatting in all help content and modals
- **Version Information**: Clear display of current version and update information

### ✨ Added

- **Log Search Function**: Real-time filtering of log messages as you type
- **Dynamic Command Management**: Add, edit, or remove chat commands through GUI without restart
- **Command Variables**: Support for dynamic variables (user, target, etc.) in command responses
- **Multi-line Responses**: Support for multi-line chat command responses with configurable timing
- **Custom TitleBar**: Branded, consistent titlebar across all windows for visual cohesion
- Modularized code structure with separate components for better maintainability
- Comprehensive logging system with color-coded messages (green/yellow/red/blue)
- Redesigned dashboard with drag-and-drop module reordering
- New debug flag system with simple Show/Hide toggles for OK/Warn/Error logs
- Tooltips/help icons on Config Tab inputs for improved user experience
- Decoupled logs tab from bot runtime for continued functionality when bot is stopped
- Organized configuration structure with improved grouping and layout

### 🎨 UI/UX Improvements

- **Improved Log Filtering**: Color-coded logs with dedicated filters for Info/Warn/Error message types
- **Responsive Module Cards**: Better spacing, alignment, and responsive behavior for all dashboard elements
- **Module Organization**: Custom ordering of modules in both dashboard and config with real-time updates
- **Consistent Styling**: Unified design language across all panels with DaisyUI components
- **Custom Window Styling**: Branded window appearance with minimize/maximize/close controls
- Dashboard module cards with better spacing, alignment, and responsiveness
- Config module cards with clearer labels and logical grouping

### ⚙️ Configuration System

- **Real-time Config Updates**: Changes apply immediately without requiring restart
- **Organized Config Categories**: Logical grouping of related settings for easier navigation
- **Improved Input Validation**: Better feedback for invalid configuration entries
- **Auto-saving**: Configuration changes are persisted immediately with visual confirmation

### 🧪 Testing & Development

- **Enhanced Debug System**: Simplified log level controls (OK/Warn/Error visibility toggles)
- **Live Command Testing**: Test commands in GUI without needing to use Twitch chat
- **Simulated Services**: Test integrations with Twitch, OBS, and Discord without actual connections
- **Config Validation**: Immediate feedback on configuration errors with clear error messages
- Streamlined codebase with reduced duplication
- Better error reporting and diagnostic information
- More maintainable module structure for future extensions

### 🔧 Improved

- **Memory Optimization**: Reduced memory usage by eliminating duplicate configurations
- **Fresh Config Loading**: Always get latest configuration values to prevent stale data issues
- **Auto-scrolling Optimization**: More efficient scrolling behavior in log displays
- GUI performance and responsiveness across all components
- Error handling and recovery for Twitch, OBS, and Discord connections
- Test mode functionality for simulating external services
- Real-time module visibility handling during configuration changes
- Bot startup and shutdown procedures

### 🎚️ Audio & Visual Controls

- **Enhanced OBS Source Controls**: Dynamic input fields for scene and source names
- **Improved Color Controls**: Better button layout and responsiveness for Hue light control
- **Stream Status Indicators**: Real-time status display of all connected services
- **Manual Command Entry**: Send arbitrary commands to the bot regardless of permissions

### 🐛 Fixed

- Logging inconsistencies when testing external services
- Layout issues in configuration panels
- Module visibility persistence across sessions
- OBS connection stability issues
- Sound effect triggering and handling
- Config save/load reliability

---

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

[2.0.0]: https://github.com/handofhate/VOiD/compare/v1.2.1...v2.0.0
[1.2.1]: https://github.com/handofhate/VOiD/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/handofhate/VOiD/releases/tag/v1.2.0

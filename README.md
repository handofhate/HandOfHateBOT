# 🌌 VOiD

> Version: 2.0.0 • Released: 2025-05-12

VOiD is a modular Twitch bot and stream automation platform built for creators who want total control over their tools. With rich OBS integration, chat-based interactions, real-time overlays, and a slick GUI — VOiD gives you the power to shape your stream the way _you_ want.

[![Latest Release](https://img.shields.io/github/v/release/handofhate/VOiD?label=Download%20Latest)](https://github.com/handofhate/VOiD/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A powerful stream automation dashboard for Twitch streamers. Enhance your entire streaming experience from one sleek interface - lights, sounds, OBS scenes, Discord clip sharing and more.

> Created by [@HandOfHate](https://twitch.tv/HandOfHate)

[![Donate](https://img.shields.io/badge/Donate-Keep%20VOiD%20alive-blueviolet?style=flat&logo=ko-fi)](https://ko-fi.com/handofhate)

> 💀 Like VOiD? [Support development on Ko-fi](https://ko-fi.com/handofhate) or [donate via PayPal](https://paypal.me/handofhate) to keep the lights blinking.

---

## ✨ Preview

![VOiD Dashboard](https://i.imgur.com/StYLxHR.png)

_Dashboard overview: all modules active during a live test session_

---

## 🚀 Key Features

| Feature                    | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| 🎮 **Twitch Integration**  | Real-time chat interaction and command handling             |
| 💡 **Philips Hue Control** | Dynamic lighting that responds to chat commands             |
| 🎥 **OBS Scene Control**   | Let your chat toggle OBS sources on command                 |
| 📎 **Clip Watcher**        | Automatically detect, compress, and upload clips to Discord |
| 🔊 **Sound Effects**       | Trigger audio clips from chat commands or dashboard buttons |
| 🔧 **Chat Commands**       | Create and edit dynamic chat commands with variables        |
| 🧪 **Testing Environment** | Develop and test features offline with simulation mode      |

---

## ⚙️ Installation

### Quick Start

1. **Install Node.js v18+** from [nodejs.org](https://nodejs.org/)

2. **Download VOiD:**
   ```bash
   git clone https://github.com/handofhate/VOiD.git
   ```

Or [Download Latest Release ZIP](https://github.com/handofhate/VOiD/releases/latest)

---

**Install and Launch:**

```bash
cd VOiD
npm install
npm run start:gui
```

---

## 🔧 Configuration

VOiD features a complete GUI-based configuration system - no need to edit config files manually!

### Key Setup Areas:

- **Twitch Authentication** - Connect your channel and bot account
- **Module Selection** - Enable only the features you need
- **Customization** - Edit commands, cooldowns, and behaviors
- **Integration** - Connect with OBS, Philips Hue, and Discord
- **Testing** - Simulate external services for offline development

![Config Screenshot](https://i.imgur.com/ZGISukN.png)
![Config Screenshot](https://i.imgur.com/r62ZcGj.png)
![Config Screenshot](https://i.imgur.com/2NwM7Am.png)

---

### OBS Integration

To add VOiD to your OBS as a custom dock:

1. Install the OBS [Window Dock](https://obsproject.com/forum/resources/window-dock.2005/) plugin
2. Right-click on 'VOiD' in the upper left hand corner of the VOiD window
3. In OBS, navigate to Tools > Custom Window Docks
4. Give your dock a name (e.g. 'VOiD') and select the Dockable VOiD window
5. Hit Apply and VOiD will appear in your list of docks

This gives you direct control over VOiD without leaving OBS.

---

## 🔍 Troubleshooting & Support

If you encounter issues:

1. Join our [Discord Community](https://discord.gg/fzjCEcsVns) or use the [GitHub Issues](https://github.com/handofhate/VOiD/issues) tracker to suggest features or report bugs
2. Review the [Known Issues](./KNOWN_ISSUES.md) documentation
3. Check the **Logs** tab in VOiD for detailed error messages
4. Save the output from the **Logs** tab and post it in [`#🐞bug-reports`](https://discord.gg/fzjCEcsVns) on the Discord server

The more context you can give, the faster we can squash those bugs 🧪💀

---

## 📋 System Requirements

- **OS**: Windows 10/11
- **Node.js**: v18.0.0 or higher
- **Memory**: 4GB RAM minimum
- **Storage**: 100MB available space
- **Network**: Active internet connection for Twitch/Discord features

---

## 💀 License

MIT License.  
Use it, mod it, break it — just don’t be a jerk about it.

---

### ⚡ Built for streamers who want control without compromise.

Start your stream domination today. [Download VOiD](https://github.com/handofhate/VOiD/releases/latest)

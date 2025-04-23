# 🤖 HandOfHateBOT

[![Latest Release](https://img.shields.io/github/v/release/handofhate/HandOfHateBOT?label=Download%20Latest)](https://github.com/handofhate/HandOfHateBOT/releases/latest)

A custom Twitch bot built for serious stream automation.  
Control lights, sound effects, OBS scenes, and even upload clips — all from a slick GUI dashboard.
Let chat control these too, with custom commands.

> Created with love, rage, and Node.js by [@HandOfHate](https://twitch.tv/HandOfHate)

---

## ⚡ Features

- 🎮 Twitch Chat Integration  
- 💡 Philips Hue Light Control  
- 🎥 OBS Source Toggle (WebSocket v5+)  
- 🔊 Play Local Sound Effects from GUI or Chat  
- 📎 Clip Watcher: Auto-uploads clips to Discord  
- 🧪 Testing Mode for offline dev  
- 🧠 Full Config Editor + Dashboard UI built with Tailwind/DaisyUI  

---

## 🚀 Setup Instructions

### 1. 📦 Install Node.js
Requires **Node.js v18+**  
[Download Node.js](https://nodejs.org/en)

---

### 2. 🧬 Clone the Repo

```bash
git clone https://github.com/handofhate/HandOfHateBOT.git
cd HandOfHateBOT
```

Or [Download Latest Release ZIP](https://github.com/handofhate/HandOfHateBOT/releases/latest)

---

### 3. 🛠 Install Dependencies

```bash
npm install
```

---

### 4. 🔧 First Launch

```bash
npm run start:gui
```

- If `config.js` doesn't exist, it will be auto-created from `config.blank.js`
- All settings are editable from the **Config** tab in the GUI

---

## ⚙️ Configuration

### 🔑 Sensitive values (OAuth, API keys, etc.)

- All values are stored in `config.js`
- Do **not** commit this file publicly
- A safe template is provided as `config.blank.js`

### 🧩 Editable Modules:

- `Color Control` – Philips Hue  
- `Sound Effects` – Local MP3s  
- `OBS Toggles` – Scene/source visibility  
- `Manual Commands` – Twitch chat injection  
- `Clip Watcher` – Auto-uploads recorded clips to Discord  
- `Stream Stats` – Viewer count + stream status  
- `Chat Links` – !commands, !discord, !socials  
- `Testing Mode` – Simulate Twitch & OBS for offline dev  

---

## 📂 Folder Structure

```
HandOfHateBOT/
├── gui/                   # GUI HTML/CSS for the control panel
├── sounds/                # Drop .mp3 files here for sound commands
├── app.css                # Tailwind input styles
├── backup-local.bat       # Optional local backup script
├── bot.js                 # Twitch bot core logic
├── build-css.js           # Tailwind build helper (optional)
├── config.blank.js        # Template config, safe to share
├── config.js              # Auto-generated on first run (in .gitignore)
├── main.js                # Electron entry point
├── renderer.js            # GUI and renderer logic
├── package.json           # Project metadata and dependencies
├── package-lock.json      # Dependency lockfile
├── postcss.config.js      # Tailwind/PostCSS build config
├── tailwind.config.js     # Tailwind theming setup
├── CHANGELOG.md           # Version history and patch notes
├── README.md              # GitHub project overview
├── KNOWN_ISSUES.md        # Currently known issues
├── .gitignore             # Excludes node_modules, config.js, etc.
└── .gitattributes         # GitHub syntax/style helpers
```

---

## 🛠️ Troubleshooting

Before reporting a bug, try the following steps:

1. 📄 **Check the [Known Issues](./KNOWN_ISSUES.md)**  
   Many common problems and limitations are already documented.

2. 🐛 **Enable Debugging**  
   Go to the **Debug** tab in the GUI and enable all flags *except* `logClean`.  
   This will make sure detailed logs are generated to help identify the issue.

3. 📋 **Share Your Logs**  
   Copy/paste the output from the **Logs** tab and post it in  
   [`#🐞bug-reports`](https://discord.gg/fzjCEcsVns) on the Discord server.

The more context you can give, the faster we can squash those bugs 🧪💀


## 🧠 Developer Notes

- Built with Electron, TailwindCSS, DaisyUI  
- OBS uses WebSocket v5 protocol  
- All features are modular and controlled from `config.modules`  
- Designed to run via `npm`, but can be packaged with Electron Forge  

> `.exe` installer coming soon — current version is **portable / developer-friendly**

---

## 🤝 Contributing

Pull requests welcome. If you'd like to help add features, fix bugs, or clean up code — go for it.  
Open an issue or hit me up on Discord: [handofhate](https://discord.gg/fzjCEcsVns)

---

## 💀 License

MIT License.  
Use it, mod it, break it — just don’t be a jerk about it.

---

### ⚡ Built for streamers who want control without compromise.

---

📝 4/21/25 - Fixed clone link, ZIP download, and Discord invite

# 🤖 HandOfHateBOT

A custom Twitch bot built for serious stream automation.  
Control lights, sound effects, OBS scenes, and even upload clips — all from a slick GUI dashboard.

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
- `Testing Mode` – Bypass Twitch & OBS for offline dev  

---

## 📂 Folder Structure

```
HandOfHateBOT/
├── gui/                   # HTML/CSS/Renderer UI
├── sounds/                # Drop .mp3 files here
├── main.js                # Electron app entry point
├── bot.js                 # Twitch bot logic
├── renderer.js            # GUI logic
├── config.js              # Auto-generated on first run
├── config.blank.js        # Safe template for sharing
├── package.json
└── README.md
```

---

## 🧠 Developer Notes

- Built with Electron, TailwindCSS, DaisyUI  
- OBS uses WebSocket v5 protocol  
- All features are modular and controlled from `config.modules`  
- Designed to run via `npm`, but can be packaged with Electron Forge  

> `.exe` installer coming soon — current version is **portable / developer-friendly**

---

## 🤝 Contributing

Pull requests welcome. If you'd like to help add features, fix bugs, or clean up code — go for it.  
Open an issue or hit me up on Discord: [handofhate](discord.gg/fzjCEcsVns)

---

## 💀 License

MIT License.  
Use it, mod it, break it — just don’t be a jerk about it.

---

### ⚡ Built for streamers who want control without compromise.

---

📝 4/21/25 - Fixed clone link, ZIP download, and Discord invite

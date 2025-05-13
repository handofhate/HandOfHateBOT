# ⚠️ Known Issues

The following bugs, quirks, or limitations are known in the current version (`v2.0.0`). Most will be addressed in upcoming releases.

---

## 🖥️ GUI / Dashboard

---

## 🧠 Config & Test Mode

- `config.js` will not auto-create if `config.blank.js` is missing (results in a crash)

---

## 🧙‍♂️ Setup Wizard

---

## 📦 Distribution & Installation

- Packaging the app with electron-packager fails due to ES Module/CommonJS conflicts
- Users currently need to have Node.js installed to run VOiD
- No installer is available, making deployment more technical than ideal

---

## 🐛 Bot Behavior

- If a required module like `tmi.js` isn't installed, the bot exits immediately with a cryptic error
- OBS scene/source toggling is one-way — no check if the source is already visible or not

---

We're actively improving all of this. Want to report a bug?  
👉 Post in [#🐞bug-reports](https://discord.gg/fzjCEcsVns) or open an issue on GitHub!

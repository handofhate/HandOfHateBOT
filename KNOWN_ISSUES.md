# ⚠️ Known Issues

The following bugs, quirks, or limitations are known in the current version (`v1.2.0`). Most will be addressed in upcoming releases.

---

## 🖥️ GUI / Dashboard

- The Dashboard does not dynamically resize or scroll perfectly on ultra-small windows
- Viewer count and stream status does not work yet
- The “Toggle OBS Source” button requires an active connection — no retry logic if OBS isn't open

---

## 🧠 Config & Test Mode

- `config.js` will not auto-create if `config.blank.js` is missing (results in a crash)
- If `config.js` is malformed or has trailing commas, the app won't start and will throw a vague error
- Test mode flags must be re-sent manually after restarting the bot

---

## 🐛 Bot Behavior

- If a required module like `tmi.js` isn’t installed, the bot exits immediately with a cryptic error
- Sound effects will fail silently if the `sounds/` folder is missing
- `clipWatcher` may not restart properly unless manually triggered from the GUI
- OBS scene/source toggling is one-way — no check if the source is already visible or not

---

We’re actively improving all of this. Want to report a bug?  
👉 Post in [#🐞bug-reports](https://discord.gg/fzjCEcsVns) or open an issue on GitHub!

# 🧠 HandOfHateBOT Config Guide

Welcome to your **config.js setup guide**!  
This guide will walk you through how to fill out the required fields to get the bot up and running.

---

## 🎮 Twitch Setup

You'll need four values for the `twitch` section:

### 1. `username`
Your bot’s Twitch username (no @ symbol, lowercase).

```js
username: 'handofhatebot'
```

---

### 2. `oauth`
Get your **OAuth token** here:  
👉 https://twitchapps.com/tmi/

Paste the entire token, including the `oauth:` part.

```js
oauth: 'oauth:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
```

---

### 3. `clientId` & `bearerToken`

Go to: https://dev.twitch.tv/console/apps  
Click **"Register Your Application"** if you don’t already have one.

Once created:
- `clientId` is shown on the app page.
- To get your `bearerToken` (OAuth Access Token), use one of the following:
  - [Twitch Token Generator (Web)](https://twitchtokengenerator.com)
  - [Twitch OAuth Token Guide (Docs)](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/)

Example:

```js
clientId: 'your_client_id_here',
bearerToken: 'your_bearer_token_here'
```

---

## 💡 Philips Hue Setup

### 1. `bridgeIp`
You can find your Hue Bridge IP by:
- Opening the **Philips Hue App** → Settings → Bridge Info
- Or visiting: https://discovery.meethue.com/

Example:
```js
bridgeIp: '192.168.1.2'
```

---

### 2. `apiKey` (Hue API Key)

1. Visit in browser:  
   `http://<your-bridge-ip>/debug/clip.html`
2. Fill in:
   - URL: `/api`
   - Body: `{"devicetype":"handofhatebot"}`
3. Click **POST**
4. Press the button on your Hue Bridge
5. Copy the returned `"username"` — that’s your API key

```js
apiKey: 'your_hue_api_key_here'
```

---

### 3. `bulbIds`

Visit:  
`http://<your-bridge-ip>/api/<your-api-key>/lights`

You’ll see something like:
```json
{
  "1": {...},
  "2": {...},
  "3": {...}
}
```

The numbers are your bulb IDs. Add them like so:

```js
bulbIds: [1, 2, 3]
```

---

## 🎥 OBS WebSocket Setup

### 1. `websocketUrl`

Default is:

```js
websocketUrl: 'ws://127.0.0.1:4455'
```

Make sure the **OBS WebSocket plugin** is installed:  
👉 https://github.com/obsproject/obs-websocket

---

### 2. `sceneName` & `sourceName`

These must **exactly match** the scene/source names in your OBS setup.

Example:

```js
sceneName: 'Mini CatCam',
sourceName: 'CatCam'
```

---

## 🌐 Command Links & Socials

These values live in the `links` section of your config.js.

### 1. `commandsUrl`
This should point to a web page where users can view all your chat commands.

```js
commandsUrl: 'https://commands.handofhate.com'
```

---

### 2. `discordInvite`
Your public Discord server invite link:

```js
discordInvite: 'https://discord.gg/yourinvitecode'
```

---

### 3. `socialLinks`
This is an array of your social media shoutouts for the `!socials` command.  
Each entry is a string. You can customize the emojis, platforms, and format.

Example:

```js
socialLinks: [
  '📲 Follow me on social media:',
  '📸 Instagram: ---> instagram.com/yourname',
  '📘 Facebook: ---> facebook.com/yourname',
  '🎵 TikTok: ---> tiktok.com/@yourname'
]
```

You can add or remove lines freely.

---

## ✅ Final Step

Once you’ve filled out your `config.blank.js`, make sure to:

- 💾 Rename it to `config.js` and save it in the same folder as `bot.js`
- 🛑 **Never share it publicly** (add `config.js` to `.gitignore` if using Git)
- 🚀 Run your bot and enjoy the stream automation!

---

Made with 💀 by Ty @ [HandOfHate](https://twitch.tv/handofhate)
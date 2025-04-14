HandOfHateBOT Config Guide
===========================

Welcome to your config.js setup guide!
This guide will walk you through how to fill out the required fields to get the bot up and running.


🎮 Twitch Setup
----------------

You'll need four values for the twitch section:

1. username
   Your bot’s Twitch username (no @ symbol, lowercase).

   Example:
   username: 'handofhatebot'

2. oauth
   Get your OAuth token here:
   https://twitchapps.com/tmi/

   Paste the entire token, including the oauth: part.

   Example:
   oauth: 'oauth:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

3. clientId and bearerToken
   - Go to: https://dev.twitch.tv/console/apps
   - Click "Register Your Application" if you don’t already have one.

   Once created:
   - clientId is shown on the app page.
   - To get your bearerToken (OAuth Access Token), use one of the following:
     - Twitch Token Generator: https://twitchtokengenerator.com
     - Twitch OAuth Token Guide: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/

   Example:
   clientId: 'your_client_id_here'
   bearerToken: 'your_bearer_token_here'


💡 Philips Hue Setup
---------------------

1. bridgeIp
   You can find your Hue Bridge IP by:
   - Opening the Philips Hue App → Settings → Bridge Info
   - Or visiting: https://discovery.meethue.com/

   Example:
   bridgeIp: '192.168.1.2'

2. apiKey
   - Visit in browser: http://<your-bridge-ip>/debug/clip.html
   - Fill in:
     URL: /api
     Body: {"devicetype":"handofhatebot"}
   - Click POST
   - Press the button on your Hue Bridge
   - Copy the returned "username" — that’s your API key

   Example:
   apiKey: 'your_hue_api_key_here'

3. bulbIds
   Visit: http://<your-bridge-ip>/api/<your-api-key>/lights

   You’ll see something like:
   {
     "1": {...},
     "2": {...},
     "3": {...}
   }

   The numbers are your bulb IDs. Add them like so:
   bulbIds: [1, 2, 3]


🎥 OBS WebSocket Setup
-----------------------

1. websocketUrl
   Default is: ws://127.0.0.1:4455

   Make sure the OBS WebSocket plugin is installed:
   https://github.com/obsproject/obs-websocket

2. sceneName and sourceName
   These must exactly match the scene/source names in your OBS setup.

   Example:
   sceneName: 'Mini CatCam'
   sourceName: 'CatCam'


📎 Command Links (Optional)
----------------------------

If you're using commands like !commands or !discord, you can configure their links here too:

Example:
commandListUrl: 'https://commands.handofhate.com'
discordInviteUrl: 'https://discord.gg/fzjCEcsVns'


📲 Social Media Links (Optional)
---------------------------------

Configure your social links in this section:

instagram: 'https://instagram.com/handofhate'
facebook: 'https://facebook.com/handofhate'
tiktok: 'https://tiktok.com/@handofhate'


✅ Final Step
-------------

Once you’ve filled out your config.blank.js, make sure to:

- Rename it to config.js and save it in the same folder as bot.js
- Never share it publicly
- Add config.js to your .gitignore file if using Git
- Run your bot and enjoy the stream automation!

Created with 💀 by Ty @ https://twitch.tv/handofhate

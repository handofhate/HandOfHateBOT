// =============================================
//           HandOfHateBOT Config File
// =============================================
// This file stores all sensitive info and important settings.
// Rename this file to config.js and fill in your own values.
// =============================================

module.exports = {
    // =============================================
    //             Twitch Credentials
    // =============================================
    twitch: {
        // Your bot's Twitch username (lowercase, no @)
        username: '',

        // Your Twitch OAuth token
        // Get one here: https://twitchapps.com/tmi/
        oauth: '',

        // Your Twitch Developer Client ID
        clientId: '',

        // Your Twitch App Access Token (Bearer token)
        // Generated via Twitch API or OAuth flow
        bearerToken: '',

        // Your Twitch Channel Name
        channel: '',

        // Display name for your stream (used in bot messages like !uptime)
        streamerName: ''
    },

    // =============================================
    //           Philips Hue Settings
    // =============================================
    hue: {
        // IP address of your Philips Hue Bridge
        bridgeIp: '',

        // API Key for the bridge
        // Get one by creating a user via Hue API:
        // https://developers.meethue.com/develop/hue-api/
        apiKey: '',

        // IDs of bulbs you want to control
        bulbIds: [ ]
    },

    // =============================================
    //           OBS WebSocket Settings
    // =============================================
    obs: {
        // WebSocket URL for OBS (default is fine unless changed)
        websocketUrl: 'ws://127.0.0.1:4455',

        // Scene and Source names used for toggling source
        sceneName: '',
        sourceName: ''
    },

    // =============================================
    //           Command Links & Socials
    // =============================================
    links: {
        // Link to your full commands list (e.g. a hosted commands page)
        commandsUrl: 'commands.handofhate.com',

        // Your public Discord invite link
        discordInvite: 'discord.gg/fzjCEcsVns',

        // Array of social media links (displayed on !socials)
        // You can add/remove or customize as needed
        socialLinks: [
            '📲 Follow me on social media:',
            '📸 Instagram: ---> instagram.com/handofhate',
            '📘 Facebook: ---> facebook.com/handofhate',
            '🎵 TikTok: ---> tiktok.com/@handofhate'
        ]
    }
};

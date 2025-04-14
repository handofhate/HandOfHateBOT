// =============================================
//           HandOfHateBOT Config File
// =============================================
// This file stores all sensitive info and important settings.
// Edit this file with your own values as needed.
// =============================================

module.exports = {
    // =============================================
    //             Twitch Credentials
    // =============================================
    twitch: {
        // Your bot's Twitch username (lowercase, no @)
        username: 'handofhatebot',

        // Your Twitch OAuth token
        // Get one here: https://twitchapps.com/tmi/
        oauth: 'oauth:ug6cw8534l34qnbdaiijkwvyngr7c7',

        // Your Twitch Developer Client ID
        clientId: 'f5g2xlfr57s5qxf9yjj9l6vyzg39dy',

        // Your Twitch App Access Token (Bearer token)
        // Generated via Twitch API or OAuth flow
        bearerToken: 'tmj2b42q89dibkk40vr3uw1n1kzrm7',

        // Your Twitch Channel Name
        channel: 'handofhate',

        // Display name for your stream (used in bot messages like !uptime)
        streamerName: 'Ty'
    },

    // =============================================
    //           Philips Hue Settings
    // =============================================
    hue: {
        // IP address of your Philips Hue Bridge
        bridgeIp: '192.168.86.85',

        // API Key for the bridge
        // Get one by creating a user via Hue API:
        // https://developers.meethue.com/develop/hue-api/
        apiKey: 'sodCKHT0oj0pMl5brLmkYMIFPVBAPwaL-rqHBL5r',

        // IDs of bulbs you want to control
        bulbIds: [24, 25, 26, 27]
    },

    // =============================================
    //           OBS WebSocket Settings
    // =============================================
    obs: {
        // WebSocket URL for OBS (default is fine unless changed)
        websocketUrl: 'ws://127.0.0.1:4455',

        // Scene and Source names used for toggling source
        sceneName: 'Mini CatCam',
        sourceName: 'CatCam'
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

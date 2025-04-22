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
      username: '',          // Twitch bot username (lowercase)
      oauth: '',             // OAuth token from https://twitchapps.com/tmi/
      clientId: '',          // Twitch Developer Client ID
      clientSecret: '',      // Twitch Client Secret
      bearerToken: '',       // App Access Token (bearer)
      channel: '',           // Channel the bot will connect to
      streamerName: ''       // Your name (for display in bot messages)
    },
  
    // =============================================
    //           Philips Hue Settings
    // =============================================
    hue: {
      bridgeIp: '',          // IP of your Hue Bridge
      apiKey: '',            // Hue API key from developer portal
      bulbIds: [ ]           // IDs of the bulbs to control
    },
  
    // =============================================
    //           OBS WebSocket Settings
    // =============================================
    obs: {
      websocketUrl: 'ws://127.0.0.1:4455',
      sceneName: '',
      sourceName: ''
    },
  
    // =============================================
    //           Command Links & Socials
    // =============================================
    links: {
      commandsUrl: '',       // e.g. https://commands.handofhate.com
      discordInvite: '',     // e.g. https://discord.gg/yourcode
      socialLinks: [
        '📲 Follow me on social media:',
        '📸 Instagram: ---> instagram.com/yourname',
        '🎵 TikTok: ---> tiktok.com/@yourname'
      ]
    },
  
    // =============================================
    //               Debug Flags
    // =============================================
    debug: {
      logClean: false,
      logColorDebugMessages: true,
      logColorSuccessMessages: true,
      logSoundDebugMessages: true,
      logSoundSuccessMessages: true,
      logOBSDebugMessages: true,
      logOBSSuccessMessages: true,
      logClipWatcherSuccessMessages: true,
      logClipWatcherDebugMessages: true,
      logUserChatMessages: true,
      logBotChatMessages: true
    },
  
    // =============================================
    //               Enabled Modules
    // =============================================
    modules: {
      colorControl: true,
      soundEffects: true,
      obsToggles: true,
      manualCommands: true,
      clipWatcher: true,
      streamStats: true,
      testingMode: true,
      obsSourceToggles: true,
      chatLinks: true
    },
  
    // Order modules appear in the dashboard
    modulesOrder: [
      'colorControl',
      'soundEffects',
      'obsToggles',
      'chatLinks',
      'manualCommands',
      'clipWatcher',
      'streamStats',
      'testingMode'
    ],
  
    // =============================================
    //             Clip Watcher Settings
    // =============================================
    clipFolder: '',                     // Local folder where OBS saves clips
    discordWebhookUrl: '',             // Discord webhook to post clips
    maxFileSizeMb: 8,                  // Max file size for clip upload (MB)
  
    knownGames: {
      // Process names mapped to game names
      'repo.exe': 'REPO',
      'overwatch.exe': 'Overwatch 2',
      'rust.exe': 'Rust',
      'rustclient.exe': 'Rust',
      'lethal company.exe': 'Lethal Company'
    },
  
    deleteOriginalAfterPost: false,
    deleteCompressedAfterPost: true
  };
  
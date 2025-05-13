// ==============================================
//            VOiD Configuration File
// ==============================================
//    This file stores all sensitive info and
//    important settings. Rename this file to
//    config.js and fill in your own values.
// ==============================================

module.exports = {

// ==============================================
//             Twitch Credentials
// ==============================================

  twitch: {
    channel: '',                               // Channel the bot will connect to
    streamerName: '',                          // Your name (for display in bot messages)
    username: '',                              // Twitch bot username (lowercase)
    clientId: '',                              // Twitch Developer Client ID
    clientSecret: '',                          // Twitch Client Secret
    redirectUri: 'http://localhost:3000/auth/twitch/callback',                           // OAuth redirect URI
    oauth: '',                                 // OAuth token
    bearerToken: '',                           // App Access Token (bearer)
    refreshToken: ''                           // OAuth refresh token
  },

// ==============================================
//           Philips Hue Settings
// ==============================================

  hue: {
    bridgeIp: '',                              // IP of your Hue Bridge
    apiKey: '',                                // Hue API key from developer portal
    bulbIds: []                                // IDs of the bulbs to control
  },
  hueCooldown: 1000,                           // Cooldown between color changes (ms)

// ==============================================
//           OBS WebSocket Settings
// ==============================================

  obs: {
    websocketUrl: 'ws://127.0.0.1:4455',       // WebSocket URL for OBS connection
    toggleSources: [                           // Sources that can be toggled via commands
      {
        name: '',                              // Command name to use (e.g. !sourceName)
        sceneName: '',                         // Scene containing the source
        sourceName: '',                        // Source to toggle
        duration:10000,                        // Time in ms to show source
        label: ''                              // Label for dashboard button
      }
    ]
  },

// ==============================================
//             Module Management
// ==============================================

  modules: {
    colorControl: false,                        // Hue light control
    obsToggles: false,                          // OBS source toggling
    clipWatcher: false,                         // Auto-clip posting
    soundEffects: false,                        // Sound effects playback
    chatCommands: false,                        // Custom chat commands
    testingMode: false,                         // Testing mode controls
    manualCommands: false,                      // Manual command execution
    chatOverlay: false                          // Chat overlay window
  },

  modulesOrder: [                              // Order modules appear in the dashboard
    "colorControl",
    "obsToggles",
    "clipWatcher",
    "soundEffects",
    "chatCommands",
    "testingMode",
    "manualCommands",
    "chatOverlay"
  ],

// ==============================================
//             Clip Watcher Settings
// ==============================================

  clipFolder: '',                              // Local folder where OBS saves clips
  discordWebhookUrl: '',                       // Discord webhook to post clips
  maxFileSizeMb: 8,                            // Max file size for clip upload (MB)
  smartCompression: true,                      // Enable smart compression
  compressionLevel: 'medium',                  // Compression level (minimal, low, medium, high, extreme)
  
  knownGames: {                                // Game process detection mapping
    'repo.exe': 'REPO',
    'overwatch.exe': 'Overwatch 2',
    'card shop simulator.exe': 'TCG Card Shop Simulator',
    'rustclient.exe': 'Rust',
    'rust.exe': 'Rust',
    'lethal company.exe': 'Lethal Company'
  },

  deleteOriginalAfterPost: false,              // Delete original clip after posting
  deleteCompressedAfterPost: false,            // Delete compressed clip after posting

// ==============================================
//             Sound Effects Settings
// ==============================================

  soundEffectsFolder: '',                      // Folder containing sound effects (.mp3)

// ==============================================
//              Custom Chat Commands
// ==============================================

  chatCommands: {                              // Format: "!command": "Response text"
                                               // Variables: $(user), $(target), $(botVersion)

    "!commands": "📋 View a complete list of available commands: ---> commands.yoursite.com",
    "!discord": "👥 Join the Discord: ---> discord.gg/yourinvite",
    "!drops": "🎁 Drops are enabled here! Information: ---> twitch.tv/drops",
    "!lurk": "🫥 $(user) is lurking in the shadows — silent, watching, and waiting.",
    "!hug": "🫂 $(user) hugs $(target) until $(target) can feel something again.",
    "!version": "VOiD v$(botVersion) — ready to serve.",
    "!socials": "📲 Follow me on social media:\n📸 Instagram: ---> instagram.com/youraccount\n📘 Facebook: ---> facebook.com/youraccount\n🎵 TikTok: ---> tiktok.com/@youraccount"
  },

// ==============================================
//                Timing Settings
// ==============================================

  timing: {
    multiLineDelay: 1000                       // Delay between multi-line messages (ms)
  },

// ==============================================
//               Testing Settings
// ==============================================

  testing: {
    simulateTwitch: false,                     // Simulate Twitch without connecting
    simulateOBS: false,                        // Simulate OBS without connecting
    simulateDiscord: false                     // Simulate Discord without posting
  }
};
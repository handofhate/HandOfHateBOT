// ==============================================
//               configHelpers.js
// ==============================================

const moduleHelpText = {
  colorControl: `
## Color Control Module
Control Philips Hue lights from your dashboard.
Let chat control your Philips Hue lights.

### Configuration:
- **Bridge IP**: The IP address of your Hue Bridge (e.g., 192.168.1.100)
- **API Key**: Your Hue Bridge API key (create one in the Hue app)
- **Bulb IDs**: The numeric IDs of the bulbs you want to control

### Usage:
You can press color buttons from the Dashboard to change the light color.
Users can type color commands in chat to change your lights: \`!red\`, \`!blue\`, \`!green\`,\`!randomcolor\`, etc.
  `,

  soundEffects: `
## Sound Effects Module
Play sound effects from your dashboard.
Let chat play sound effects.

### Configuration:
- **Sound Effects Folder**: Directory containing your .mp3 sound files
- Sound filenames will automatically become buttons and commands (e.g., \`wow.mp3\` becomes \`!wow\`)

### Usage:
Place MP3 files in your sounds folder. Files should be named appropriately for the command you want.
You can press sound effect buttons from the Dashboard to play sound effects.
Users can type sound effect commands in chat to play sound effects.
  `,

  obsToggles: `
## OBS Toggles Module
Show/hide OBS sources temporarily with chat commands.

### Configuration:
- **WebSocket URL**: Your OBS WebSocket connection (typically ws://127.0.0.1:4455)
- For each source, configure:
  - **Command Name**: Chat command without "!" (e.g., "catcam")
  - **Scene Name**: The scene containing the source
  - **Source Name**: The exact name of the source in OBS
  - **Duration**: How long to show the source before toggling it back off
  - **Display Label**: Text to show on the dashboard button

### Usage:
You can press source buttons from the Dashboard to toggle OBS Sources.
When users type commands like \`!catcam\`, the specified source will appear for the set duration.
  `,

  manualCommands: `
## Manual Commands Module
Send manual commands to VOiD.

### Configuration:
No specific configuration needed.

### Usage:
Type commands into the Manual Commands module and press Send.
  `,

  clipWatcher: `
## Clip Watcher Module
Monitors a folder for new clip files and posts them to Discord with game and timestamp tagging.

### Configuration:
- **Clips Folder**: Where your game clips are saved
- **Discord Webhook URL**: Where to post clips
- **Compression Settings**:
  - **Smart Compression**: Automatically optimizes quality to be within Discord size limits
  - **Target Size**: Maximum file size for Discord webhook posts are 8MB
  - **Quality Preset**: Using these presets disables Smart Compression, so make sure your resulting file size is under 8MB or posts will fail
- **Delete Options**: Whether to remove original/compressed files after posting
- **Known Games**: Map executable names to proper game titles for game tagging

### Tips:
- Enable Smart Compression for best results with most clips
- For very high quality or long clips, try the "low" or "minimal" compression preset
- Discord webhooks have an 8MB limit - for larger files, you'll need a bot upload solution

### Usage:
When new clips appear in the specified folder, they'll automatically be compressed and posted to your Discord.
`,

  chatCommands: `
## Chat Commands Module
Create customized chat commands with variables and multi-line responses.

### Configuration:
- **Multi-line Delay**: Time between sending each line of a multi-line response
- Create commands with the format \`!command\` and custom responses
- Use variables like \`$(user)\`, \`$(target)\`, etc. for dynamic content
- Add line breaks for multi-line responses (each line will be sent as a separate message)

### Usage:
You can press command buttons from the Dashboard to trigger commands. Users can trigger your commands in chat. Variables will be replaced with contextual values.
  `,

  testingMode: `
## Testing Mode Module
Test your bot without connecting to real services.

### Configuration:
- **Simulate Twitch**: Test chat commands without connecting to Twitch
- **Simulate OBS**: Test OBS features without connecting to OBS
- **Simulate Discord**: Test clip posting without posting to Discord

### Usage:
Enable these options when setting up and testing your VOiD configuration.
  `,

  chatOverlay: `
## Chat Overlay Module
Display Twitch chat as an overlay on your screen.

### Configuration:
No specific configuration required. The overlay uses your Twitch connection settings.

### Usage:
- Click "Toggle Overlay" to show/hide the overlay
- Move and Resize the overlay as needed
- Click "VOiD" to lock the overlay and enable transparency
  `,

  twitchSettings: `
## Twitch Settings

Connect your bot to your Twitch channel for chat interaction.

### Configuration:
- **Your Channel**: The channel where the bot will operate (without the @ symbol)
- **Your Name**: How the bot should refer to you in messages
- **Bot Username**: The Twitch account created for your bot (without the @ symbol)
- **Client ID**: The Twitch API client ID for your bot
- **Client Secret**: The Twitch API client secret for your bot
- **Redirect URI**: The Twitch API redirect URI for your bot
- **Login with Twitch**: Authenticate the bot with Twitch (recommended)

### Advanced Settings:
- **OAuth Token**: Authentication token (generated automatically)
- **Bearer/Refresh Tokens**: Used for API authentication (generated automatically)

### Tips:
- Your bot will need its own Twitch account, Client ID, and Secret
- Follow <a href="https://dev.twitch.tv/docs/authentication/register-app/" style="color:#00ffff; font-weight:bold;" target="_blank" rel="noopener">this guide</a> to create a Twitch Dev App and generate your Client ID and Secret
- In most cases, your Redirect URI can be <code onclick="navigator.clipboard.writeText('http://localhost:3000/auth/twitch/callback')" style="background:#222; padding:4px 8px; border-radius:4px; display:inline-block; cursor:pointer;" title="Click to copy">http&#58;//localhost:3000/auth/twitch/callback</code>
- After filling in all the necessary info, use the "Login with Twitch" button to complete setup
- Make sure you are logging into your Twitch bot account, not your streamer account
- Only edit the locked fields if you know what you're doing
`,

  moduleOrder: `
## Module Order

Customize the order in which modules appear in your dashboard.

### Usage:
1. Drag the ⋮⋮ handle on the left of any module
2. Drop it in the desired position
3. The module will automatically move to that position in the Dashboard and Config tabs

### Tips:
- Place your most frequently used modules at the top
- Group related modules together for easier workflow
- Changes take effect immediately after dropping a module
`,
};

/**
 * Get help text for a specific module
 * @param {string} moduleName - The module name
 * @returns {string} The help text in markdown format
 */
function getModuleHelp(moduleName) {
  return moduleHelpText[moduleName] || 'No help available for this module.';
}

// ==============================================
//                    Exports
// ==============================================

module.exports = {
  getModuleHelp,
};

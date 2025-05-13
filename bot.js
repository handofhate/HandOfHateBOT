// ==============================================
//                    bot.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const tmi = require('tmi.js');
const path = require('path');
const loadConfig = require('./utils/loadConfig');
const config = loadConfig();
const args = process.argv.slice(2);
const log = require('./gui/ui/logger')('BOT');

process.on('unhandledRejection', (reason) => {
  log.error(`Unhandled Promise Rejection: ${reason}`);
});

// ==============================================
//                Version + Flags
// ==============================================

const BOT_VERSION = require('./version');
const testFlags = require('./bot/testFlags');
testFlags.updateFromArgs(args);

// ==============================================
//                    Modules
// ==============================================

const { startClipWatcher, updateClipWatcherConfig } = require('./bot/clipWatcher');
const {
  handleColorCommand,
  handleColorChatCommand,
  updateColorConfig,
  setClient,
} = require('./bot/colorControl');
const colorControl = require('./bot/colorControl');
const COLOR_COMMANDS = [
  'red',
  'green',
  'blue',
  'yellow',
  'purple',
  'cyan',
  'magenta',
  'orange',
  'white',
  'black',
  'randomcolor',
];
const { updateSoundConfig, setClient: setSoundClient } = require('./bot/soundPlayer');
const soundEffects = require('./bot/soundPlayer');
const { SOUND_COMMANDS } = soundEffects;
const {
  setClient: setObsClient,
  setSimulateFlags: setObsSimFlags,
  connectToOBS,
  handleObsToggleCommand,
} = require('./bot/obsToggles');
const { handleManualCommand, updateManualCommandConfig } = require('./bot/manualCommands');
const {
  setClient: setChatClient,
  updateChatCommandConfig,
  handleChatCommand,
} = require('./bot/chatCommands');
const BUILT_IN_CHAT_COMMANDS = [
  'version',
  'commands',
  'discord',
  'drops',
  'socials',
  'lurk',
  'hug',
];
let ALL_CHAT_COMMANDS = [...BUILT_IN_CHAT_COMMANDS];

// ==============================================
//             Optional Module Init
// ==============================================

if (config.modules?.clipWatcher !== false) {
  updateClipWatcherConfig({
    ...config,
    simulateDiscord: testFlags.isSimDiscord(),
    simulateOBS: testFlags.isSimOBS(),
    simulateTwitch: testFlags.isSimTwitch(),
  });
  startClipWatcher();
}

connectToOBS(config.obs.websocketUrl, testFlags.isSimOBS());

// ==============================================
//            Refresh Token + Launch
// ==============================================

const refreshTwitchToken = require('./utils/refreshTwitchToken');

let client = null;

(async () => {
  const newToken = await refreshTwitchToken();
  if (newToken) {
    log.ok('Twitch token refreshed before bot launch.');
    config.twitch.oauth = `oauth:${newToken}`;
    config.twitch.bearerToken = newToken;
  } else {
    log.warn('⚠️ Failed to refresh token. Using current token.');
  }

  // ==============================================
  //             Twitch Client Setup
  // ==============================================

  client = new tmi.Client({
    options: { debug: false },
    connection: { reconnect: true, secure: true },
    identity: {
      username: config.twitch.username,
      password: config.twitch.oauth,
    },
    channels: [config.twitch.channel],
  });

  // ==============================================
  //             Module Initialization
  // ==============================================

  setClient(client);
  setSoundClient(client);
  setChatClient(client);
  setObsClient(client);
  colorControl.setClient(client);

  updateManualCommandConfig(config);
  updateChatCommandConfig({ ...config, botVersion: BOT_VERSION });

  const CONFIG = {
    hue: {
      bridgeIp: config.hue.bridgeIp,
      apiKey: config.hue.apiKey,
      bulbIds: config.hue.bulbIds,
      cooldown: 1000,
    },
    constants: {
      obs: {
        sceneName: config.obs.sceneName,
        sourceName: config.obs.sourceName,
      },
      folders: {
        sounds: path.join(__dirname, 'sounds'),
      },
      emojis: {
        warning: '⚠️',
        sound: '🔊',
        cat: '🐱',
        brain: '🧠',
        light: '💡',
      },
    },
    timing: {
      hueCooldown: 1000,
      obsToggleDuration: 10000,
      obsCheckInterval: 10000,
      multiLineDelay: 1000,
    },
  };

  updateColorConfig(CONFIG);
  updateSoundConfig(CONFIG);
  setObsSimFlags({
    simulateOBS: testFlags.isSimOBS(),
    simulateTwitch: testFlags.isSimTwitch(),
  });

  // ==============================================
  //              Command Registration
  // ==============================================

  function refreshCommandList() {
    ALL_CHAT_COMMANDS = [...BUILT_IN_CHAT_COMMANDS];

    const configCommands = Object.keys(config.chatCommands || {}).map((cmd) =>
      cmd.startsWith('!') ? cmd.slice(1) : cmd
    );

    const allCommands = [...ALL_CHAT_COMMANDS, ...configCommands];
    ALL_CHAT_COMMANDS = allCommands.filter((cmd, index) => allCommands.indexOf(cmd) === index);

    log.ok(`Registered ${ALL_CHAT_COMMANDS.length} total chat commands`);
  }

  refreshCommandList();

  // ==============================================
  //                Message Handler
  // ==============================================

  function handleCommand(channel, tags, message) {
    const username = tags['display-name'] || 'Unknown';
    const isFromGUI = username === 'GUI';

    if (!isFromGUI && !message.startsWith('!')) return;

    const parts = message.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    log.ok(`Received command: ${command} from ${username}`);

    if (isFromGUI) handleManualCommand(message, channel, username);

    if (handleObsToggleCommand(command, channel, config)) {
      log.ok('Handled by: OBS Toggles');
      return;
    }

    if (isFromGUI && !command.startsWith('!')) {
      log.warn("Command does not start with '!' - adding prefix");
      const fixedCommand = `!${command}`;
      const fixedMessage = `!${message}`;
      log.ok(`Modified command to: ${fixedCommand}`);
      client.emit('message', channel, tags, fixedMessage, false);
      return;
    }

    const colorOnly = command.slice(1);
    if (COLOR_COMMANDS.includes(colorOnly)) {
      if (handleColorCommand(command, channel)) log.ok('Handled by: Color Control');
      return;
    }

    if (handleColorChatCommand(command, channel, parts)) {
      log.ok('Handled by: Color Control');
      return;
    }

    const soundOnly = command.slice(1);
    if (SOUND_COMMANDS.includes(soundOnly) || command === '!randomsound') {
      if (soundEffects.handleSoundChatCommand(command, channel)) {
        log.ok('Handled by: Sound Player');
        return;
      }
    }

    if (handleChatCommand(command, channel, username, args)) {
      log.ok('Handled by: Chat Commands');
      return;
    }

    const chatOnly = command.slice(1);
    if (
      ALL_CHAT_COMMANDS.includes(chatOnly) ||
      (config.chatCommands && config.chatCommands[command])
    ) {
      if (handleChatCommand(command, channel, username, args)) {
        log.ok('Handled by: Chat Commands');
        return;
      }
    }

    log.warn(`Unknown command: ${command}`);
  }

  // ==============================================
  //               Twitch Listeners
  // ==============================================

  client.on('message', (channel, tags, message, self) => {
    if (self) return;
    if (testFlags.isSimTwitch() && tags['display-name'] !== 'GUI') return;
    handleCommand(channel, tags, message);

    // ==============================================
    //             Overlay Chat Forward
    // ==============================================

    const { sendToOverlay } = require('./utils/overlayMessenger');

    sendToOverlay({
      username: tags['display-name'] || tags.username || 'Unknown',
      message: message,
    });
  });

  log.ok(`Bot launched at ${new Date().toLocaleTimeString()}`);

  // ==============================================
  //             Twitch Connection
  // ==============================================

  async function connectToTwitch() {
    if (testFlags.isSimTwitch()) {
      log.ok('Simulating Twitch connection');
      return;
    }

    try {
      await client.connect();
      log.ok('Connected to Twitch.');
    } catch (err) {
      log.error(`Twitch login failed: ${err.message || err}`);
      process.emit('botLoginFailed', { platform: 'twitch', error: err });
      return;
    }
  }

  // ==============================================
  //              GUI Input Handler
  // ==============================================

  process.stdin.on('data', (data) => {
    const input = data.toString().trim();
    if (!input) return;
    const fakeChannel = `#${config.twitch.channel}`;
    const fakeTags = { 'display-name': 'GUI' };
    client.emit('message', fakeChannel, fakeTags, input, false);
  });

  connectToTwitch();
})();

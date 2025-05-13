// ==============================================
//                colorControl.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const axios = require('axios');
const log = require('../gui/ui/logger')('COLOR');
const { isSimTwitch } = require('../bot/testFlags');
const saveConfig = require('../utils/saveConfig');

function getConfig() {
  delete require.cache[require.resolve('../config.js')];
  return require('../config.js');
}

let client = null;

// ==============================================
//               Predefined Colors
// ==============================================

const COLORS = {
  red: { hue: 0, sat: 254 },
  green: { hue: 25500, sat: 254 },
  blue: { hue: 46920, sat: 254 },
  yellow: { hue: 12750, sat: 254 },
  purple: { hue: 50000, sat: 254 },
  cyan: { hue: 21845, sat: 254 },
  magenta: { hue: 60000, sat: 254 },
  orange: { hue: 10000, sat: 254 },
  pink: { hue: 58000, sat: 200, bri: 254 },
  white: { hue: 0, sat: 0 },
  black: { on: false },
};

let lastColorChange = 0;

// ==============================================
//            Configuration + Client
// ==============================================

async function updateColorConfig(newConfig) {
  try {
    if (newConfig.hue) {
      await saveConfig({
        hue: newConfig.hue,
        hueCooldown: newConfig.timing?.hueCooldown,
      });
    }
  } catch (error) {
    log.error('Failed to save color control config:', error);
  }
}

function setClient(tmiClient) {
  client = tmiClient;
}

function formatList(list) {
  return list
    .map((n) => n.toString())
    .reduce((str, curr, i, arr) => {
      if (i === 0) return curr;
      if (i === arr.length - 1) return `${str} and ${curr}`;
      return `${str}, ${curr}`;
    }, '');
}

// ==============================================
//                Handle Command
// ==============================================

async function handleColorCommand(command, channel, hueOverride = null) {
  const config = getConfig();

  const now = Date.now();
  if (now - lastColorChange < config.hueCooldown) {
    log.warn('Color command ignored due to cooldown');
    return false;
  }

  lastColorChange = now;

  let colorName = '';
  let colorData = null;

  if (hueOverride !== null) {
    colorData = { hue: hueOverride, sat: 254, bri: 254 };
    colorName = `hue ${hueOverride}`;
  } else {
    colorName = command.slice(1);
    if (colorName === 'randomcolor') {
      colorData = { hue: Math.floor(Math.random() * 65535), sat: 254 };
      colorName = 'a random color';
    } else {
      colorData = COLORS[colorName];
    }
  }

  if (colorData) {
    changeColor(colorData, colorName);
    const botMessage = `💡 Changing the lights to ${colorName}.`;
    if (isSimTwitch()) {
      log.ok(`Simulating chat message: ${botMessage}`);
    } else if (client) {
      try {
        await client.say(channel, botMessage);
        log.botChat(botMessage);
      } catch (err) {
        log.error(`Failed to send Twitch message: ${botMessage} — ${err.message || err}`);
      }
    }
    return true;
  }

  log.warn(`Unknown color command: ${command}`);
  return false;
}

// ==============================================
//             Change Color Utility
// ==============================================

async function changeColor(color, colorName) {
  const config = getConfig();

  const bri = color.bri !== undefined ? color.bri : 254;
  const on = color.on !== undefined ? color.on : true;

  const successfulBulbs = [];

  for (let bulbId of config.hue.bulbIds) {
    const url = `http://${config.hue.bridgeIp}/api/${config.hue.apiKey}/lights/${bulbId}/state`;
    try {
      await axios.put(url, { on, hue: color.hue, sat: color.sat, bri });
      successfulBulbs.push(bulbId);
    } catch (error) {
      log.error(`Failed to set bulb ${bulbId} to ${colorName} — ${error.message || error}`);
    }
  }

  if (successfulBulbs.length > 0) {
    const bulbsFormatted =
      successfulBulbs.length === 1
        ? `bulb ${successfulBulbs[0]}`
        : `bulb(s) ${formatList(successfulBulbs)}`;
    log.ok(`Set ${bulbsFormatted} to ${colorName}`);
  }
}

// ==============================================
//          Handle !color <hue> Input
// ==============================================

function handleColorChatCommand(command, channel, parts) {
  if (command !== '!color') return false;

  if (parts.length === 2) {
    const hueValue = parseInt(parts[1], 10);
    if (!isNaN(hueValue) && hueValue >= 0 && hueValue <= 65535) {
      return handleColorCommand(command, channel, hueValue);
    } else {
      const msg = '🧠 Invalid hue value! Please provide a number between 0 and 65535.';
      client.say(channel, msg);
      log.botChat(msg);
      log.error(`Invalid !color input: ${parts[1]}`);
    }
  } else {
    const msg = '🧠 Usage: !color <hue> — please provide a number.';
    if (isSimTwitch()) {
      log.ok(`Simulating chat message: ${msg}`);
    } else if (client) {
      try {
        client.say(channel, msg);
        log.botChat(msg);
      } catch (err) {
        log.error(`Failed to send Twitch message: ${msg} — ${err.message || err}`);
      }
    }
    log.warn('!color command missing hue argument');
  }

  return true;
}

// ==============================================
//                    Exports
// ==============================================

module.exports = {
  handleColorCommand,
  handleColorChatCommand,
  updateColorConfig,
  setClient,
};

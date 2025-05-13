// ==============================================
//               chatCommands.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

let CLIENT = null;

const log = require('../gui/ui/logger')('CHAT');
const { isSimTwitch } = require('../bot/testFlags');

function getConfig() {
  delete require.cache[require.resolve('../config.js')];
  return require('../config.js');
}

// ==============================================
//                     Init
// ==============================================

function setClient(tmiClient) {
  CLIENT = tmiClient;
}

function updateChatCommandConfig(config) {
  const commands = config?.chatCommands || {};
  log.ok(`Loaded ${Object.keys(commands).length} custom chat commands`);
}

// ==============================================
//         Command Response Formatting
// ==============================================

function formatResponse(response, data = {}) {
  if (!response) return '';

  const BOT_VERSION = require('../version');

  return response.replace(/\$\(([a-zA-Z0-9_]+)\)/g, (match, varName) => {
    if (varName === 'botVersion') return BOT_VERSION;

    if (data[varName] !== undefined) {
      return data[varName];
    }

    return match;
  });
}

// ==============================================
//               Command Handler
// ==============================================

async function handleChatCommand(command, channel, username, args = []) {
  const config = getConfig();
  const commands = config.chatCommands || {};

  const normalizedCommand = command.toLowerCase();
  if (!normalizedCommand.startsWith('!')) return false;

  const response = commands[normalizedCommand];

  if (!response) {
    return false;
  }

  log.ok(`Handling command: ${normalizedCommand} from ${username}`);

  if (!CLIENT && !isSimTwitch()) {
    log.error('Tried to respond, but CLIENT is not connected');
    return false;
  }

  const data = {
    user: username,
    target: args[0] || username,
    args: args.join(' '),
  };

  // ==============================================
  //          Message Delivery Methods
  // ==============================================

  if (typeof response === 'string') {
    if (response.includes('\n')) {
      const lines = response.split('\n').filter((line) => line.trim());

      lines.forEach((line, index) => {
        const formattedMsg = formatResponse(line, data);

        setTimeout(
          async () => {
            if (isSimTwitch()) {
              log.ok(
                `Simulating chat message (line ${index + 1}/${lines.length}): ${formattedMsg}`
              );
            } else {
              try {
                await CLIENT.say(channel, formattedMsg);
                log.botChat(`(${index + 1}/${lines.length}) ${formattedMsg}`);
              } catch (err) {
                log.error(
                  `Failed to send message (line ${index + 1}): ${formattedMsg} — ${err.message || err}`
                );
              }
            }
          },
          index * (config.timing?.multiLineDelay || 1000)
        );
      });
      return true;
    } else {
      const formattedMsg = formatResponse(response, data);

      if (isSimTwitch()) {
        log.ok(`Simulating chat message: ${formattedMsg}`);
      } else {
        try {
          await CLIENT.say(channel, formattedMsg);
          log.botChat(formattedMsg);
        } catch (err) {
          log.error(`Failed to send message: ${formattedMsg} — ${err.message || err}`);
        }
      }
      return true;
    }
  } else if (Array.isArray(response)) {
    response.forEach((line, index) => {
      const formattedMsg = formatResponse(line, data);

      setTimeout(
        async () => {
          if (isSimTwitch()) {
            log.ok(
              `Simulating chat message (multi-line ${index + 1}/${response.length}): ${formattedMsg}`
            );
          } else {
            try {
              await CLIENT.say(channel, formattedMsg);
              log.botChat(`(${index + 1}/${response.length}) ${formattedMsg}`);
            } catch (err) {
              log.error(
                `Failed to send message (multi-line): ${formattedMsg} — ${err.message || err}`
              );
            }
          }
        },
        index * (config.timing?.multiLineDelay || 1000)
      );
    });
    return true;
  }

  log.warn(`Unsupported response type for ${normalizedCommand}`);
  return false;
}

// ==============================================
//                   Exports
// ==============================================

module.exports = {
  setClient,
  updateChatCommandConfig,
  handleChatCommand,
};

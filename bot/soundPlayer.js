// ==============================================
//                 soundPlayer.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const fs = require('fs');
const path = require('path');
const player = require('play-sound')();
const { isSimTwitch } = require('../bot/testFlags');
const log = require('../gui/ui/logger')('SOUND');

let client = null;

// eslint-disable-next-line no-unused-vars
let CONFIG = {};

function updateSoundConfig(newConfig) {
  CONFIG = newConfig;
}

// ==============================================
//                    Setters
// ==============================================

function setClient(tmiClient) {
  client = tmiClient;
}

// ==============================================
//                Handle Command
// ==============================================

function handleSoundChatCommand(command, channel) {
  if (!command.startsWith('!')) return false;

  const soundName = command.slice(1);

  if (soundName === 'randomsound') {
    playSoundEffect(null, channel, true);
  } else {
    playSoundEffect(soundName, channel);
  }

  return true;
}

// ==============================================
//                  Play Sound
// ==============================================

function playSoundEffect(soundName, channel, isRandom = false) {
  const soundFolder = path.join(__dirname, '..', 'sounds');
  const soundFiles = fs.readdirSync(soundFolder).filter((file) => file.endsWith('.mp3'));

  if (isRandom) {
    if (soundFiles.length === 0) {
      say('⚠️ There are no sound effects available right now.', channel);
      return;
    }
    soundName = soundFiles[Math.floor(Math.random() * soundFiles.length)].replace(/\.mp3$/, '');
  }

  const soundPath = path.join(soundFolder, `${soundName}.mp3`);
  if (fs.existsSync(soundPath)) {
    log.ok(`Playing sound: ${soundName}.mp3`);
    player.play(soundPath, (err) => {
      if (err) {
        log.error(`Error playing sound effect: ${err}`);
        say(`🔊 Sorry, I couldn't play the sound: ${soundName}`, channel);
      }
    });
    say(`🔊 Playing the ${soundName} sound effect.`, channel);
  }
}

// ==============================================
//                 Message Sender
// ==============================================

function say(message, channel) {
  if (isSimTwitch()) {
    log.ok(`Simulating chat message: ${message}`);
    return;
  }

  if (!client) return;

  try {
    client.say(channel, message);
    log.ok(`${message}`);
  } catch (err) {
    log.warn(`Failed to send Twitch message: ${message} — ${err.message || err}`);
  }
}

// ==============================================
//              Commands Whitelist
// ==============================================

const SOUND_FOLDER = path.join(__dirname, '..', 'sounds');

const SOUND_COMMANDS = fs
  .readdirSync(SOUND_FOLDER)
  .filter((file) => file.endsWith('.mp3'))
  .map((file) => path.parse(file).name.toLowerCase());

// ==============================================
//                    Exports
// ==============================================

module.exports = {
  playSoundEffect,
  updateSoundConfig,
  setClient,
  handleSoundChatCommand,
  SOUND_COMMANDS,
};

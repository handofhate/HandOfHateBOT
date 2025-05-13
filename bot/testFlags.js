// ==============================================
//                  testFlags.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const log = require('../gui/ui/logger')('TEST');

let botProcess = null;
let config = null;

// ==============================================
//                  Init Globals
// ==============================================

function initGlobals({ botProcessRef, configRef }) {
  if (!botProcessRef || !configRef) {
    log.warn('initGlobals called with missing references:');
    if (!botProcessRef) log.warn(' - Missing botProcessRef');
    if (!configRef) log.warn(' - Missing configRef');
  }

  botProcess = botProcessRef;
  config = configRef;
}

// ==============================================
//            Simulation Flag Variables
// ==============================================

let simulateTwitch = false;
let simulateOBS = false;
let simulateDiscord = false;

// ==============================================
//                 Flag Setters
// ==============================================

function setFlags({ twitch = false, obs = false, discord = false }) {
  simulateTwitch = twitch;
  simulateOBS = obs;
  simulateDiscord = discord;
  logFlags();
}

// ==============================================
//                Flag Getters
// ==============================================

function getFlags() {
  if (botProcess === null || config === null) {
    log.warn('getFlags called before initGlobals was run');
  }

  return {
    simulateTwitch,
    simulateOBS,
    simulateDiscord,
  };
}

function isSimTwitch() {
  return simulateTwitch;
}

function isSimOBS() {
  return simulateOBS;
}

function isSimDiscord() {
  return simulateDiscord;
}

// ==============================================
//                Argument Parser
// ==============================================

function updateFromArgs(args) {
  simulateTwitch = args.includes('--simulate-twitch');
  simulateOBS = args.includes('--simulate-obs');
  simulateDiscord = args.includes('--simulate-discord');

  logFlags();
}

// ==============================================
//                 Debug Logger
// ==============================================

function logFlags() {
  log.ok(
    `Simulation Flags: Twitch=${simulateTwitch}, OBS=${simulateOBS}, Discord=${simulateDiscord}`
  );
}

// ==============================================
//                CLI Arg Helper
// ==============================================

function getTestFlagArgs(config) {
  const args = [];

  if (config.testing?.simulateTwitch) args.push('--simulate-twitch');
  if (config.testing?.simulateOBS) args.push('--simulate-obs');
  if (config.testing?.simulateDiscord) args.push('--simulate-discord');

  return args;
}

// ==============================================
//                    Exports
// ==============================================

module.exports = {
  setFlags,
  getFlags,
  isSimTwitch,
  isSimOBS,
  isSimDiscord,
  updateFromArgs,
  getTestFlagArgs,
  initGlobals,
};

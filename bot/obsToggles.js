// ==============================================
//                 obsToggles.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const OBSWebSocket = require('obs-websocket-js').OBSWebSocket;
const log = require('../gui/ui/logger')('OBS');

let client = null;
let obs = null;
let SIMULATE_OBS = false;

// ==============================================
//            Client and OBS Setters
// ==============================================

function setClient(tmiClient) {
  client = tmiClient;
}

function setOBSInstance(obsInstance) {
  obs = obsInstance;
}

function setSimulateFlags({ simulateOBS }) {
  SIMULATE_OBS = simulateOBS;
}

// ==============================================
//         OBS Toggle Command Handler
// ==============================================

function handleObsToggleCommand(command, channel, config) {
  const matchedSource = config.obs?.toggleSources?.find(
    (s) => command === `!${s.name.toLowerCase()}`
  );

  if (!matchedSource) return false;

  toggleObsSceneItem({
    sceneName: matchedSource.sceneName,
    sourceName: matchedSource.sourceName,
    duration: matchedSource.duration,
    channel,
    successMessage: `${matchedSource.label} activated!`,
    failMessage: `Failed to activate ${matchedSource.label}.`,
  });

  return true;
}

// ==============================================
//            OBS Scene Toggle Logic
// ==============================================

function toggleObsSceneItem({
  sceneName,
  sourceName,
  duration,
  channel,
  successMessage,
  failMessage,
}) {
  if (SIMULATE_OBS) {
    log.ok(`Simulating toggle for ${sourceName} in the ${sceneName} scene`);
    if (successMessage) {
      log.rok(`Simulating chat message: ${successMessage}`);
    }
    return;
  }

  obs
    .call('GetSceneItemList', { sceneName })
    .then((data) => {
      const item = data.sceneItems.find((i) => i.sourceName === sourceName);
      if (!item) {
        log.warn(`No source named '${sourceName}' was found in the ${sceneName} scene`);
        say(`⚠️ No source named '${sourceName}' was found in the '${sceneName}' scene`, channel);
        return;
      }

      obs
        .call('SetSceneItemEnabled', {
          sceneName,
          sceneItemId: item.sceneItemId,
          sceneItemEnabled: true,
        })
        .then(() => {
          log.ok(`${sourceName} enabled.`);
          if (successMessage) say(successMessage, channel);

          if (duration) {
            setTimeout(() => {
              obs
                .call('SetSceneItemEnabled', {
                  sceneName,
                  sceneItemId: item.sceneItemId,
                  sceneItemEnabled: false,
                })
                .then(() => {
                  log.ok(`${sourceName} disabled.`);
                })
                .catch((err) => {
                  log.error(`Failed to disable ${sourceName}:`, err.message);
                });
            }, duration);
          }
        })
        .catch((err) => {
          log.error(`Failed to enable ${sourceName}:`, err.message);
          if (failMessage) say(failMessage, channel);
        });
    })
    .catch((err) => {
      log.error(`OBS is not currently running or WebSocket is not available: ${err.message}`);
      say(`⚠️ That command is currently unavailable.`, channel);
    });
}

// ==============================================
//                Send Message
// ==============================================

function say(message, channel) {
  if (client) {
    client.say(channel, message);
    log.ok(`${message}`);
  }
}

// ==============================================
//            OBS Connection Handler
// ==============================================

function connectToOBS(websocketUrl, simulate) {
  const instance = new OBSWebSocket();

  if (!simulate) {
    instance
      .connect(websocketUrl)
      .then(() => {
        log.ok('Connected to OBS');
      })
      .catch((err) => {
        if (err.message?.includes('ECONNREFUSED')) {
          log.error('Failed to connect to OBS WebSocket');
        } else {
          log.error('OBS connection error:', err.message || err);
        }
      });
  } else {
    log.ok('Simulating OBS connection');
  }

  setOBSInstance(instance);
}

function disconnectOBS() {
  if (obs) {
    try {
      obs.disconnect();
      log.ok('Disconnected from OBS');
    } catch (err) {
      log.error('Error during OBS disconnect:', err.message);
    }
    obs = null;
  }
}

// ==============================================
//                   Exports
// ==============================================

module.exports = {
  toggleObsSceneItem,
  setClient,
  setOBSInstance,
  setSimulateFlags,
  connectToOBS,
  disconnectOBS,
  handleObsToggleCommand,
};

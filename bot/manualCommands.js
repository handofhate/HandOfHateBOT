// ==============================================
//              manualCommands.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const log = require('../gui/ui/logger')('MANUAL');

// ==============================================
//                     Init
// ==============================================

function updateManualCommandConfig() {}

// ==============================================
//               Command Handler
// ==============================================

function handleManualCommand(message) {
  if (!message) return false;

  log.ok(`Received command: ${message}`);

  return false;
}

// ==============================================
//                   Exports
// ==============================================

module.exports = {
  updateManualCommandConfig,
  handleManualCommand,
};

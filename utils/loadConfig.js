// ==============================================
//                 loadConfig.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const fs = require('fs');
const path = require('path');
const log = require('../gui/ui/logger')('LOADCON');

// ==============================================
//                 Load config.js
// ==============================================

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.js');

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');

    const load = new Function('module', raw);
    const module = { exports: {} };
    load(module);

    return module.exports;
  } catch (err) {
    log.error('Failed to load config.js:', err);
    return {};
  }
}

// ==============================================
//                    Exports
// ==============================================

module.exports = loadConfig;

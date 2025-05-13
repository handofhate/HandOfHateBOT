// ==============================================
//                 saveConfig.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const fs = require('fs').promises;
const path = require('path');
const log = require('../gui/ui/logger')('SAVECON');

const CONFIG_PATH = path.join(__dirname, '..', 'config.js');

// ==============================================
//                Configuration Save
// ==============================================

async function saveConfig(updates) {
  try {
    log.ok('Writing config to file');

    delete require.cache[require.resolve('../config.js')];
    const currentConfig = require('../config.js');

    const updatedConfig = deepMerge(currentConfig, updates);

    const fixedConfig = prepareConfigForSaving(updatedConfig);

    const configString = `module.exports = ${JSON.stringify(fixedConfig, null, 2)};\n`;
    await fs.writeFile(CONFIG_PATH, configString, 'utf8');
    log.ok('Config file written successfully');

    delete require.cache[require.resolve('../config.js')];

    return fixedConfig;
  } catch (err) {
    log.error('Failed to save config to file:', err);

    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast('❌ Failed to Save Config', 'error');
    }

    throw err;
  }
}

function deepMerge(target, source) {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        target[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

function prepareConfigForSaving(config) {
  const processedConfig = JSON.parse(
    JSON.stringify(config, (key, value) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Object.keys(value).length > 0 &&
        Object.keys(value).every((k) => !isNaN(parseInt(k)))
      ) {
        return Object.values(value).join('');
      }
      return value;
    })
  );

  return processedConfig;
}

// ==============================================
//                    Exports
// ==============================================

module.exports = saveConfig;

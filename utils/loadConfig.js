// utils/loadConfig.js
const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.js');

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');

    // Use Function constructor to avoid require() caching
    const load = new Function('module', raw);
    const module = { exports: {} };
    load(module);

    console.log('[ CONFIG LOAD ] Loaded config.js successfully');
    return module.exports;
  } catch (err) {
    console.error('[ CONFIG ERROR ] Failed to load config.js:', err);
    return {};
  }
}

module.exports = loadConfig;

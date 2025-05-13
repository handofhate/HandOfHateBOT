// ==============================================
//              dashboardManager.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

let state = null;
let dashboardGrid = null;
const fs = require('fs');
const path = require('path');
const log = require('./logger')('DASH');

// ==============================================
//               Status Indicators
// ==============================================

function updateStatusIndicator(module, connected) {
  const indicator = document.querySelector(`[data-status="${module}"]`);
  if (!indicator) return;

  indicator.style.backgroundColor = connected ? '#22c55e' : '#ef4444';

  const tooltipText = getStatusTooltipText(module, connected);
  indicator.setAttribute('data-tip', tooltipText);
}

// ==============================================
//            Testing Mode Controls
// ==============================================

function saveTestingFlag(flag, value) {
  if (!state || !state.config) return;

  state.config.testing = {
    ...state.config.testing,
    [flag]: value,
  };

  renderDashboard();

  const updates = {
    testing: state.config.testing,
  };

  if (window.saveTestingConfig) {
    window.saveTestingConfig(updates);
    log.ok(`Updated ${flag} Simulation Mode to ${value}`);
    window.showToast('Saved Changes', 'success');
  }
}

// ==============================================
//             Dashboard Templates
// ==============================================

// ==============================================
//            Core Module Templates
// ==============================================

const dashboardTemplates = {
  colorControl: {
    enabledWhileRunning: true,
    enabledWhileStopped: false,
    render(grid) {
      const html = `
        <div data-module="colorControl" class="card bg-base-300 shadow-lg p-4">
          <div class="flex justify-between items-center mb-4 gap-2">
            <h3 class="text-xl font-bold text-accent">💡 Color Control</h3>
            ${getStatusIndicatorHTML('colorControl')}
          </div>
          <div id="colorButtons" class="flex flex-wrap gap-2 justify-center">
            <p class="text-neutral-content">Loading colors...</p>
          </div>
        </div>`;
      grid.insertAdjacentHTML('beforeend', html);
    },
  },

  soundEffects: {
    enabledWhileRunning: true,
    enabledWhileStopped: false,
    render(grid) {
      const html = `
        <div data-module="soundEffects" class="card bg-base-300 shadow-lg p-4">
          <div class="flex justify-between items-center mb-4 gap-2">
            <h3 class="text-xl font-bold text-accent">🔊 Sound Effects</h3>
            ${getStatusIndicatorHTML('soundEffects')}
          </div>
          <div id="soundButtons" class="flex flex-wrap gap-2 justify-center">
            <p class="text-neutral-content">Loading sound effects...</p>
          </div>
        </div>`;
      grid.insertAdjacentHTML('beforeend', html);
    },
  },

  obsToggles: {
    enabledWhileRunning: true,
    enabledWhileStopped: false,
    render(grid, config) {
      const html = `
        <div data-module="obsToggles" class="card bg-base-300 shadow-lg p-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-accent">🎥 OBS Toggles</h3>
            ${getStatusIndicatorHTML('obsToggles')}
          </div>
          <div class="flex flex-wrap gap-2 justify-center">
            ${(config.obs?.toggleSources || [])
              .map(
                (source) => `
                <button class="btn btn-primary text-lg flex-none text-center"
                        onclick="window.sendCommand('!${source.name}')">
                  ${source.label || source.name}
                </button>`
              )
              .join('')}
          </div>
        </div>`;
      grid.insertAdjacentHTML('beforeend', html);
    },
  },

  chatCommands: {
    enabledWhileRunning: true,
    enabledWhileStopped: false,
    render(grid) {
      const commands = state.config.chatCommands || {};
      const commandKeys = Object.keys(commands);

      const buttonsHTML =
        commandKeys.length === 0
          ? `<p class="text-neutral-content">No commands configured.</p>
           <p class="text-neutral-content text-sm">Add commands in the Config tab.</p>`
          : commandKeys
              .map(
                (cmd) =>
                  `<button class="btn btn-secondary text-lg" 
                    onclick="window.sendCommand('${cmd}')">
               ${cmd.replace('!', '')}
             </button>`
              )
              .join('');

      const html = `
        <div data-module="chatCommands" class="card bg-base-300 shadow-lg p-4">
          <div class="flex justify-between items-center mb-4 gap-2">
            <h3 class="text-xl font-bold text-accent">💬 Chat Commands</h3>
            ${getStatusIndicatorHTML('chatCommands')}
          </div>
          <div class="flex flex-wrap gap-2 justify-center">
            ${buttonsHTML}
          </div>
        </div>`;

      grid.insertAdjacentHTML('beforeend', html);
    },
  },

  manualCommands: {
    enabledWhileRunning: true,
    enabledWhileStopped: false,
    render(grid) {
      const html = `
        <div data-module="manualCommands" class="card bg-base-300 shadow-lg p-4">
          <div class="flex justify-between items-center mb-4 gap-2">
            <h3 class="text-xl font-bold text-accent">⌨️ Manual Commands</h3>
            ${getStatusIndicatorHTML('manualCommands')}
          </div>
          <form class="flex gap-2" onsubmit="event.preventDefault(); window.sendCommand(this.command.value); this.command.value = '';">
            <input type="text" name="command" class="input input-bordered flex-1" placeholder="Type a command (e.g., !uptime)">
            <button type="submit" class="btn btn-secondary">Send</button>
          </form>
        </div>`;
      grid.insertAdjacentHTML('beforeend', html);
    },
  },

  clipWatcher: {
    enabledWhileRunning: true,
    enabledWhileStopped: false,
    render(grid, config) {
      const html = `
        <div data-module="clipWatcher" class="card bg-base-300 shadow-lg p-4">
          <div class="flex justify-between items-center mb-4 gap-2">
            <h3 class="text-xl font-bold text-accent">📎 Clip Watcher</h3>
            ${getStatusIndicatorHTML('clipWatcher')}
          </div>
          <p class="text-sm text-neutral-content text-center">
            📁 Watching: ${config.clipFolder || '(No folder configured)'}
          </p>
        </div>`;
      grid.insertAdjacentHTML('beforeend', html);
    },
  },

  testingMode: {
    enabledWhileRunning: false,
    enabledWhileStopped: true,
    render(grid, config) {
      const html = `
        <div data-module="testingMode" class="card bg-base-300 shadow-lg p-4">
          <div class="flex justify-between items-center mb-4 gap-2">
            <h3 class="text-xl font-bold text-accent">🧪 Testing Mode</h3>
            ${getStatusIndicatorHTML('testingMode')}
          </div>
          <div class="flex flex-col items-center space-y-2 w-full max-w-sm mx-auto">
            ${['simulateTwitch', 'simulateOBS', 'simulateDiscord']
              .map(
                (flag) => `
                <label class="label cursor-pointer justify-between gap-4 w-full">
                  <span class="w-32">Simulate ${flag.replace('simulate', '')}</span>
                  <input type="checkbox" class="toggle toggle-success bg-neutral-content"
                         ${config.testing?.[flag] ? 'checked' : ''}
                         onchange="saveTestingFlag('${flag}', this.checked)">
                </label>`
              )
              .join('')}
          </div>
        </div>`;
      grid.insertAdjacentHTML('beforeend', html);
    },
  },

  chatOverlay: {
    enabledWhileRunning: true,
    enabledWhileStopped: true,
    render(grid) {
      const html = `
        <div data-module="chatOverlay" class="card bg-base-300 shadow-lg p-4">
          <div class="flex justify-between items-center mb-4 gap-2">
            <h3 class="text-xl font-bold text-accent">💬 Chat Overlay</h3>
            ${getStatusIndicatorHTML('chatOverlay')}
          </div>
          <div class="flex gap-4">
            <button class="btn btn-primary" onclick="toggleChatOverlay()">Toggle Overlay</button>
            <button class="btn btn-outline text-xl" title="Toggle Click-Through" onclick="toggleChatTransparency()">VOiD</button>
          </div>
        </div>`;
      grid.insertAdjacentHTML('beforeend', html);
    },
  },

  // ==============================================
  //          Special Component Renderers
  // ==============================================

  renderColorButtons() {
    const container = document.getElementById('colorButtons');
    if (!container) return;

    const colors = [
      { cmd: 'red', hex: '#dc2626', text: 'text-white' },
      { cmd: 'green', hex: '#16a34a', text: 'text-white' },
      { cmd: 'blue', hex: '#2563eb', text: 'text-white' },
      { cmd: 'yellow', hex: '#facc15', text: 'text-black' },
      { cmd: 'purple', hex: '#7c3aed', text: 'text-white' },
      { cmd: 'cyan', hex: '#06b6d4', text: 'text-black' },
      { cmd: 'magenta', hex: '#ec4899', text: 'text-white' },
      { cmd: 'orange', hex: '#f97316', text: 'text-white' },
      { cmd: 'white', hex: '#ffffff', text: 'text-black' },
      { cmd: 'black', hex: '#000000', text: 'text-white' },
      {
        cmd: 'randomcolor',
        display: 'Random',
        hex: 'linear-gradient(to right, #ec4899, #8b5cf6, #3b82f6)',
        text: 'text-white',
      },
    ];

    container.innerHTML = '';
    container.className = 'flex flex-wrap gap-2 justify-center';

    container.innerHTML = colors
      .map((c) => {
        const isGradient = c.hex.startsWith('linear-gradient');
        const backgroundStyle = isGradient
          ? `background-image: ${c.hex};`
          : `background-color: ${c.hex};`;
        const textColorHex = c.text === 'text-black' ? '#000000' : '#ffffff';

        return `
          <button class="btn text-lg hover:brightness-110 w-24 text-center"
                  style="--btn-bg: ${c.hex}; --btn-fg: ${textColorHex}; ${backgroundStyle}"
                  onclick="window.sendCommand('!${c.cmd}')">
            ${c.display || c.cmd.charAt(0).toUpperCase() + c.cmd.slice(1)}
          </button>`;
      })
      .join('');
  },

  renderSoundEffects(config) {
    const container = document.getElementById('soundButtons');
    if (!container || !config) return;

    const soundsFolder = config.soundEffectsFolder || path.join(__dirname, '..', 'sounds');
    const statusIndicator = document.querySelector('[data-status="soundEffects"]');

    container.innerHTML = '';
    container.className = 'flex flex-wrap gap-2 justify-center';

    try {
      const soundFiles = fs
        .readdirSync(soundsFolder)
        .filter((file) => file.endsWith('.mp3'))
        .map((file) => file.replace('.mp3', ''));

      if (statusIndicator) {
        const isWorking = state.botProcess && soundFiles.length > 0;
        statusIndicator.style.backgroundColor = isWorking ? '#22c55e' : '#ef4444';
      }

      soundFiles.forEach((sound) => {
        const button = document.createElement('button');
        button.className = 'btn btn-outline flex-none text-lg';
        button.textContent = sound;
        button.title = `Play ${sound}`;
        button.onclick = () => window.sendCommand(`!${sound}`);
        container.appendChild(button);
      });
    } catch (err) {
      if (statusIndicator) {
        statusIndicator.style.backgroundColor = '#ef4444';
      }
      log.error(`Failed to load sound effects: ${err.message || err}`);
    }
  },
};

// ==============================================
//                  Initialize
// ==============================================

function initDashboardManager(sharedState) {
  if (typeof window !== 'undefined') {
    window.saveTestingFlag = saveTestingFlag;
    window.isModuleActive = isModuleActive;
    window.updateStatusIndicator = updateStatusIndicator;
    window.renderDashboard = renderDashboard;
  }

  state = sharedState;
  dashboardGrid = document.getElementById('dashboardGrid');

  state.moduleStatus = {
    bot: false,
    twitch: false,
    obs: false,
    discord: false,
  };

  if (!dashboardGrid) {
    console.error('Dashboard grid element not found');
    return;
  }

  renderDashboard();

  window.addEventListener('botStateChanged', () => {
    renderDashboard();
  });
}

// ==============================================
//              Dashboard Rendering
// ==============================================

let hasRenderedOnce = false;

function renderDashboard() {
  dashboardGrid.innerHTML = '';

  const isBotRunning = Boolean(state.botProcess);
  const orderedModules = state.config.modulesOrder || Object.keys(state.config.modules || {});
  const renderedModules = [];

  orderedModules.forEach((moduleName) => {
    if (!state.config.modules[moduleName]) return;
    const moduleTemplate = dashboardTemplates[moduleName];
    if (moduleTemplate?.render) {
      const shouldBeEnabled = isBotRunning
        ? moduleTemplate.enabledWhileRunning
        : moduleTemplate.enabledWhileStopped;

      const wrapper = document.createElement('div');
      wrapper.className = '';
      moduleTemplate.render(wrapper, state.config);

      if (!shouldBeEnabled) {
        const card = wrapper.querySelector('.card');
        if (card) {
          card.classList.add('opacity-50');

          const interactiveElements = card.querySelectorAll(
            'button, input, textarea, select, .btn'
          );
          interactiveElements.forEach((el) => {
            el.disabled = true;
            if (el.classList.contains('btn')) {
              el.classList.add('btn-disabled');
            }
          });
        }
      }

      dashboardGrid.appendChild(wrapper);
      renderedModules.push(moduleName);
    }
  });

  const colorContainer = document.getElementById('colorButtons');
  if (colorContainer) {
    dashboardTemplates.renderColorButtons(state.config);

    const shouldBeEnabled = isBotRunning
      ? dashboardTemplates.colorControl.enabledWhileRunning
      : dashboardTemplates.colorControl.enabledWhileStopped;

    if (!shouldBeEnabled) {
      const colorButtons = colorContainer.querySelectorAll('button');
      colorButtons.forEach((btn) => {
        btn.disabled = true;
        btn.classList.add('btn-disabled');
      });
    }
  }

  const soundContainer = document.getElementById('soundButtons');
  if (soundContainer) {
    dashboardTemplates.renderSoundEffects(state.config);

    const shouldBeEnabled = isBotRunning
      ? dashboardTemplates.soundEffects.enabledWhileRunning
      : dashboardTemplates.soundEffects.enabledWhileStopped;

    if (!shouldBeEnabled) {
      const soundButtons = soundContainer.querySelectorAll('button');
      soundButtons.forEach((btn) => {
        btn.disabled = true;
        btn.classList.add('btn-disabled');
      });
    }
  }

  const moduleNames = [
    'testingMode',
    'soundEffects',
    'colorControl',
    'obsToggles',
    'clipWatcher',
    'chatCommands',
    'manualCommands',
    'chatOverlay',
  ];

  const active = [];
  const inactive = [];

  moduleNames.forEach((moduleName) => {
    const isActive = isModuleActive(moduleName);
    updateStatusIndicator(moduleName, isActive);
    (isActive ? active : inactive).push(moduleName);
  });

  if (!hasRenderedOnce) {
    log.ok(
      `Dashboard Modules initialized (${active.length} active / ${renderedModules.length} total)`
    );
  } else {
    log.ok(
      `Dashboard Modules refreshed (${active.length} active / ${renderedModules.length} total)`
    );
  }

  hasRenderedOnce = true;
}

// ==============================================
//               Status Indicators
// ==============================================

function getStatusIndicatorHTML(moduleName) {
  const isActive = isModuleActive(moduleName);
  const tooltipText = getStatusTooltipText(moduleName, isActive);
  return `<div 
    data-status="${moduleName}" 
    class="tooltip tooltip-left" 
    data-tip="${tooltipText}"
    style="width: 16px; height: 16px; background-color: ${isActive ? '#22c55e' : '#ef4444'}; border-radius: 50%; border: 2px solid black; flex-shrink: 0;">
  </div>`;
}

function getStatusTooltipText(moduleName, isActive) {
  if (isActive) {
    switch (moduleName) {
      case 'clipWatcher':
        return 'Watching for new clips';

      case 'obsToggles':
        return 'Connected to OBS';

      case 'chatCommands':
      case 'manualCommands':
        return 'Connected to Twitch';

      case 'colorControl':
        return 'Connected to Philips Hue';

      case 'soundEffects':
        return 'Ready to play Sound Effects';

      case 'testingMode':
        return 'Testing Mode ready';

      case 'chatOverlay':
        return 'Chat Overlay ready';

      default:
        return `Ready for ${getModuleDisplayName(moduleName)}`;
    }
  }

  switch (moduleName) {
    case 'soundEffects':
      return state.config.soundEffectsFolder
        ? 'No sound files found'
        : 'Sound effects folder not configured';

    case 'obsToggles':
      if (state.config.testing?.simulateOBS) return 'OBS is in simulation mode';
      if (!state.config.obs?.websocketUrl) return 'OBS WebSocket URL not configured';
      if (!state.config.obs?.toggleSources?.length) return 'No OBS sources configured';
      return 'OBS connection issue';

    case 'chatCommands':
    case 'manualCommands':
      if (state.config.testing?.simulateTwitch) return 'Twitch is in simulation mode';
      if (!state.config.twitch?.username) return 'Twitch username not configured';
      if (!state.config.twitch?.oauth) return 'Twitch OAuth not configured';
      if (!state.config.twitch?.channel) return 'Twitch channel not configured';
      return 'Twitch connection issue';

    case 'colorControl':
      if (!state.config.hue?.bridgeIp) return 'Hue bridge IP not configured';
      if (!state.config.hue?.apiKey) return 'Hue API key not configured';
      if (!state.config.hue?.bulbIds?.length) return 'No Hue bulbs configured';
      return 'Hue connection issue';

    case 'clipWatcher':
      if (state.config.testing?.simulateDiscord) return 'Discord is in simulation mode';
      if (!state.config.clipFolder) return 'Clip folder not configured';
      if (!state.config.discordWebhookUrl) return 'Discord webhook not configured';
      if (!state.config.maxFileSizeMb) return 'Max file size not configured';
      return 'Clip watcher issue';

    default:
      return `${getModuleDisplayName(moduleName)} is inactive`;
  }
}

// ==============================================
//               Helper Functions
// ==============================================

function getModuleDisplayName(moduleName) {
  const displayNames = {
    soundEffects: 'Sound Effects',
    obsToggles: 'OBS Toggles',
    chatCommands: 'Chat Commands',
    manualCommands: 'Manual Commands',
    colorControl: 'Color Control',
    clipWatcher: 'Clip Watcher',
    testingMode: 'Testing Mode',
    chatOverlay: 'Chat Overlay',
  };

  return displayNames[moduleName] || moduleName;
}

// ==============================================
//            Module Status Detection
// ==============================================

function isModuleActive(moduleName) {
  try {
    switch (moduleName) {
      case 'soundEffects': {
        if (!state.config.soundEffectsFolder) return false;
        const soundFiles = fs
          .readdirSync(state.config.soundEffectsFolder)
          .filter((file) => file.endsWith('.mp3'));
        return soundFiles.length > 0;
      }

      case 'obsToggles':
        return (
          state.config.obs?.websocketUrl &&
          state.config.obs?.toggleSources?.length > 0 &&
          !state.config.testing?.simulateOBS
        );

      case 'manualCommands':
      case 'chatCommands':
        return (
          state.config.twitch?.username &&
          state.config.twitch?.oauth &&
          state.config.twitch?.channel &&
          !state.config.testing?.simulateTwitch
        );

      case 'colorControl':
        return (
          state.config.hue?.bridgeIp &&
          state.config.hue?.apiKey &&
          state.config.hue?.bulbIds?.length > 0
        );

      case 'clipWatcher':
        return (
          state.config.clipFolder &&
          state.config.discordWebhookUrl &&
          state.config.maxFileSizeMb &&
          !state.config.testing?.simulateDiscord
        );

      case 'testingMode':
        return (
          state.config.testing?.simulateTwitch !== undefined &&
          state.config.testing?.simulateOBS !== undefined &&
          state.config.testing?.simulateDiscord !== undefined
        );

      default:
        return true;
    }
  } catch {
    return false;
  }
}

// ==============================================
//                    Exports
// ==============================================

module.exports = {
  initDashboardManager,
  updateStatusIndicator,
  renderDashboard,
  dashboardTemplates,
};

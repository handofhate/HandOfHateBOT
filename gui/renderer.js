// ==============================================
//                  renderer.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const { ipcRenderer } = require('electron');
const { initBotControls } = require('./ui/botControls');
const { initConfigManager } = require('./ui/configManager');
const { initUIManager } = require('./ui/uiManager');
const { renderDashboard } = require('./ui/dashboardManager');
const { initDashboardManager } = require('./ui/dashboardManager');
const { initTabManager } = require('./ui/tabManager');
const log = require('./ui/logger')('RENDER');
const logger = require('../gui/ui/logger');

logger.initLogger();

const state = {
  botProcess: null,
  config: null,
};

const UI = {
  SELECTORS: {
    ACTIVE_TAB: '.tab-active',
  },
  EVENTS: {
    BOT_STATE_CHANGED: 'botStateChanged',
    MODULES_CHANGED: 'modulesChanged',
  },
};

// ==============================================
//              Renderer Functions
// ==============================================

document.addEventListener('DOMContentLoaded', async () => {
  log.ok('DOM fully loaded, starting GUI initialization...');

  const urlParams = new URLSearchParams(window.location.search);
  const isDockableWindow = urlParams.get('dockable') === 'true';

  if (isDockableWindow) {
    const titleBar = document.getElementById('titleBar');
    if (titleBar) {
      titleBar.style.display = 'none';
    }

    const tabsContainer = document.querySelector('.tabs');
    if (tabsContainer) {
      tabsContainer.style.marginTop = '0';
    }

    document.body.classList.add('dockable-window');

    document.title = 'VOiD OBS Dock';
  }

  // ==============================================
  //                Window Controls
  // ==============================================

  document.getElementById('minimizeBtn')?.addEventListener('click', () => {
    window.require('electron').ipcRenderer.send('window-minimize');
  });

  document.getElementById('maximizeBtn')?.addEventListener('click', () => {
    window.require('electron').ipcRenderer.send('window-maximize');
  });

  document.getElementById('closeBtn')?.addEventListener('click', () => {
    window.require('electron').ipcRenderer.send('window-close');
  });

  document.getElementById('saveLogsBtn')?.addEventListener('click', () => {
    const { exportLogs } = require('./ui/logger');
    exportLogs();
  });

  document.getElementById('createDockableBtn')?.addEventListener('click', () => {
    window.require('electron').ipcRenderer.send('create-dockable-window');
  });

  const voidTitle = document.querySelector('#titleBar .text-base-content');

  if (voidTitle) {
    voidTitle.style.cursor = 'pointer';
    voidTitle.title = 'Right-click to open an OBS dockable window';

    voidTitle.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    voidTitle.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();

      window.require('electron').ipcRenderer.send('create-dockable-window');
      window.showToast('Opening as dockable window', 'info');
    });
  }

  // ==============================================
  //              Initialization Flow
  // ==============================================

  try {
    state.config = await initConfigManager();

    initTabManager(state);
    initBotControls(state);
    initUIManager(state);
    initDashboardManager(state);

    const needsSetup = await ipcRenderer.invoke('check-needs-setup');

    if (needsSetup) {
      log.ok('First run detected, launching setup wizard');

      const { showSetupWizard } = require('../utils/setupWizard');

      showSetupWizard(state.config, () => {
        ipcRenderer.send('setup-wizard-completed');

        if (typeof initDashboardManager === 'function') {
          initDashboardManager(state);
        }

        const { setupConfigForm } = require('./ui/configManager');
        if (typeof setupConfigForm === 'function') {
          setupConfigForm(state.config);
        }

        window.showToast('Setup Complete! Refreshing the VOiD.', 'success');
      });
    }
  } catch (error) {
    log.error('Failed to initialize GUI:', error);
    window.showToast('Failed to Initialize GUI', 'error');
  }
});

// ==============================================
//               Logs Tab Buttons
// ==============================================

document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
  const logBox = document.getElementById('logOutput');
  if (logBox) logBox.textContent = '';
});

// ==============================================
//              Info Button Handler
// ==============================================

document.getElementById('infoButton')?.addEventListener('click', () => {
  const { showMarkdownModal } = require('../utils/tooltipManager');
  const voidInfo = require('../utils/voidInfo');
  showMarkdownModal(voidInfo.title, voidInfo.content);
});

// ==============================================
//              Window HTML Access
// ==============================================

window.sendCommand = (command) => {
  try {
    if (!state.botProcess?.stdin.writable) {
      log.warn('The Bot is not running. Command ignored:', command);
      return false;
    }

    state.botProcess.stdin.write(command + '\n');
    log.ok('Sent command:', command);
    return true;
  } catch (error) {
    log.error('Failed to send command:', error);
    return false;
  }
};

// ==============================================
//              Overlay Controls
// ==============================================

window.toggleChatOverlay = () => {
  ipcRenderer.send('toggle-chat-overlay');
};

window.toggleChatTransparency = () => {
  ipcRenderer.send('toggle-overlay-clickthrough');
};

window.electronAPI = {
  ...window.electronAPI,
  saveLogToFile: (options) => ipcRenderer.invoke('save-log-file', options),
};

// ==============================================
//                Event Listeners
// ==============================================

window.addEventListener('modulesChanged', () => {
  const currentTab = document.querySelector(UI.SELECTORS.ACTIVE_TAB)?.dataset?.tab;

  if (currentTab === 'dashboard') {
    log.ok('Modules changed – re-rendering dashboard');
    renderDashboard(state.config);
  }
});

// ==============================================
//             OAuth Config Refresh
// ==============================================

ipcRenderer.on('configUpdatedFromOAuth', async () => {
  try {
    const freshConfig = await ipcRenderer.invoke('getFreshConfig');
    state.config = freshConfig;

    const { setupConfigForm } = require('./ui/configManager');
    setupConfigForm(freshConfig);

    window.showToast('🔐 Twitch OAuth Updated', 'success');
    log.ok('Config tab rebuilt with fresh Twitch tokens');
  } catch (err) {
    log.error('Failed to refresh Twitch config:', err);
    window.showToast('❌ Failed to Update OAuth', 'error');
  }
});

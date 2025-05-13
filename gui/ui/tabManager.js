// ==============================================
//                 tabManager.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const TABS = {
  dashboard: 'dashboardTab',
  logs: 'logsTab',
  config: 'configTab',
};

const UI = {
  SELECTORS: {
    TAB_BUTTONS: '[data-tab]',
  },
  CLASSES: {
    ACTIVE: 'tab-active',
    HIDDEN: 'hidden',
  },
};

const MODULES = [
  'soundEffects',
  'colorControl',
  'obsToggles',
  'clipWatcher',
  'chatCommands',
  'manualCommands',
];
const log = require('./logger')('TAB');

let activeTab = null;
let state = null;

// ==============================================
//            Initialize Tab Manager
// ==============================================

function initTabManager(sharedState) {
  state = sharedState;

  activeTab = 'dashboard';

  document.querySelectorAll(UI.SELECTORS.TAB_BUTTONS).forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  window.switchTab = switchTab;

  updateTabVisibility();
}

// ==============================================
//                 Tab Navigation
// ==============================================

function switchTab(tabId) {
  if (!TABS[tabId]) {
    log.warn(`Attempted to switch to unknown tab: ${tabId}`);
    return;
  }

  document.querySelectorAll(UI.SELECTORS.TAB_BUTTONS).forEach((tab) => {
    tab.classList.toggle(UI.CLASSES.ACTIVE, tab.dataset.tab === tabId);
  });

  activeTab = tabId;
  updateTabVisibility();

  if (tabId === 'dashboard') {
    try {
      delete require.cache[require.resolve('../../config.js')];
      state.config = require('../../config.js');
      window.renderDashboard();

      MODULES.forEach((moduleName) => {
        const isActive = window.isModuleActive?.(moduleName) ?? false;
        window.updateStatusIndicator(moduleName, isActive);
      });

      log.ok('Dashboard reloaded and module statuses updated');
    } catch (error) {
      log.error('Failed to reload dashboard:', error);
    }
  }
}

// ==============================================
//                 Visual Updates
// ==============================================

function updateTabVisibility() {
  Object.entries(TABS).forEach(([key, elementId]) => {
    const tab = document.getElementById(elementId);
    if (tab) {
      tab.classList.toggle(UI.CLASSES.HIDDEN, key !== activeTab);
    }
  });
}

// ==============================================
//                    Exports
// ==============================================

module.exports = { initTabManager };

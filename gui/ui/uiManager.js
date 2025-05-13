// ==============================================
//                  uiManager.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const dashboardTemplates = require('./dashboardManager');
const log = require('./logger')('UI');

const UI = {
  SELECTORS: {
    START_BUTTON: '#startBot',
    STOP_BUTTON: '#stopBot',
    TOAST: '#toast',
    TAB_BUTTONS: '.tabs .tab',
    TAB_CONTENTS: '.tabContent',
  },
  CLASSES: {
    DISABLED: 'btn-disabled',
    INACTIVE: 'opacity-50',
    NO_POINTER: 'pointer-events-none',
    ALERT: {
      BASE: 'alert',
      SUCCESS: 'alert-success',
      ERROR: 'alert-error',
      WARNING: 'alert-warning',
      INFO: 'alert-info',
    },
  },
};

const UI_ELEMENTS = {
  toast: document.querySelector(UI.SELECTORS.TOAST),
  tabButtons: document.querySelectorAll(UI.SELECTORS.TAB_BUTTONS),
  tabContents: document.querySelectorAll(UI.SELECTORS.TAB_CONTENTS),
};

let state = null;

// ==============================================
//             Initialize UI Manager
// ==============================================

function initUIManager(sharedState) {
  state = sharedState;
  setupToastSystem();
}

// ==============================================
//                  Toast System
// ==============================================

function setupToastSystem() {
  window.showToast = (message, type = 'info') => {
    const toast = UI_ELEMENTS.toast;
    const el = document.createElement('div');
    el.className = `${UI.CLASSES.ALERT.BASE} ${
      type === 'success'
        ? UI.CLASSES.ALERT.SUCCESS
        : type === 'error'
          ? UI.CLASSES.ALERT.ERROR
          : type === 'warning'
            ? UI.CLASSES.ALERT.WARNING
            : UI.CLASSES.ALERT.INFO
    }`;
    el.textContent = message;
    toast.appendChild(el);
    log.ok(`Toast shown: [${type.toUpperCase()}] ${message}`);
    setTimeout(() => el.remove(), 3000);
  };
}

// ==============================================
//             Lock/Unlock Dashboard
// ==============================================

function lockDashboardUI() {
  const startBtn = document.querySelector(UI.SELECTORS.START_BUTTON);
  const stopBtn = document.querySelector(UI.SELECTORS.STOP_BUTTON);

  startBtn.disabled = false;
  startBtn.classList.remove(UI.CLASSES.DISABLED);
  stopBtn.disabled = true;
  stopBtn.classList.add(UI.CLASSES.DISABLED);

  Object.entries(state.config.modules || {})
    .filter(([, isEnabled]) => isEnabled)
    .forEach(([moduleName]) => {
      const module = document.querySelector(`[data-module="${moduleName}"]`);
      if (module) {
        const template = dashboardTemplates[moduleName];
        const shouldBeEnabled = template?.enabledWhileStopped ?? false;
        module.classList.toggle(UI.CLASSES.INACTIVE, !shouldBeEnabled);
        module.classList.toggle(UI.CLASSES.NO_POINTER, !shouldBeEnabled);
      }
    });

  log.ok('Dashboard UI locked');
}

function unlockDashboardUI() {
  const startBtn = document.querySelector(UI.SELECTORS.START_BUTTON);
  const stopBtn = document.querySelector(UI.SELECTORS.STOP_BUTTON);

  startBtn.disabled = true;
  startBtn.classList.add(UI.CLASSES.DISABLED);
  stopBtn.disabled = false;
  stopBtn.classList.remove(UI.CLASSES.DISABLED);

  Object.entries(state.config.modules || {})
    .filter(([, isEnabled]) => isEnabled)
    .forEach(([moduleName]) => {
      const module = document.querySelector(`[data-module="${moduleName}"]`);
      if (module) {
        const template = dashboardTemplates[moduleName];
        const shouldBeEnabled = template?.enabledWhileRunning ?? false;
        module.classList.toggle(UI.CLASSES.INACTIVE, !shouldBeEnabled);
        module.classList.toggle(UI.CLASSES.NO_POINTER, !shouldBeEnabled);
      }
    });

  log.ok('Dashboard UI unlocked');
}

// ==============================================
//                   Exports
// ==============================================

window.lockDashboardUI = lockDashboardUI;
window.unlockDashboardUI = unlockDashboardUI;

module.exports = {
  initUIManager,
  lockDashboardUI,
  unlockDashboardUI,
};

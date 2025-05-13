// ==============================================
//                 botControls.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const { spawn } = require('child_process');
const path = require('path');
const { updateStatusIndicator } = require('./dashboardManager');
const { lockDashboardUI, unlockDashboardUI } = require('./uiManager');
const log = require('./logger')('BOTCTRL');
const { isUserScrolling } = require('./logger');

let state = null;
let startBtn, stopBtn, logBox;

// ==============================================
//           Initialize Bot Controls
// ==============================================

function initBotControls(sharedState) {
  state = sharedState;

  startBtn = document.getElementById('startBot');
  stopBtn = document.getElementById('stopBot');
  logBox = document.getElementById('logOutput');

  startBtn.addEventListener('click', startBot);
  stopBtn.addEventListener('click', stopBot);
}

// ==============================================
//                Start the Bot
// ==============================================

function startBot() {
  if (state.botProcess) {
    log.warn('Start requested, but bot is already running.');
    return;
  }

  const autoClear = document.getElementById('autoClearLogsToggle')?.checked;
  if (autoClear) {
    const logBox = document.getElementById('logOutput');
    if (logBox) logBox.innerHTML = '';
  }

  const botPath = path.join(__dirname, '..', '..', 'bot.js');
  const args = [botPath];

  state.moduleStatus.bot = true;
  updateStatusIndicator('bot', true);

  if (state.config.modules?.testingMode) {
    const { getTestFlagArgs } = require('../../bot/testFlags');
    args.push(...getTestFlagArgs(state.config));
  }

  state.botProcess = spawn('node', args);
  setupProcessHandlers();
  unlockDashboardUI();
  window.dispatchEvent(new Event('botStateChanged'));
}

// ==============================================
//                 Stop the Bot
// ==============================================

function stopBot() {
  if (state.botProcess) {
    log.ok('Stopping bot process...');

    state.botProcess.once('exit', () => {
      state.botProcess = null;
      lockDashboardUI();

      state.moduleStatus.bot = false;
      updateStatusIndicator('bot', false);

      window.dispatchEvent(new Event('botStateChanged'));
    });

    state.botProcess.kill();
  } else {
    log.warn('Stop requested, but bot is not running.');
  }
}

// ==============================================
//          Handle Bot Process Events
// ==============================================

function setupProcessHandlers() {
  const { botProcess } = state;

  botProcess.stdout.on('data', (data) => appendToLog(data.toString()));
  botProcess.stderr.on('data', (data) => appendToLog(data.toString()));

  function cleanupBotProcess() {
    state.botProcess = null;
    lockDashboardUI?.();
    window.dispatchEvent(new Event('botStateChanged'));
  }

  botProcess.on('close', (code) => {
    if (code === 0) {
      log.ok('Bot process closed normally with exit code 0');
    } else if (code === null) {
      log.ok('Bot process was terminated manually');
    } else {
      log.warn(`Bot process closed with exit code ${code}`);
    }
    cleanupBotProcess();
  });

  botProcess.on('error', (err) => {
    log.error(`Bot process error: ${err.message}`);
    cleanupBotProcess();
  });
}

// ==============================================
//              Append to Log Box
// ==============================================

function appendToLog(message) {
  if (!logBox) return;

  const cleanedMessage = message.trim();
  if (!cleanedMessage) return;

  cleanedMessage.split('\n').forEach((line) => {
    if (!line.trim()) return;

    const match = line.match(/\[\s+(\w+)\s+(\w+)\s+\]\s+(.*)/);

    if (match) {
      const [, source, level, content] = match;

      const prefixSpan = document.createElement('span');
      const formattedPrefix = `[ ${formatPrefix(source, level)} ]`;
      prefixSpan.textContent = formattedPrefix;

      switch (level) {
        case 'ERROR':
          prefixSpan.className = 'log-error';
          break;
        case 'WARN':
          prefixSpan.className = 'log-warn';
          break;
        case 'OK':
          prefixSpan.className = 'log-ok';
          break;
        case 'CHAT':
          prefixSpan.className = 'log-chat';
          break;
      }

      const div = document.createElement('div');

      let logCategory = 'info';
      if (level === 'ERROR') logCategory = 'error';
      else if (level === 'WARN') logCategory = 'warn';
      div.setAttribute('data-log-level', logCategory);

      div.appendChild(prefixSpan);
      div.appendChild(document.createTextNode(' ' + content));

      logBox.appendChild(div);
    } else {
      const div = document.createElement('div');
      div.textContent = line;
      logBox.appendChild(div);
    }
  });

  if (!isUserScrolling()) {
    logBox.scrollTop = Number.MAX_SAFE_INTEGER;

    setTimeout(() => {
      if (logBox) logBox.scrollTop = logBox.scrollHeight;
    }, 0);
  }
}

// ==============================================
//               Text Formatting
// ==============================================

function formatPrefix(source, level) {
  if (!level) {
    return `${source.padEnd(16)}`;
  }
  return `${source.padEnd(9)}${level.padEnd(6)}`;
}

// ==============================================
//                   Exports
// ==============================================

module.exports = { initBotControls };

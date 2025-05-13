// ==============================================
//                   logger.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const lastLogTimestamps = {};
let logBox = null;
let isUserScrolling = false;
let scrollTimeout;

// ==============================================
//           Fixed Levels and Formatter
// ==============================================

const levels = {
  ok: 'OK',
  warn: 'WARN',
  error: 'ERROR',
};

function formatPrefix(source, level) {
  if (!level) {
    return `${source.padEnd(16)}`;
  }
  return `${source.padEnd(9)}${level.padEnd(6)}`;
}

// ==============================================
//                Debounce Function
// ==============================================

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ==============================================
//                Core Log Method
// ==============================================

function baseLog(source, level, ...args) {
  const prefix = `[ ${formatPrefix(source, level)} ]`;
  const output = [prefix, ...args];

  switch (level) {
    case 'ERROR':
      console.error(...output);
      break;
    case 'WARN':
      console.warn(...output);
      break;
    default:
      console.log(...output);
  }

  const logMessage = {
    source,
    level,
    message: args.join(' '),
  };

  if (typeof window === 'undefined' && process?.send) {
    process.send({ type: 'log', ...logMessage });
  } else {
    logToGui(source, level, logMessage.message);
  }
}

// ==============================================
//           Rate-Limited Logging Core
// ==============================================

function rateLimitedLog(source, level, key, delaySeconds = 5, ...args) {
  const now = Date.now();
  const fullKey = `${source}_${level}_${key}`;
  if (!lastLogTimestamps[fullKey] || now - lastLogTimestamps[fullKey] > delaySeconds * 1000) {
    lastLogTimestamps[fullKey] = now;
    baseLog(source, level, ...args);
  }
}

// ==============================================
//            GUI Log Window Support
// ==============================================

function setupLogScrolling() {
  if (!logBox) return;

  const observer = new MutationObserver(() => {
    if (!isUserScrolling && logBox) {
      logBox.scrollTop = logBox.scrollHeight;
    }
  });

  observer.observe(logBox, { childList: true });

  logBox.addEventListener('scroll', () => {
    const isAtBottom = logBox.scrollHeight - logBox.clientHeight - logBox.scrollTop < 20;

    if (!isAtBottom) {
      isUserScrolling = true;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isUserScrolling = false;
        if (logBox && !isUserScrolling) {
          logBox.scrollTop = logBox.scrollHeight;
        }
      }, 4000);
    } else {
      isUserScrolling = false;
    }
  });
}

function initLogger() {
  logBox = document.getElementById('logOutput');

  if (logBox && logBox.tagName.toLowerCase() === 'textarea') {
    const parent = logBox.parentElement;
    const newLogBox = document.createElement('pre');

    newLogBox.id = logBox.id;
    newLogBox.className = logBox.className;

    parent.replaceChild(newLogBox, logBox);
    logBox = newLogBox;
  }

  setupLogScrolling();

  window.api?.on('log', (event, { message, source = 'LOGGER', level = 'OK' }) => {
    logToGui(source, level, message);
  });

  const infoFilter = document.getElementById('filterInfoLogs');
  const warnFilter = document.getElementById('filterWarnLogs');
  const errorFilter = document.getElementById('filterErrorLogs');

  if (infoFilter) {
    infoFilter.addEventListener('change', () => {
      logBox.parentElement.classList.toggle('hide-info-logs', !infoFilter.checked);
    });
  }

  if (warnFilter) {
    warnFilter.addEventListener('change', () => {
      logBox.parentElement.classList.toggle('hide-warn-logs', !warnFilter.checked);
    });
  }

  if (errorFilter) {
    errorFilter.addEventListener('change', () => {
      logBox.parentElement.classList.toggle('hide-error-logs', !errorFilter.checked);
    });
  }

  const searchInput = document.getElementById('logSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  if (searchInput) {
    const searchLogger = createLogger('SEARCH');

    const performSearch = debounce((query) => {
      if (!logBox) return;

      logBox.classList.toggle('hide-search', Boolean(query));

      if (!query) {
        const allLogs = logBox.querySelectorAll('div');
        allLogs.forEach((log) => {
          log.removeAttribute('data-search-match');

          const textNodes = Array.from(log.childNodes).filter((node) => node.nodeType === 3);
          textNodes.forEach((node) => {
            if (node.originalTextContent) {
              node.textContent = node.originalTextContent;
              delete node.originalTextContent;
            }
          });
        });
        return;
      }

      const lowerQuery = query.toLowerCase();

      const logEntries = logBox.querySelectorAll('div');
      logEntries.forEach((entry) => {
        const logText = entry.textContent.toLowerCase();
        const isMatch = logText.includes(lowerQuery);

        entry.setAttribute('data-search-match', isMatch ? 'true' : 'false');
      });

      const totalLogs = logEntries.length;
      const matchedLogs = Array.from(logEntries).filter(
        (el) => el.getAttribute('data-search-match') === 'true'
      ).length;

      searchLogger.ok(`${matchedLogs}/${totalLogs} logs matched query "${query}"`);
    }, 300);

    searchInput.addEventListener('input', (e) => {
      performSearch(e.target.value.trim());
    });

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        performSearch('');
      });
    }
  }
}

// ==============================================
//           Log Filtering & Search
// ==============================================

function logToGui(source, level, message) {
  if (!logBox) return;

  const tempDiv = document.createElement('div');

  let logCategory = 'info';
  if (level === 'ERROR') logCategory = 'error';
  else if (level === 'WARN') logCategory = 'warn';

  tempDiv.setAttribute('data-log-level', logCategory);

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
    default:
      prefixSpan.className = 'log-ok';
      break;
  }

  tempDiv.appendChild(prefixSpan);
  tempDiv.appendChild(document.createTextNode(' ' + message));
  tempDiv.appendChild(document.createTextNode('\n'));

  const html = tempDiv.outerHTML;

  logBox.insertAdjacentHTML('beforeend', html);

  if (!isUserScrolling) {
    logBox.scrollTop = Number.MAX_SAFE_INTEGER;

    setTimeout(() => {
      if (logBox) logBox.scrollTop = logBox.scrollHeight;
    }, 0);
  }
}

// ==============================================
//             Log Visual Formatting
// ==============================================

function clearLogs() {
  if (logBox) {
    logBox.innerHTML = '';

    const searchInput = document.getElementById('logSearchInput');
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      logBox.classList.remove('hide-search');
    }
  }
}

// ==============================================
//         Log Export & Persistence Logic
// ==============================================

async function exportLogs() {
  if (!logBox) return;

  try {
    const visibleLogs = Array.from(logBox.querySelectorAll('div'))
      .filter((div) => {
        const style = window.getComputedStyle(div);
        return style.display !== 'none';
      })
      .map((div) => div.textContent.trim())
      .filter((text) => text)
      .join('\n');

    if (!visibleLogs) {
      window.showToast('No logs to export', 'warning');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const infoEnabled =
      !document.getElementById('filterInfoLogs') ||
      document.getElementById('filterInfoLogs').checked;
    const warnEnabled =
      !document.getElementById('filterWarnLogs') ||
      document.getElementById('filterWarnLogs').checked;
    const errorEnabled =
      !document.getElementById('filterErrorLogs') ||
      document.getElementById('filterErrorLogs').checked;
    const searchQuery = document.getElementById('logSearchInput')?.value || '';

    const header = `// VOiD Log Export
// Date: ${new Date().toLocaleString()}
// Filters: Info=${infoEnabled ? 'ON' : 'OFF'}, Warnings=${warnEnabled ? 'ON' : 'OFF'}, Errors=${errorEnabled ? 'ON' : 'OFF'}
${searchQuery ? `// Search: "${searchQuery}"` : '// Search: none'}
// ======================================\n`;

    const content = header + visibleLogs;

    const result = await window.electronAPI.saveLogToFile({
      defaultPath: `VOiD_logs_${timestamp}.txt`,
      content,
    });

    if (result.success) {
      const logger = createLogger('LOGGER');
      logger.ok(`Logs saved to: ${result.filePath}`);
      window.showToast('Logs Saved Successfully', 'success');
    }
  } catch (err) {
    const logger = createLogger('LOGGER');
    logger.error(`Failed to export logs: ${err.message}`);
    window.showToast('Failed to save logs', 'error');
  }
}

// ==============================================
//             Context-Aware Factory
// ==============================================

function createLogger(source) {
  return {
    ok: (...args) => baseLog(source, levels.ok, ...args),
    warn: (...args) => baseLog(source, levels.warn, ...args),
    error: (...args) => baseLog(source, levels.error, ...args),
    rok: (...args) => {
      const key = args[0]?.toString().slice(0, 50) || 'default';
      rateLimitedLog(source, levels.ok, key, 5, ...args);
    },
    rwarn: (...args) => {
      const key = args[0]?.toString().slice(0, 50) || 'default';
      rateLimitedLog(source, levels.warn, key, 5, ...args);
    },
    rerror: (...args) => {
      const key = args[0]?.toString().slice(0, 50) || 'default';
      rateLimitedLog(source, levels.error, key, 5, ...args);
    },
    userChat: (...args) => baseLog('USER', 'CHAT', ...args),
    botChat: (...args) => baseLog('BOT', 'CHAT', ...args),
  };
}

// ==============================================
//                    Exports
// ==============================================

module.exports = (source) => createLogger(source.toUpperCase());
module.exports.initLogger = initLogger;
module.exports.clearLogs = clearLogs;
module.exports.exportLogs = exportLogs;
module.exports.isUserScrolling = () => isUserScrolling;

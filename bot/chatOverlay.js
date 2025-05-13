// ==============================================
//                chatOverlay.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const tmi = require('tmi.js');
const log = require('../gui/ui/logger')('OVERLAY');
const { ipcRenderer } = window.require('electron');

function getConfig() {
  delete require.cache[require.resolve('../config.js')];
  return require('../config.js');
}

const hasRenderedSamples = localStorage.getItem('samplesRendered') === 'true';

// ==============================================
//             Transparency Controls
// ==============================================

const isVoidMode = localStorage.getItem('voidMode') === 'true';

if (isVoidMode) {
  document.body.classList.add('void');
  document.body.style.background = 'transparent';
  document.documentElement.style.background = 'transparent';
  document.documentElement.style.cssText = `
    background: transparent !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  `;
  document.body.style.cssText = document.documentElement.style.cssText;

  document.querySelectorAll('*').forEach((el) => {
    el.style.boxShadow = 'none';
    el.style.outline = 'none';
    el.style.border = 'none';
  });
}

ipcRenderer.on('toggle-visual-transparency', () => {
  const body = document.body;
  const isVoid = body.classList.toggle('void');

  localStorage.setItem('voidMode', isVoid);

  ipcRenderer.send('overlay-void-mode-changed', isVoid);

  if (isVoid) {
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    document.documentElement.style.cssText = `
    background: transparent !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  `;
    document.body.style.cssText = document.documentElement.style.cssText;

    document.querySelectorAll('*').forEach((el) => {
      el.style.boxShadow = 'none';
      el.style.outline = 'none';
      el.style.border = 'none';
    });

    showPositionIndicator();
  } else {
    document.body.style.background = '';
    document.documentElement.style.background = '';

    document.querySelectorAll('*').forEach((el) => {
      el.style.boxShadow = '';
      el.style.outline = '';
      el.style.border = '';
    });
  }

  log.ok('Toggled VOiD Mode');
});

// ==============================================
//            Twitch Chat Connection
// ==============================================

const client = new tmi.Client({
  options: { debug: false },
  connection: { reconnect: true, secure: true },
  identity: {
    username: '',
    password: '',
  },
  channels: [],
});

const sampleMessages = [
  { username: 'GenuineReplicant', message: 'Dang, nice chat overlay!' },
  { username: 'RetroBlossom', message: 'First! 🔥' },
  { username: 'HandOfHate', message: 'Let’s gooooo!' },
];

document.getElementById('closeButton').addEventListener('click', () => {
  ipcRenderer.send('close-overlay');
});

// ==============================================
//            Message Display System
// ==============================================

function scrollToBottom(force = false) {
  const container = document.getElementById('chatContainer');
  if (!container) return;

  const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 50;

  if (force || isNearBottom) {
    container.scrollTop = container.scrollHeight;

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;

      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 10);
    });
  }
}

function renderMessage(username, message) {
  const container = document.getElementById('chatContainer');
  const msgElem = document.createElement('div');
  msgElem.className = 'chat-message';
  msgElem.innerHTML = `<strong>${username}:</strong> ${message}`;

  container.appendChild(msgElem);

  scrollToBottom(true);

  setTimeout(() => {
    msgElem.classList.add('fade-collapse');
    setTimeout(() => {
      if (container && container.contains(msgElem)) {
        container.removeChild(msgElem);
        scrollToBottom(false);
      }
    }, 500);
  }, 15000);
}

function setupAutoScroll() {
  const container = document.getElementById('chatContainer');
  if (!container) return;

  const observer = new MutationObserver(() => {
    scrollToBottom();
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
  });
}

// ==============================================
//            Position Indicator
// ==============================================

function showPositionIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'position-indicator';
  indicator.className = 'position-indicator';

  indicator.innerHTML = `
    <div class="indicator-outline"></div>
    <div class="indicator-content">
      <h3>Chat Overlay</h3>
      <p>Connecting to Twitch...</p>
      <p class="fade-note">This indicator will disappear in 5 seconds</p>
    </div>
  `;

  indicator.style.position = 'fixed';
  indicator.style.top = '0';
  indicator.style.left = '0';
  indicator.style.width = '100%';
  indicator.style.height = '100%';
  indicator.style.boxSizing = 'border-box';
  indicator.style.pointerEvents = 'none';

  document.body.appendChild(indicator);

  setTimeout(() => {
    indicator.classList.add('indicator-fade-out');
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 1000);
  }, 5000);
}

// ==============================================
//        Initialization & Event Handlers
// ==============================================

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('chatContainer');

  if (container) {
    container.style.overflowY = 'auto';
    container.style.scrollBehavior = 'smooth';
    container.style.maxHeight = 'calc(100vh - 40px)';

    container.addEventListener('wheel', () => {
      clearTimeout(window.scrollTimer);
      window.scrollTimer = setTimeout(() => {
        scrollToBottom(true);
      }, 3000);
    });
  }

  setupAutoScroll();

  if (localStorage.getItem('voidMode') === 'true') {
    showPositionIndicator();
  }
  if (!hasRenderedSamples) {
    sampleMessages.forEach(({ username, message }) => {
      renderMessage(username, message);
    });
    localStorage.setItem('samplesRendered', 'true');
  }

  setTimeout(() => {
    const config = getConfig();

    client.opts.identity = {
      username: config.twitch.username,
      password: config.twitch.oauth,
    };
    client.opts.channels = [config.twitch.channel];

    connectToTwitch();
  }, 3000);
});

function connectToTwitch() {
  const config = getConfig();

  client.opts.identity = {
    username: config.twitch.username,
    password: config.twitch.oauth,
  };
  client.opts.channels = [config.twitch.channel];

  client
    .connect()
    .then(() => {
      log.ok('Connected to Twitch chat with fresh credentials.');
    })
    .catch((err) => {
      log.error('Failed to connect:', err);

      const button = document.createElement('button');
      button.innerText = '🔄 Reconnect Chat';
      button.className = 'reconnect-btn';
      button.onclick = () => {
        const freshConfig = getConfig();

        client.opts.identity = {
          username: freshConfig.twitch.username,
          password: freshConfig.twitch.oauth,
        };
        client.opts.channels = [freshConfig.twitch.channel];

        connectToTwitch();
        button.remove();
      };

      document.body.appendChild(button);
    });
}

client.on('message', (channel, tags, message, self) => {
  if (self) return;
  const username = tags['display-name'] || tags.username || 'Unknown';
  renderMessage(username, message);
});

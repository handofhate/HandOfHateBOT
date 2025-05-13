// ==============================================
//                configManager.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const debounce = require('../../utils/debounce.js');
const Sortable = require('sortablejs');
const log = require('./logger')('CONFIG');
const saveConfigUtil = require('../../utils/saveConfig');
const { getModuleHelp } = require('../../utils/configHelpers');
const { showMarkdownModal } = require('../../utils/tooltipManager');

const EVENTS = {
  CONFIG_CHANGED: 'configChanged',
  MODULES_CHANGED: 'modulesChanged',
};

// ==============================================
//              Initialize Manager
// ==============================================

async function initConfigManager() {
  try {
    const config = require('../../config.js');

    window.saveConfig = debounce(async (updates) => {
      try {
        log.ok(`Saving config updates: ${Object.keys(updates).join(', ')}`);

        delete require.cache[require.resolve('../../config.js')];
        const freshConfig = require('../../config.js');

        const mergedConfig = {
          ...freshConfig,
        };

        Object.entries(updates).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if (!mergedConfig[key]) {
              mergedConfig[key] = {};
            }
            mergedConfig[key] = {
              ...mergedConfig[key],
              ...value,
            };
          } else {
            mergedConfig[key] = value;
          }
        });

        const savedConfig = await saveConfigUtil(mergedConfig);

        Object.assign(config, savedConfig);

        window.dispatchEvent(new Event(EVENTS.CONFIG_CHANGED));
      } catch (error) {
        log.error('Failed to save config:', error);
        window.showToast('Failed to Save Changes', 'error');
      }
    }, 300);

    window.saveTestingConfig = async (updates) => {
      try {
        const mergedConfig = {
          ...config,
          testing: {
            ...config.testing,
            ...updates.testing,
          },
        };
        Object.assign(config, mergedConfig);
        await saveConfigUtil(mergedConfig);
        window.dispatchEvent(new Event(EVENTS.CONFIG_CHANGED));
      } catch (error) {
        console.error('Failed to save testing config:', error);
        window.showToast('Failed to Save Changes', 'error');
      }
    };

    setupConfigForm(config);
    return config;
  } catch (error) {
    log.error('Failed to initialize Config Manager:', error);
    throw error;
  }
}

// ==============================================
//               Module Reordering
// ==============================================

function setupModuleReordering() {
  const moduleList = document.getElementById('moduleOrderList');
  if (!moduleList) return;

  new Sortable(moduleList, {
    animation: 150,
    ghostClass: 'bg-base-100',
    handle: '.drag-handle',
    onEnd: async function () {
      try {
        const newOrder = Array.from(moduleList.children)
          .map((el) => el.dataset.module)
          .filter(Boolean);

        log.ok(`Reordering modules: ${newOrder.join(', ')}`);
        await window.saveConfig({ modulesOrder: newOrder });

        await new Promise((resolve) => setTimeout(resolve, 500));

        delete require.cache[require.resolve('../../config.js')];
        const freshConfig = require('../../config.js');

        setupConfigForm(freshConfig);

        window.showToast('Module Order Updated', 'success');
        log.ok('Module order updated successfully');
      } catch (error) {
        log.error('Failed to update module order:', error);
        window.showToast('Failed to Update Module Order', 'error');
      }
    },
  });
}

// ==============================================
//                 Config Form UI
// ==============================================

function setupConfigForm(config) {
  const configForm = document.getElementById('configForm');
  const configCore = document.getElementById('configCore');
  if (!configForm || !configCore) return;

  configForm.innerHTML = '';
  configCore.innerHTML = '';

  const twitchFields = [
    'twitch.channel',
    'twitch.streamerName',
    'twitch.username',
    'twitch.clientId',
    'twitch.clientSecret',
    'twitch.redirectUri',

    'twitch.oauth',
    'twitch.bearerToken',
    'twitch.refreshToken',
  ];

  const twitchSection = createConfigSection('💜 Twitch Settings', twitchFields, config);
  twitchSection.id = 'twitchSection';
  addHelpIconToSection(twitchSection, 'twitchSettings', '💜 Twitch Settings');

  // ==============================================
  //           Login with Twitch Button
  // ==============================================

  const loginBtn = document.createElement('button');
  loginBtn.className = 'btn btn-primary mt-2';
  loginBtn.style = 'margin-top: 2rem; margin-bottom: 2rem;';
  loginBtn.innerText = '🔐 Login with Twitch';
  loginBtn.onclick = async () => {
    const clientIdInput = document.querySelector('input[data-field="twitch.clientId"]');
    const redirectUriInput = document.querySelector('input[data-field="twitch.redirectUri"]');

    const clientId = clientIdInput ? clientIdInput.value : config.twitch?.clientId;
    const redirectUri = redirectUriInput ? redirectUriInput.value : config.twitch?.redirectUri;

    if (!clientId || !redirectUri) {
      window.showToast('Missing Client ID or Redirect URI', 'error');
      return;
    }

    window.saveConfig({
      twitch: {
        clientId: clientId,
        redirectUri: redirectUri,
      },
    });

    window.showToast('Preparing login...', 'info');

    await new Promise((resolve) => setTimeout(resolve, 800));

    const scope = ['chat:read', 'chat:edit', 'user:read:email'].join(' ');
    const state = crypto.randomUUID();
    const authUrl = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

    const authUrlWithForceVerify = `${authUrl}&force_verify=true`;
    window.showToast('Opening Twitch login...', 'info');
    window.open(authUrlWithForceVerify, '_blank');
  };

  const fieldsContainer = twitchSection.querySelector('.space-y-4');
  const streamerFieldIndex = Array.from(fieldsContainer.children).findIndex((el) =>
    el.innerText.includes('URI')
  );

  if (streamerFieldIndex !== -1) {
    fieldsContainer.insertBefore(loginBtn, fieldsContainer.children[streamerFieldIndex + 1]);
  } else {
    fieldsContainer.appendChild(loginBtn);
  }

  configCore.appendChild(twitchSection);

  const reorderSection = document.createElement('div');
  reorderSection.className = 'card bg-base-300 shadow-xl py-4 pl-4 pr-4';

  const reorderHeader = document.createElement('div');
  reorderHeader.className = 'flex justify-between items-center p-2 rounded-md mb-4';

  const titleContainer = document.createElement('div');
  titleContainer.className = 'flex-1';
  reorderHeader.appendChild(titleContainer);

  const reorderTitle = document.createElement('h3');
  reorderTitle.className = 'text-lg font-bold text-accent';
  reorderTitle.textContent = '🧻 Module Order';
  titleContainer.appendChild(reorderTitle);

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'flex items-center gap-2';
  reorderHeader.appendChild(actionsContainer);

  const moduleList = document.createElement('div');
  moduleList.id = 'moduleOrderList';
  moduleList.className = 'space-y-2';
  moduleList.innerHTML = config.modulesOrder
    .map(
      (moduleName) => `
    <div class="flex items-center gap-2 p-2 bg-base-100 rounded-lg" 
         data-module="${moduleName}">
        <div class="drag-handle cursor-move p-1">⋮⋮</div>
        <span class="flex-1">${getModuleDisplayName(moduleName)}</span>
    </div>
`
    )
    .join('');

  reorderSection.appendChild(reorderHeader);
  reorderSection.appendChild(moduleList);

  addHelpIconToSection(reorderSection, 'moduleOrder', '🧻 Module Order');

  configCore.appendChild(reorderSection);

  setupModuleReordering();

  config.modulesOrder.forEach((moduleName) => {
    const sectionFields = [];

    sectionFields.push(`modules.${moduleName}`);

    switch (moduleName) {
      case 'obsToggles':
        sectionFields.push('obs.toggleSources');
        break;
      case 'clipWatcher':
        sectionFields.push('clipFolder', 'discordWebhookUrl', 'maxFileSizeMb');
        sectionFields.push({
          field: 'deleteOriginalAfterPost',
          isRightToggle: true,
          label: 'Delete Original',
        });
        sectionFields.push({
          field: 'deleteCompressedAfterPost',
          isRightToggle: true,
          label: 'Delete Compressed',
        });
        sectionFields.push('knownGames');
        break;
      case 'soundEffects':
        sectionFields.push('soundEffectsFolder');
        break;
      case 'colorControl':
        sectionFields.push('hue.bridgeIp', 'hue.apiKey', 'hue.bulbIds');
        break;
      case 'chatCommands':
        sectionFields.push('chatCommands');
        break;
    }

    const section = createConfigSection(`${moduleName} Settings`, sectionFields, config);
    configForm.appendChild(section);
  });
}

// ==============================================
//             Helpers and Display
// ==============================================

function getModuleDisplayName(moduleName) {
  const displayNames = {
    colorControl: '💡 Color Control',
    soundEffects: '🔊 Sound Effects',
    obsToggles: '🎥 OBS Toggles',
    manualCommands: '⌨️ Manual Commands',
    clipWatcher: '📎 Clip Watcher',
    testingMode: '🧪 Testing Mode',
    chatCommands: '🔗 Chat Commands',
    chatOverlay: '💬 Chat Overlay',
  };
  return displayNames[moduleName] || moduleName;
}

// ==============================================
//          Config Section Generator
// ==============================================

function createConfigSection(title, fields, config) {
  const section = document.createElement('div');
  section.className = 'card bg-base-300 shadow-xl py-4 pl-4 pr-1';

  const headerDiv = document.createElement('div');
  headerDiv.className = 'flex justify-between items-center mb-4 w-full p-2 rounded-md';

  const titleContainer = document.createElement('div');
  titleContainer.className = 'flex-1';

  const titleEl = document.createElement('h3');
  titleEl.className = 'text-lg font-bold text-accent';
  const moduleName = title.replace(' Settings', '');
  titleEl.textContent = getModuleDisplayName(moduleName);
  titleContainer.appendChild(titleEl);
  headerDiv.appendChild(titleContainer);

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'flex items-center gap-2';

  if (title !== '💜 Twitch Settings') {
    const helpButton = document.createElement('button');
    helpButton.className = 'btn btn-sm btn-ghost btn-circle text-info';
    helpButton.innerHTML = '?';
    helpButton.title = 'Get help with this module';
    helpButton.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const helpText = getModuleHelp(moduleName);
      showMarkdownModal(`${getModuleDisplayName(moduleName)} Help`, helpText);
    };

    actionsContainer.appendChild(helpButton);
  }

  const moduleToggleField = fields.find((f) => f.startsWith('modules.'));
  if (moduleToggleField) {
    const toggleDiv = createConfigField(moduleToggleField, config, true);
    toggleDiv.className = 'form-control';
    actionsContainer.appendChild(toggleDiv);
    fields = fields.filter((f) => f !== moduleToggleField);
  }

  headerDiv.appendChild(actionsContainer);
  section.appendChild(headerDiv);

  const fieldsContainer = document.createElement('div');
  fieldsContainer.className = 'tabContent space-y-4 max-h-[26rem] overflow-auto pr-1';
  fieldsContainer.style.scrollbarGutter = 'stable';

  fields.forEach((field) => {
    const fieldElement = createConfigField(field, config);
    fieldsContainer.appendChild(fieldElement);
  });

  section.appendChild(fieldsContainer);
  return section;
}

// ==============================================
//          Display Name Formatting
// ==============================================

function getDisplayName(fieldName) {
  const specialNames = {
    username: 'Bot Username',
    clientId: 'Client ID',
    clientSecret: 'Client Secret',
    channel: 'Your Channel',
    streamerName: 'Your Name',
    apiKey: 'Hue API Key',
    bridgeIp: 'Hue Bridge IP',
    oauth: 'OAuth Token',
    bearerToken: 'Bearer Token',
    refreshToken: 'Refresh Token',
    redirectUri: 'Redirect URI',
    maxFileSizeMb: 'Max File Size (MB)',
    bulbIds: 'Bulb IDs',
    websocketUrl: 'WebSocket URL',
    discordWebhookUrl: 'Discord Webhook URL',
    commandsUrl: 'Commands URL',
    discordInvite: 'Discord Invite',
    clipFolder: 'Clips Folder',
    soundEffectsFolder: 'Sound Effects Folder',
  };

  if (specialNames[fieldName]) {
    return specialNames[fieldName];
  }

  return fieldName
    .split(/(?=[A-Z])|[.]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ==============================================
//              Field Type Factories
// ==============================================

function createConfigField(field, config, isToggle = false) {
  if (typeof field === 'object') {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'flex justify-between items-center mb-2';

    const label = document.createElement('span');
    label.className = 'text-sm';
    label.textContent = field.label;
    fieldDiv.appendChild(label);

    const toggle = createConfigField(field.field, config, true);
    toggle.className = 'form-control';
    fieldDiv.appendChild(toggle);

    return fieldDiv;
  }

  if (field === 'maxFileSizeMb') {
    return createClipCompressionField(config);
  }
  if (field === 'knownGames') {
    return createKnownGamesField(config);
  }
  if (field === 'hue.bulbIds') {
    return createBulbIdsField(config);
  }
  if (field === 'obs.toggleSources') {
    return createObsSourcesField(config);
  }
  if (field === 'chatCommands') {
    return createChatCommandsField();
  }

  const fieldDiv = document.createElement('div');
  fieldDiv.className = isToggle ? 'form-control w-auto' : 'form-control';

  const value = field.split('.').reduce((obj, key) => obj?.[key], config);

  if (value === undefined && !isToggle) {
    log.warn(`Config field '${field}' is undefined`);
  }

  const lockedFields = ['twitch.oauth', 'twitch.bearerToken', 'twitch.refreshToken'];

  const isLocked = lockedFields.includes(field);

  if (!isToggle) {
    const label = document.createElement('label');
    label.className = 'label';
    const displayName = field.split('.').pop();
    label.innerHTML = `<span class="label-text text-sm">${getDisplayName(displayName)}</span>`;
    fieldDiv.appendChild(label);
  }

  const isFolderPath = field === 'clipFolder' || field === 'soundEffectsFolder';

  if (isFolderPath) {
    const folderPathInput = createFolderPathInput(field, value, config);
    fieldDiv.appendChild(folderPathInput);
  } else {
    const isTextArea = field === 'links.socialLinks';
    const input = document.createElement(isTextArea ? 'textarea' : 'input');

    if (isTextArea) {
      input.className = 'textarea textarea-bordered w-full min-h-[100px]';
      input.value = Array.isArray(value) ? value.join('\n') : value || '';

      const adjustHeight = () => {
        input.style.height = 'auto';
        const lineHeight = parseInt(window.getComputedStyle(input).lineHeight);
        input.style.height = input.scrollHeight + lineHeight + 'px';
      };

      const resizeAttempts = [0, 50, 100, 250, 500];
      resizeAttempts.forEach((delay) => {
        setTimeout(adjustHeight, delay);
      });

      input.addEventListener('input', adjustHeight);

      window.addEventListener('resize', adjustHeight);
    } else {
      input.type = typeof value === 'boolean' ? 'checkbox' : 'text';
      input.className = input.type === 'checkbox' ? 'toggle' : 'input input-bordered w-full';

      input.dataset.field = field;

      if (input.type === 'checkbox') {
        input.checked = Boolean(value);
      } else {
        input.value = value || '';
      }
    }

    input.addEventListener('change', () => {
      const parts = field.split('.');
      const lastKey = parts.pop();
      const rootObj = parts[0];
      const updates = {};

      if (field === 'hue.apiKey' || field === 'hue.bridgeIp') {
        const bridgeIpInput = document.querySelector('input[data-field="hue.bridgeIp"]');
        const apiKeyInput = document.querySelector('input[data-field="hue.apiKey"]');
        const bulbIds = config.hue?.bulbIds || [];

        updates.hue = {
          bridgeIp: bridgeIpInput ? bridgeIpInput.value : config.hue?.bridgeIp || '',
          apiKey: apiKeyInput ? apiKeyInput.value : config.hue?.apiKey || '',
          bulbIds: bulbIds,
        };
      } else if (isTextArea) {
        const links = input.value.split('\n').filter((line) => line.trim());
        if (parts.length > 0) {
          updates[rootObj] = {
            ...config[rootObj],
            [lastKey]: links,
          };
        }
      } else {
        if (parts.length > 0) {
          updates[rootObj] = {
            ...config[rootObj],
            [lastKey]: input.type === 'checkbox' ? input.checked : input.value,
          };
        } else {
          updates[field] = input.type === 'checkbox' ? input.checked : input.value;
        }
      }

      window.saveConfig(updates);
      window.showToast(`Updated ${getDisplayName(field.split('.').pop())}`, 'success');
      if (field.startsWith('modules.')) {
        window.dispatchEvent(
          new CustomEvent(EVENTS.MODULES_CHANGED, {
            detail: { moduleName: field.replace('modules.', '') },
          })
        );
      }
    });
    if (!isLocked) {
      fieldDiv.appendChild(input);
    }

    // ==============================================
    //             Twitch Fields Lock
    // ==============================================

    if (isLocked && input.type !== 'checkbox') {
      input.readOnly = true;
      input.classList.add(
        'opacity-50',
        'cursor-not-allowed',
        'bg-base-300',
        'text-base-content',
        'pointer-events-none'
      );

      const lockWrapper = document.createElement('div');
      lockWrapper.className = 'relative';

      const pencilBtn = document.createElement('button');
      pencilBtn.className =
        'absolute top-0 right-0 mt-1 mr-1 px-1 py-0.5 text-xs rounded-full hover:bg-base-300 transition';
      pencilBtn.style = 'top: 7px; right: 6px;';
      pencilBtn.innerHTML = '✏️';
      pencilBtn.title = 'Unlock to edit manually (advanced only)';
      let isUnlocked = false;

      pencilBtn.onclick = (e) => {
        e.preventDefault();
        isUnlocked = !isUnlocked;

        if (isUnlocked) {
          input.readOnly = false;
          input.classList.remove(
            'opacity-50',
            'cursor-not-allowed',
            'bg-base-300',
            'text-base-content',
            'pointer-events-none'
          );
          pencilBtn.innerHTML = '🔒';
          pencilBtn.title = 'Re-lock this field';

          const msg = document.createElement('div');
          msg.className = 'text-warning text-xs mt-1 unlock-warning';
          msg.style = 'text-align: center;';
          msg.textContent = '⚠️ You’re editing an auto-generated field. Be careful!';
          fieldDiv.appendChild(msg);
        } else {
          input.readOnly = true;
          input.classList.add(
            'opacity-50',
            'cursor-not-allowed',
            'bg-base-300',
            'text-base-content',
            'pointer-events-none'
          );
          pencilBtn.innerHTML = '✏️';
          pencilBtn.title = 'Unlock to edit manually (advanced only)';

          const msg = fieldDiv.querySelector('.unlock-warning');
          if (msg) msg.remove();
        }
      };

      lockWrapper.appendChild(input);
      lockWrapper.appendChild(pencilBtn);
      fieldDiv.appendChild(lockWrapper);
    } else if (!isLocked) {
      fieldDiv.appendChild(input);
    }
  }

  return fieldDiv;
}

// ==============================================
//              Hue Bulb IDs Field
// ==============================================

function createBulbIdsField(config) {
  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'form-control';
  fieldDiv.style = 'display: grid; justify-items: center;';

  const label = document.createElement('label');
  label.className = 'label';
  label.innerHTML = '<span class="label-text text-sm">Philips Hue Bulb IDs</span>';
  fieldDiv.appendChild(label);

  const bulbInputs = document.createElement('div');
  bulbInputs.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 w-full';

  const saveBulbIds = async () => {
    const newBulbIds = Array.from(bulbInputs.querySelectorAll('input'))
      .map((input) => parseInt(input.value))
      .filter((id) => !isNaN(id));

    log.ok(`Saving bulb IDs: ${newBulbIds.join(', ')}`);

    delete require.cache[require.resolve('../../config.js')];
    const freshConfig = require('../../config.js');

    const bridgeIpInput = document.querySelector('input[data-field="hue.bridgeIp"]');
    const apiKeyInput = document.querySelector('input[data-field="hue.apiKey"]');

    const hueConfig = {
      bridgeIp: bridgeIpInput
        ? bridgeIpInput.value
        : freshConfig.hue?.bridgeIp || config.hue?.bridgeIp || '',
      apiKey: apiKeyInput ? apiKeyInput.value : freshConfig.hue?.apiKey || config.hue?.apiKey || '',
      bulbIds: newBulbIds,
    };

    await window.saveConfig({
      hue: hueConfig,
    });
  };

  const createBulbInput = (value = '') => {
    const wrapper = document.createElement('div');
    wrapper.className = 'bg-base-100 p-3 rounded-lg flex gap-2 items-center';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input input-bordered w-full';
    input.placeholder = 'Enter bulb ID';
    input.value = value;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-ghost btn-sm text-error';
    removeBtn.innerHTML = '❌';
    removeBtn.onclick = (e) => {
      e.preventDefault();
      wrapper.remove();
      saveBulbIds();
      if (input.value) {
        window.showToast('Removed Bulb ID', 'success');
      }
    };

    wrapper.appendChild(input);
    wrapper.appendChild(removeBtn);

    input.addEventListener('change', () => {
      saveBulbIds();
      window.showToast('Saved Bulb ID', 'success');
    });

    return wrapper;
  };

  (config.hue?.bulbIds || []).forEach((bulbId) => {
    bulbInputs.appendChild(createBulbInput(bulbId));
  });

  const addButton = document.createElement('button');
  addButton.className = 'btn btn-secondary btn-sm mt-6';
  addButton.innerHTML = '➕ Add Bulb';
  addButton.onclick = (e) => {
    e.preventDefault();
    bulbInputs.appendChild(createBulbInput());
  };

  fieldDiv.appendChild(bulbInputs);

  const btnWrapper = document.createElement('div');
  btnWrapper.className = 'flex justify-center';
  btnWrapper.appendChild(addButton);
  fieldDiv.appendChild(btnWrapper);

  return fieldDiv;
}

// ==============================================
//           OBS Sources Configuration
// ==============================================

function createObsSourcesField(config) {
  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'form-control overflow-auto';
  fieldDiv.style = 'display: grid; justify-items: center; scrollbarGutter: stable;';

  const label = document.createElement('label');
  label.className = 'label';
  label.innerHTML = '<span class="label-text">OBS Sources</span>';
  fieldDiv.appendChild(label);

  const createSourceInput = (source = {}) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'obs-source bg-base-100 p-4 rounded-lg';

    const fields = [
      {
        name: 'Command',
        value: source.name || '',
        placeholder: 'e.g., catcam',
      },
      {
        name: 'Scene Name',
        value: source.sceneName || '',
        placeholder: 'e.g., Mini CatCam',
      },
      {
        name: 'Source Name',
        value: source.sourceName || '',
        placeholder: 'e.g., CatCam',
      },
      {
        name: 'Duration (seconds)',
        value: source.duration ? (source.duration / 1000).toString() : '10',
        placeholder: '10',
      },
      {
        name: 'Dashboard Label',
        value: source.label || '',
        placeholder: '🐱 CatCam',
      },
    ];

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-ghost btn-sm text-error';
    removeBtn.innerHTML = '❌';
    removeBtn.onclick = (e) => {
      e.preventDefault();
      const hasValues = source.name && source.sceneName && source.sourceName;
      wrapper.remove();
      saveSources(false);
      if (hasValues) {
        window.showToast('Removed Source', 'success');
      }
    };

    const headerRow = document.createElement('div');
    headerRow.className = 'flex justify-between items-center mb-2';

    const sourceTitle = document.createElement('h4');
    sourceTitle.className = 'font-medium';
    sourceTitle.textContent = source.label || 'New OBS Source';

    headerRow.appendChild(sourceTitle);
    headerRow.appendChild(removeBtn);
    wrapper.appendChild(headerRow);

    fields.forEach((field) => {
      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = 'form-control';

      const fieldLabel = document.createElement('label');
      fieldLabel.className = 'label mt-2';
      fieldLabel.innerHTML = `<span class="label-text text-sm">${field.name}</span>`;
      fieldWrapper.appendChild(fieldLabel);

      if (field.name === 'Command') {
        const inputContainer = document.createElement('div');
        inputContainer.className = 'flex items-center';

        const prefixDiv = document.createElement('div');
        prefixDiv.className = 'px-2 py-2 rounded-l-lg flex items-center justify-center bg-base-300';
        prefixDiv.innerHTML = '<span class="text-base-content font-bold">!</span>';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'input input-bordered rounded-l-none w-full';
        input.value = field.value.replace(/^!+/, '');
        input.placeholder = field.placeholder;

        inputContainer.appendChild(prefixDiv);
        inputContainer.appendChild(input);
        fieldWrapper.appendChild(inputContainer);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'input input-bordered w-full';
        input.value = field.value;
        input.placeholder = field.placeholder;
        fieldWrapper.appendChild(input);
      }

      wrapper.appendChild(fieldWrapper);
    });
    wrapper.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', () => {
        const allInputs = wrapper.querySelectorAll('input');
        const hasRequiredFields = allInputs[0].value && allInputs[1].value && allInputs[2].value;
        if (hasRequiredFields) {
          saveSources(true);
        }
      });
    });

    return wrapper;
  };

  const sourcesContainer = document.createElement('div');
  sourcesContainer.className = 'w-full';

  const websocketFieldContainer = document.createElement('div');
  websocketFieldContainer.className = 'form-control';

  const websocketLabel = document.createElement('label');
  websocketLabel.className = 'label';
  websocketLabel.innerHTML = '<span class="label-text text-sm">WebSocket URL</span>';

  const websocketInput = document.createElement('input');
  websocketInput.type = 'text';
  websocketInput.className = 'input input-bordered w-full';
  websocketInput.value = config.obs?.websocketUrl || '';

  websocketFieldContainer.appendChild(websocketLabel);
  websocketFieldContainer.appendChild(websocketInput);

  const sourcesListContainer = document.createElement('div');
  sourcesListContainer.className = 'space-y-4';

  (config.obs?.toggleSources || []).forEach((source) => {
    sourcesListContainer.appendChild(createSourceInput(source));
  });

  sourcesContainer.appendChild(websocketFieldContainer);
  const spacer = document.createElement('div');
  spacer.className = 'h-4';
  sourcesContainer.appendChild(spacer);
  sourcesContainer.appendChild(sourcesListContainer);

  const addButton = document.createElement('button');
  addButton.className = 'btn btn-secondary btn-sm mt-6';
  addButton.innerHTML = '➕ Add Source';
  addButton.onclick = (e) => {
    e.preventDefault();
    sourcesListContainer.appendChild(createSourceInput());
  };

  const btnWrapper = document.createElement('div');
  btnWrapper.className = 'flex justify-center';
  btnWrapper.appendChild(addButton);
  sourcesContainer.appendChild(btnWrapper);

  const saveSources = (showToast = true) => {
    const newSources = Array.from(sourcesListContainer.querySelectorAll('.obs-source'))
      .map((sourceDiv) => {
        const inputs = sourceDiv.querySelectorAll('input');
        return {
          name: inputs[0].value,
          sceneName: inputs[1].value,
          sourceName: inputs[2].value,
          duration: (parseInt(inputs[3].value) || 10) * 1000,
          label: inputs[4].value,
        };
      })
      .filter((source) => source.name && source.sceneName && source.sourceName);

    const currentSources = JSON.stringify(config.obs?.toggleSources || []);
    const newSourcesStr = JSON.stringify(newSources);

    if (currentSources !== newSourcesStr) {
      log.ok(`Updating OBS sources (${newSources.length} sources)`);

      window.saveConfig({
        obs: {
          ...config.obs,
          toggleSources: newSources,
        },
      });

      if (showToast) {
        window.showToast('Saved Source', 'success');
      }
      if (!config.obs) config.obs = {};
      config.obs.toggleSources = newSources;
    }
  };

  websocketInput.addEventListener('change', () => {
    const newWebSocketUrl = websocketInput.value;
    if (newWebSocketUrl !== config.obs?.websocketUrl) {
      log.ok(`Updating WebSocket URL: ${newWebSocketUrl}`);
      window.saveConfig({
        obs: {
          ...config.obs,
          websocketUrl: newWebSocketUrl,
        },
      });
      config.obs.websocketUrl = newWebSocketUrl;
      window.showToast('WebSocket URL Updated', 'success');
    }
  });

  return sourcesContainer;
}

// ==============================================
//           Known Games Mapping Field
// ==============================================

function createKnownGamesField(config) {
  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'form-control';
  fieldDiv.style = 'display: grid; justify-items: center;';

  const label = document.createElement('label');
  label.className = 'label';
  label.innerHTML = '<span class="label-text text-sm">Known Games</span>';
  fieldDiv.appendChild(label);

  const gamesContainer = document.createElement('div');
  gamesContainer.className = 'space-y-4 w-full';

  const saveGames = (showToast = true) => {
    const newGames = {};
    gamesContainer.querySelectorAll('.game-mapping').forEach((mapping) => {
      const exeInput = mapping.querySelector('.exe-input');
      const nameInput = mapping.querySelector('.name-input');
      if (exeInput.value && nameInput.value) {
        newGames[exeInput.value] = nameInput.value;
      }
    });

    const currentGames = JSON.stringify(config.knownGames || {});
    const newGamesStr = JSON.stringify(newGames);

    if (currentGames !== newGamesStr) {
      log.ok(`Updating known games (${Object.keys(newGames).length} games)`);

      window.saveConfig({ knownGames: newGames });

      if (showToast) {
        window.showToast('Saved Game List', 'success');
      }
      config.knownGames = newGames;
    }
  };

  const createGameRow = (exe = '', name = '') => {
    const row = document.createElement('div');
    row.className = 'game-mapping bg-base-100 p-3 rounded-lg flex items-center gap-2';

    const exeInput = document.createElement('input');
    exeInput.className = 'exe-input input input-bordered flex-1';
    exeInput.placeholder = 'game.exe';
    exeInput.value = exe;

    const arrow = document.createElement('span');
    arrow.className = 'text-accent px-2';
    arrow.textContent = '→';

    const nameInput = document.createElement('input');
    nameInput.className = 'name-input input input-bordered flex-1';
    nameInput.placeholder = 'Display Name';
    nameInput.value = name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-ghost btn-sm text-error';
    removeBtn.innerHTML = '❌';
    removeBtn.onclick = (e) => {
      e.preventDefault();
      const hasValues = exeInput.value && nameInput.value;
      row.remove();
      if (hasValues) {
        saveGames(false);
        window.showToast('Removed Game', 'success');
      }
    };

    [exeInput, nameInput].forEach((input) => {
      input.addEventListener('change', () => {
        if (exeInput.value && nameInput.value) {
          saveGames(true);
        }
      });
    });

    row.append(exeInput, arrow, nameInput, removeBtn);
    return row;
  };

  Object.entries(config.knownGames || {}).forEach(([exe, name]) => {
    gamesContainer.appendChild(createGameRow(exe, name));
  });

  const addButton = document.createElement('button');
  addButton.className = 'btn btn-secondary btn-sm mt-6';
  addButton.innerHTML = '➕ Add Game';
  addButton.onclick = (e) => {
    e.preventDefault();
    gamesContainer.appendChild(createGameRow());
  };

  fieldDiv.appendChild(gamesContainer);
  fieldDiv.appendChild(addButton);
  return fieldDiv;
}

// ==============================================
//          Chat Commands Configuration
// ==============================================

function createChatCommandsField() {
  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'form-control w-full';

  const label = document.createElement('label');
  label.className = 'label';

  label.innerHTML = '<span class="label-text">Chat Commands</span>';
  fieldDiv.appendChild(label);

  const commandsList = document.createElement('div');
  commandsList.className = 'flex flex-col gap-4';
  fieldDiv.appendChild(commandsList);

  const addButtonContainer = document.createElement('div');
  addButtonContainer.className = 'flex justify-center';

  const addButton = document.createElement('button');
  addButton.className = 'btn btn-secondary btn-sm mt-6';
  addButton.innerHTML = '➕ Add Command';

  addButtonContainer.appendChild(addButton);
  fieldDiv.appendChild(addButtonContainer);

  const fs = require('fs').promises;
  const path = require('path');
  const CONFIG_PATH = path.join(__dirname, '../../config.js');

  async function saveConfigDirectly(config) {
    try {
      const configString = `module.exports = ${JSON.stringify(config, null, 2)};\n`;
      await fs.writeFile(CONFIG_PATH, configString, 'utf8');

      delete require.cache[require.resolve('../../config.js')];

      return true;
    } catch (error) {
      log.error('Failed to save config:', error);
      return false;
    }
  }

  function getFreshConfig() {
    delete require.cache[require.resolve('../../config.js')];
    return require('../../config.js');
  }

  function renderChatCommands() {
    commandsList.innerHTML = '';

    const freshConfig = getFreshConfig();
    const chatCommands = freshConfig.chatCommands || {};

    if (Object.keys(chatCommands).length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'text-center p-4 text-gray-500';
      emptyState.textContent = 'No commands defined yet. Add your first command.';
      commandsList.appendChild(emptyState);
      return;
    }

    Object.entries(chatCommands).forEach(([command, response]) => {
      const commandElement = document.createElement('div');
      commandElement.className = 'bg-base-100 p-3 rounded-lg';
      commandElement.dataset.command = command;

      const headerRow = document.createElement('div');
      headerRow.className = 'flex justify-between items-center mb-2';

      const commandTitle = document.createElement('h4');
      commandTitle.className = 'font-medium';
      commandTitle.textContent = command;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-ghost btn-sm text-error';
      removeBtn.innerHTML = '❌';

      headerRow.appendChild(commandTitle);
      headerRow.appendChild(removeBtn);

      const contentArea = document.createElement('div');
      contentArea.className = 'flex flex-col gap-2';

      const commandWithoutPrefix = command.replace(/^!+/, '');

      contentArea.innerHTML = `
        <div class="w-full">
          <label class="label">
            <span class="label-text text-sm">Command</span>
          </label>
          <div class="flex items-center">
            <div class="px-2 py-2 rounded-l-lg flex items-center justify-center bg-base-300">
              <span class="text-base-content font-bold">!</span>
            </div>
            <input type="text" class="input input-bordered rounded-l-none w-full command-input" 
                    value="${commandWithoutPrefix}" data-original-command="${command}">
          </div>
        </div>
      
        <div class="w-full">
          <label class="label">
            <span class="label-text text-sm">Response</span>
          </label>
          <textarea class="textarea textarea-bordered w-full" rows="2">${response}</textarea>
        </div>
      `;

      commandElement.appendChild(headerRow);
      commandElement.appendChild(contentArea);

      const responseInput = contentArea.querySelector('textarea');
      responseInput.rows = Math.min(5, (response.match(/\n/g) || []).length + 2);
      responseInput.style.minHeight = '80px';

      removeBtn.addEventListener('click', async () => {
        try {
          const currentConfig = getFreshConfig();

          const newCommands = {};
          Object.entries(currentConfig.chatCommands || {}).forEach(([cmd, resp]) => {
            if (cmd !== command) {
              newCommands[cmd] = resp;
            }
          });

          const newConfig = {
            ...currentConfig,
            chatCommands: newCommands,
          };

          const saved = await saveConfigDirectly(newConfig);

          if (saved) {
            commandElement.remove();
            window.showToast(`Command ${command} Removed`, 'success');

            if (Object.keys(newCommands).length === 0) {
              renderChatCommands();
            }
          } else {
            window.showToast('Failed to Remove Command', 'error');
          }
        } catch (error) {
          log.error('Failed to remove command:', error);
          window.showToast('Failed to Remove Command', 'error');
        }
      });

      const commandInput = contentArea.querySelector('.command-input');

      commandInput.addEventListener('input', () => {
        const value = commandInput.value;
        commandTitle.textContent = value ? `!${value.replace(/^!+/, '')}` : 'New Command';
      });

      [commandInput, responseInput].forEach((input) => {
        input.addEventListener('blur', async () => {
          try {
            const originalCommand = commandInput.dataset.originalCommand;
            const newCommand = `!${commandInput.value.replace(/^!+/, '')}`;
            const newResponse = responseInput.value;

            if (
              (originalCommand === newCommand && chatCommands[originalCommand] === newResponse) ||
              !commandInput.value ||
              !responseInput.value
            ) {
              return;
            }

            const currentConfig = getFreshConfig();
            const updatedCommands = { ...currentConfig.chatCommands };

            if (originalCommand !== newCommand) {
              delete updatedCommands[originalCommand];
            }

            updatedCommands[newCommand] = newResponse;

            const newConfig = {
              ...currentConfig,
              chatCommands: updatedCommands,
            };

            const saved = await saveConfigDirectly(newConfig);

            if (saved) {
              commandInput.dataset.originalCommand = newCommand;
              commandTitle.textContent = newCommand;

              window.showToast(`Command ${newCommand} Updated`, 'success');
            } else {
              window.showToast('Failed to Update Command', 'error');
            }
          } catch (error) {
            log.error('Failed to update command:', error);
            window.showToast('Failed to Update Command', 'error');
          }
        });
      });

      commandsList.appendChild(commandElement);
    });
  }

  addButton.onclick = (e) => {
    e.preventDefault();

    const commandElement = document.createElement('div');
    commandElement.className = 'bg-base-100 p-3 rounded-lg new-command-element';

    const headerRow = document.createElement('div');
    headerRow.className = 'flex justify-between items-center mb-2';

    const commandTitle = document.createElement('h4');
    commandTitle.className = 'font-medium';
    commandTitle.textContent = 'New Command';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-ghost btn-sm text-error';
    removeBtn.innerHTML = '❌';
    removeBtn.onclick = () => {
      commandElement.remove();
    };

    headerRow.appendChild(commandTitle);
    headerRow.appendChild(removeBtn);

    const contentArea = document.createElement('div');
    contentArea.className = 'flex flex-col gap-2';

    contentArea.innerHTML = `
      <div class="w-full">
        <label class="label">
          <span class="label-text text-sm">Command</span>
        </label>
        <div class="flex items-center">
          <div class="px-2 py-2 rounded-l-lg flex items-center justify-center bg-base-300">
            <span class="text-base-content font-bold">!</span>
          </div>
          <input type="text" class="input input-bordered rounded-l-none w-full command-input" 
                  value="" placeholder="Type command name...">
        </div>
      </div>
    
      <div class="w-full">
        <label class="label">
          <span class="label-text text-sm">Response</span>
        </label>
        <textarea class="textarea textarea-bordered w-full" rows="2" 
                  placeholder="Type response here..."></textarea>
      </div>
    `;

    commandElement.appendChild(headerRow);
    commandElement.appendChild(contentArea);

    const commandInput = contentArea.querySelector('.command-input');
    const responseInput = contentArea.querySelector('textarea');

    commandInput.addEventListener('input', () => {
      const value = commandInput.value;
      commandTitle.textContent = value ? `!${value.replace(/^!+/, '')}` : 'New Command';
    });

    [commandInput, responseInput].forEach((input) => {
      input.addEventListener('blur', async () => {
        try {
          const newCommand = `!${commandInput.value.replace(/^!+/, '')}`;
          const newResponse = responseInput.value;

          if (!commandInput.value || !responseInput.value) {
            return;
          }

          const currentConfig = getFreshConfig();
          const updatedCommands = { ...currentConfig.chatCommands };

          updatedCommands[newCommand] = newResponse;

          const newConfig = {
            ...currentConfig,
            chatCommands: updatedCommands,
          };

          const saved = await saveConfigDirectly(newConfig);

          if (saved) {
            commandInput.dataset.originalCommand = newCommand;

            commandElement.classList.remove('new-command-element');

            window.showToast(`Command ${newCommand} Added`, 'success');

            renderChatCommands();
          } else {
            window.showToast('Failed to Add Command', 'error');
          }
        } catch (error) {
          log.error('Failed to add command:', error);
          window.showToast('Failed to Add Command', 'error');
        }
      });
    });

    commandsList.appendChild(commandElement);

    commandInput.focus();
  };

  renderChatCommands();

  return fieldDiv;
}

// ==============================================
//              Add Tooltip Icons
// ==============================================

function addHelpIconToSection(section, helpKey, displayTitle) {
  const header =
    section.querySelector('.flex.justify-between') || section.querySelector('.flex.items-center');
  if (!header) return;

  const existingHelp = header.querySelector('.text-info');
  if (existingHelp) return;

  const helpContainer = document.createElement('div');
  helpContainer.className = 'flex items-center gap-2';

  const helpButton = document.createElement('button');
  helpButton.className = 'btn btn-sm btn-ghost btn-circle text-info';
  helpButton.innerHTML = '?';
  helpButton.title = `Get help with this module`;
  helpButton.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const helpText = getModuleHelp(helpKey);
    showMarkdownModal(`${displayTitle} Help`, helpText);
  };

  helpContainer.appendChild(helpButton);

  if (helpKey === 'twitchSettings' || helpKey === 'moduleOrder') {
    if (helpKey === 'moduleOrder') {
      const actionsContainer = header.querySelector('.flex.items-center.gap-2:not(:first-child)');
      if (actionsContainer) {
        actionsContainer.appendChild(helpContainer);
        return;
      }
    }

    let actionsContainer = header.querySelector('.flex.items-center:not(:first-child)');
    if (!actionsContainer) {
      actionsContainer = document.createElement('div');
      actionsContainer.className = 'flex items-center gap-2';
      header.appendChild(actionsContainer);
    }
    actionsContainer.appendChild(helpContainer);
    return;
  }

  const titleContainer = header.querySelector('div:first-child') || header;
  if (titleContainer.classList.contains('flex-1')) {
    titleContainer.classList.remove('flex-1');
    titleContainer.classList.add('flex', 'items-center');
    titleContainer.appendChild(helpContainer);
  } else {
    header.insertBefore(helpContainer, header.lastChild);
  }
}

// ==============================================
//         Clip Compression Settings Field
// ==============================================

function createClipCompressionField(config) {
  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'form-control';

  const label = document.createElement('label');
  label.className = 'label';
  label.innerHTML = '<span class="label-text text-sm">Clip Compression Settings</span>';
  fieldDiv.appendChild(label);

  const adaptiveRow = document.createElement('div');
  adaptiveRow.className = 'flex justify-between items-center mb-2 bg-base-100 p-3 rounded-lg';

  const adaptiveLabel = document.createElement('div');
  adaptiveLabel.innerHTML = `
    <span class="font-medium">Smart Compression</span>
    <p class="text-xs opacity-70">Automatically adjust quality to meet size target</p>
  `;

  const adaptiveToggle = document.createElement('input');
  adaptiveToggle.type = 'checkbox';
  adaptiveToggle.className = 'toggle';
  adaptiveToggle.checked = config.smartCompression !== false;

  adaptiveRow.appendChild(adaptiveLabel);
  adaptiveRow.appendChild(adaptiveToggle);
  fieldDiv.appendChild(adaptiveRow);

  const sizeRow = document.createElement('div');
  sizeRow.className = 'flex justify-between items-center mb-2 bg-base-100 p-3 rounded-lg';

  const sizeLabel = document.createElement('div');
  sizeLabel.innerHTML = `
    <span class="font-medium">Target File Size</span>
    <p class="text-xs opacity-70">Maximum size in MB (Discord limit: 8MB for webhooks)</p>
  `;

  const sizeInput = document.createElement('input');
  sizeInput.type = 'number';
  sizeInput.className = 'input input-bordered w-24';
  sizeInput.value = config.maxFileSizeMb || 8;
  sizeInput.min = 1;
  sizeInput.max = 50;

  sizeRow.appendChild(sizeLabel);
  sizeRow.appendChild(sizeInput);
  fieldDiv.appendChild(sizeRow);

  const qualityRow = document.createElement('div');
  qualityRow.className = 'flex justify-between items-center mb-2 bg-base-100 p-3 rounded-lg';

  const qualityLabel = document.createElement('div');
  qualityLabel.innerHTML = `
    <span class="font-medium">Compression Quality</span>
    <p class="text-xs opacity-70">When Smart Compression is disabled</p>
  `;

  const qualitySelect = document.createElement('select');
  qualitySelect.className = 'select select-bordered w-full max-w-xs';

  const options = [
    { value: 'minimal', label: '🔄 Low Compression - Highest Quality, Largest Files' },
    { value: 'low', label: '🔄 Light Compression - Better Quality, Larger Files' },
    { value: 'medium', label: '🔄 Balanced - Good Quality, Moderate Size (Default)' },
    { value: 'high', label: '🔄 Strong Compression - Lower Quality, Smaller Files' },
    { value: 'extreme', label: '🔄 Max Compression - Lowest Quality, Smallest Files' },
  ];

  options.forEach((option) => {
    const optionEl = document.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    optionEl.selected = (config.compressionLevel || 'medium') === option.value;
    qualitySelect.appendChild(optionEl);
  });

  qualityRow.appendChild(qualityLabel);
  qualityRow.appendChild(qualitySelect);
  fieldDiv.appendChild(qualityRow);

  function updateVisibility() {
    qualityRow.style.opacity = adaptiveToggle.checked ? '0.5' : '1';
    qualityRow.style.pointerEvents = adaptiveToggle.checked ? 'none' : 'auto';
  }

  adaptiveToggle.addEventListener('change', () => {
    updateVisibility();
    window.saveConfig({ smartCompression: adaptiveToggle.checked });
    window.showToast(
      'Smart Compression ' + (adaptiveToggle.checked ? 'Enabled' : 'Disabled'),
      'success'
    );
  });

  sizeInput.addEventListener('change', () => {
    window.saveConfig({ maxFileSizeMb: Number(sizeInput.value) });
    window.showToast(`File Size Limit Set to ${sizeInput.value}MB`, 'success');
  });

  qualitySelect.addEventListener('change', () => {
    window.saveConfig({ compressionLevel: qualitySelect.value });
    window.showToast(
      `Compression Quality Updated to ${qualitySelect.options[qualitySelect.selectedIndex].text.split(' - ')[0]}`,
      'success'
    );
  });

  updateVisibility();

  return fieldDiv;
}

// ==============================================
//             Path Input Management
// ==============================================

function createFolderPathInput(field, value, config) {
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'relative w-full';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'input input-bordered w-full pr-10';
  input.value = value || '';
  input.title = value || '';
  input.readOnly = true;
  input.style.textOverflow = 'ellipsis';
  input.dataset.fullPath = value || '';

  const updatePathDisplay = () => {
    const fullPath = input.dataset.fullPath;
    if (!fullPath) return;

    if (!input.offsetWidth) return;

    const availWidth = input.offsetWidth - 45;
    const charWidth = 8;
    const maxChars = Math.floor(availWidth / charWidth);

    if (fullPath.length <= maxChars) {
      input.value = fullPath;
      return;
    }

    // eslint-disable-next-line no-useless-escape
    const parts = fullPath.split(/[\/\\]+/);

    const firstPart = parts[0];
    const lastPart = parts[parts.length - 1];

    const remainingChars = maxChars - firstPart.length - lastPart.length - 5;

    if (remainingChars > 3) {
      const middlePath = parts.slice(1, -1).join('/');
      const halfRemaining = Math.floor(remainingChars / 2);

      const start = middlePath.substring(0, halfRemaining);
      const end = middlePath.substring(middlePath.length - halfRemaining);

      input.value = `${firstPart}:/${start}...${end}/${lastPart}`;
    } else {
      input.value = `${firstPart}:/.../${lastPart}`;
    }
  };

  [0, 50, 100, 250, 500].forEach((delay) => {
    setTimeout(updatePathDisplay, delay);
  });

  try {
    const resizeObserver = new ResizeObserver(() => {
      updatePathDisplay();
    });
    resizeObserver.observe(input);
  } catch (e) {
    window.addEventListener('resize', updatePathDisplay);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(updatePathDisplay, 50);
    }
  });

  try {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'childList' &&
          mutation.addedNodes.length &&
          document.contains(input)
        ) {
          setTimeout(updatePathDisplay, 50);
          observer.disconnect();
          break;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } catch (e) {
    console.error('MutationObserver failed:', e);
  }

  const folderIcon = document.createElement('button');
  folderIcon.className =
    'absolute right-2 top-5 -translate-y-1/2 text-base-content/70 hover:text-accent transition-colors';
  folderIcon.innerHTML = '📁';
  folderIcon.style.cursor = 'pointer';
  folderIcon.style.zIndex = '10';
  folderIcon.title = `Select ${getDisplayName(field.split('.').pop())}`;

  folderIcon.onclick = async (e) => {
    e.preventDefault();
    try {
      const { ipcRenderer } = require('electron');
      const result = await ipcRenderer.invoke('dialog:select-folder');

      if (!result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];

        input.dataset.fullPath = folderPath;
        input.title = folderPath;
        updatePathDisplay();

        const parts = field.split('.');
        const lastKey = parts.pop();
        const rootObj = parts[0];
        const updates = {};

        if (parts.length > 0) {
          updates[rootObj] = {
            ...config[rootObj],
            [lastKey]: folderPath,
          };
        } else {
          updates[field] = folderPath;
        }

        window.saveConfig(updates);
        window.showToast(`${getDisplayName(field.split('.').pop())} Path Updated`, 'success');
      }
    } catch (error) {
      console.error(`Failed to select folder for ${field}:`, error);
      window.showToast('Failed to select folder', 'error');
    }
  };

  inputWrapper.appendChild(input);
  inputWrapper.appendChild(folderIcon);

  return inputWrapper;
}

// ==============================================
//                   Exports
// ==============================================

module.exports = { initConfigManager, setupConfigForm };

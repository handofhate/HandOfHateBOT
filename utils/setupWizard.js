// ==============================================
//                 setupWizard.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const log = require('../gui/ui/logger')('SETUP');
const marked = require('marked');
const saveConfig = require('./saveConfig');

// Current step being displayed
let currentStep = 0;
let configData = null;
let onSetupComplete = null;
let modalElement = null;
let authInProgress = false;

// ==============================================
//                 Wizard Steps
// ==============================================

const setupSteps = [
  {
    title: 'Getting Started',
    content: `
<h2 style="text-align:center;">Welcome to the VOiD.</h2>

<div style="text-align:center;">
  This wizard will help you set up the essential configuration for VOiD.
  <br><br><br>
  <strong>What you'll need:</strong>
  <br><br>
</div>

<div style="text-align:center;">
  <ul style="display: inline-block; text-align: left;">
    <li>Your Twitch channel name and account details</li>
    <li>A separate Twitch account for VOiD</li>
    <li>Twitch Developer App credentials for VOiD (we'll guide you through this)</li>
  </ul>
</div>

<br><br><br>

<h3 style="text-align:center;">Let's jump into the VOiD!</h3>
    `,
    fields: [],
  },
  {
    title: 'Twitch Setup',
    content: `
<h2 style="text-align:center;">Connect to Twitch</h2>

<div style="text-align:center;">
Enter your Twitch information:
<br><br><br>
</div>

> <div style="text-align:center;">These settings help VOiD connect to your Twitch chat and respond to commands.
</div>
    `,
    fields: [
      {
        path: 'twitch.channel',
        label: 'Channel Name',
        description: 'The Twitch channel where VOiD will interact (usually your streaming channel)',
      },
      {
        path: 'twitch.streamerName',
        label: 'Display Name',
        description: "Your name as you want it to appear in messages (like 'Ty')",
      },
      {
        path: 'twitch.username',
        label: 'VOiD Username',
        description: 'Separate Twitch account username you created for VOiD',
      },
    ],
  },
  {
    title: 'Twitch Setup',
    content: `
<h2 style="text-align:center;">Twitch API Authentication</h2>

<div style="text-align:center;">
  To connect to Twitch, you'll need to register an application:
  <br><br>
</div>

<ol>
  <li>
    Go to 
    <a href="https://dev.twitch.tv/console/apps" target="_blank" style="color:#60a5fa; text-decoration:underline;">
      dev.twitch.tv/console/apps
    </a>
  </li>
  <li>
    Make sure you're logged in with your <strong>VOiD Twitch account</strong>, not your personal account
  </li>
  <li>
    Click on <strong>“Register Your Application”</strong> and fill out the form:
    <ul style="margin-top: 0.5rem;">
      <li>Name: Anything you'd like (e.g. 'VOiD')</li>
      <li>OAuth Redirect URI: <code style="background:#1e293b; color:#f8fafc; padding:2px 6px; border-radius:4px;">http://localhost:3000/auth/twitch/callback</code></li>
      <li>Category: "Chat Bot"</li>
    </ul>
  </li>
  <li>
    Click on <strong>“Create”</strong>
  </li>
  <li>
    From the resulting page, copy your <strong>Client ID</strong>
  </li>
  <li>
    Click on <strong>“New Secret”</strong> to generate your <strong>Client Secret</strong>
  </li>
</ol>
<br>

> <div style="text-align:center;">These credentials allow VOiD to authenticate with Twitch services.
</div>
    `,
    fields: [
      {
        path: 'twitch.clientId',
        label: 'Client ID',
      },
      {
        path: 'twitch.clientSecret',
        label: 'Client Secret',
      },
      {
        path: 'twitch.redirectUri',
        label: 'Redirect URI',
        value: 'http://localhost:3000/auth/twitch/callback',
      },
    ],
  },
  {
    title: 'Twitch Setup',
    content: `
<h2 style="text-align:center;">Login With Twitch</h2>

<div style="text-align:center;">
Please verify that these values are correct before proceeding:
<br><br>
</div>
<div style="text-align:center;">
  <ul style="display: inline-block; text-align: left;">
<strong><h3><li>Bot Username:</strong> \${twitch.username}</li>
<strong><li>Client ID:</strong> \${twitch.clientId}</li>
<strong><li>Client Secret:</strong> \${twitch.clientSecret}</li>
<strong><li>Redirect URI:</strong> \${twitch.redirectUri}</li>
  </ul>
<br><br><br><br><br>
</div>
<div style="text-align:center;">
If everything looks correct, click the button below to authorize VOiD with Twitch.
<br><br>
</div>

> <div style="text-align:center;">Make sure you log in with your VOiD Twitch account
</div>
  `,
    fields: [],
    customRender: renderTwitchLoginStep,
  },
  {
    title: 'Module Selection',
    content: `
<h2 style="text-align:center;">Choose Your Features</h2>

<div style="text-align:center;">
Select which modules you want to enable:
</div>

> <div style="text-align:center;">You can always change this later from the Config tab.
</div>
    `,
    fields: [
      {
        path: 'modules.colorControl',
        label: 'Color Control',
        type: 'checkbox',
        description: 'User/Chat controlled Philips Hue light colors',
      },
      {
        path: 'modules.obsToggles',
        label: 'OBS Toggles',
        type: 'checkbox',
        description: 'User/Chat controlled toggling of sources in OBS',
      },
      {
        path: 'modules.clipWatcher',
        label: 'Clip Watcher',
        type: 'checkbox',
        description: 'Auto-post gaming clips to Discord, with Game Info and Timestamp',
      },
      {
        path: 'modules.soundEffects',
        label: 'Sound Effects',
        type: 'checkbox',
        description: 'User/Chat controlled sound effects',
      },
      {
        path: 'modules.chatCommands',
        label: 'Chat Commands',
        type: 'checkbox',
        description: 'Custom chat commands (e.g. !lurk, !discord, etc.)',
      },
      {
        path: 'modules.testingMode',
        label: 'Testing Mode',
        type: 'checkbox',
        description: 'Simulated connection modes for testing VOiD features without going live',
      },
      {
        path: 'modules.manualCommands',
        label: 'Manual Commands',
        type: 'checkbox',
        description: 'Manually send any !command from the dashboard',
      },
      {
        path: 'modules.chatOverlay',
        label: 'Chat Overlay',
        type: 'checkbox',
        description:
          'Show Twitch chat as an overlay on top of any game so you never miss a message',
      },
    ],
  },
  {
    title: 'Module Setup',
    content: `
<h2 style="text-align:center;">Color Control Configuration</h2>

<div style="text-align:center;">
  Connect VOiD to your Philips Hue lights:
  <br><br><br>
</div>

<ol>
  <li>Make sure you and your Philips Hue Bridge are on the same network</li>
  <li>
    Follow <a href="https://discovery.meethue.com/" target="_blank" style="color:#60a5fa; text-decoration:underline;">this link</a> and copy your Bridge IP (named "internalipaddress")
  </li>
  <li>
    Get an API key by following <a href="https://www.sitebase.be/generate-phillips-hue-api-token/" target="_blank" style="color:#60a5fa; text-decoration:underline;">this guide</a>
  </li>
  <li>
    Visit: <code style="background:#1e293b; color:#f8fafc; padding:2px 6px; border-radius:4px;">http://&lt;yourIP&gt;/api/&lt;yourAPI&gt;/lights</code>
  </li>
  <li>
    Find and enter the IDs of the bulbs you want to control (comma-separated numbers)
  </li>
</ol>

> <div style="text-align:center;">These settings allow VOiD to control your lights via chat commands or dashboard buttons.
</div>
`,
    fields: [
      {
        path: 'hue.bridgeIp',
        label: 'Bridge IP Address',
        placeholder: '192.168.1.100',
        description: 'The IP address of your Philips Hue Bridge',
      },
      {
        path: 'hue.apiKey',
        label: 'Hue API Key',
        description: 'Developer API key for your Hue Bridge',
      },
      {
        path: 'hue.bulbIds',
        label: 'Bulb IDs',
        placeholder: '1,2,3',
        description: 'Comma-separated list of the bulb IDs you want to control',
      },
      {
        path: 'hueCooldown',
        label: 'Cooldown (ms)',
        value: '1000',
        description: 'Minimum time between color changes in milliseconds (to avoid spamming)',
      },
    ],
    customDisplay: true,
    showIf: (config) => config.modules?.colorControl === true,
  },
  {
    title: 'Module Setup',
    content: `
<h2 style="text-align:center;">OBS Toggles Configuration</h2>

<div style="text-align:center;">
  Connect VOiD to OBS for source toggling:
  <br><br><br>
</div>

<ol>
  <li>Open <strong>OBS Studio</strong> and go to <strong>Tools → WebSocket Server Settings</strong></li>
  <li>Make sure the <strong>WebSocket Server</strong> is enabled</li>
  <li>Note the <strong>Server Port</strong> (default is 4455)</li>
  <li>Click <strong>OK</strong> to save the OBS WebSocket settings</li>
</ol>

<br>
<div style="text-align:center;">
After completing this setup, you can add sources to control in the Config tab.
</div>
<br><br><br>

> <div style="text-align:center;">These settings allow VOiD to toggle OBS sources via chat commands or dashboard buttons.</div>
`,
    fields: [
      {
        path: 'obs.websocketUrl',
        label: 'WebSocket URL',
        value: 'ws://127.0.0.1:4455',
        description: 'The WebSocket URL for your OBS connection (usually ws://127.0.0.1:4455)',
      },
    ],
    customDisplay: true,
    showIf: (config) => config.modules?.obsToggles === true,
  },
  {
    title: 'Module Setup',
    content: `
<h2 style="text-align:center;">Clip Watcher Configuration</h2>

<div style="text-align:center;">
  Set up VOiD to automatically post your clips to Discord:
  <br><br><br>
</div>

<ol>
  <li>Select the folder where your gameplay clips are saved</li>
  <li>Create a <a href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" target="_blank" style="color:#60a5fa; text-decoration:underline;">Discord webhook</a> in your server's channel settings</li>
  <li>Copy the Webhook URL</li>
  <li>Configure compression settings to ensure clips can be posted (Discord Webhook limit: 8MB)</li>
</ol>

<br>
<div style="text-align:center;">
VOiD will watch this folder for new clips and automatically compress and post them to your Discord with a time stamp and game info. After completing this setup, you can add games for VOiD to recognize in the Config tab.
</div>
<br><br>

> <div style="text-align:center;">These settings allow VOiD to share your best gaming moments with minimal effort.</div>
`,
    fields: [
      {
        path: 'clipFolder',
        label: 'Clips Folder',
        placeholder: 'C:\\Users\\YourName\\Videos\\Clips',
        description: 'The folder where your gameplay recordings are saved',
      },
      {
        path: 'discordWebhookUrl',
        label: 'Discord Webhook URL',
        placeholder: 'https://discord.com/api/webhooks/...',
        description: 'The webhook URL for your Discord channel',
      },
      {
        path: 'maxFileSizeMb',
        label: 'Max File Size (MB)',
        value: '8',
        description: 'Maximum file size for Discord Webhook uploads (8MB for standard servers)',
      },
      {
        path: 'smartCompression',
        label: 'Smart Compression',
        type: 'checkbox',
        checked: true,
        description: 'Automatically adjust compression level to meet size requirements',
      },
      {
        path: 'deleteOriginalAfterPost',
        label: 'Delete Original Clip After Posting',
        type: 'checkbox',
        description: 'Remove the original clip file after successful upload to Discord',
      },
      {
        path: 'deleteCompressedAfterPost',
        label: 'Delete Compressed Clip After Posting',
        type: 'checkbox',
        description: 'Remove the compressed clip file after successful upload to Discord',
      },
    ],
    customDisplay: true,
    showIf: (config) => config.modules?.clipWatcher === true,
  },
  {
    title: 'Module Setup',
    content: `
<h2 style="text-align:center;">Sound Effects Configuration</h2>

<div style="text-align:center;">
  Set up VOiD to play sound effects through your stream:
  <br><br><br>
</div>

<ol>
  <li>Select a folder where you'll store your sound effect .mp3 files</li>
  <li>Add .mp3 files to this folder - filenames will become commands</li>
  <li>For example, <code style="background:#1e293b; color:#f8fafc; padding:2px 6px; border-radius:4px;">applause.mp3</code> creates the <code style="background:#1e293b; color:#f8fafc; padding:2px 6px; border-radius:4px;">!applause</code> command</li>
  <li>Sound effects can be triggered from chat or via dashboard buttons</li>
</ol>

<br>
<div style="text-align:center;">
VOiD will automatically detect .mp3 files in your sound effects folder and make them available as both chat commands and dashboard buttons.
</div>
<br><br>

> <div style="text-align:center;">These settings allow VOiD to play sound effects for chat engagement and reactions.</div>
`,
    fields: [
      {
        path: 'soundEffectsFolder',
        label: 'Sound Effects Folder',
        type: 'folder',
        placeholder: 'C:\\Users\\YourName\\Documents\\VOiD\\sounds',
        description: 'The folder where your sound effect MP3 files are stored',
      },
    ],
    customDisplay: true,
    showIf: (config) => config.modules?.soundEffects === true,
  },
  {
    title: 'Module Setup',
    content: `
<h2 style="text-align:center;">Chat Commands Configuration</h2>

<div style="text-align:center;">
  Enable custom chat commands for your viewers:
  <br><br><br>
</div>

<ol>
  <li>VOiD comes with some pre-configured commands like <code style="background:#1e293b; color:#f8fafc; padding:2px 6px; border-radius:4px;">!lurk</code>, <code style="background:#1e293b; color:#f8fafc; padding:2px 6px; border-radius:4px;">!discord</code>, etc.</li>
  <li>You can customize these and add your own commands in the Config tab</li>
  <li>Use variables like <code style="background:#1e293b; color:#f8fafc; padding:2px 6px; border-radius:4px;">$(user)</code> and <code style="background:#1e293b; color:#f8fafc; padding:2px 6px; border-radius:4px;">$(target)</code> in responses</li>
  <li>Multi-line responses will be sent with the between-message delay specified below</li>
</ol>

<br>
<div style="text-align:center;">
Commands can be triggered by viewers in chat or via Dashboard buttons.
VOiD supports many common variables and customizations for your responses. Commands can be added and/or removed from the Config tab after completing this setup.
</div>
<br><br>

> <div style="text-align:center;">These settings allow VOiD to respond to custom commands in your Twitch chat.</div>
`,
    fields: [
      {
        path: 'timing.multiLineDelay',
        label: 'Multi-Line Delay (ms)',
        value: '1000',
        description:
          'Time between sending each line of a multi-line command response in milliseconds',
      },
      {
        path: 'chatCommands.!commands',
        label: 'Default !commands Message',
        value: '📋 View a complete list of available commands: ---> commands.yoursite.com',
        description: 'Response when a viewer types !commands',
      },
      {
        path: 'chatCommands.!discord',
        label: 'Default !discord Message',
        value: '👥 Join the Discord: ---> discord.gg/yourinvite',
        description: 'Response when a viewer types !discord',
      },
    ],
    customDisplay: true,
    showIf: (config) => config.modules?.chatCommands === true,
  },
  {
    title: 'Setup Complete',
    content: `
<h2 style="text-align:center;">You're all set!</h2>
<br>
<h3 style="text-align:center;">🎉 Welcome to the VOiD.</h3>
<br><br><br>
<div style="text-align:center;">Your settings have been saved and VOiD is ready to use.</div>
<br><br>
<h3 style="text-align:center;">Next Steps:</h3>
<br>
<div style="text-align:center;">
  <ul style="display: inline-block; text-align: left;">
    <li>Click the <strong>Dashboard</strong> tab to control your stream</li>
    <li>Use the <strong>Logs</strong> tab to monitor VOiD's activity</li>
    <li>Visit the <strong>Config</strong> tab to fine-tune your VOiD settings</li>
  </ul>
</div>
<br><br><br>
<div style="text-align:center;">
Thank you for using VOiD. Happy streaming!
</div>
    `,
    fields: [],
  },
];

// ==============================================
//                Create Wizard UI
// ==============================================

function showSetupWizard(config, completionCallback) {
  configData = config;
  onSetupComplete = completionCallback;
  currentStep = 0;

  createAndShowModal();

  return modalElement;
}

function createAndShowModal() {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'fixed z-50 inset-0 flex items-center justify-center bg-black/50';
  modalOverlay.id = 'wizardModal';

  const modalBox = document.createElement('div');
  modalBox.className = 'bg-base-100 rounded-lg shadow-xl flex flex-col relative';

  const headerElement = document.createElement('div');
  headerElement.className = 'p-4 border-b border-base-300 flex justify-between items-center';

  const titleElement = document.createElement('h3');
  titleElement.className = 'text-lg font-bold';
  titleElement.textContent = setupSteps[currentStep].title;

  headerElement.appendChild(titleElement);

  const bodyElement = document.createElement('div');
  bodyElement.className = 'overflow-y-auto flex-grow markdown-body';

  updateStepContent(bodyElement);

  modalBox.appendChild(headerElement);
  modalBox.appendChild(bodyElement);
  modalOverlay.appendChild(modalBox);

  document.body.appendChild(modalOverlay);

  modalElement = modalOverlay;
}

// ==============================================
//              Update Step Content
// ==============================================

function updateStepContent(bodyElement) {
  const applicableSteps = getApplicableSteps();
  const currentStepIndex = applicableSteps.findIndex((step) => step === setupSteps[currentStep]);

  const container = document.createElement('div');
  container.className = 'flex flex-col h-full';

  const topContent = document.createElement('div');
  topContent.className = 'flex-grow overflow-y-auto';

  const step = setupSteps[currentStep];

  if (step.customRender && typeof step.customRender === 'function') {
    step.customRender(topContent);
  } else {
    try {
      const contentHtml = marked.parse(step.content);
      const contentDiv = document.createElement('div');
      contentDiv.className = 'prose max-w-full';
      contentDiv.innerHTML = contentHtml;
      topContent.appendChild(contentDiv);
    } catch (error) {
      const fallbackContent = document.createElement('div');
      fallbackContent.textContent = step.content;
      topContent.appendChild(fallbackContent);
    }

    if (step.fields && step.fields.length > 0) {
      const fieldsContainer = document.createElement('div');
      fieldsContainer.className = 'mt-6 space-y-4';

      step.fields.forEach((field) => {
        const fieldElem =
          field.type === 'folder' ? createFolderInputField(field) : createInputField(field);
        fieldsContainer.appendChild(fieldElem);
      });

      topContent.appendChild(fieldsContainer);
    }
  }

  container.appendChild(topContent);

  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'relative flex items-center justify-between mt-auto pt-4 w-full';

  const prevButton = document.createElement('button');
  prevButton.id = 'setupPrevBtn';
  prevButton.className = 'btn btn-outline btn-sm';
  prevButton.textContent = '← Previous';
  prevButton.disabled = currentStep === 0;
  if (currentStep === 0) {
    prevButton.classList.add('btn-disabled');
  }

  const nextButton = document.createElement('button');
  nextButton.id = 'setupNextBtn';
  nextButton.className = 'btn btn-primary btn-sm';
  nextButton.textContent = currentStep === setupSteps.length - 1 ? 'Finish' : 'Next →';

  const progress = document.createElement('div');
  progress.className = 'badge badge-neutral left-1/2 transform -translate-x-1/2';
  progress.textContent = `Step ${currentStepIndex + 1} of ${applicableSteps.length}`;

  buttonsContainer.appendChild(prevButton);
  buttonsContainer.appendChild(progress);
  buttonsContainer.appendChild(nextButton);

  container.appendChild(buttonsContainer);

  bodyElement.innerHTML = '';
  bodyElement.appendChild(container);

  prevButton.addEventListener('click', goToPreviousStep);
  nextButton.addEventListener('click', goToNextStep);

  setupFieldListeners();
}

// ==============================================
//               Twitch Login Step
// ==============================================

function renderTwitchLoginStep(container) {
  let content = setupSteps[currentStep].content;

  content = content.replace('${twitch.username}', getConfigValue('twitch.username') || 'Not set');
  content = content.replace('${twitch.clientId}', getConfigValue('twitch.clientId') || 'Not set');
  content = content.replace(
    '${twitch.clientSecret}',
    getConfigValue('twitch.clientSecret') || 'Not set'
  );
  content = content.replace(
    '${twitch.redirectUri}',
    getConfigValue('twitch.redirectUri') || 'Not set'
  );

  const contentElement = document.createElement('div');
  contentElement.className = 'prose max-w-full';
  contentElement.innerHTML = marked.parse(content);
  container.appendChild(contentElement);

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'mt-6 flex justify-center';

  const loginButton = document.createElement('button');
  loginButton.className = 'btn btn-primary gap-2';
  loginButton.innerHTML = '<i class="icon-twitch" style="font-size: 1.2em;"></i> Login with Twitch';
  loginButton.addEventListener('click', initiateOAuthLogin);

  buttonContainer.appendChild(loginButton);
  container.appendChild(buttonContainer);
}

async function initiateOAuthLogin() {
  if (authInProgress) return;
  authInProgress = true;

  const loginButton = document.querySelector('#wizardModal button.btn-primary');
  if (loginButton) {
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="loading loading-spinner"></span> Connecting...';
  }

  try {
    const clientId = getConfigValue('twitch.clientId');
    const clientSecret = getConfigValue('twitch.clientSecret');
    const redirectUri = getConfigValue('twitch.redirectUri');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing required Twitch credentials');
    }

    await saveConfig(configData);

    const scope = ['chat:read', 'chat:edit', 'user:read:email'].join(' ');
    const state = Math.random().toString(36).substring(2, 15);
    const authUrl = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

    const authUrlWithForceVerify = `${authUrl}&force_verify=true`;

    window.open(authUrlWithForceVerify, '_blank');

    const messageElement = document.createElement('div');
    messageElement.className = 'alert alert-info mt-4 text-center';
    messageElement.innerHTML = `<i class="icon-info-circle mr-2"></i> Browser window opened. Please log into your VOiD Twitch account and press 'Next' when finished.`;

    const buttonContainer = loginButton.parentElement;
    buttonContainer.parentElement.insertBefore(messageElement, buttonContainer.nextSibling);

    setTimeout(() => {
      loginButton.disabled = false;
      loginButton.innerHTML =
        '<i class="icon-twitch" style="font-size: 1.2em;"></i> Login with Twitch';
      authInProgress = false;
    }, 5000);
  } catch (error) {
    log.error('Twitch authentication error:', error);

    const messageElement = document.createElement('div');
    messageElement.className = 'alert alert-error mt-4';
    messageElement.innerHTML = `<i class="icon-alert-triangle mr-2"></i> ${error.message || 'Authentication failed'}`;

    if (loginButton) {
      const buttonContainer = loginButton.parentElement;
      buttonContainer.parentElement.insertBefore(messageElement, buttonContainer.nextSibling);

      loginButton.innerHTML = '<i class="icon-twitch" style="font-size: 1.2em;"></i> Try Again';
      loginButton.disabled = false;
    }

    authInProgress = false;
  }
}

// ==============================================
//              Input Field Creation
// ==============================================

function createInputField(field) {
  if (field.path === 'clipFolder' || field.path === 'soundEffectsFolder') {
    return createFolderInputField(field);
  }

  const fieldContainer = document.createElement('div');

  if (field.type === 'checkbox') {
    fieldContainer.className = 'form-control';

    const fieldValue = getConfigValue(field.path);
    const isChecked = field.checked || fieldValue;

    const label = document.createElement('label');
    label.className = 'cursor-pointer label justify-start gap-4';

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.className = 'toggle toggle-success';
    toggle.checked = isChecked;
    toggle.dataset.path = field.path;

    const labelTextContainer = document.createElement('div');
    const labelText = document.createElement('span');
    labelText.className = 'label-text text-base-content text-base font-medium';
    labelText.textContent = field.label;

    const description = document.createElement('p');
    description.className = 'text-xs text-base-content opacity-70 mt-1';
    description.textContent = field.description || '';

    labelTextContainer.appendChild(labelText);
    labelTextContainer.appendChild(description);

    label.appendChild(toggle);
    label.appendChild(labelTextContainer);

    fieldContainer.appendChild(label);
  } else if (field.type === 'textarea' || (field.value && field.value.includes('\n'))) {
    fieldContainer.className = 'form-control w-full';

    const label = document.createElement('label');
    label.className = 'label';

    const labelText = document.createElement('span');
    labelText.className = 'label-text';
    labelText.textContent = field.label;

    label.appendChild(labelText);
    fieldContainer.appendChild(label);

    let fieldValue = getConfigValue(field.path);

    if (field.path === 'hue.bulbIds' && Array.isArray(fieldValue)) {
      fieldValue = fieldValue.join(',');
    }

    if (field.value !== undefined && !fieldValue) {
      fieldValue = field.value;
    }

    const textarea = document.createElement('textarea');
    const lineCount = (fieldValue || '').split('\n').length;
    const textareaHeight = Math.max(5, lineCount + 1);
    textarea.className = 'textarea textarea-bordered w-full';
    textarea.style.minHeight = `${textareaHeight * 1.5}em`;
    textarea.value = fieldValue || '';
    if (field.placeholder) {
      textarea.placeholder = field.placeholder;
    }
    textarea.dataset.path = field.path;
    fieldContainer.appendChild(textarea);

    if (field.description) {
      const descriptionContainer = document.createElement('label');
      descriptionContainer.className = 'label';

      const descriptionText = document.createElement('span');
      descriptionText.className = 'wizard-description text-base-content';
      descriptionText.textContent = field.description;

      descriptionContainer.appendChild(descriptionText);
      fieldContainer.appendChild(descriptionContainer);
    }
  } else {
    fieldContainer.className = 'form-control w-full';

    const label = document.createElement('label');
    label.className = 'label';

    const labelText = document.createElement('span');
    labelText.className = 'label-text';
    labelText.textContent = field.label;

    label.appendChild(labelText);
    fieldContainer.appendChild(label);

    let fieldValue = getConfigValue(field.path);

    if (field.value !== undefined && !fieldValue) {
      fieldValue = field.value;
    }

    const input = document.createElement('input');
    input.type = field.isPassword ? 'password' : 'text';
    input.className = 'input input-bordered w-full';
    input.value = fieldValue || '';
    if (field.placeholder) {
      input.placeholder = field.placeholder;
    }
    input.dataset.path = field.path;

    fieldContainer.appendChild(input);

    if (field.description) {
      const descriptionContainer = document.createElement('label');
      descriptionContainer.className = 'label';

      const descriptionText = document.createElement('span');
      descriptionText.className = 'wizard-description text-base-content';
      descriptionText.textContent = field.description;

      descriptionContainer.appendChild(descriptionText);
      fieldContainer.appendChild(descriptionContainer);
    }
  }

  return fieldContainer;
}

function createFolderInputField(field) {
  const fieldContainer = document.createElement('div');
  fieldContainer.className = 'form-control w-full';

  const label = document.createElement('label');
  label.className = 'label';

  const labelText = document.createElement('span');
  labelText.className = 'label-text';
  labelText.textContent = field.label;

  label.appendChild(labelText);
  fieldContainer.appendChild(label);

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'relative w-full';

  let fieldValue = getConfigValue(field.path);

  if (field.value !== undefined && !fieldValue) {
    fieldValue = field.value;
  }

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'input input-bordered w-full pr-10';
  input.value = fieldValue || '';
  if (field.placeholder) {
    input.placeholder = field.placeholder;
  }
  input.dataset.path = field.path;

  const folderIcon = document.createElement('button');
  folderIcon.className =
    'absolute right-2 top-5 -translate-y-1/2 text-base-content/70 hover:text-accent transition-colors';
  folderIcon.innerHTML = '📁';
  folderIcon.style.cursor = 'pointer';
  folderIcon.style.zIndex = '10';
  folderIcon.title = `Browse for ${field.label}`;

  folderIcon.onclick = async (e) => {
    e.preventDefault();
    try {
      const { ipcRenderer } = require('electron');
      const result = await ipcRenderer.invoke('dialog:select-folder');

      if (!result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        input.value = folderPath;

        updateConfigValue(field.path, folderPath);
      }
    } catch (error) {
      log.error(`Failed to select folder for ${field.path}:`, error);
    }
  };

  inputWrapper.appendChild(input);
  inputWrapper.appendChild(folderIcon);

  fieldContainer.appendChild(inputWrapper);

  if (field.description) {
    const descriptionContainer = document.createElement('label');
    descriptionContainer.className = 'label';

    const descriptionText = document.createElement('span');
    descriptionText.className = 'wizard-description text-base-content';
    descriptionText.textContent = field.description;

    descriptionContainer.appendChild(descriptionText);
    fieldContainer.appendChild(descriptionContainer);
  }

  return fieldContainer;
}

// ==============================================
//               Helper Functions
// ==============================================

function getConfigValue(path) {
  if (!configData) return null;

  const parts = path.split('.');
  let value = configData;

  for (const part of parts) {
    value = value && value[part];
    if (value === undefined) break;
  }

  return value;
}

function updateConfigValue(path, value) {
  if (!configData) return;

  const parts = path.split('.');

  if (parts[0] === 'chatCommands' && parts.length === 2) {
    if (!configData.chatCommands) {
      configData.chatCommands = {};
    }

    const commandName = parts[1];

    configData.chatCommands[commandName] = value;
    log.ok(`Updated chat command: ${commandName} = ${JSON.stringify(value).substring(0, 100)}`);
    return;
  }

  let current = configData;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }

  if (path === 'hue.bulbIds' && typeof value === 'string') {
    value = value
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id !== '')
      .map((id) => parseInt(id, 10));
  }

  current[parts[parts.length - 1]] = value;
  log.ok(`Updated config: ${path} = ${JSON.stringify(value).substring(0, 100)}`);
}

function setupFieldListeners() {
  document.querySelectorAll('#wizardModal input[data-path]').forEach((input) => {
    const handler = () => {
      const path = input.dataset.path;
      const value = input.type === 'checkbox' ? input.checked : input.value;
      updateConfigValue(path, value);
    };

    input.removeEventListener('change', handler);
    input.removeEventListener('input', handler);

    input.addEventListener('change', handler);

    if (input.type !== 'checkbox') {
      input.addEventListener('input', handler);
    }
  });
}

function getApplicableSteps() {
  return setupSteps.filter((step) => {
    if (!step.showIf) return true;

    return step.showIf(configData);
  });
}

// ==============================================
//              Navigation Functions
// ==============================================

function goToPreviousStep() {
  if (currentStep > 0) {
    saveConfig(configData)
      .then(() => {
        log.ok(`Saved config after step ${currentStep + 1}`);

        currentStep--;

        const applicableSteps = getApplicableSteps();
        while (currentStep > 0 && !applicableSteps.includes(setupSteps[currentStep])) {
          currentStep--;
        }

        updateWizardContent();
      })
      .catch((error) => {
        log.error(`Error saving config during navigation: ${error.message}`);
        currentStep--;
        updateWizardContent();
      });
  }
}

function goToNextStep() {
  if (currentStep < setupSteps.length - 1) {
    try {
      delete require.cache[require.resolve('../config.js')];
      const freshConfig = require('../config.js');

      if (!configData.chatCommands && freshConfig.chatCommands) {
        configData.chatCommands = { ...freshConfig.chatCommands };
      }

      if (freshConfig.twitch) {
        if (freshConfig.twitch.oauth && !configData.twitch.oauth) {
          configData.twitch.oauth = freshConfig.twitch.oauth;
        }
        if (freshConfig.twitch.bearerToken && !configData.twitch.bearerToken) {
          configData.twitch.bearerToken = freshConfig.twitch.bearerToken;
        }
        if (freshConfig.twitch.refreshToken && !configData.twitch.refreshToken) {
          configData.twitch.refreshToken = freshConfig.twitch.refreshToken;
        }
      }
    } catch (error) {
      log.error('Error getting fresh config for OAuth tokens:', error.message);
    }

    saveConfig(configData)
      .then(() => {
        log.ok(`Saved config after step ${currentStep + 1}`);
        currentStep++;

        const applicableSteps = getApplicableSteps();
        while (
          currentStep < setupSteps.length - 1 &&
          !applicableSteps.includes(setupSteps[currentStep])
        ) {
          currentStep++;
        }

        updateWizardContent();
      })
      .catch((error) => {
        log.error(`Error saving config during navigation: ${error.message}`);
        currentStep++;
        updateWizardContent();
      });
  } else {
    completeSetup();
  }
}

function updateWizardContent() {
  if (modalElement) {
    const bodyElement = modalElement.querySelector('.markdown-body');
    const titleElement = modalElement.querySelector('.text-lg.font-bold');

    if (bodyElement && titleElement) {
      titleElement.textContent = setupSteps[currentStep].title;
      updateStepContent(bodyElement);
    }
  }
}

function completeSetup() {
  saveConfig(configData)
    .then(() => {
      log.ok('Final config saved, setup complete');

      if (modalElement && modalElement.parentNode) {
        modalElement.parentNode.removeChild(modalElement);
      }

      if (typeof onSetupComplete === 'function') {
        setTimeout(() => {
          window.location.reload();
        }, 1500);

        onSetupComplete();
      }
    })
    .catch((error) => {
      log.error('Error saving config during setup completion:', error);

      if (modalElement && modalElement.parentNode) {
        modalElement.parentNode.removeChild(modalElement);
      }

      if (typeof onSetupComplete === 'function') {
        setTimeout(() => {
          window.location.reload();
        }, 500);

        onSetupComplete(error);
      }
    });
}

// ==============================================
//                    Exports
// ==============================================

module.exports = {
  showSetupWizard,
};

// =============================================
//    renderer.js — Part 1: Core Setup + Modules
// =============================================

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');

const configPath = path.join(__dirname, '..', 'config.js');
const config = require(configPath);

const { ipcRenderer } = require('electron');

ipcRenderer.on('log', (event, { message, emoji, category }) => {
  const logBox = document.getElementById('logOutput');
  const emojiPrefix = emoji ? `${emoji} ` : '';
  const formatted = `${emojiPrefix}[${category}] ${message}\n`;

  if (logBox) {
    logBox.textContent += formatted;
    logBox.scrollTop = logBox.scrollHeight;
  }

  console.log(formatted.trim());
});

// 🧠 Core State
let botProcess = null;
let obsSocket = null;
let isOBSConnected = false;
let viewerInterval = null;
let testFlagsTimeout;

// 🧩 DOM Elements
const startBtn = document.getElementById('startBot');
const stopBtn = document.getElementById('stopBot');
const status = document.getElementById('status');
const logBox = document.getElementById('logOutput');
const viewerCount = document.getElementById('viewerCount');
const streamStatus = document.getElementById('streamStatus');
const manualCommandInput = document.getElementById('manualCommand');
const sendCommandBtn = document.getElementById('sendCommand');
const sourceToggleBtn = document.getElementById('toggleSource');
const bypassTwitchCheckbox = document.getElementById('bypassTwitch');
const simulateOBSCheckbox = document.getElementById('simulateOBS');
const simulateDiscordCheckbox = document.getElementById('simulateDiscord');

// 🧩 Module Toggles (Config-driven)
const moduleEnabled = {
    colorControl: config.modules?.colorControl !== false,
    soundEffects: config.modules?.soundEffects !== false,
    obsToggles: config.modules?.obsToggles !== false,
    chatLinks: config.modules?.chatLinks !==false,
    manualCommands: config.modules?.manualCommands !== false,
    clipWatcher: config.modules?.clipWatcher !== false,
    streamStats: config.modules?.streamStats !== false,
    testingMode: config.modules?.testingMode !== false
};

// =============================================
//     renderer.js — Part 2: Bot + Test Flags
// =============================================

function updateTestModeFlags() {
    if (!botProcess || !botProcess.stdin.writable) return;
    const bypass = bypassTwitchCheckbox?.checked;
    const simulate = simulateOBSCheckbox?.checked;
    const simulateDiscord = document.getElementById('simulateDiscord')?.checked;
    botProcess.stdin.write(`!testflags ${bypass} ${simulate} ${simulateDiscord}\n`);
}

document.getElementById('updateTestFlagsBtn')?.addEventListener('click', updateTestModeFlags);

function startBot() {
    if (botProcess) {
        status.textContent = 'Bot is already running!';
        return;
    }

    status.textContent = 'Starting bot...';
    logBox.textContent = '';

    const botPath = path.join(__dirname, '..', 'bot.js');
    const args = [botPath];

    if (moduleEnabled.testingMode && bypassTwitchCheckbox?.checked) args.push('--bypass-twitch');
    if (moduleEnabled.testingMode && simulateOBSCheckbox?.checked) args.push('--simulate-obs');
    if (moduleEnabled.testingMode && simulateDiscordCheckbox?.checked) args.push('--simulate-discord');

    botProcess = spawn('node', args);

    const log = (msg, isError = false) => {
        logBox.textContent += msg;
        logBox.scrollTop = logBox.scrollHeight;
    };

    botProcess.stdout.on('data', (data) => log(data.toString()));
    botProcess.stderr.on('data', (data) => log(data.toString(), true));

    botProcess.on('close', (code) => {
        log(`\n[BOT] Process exited with code ${code}\n`, true);
        status.textContent = 'Bot stopped.';
        botProcess = null;
        startBtn.disabled = false;
        stopBtn.disabled = true;
    });

    status.textContent = 'Bot is running.';
    setDashboardButtonsEnabled(true);
    startBtn.disabled = true;
    stopBtn.disabled = false;

    if (moduleEnabled.obsToggles || moduleEnabled.streamStats) connectToOBS();
    if (moduleEnabled.streamStats) startViewerPolling();
    if (moduleEnabled.soundEffects) loadSoundButtons();
    if (moduleEnabled.clipWatcher) startClipWatcher();
}

function stopBot() {
    if (botProcess) {
        status.textContent = 'Stopping bot...';
        botProcess.kill();
        setDashboardButtonsEnabled(false);
    } else {
        status.textContent = 'Bot is not running.';
        setDashboardButtonsEnabled(false);
    }

    if (moduleEnabled.streamStats) stopViewerPolling();
    if (moduleEnabled.obsToggles || moduleEnabled.streamStats) disconnectOBS();
    if (moduleEnabled.clipWatcher) stopClipWatcher();
}

startBtn.addEventListener('click', startBot);
stopBtn.addEventListener('click', stopBot);

// =============================================
//     renderer.js — Part 3: OBS + Stream Stats
// =============================================

function connectToOBS() {
    if (!moduleEnabled.obsToggles && !moduleEnabled.streamStats) return;
    if (isOBSConnected) return;

    try {
        obsSocket = new WebSocket(config.obs.websocketUrl);

        obsSocket.onopen = () => {
            isOBSConnected = true;
            console.log('[ OBS OK       ] Connected to OBS WebSocket');
        };

        obsSocket.onclose = () => {
            isOBSConnected = false;
            console.log('[ OBS WARN     ] Disconnected from OBS WebSocket');
        };

        obsSocket.onerror = err => {
            console.error('[ OBS ERROR    ] WebSocket Error:', err.message);
        };
    } catch (e) {
        console.error('[ OBS ERROR    ] Failed to connect:', e.message);
    }
}

function disconnectOBS() {
    if (obsSocket) {
        obsSocket.close();
        obsSocket = null;
        isOBSConnected = false;
    }
}

async function fetchViewerCount() {
    if (!moduleEnabled.streamStats) return;

    try {
        const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${config.twitch.channel}`, {
            headers: {
                'Client-ID': config.twitch.clientId,
                'Authorization': `Bearer ${config.twitch.bearerToken}`
            }
        });

        const data = await res.json();
        const stream = data.data?.[0];

        if (stream) {
            streamStatus.textContent = '🟢 Stream is LIVE';
            viewerCount.textContent = `Viewers: ${stream.viewer_count}`;
        } else {
            streamStatus.textContent = '🔴 Stream is OFFLINE';
            viewerCount.textContent = 'Viewers: 0';
        }
    } catch (err) {
        streamStatus.textContent = '⚠️ Failed to fetch';
        viewerCount.textContent = 'Error';
        console.error('[ TWITCH ERROR ] Viewer fetch error:', err.message);
    }
}

function startViewerPolling() {
    if (!moduleEnabled.streamStats) return;
    fetchViewerCount();
    viewerInterval = setInterval(fetchViewerCount, 30000);
}

function stopViewerPolling() {
    clearInterval(viewerInterval);
    viewerInterval = null;
}

sourceToggleBtn?.addEventListener('click', () => {
    if (!moduleEnabled.obsToggles) return;
    if (!isOBSConnected || !obsSocket || obsSocket.readyState !== WebSocket.OPEN) {
        console.warn('[ OBS WARN     ] Not connected');
        return;
    }

    const request = {
        op: 6,
        d: {
            requestType: "ToggleSourceVisibility",
            requestId: "toggle_" + Date.now(),
            requestData: {
                sceneName: config.obs.sceneName,
                sourceName: config.obs.sourceName
            }
        }
    };

    obsSocket.send(JSON.stringify(request));
});

// =============================================
//  renderer.js — Part 4: Sounds + Commands + UI
// =============================================

// 🎵 Load Sound Buttons (if enabled)
function loadSoundButtons() {
    const container = document.getElementById('soundButtons');
    if (!moduleEnabled.soundEffects || !container) return;

    container.innerHTML = '';

    const soundsDir = path.join(__dirname, '..', 'sounds');
    if (!fs.existsSync(soundsDir)) {
        console.warn('[ SOUND WARN   ] No sounds folder found');
        container.innerHTML = '<p style="color: #888;">No sound effects folder found.</p>';
        return;
    }

    const files = fs.readdirSync(soundsDir).filter(file => file.endsWith('.mp3'));
    if (files.length === 0) {
        container.innerHTML = '<p style="color: #888;">No MP3s found in the sounds folder.</p>';
        return;
    }

    files.sort();
    files.forEach(filename => {
        const soundName = filename.replace('.mp3', '');
        const button = document.createElement('button');
        button.textContent = soundName;
        button.className = 'btn btn-outline btn-sm';
        button.addEventListener('click', () => {
            sendCommand(`!${soundName}`);
        });
        container.appendChild(button);
    });

    if (botProcess === null) setDashboardButtonsEnabled(false);
}

// ✍️ Manual Command Input
sendCommandBtn?.addEventListener('click', () => {
    if (!moduleEnabled.manualCommands) return;
    const command = manualCommandInput?.value?.trim();
    if (!command || !botProcess) return;

    botProcess.stdin.write(command + '\n');
    manualCommandInput.value = '';
});

// 🧠 Send command helper
function sendCommand(command) {
    if (botProcess && botProcess.stdin.writable) {
        botProcess.stdin.write(command + '\n');
        console.log('[ GUI ACTION   ] Sent command:', command);
    } else {
        console.warn('[ GUI WARN     ] Bot is not running. Command ignored:', command);
    }
}
window.sendCommand = sendCommand;

// 🧪 OBS Toggle Shortcut (e.g., !catcam)
const toggleObsButton = document.getElementById('toggleObs');
if (toggleObsButton && moduleEnabled.obsToggles && config.obs.sourceName) {
    toggleObsButton.textContent = `Toggle ${config.obs.sourceName}`;
    toggleObsButton.addEventListener('click', () => {
        sendCommand('!catcam');
    });
}

// 🖱 Enable / Disable buttons
function setDashboardButtonsEnabled(enabled) {
    const buttons = document.querySelectorAll(
        '#dashboardTab button:not(#startBot):not(#stopBot):not(#refreshSoundsBtn)'
    );
    buttons.forEach(btn => {
        btn.style.opacity = enabled ? '1' : '0.5';
        btn.style.pointerEvents = enabled ? 'auto' : 'none';
        btn.style.cursor = enabled ? 'pointer' : 'default';
    });

    const manualInput = document.getElementById('manualCommand');
    if (manualInput) {
        manualInput.style.opacity = enabled ? '1' : '0.5';
        manualInput.style.pointerEvents = enabled ? 'auto' : 'none';
        manualInput.style.cursor = enabled ? 'text' : 'default';
    }
}

// =============================================
//  renderer.js — Part 5: Test Flags + Config UI
// =============================================

// 🐞 Debug Flag Checkboxes
function renderDebugFlags() {
    const container = document.getElementById('debugFlags');
    container.innerHTML = '';

    if (!config.debug) {
        container.textContent = 'No debug settings found.';
        return;
    }

    for (const key in config.debug) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = config.debug[key];
        checkbox.onchange = () => {
            config.debug[key] = checkbox.checked;
        };

        const label = document.createElement('label');
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + key));
        label.style.display = 'block';
        container.appendChild(label);
    }
}

// 🧩 Config + Module Toggle Renderer
function createSection(title, helpText = '', fields = [], moduleKey = null) {
    const container = document.getElementById('configForm');

    const section = document.createElement('div');
    section.className = 'border border-base-300 p-4 rounded-lg space-y-2 bg-base-200';

    const headerRow = document.createElement('div');
    headerRow.className = 'flex items-center justify-between';

    const titleEl = document.createElement('h3');
    titleEl.className = 'text-lg font-bold text-accent';
    titleEl.textContent = title;

    headerRow.appendChild(titleEl);

    section.appendChild(headerRow);

    if (helpText) {
        const help = document.createElement('p');
        help.className = 'text-sm text-base-content/60';
        help.textContent = helpText;
        section.appendChild(help);
    }

    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'space-y-2';

    // Module toggle (if applicable)
    if (moduleKey) {
        const toggleWrapper = document.createElement('label');
        toggleWrapper.className = 'flex items-center gap-2';

        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.className = 'toggle toggle-success';
        toggle.checked = config.modules?.[moduleKey] !== false;

        toggle.onchange = () => {
            config.modules = config.modules || {};
            config.modules[moduleKey] = toggle.checked;
        
            // Enable/Disable fields in the Config UI
            fieldGroup.querySelectorAll('input, textarea').forEach(el => {
                el.disabled = !toggle.checked;
            });
            fieldGroup.classList.toggle('opacity-50', !toggle.checked);
            fieldGroup.classList.toggle('pointer-events-none', !toggle.checked);
        
            // Show/hide module section in Dashboard
            const dashboardSection = document.querySelector(`[data-module="${moduleKey}"]`);
            if (dashboardSection) {
                dashboardSection.style.display = toggle.checked ? '' : 'none';
            }
        
            saveConfig();
        };        

        toggleWrapper.appendChild(toggle);
        toggleWrapper.appendChild(document.createTextNode('Enable'));
        headerRow.appendChild(toggleWrapper);
    }


    fields.forEach(field => {
        const wrapper = document.createElement('div');
        wrapper.className = 'space-y-1';

        const label = document.createElement('label');
        label.className = 'block text-sm font-medium';
        label.textContent = field.label;
        wrapper.appendChild(label);

        let input;
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.className = 'textarea textarea-bordered w-full';
            input.rows = 4;
            input.value = field.value;
        } else if (field.type === 'checkbox') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'checkbox checkbox-accent';
            input.checked = field.value;
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'input input-bordered w-full';
            input.value = field.value;
        }

        input.onchange = (e) => {
            if (field.type === 'checkbox') {
                field.onChange(e.target.checked);
                saveConfig();
            } else {
                field.onChange(e.target.value);
                debouncedSaveConfig();
            }
        };

        wrapper.appendChild(input);
        fieldGroup.appendChild(wrapper);
    });

    section.appendChild(fieldGroup);
    container.appendChild(section);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const bgClass = type === 'error' ? 'alert-error' : 'alert-success';

    const el = document.createElement('div');
    el.className = `alert ${bgClass} shadow-lg`;
    el.innerHTML = `<span>${message}</span>`;

    toast.appendChild(el);

    setTimeout(() => {
        el.remove();
    }, 3000); // Toast disappears after 3 seconds
}

// 💾 Save Config to config.js
function debounce(fn, delay = 500) {
	let timeout;
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), delay);
	};
}

const debouncedSaveConfig = debounce(saveConfig, 500);

function saveConfig() {
    const configString = 'module.exports = ' + JSON.stringify(config, null, 2) + ';';
    fs.writeFile(configPath, configString, (err) => {
        if (err) {
            console.error(err);
            showToast('❌ Failed to save config.js', 'error');
        } else {
            showToast('✅ Saved config.js successfully!', 'success');
        }
    });
}

function refreshDashboard() {
    if (moduleEnabled.soundEffects) loadSoundButtons();
    setDashboardButtonsEnabled(botProcess !== null);
}

function renderFullConfig() {
    const container = document.getElementById('configForm');
    container.innerHTML = '';

    // 🟣 TWITCH CHAT
    createSection('Twitch Chat', 'Allows the bot to send messages in Twitch Chat', [
        {
            label: 'Bot Username:',
            value: config.twitch.username,
            onChange: v => (config.twitch.username = v)
        },
        {
            label: 'Bot OAuth:',
            value: config.twitch.oauth,
            onChange: v => (config.twitch.oauth = v)
        },
        {
            label: 'Bot ClientID:',
            value: config.twitch.clientId,
            onChange: v => (config.twitch.clientId = v)
        },
        {
            label: 'Bot Bearer Token:',
            value: config.twitch.bearerToken,
            onChange: v => (config.twitch.bearerToken = v)
        },
        {
            label: 'User Channel:',
            value: config.twitch.channel,
            onChange: v => (config.twitch.channel = v)
        },
        {
            label: 'User Nickname:',
            value: config.twitch.streamerName,
            onChange: v => (config.twitch.streamerName = v)
        }
    ]);

    // 🟡 COLOR CONTROL
    createSection('Color Control', 'Allows Hue lights to be controlled from the Dashboard and via Twitch Chat', [
        {
            label: 'Hue Bridge IP:',
            value: config.hue.bridgeIp,
            onChange: v => (config.hue.bridgeIp = v)
        },
        {
            label: 'Hue API Key:',
            value: config.hue.apiKey,
            onChange: v => (config.hue.apiKey = v)
        },
        {
            label: 'Hue Bulb ID(s):',
            value: config.hue.bulbIds.join(','),
            onChange: v => (config.hue.bulbIds = v.split(',').map(id => parseInt(id.trim())).filter(n => !isNaN(n)))
        }
    ], 'colorControl');

    // 🔊 SOUND EFFECTS
    createSection('Sound Effects', 'Allows the bot to play sound effects via VLC Player from the Dashboard and Twitch Chat', [
        {
            label: 'Sound Effects Folder:',
            value: config.clipFolder,
            onChange: v => (config.clipFolder = v)
        }
    ], 'soundEffects');

    // 🎥 OBS TOGGLES
    createSection('OBS Toggles', 'Allows the bot to toggle OBS Sources from the Dashboard and Twitch Chat', [
        {
            label: 'OBS WebSocket URL:',
            value: config.obs.websocketUrl,
            onChange: v => (config.obs.websocketUrl = v)
        },
        {
            label: 'OBS Scene Name:',
            value: config.obs.sceneName,
            onChange: v => (config.obs.sceneName = v)
        },
        {
            label: 'OBS Source Name:',
            value: config.obs.sourceName,
            onChange: v => (config.obs.sourceName = v)
        }
    ], 'obsSourceToggles');

    // 🔗 CHAT LINKS
    createSection('Chat Links', 'Allows the bot to respond to some common commands in Twitch Chat', [
        {
            label: 'Command List URL (!commands):',
            value: config.links.commandsUrl,
            onChange: v => (config.links.commandsUrl = v)
        },
        {
            label: 'Public Discord Invite Link (!discord):',
            value: config.links.discordInvite,
            onChange: v => (config.links.discordInvite = v)
        },
        {
            label: 'Social Media Link(s) (!socials):',
            value: config.links.socialLinks.join('\n'),
            onChange: v => {
                config.links.socialLinks = v.split('\n').map(s => s.trim()).filter(Boolean);
            },
            type: 'textarea'
        }
    ], 'chatLinks');

    // ⌨️ MANUAL COMMANDS
    createSection('Manual Commands', 'Allows manual commands to be sent from the Dashboard', [], 'manualCommands');

    // 📎 CLIP WATCHER
    createSection('Clip Watcher', 'Allows the bot to auto-post locally saved clips to Discord', [
        {
            label: 'Clips Folder:',
            value: config.clipFolder,
            onChange: v => (config.clipFolder = v)
        },
        {
            label: 'Discord Webhook URL:',
            value: config.discordWebhookUrl,
            onChange: v => (config.discordWebhookUrl = v)
        },
        {
            label: 'Maximum File Size (Mb):',
            value: config.maxFileSizeMb,
            onChange: v => (config.maxFileSizeMb = Number(v))
        },
        {
            label: 'Game List:',
            value: Object.entries(config.knownGames).map(([k, v]) => `${k}=${v}`).join('\n'),
            onChange: v => {
                config.knownGames = {};
                v.split('\n').forEach(line => {
                    const [key, val] = line.split('=').map(x => x.trim());
                    if (key && val) config.knownGames[key] = val;
                });
            },
            type: 'textarea'
        },
        {
            label: 'Delete Original Clip After Posting:',
            value: config.deleteOriginalAfterPost,
            onChange: v => (config.deleteOriginalAfterPost = v),
            type: 'checkbox'
        },
        {
            label: 'Delete Compressed Clip After Posting:',
            value: config.deleteCompressedAfterPost,
            onChange: v => (config.deleteCompressedAfterPost = v),
            type: 'checkbox'
        }
    ], 'clipWatcher');

    // 📡 STREAM STATS
    createSection('Stream Stats', 'Displays live stream stats on the dashboard', [], 'streamStats');

    // 🧪 TESTING MODE
    createSection('Testing Mode', 'Allows for bot testing via simulated connections to Twitch, OBS, and Discord', [], 'testingMode');

    // =============================================
    //     renderer.js — Part 6: UI Helpers + Init
    // =============================================

    // 🧼 Enable/Disable dashboard buttons
    function setDashboardButtonsEnabled(enabled) {
        const buttons = document.querySelectorAll(
            '#dashboardTab button:not(#startBot):not(#stopBot):not(#refreshSoundsBtn)'
        );

        buttons.forEach(btn => {
            btn.style.opacity = enabled ? '1' : '0.5';
            btn.style.pointerEvents = enabled ? 'auto' : 'none';
            btn.style.cursor = enabled ? 'pointer' : 'default';
        });

        const manualInput = document.getElementById('manualCommand');
        const sendBtn = document.getElementById('sendCommand');
        if (manualInput) {
            manualInput.style.opacity = enabled ? '1' : '0.5';
            manualInput.style.pointerEvents = enabled ? 'auto' : 'none';
            manualInput.style.cursor = enabled ? 'text' : 'default';
        }
        if (sendBtn) {
            sendBtn.style.opacity = enabled ? '1' : '0.5';
            sendBtn.style.pointerEvents = enabled ? 'auto' : 'none';
            sendBtn.style.cursor = enabled ? 'pointer' : 'default';
        }
    }
}

// 🧭 Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.tabContent').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('tab-active'));

    document.getElementById(`${tabName}Tab`)?.classList.remove('hidden');
    document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`)?.classList.add('tab-active');

    if (tabName === 'dashboard') {
        refreshDashboard();
    } else if (tabName === 'config') {
        renderFullConfig();
    } else if (tabName === 'debug') {
        renderDebugFlags();
    }
}

window.switchTab = switchTab;

// ✅ Run default tab on DOM load
document.addEventListener('DOMContentLoaded', () => {
    switchTab('dashboard'); // or whichever you want to default to
    // ✅ Attach save button listeners only once
    document.getElementById('saveDebugConfig')?.addEventListener('click', saveConfig);
    document.getElementById('saveFullConfig')?.addEventListener('click', saveConfig);
});

// 🧠 Manual command sender
function sendCommand(command) {
    if (botProcess && botProcess.stdin.writable) {
        botProcess.stdin.write(command + '\n');
        console.log('[ GUI ACTION   ] Sent command:', command);
    } else {
        console.warn('[ GUI WARN     ] Bot is not running. Command ignored:', command);
    }
}
window.sendCommand = sendCommand;

// 🐣 Auto-init state on load
setDashboardButtonsEnabled(false);
if (config.obs?.sourceName) {
    const toggleOBSButton = document.getElementById('toggleObs');
    if (toggleOBSButton) toggleOBSButton.textContent = `Toggle ${config.obs.sourceName}`;
}

// Hiding Disabled Modules in the dashboard
function hideDisabledModules() {
    for (const mod in moduleEnabled) {
        if (moduleEnabled[mod] === false) {
            const el = document.querySelector(`[data-module="${mod}"]`);
            if (el) el.style.display = 'none';
            console.log(`[ MODULE HIDE  ] Disabled module hidden: ${mod}`);
        }
    }
}

// Reordering Modules
function reorderModules() {
	const grid = document.getElementById('dashboardGrid');
	if (!grid || !Array.isArray(config.modulesOrder)) return;

	config.modulesOrder.forEach(moduleKey => {
		const el = document.querySelector(`[data-module="${moduleKey}"]`);
		if (el) grid.appendChild(el); // Moves to the end in the desired order
	});
}

setDashboardButtonsEnabled(false);
hideDisabledModules();
reorderModules();

// =============================================
//    renderer.js — Part 7: Dynamic Dashboard Renderer
// =============================================

function renderDashboardModules() {
	const grid = document.getElementById('dashboardGrid');
	if (!grid) return;

	// Clear all previous module sections (except bot control)
	[...grid.children].forEach(child => {
		if (!child.id && child.querySelector('button#startBot')) return; // Keep Bot Control
		if (child.dataset && child.dataset.module) grid.removeChild(child);
	});

	config.modulesOrder?.forEach(moduleKey => {
		if (config.modules?.[moduleKey] === false) return;
		const section = document.querySelector(`[data-module="${moduleKey}"]`);
		if (section) grid.appendChild(section);
	});
}

const folderSpan = document.getElementById('clipFolderDisplay');
if (folderSpan && config.clipFolder) {
  folderSpan.textContent = config.clipFolder;
}

const restartBtn = document.getElementById('restartClipWatcherBtn');
if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    window.sendCommand('!restartclipwatcher');
  });
}

// Call it on DOM load and dashboard tab switch
if (document.readyState === 'complete' || document.readyState === 'interactive') {
	setTimeout(() => {
		renderDashboardModules();
		renderReorderUI();
	}, 0);
} else {
	document.addEventListener('DOMContentLoaded', () => {
		setTimeout(() => {
			renderDashboardModules();
			renderReorderUI();
		}, 0);
	});
}

// Replace old hideDisabledModules with renderDashboardModules
function refreshDashboard() {
	if (moduleEnabled.soundEffects) loadSoundButtons();
	setDashboardButtonsEnabled(botProcess !== null);
	renderDashboardModules();
}

// =============================================
//    renderer.js — Part 8: Config Module Reorder UI
// =============================================

function renderReorderUI() {
	const container = document.getElementById('configForm');
	if (!container) return;

	const section = document.createElement('div');
	section.className = 'border border-base-300 p-4 rounded-lg space-y-4 bg-base-200';

	const title = document.createElement('h3');
	title.className = 'text-lg font-bold text-accent';
	title.textContent = '🧩 Module Order';
	section.appendChild(title);

	const help = document.createElement('p');
	help.className = 'text-sm text-base-content/60';
	help.textContent = 'Drag and drop modules to reorder them on the Dashboard';
	section.appendChild(help);

	const list = document.createElement('ul');
	list.id = 'moduleReorderList';
	list.className = 'space-y-2';

	(config.modulesOrder || []).forEach(mod => {
		const li = document.createElement('li');
		li.className = 'p-2 rounded-md bg-base-100 shadow cursor-move';
		li.draggable = true;
		li.dataset.moduleKey = mod;
		li.textContent = mod;
		list.appendChild(li);
	});

	section.appendChild(list);
	container.appendChild(section);

	addDragDropHandlers(list);
}

function addDragDropHandlers(list) {
	let dragged;

	list.querySelectorAll('li').forEach(item => {
		item.addEventListener('dragstart', e => {
			dragged = e.target;
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/html', e.target.innerHTML);
		});

		item.addEventListener('dragover', e => {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
		});

		item.addEventListener('drop', e => {
			e.preventDefault();
			if (dragged !== e.target) {
				const parent = dragged.parentNode;
				const items = Array.from(parent.children);
				const draggedIndex = items.indexOf(dragged);
				const targetIndex = items.indexOf(e.target);
				if (draggedIndex < targetIndex) {
					parent.insertBefore(dragged, e.target.nextSibling);
				} else {
					parent.insertBefore(dragged, e.target);
				}
				config.modulesOrder = Array.from(parent.children).map(li => li.dataset.moduleKey);
				saveConfig();
				renderDashboardModules();
			}
		});
	});
}

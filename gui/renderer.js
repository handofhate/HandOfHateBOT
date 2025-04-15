const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');

const configPath = path.join(__dirname, '..', 'config.js');
const config = require(configPath);

let botProcess = null;
let obsSocket = null;
let isOBSConnected = false;
let viewerInterval = null;

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

let testFlagsTimeout;

function updateTestModeFlags() {
    if (!botProcess || !botProcess.stdin.writable) return;
    const bypassTwitch = bypassTwitchCheckbox.checked;
    const simulateOBS = simulateOBSCheckbox.checked;
    botProcess.stdin.write(`!testflags ${bypassTwitch} ${simulateOBS}\n`);
}

document.getElementById('updateTestFlagsBtn').addEventListener('click', updateTestModeFlags);

const friendlyLabels = {
    twitch: {
        username: {
            label: 'Twitch Bot Username',
            help: 'The Twitch username for your bot account (no @, all lowercase)'
        },
        oauth: {
            label: 'Twitch OAuth Token',
            help: 'Generate one at https://twitchapps.com/tmi/ and paste it here (starts with "oauth:")'
        },
        clientId: {
            label: 'Twitch Client ID',
            help: 'Found in your Twitch Developer Portal under Applications'
        },
        bearerToken: {
            label: 'Twitch Bearer Token',
            help: 'An App Access Token from your Twitch Developer Application'
        },
        channel: {
            label: 'Twitch Channel Name',
            help: 'Your main Twitch channel (lowercase, no @)'
        },
        streamerName: {
            label: 'Streamer Display Name',
            help: 'How the bot refers to you (e.g., used in uptime responses)'
        }
    },
    hue: {
        bridgeIp: {
            label: 'Hue Bridge IP Address',
            help: 'Local IP address of your Philips Hue Bridge (found in Hue app or router)'
        },
        apiKey: {
            label: 'Hue API Key',
            help: 'Create a user via Hue Developer API to get this key'
        },
        bulbIds: {
            label: 'Bulb IDs',
            help: 'Comma-separated list of Hue bulb IDs to control (e.g., 24,25,26,27)'
        }
    },
    obs: {
        websocketUrl: {
            label: 'OBS WebSocket URL',
            help: 'Usually ws://127.0.0.1:4455 unless you changed it'
        },
        sceneName: {
            label: 'OBS Scene Name',
            help: 'Scene in OBS where your source lives (case-sensitive)'
        },
        sourceName: {
            label: 'OBS Source Name',
            help: 'Source to toggle, like "CatCam" or "Alerts" (case-sensitive)'
        }
    },
    links: {
        commandsUrl: {
            label: 'Commands Page URL',
            help: 'Link to a full list of your Twitch bot commands'
        },
        discordInvite: {
            label: 'Discord Invite Link',
            help: 'Your public Discord invite (e.g., discord.gg/xyz)'
        },
        socialLinks: {
            label: 'Social Media Links',
            help: 'One link or message per line. Shown when users type !socials'
        }
    }
};

// ========== Tab Switching ==========
function switchTab(tabName) {
    document.getElementById('dashboardTab').style.display = 'none';
    document.getElementById('logsTab').style.display = 'none';
    document.getElementById('debugTab').style.display = 'none';
    document.getElementById('configTab').style.display = 'none';

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    document.getElementById(`${tabName}Tab`).style.display = 'block';
    document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`)?.classList.add('active');
}
window.switchTab = switchTab;

// ========== Load Sound Buttons ==========

function loadSoundButtons() {
    const container = document.getElementById('soundButtons');
    if (!container) return;

    container.innerHTML = ''; // Clear previous buttons to prevent duplicates

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

    files.sort(); // optional but nice

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

    // Add this line at the end of loadSoundButtons()
    if (botProcess === null) setDashboardButtonsEnabled(false);
}

// ========== Start Bot ==========
startBtn.addEventListener('click', () => {
    if (botProcess) {
        status.textContent = 'Bot is already running!';
        return;
    }

    status.textContent = 'Starting bot...';
    logBox.textContent = '';

    const botPath = path.join(__dirname, '..', 'bot.js');
    const botArgs = [];

    if (bypassTwitchCheckbox?.checked) botArgs.push('--bypass-twitch');
    if (simulateOBSCheckbox?.checked) botArgs.push('--simulate-obs');

    const args = [botPath];

    // Check the test mode checkboxes
    const bypassTwitch = document.getElementById('bypassTwitch')?.checked;
    const simulateOBS = document.getElementById('simulateOBS')?.checked;

    if (bypassTwitch) args.push('--bypass-twitch');
    if (simulateOBS) args.push('--simulate-obs');

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

    connectToOBS();
    startViewerPolling();
    loadSoundButtons();
});

// ========== Stop Bot ==========
stopBtn.addEventListener('click', () => {
    if (botProcess) {
        status.textContent = 'Stopping bot...';
        botProcess.kill();
        setDashboardButtonsEnabled(false);
    } else {
        status.textContent = 'Bot is not running.';
        setDashboardButtonsEnabled(false);
    }

    stopViewerPolling();
    disconnectOBS();
});

// ========== OBS Connection ==========
function connectToOBS() {
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

// ========== Toggle OBS Source ==========
sourceToggleBtn?.addEventListener('click', () => {
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

// ========== Viewer Count Fetch ==========
async function fetchViewerCount() {
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
    fetchViewerCount();
    viewerInterval = setInterval(fetchViewerCount, 30000);
}

function stopViewerPolling() {
    clearInterval(viewerInterval);
    viewerInterval = null;
}

// ========== Send Manual Chat Command ==========
sendCommandBtn?.addEventListener('click', () => {
    const command = manualCommandInput?.value?.trim();
    if (!command || !botProcess) return;

    botProcess.stdin.write(command + '\n');
    manualCommandInput.value = '';
});

// ========== Full Config Renderer ==========
function renderFullConfig() {
    const container = document.getElementById('configForm');
    container.innerHTML = '';

    const skipKeys = ['debug'];

    function prettifySectionName(key) {
        const map = {
            twitch: 'Twitch Settings',
            hue: 'Philips Hue Settings',
            obs: 'OBS Settings',
            links: 'Command Links & Socials'
        };
        return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }

    const renderSection = (obj, sectionKey) => {
        const section = document.createElement('div');
        section.className = 'config-section';

        const title = document.createElement('h3');
        title.textContent = prettifySectionName(sectionKey);
        section.appendChild(title);

        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const labelText = friendlyLabels?.[sectionKey]?.[key]?.label || key;
            const helpText = friendlyLabels?.[sectionKey]?.[key]?.help || '';

            if (typeof value === 'object' && !Array.isArray(value)) {
                section.appendChild(renderSection(value, `${sectionKey}.${key}`));
            } else if (Array.isArray(value) && key !== 'bulbIds') {
                const wrapper = document.createElement('div');
                wrapper.className = 'config-input';

                const label = document.createElement('label');
                label.textContent = labelText;

                const textarea = document.createElement('textarea');
                textarea.value = value.join('\n');
                textarea.style.width = '60%';
                textarea.style.overflowY = 'hidden';
                textarea.style.resize = 'none';
                textarea.rows = value.length || 4;
                textarea.style.minHeight = '80px';

                const autoResize = () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 6 + 'px';
                };

                textarea.addEventListener('input', () => {
                    autoResize();
                    obj[key] = textarea.value
                        .split('\n')
                        .map(line => line.trim())
                        .filter(Boolean);
                });

                requestAnimationFrame(autoResize);

                label.appendChild(document.createElement('br'));
                label.appendChild(textarea);
                wrapper.appendChild(label);

                if (helpText) {
                    const help = document.createElement('small');
                    help.textContent = helpText;
                    help.className = 'config-help';
                    wrapper.appendChild(help);
                }

                section.appendChild(wrapper);
            } else if (key === 'bulbIds') {
                const wrapper = document.createElement('div');
                wrapper.className = 'config-input';

                const label = document.createElement('label');
                label.textContent = labelText;

                const input = document.createElement('input');
                input.type = 'text';
                input.value = value.join(',');
                input.style.width = '60%';
                input.addEventListener('change', e => {
                    obj[key] = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                });

                label.appendChild(document.createElement('br'));
                label.appendChild(input);
                wrapper.appendChild(label);

                if (helpText) {
                    const help = document.createElement('small');
                    help.textContent = helpText;
                    help.className = 'config-help';
                    wrapper.appendChild(help);
                }

                section.appendChild(wrapper);
            } else {
                const wrapper = document.createElement('div');
                wrapper.className = 'config-input';

                const label = document.createElement('label');
                label.textContent = labelText;

                const input = document.createElement('input');
                input.type = 'text';
                input.value = value;
                input.style.width = '60%';
                input.addEventListener('change', e => {
                    obj[key] = (!isNaN(value) && value !== '') ? Number(e.target.value) : e.target.value;
                });

                label.appendChild(document.createElement('br'));
                label.appendChild(input);
                wrapper.appendChild(label);

                if (helpText) {
                    const help = document.createElement('small');
                    help.textContent = helpText;
                    help.className = 'config-help';
                    wrapper.appendChild(help);
                }

                section.appendChild(wrapper);
            }
        });

        return section;
    };

    Object.keys(config).forEach(topKey => {
        if (!skipKeys.includes(topKey)) {
            const section = renderSection(config[topKey], topKey);
            container.appendChild(section);
        }
    });
}

// ========== Dashboard Button Event Listeners ==========

// Color change buttons
document.querySelectorAll('[data-color]').forEach(button => {
    button.addEventListener('click', () => {
        const color = button.getAttribute('data-color');
        sendCommand(`!${color}`);
    });
});

// Sound effect buttons
document.querySelectorAll('[data-sound]').forEach(button => {
    button.addEventListener('click', () => {
        const sound = button.getAttribute('data-sound');
        sendCommand(`!${sound}`);
    });
});

// Toggle OBS Source
const toggleObsButton = document.getElementById('toggleObs');
if (toggleObsButton) {
    toggleObsButton.addEventListener('click', () => {
        sendCommand('!catcam');
    });
}

// Send manual command from input field
const sendCommandButton = document.getElementById('sendCommand');
const commandInput = document.getElementById('manualCommand');
if (sendCommandButton && commandInput) {
    sendCommandButton.addEventListener('click', () => {
        const command = commandInput.value.trim();
        if (command) {
            sendCommand(command);
            commandInput.value = '';
        }
    });
}

// ========== Debug Flags Renderer ==========
function renderDebugFlags() {
    const flagsContainer = document.getElementById('debugFlags');
    flagsContainer.innerHTML = '';

    if (!config.debug) {
        console.warn('[ SYSTEM WARN  ] Debug config not found in config.js');
        flagsContainer.textContent = 'No debug settings found in config.js.';
        return;
    }

    Object.keys(config.debug).forEach((flag) => {
        const value = config.debug[flag];

        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '8px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = value;
        checkbox.addEventListener('change', () => {
            config.debug[flag] = checkbox.checked;
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${flag}`));
        flagsContainer.appendChild(label);
    });
}

// ========== Save Config ==========
function saveConfig() {
    const configString = 'module.exports = ' + JSON.stringify(config, null, 2) + ';';
    fs.writeFile(configPath, configString, (err) => {
        if (err) {
            alert('Failed to save config.js');
            console.error(err);
        } else {
            alert('Saved config.js successfully!');
        }
    });
}

// Send command to bot process (via stdin)
function sendCommand(command) {
    if (botProcess && botProcess.stdin.writable) {
        botProcess.stdin.write(command + '\n');
        console.log('[ GUI ACTION   ] Sent command:', command);
    } else {
        console.warn('[ GUI WARN     ] Bot is not running. Command ignored:', command);
    }
}
window.sendCommand = sendCommand;

// ========== Init ==========
document.getElementById('saveDebugConfig').addEventListener('click', saveConfig);
document.getElementById('saveFullConfig').addEventListener('click', saveConfig);

renderDebugFlags();
renderFullConfig();
loadSoundButtons(); // populate sound buttons on GUI load

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
    const sendBtn = document.querySelector('#dashboardTab button[onclick="handleSendClick()"]');
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

// Disable dashboard buttons on load
setDashboardButtonsEnabled(false);

// Set toggle source button label dynamically
const toggleOBSButton = document.getElementById('toggleObs');
if (toggleOBSButton && config.obs.sourceName) {
    toggleOBSButton.textContent = `Toggle ${config.obs.sourceName}`;
}
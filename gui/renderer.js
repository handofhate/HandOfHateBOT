const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const configPath = path.join(__dirname, '..', 'config.js');
const config = require(configPath);

let botProcess = null;

const startBtn = document.getElementById('startBot');
const stopBtn = document.getElementById('stopBot');
const status = document.getElementById('status');
const logBox = document.getElementById('logOutput');

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

// ========== Start Bot ==========
startBtn.addEventListener('click', () => {
    if (botProcess) {
        status.textContent = 'Bot is already running!';
        return;
    }

    status.textContent = 'Starting bot...';
    logBox.textContent = '';

    const botPath = path.join(__dirname, '..', 'bot.js');
    botProcess = spawn('node', [botPath]);

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
    startBtn.disabled = true;
    stopBtn.disabled = false;
});

// ========== Stop Bot ==========
stopBtn.addEventListener('click', () => {
    if (botProcess) {
        status.textContent = 'Stopping bot...';
        botProcess.kill();
    } else {
        status.textContent = 'Bot is not running.';
    }
});

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

// ========== Debug Flags Renderer ==========
function renderDebugFlags() {
    const flagsContainer = document.getElementById('debugFlags');
    flagsContainer.innerHTML = '';

    if (!config.debug) {
        console.warn('Debug config not found in config.js');
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
                textarea.style.minHeight = '80px'; // ✅ Minimum height regardless of scrollHeight

                const autoResize = () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 6 + 'px'; // Add a lil breathing room
                };

                // Handle input
                textarea.addEventListener('input', () => {
                    autoResize();
                    obj[key] = textarea.value
                        .split('\n')
                        .map(line => line.trim())
                        .filter(Boolean);
                });

                // Resize after DOM is ready
                window.requestAnimationFrame(() => autoResize());

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

document.getElementById('saveDebugConfig').addEventListener('click', saveConfig);
document.getElementById('saveFullConfig').addEventListener('click', saveConfig);

// ========== Init ==========
renderDebugFlags();
renderFullConfig();

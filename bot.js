// =============================================
// 		Available Commands
// =============================================

// !red - Changes color to red
// !green - Changes color to green
// !blue - Changes color to blue
// !yellow - Changes color to yellow
// !purple - Changes color to purple
// !cyan - Changes color to cyan
// !magenta - Changes color to magenta
// !orange - Changes color to orange
// !pink - Changes color to pink
// !white - Changes color to white (lights on)
// !black - Changes color to black (lights off)
// !randomcolor - Changes to a random color
// !color (hueValue) - Change color to a custom hue (value between 0 and 65535)
// !randomsound - Plays a random sound from the "sounds" folder
// !(soundName) - Plays a specific sound (name of the MP3 file without extension)
// !commands - 📋 View a complete list of available commands: ---> commands.handofhate.com
// !discord - 👥 Join the Hand of Hate Discord: ---> discord.gg/fzjCEcsVns
// !drops - 🎁 Drops are enabled here! Information: ---> twitch.tv/drops
// !socials - 📲 Follow me on social media:
//            📸 Instagram: ---> instagram.com/handofhate
//            📘 Facebook: ---> facebook.com/handofhate
//            🎵 TikTok: ---> tiktok.com/@handofhate
// !lurk - 🫥 $(user) is lurking in the shadows — silent, watching, and waiting.
// !hug - 🫂 $(user) hugs $(target) until $(target) can feel something again.
// !subscribers - ⭐ Displays the current channel subscriber count
// !uptime - 🕒 Displays how long the current stream has been live
// !(sourceName) - 🐱 Toggles a source in OBS for 10 seconds (as defined in config.js)
// !version - Displays the current version of the HandOfHateBot


// =============================================
// 		 Required Modules
// =============================================

const tmi = require('tmi.js');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const player = require('play-sound')();
const path = require('path');
const loadConfig = require('./utils/loadConfig');
const config = loadConfig();

console.log('[ BOT CONFIG  ] Loaded config for:', config.twitch?.username);

const chokidar = require('chokidar');
const { execFile } = require('child_process');
const FormData = require('form-data');
const psList = require('ps-list').default;

const args = process.argv.slice(2);
let BYPASS_TWITCH = args.includes('--Simulate-twitch');
let SIMULATE_OBS = args.includes('--simulate-obs');
let SIMULATE_DISCORD = args.includes('--simulate-discord');
let clipWatcher = {
    watcher: null,
    config: {},
    isEnabled: false
};

if (BYPASS_TWITCH) {
    console.log('[ TWITCH TEST  ] Simulating Twitch connection');
}
if (SIMULATE_OBS) {
    console.log('[ OBS TEST     ] Simulating OBS WebSocket');
}

const OBSWebSocket = require('obs-websocket-js').OBSWebSocket;
const obs = new OBSWebSocket();

if (!SIMULATE_OBS) {
    obs.connect(config.obs.websocketUrl).then(() => {
        console.log('[ OBS OK       ] Connected to OBS WebSocket.');
    }).catch(err => {
        console.error('[ OBS ERROR    ] Failed to connect to OBS WebSocket:', err);
    });
}
function updateTestModeFlags({ simulateTwitch, simulateOBS, simulateDiscord }) {
    const prevSimulate = BYPASS_TWITCH;
    const prevSimOBS = SIMULATE_OBS;
    const prevSimDiscord = SIMULATE_DISCORD;
    clipWatcher.config.simulateDiscord = simulateDiscord;

    BYPASS_TWITCH = simulateTwitch;
    SIMULATE_OBS = simulateOBS;
    SIMULATE_DISCORD = simulateDiscord;

    if (prevSimulate !== simulateTwitch || prevSimOBS !== simulateOBS || prevSimDiscord !== simulateDiscord) {
        console.log(`[ SYSTEM OK    ] Updated test mode flags: Twitch=${simulateTwitch}, OBS=${simulateOBS}, Discord=${simulateDiscord}`);
    } else {
        console.log(`[ SYSTEM OK    ] Test mode flags unchanged: Twitch=${simulateTwitch}, OBS=${simulateOBS}, Discord=${simulateDiscord}`);
    }
}
module.exports.updateTestModeFlags = updateTestModeFlags;


// =============================================
// 		Bot Configuration
// =============================================

const BOT_VERSION = '1.2.1 (Apr 23, 2025)';
const client = new tmi.Client({
    options: { debug: false },
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: config.twitch.username,
        password: config.twitch.oauth
    },
    channels: [config.twitch.channel]
});


// =============================================
// Global Configuration + Constants
// =============================================

const CONFIG = {
    hue: {
        bridgeIp: config.hue.bridgeIp,
        apiKey: config.hue.apiKey,
        bulbIds: config.hue.bulbIds,
        cooldown: 1000
    },
    constants: {
        obs: {
            sceneName: config.obs.sceneName,
            sourceName: config.obs.sourceName
        },
        folders: {
            sounds: path.join(__dirname, 'sounds')
        },
        emojis: {
            warning: '⚠️',
            sound: '🔊',
            cat: '🐱',
            brain: '🧠',
            light: '💡'
        }
    },
    timing: {
        hueCooldown: 1000,
        obsToggleDuration: 10000,
        obsCheckInterval: 10000,
        multiLineDelay: 1000
    }
};


// =============================================
// 	Debug Flags (linked to config.js)
// =============================================

const DEBUG_FLAGS = config.debug;


// =============================================
// 		Debug Logging Helper
// =============================================

function debugLog(flag, message) {
    if (DEBUG_FLAGS.logClean) return;
    if (DEBUG_FLAGS[flag]) {
        console.log(message);
    }
}

function log(message, emoji = '', category = 'system') {
    const emojiPrefix = emoji ? `${emoji} ` : '';
    console.log(`${emojiPrefix}[${category}] ${message}`);
}

// =============================================
//       Static Text Commands
// =============================================

const textCommands = {
    '!version': `handof15Logo HandOfHateBOT v${BOT_VERSION} — the HAND OF HATE grips the fearful.`,
    '!commands': `📋 View a complete list of available commands: ---> ${config.links.commandsUrl}`,
    '!discord': `👥 Join the Discord: ---> ${config.links.discordInvite}`,
    '!drops': '🎁 Drops are enabled here! Information: ---> twitch.tv/drops',
    '!socials': config.links.socialLinks,
    '!lurk': '🫥 $(user) is lurking in the shadows — silent, watching, and waiting.',
    '!hug': '🫂 $(user) hugs $(target) until $(target) can feel something again.'
};


// =============================================
// 		Command Cooldowns
// =============================================

let lastColorChange = 0;


// =============================================
// 		ClipWatcher
// =============================================

function startClipWatcher() {

    if (!clipWatcher.config.clipFolder) {
        debugLog('logClipWatcherDebugMessages', '[ CLIP ERROR   ] No clip folder specified in config');
        return;
    }

    if (clipWatcher.watcher) {
        debugLog('logClipWatcherDebugMessages', '[ CLIP WARN    ] Clip watcher already running');
        return;
    }

    clipWatcher.watcher = chokidar.watch(clipWatcher.config.clipFolder, {
        persistent: true,
        ignoreInitial: true
    });

    clipWatcher.watcher.on('add', handleClip);

    debugLog('logClipWatcherSuccessMessages', '[ CLIP OK      ] Started watching for new clips');
    if (SIMULATE_DISCORD) {
        console.log('[ CLIP TEST    ] Simulating Discord Webhook');
    }
}

// =============================================
// Helper to handle predefined and custom hue color commands
// =============================================

const COLORS = {
    red: { hue: 0, sat: 254 },
    green: { hue: 25500, sat: 254 },
    blue: { hue: 46920, sat: 254 },
    yellow: { hue: 12750, sat: 254 },
    purple: { hue: 50000, sat: 254 },
    cyan: { hue: 21845, sat: 254 },
    magenta: { hue: 60000, sat: 254 },
    orange: { hue: 10000, sat: 254 },
    white: { hue: 0, sat: 0 },
    black: { on: false },
    pink: { hue: 58000, sat: 200, bri: 254 },
};

function handleColorCommand(command, channel, hueOverride = null) {
    const now = Date.now();
    if (now - lastColorChange < CONFIG.hue.cooldown) {
        return false;
    }
    lastColorChange = now;

    let colorName = command.slice(1);
    let colorData = COLORS[colorName];

    if (colorName === 'randomcolor') {
        colorData = { hue: Math.floor(Math.random() * 65535), sat: 254 };
        colorName = 'a random color';
    }

    if (hueOverride !== null) {
        colorData = { hue: hueOverride, sat: 254, bri: 254 };
        colorName = `hue ${hueOverride}`;
    }

    if (colorData) {
        debugLog('logColorDebugMessages', `[ DEBUG COLOR  ] Handling ${colorName} → ${JSON.stringify(colorData)}`);
        changeColor(colorData, colorName);
        debugLog('logColorSuccessMessages', `[ COLOR OK     ] Changed color to: ${colorName}`);
        const botMessage = `💡 Changing the lights to ${colorName}.`;
        client.say(channel, botMessage);
        debugLog('logBotChatMessages', `[ BOT CHAT     ] ${botMessage}`);
        return true;
    }

    return false;
}


// =============================================
// Function to change color using Philips Hue API
// =============================================

async function changeColor(color, colorName) {
    const bri = color.bri !== undefined ? color.bri : 254;
    const on = color.on !== undefined ? color.on : true;

    debugLog('logColorDebugMessages', `[ DEBUG COLOR  ] Sending to bulbs [${CONFIG.hue.bulbIds.join(', ')}]: hue=${color.hue}, sat=${color.sat}, bri=${bri}, on=${on}`);

    for (let bulbId of CONFIG.hue.bulbIds) {
        const url = `http://${CONFIG.hue.bridgeIp}/api/${CONFIG.hue.apiKey}/lights/${bulbId}/state`;

        try {
            await axios.put(url, {
                on,
                hue: color.hue,
                sat: color.sat,
                bri
            });
        } catch (error) {
            console.error('[ COLOR ERROR  ] Error changing color:', error);
        }
    }
}


// =============================================
// Helper to play sound effects
// =============================================

function playSoundEffect(soundName, channel, isRandom = false) {
    const soundFolder = path.join(__dirname, 'sounds');
    const soundFiles = fs.readdirSync(soundFolder).filter(file => file.endsWith('.mp3'));

    if (isRandom) {
        if (soundFiles.length === 0) {
            const botMessage = '⚠️ There are no sound effects available right now.';
            client.say(channel, botMessage);
            debugLog('logBotChatMessages', `[ BOT CHAT  ] ${botMessage}`);
            return;
        }
        soundName = soundFiles[Math.floor(Math.random() * soundFiles.length)].replace(/\.mp3$/, '');
    }

    const soundPath = path.join(soundFolder, `${soundName}.mp3`);
    debugLog('logSoundDebugMessages', `[ DEBUG SOUND  ] Attempting to play sound: ${soundPath}`);

    if (fs.existsSync(soundPath)) {
        debugLog('logSoundSuccessMessages', `[ SOUND OK     ] Playing sound: ${soundName}.mp3`);
        player.play(soundPath, (err) => {
            if (err) {
                console.error(`[ SOUND ERROR  ] Error playing sound effect: ${err}`);
                client.say(channel, `🔊 Sorry, I couldn't play the sound: ${soundName}`);
            }
        });
        const botMessage = `🔊 Playing the ${soundName} sound effect.`;
        client.say(channel, botMessage);
        debugLog('logBotChatMessages', `[ BOT CHAT     ] ${botMessage}`);
    }
}


// =============================================
// Helper to toggle OBS scene items
// =============================================

function toggleObsSceneItem({ sceneName, sourceName, duration, channel, successMessage, failMessage }) {
    if (SIMULATE_OBS) {
        console.log(`[ OBS TEST     ] Pretending to toggle '${sourceName}' in scene '${sceneName}'`);
        if (successMessage) {
            if (!BYPASS_TWITCH) {
                client.say(channel, successMessage); // Actually send to Twitch
            }
            console.log(`[ BOT CHAT     ] ${successMessage} (Simulated OBS)`);
        }
        return;
    }

    // Check if OBS is running by attempting to get scene list
    obs.call('GetSceneItemList', { sceneName }).then(data => {
        const item = data.sceneItems.find(i => i.sourceName === sourceName);
        if (!item) {
            console.warn(`[ OBS WARN     ] Source '${sourceName}' not found in scene '${sceneName}'`);
            client.say(channel, `⚠️ The ${sourceName} source was not found in the scene '${sceneName}'.`);
            return;
        }

        // Enable the scene item
        obs.call('SetSceneItemEnabled', {
            sceneName,
            sceneItemId: item.sceneItemId,
            sceneItemEnabled: true
        }).then(() => {
            console.log(`[ OBS OK       ] ${sourceName} enabled.`);
            if (successMessage) {
                client.say(channel, successMessage);
                debugLog('logBotChatMessages', `[ BOT CHAT     ] ${successMessage}`);
            }

            if (duration) {
                setTimeout(() => {
                    obs.call('SetSceneItemEnabled', {
                        sceneName,
                        sceneItemId: item.sceneItemId,
                        sceneItemEnabled: false
                    }).then(() => {
                        console.log(`[ OBS OK       ] ${sourceName} disabled.`);
                    }).catch(err => {
                        console.error(`[ OBS ERROR    ] Failed to disable ${sourceName}:`, err);
                    });
                }, duration);
            }
        }).catch(err => {
            console.error(`[ OBS ERROR    ] Failed to enable ${sourceName}:`, err);
            if (failMessage) {
                client.say(channel, failMessage);
                debugLog('logBotChatMessages', `[ BOT CHAT     ] ${failMessage}`);
            }
        });

    }).catch(err => {
        console.error('[ OBS ERROR    ] OBS is not currently running or WebSocket is not available.');
        client.say(channel, `⚠️ OBS is not running or not responding.`);
    });
}


// =============================================
// Function to handle all incoming commands
// =============================================
function handleCommand(channel, tags, message) {
    const username = tags['display-name'] || 'Unknown';
    const lowerMsg = message.toLowerCase();
    const parts = message.split(' ');
    const command = parts[0].toLowerCase();

    // 🎥 OBS Source Toggle Command
    const matchedSource = config.obs?.toggleSources?.find(
        s => command === `!${s.name.toLowerCase()}`
    );

    if (matchedSource) {
        toggleObsSceneItem({
            sceneName: matchedSource.sceneName,
            sourceName: matchedSource.sourceName,
            duration: matchedSource.duration,
            channel,
            successMessage: `${matchedSource.label} activated!`,
            failMessage: `Failed to activate ${matchedSource.label}.`
        });
        return;
    }

    if (command === '!testflags' && username === 'GUI') {
        const simulateTwitch = parts[1] === 'true';
        const simulateOBS = parts[2] === 'true';
        const simulateDiscord = parts[3] === 'true';
        updateTestModeFlags({ simulateTwitch, simulateOBS, simulateDiscord });

        // Always confirm receipt of update, even if unchanged
        console.log(`[ SYSTEM OK    ] Test mode flags now: Twitch=${BYPASS_TWITCH}, OBS=${SIMULATE_OBS}, Discord=${SIMULATE_DISCORD}`);
        return;
    }

    if (!command.startsWith('!')) return;

    // Only log user messages if they're not from GUI input
    if (username !== 'GUI') {
        debugLog('logUserChatMessages', `[ USER CHAT    ] ${username}: ${message}`);
    }

    if (!command.startsWith('!')) return;

    // !hug - Dynamic version using $(user) and $(target)
    if (command === '!hug') {
        const target = parts[1] || username;
        const msg = textCommands['!hug']
            .replace(/\$\((user)\)/gi, username)
            .replace(/\$\((target)\)/gi, target);

        debugLog('logBotChatMessages', `[ BOT CHAT     ] ${msg}`);
        client.say(channel, msg);
        return;
    }

    // !subscribers - Twitch Helix API method
    if (command === '!subscribers') {
        (async () => {
            try {
                const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
                    params: { login: 'handofhate' },
                    headers: {
                        'Client-ID': config.twitch.clientId,
                        'Authorization': `Bearer ${config.twitch.bearerToken}`
                    }
                });
                const userId = userResponse.data.data[0].id;
                const { data } = await axios.get('https://api.twitch.tv/helix/subscriptions', {
                    headers: {
                        'Client-ID': config.twitch.clientId,
                        'Authorization': `Bearer ${config.twitch.bearerToken}`
                    },
                    params: { broadcaster_id: userId }
                });
                const count = data.total;
                const plural = count === 1 ? 'person is' : 'people are';
                const msg = `⭐ ${count} ${plural} subscribed to the channel.`;
                debugLog('logBotChatMessages', `[ BOT CHAT     ] ${msg}`);
                client.say(channel, msg);
            } catch (err) {
                const errorMsg = '⚠️ Could not retrieve subscriber count.';
                console.error('[ TWITCH ERROR ] Failed to fetch subscriber count:', err);
                client.say(channel, errorMsg);
            }
        })();
        return;
    }

    // !uptime - Shows how long the stream has been live
    if (command === '!uptime') {
        (async () => {
            try {
                const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
                    params: { login: 'handofhate' },
                    headers: {
                        'Client-ID': config.twitch.clientId,
                        'Authorization': `Bearer ${config.twitch.bearerToken}`
                    }
                });
                const userId = userResponse.data.data[0].id;
                const streamResponse = await axios.get('https://api.twitch.tv/helix/streams', {
                    params: { user_id: userId },
                    headers: {
                        'Client-ID': config.twitch.clientId,
                        'Authorization': `Bearer ${config.twitch.bearerToken}`
                    }
                });

                if (streamResponse.data.data.length === 0) {
                    const msg = '💤 Ty is not currently streaming.';
                    debugLog('logBotChatMessages', `[ BOT CHAT     ] ${msg}`);
                    client.say(channel, msg);
                } else {
                    const startedAt = new Date(streamResponse.data.data[0].started_at);
                    const now = new Date();
                    const uptimeMs = now - startedAt;

                    const hours = Math.floor(uptimeMs / 3600000);
                    const minutes = Math.floor((uptimeMs % 3600000) / 60000);
                    const seconds = Math.floor((uptimeMs % 60000) / 1000);

                    let uptimeStr = '';
                    if (hours > 0) uptimeStr += `${hours}h `;
                    if (minutes > 0 || hours > 0) uptimeStr += `${minutes}m `;
                    uptimeStr += `${seconds}s`;

                    const msg = `🕒 ${config.twitch.streamerName} has been streaming for ${uptimeStr.trim()}.`;
                    debugLog('logBotChatMessages', `[ BOT CHAT     ] ${msg}`);
                    client.say(channel, msg);
                }
            } catch (err) {
                const errorMsg = '⚠️ Could not fetch uptime.';
                console.error('[ TWITCH ERROR ] Failed to fetch uptime:', err);
                client.say(channel, errorMsg);
            }
        })();
        return;
    }

    // !color - Changes to custom hue
    if (command === '!color') {
        if (parts.length === 2) {
            const hueValue = parseInt(parts[1], 10);
            if (!isNaN(hueValue) && hueValue >= 0 && hueValue <= 65535) {
                handleColorCommand(command, channel, hueValue);
            } else {
                const msg = '🧠 Invalid hue value! Please provide a number between 0 and 65535.';
                client.say(channel, msg);
                debugLog('logBotChatMessages', `[ BOT CHAT     ] ${msg}`);
            }
        } else {
            const msg = '🧠 Usage: !color <hue> — please provide a number.';
            client.say(channel, msg);
            debugLog('logBotChatMessages', `[ BOT CHAT     ] ${msg}`);
        }
        return;
    }

    if (lowerMsg === '!randomsound') {
        playSoundEffect(null, channel, true);
        return;
    }

    if (textCommands[command]) {
        const response = textCommands[command];
        if (typeof response === 'string') {
            const msg = response.replace(/\$\((user)\)/gi, username);
            debugLog('logBotChatMessages', `[ BOT CHAT     ] ${msg}`);
            client.say(channel, msg);
        } else if (Array.isArray(response)) {
            response.forEach((line, index) => {
                setTimeout(() => {
                    const msg = line.replace(/\$\((user)\)/gi, username);
                    debugLog('logBotChatMessages', `[ BOT CHAT     ] ${msg}`);
                    client.say(channel, msg);
                }, index * CONFIG.timing.multiLineDelay);
            });
        }
        return;
    }

    if (handleColorCommand(command, channel)) return;

    const soundName = message.slice(1);
    playSoundEffect(soundName, channel);
}

// =============================================
// Twitch Message Event Handler
// =============================================

client.on('message', (channel, tags, message, self) => {
    const isGUI = tags['display-name'] === 'GUI';

    if ((self || BYPASS_TWITCH) && !isGUI) return;

    handleCommand(channel, tags, message);
});


// =============================================
// 	   Connect the bot to Twitch
// =============================================

console.log(`[ SYSTEM OK    ] Bot launched at ${new Date().toLocaleTimeString()}`);

if (!BYPASS_TWITCH) {
    client.connect().then(() => {
        console.log('[ SYSTEM OK    ] Connected to Twitch.');
    });
}

console.log('[ DEBUG       ] config.modules.clipWatcher:', config.modules?.clipWatcher);
if (config.modules?.clipWatcher !== false) {
    clipWatcher.config = {
        ...config,
        simulateDiscord: SIMULATE_DISCORD,
        simulateOBS: SIMULATE_OBS,
        simulateTwitch: BYPASS_TWITCH
    };

    if (clipWatcher.config.simulateDiscord) {
        console.log('[ CLIP TEST    ] Simulating Discord Webhook');
    }

    console.log('[ DEBUG       ] About to start clip watcher...');
    startClipWatcher();
}


// =============================================
// Helper for ClipWatcher
// =============================================

function handleClip(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.mp4', '.mov', '.mkv'].includes(ext)) {
        debugLog('logClipWatcherDebugMessages', '[ CLIP ERROR   ] Skipped (not a video file)');
        return;
    }

    if (path.basename(filePath).startsWith('compressed_')) return;

    debugLog('logClipWatcherSuccessMessages', `[ CLIP OK      ] New clip detected: ${path.basename(filePath)}`);

    setTimeout(async () => {
        const compressed = path.join(path.dirname(filePath), 'compressed_' + path.basename(filePath));
        const success = await compressClip(filePath, compressed);

        if (!success || !fs.existsSync(compressed)) {
            debugLog('logClipWatcherDebugMessages', '[ CLIP ERROR   ] Compression failed');
            return;
        }

        debugLog('logClipWatcherSuccessMessages', '[ CLIP OK      ] Clip successfully compressed');

        if (fileSizeMB(compressed) > clipWatcher.config.maxFileSizeMb) {
            debugLog('logClipWatcherDebugMessages', '[ CLIP ERROR   ] Clip too large after compression');
            if (clipWatcher.config.deleteCompressedAfterPost) fs.unlinkSync(compressed);
            return;
        }

        const game = await detectRunningGame();
        const dt = parseClipFilename(filePath);
        const timeStr = dt ? dt.toLocaleString() : 'Unknown Time';

        const form = new FormData();
        form.append('file', fs.createReadStream(compressed));
        let clipText = `🕓 \`${timeStr}\`\n📎 New clip!`;
        if (game) clipText = `🎮 **${game}**\n` + clipText;
        form.append('content', clipText);

        try {
            if (SIMULATE_DISCORD) {
                debugLog('logClipWatcherSuccessMessages', '[ CLIP TEST    ] Simulated Discord webhook post.');
            } else {
                await axios.post(clipWatcher.config.discordWebhookUrl, form, { headers: form.getHeaders() });
                debugLog('logClipWatcherSuccessMessages', '[ CLIP OK      ] Clip posted to Discord');

                if (clipWatcher.config.deleteOriginalAfterPost) fs.unlinkSync(filePath);
                if (clipWatcher.config.deleteCompressedAfterPost) fs.unlinkSync(compressed);
            }
        } catch (err) {
            debugLog('logClipWatcherDebugMessages', '[ CLIP ERROR   ] Failed to post clip to Discord');
        }
    }, 5000);
}

function compressClip(input, output) {
    return new Promise(resolve => {
        execFile('ffmpeg', ['-i', input, '-c:v', 'libx264', '-c:a', 'aac', '-b:v', '1500k', '-ac', '2', '-y', output], err => {
            resolve(!err);
        });
    });
}

async function detectRunningGame() {
    const processes = await psList();
    for (const proc of processes) {
        const name = proc.name.toLowerCase();
        if (clipWatcher.config.knownGames?.[name]) {
            const detected = clipWatcher.config.knownGames[name];
            debugLog('logClipWatcherSuccessMessages', `[ CLIP OK      ] Detected game: ${detected} (${name})`);
            return detected;
        }
    }
    debugLog('logClipWatcherDebugMessages', '[ CLIP WARN    ] No known game detected from process list');
    return '';
}

function parseClipFilename(filename) {
    const stem = path.basename(filename, path.extname(filename));
    const parts = stem.split('_');
    if (parts.length !== 2) return null;
    const dt = new Date(`${parts[0]} ${parts[1].replace(/(..)(..)(..)$/, '$1:$2:$3')}`);
    return isNaN(dt) ? null : dt;
}

function fileSizeMB(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024);
}


// =============================================
//      Handle Commands Sent from GUI (stdin)
// =============================================

process.stdin.on('data', (data) => {
    const input = data.toString().trim();
    if (!input) return;

    // Fake a Twitch message from GUI
    const fakeChannel = `#${config.twitch.channel}`;
    const fakeTags = { 'display-name': 'GUI' };

    console.log(`[ GUI INPUT    ] ${input}`);
    client.emit('message', fakeChannel, fakeTags, input, false);
});


// =============================================
//    Function to monitor if OBS is running
// =============================================

function isOBSRunning(callback) {
    exec('tasklist', (err, stdout, stderr) => {
        if (err) {
            console.error('[ OBS ERROR    ] Could not check if OBS is running:', err);
            callback(false);
            return;
        }
        const isRunning = stdout.toLowerCase().includes('obs64.exe') || stdout.toLowerCase().includes('obs.exe');
        callback(isRunning);
    });
}


// =============================================
//    Handling unhandled promise rejections
// =============================================

process.on('unhandledRejection', (err) => {
    const msg = String(err);

    if (
        msg.includes('Client is not connected') ||
        msg.includes('Cannot send message') ||
        msg.includes('Cannot read properties of undefined') // tmi.js errors
    ) {
        console.log('[ TWITCH TEST  ] Suppressed: ' + msg);
    } else if (
        msg.includes('WebSocket is not open') ||
        msg.includes('Not connected to server') ||
        msg.includes('no socket')
    ) {
        console.log('[ OBS TEST     ] Suppressed: ' + msg);
    } else {
        console.error('[ SYSTEM ERROR ] Unhandled promise rejection:', err);
    }
});
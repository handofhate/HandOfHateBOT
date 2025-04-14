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
const config = require('./config');

const OBSWebSocket = require('obs-websocket-js').OBSWebSocket;
const obs = new OBSWebSocket();

obs.connect(config.obs.websocketUrl).then(() => {
    console.log('[ OBS       ] Connected to OBS WebSocket.');
}).catch(err => {
    console.error('[ OBS       ] Failed to connect to OBS WebSocket:', err);
});


// =============================================
// 		Bot Configuration
// =============================================

const BOT_VERSION = '1.1.1 (Apr 13, 2025)';
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
        debugLog('logColorDebugMessages', `[ DEBUG     ] Handling ${colorName} → ${JSON.stringify(colorData)}`);
        changeColor(colorData, colorName);
        debugLog('logColorSuccessMessages', `[ COLOR     ] Changed color to: ${colorName}`);
        const botMessage = `💡 Changing the lights to ${colorName}.`;
        client.say(channel, botMessage);
        debugLog('logBotChatMessages', `[ BOT CHAT  ] ${botMessage}`);
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

    debugLog('logColorDebugMessages', `[ DEBUG     ] Sending to bulbs [${CONFIG.hue.bulbIds.join(', ')}]: hue=${color.hue}, sat=${color.sat}, bri=${bri}, on=${on}`);

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
            console.error('[ COLOR     ] Error changing color:', error);
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
    debugLog('logSoundDebugMessages', `[ DEBUG     ] Attempting to play sound: ${soundPath}`);

    if (fs.existsSync(soundPath)) {
        debugLog('logSoundSuccessMessages', `[ SOUND     ] Playing sound: ${soundName}.mp3`);
        player.play(soundPath, (err) => {
            if (err) {
                console.error(`[ SOUND     ] Error playing sound effect: ${err}`);
                client.say(channel, `🔊 Sorry, I couldn't play the sound: ${soundName}`);
            }
        });
        const botMessage = `🔊 Playing the ${soundName} sound effect.`;
        client.say(channel, botMessage);
        debugLog('logBotChatMessages', `[ BOT CHAT  ] ${botMessage}`);
    }
}


// =============================================
// Helper to toggle OBS scene items
// =============================================

function toggleObsSceneItem({ sceneName, sourceName, duration, channel, successMessage, failMessage }) {
    debugLog('logOBSDebugMessages', `[ DEBUG     ] Attempting to toggle OBS source '${sourceName}' in scene '${sceneName}'`);

    obs.call('GetSceneItemList', { sceneName }).then(data => {
        const item = data.sceneItems.find(i => i.sourceName === sourceName);
        if (!item) {
            client.say(channel, `⚠️ The ${sourceName} source was not found in the scene '${sceneName}'.`);
            return;
        }

        obs.call('SetSceneItemEnabled', {
            sceneName,
            sceneItemId: item.sceneItemId,
            sceneItemEnabled: true
        }).then(() => {
            debugLog('logOBSSuccessMessages', `[ OBS       ] ${sourceName} enabled.`);
            if (successMessage) {
                client.say(channel, successMessage);
                debugLog('logBotChatMessages', `[ BOT CHAT  ] ${successMessage}`);
            }

            if (duration) {
                setTimeout(() => {
                    obs.call('SetSceneItemEnabled', {
                        sceneName,
                        sceneItemId: item.sceneItemId,
                        sceneItemEnabled: false
                    }).then(() => {
                        debugLog('logOBSSuccessMessages', `[ OBS       ] ${sourceName} disabled.`);
                    }).catch(err => {
                        console.error(`[OBS] Error disabling ${sourceName}:`, err);
                    });
                }, duration);
            }
        }).catch(err => {
            console.error(`[OBS] Error enabling ${sourceName}:`, err);
            if (failMessage) {
                client.say(channel, failMessage);
                debugLog('logBotChatMessages', `[ BOT CHAT  ] ${failMessage}`);
            }
        });
    }).catch(err => {
        console.error(`[OBS] Error retrieving scene item list for ${sceneName}:`, err);
        client.say(channel, `⚠️ Failed to retrieve the scene item list from OBS.`);
    });
}


// =============================================
// Function to handle chat messages for commands
// =============================================

client.on('message', async (channel, tags, message, self) => {
    if (self) return;

    const lowerMsg = message.toLowerCase();
    const parts = message.split(' ');
    const command = parts[0].toLowerCase();
    const username = tags['display-name'];

    debugLog('logUserChatMessages', `[ USER CHAT ] ${username}: ${message}`);

    if (message.startsWith('!')) {

        // !hug - Dynamic version using $(user) and $(target)
        if (command === '!hug') {
            const target = parts[1] || username;
            const msg = textCommands['!hug']
                .replace(/\$\((user)\)/gi, username)
                .replace(/\$\((target)\)/gi, target);

            debugLog('logBotChatMessages', `[ BOT CHAT  ] ${msg}`);
            client.say(channel, msg);
            return;
        }

        // !subscribers - Twitch Helix API method
        if (command === '!subscribers') {
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
                    params: {
                        broadcaster_id: userId
                    }
                });
                const count = data.total;
                const plural = count === 1 ? 'person is' : 'people are';
                const msg = `⭐ ${count} ${plural} subscribed to the channel.`;
                debugLog('logBotChatMessages', `[ BOT CHAT  ] ${msg}`);
                client.say(channel, msg);
            } catch (err) {
                const errorMsg = '⚠️ Could not retrieve subscriber count.';
                console.error('[ BOT ERROR ] Failed to fetch subscriber count:', err);
                client.say(channel, errorMsg);
            }
            return;
        }

        // !uptime - Shows how long the stream has been live
        if (command === '!uptime') {
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
                    debugLog('logBotChatMessages', `[ BOT CHAT  ] ${msg}`);
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
                    debugLog('logBotChatMessages', `[ BOT CHAT  ] ${msg}`);
                    client.say(channel, msg);
                }
            } catch (err) {
                const errorMsg = '⚠️ Could not fetch uptime.';
                console.error('[ BOT ERROR ] Failed to fetch uptime:', err);
                client.say(channel, errorMsg);
            }
            return;
        }

        // !color - Changes to custom hue
        if (command === '!color') {
            if (parts.length === 2) {
                const hueValue = parseInt(parts[1], 10);
                if (!isNaN(hueValue) && hueValue >= 0 && hueValue <= 65535) {
                    handleColorCommand(command, channel, hueValue);
                } else {
                    const botMessage = '🧠 Invalid hue value! Please provide a number between 0 and 65535.';
                    client.say(channel, botMessage);
                    debugLog('logBotChatMessages', `[ BOT CHAT  ] ${botMessage}`);
                }
            } else {
                const botMessage = '🧠 Usage: !color <hue> — please provide a number.';
                client.say(channel, botMessage);
                debugLog('logBotChatMessages', `[ BOT CHAT  ] ${botMessage}`);
            }
            return;
        }

        // !randomsound - Plays a random sound
        if (lowerMsg === '!randomsound') {
            playSoundEffect(null, channel, true);
            return;
        }

        // !(sourceName) - Toggles a source in OBS for 10 seconds (as defined in config.js)
        if (command === `!${CONFIG.constants.obs.sourceName.toLowerCase()}`) {
            toggleObsSceneItem({
                sceneName: CONFIG.constants.obs.sceneName,
                sourceName: CONFIG.constants.obs.sourceName,
                duration: CONFIG.timing.obsToggleDuration,
                channel,
                successMessage: `${CONFIG.constants.emojis.cat} ${CONFIG.constants.obs.sourceName} is now live for 10 seconds.`,
                failMessage: `${CONFIG.constants.emojis.warning} Failed to toggle ${CONFIG.constants.obs.sourceName}.`
            });
            return;
        }

        // Static text commands with optional $(user) replacement
        if (textCommands[command]) {
            const response = textCommands[command];

            if (typeof response === 'string') {
                const msg = response.replace(/\$\((user)\)/gi, username);
                debugLog('logBotChatMessages', `[ BOT CHAT  ] ${msg}`);
                client.say(channel, msg);
            } else if (Array.isArray(response)) {
                response.forEach((line, index) => {
                    setTimeout(() => {
                        const msg = line.replace(/\$\((user)\)/gi, username);
                        debugLog('logBotChatMessages', `[ BOT CHAT  ] ${msg}`);
                        client.say(channel, msg);
                    }, index * CONFIG.timing.multiLineDelay);
                });
            }
            return;
        }

        // Predefined color commands like !red, !green, etc.
        if (handleColorCommand(command, channel)) {
            return;
        }

        // Fallback to playing a sound file by name
        const soundName = message.slice(1);
        playSoundEffect(soundName, channel);
    }
});


// =============================================
// 	   Connect the bot to Twitch
// =============================================

console.log(`[ SYSTEM    ] Bot launched at ${new Date().toLocaleTimeString()}`);

client.connect().then(() => {
    console.log('[ SYSTEM    ] Connected to Twitch.');
});


// =============================================
// Auto-response to Twitch raids
// =============================================

client.on('raided', (channel, username, viewers) => {
    const url = `https://twitch.tv/${username}`;
    const message = `🎉 Thank you so much for the raid, ${username}! If you haven't yet, follow them at ${url} and show them some love!`;

    debugLog('logBotChatMessages', `[ BOT CHAT  ] ${message}`);
    client.say(channel, message);
});


// =============================================
//    Function to monitor if OBS is running
// =============================================

function monitorOBSProcess() {
    exec('tasklist', (err, stdout, stderr) => {
        if (err) {
            console.error('[SYSTM] Error checking OBS process:', err);
            return;
        }
        if (!stdout.toLowerCase().includes('obs-browser-page.exe')) {
            console.log('[SYSTM] OBS Browser Page is not running. Shutting down bot.');
            process.exit();
        }
    });
}


// =============================================
// 	Check OBS process every 10 seconds
// =============================================

setTimeout(() => {
    setInterval(monitorOBSProcess, CONFIG.timing.obsCheckInterval);
}, 5000); // Delay just enough for OBS to launch or the old bot to close


// =============================================
//    Handling unhandled promise rejections
// =============================================

process.on('unhandledRejection', (err) => {
    console.error('[SYSTEM] Unhandled promise rejection:', err);
});

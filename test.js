// =============================================
//       HandOfHateBOT - Pre-Launch Tests
// =============================================

// This script validates critical systems before starting the bot.
// Checks:
// - All files in /sounds are valid MP3s
// - Warns if no MP3s exist
// - bot.js has no syntax errors
// - Critical config keys exist
// - OBS scene + source exist
// - OBS toggles CatCam on/off successfully

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const OBSWebSocket = require('obs-websocket-js').OBSWebSocket;
const obs = new OBSWebSocket();


// =============================================
//        Sound File Validation
// =============================================

const soundsDir = path.join(__dirname, 'sounds');
let hasSoundFolder = fs.existsSync(soundsDir);

if (!hasSoundFolder) {
    console.error('❌ Missing /sounds folder!');
    process.exit(1);
}

const soundFiles = fs.readdirSync(soundsDir);
const invalidSounds = soundFiles.filter(file => !file.endsWith('.mp3'));

if (invalidSounds.length > 0) {
    console.error('❌ Found non-MP3 files in /sounds:', invalidSounds);
    process.exit(1);
} else {
    console.log('✅ All sound files in /sounds are valid MP3s.');
}

if (soundFiles.length === 0) {
    console.warn('⚠️ No MP3 sound files found in /sounds.');
}


// =============================================
//       Syntax Validation for bot.js
// =============================================

try {
    execSync('node --check bot.js', { stdio: 'pipe' });
    console.log('✅ bot.js has no syntax errors.');
} catch (err) {
    console.error('❌ bot.js has a syntax error:\n', err.stderr.toString());
    process.exit(1);
}


// =============================================
//       Basic Config Key Presence Check
// =============================================

const CONFIG_PATH = path.join(__dirname, 'bot.js');
const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');

const requiredKeys = [
    'bridgeIp',
    'apiKey',
    'bulbIds',
    'sceneName',
    'sourceName'
];

const missingKeys = requiredKeys.filter(key => !configContent.includes(key));

if (missingKeys.length > 0) {
    console.error('❌ Missing config keys in bot.js:', missingKeys);
    process.exit(1);
} else {
    console.log('✅ All required config keys are present in bot.js.');
}


// =============================================
//          OBS Scene + Source Validation
// =============================================

const OBS_WS_URL = 'ws://127.0.0.1:4455'; // Default OBS WebSocket port
const sceneName = 'Mini CatCam';
const sourceName = 'CatCam';

async function runOBSCheck() {
    try {
        await obs.connect(OBS_WS_URL);
        console.log('✅ Connected to OBS WebSocket.');

        const data = await obs.call('GetSceneItemList', { sceneName });
        const item = data.sceneItems.find(i => i.sourceName === sourceName);

        if (!item) {
            console.error(`❌ Source '${sourceName}' not found in scene '${sceneName}'.`);
            process.exit(1);
        }

        console.log(`✅ Source '${sourceName}' found in scene '${sceneName}'.`);

        // =============================================
        //      OBS Toggle CatCam On/Off Test
        // =============================================

        console.log(`🔁 Toggling '${sourceName}' ON and OFF to confirm functionality...`);

        await obs.call('SetSceneItemEnabled', {
            sceneName,
            sceneItemId: item.sceneItemId,
            sceneItemEnabled: true
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        await obs.call('SetSceneItemEnabled', {
            sceneName,
            sceneItemId: item.sceneItemId,
            sceneItemEnabled: false
        });

        console.log(`✅ '${sourceName}' successfully toggled on/off.`);

        // =============================================
        //             All Tests Passed!
        // =============================================

        console.log('🎉 All systems go. Your bot is ready to roll.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Failed during OBS validation or toggle:', err.message);
        process.exit(1);
    }
}

runOBSCheck();

// ==============================================
//                clipWatcher.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const chokidar = require('chokidar');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const psList = require('ps-list').default;
const log = require('../gui/ui/logger')('CLIP');
const { isSimDiscord } = require('../bot/testFlags');

function getConfig() {
  delete require.cache[require.resolve('../config.js')];
  return require('../config.js');
}

let clipWatcher = {
  watcher: null,
  isEnabled: false,
};

// ==============================================
//             Configuration Setup
// ==============================================

function updateClipWatcherConfig() {
  log.ok('Updated clip watcher configuration');
}

// ==============================================
//              Clip Watcher Start
// ==============================================

function startClipWatcher() {
  const config = getConfig();

  if (!config.clipFolder) {
    log.error('No clip folder specified in config');
    return;
  }
  if (clipWatcher.watcher) {
    log.warn('Already watching for new clips');
    return;
  }
  clipWatcher.watcher = chokidar.watch(config.clipFolder, {
    persistent: true,
    ignoreInitial: true,
  });
  clipWatcher.watcher.on('add', handleClip);
  const sim = config.testing?.simulateDiscord || isSimDiscord();
  log.ok(`Started watching for new clips${sim ? ', but simulating Discord connection' : ''}`);
}

// ==============================================
//               Clip Watcher Stop
// ==============================================

function stopClipWatcher() {
  if (clipWatcher.watcher) {
    clipWatcher.watcher.close();
    clipWatcher.watcher = null;
    log.ok('Stopped watching for new clips');
  } else {
    log.warn("Tried to stop watching for new clips, but Clip Watcher isn't running");
  }
}

// ==============================================
//               Clip File Handler
// ==============================================

function handleClip(filePath) {
  const config = getConfig();

  const ext = path.extname(filePath).toLowerCase();
  if (!['.mp4', '.mov', '.mkv'].includes(ext)) return;
  if (path.basename(filePath).startsWith('compressed_')) return;

  log.ok(`New clip detected: ${path.basename(filePath)}`);

  setTimeout(async () => {
    const compressed = path.join(path.dirname(filePath), 'compressed_' + path.basename(filePath));
    const success = await compressClip(filePath, compressed);

    if (!success || !fs.existsSync(compressed)) {
      log.error('Clip compression failed or file is missing');
      return;
    }

    log.ok('Clip successfully compressed');

    const size = fileSizeMB(compressed);
    log.ok(`Compressed clip size: ${size.toFixed(2)} MB`);

    if (size > config.maxFileSizeMb) {
      log.error('Clip too large after compression');
      if (config.deleteCompressedAfterPost) {
        try {
          fs.unlinkSync(compressed);
          log.warn('Deleted oversized compressed clip');
        } catch (err) {
          log.error(`Failed to delete oversized compressed clip: ${err.message || err}`);
        }
      }
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
      if (typeof isSimDiscord === 'function' && isSimDiscord()) {
        log.ok('Simulated posting to Discord:');
        clipText.split('\n').forEach((line) => log.ok(line));
      } else if (config.testing?.simulateDiscord) {
        log.ok('Simulated posting to Discord:');
        clipText.split('\n').forEach((line) => log.ok(line));
      } else {
        await axios.post(config.discordWebhookUrl, form, {
          headers: form.getHeaders(),
        });
        log.ok('Clip posted to Discord');
      }

      if (config.deleteOriginalAfterPost) {
        try {
          fs.unlinkSync(filePath);
          log.ok('Deleted original clip');
        } catch (err) {
          log.error(`Failed to delete original clip: ${err.message || err}`);
        }
      }

      if (config.deleteCompressedAfterPost) {
        try {
          fs.unlinkSync(compressed);
          log.ok('Deleted compressed clip');
        } catch (err) {
          log.error(`Failed to delete compressed clip: ${err.message || err}`);
        }
      }
    } catch (err) {
      log.error(`Failed to post clip to Discord: ${err.message || err}`);
    }
  }, 5000);
}

// ==============================================
//              Video Duration Check
// ==============================================

function getVideoDuration(filePath) {
  return new Promise((resolve) => {
    execFile(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        filePath,
      ],
      (err, stdout) => {
        if (err) {
          log.warn(`Failed to get video duration: ${err.message || err}`);
          resolve(null);
        } else {
          const duration = parseFloat(stdout);
          resolve(duration);
        }
      }
    );
  });
}

// ==============================================
//                Clip Compression
// ==============================================

function compressClip(input, output) {
  return new Promise((resolve) => {
    (async () => {
      try {
        const config = getConfig();
        const originalSizeMB = fileSizeMB(input);
        const targetSizeMB = config.maxFileSizeMb || 8;

        if (originalSizeMB <= targetSizeMB) {
          log.ok(
            `Clip already under ${targetSizeMB}MB (${originalSizeMB.toFixed(2)}MB), copying instead of compressing`
          );
          fs.copyFileSync(input, output);
          resolve(true);
          return;
        }

        const useSmartCompression = config.smartCompression !== false;

        if (useSmartCompression) {
          const duration = await getVideoDuration(input);
          if (!duration) {
            log.warn("Couldn't determine video duration, using standard compression");
          } else {
            const compressionRatio = originalSizeMB / targetSizeMB;

            const targetBitrate = Math.floor((targetSizeMB * 8 * 1024) / duration);

            const constrainedBitrate = Math.max(300, Math.min(3000, targetBitrate));

            let scaleFilter = '';
            if (compressionRatio > 4) {
              scaleFilter = 'scale=852:-2';
            } else if (compressionRatio > 2.5) {
              scaleFilter = 'scale=1280:-2';
            }

            log.ok(
              `Smart compression: ${originalSizeMB.toFixed(2)}MB → target ${targetSizeMB}MB using ${constrainedBitrate}kbps`
            );

            const ffmpegArgs = [
              '-i',
              input,
              '-c:v',
              'libx264',
              '-preset',
              'fast',
              '-c:a',
              'aac',
              '-b:v',
              `${constrainedBitrate}k`,
              '-ac',
              '2',
            ];

            if (scaleFilter) {
              ffmpegArgs.push('-vf', scaleFilter);
              log.ok(`Applying resolution scaling: ${scaleFilter}`);
            }

            ffmpegArgs.push('-y', output);

            execFile('ffmpeg', ffmpegArgs, (err) => {
              if (err) {
                log.error(`Compression failed: ${err.message || err}`);
                resolve(false);
              } else {
                const newSizeMB = fileSizeMB(output);
                log.ok(
                  `Compressed successfully: ${originalSizeMB.toFixed(2)}MB → ${newSizeMB.toFixed(2)}MB`
                );
                resolve(true);
              }
            });
            return;
          }
        }

        const compressionPresets = {
          minimal: [
            '-c:v',
            'libx264',
            '-crf',
            '28',
            '-preset',
            'veryfast',
            '-c:a',
            'aac',
            '-b:a',
            '64k',
          ],
          low: ['-c:v', 'libx264', '-crf', '26', '-preset', 'faster', '-c:a', 'aac', '-b:a', '96k'],
          medium: [
            '-c:v',
            'libx264',
            '-crf',
            '23',
            '-preset',
            'fast',
            '-c:a',
            'aac',
            '-b:a',
            '128k',
          ],
          high: [
            '-c:v',
            'libx264',
            '-crf',
            '20',
            '-preset',
            'medium',
            '-c:a',
            'aac',
            '-b:a',
            '192k',
          ],
          extreme: [
            '-c:v',
            'libx264',
            '-crf',
            '17',
            '-preset',
            'medium',
            '-c:a',
            'aac',
            '-b:a',
            '256k',
          ],
        };

        const preset =
          compressionPresets[config.compressionLevel || 'medium'] || compressionPresets.medium;

        log.ok(`Using ${config.compressionLevel || 'medium'} compression preset`);

        execFile('ffmpeg', ['-i', input, ...preset, '-y', output], (err) => {
          if (err) {
            log.error(`Compression failed: ${err.message || err}`);
            resolve(false);
          } else {
            const newSizeMB = fileSizeMB(output);
            log.ok(`Compressed: ${originalSizeMB.toFixed(2)}MB → ${newSizeMB.toFixed(2)}MB`);
            resolve(true);
          }
        });
      } catch (error) {
        log.error(`Error during compression: ${error.message || error}`);
        resolve(false);
      }
    })();
  });
}

// ==============================================
//                Game Detection
// ==============================================

async function detectRunningGame() {
  const config = getConfig();
  const processes = await psList();
  for (const proc of processes) {
    const name = proc.name.toLowerCase();
    if (config.knownGames?.[name]) {
      const detected = config.knownGames[name];
      log.ok(`Detected game: ${detected} (${name})`);
      return detected;
    }
  }
  log.warn('Game could not be detected');
  return '';
}

// ==============================================
//                Parse Filename
// ==============================================

function parseClipFilename(filename) {
  const stem = path.basename(filename, path.extname(filename));
  const parts = stem.split('_');
  if (parts.length !== 2) return null;
  const dt = new Date(`${parts[0]} ${parts[1].replace(/(..)(..)(..)$/, '$1:$2:$3')}`);
  return isNaN(dt) ? null : dt;
}

// ==============================================
//                 File Size MB
// ==============================================

function fileSizeMB(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size / (1024 * 1024);
}

// ==============================================
//                   Exports
// ==============================================

module.exports = {
  startClipWatcher,
  stopClipWatcher,
  updateClipWatcherConfig,
};

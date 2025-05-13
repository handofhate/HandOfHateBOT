// ==============================================
//             refreshTwitchToken.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const fetch = require('node-fetch');
const log = require('../gui/ui/logger')('OAUTH');
const saveConfig = require('./saveConfig');
const config = require('../config');

// ==============================================
//                 Refresh Token
// ==============================================

async function refreshTwitchToken() {
  const refreshToken = config.twitch?.refreshToken;
  const clientId = config.twitch?.clientId;
  const clientSecret = config.twitch?.clientSecret;

  if (!refreshToken || !clientId || !clientSecret) {
    log.error('Missing required Twitch credentials to refresh token.');
    return null;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  try {
    const res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: params,
    });

    const data = await res.json();

    if (data.access_token) {
      log.ok('Refreshed Twitch access token successfully.');

      const updatedConfig = {
        ...config,
        twitch: {
          ...config.twitch,
          oauth: `oauth:${data.access_token}`,
          bearerToken: data.access_token,
          refreshToken: data.refresh_token || refreshToken,
        },
      };

      await saveConfig(updatedConfig);
      return data.access_token;
    } else {
      log.error('Failed to refresh Twitch token:', data);
      return null;
    }
  } catch (err) {
    log.error('Error during Twitch token refresh:', err);
    return null;
  }
}

// ==============================================
//                    Exports
// ==============================================

module.exports = refreshTwitchToken;

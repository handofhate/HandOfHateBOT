// ==============================================
//                  voidInfo.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const version = require('../version');

// ==============================================
//                  Info Content
// ==============================================

const voidInfo = {
  title: 'About VOiD',
  content: `
<h2 style="text-align:center;">Welcome to the VOiD.</h2>
<br>
<div style="text-align:center;">
  VOiD is your all-in-one control hub for stream automation and chat integration.
  <br><br>
  Built for streamers who want precision tools without bloated software.
  <br><br><br>
  <strong>What VOiD does best:</strong>
  <br><br>
</div>

<div style="text-align:center;">
  <ul style="display: inline-block; text-align: left;">
    <li>Philips Hue lighting integration</li>
    <li>Timed OBS source toggling</li>
    <li>Game clip auto-posting to Discord</li>
    <li>Stream sound effects & alerts</li>
    <li>Customizable chat commands</li>
    <li>Testing modes for off-stream setup</li>
    <li>Manual Command input directly to VOiD</li>
    <li>Game-ready Twitch chat overlays</li>
    <li>Customizable and responsive Dashboard</li>
    <li>Module reordering and hiding</li>
    <li>OBS Dockable window generation</li>
  </ul>
</div>

<br>

<h3 style="text-align:center;">Made by a streamer. For streamers.</h3>
<br>
<div style="text-align:center; font-size: 0.9rem;">
  Version: <code>${version}</code><br>
  Created by <strong>Ty</strong> (aka <em>handofhate</em>)<br><br><br>
  Questions? Suggestions? Bugs?<br>
  Join our Discord or contact me via the links below.
</div>

<br>

---

<div id="void-social-buttons" style="margin-top: 2rem;"></div>
  `,
};

module.exports = voidInfo;

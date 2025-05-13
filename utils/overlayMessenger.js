// ==============================================
//              overlayMessenger.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

let overlayWindow = null;

// ==============================================
//               Overlay Management
// ==============================================

function setOverlayWindow(win) {
  overlayWindow = win;
}

function sendToOverlay(payload) {
  if (overlayWindow && overlayWindow.webContents) {
    overlayWindow.webContents.send('chat-message', payload);
  }
}

// ==============================================
//                    Exports
// ==============================================

module.exports = {
  setOverlayWindow,
  sendToOverlay,
};

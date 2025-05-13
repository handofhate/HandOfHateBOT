// ==============================================
//                  build-css.js
// ==============================================

// ==============================================
//                 Initial Setup
// ==============================================

const { exec } = require('child_process');
const path = require('path');

const tailwindPath = path.join(__dirname, 'node_modules', '.bin', 'tailwindcss');

exec(`"${tailwindPath}" -i ./gui/input.css -o ./gui/style.css`, (err, stdout, stderr) => {
  if (err) {
    console.error('❌ Error:', stderr || err);
  } else {
    console.log('✅ CSS built successfully!');
    console.log(stdout);
  }
});

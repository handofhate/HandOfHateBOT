const { exec } = require("child_process");
const path = require("path");

const tailwindPath = path.join(__dirname, "node_modules", "tailwindcss", "lib", "cli.js");

exec(
  `node "${tailwindPath}" -i ./gui/input.css -o ./gui/style.css`,
  (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Error:", stderr || err);
    } else {
      console.log(stdout);
    }
  }
);

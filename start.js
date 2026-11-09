// Starts the web server and Telegram bot in one Render Web Service.
const { spawn } = require("node:child_process");
const children = [
  spawn(process.execPath, ["server.js"], { stdio: "inherit" }),
  spawn(process.execPath, ["bot.js"], { stdio: "inherit" })
];
function stop(code=0) { for (const child of children) child.kill("SIGTERM"); process.exit(code); }
for (const child of children) child.on("exit", (code) => { if (code && code !== 0) stop(code); });
process.on("SIGTERM", () => stop(0));
process.on("SIGINT", () => stop(0));

const fs = require("fs/promises");
const path = require("path");

const SETTINGS_FILE = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "settings.json"
);

async function getSettings() {
  const data = await fs.readFile(SETTINGS_FILE, "utf8");
  return JSON.parse(data);
}

async function saveSettings(settings) {
  await fs.writeFile(
    SETTINGS_FILE,
    JSON.stringify(settings, null, 2),
    "utf8"
  );

  return settings;
}

module.exports = {
  getSettings,
  saveSettings
};
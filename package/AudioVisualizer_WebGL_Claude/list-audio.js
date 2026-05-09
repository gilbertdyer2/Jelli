/**
 * Scans the AudioFiles directory for .wav files and writes audioFileList.json.
 * Run with: node list-audio.js
 * The visualizer page fetches this list to populate the file selection menu.
 */

const fs = require("fs");
const path = require("path");

const audioDir = path.join(__dirname, "AudioFiles");
const outFile = path.join(__dirname, "audioFileList.json");

if (!fs.existsSync(audioDir)) {
  console.error("AudioFiles directory not found.");
  process.exit(1);
}

const names = fs.readdirSync(audioDir);
const wavFiles = names
  .filter((n) => n.toLowerCase().endsWith(".wav"))
  .sort()
  .map((n) => "AudioFiles/" + n);

fs.writeFileSync(outFile, JSON.stringify(wavFiles, null, 2), "utf8");
console.log("Wrote " + wavFiles.length + " .wav paths to " + outFile);

const fs = require("fs");
const path = require("path");

function getPath(file) {
  return path.join(__dirname, "..", "data", file);
}

function readJSON(file) {
  const filePath = getPath(file);
  if (!fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data || "{}");
}

function writeJSON(file, data) {
  const filePath = getPath(file);
  const tempPath = filePath + ".tmp";

  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempPath, filePath);
}

module.exports = { readJSON, writeJSON };


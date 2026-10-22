const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const files = [
  'js/config.js',
  'js/crypto.js',
  'js/audio.js',
  'js/storage.js',
  'js/challenges.js',
  'js/terminal-simulator.js',
  'js/supabase-client.js',
  'js/app.js'
];

let bundle = '/* SHALL WE PLAY A GAME — BUNDLED SPA RUNTIME */\n(function() {\n"use strict";\n\n';

for (const relFile of files) {
  const filePath = path.join(rootDir, relFile);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/^import\s+.*?;?\s*$/gm, '');
  content = content.replace(/^export\s+default\s+/gm, '');
  content = content.replace(/^export\s+(const|let|var|function|class)\s+/gm, (_match, p1) => p1 + ' ');
  bundle += '// --- File: ' + relFile + ' ---\n' + content + '\n\n';
}

bundle += '})();\n';

const bundlePath = path.join(rootDir, 'js/bundle.js');
fs.writeFileSync(bundlePath, bundle, 'utf8');
console.log('Successfully generated ' + bundlePath + ' (' + fs.statSync(bundlePath).size + ' bytes)');

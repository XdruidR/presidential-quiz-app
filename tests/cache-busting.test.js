const assert = require('assert');
const fs = require('fs');
const path = require('path');

const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(index, /href="style\.css\?v=[^"]+"/, 'index.html must version style.css to avoid stale mobile webview cache');
assert.match(index, /src="script\.js\?v=[^"]+"/, 'index.html must version script.js to avoid stale mobile webview cache');
assert.match(script, /fetch\(`questions\.json\?v=\$\{APP_VERSION\}`\)/, 'script.js must version questions.json fetch');
assert.match(script, /const APP_VERSION = '[^']+';/, 'script.js must define APP_VERSION');

console.log('cache-busting tests passed');

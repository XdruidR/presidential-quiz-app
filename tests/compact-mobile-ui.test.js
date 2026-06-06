const assert = require('assert');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.ok(script.includes("lbl.className = 'affect-option'"), 'affect labels should use compact pill class');
assert.ok(script.includes('lbl.appendChild(rb)'), 'radio input should be inside its pill label');
assert.ok(css.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'), 'affect choices should fit in a compact 3-column row');
assert.ok(css.includes('position: sticky'), 'navigation should stay reachable while using less vertical space');
assert.ok(css.includes('--card-gap'), 'quiz spacing should be centralized for compact tuning');

console.log('compact-mobile-ui tests passed');

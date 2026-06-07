const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.match(index, /id="landing-container"/, 'landing page must exist before the quiz');
assert.match(index, /Pasear con un perro en el parque/, 'landing page should include the non-political dog/cat example');
assert.match(index, /id="quiz-container" class="hidden"/, 'quiz should be hidden before the user starts');
assert.match(index, /id="start-quiz-btn"/, 'landing page must have a start button');

assert.ok(script.includes('function showLanding()'), 'script should explicitly show the landing state');
assert.ok(script.includes('function startQuiz()'), 'script should start quiz from the landing screen');
assert.ok(script.includes("sliderInput.className = 'slider vertical-slider'"), 'question slider should use vertical slider class');
assert.ok(script.includes('appendPdfExportControls(resultsContainer, results)'), 'results should render PDF export controls');
assert.ok(script.includes('window.print()'), 'PDF export should use browser print-to-PDF');

assert.match(css, /#navigation\.hidden/, 'hidden navigation should override the #navigation display rule');
assert.match(css, /\.vertical-preference/, 'vertical preference rail should be styled');
assert.match(css, /\.preference-arrow/, 'direction arrows should be styled');
assert.match(css, /@media print/, 'print/PDF summary should have print styles');

function noopElement() {
  return {
    dataset: {},
    style: {
      values: {},
      setProperty(name, value) { this.values[name] = value; },
    },
    className: '',
    classList: { add() {}, remove() {} },
    appendChild() {},
    addEventListener() {},
    setAttribute() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    set innerHTML(value) { this.html = value; },
    get innerHTML() { return this.html || ''; },
    set textContent(value) { this.text = value; },
    get textContent() { return this.text || ''; },
  };
}

const context = {
  console,
  window: { addEventListener() {}, print() {} },
  document: {
    getElementById() { return noopElement(); },
    createElement() { return noopElement(); },
  },
};
vm.createContext(context);
vm.runInContext(script, context);

const slider = { value: '2' };
const optionA = noopElement();
const optionB = noopElement();
const rail = noopElement();
context.updateSliderVisualState(slider, optionA, optionB, rail);
assert.strictEqual(rail.dataset.choice, 'a');
assert.strictEqual(optionA.dataset.active, 'true');
assert.strictEqual(optionB.dataset.active, 'false');

slider.value = '8';
context.updateSliderVisualState(slider, optionA, optionB, rail);
assert.strictEqual(rail.dataset.choice, 'b');
assert.strictEqual(optionA.dataset.active, 'false');
assert.strictEqual(optionB.dataset.active, 'true');

slider.value = '5';
context.updateSliderVisualState(slider, optionA, optionB, rail);
assert.strictEqual(rail.dataset.choice, 'neutral');
assert.strictEqual(optionA.dataset.active, 'false');
assert.strictEqual(optionB.dataset.active, 'false');

console.log('landing, vertical slider, and PDF tests passed');

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

assert.match(index, /demo-preference/, 'landing example should use the same side slider layout as real questions');
assert.doesNotMatch(index, /Ejemplo: mover hacia Opción A" disabled|Ejemplo de selector centrado" disabled|Ejemplo: mover hacia Opción B" disabled/, 'landing example slider should be interactive, not disabled');
assert.doesNotMatch(index + script, /A \/ 0|Neutral \/ 5|B \/ 10|>5<|textContent = '5'/, 'slider UI should not expose numeric scoring labels');
assert.ok(script.includes('function showLanding()'), 'script should explicitly show the landing state');
assert.ok(script.includes('function startQuiz()'), 'script should start quiz from the landing screen');
assert.ok(script.includes("const pageIntro = document.querySelector?.('.intro')"), 'page intro should be controlled separately from the quiz');
assert.ok(script.includes("pageIntro?.classList.add('hidden')"), 'page intro should be hidden after the first screen');
assert.doesNotMatch(index, /Esta herramienta presenta dilemas reales/, 'landing intro should stay short');
assert.ok(script.includes('function initLandingDemoControls()'), 'landing demo slider should have its own interactive controls');
assert.ok(script.includes('function buildProgressTracker(index, total)'), 'quiz should show a progress tracker');
assert.ok(script.includes('quizContainer.appendChild(progressEl)'), 'progress tracker should render above each question');
assert.ok(script.includes("verticalPreference.className = 'vertical-preference side-preference'"), 'question slider rail should sit beside the option cards');
assert.ok(script.includes("arrowUp.addEventListener('click', () => adjustSlider(-1))"), 'up arrow should move toward option A');
assert.ok(script.includes("arrowDown.addEventListener('click', () => adjustSlider(1))"), 'down arrow should move toward option B');
assert.match(css, /direction: ltr;/, 'native vertical slider should not invert arrow movement');
assert.doesNotMatch(css, /direction: rtl;/, 'rtl direction makes the down arrow move the thumb upward in Chrome');
assert.ok(script.includes('appendPdfExportControls(resultsContainer, results)'), 'results should render PDF export controls');
assert.ok(script.includes('window.print()'), 'PDF export should use browser print-to-PDF');

assert.match(css, /#navigation\.hidden/, 'hidden navigation should override the #navigation display rule');
assert.match(css, /grid-template-columns: 58px minmax\(0, 1fr\)/, 'slider rail should use a narrow left column beside the option cards');
assert.match(css, /grid-row: 1 \/ 3/, 'slider rail should span both option card rows');
assert.match(css, /\.preference-arrow/, 'direction arrows should be styled');
assert.match(css, /\.progress-tracker/, 'progress tracker should be styled');
assert.match(css, /\.progress-fill/, 'progress bar fill should be styled');
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
    querySelector() { return noopElement(); },
    createElement() { return noopElement(); },
  },
};
vm.createContext(context);
vm.runInContext(script, context);

const slider = { value: '2', setAttribute(name, value) { this[name] = value; } };
const optionA = noopElement();
const optionB = noopElement();
const rail = noopElement();
context.updateSliderVisualState(slider, optionA, optionB, rail);
assert.strictEqual(rail.dataset.choice, 'a');
assert.strictEqual(rail.dataset.centered, 'false');
assert.strictEqual(slider['aria-valuetext'], 'Hacia Opción A');
assert.strictEqual(optionA.dataset.active, 'true');
assert.strictEqual(optionB.dataset.active, 'false');

slider.value = '8';
context.updateSliderVisualState(slider, optionA, optionB, rail);
assert.strictEqual(rail.dataset.choice, 'b');
assert.strictEqual(rail.dataset.centered, 'false');
assert.strictEqual(slider['aria-valuetext'], 'Hacia Opción B');
assert.strictEqual(optionA.dataset.active, 'false');
assert.strictEqual(optionB.dataset.active, 'true');

slider.value = '5';
context.updateSliderVisualState(slider, optionA, optionB, rail);
assert.strictEqual(rail.dataset.choice, 'neutral');
assert.strictEqual(rail.dataset.centered, 'true');
assert.strictEqual(slider['aria-valuetext'], 'Centro');
assert.strictEqual(optionA.dataset.active, 'false');
assert.strictEqual(optionB.dataset.active, 'false');

console.log('landing, vertical slider, and PDF tests passed');

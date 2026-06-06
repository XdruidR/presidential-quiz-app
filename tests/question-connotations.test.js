const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScriptContext() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
  const noopElement = () => {
    let text = '';
    return {
      className: '',
      classList: { add() {}, remove() {} },
      appendChild() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {},
      set innerHTML(value) { text = value; },
      get innerHTML() { return text; },
      set textContent(value) { text = value; },
      get textContent() { return text; },
    };
  };
  const context = {
    console,
    window: { addEventListener() {} },
    document: {
      getElementById() { return noopElement(); },
      createElement() { return noopElement(); },
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

const context = loadScriptContext();
const questions = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'questions.json'), 'utf8'));

const forbiddenBeforeResults = /Cepeda|Espriella|izquierda|derecha|progresista|conservador|conservadora|liberal|estatista|mercado|socialista/i;

for (const q of questions) {
  assert.ok(q.left_connotation, `${q.id} missing left_connotation`);
  assert.ok(q.right_connotation, `${q.id} missing right_connotation`);
  assert.ok(q.left_connotation.length >= 45, `${q.id} left_connotation too short`);
  assert.ok(q.right_connotation.length >= 45, `${q.id} right_connotation too short`);
  assert.ok(!forbiddenBeforeResults.test(q.left_connotation), `${q.id} left_connotation leaks cue: ${q.left_connotation}`);
  assert.ok(!forbiddenBeforeResults.test(q.right_connotation), `${q.id} right_connotation leaks cue: ${q.right_connotation}`);
}

assert.strictEqual(
  context.buildOptionCardHtml('Opción A', 'Reducir impuestos', 'Puede acelerar inversión, pero reduce recursos públicos.'),
  '<span class="option-marker">Opción A</span><span>Reducir impuestos</span><details class="option-hint"><summary aria-label="Ver matiz de la Opción A">ℹ️</summary><span>Puede acelerar inversión, pero reduce recursos públicos.</span></details>'
);

console.log('question-connotations tests passed');

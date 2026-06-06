const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadScriptContext() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
  const noopElement = () => ({
    className: '',
    classList: { add() {}, remove() {} },
    appendChild() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    set innerHTML(value) {},
    get innerHTML() { return ''; },
    set textContent(value) {},
    get textContent() { return ''; },
  });
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

assert.strictEqual(context.getAffectWeight('Me afecta mucho'), 2);
assert.strictEqual(context.getAffectWeight('Me afecta algo'), 1);
assert.strictEqual(context.getAffectWeight('No me afecta/no sé'), 0.5);

const sampleQuestions = [
  { candidate_alignment_left: 'A', candidate_alignment_right: 'B', theme: 'Tema 1' },
  { candidate_alignment_left: 'A', candidate_alignment_right: 'B', theme: 'Tema 1' },
];
const sampleResponses = [
  { value: 0, affect: 'No me afecta/no sé' },
  { value: 1, affect: 'Me afecta mucho' },
];

const unweighted = context.calculateAffinityResults(sampleQuestions, sampleResponses, false);
assert.strictEqual(unweighted.candidatePercentages.A, 50);
assert.strictEqual(unweighted.candidatePercentages.B, 50);

const weighted = context.calculateAffinityResults(sampleQuestions, sampleResponses, true);
assert.strictEqual(weighted.candidatePercentages.A, 20);
assert.strictEqual(weighted.candidatePercentages.B, 80);
assert.strictEqual(weighted.weighted, true);

console.log('weighted-results tests passed');

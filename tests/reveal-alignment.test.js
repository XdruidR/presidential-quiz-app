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
      style: {},
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

const sampleQuestion = {
  id: 'Q01',
  title: '¿Priorizar gasto social o disciplina fiscal?',
  dimension: 'economía',
  candidate_alignment_left: 'Cepeda',
  candidate_alignment_right: 'De La Espriella',
  alignment_confidence: 'high',
};

const bubble = context.getQuestionBubbleModel(sampleQuestion, { value: 0.8, affect: 'Me afecta mucho' }, 0);
assert.strictEqual(bubble.number, 1);
assert.strictEqual(bubble.position, 80);
assert.strictEqual(bubble.size, 44);
assert.strictEqual(bubble.emoji, '💸');
assert.strictEqual(bubble.leaningCandidate, 'De La Espriella');

const concealed = context.buildCandidateRevealCopy(false);
assert.ok(!/Cepeda|Espriella/.test(concealed.heading), 'concealed heading must not mention candidates');
assert.ok(/oculta/i.test(concealed.note), 'concealed note should explain alignment is hidden');

const revealed = context.buildCandidateRevealCopy(true);
assert.ok(/revelada/i.test(revealed.heading), 'revealed heading should indicate reveal state');
assert.ok(/candidato/i.test(revealed.note), 'revealed note should mention candidate mapping');

console.log('reveal-alignment tests passed');

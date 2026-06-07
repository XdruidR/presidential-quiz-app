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
const scriptSource = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.strictEqual(context.getQuestionDimension({ dimension: 'security', theme: 'Seguridad' }), 'security');
assert.strictEqual(context.getQuestionDimension({ theme: 'Política fiscal y gasto social' }), 'Política fiscal y gasto social');

const questions = [
  { id: 'Q01', dimension: 'economy', candidate_alignment_left: 'Cepeda', candidate_alignment_right: 'De La Espriella' },
  { id: 'Q02', dimension: 'economy', candidate_alignment_left: 'Cepeda', candidate_alignment_right: 'De La Espriella' },
  { id: 'Q03', dimension: 'security', candidate_alignment_left: 'De La Espriella', candidate_alignment_right: 'Cepeda' },
  { id: 'Q04', dimension: 'institutionality', alignment_confidence: 'low', candidate_alignment_left: 'Unclear', candidate_alignment_right: 'Unclear' },
];
const responses = [
  { value: 0, affect: 'Me afecta algo' },
  { value: 1, affect: 'Me afecta algo' },
  { value: 0, affect: 'Me afecta algo' },
  { value: 0.5, affect: 'No me afecta/no sé' },
];
const results = context.calculateAffinityResults(questions, responses, false);
assert.strictEqual(results.dimensionPercentages.economy.Cepeda, 50);
assert.strictEqual(results.dimensionPercentages.economy['De La Espriella'], 50);
assert.strictEqual(results.dimensionPercentages.security['De La Espriella'], 100);

const lowConfidence = context.getLowConfidenceQuestions(questions);
assert.deepStrictEqual(lowConfidence.map((q) => q.id), ['Q04']);

assert(scriptSource.includes('Preguntas con evidencia menos directa'));
assert(scriptSource.includes('Solidez de la evidencia'));
assert(scriptSource.includes('alineaciones aproximadas basadas en temas relacionados'));
assert(scriptSource.includes('li.textContent = `${q.id}: ${q.title}`;'));
assert(!scriptSource.includes('— confianza ${formatConfidence(q.alignment_confidence)}'));
assert(!scriptSource.includes('correspondencia inferida'));
assert(!scriptSource.includes('son inferidas'));
assert(!scriptSource.includes('es inferida, débil'));

console.log('result-transparency tests passed');

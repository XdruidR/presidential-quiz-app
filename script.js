// script.js – controla la lógica del cuestionario

/*
 * Este archivo implementa una aplicación de preguntas y respuestas que utiliza
 * un archivo JSON con los dilemas políticos. Las preguntas se presentan al
 * usuario sin indicar qué candidato está asociado a cada extremo del control
 * deslizante. Al terminar, se calcula la afinidad aproximada con cada
 * candidato y se muestran los resultados por tema.
 */

// Variables globales para almacenar preguntas y respuestas
const APP_VERSION = 'ux-side-slider-1';
let questions = [];
let currentIndex = 0;
let useWeightedResults = false;
let revealCandidateAlignment = false;
const responses = [];

// Referencias a elementos del DOM
const landingContainer = document.getElementById('landing-container');
const startQuizBtn = document.getElementById('start-quiz-btn');
const quizContainer = document.getElementById('quiz-container');
const navigation = document.getElementById('navigation');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const resultsContainer = document.getElementById('results-container');

// Inicialización
window.addEventListener('DOMContentLoaded', async () => {
  await loadQuestions();
  showLanding();
});

function showLanding() {
  if (landingContainer) {
    landingContainer.classList.remove('hidden');
  }
  quizContainer.classList.add('hidden');
  navigation.classList.add('hidden');
  resultsContainer.classList.add('hidden');
}

function startQuiz() {
  if (questions.length === 0) {
    return;
  }
  if (landingContainer) {
    landingContainer.classList.add('hidden');
  }
  navigation.classList.remove('hidden');
  showQuestion(0);
}

if (startQuizBtn) {
  startQuizBtn.addEventListener('click', startQuiz);
}

// Cargar preguntas del archivo JSON y randomizar la orientación
async function loadQuestions() {
  try {
    const response = await fetch(`questions.json?v=${APP_VERSION}`);
    const data = await response.json();
    questions = data.map((q) => {
      // Clonar el objeto para no modificar el original
      const question = { ...q };
      // Randomizar la orientación izquierda/derecha
      if (Math.random() < 0.5) {
        // Intercambiar etiquetas y alineaciones
        [question.left_label, question.right_label] = [q.right_label, q.left_label];
        [question.left_cost_or_risk, question.right_cost_or_risk] = [q.right_cost_or_risk, q.left_cost_or_risk];
        [question.left_connotation, question.right_connotation] = [q.right_connotation, q.left_connotation];
        [question.candidate_alignment_left, question.candidate_alignment_right] = [q.candidate_alignment_right, q.candidate_alignment_left];
      }
      return question;
    });
  } catch (error) {
    console.error('Error al cargar el archivo de preguntas:', error);
  }
}

// Mostrar una pregunta por índice
function showQuestion(index) {
  if (landingContainer) {
    landingContainer.classList.add('hidden');
  }
  quizContainer.classList.remove('hidden');
  navigation.classList.remove('hidden');
  resultsContainer.classList.add('hidden');
  const question = questions[index];
  currentIndex = index;
  quizContainer.innerHTML = '';
  resultsContainer.classList.add('hidden');

  // Crear elementos para la pregunta
  const titleEl = document.createElement('div');
  titleEl.className = 'question-title';
  titleEl.textContent = `${index + 1}. ${question.title}`;

  const introEl = document.createElement('div');
  introEl.className = 'question-text';
  introEl.textContent = question.plain_language_intro;

  // Slider
  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'slider-container';

  const optionA = document.createElement('div');
  optionA.className = 'option-card option-a';
  optionA.innerHTML = buildOptionCardHtml('Opción A', question.left_label, question.left_connotation);

  const optionB = document.createElement('div');
  optionB.className = 'option-card option-b';
  optionB.innerHTML = buildOptionCardHtml('Opción B', question.right_label, question.right_connotation);

  const sliderInput = document.createElement('input');
  sliderInput.type = 'range';
  sliderInput.min = '0';
  sliderInput.max = '10';
  sliderInput.step = '1';
  sliderInput.value = responses[index] ? responses[index].value * 10 : 5; // valor medio por defecto
  sliderInput.className = 'slider vertical-slider';
  sliderInput.setAttribute('aria-label', 'Selector vertical de preferencia: arriba Opción A, abajo Opción B');

  const verticalPreference = document.createElement('div');
  verticalPreference.className = 'vertical-preference side-preference';

  const arrowUp = document.createElement('button');
  arrowUp.type = 'button';
  arrowUp.className = 'preference-arrow arrow-up';
  arrowUp.textContent = '↑';
  arrowUp.setAttribute('aria-label', 'Mover preferencia hacia Opción A');

  const arrowDown = document.createElement('button');
  arrowDown.type = 'button';
  arrowDown.className = 'preference-arrow arrow-down';
  arrowDown.textContent = '↓';
  arrowDown.setAttribute('aria-label', 'Mover preferencia hacia Opción B');

  const sliderRail = document.createElement('div');
  sliderRail.className = 'vertical-slider-rail';
  const neutralChip = document.createElement('span');
  neutralChip.className = 'neutral-chip';
  neutralChip.textContent = '5';
  sliderRail.appendChild(sliderInput);
  sliderRail.appendChild(neutralChip);

  verticalPreference.appendChild(arrowUp);
  verticalPreference.appendChild(sliderRail);
  verticalPreference.appendChild(arrowDown);

  const scaleLabels = document.createElement('div');
  scaleLabels.className = 'scale-labels vertical-scale-labels';
  scaleLabels.innerHTML = '<span>A / 0</span><span>Neutral / 5</span><span>B / 10</span>';

  const adjustSlider = (delta) => {
    const nextValue = Math.max(Number(sliderInput.min), Math.min(Number(sliderInput.max), Number(sliderInput.value) + delta));
    sliderInput.value = String(nextValue);
    updateSliderVisualState(sliderInput, optionA, optionB, verticalPreference);
  };

  arrowUp.addEventListener('click', () => adjustSlider(-1));
  arrowDown.addEventListener('click', () => adjustSlider(1));

  sliderContainer.appendChild(verticalPreference);
  sliderContainer.appendChild(optionA);
  sliderContainer.appendChild(optionB);
  sliderContainer.appendChild(scaleLabels);

  updateSliderVisualState(sliderInput, optionA, optionB, verticalPreference);
  sliderInput.addEventListener('input', () => updateSliderVisualState(sliderInput, optionA, optionB, verticalPreference));

  // Radio buttons para nivel de afectación
  const affectContainer = document.createElement('div');
  affectContainer.className = 'affect-container';
  affectContainer.style.marginTop = '12px';
  const affectLabel = document.createElement('span');
  affectLabel.textContent = '¿Qué tanto te afecta este tema? ';
  affectContainer.appendChild(affectLabel);
  const affects = ['Me afecta mucho', 'Me afecta algo', 'No me afecta/no sé'];
  affects.forEach((text, i) => {
    const id = `affect-${index}-${i}`;
    const rb = document.createElement('input');
    rb.type = 'radio';
    rb.name = `affect-${index}`;
    rb.id = id;
    rb.value = text;
    if (responses[index] && responses[index].affect === text) {
      rb.checked = true;
    } else if (!responses[index] && i === 2) {
      // por defecto seleccionar "No me afecta"
      rb.checked = true;
    }
    const lbl = document.createElement('label');
    lbl.htmlFor = id;
    lbl.className = 'affect-option';
    const labelText = document.createElement('span');
    labelText.textContent = text;
    lbl.appendChild(rb);
    lbl.appendChild(labelText);
    affectContainer.appendChild(lbl);
  });

  // Información extra
  const infoEl = document.createElement('div');
  infoEl.className = 'info-text';
  infoEl.textContent = `Tema: ${question.theme}`;

  // Agregar al contenedor
  quizContainer.appendChild(titleEl);
  quizContainer.appendChild(introEl);
  quizContainer.appendChild(sliderContainer);
  quizContainer.appendChild(affectContainer);
  quizContainer.appendChild(infoEl);

  // Ajustar botones
  prevBtn.disabled = index === 0;
  nextBtn.textContent = index === questions.length - 1 ? 'Finalizar' : 'Siguiente';
}

function updateSliderVisualState(sliderInput, optionA, optionB, verticalPreference) {
  const rawValue = Number(sliderInput.value || 5);
  const normalized = rawValue / 10;
  const strength = Math.abs(normalized - 0.5) * 2;
  const choice = rawValue < 5 ? 'a' : rawValue > 5 ? 'b' : 'neutral';
  verticalPreference.dataset.choice = choice;
  verticalPreference.style.setProperty('--preference-strength', strength.toFixed(2));
  optionA.dataset.active = choice === 'a' ? 'true' : 'false';
  optionB.dataset.active = choice === 'b' ? 'true' : 'false';
  optionA.style.setProperty('--option-emphasis', choice === 'a' ? strength.toFixed(2) : '0');
  optionB.style.setProperty('--option-emphasis', choice === 'b' ? strength.toFixed(2) : '0');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function buildOptionCardHtml(marker, label, connotation) {
  const escapedMarker = escapeHtml(marker);
  const hint = connotation
    ? `<details class="option-hint"><summary aria-label="Ver matiz de la ${escapedMarker}">ℹ️</summary><span>${escapeHtml(connotation)}</span></details>`
    : '';
  return `<span class="option-marker">${escapedMarker}</span><span>${escapeHtml(label)}</span>${hint}`;
}

function formatWeight(value) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace('.', ',');
}

function getQuestionDimension(question) {
  return question.dimension || question.theme || 'Sin dimensión';
}

function getDimensionEmoji(dimension) {
  const text = (dimension || '').toLowerCase();
  if (text.includes('econom')) return '💸';
  if (text.includes('seguridad') || text.includes('justicia')) return '🛡️';
  if (text.includes('territorio') || text.includes('rural')) return '🌱';
  if (text.includes('energ')) return '⚡';
  if (text.includes('institu')) return '🏛️';
  if (text.includes('exterior')) return '🌎';
  if (text.includes('social') || text.includes('educ')) return '🎓';
  return '✨';
}

function getQuestionBubbleModel(question, response, index) {
  const value = response ? response.value : 0.5;
  const affect = response ? response.affect : 'No me afecta/no sé';
  const weight = getAffectWeight(affect);
  let leaningCandidate = 'Mixto / neutral';
  if (value < 0.45 && question.candidate_alignment_left !== 'Unclear') {
    leaningCandidate = question.candidate_alignment_left;
  } else if (value > 0.55 && question.candidate_alignment_right !== 'Unclear') {
    leaningCandidate = question.candidate_alignment_right;
  }
  return {
    number: index + 1,
    position: Math.round(value * 100),
    size: Math.round(28 + weight * 8),
    emoji: getDimensionEmoji(getQuestionDimension(question)),
    confidence: formatConfidence(question.alignment_confidence),
    leaningCandidate,
  };
}

function buildCandidateRevealCopy(revealed) {
  return revealed
    ? {
        heading: 'Afinidad revelada',
        note: 'Ahora ves cómo se mueven tus respuestas hacia cada candidato. Esto sigue siendo una lectura aproximada, no una recomendación de voto.',
      }
    : {
        heading: 'Tus respuestas, todavía sin candidatos',
        note: 'La alineación está oculta por defecto. Primero mira tu propio patrón de preferencias; luego puedes revelar la lectura por candidato.',
      };
}

function isLowConfidenceQuestion(question) {
  const confidence = (question.alignment_confidence || '').toLowerCase();
  return confidence === 'low' || question.candidate_alignment_left === 'Unclear' || question.candidate_alignment_right === 'Unclear';
}

function getLowConfidenceQuestions(sourceQuestions) {
  return sourceQuestions.filter(isLowConfidenceQuestion);
}

function formatConfidence(confidence) {
  const labels = {
    high: 'alta',
    medium: 'media',
    low: 'baja',
    mixed: 'mixta',
    unclear: 'sin claridad',
  };
  return labels[(confidence || '').toLowerCase()] || confidence || 'sin claridad';
}

// Manejar clic en «Siguiente»
nextBtn.addEventListener('click', () => {
  handleNavigation(1);
});

// Manejar clic en «Anterior»
prevBtn.addEventListener('click', () => {
  handleNavigation(-1);
});

function handleNavigation(direction) {
  // Guardar la respuesta actual antes de cambiar
  saveCurrentResponse();

  const newIndex = currentIndex + direction;
  if (newIndex < 0 || newIndex > questions.length) {
    return;
  }
  if (newIndex === questions.length) {
    // Mostrar resultados
    showResults();
    navigation.classList.add('hidden');
    quizContainer.innerHTML = '';
    return;
  }
  showQuestion(newIndex);
}

// Guardar la respuesta de la pregunta actual
function saveCurrentResponse() {
  const slider = quizContainer.querySelector('input[type="range"]');
  if (!slider) {
    return;
  }
  const value = parseInt(slider.value, 10) / 10; // convertir 0–10 a 0–1
  // Nivel de afectación
  const affectRadios = quizContainer.querySelectorAll('.affect-container input[type="radio"]');
  let affect = null;
  affectRadios.forEach((rb) => {
    if (rb.checked) {
      affect = rb.value;
    }
  });
  responses[currentIndex] = { value, affect };
}

function getAffectWeight(affect) {
  const weights = {
    'Me afecta mucho': 2,
    'Me afecta algo': 1,
    'No me afecta/no sé': 0.5,
  };
  return weights[affect] || 0.5;
}

function calculateAffinityResults(sourceQuestions, sourceResponses, weighted = false) {
  const candidateScores = {};
  const candidateDenominators = {};
  const candidateQuestionCounts = {};
  const themeScores = {};
  const themeDenominators = {};
  const themeQuestionCounts = {};
  const dimensionScores = {};
  const dimensionDenominators = {};
  const dimensionQuestionCounts = {};

  sourceQuestions.forEach((q, i) => {
    const resp = sourceResponses[i] || { value: 0.5, affect: 'No me afecta/no sé' };
    const value = resp.value;
    const factor = weighted ? getAffectWeight(resp.affect) : 1;
    const optionACand = q.candidate_alignment_left;
    const optionBCand = q.candidate_alignment_right;
    const theme = q.theme;
    const dimension = getQuestionDimension(q);

    if (optionACand && optionACand !== 'Unclear') {
      candidateScores[optionACand] = (candidateScores[optionACand] || 0) + (1 - value) * factor;
      candidateDenominators[optionACand] = (candidateDenominators[optionACand] || 0) + factor;
      candidateQuestionCounts[optionACand] = (candidateQuestionCounts[optionACand] || 0) + 1;
    }
    if (optionBCand && optionBCand !== 'Unclear') {
      candidateScores[optionBCand] = (candidateScores[optionBCand] || 0) + value * factor;
      candidateDenominators[optionBCand] = (candidateDenominators[optionBCand] || 0) + factor;
      candidateQuestionCounts[optionBCand] = (candidateQuestionCounts[optionBCand] || 0) + 1;
    }

    if (theme) {
      themeScores[theme] = themeScores[theme] || {};
      themeDenominators[theme] = themeDenominators[theme] || {};
      themeQuestionCounts[theme] = themeQuestionCounts[theme] || {};
      if (optionACand && optionACand !== 'Unclear') {
        themeScores[theme][optionACand] = (themeScores[theme][optionACand] || 0) + (1 - value) * factor;
        themeDenominators[theme][optionACand] = (themeDenominators[theme][optionACand] || 0) + factor;
        themeQuestionCounts[theme][optionACand] = (themeQuestionCounts[theme][optionACand] || 0) + 1;
      }
      if (optionBCand && optionBCand !== 'Unclear') {
        themeScores[theme][optionBCand] = (themeScores[theme][optionBCand] || 0) + value * factor;
        themeDenominators[theme][optionBCand] = (themeDenominators[theme][optionBCand] || 0) + factor;
        themeQuestionCounts[theme][optionBCand] = (themeQuestionCounts[theme][optionBCand] || 0) + 1;
      }
    }

    if (dimension) {
      dimensionScores[dimension] = dimensionScores[dimension] || {};
      dimensionDenominators[dimension] = dimensionDenominators[dimension] || {};
      dimensionQuestionCounts[dimension] = dimensionQuestionCounts[dimension] || {};
      if (optionACand && optionACand !== 'Unclear') {
        dimensionScores[dimension][optionACand] = (dimensionScores[dimension][optionACand] || 0) + (1 - value) * factor;
        dimensionDenominators[dimension][optionACand] = (dimensionDenominators[dimension][optionACand] || 0) + factor;
        dimensionQuestionCounts[dimension][optionACand] = (dimensionQuestionCounts[dimension][optionACand] || 0) + 1;
      }
      if (optionBCand && optionBCand !== 'Unclear') {
        dimensionScores[dimension][optionBCand] = (dimensionScores[dimension][optionBCand] || 0) + value * factor;
        dimensionDenominators[dimension][optionBCand] = (dimensionDenominators[dimension][optionBCand] || 0) + factor;
        dimensionQuestionCounts[dimension][optionBCand] = (dimensionQuestionCounts[dimension][optionBCand] || 0) + 1;
      }
    }
  });

  const candidatePercentages = {};
  for (const cand of Object.keys(candidateScores)) {
    const total = candidateScores[cand];
    const denominator = candidateDenominators[cand];
    candidatePercentages[cand] = denominator > 0 ? Math.round((total / denominator) * 100) : 0;
  }

  const dimensionPercentages = {};
  for (const dimension of Object.keys(dimensionScores)) {
    dimensionPercentages[dimension] = {};
    for (const cand of Object.keys(dimensionScores[dimension])) {
      const total = dimensionScores[dimension][cand];
      const denominator = dimensionDenominators[dimension][cand];
      dimensionPercentages[dimension][cand] = denominator > 0 ? Math.round((total / denominator) * 100) : 0;
    }
  }

  return {
    weighted,
    candidatePercentages,
    candidateQuestionCounts,
    candidateDenominators,
    themeScores,
    themeDenominators,
    themeQuestionCounts,
    dimensionScores,
    dimensionDenominators,
    dimensionQuestionCounts,
    dimensionPercentages,
  };
}

function appendPreferenceMap(target, revealed) {
  const copy = buildCandidateRevealCopy(revealed);
  const section = document.createElement('section');
  section.className = `results-section preference-map ${revealed ? 'is-revealed' : 'is-concealed'}`;

  const header = document.createElement('div');
  header.className = 'section-kicker';
  header.textContent = '🧭 Mapa de respuestas';
  section.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = copy.heading;
  section.appendChild(heading);

  const note = document.createElement('p');
  note.className = 'info-text';
  note.textContent = copy.note;
  section.appendChild(note);

  const rail = document.createElement('div');
  rail.className = 'candidate-rail';
  const leftLabel = document.createElement('span');
  leftLabel.textContent = revealed ? 'Cepeda' : 'Polo A';
  const centerLabel = document.createElement('span');
  centerLabel.textContent = revealed ? 'zona mixta' : 'preferencia propia';
  const rightLabel = document.createElement('span');
  rightLabel.textContent = revealed ? 'De La Espriella' : 'Polo B';
  rail.appendChild(leftLabel);
  rail.appendChild(centerLabel);
  rail.appendChild(rightLabel);
  section.appendChild(rail);

  const cloud = document.createElement('div');
  cloud.className = 'bubble-cloud';
  questions.forEach((q, i) => {
    const model = getQuestionBubbleModel(q, responses[i], i);
    const bubble = document.createElement('button');
    bubble.type = 'button';
    bubble.className = `question-bubble confidence-${(q.alignment_confidence || 'low').toLowerCase()}`;
    bubble.style.left = `clamp(${model.size / 2}px, ${model.position}%, calc(100% - ${model.size / 2}px))`;
    bubble.style.width = `${model.size}px`;
    bubble.style.height = `${model.size}px`;
    bubble.style.animationDelay = `${i * 35}ms`;
    bubble.title = revealed
      ? `P${model.number}: ${model.leaningCandidate} · ${model.confidence}`
      : `P${model.number}: ${q.title}`;
    bubble.innerHTML = `<span>${model.number}</span><small>${model.emoji}</small>`;
    cloud.appendChild(bubble);
  });
  section.appendChild(cloud);
  target.appendChild(section);
}

function appendPdfExportControls(target, results) {
  const section = document.createElement('section');
  section.className = 'results-section pdf-export-section';

  const heading = document.createElement('h2');
  heading.textContent = 'Exportar resumen';
  section.appendChild(heading);

  const note = document.createElement('p');
  note.className = 'info-text';
  note.textContent = revealCandidateAlignment
    ? 'Genera un PDF desde la vista de impresión del navegador con el resumen general, dimensiones y advertencias de confianza.'
    : 'Revela la alineación de candidatos para exportar un resumen con resultados interpretados.';
  section.appendChild(note);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pdf-export-btn';
  button.textContent = 'Exportar resumen en PDF';
  button.disabled = !revealCandidateAlignment;
  button.addEventListener('click', () => window.print());
  section.appendChild(button);

  if (revealCandidateAlignment) {
    const printable = document.createElement('div');
    printable.className = 'printable-summary';
    printable.appendChild(buildPrintableSummary(results));
    section.appendChild(printable);
  }

  target.appendChild(section);
}

function buildPrintableSummary(results) {
  const wrapper = document.createElement('div');
  const title = document.createElement('h2');
  title.textContent = 'Resumen del cuestionario de preferencias';
  wrapper.appendChild(title);

  const warning = document.createElement('p');
  warning.textContent = 'No es una recomendación de voto. Algunas correspondencias son inferidas y deben leerse con cautela.';
  wrapper.appendChild(warning);

  const candidates = Object.entries(results.candidatePercentages || {})
    .sort(([, a], [, b]) => b - a)
    .map(([candidate, percentage]) => `${candidate}: ${percentage} %`);
  const candidateList = document.createElement('ul');
  candidates.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    candidateList.appendChild(li);
  });
  wrapper.appendChild(candidateList);

  const dimensionTitle = document.createElement('h3');
  dimensionTitle.textContent = 'Resumen por dimensión';
  wrapper.appendChild(dimensionTitle);
  const dimensionList = document.createElement('ul');
  Object.entries(results.dimensionPercentages || {}).forEach(([dimension, scores]) => {
    const li = document.createElement('li');
    li.textContent = `${dimension}: Cepeda ${scores.Cepeda ?? '-'} %, De La Espriella ${scores['De La Espriella'] ?? '-'} %`;
    dimensionList.appendChild(li);
  });
  wrapper.appendChild(dimensionList);

  const lowConfidenceCount = getLowConfidenceQuestions(questions).length;
  const lowNote = document.createElement('p');
  lowNote.textContent = `${lowConfidenceCount} preguntas tienen baja confianza o correspondencia inferida.`;
  wrapper.appendChild(lowNote);
  return wrapper;
}

// Calcular y mostrar resultados
function showResults() {
  if (landingContainer) {
    landingContainer.classList.add('hidden');
  }
  quizContainer.classList.add('hidden');
  navigation.classList.add('hidden');
  const results = calculateAffinityResults(questions, responses, useWeightedResults);
  const {
    candidatePercentages,
    candidateQuestionCounts,
    candidateDenominators,
    themeScores,
    themeDenominators,
    dimensionPercentages,
  } = results;
  // Preparar HTML de resultados
  resultsContainer.innerHTML = '';
  const resultsHeader = document.createElement('h2');
  resultsHeader.textContent = 'Resultados generales';
  resultsContainer.appendChild(resultsHeader);

  const weightingControl = document.createElement('label');
  weightingControl.className = 'weighting-toggle';
  const weightingCheckbox = document.createElement('input');
  weightingCheckbox.type = 'checkbox';
  weightingCheckbox.checked = useWeightedResults;
  weightingCheckbox.addEventListener('change', () => {
    useWeightedResults = weightingCheckbox.checked;
    showResults();
  });
  const weightingText = document.createElement('span');
  weightingText.textContent = 'Aplicar ponderación por importancia personal';
  weightingControl.appendChild(weightingCheckbox);
  weightingControl.appendChild(weightingText);
  resultsContainer.appendChild(weightingControl);

  const weightingNote = document.createElement('p');
  weightingNote.className = 'info-text';
  weightingNote.textContent = useWeightedResults
    ? 'Modo ponderado: “Me afecta mucho” cuenta ×2, “Me afecta algo” ×1 y “No me afecta/no sé” ×0,5.'
    : 'Modo sin ponderar: todas las preguntas cuentan igual. Activa la ponderación para dar más peso a los temas que más te afectan.';
  resultsContainer.appendChild(weightingNote);

  const revealControl = document.createElement('label');
  revealControl.className = 'reveal-toggle';
  const revealCheckbox = document.createElement('input');
  revealCheckbox.type = 'checkbox';
  revealCheckbox.checked = revealCandidateAlignment;
  revealCheckbox.addEventListener('change', () => {
    revealCandidateAlignment = revealCheckbox.checked;
    showResults();
  });
  const revealText = document.createElement('span');
  revealText.textContent = revealCandidateAlignment ? 'Ocultar alineación de candidatos' : 'Revelar alineación de candidatos ✨';
  revealControl.appendChild(revealCheckbox);
  revealControl.appendChild(revealText);
  resultsContainer.appendChild(revealControl);

  appendPdfExportControls(resultsContainer, results);
  appendPreferenceMap(resultsContainer, revealCandidateAlignment);

  if (!revealCandidateAlignment) {
    const hiddenNote = document.createElement('p');
    hiddenNote.className = 'info-text reveal-note';
    hiddenNote.textContent = 'Abajo ves tus respuestas registradas. Activa “Revelar” para mostrar tablas de afinidad, candidatos, confianza y fuentes.';
    resultsContainer.appendChild(hiddenNote);
  }

  if (revealCandidateAlignment) {
  // Tabla de afinidad
  const table = document.createElement('table');
  const headerRow = document.createElement('tr');
  ['Candidato', 'Afinidad (%)', useWeightedResults ? 'Preguntas / peso' : 'Preguntas'].forEach((text) => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);
  for (const cand of Object.keys(candidatePercentages)) {
    const tr = document.createElement('tr');
    const tdCand = document.createElement('td');
    tdCand.textContent = cand;
    const tdPct = document.createElement('td');
    tdPct.textContent = `${candidatePercentages[cand]} %`;
    const tdCount = document.createElement('td');
    tdCount.textContent = useWeightedResults
      ? `${candidateQuestionCounts[cand] || 0} preguntas · peso ${formatWeight(candidateDenominators[cand] || 0)}`
      : `${candidateQuestionCounts[cand] || 0}`;
    tr.appendChild(tdCand);
    tr.appendChild(tdPct);
    tr.appendChild(tdCount);
    table.appendChild(tr);
  }
  resultsContainer.appendChild(table);

  // Resultados por dimensión amplia
  const dimensionSection = document.createElement('div');
  dimensionSection.className = 'results-section';
  const dimensionHeader = document.createElement('h2');
  dimensionHeader.textContent = 'Resultados por dimensión';
  dimensionSection.appendChild(dimensionHeader);
  const dimensionIntro = document.createElement('p');
  dimensionIntro.className = 'info-text';
  dimensionIntro.textContent = 'Agrupación amplia de dilemas: economía, seguridad, territorio, institucionalidad, energía y relaciones exteriores.';
  dimensionSection.appendChild(dimensionIntro);
  const dimensionTable = document.createElement('table');
  const dimensionHeaderRow = document.createElement('tr');
  ['Dimensión', 'Cepeda', 'De La Espriella'].forEach((text) => {
    const th = document.createElement('th');
    th.textContent = text;
    dimensionHeaderRow.appendChild(th);
  });
  dimensionTable.appendChild(dimensionHeaderRow);
  for (const dimension of Object.keys(dimensionPercentages)) {
    const tr = document.createElement('tr');
    const tdDimension = document.createElement('td');
    tdDimension.textContent = dimension;
    const tdCepeda = document.createElement('td');
    tdCepeda.textContent = dimensionPercentages[dimension].Cepeda != null ? `${dimensionPercentages[dimension].Cepeda} %` : '-';
    const tdEspriella = document.createElement('td');
    tdEspriella.textContent = dimensionPercentages[dimension]['De La Espriella'] != null ? `${dimensionPercentages[dimension]['De La Espriella']} %` : '-';
    tr.appendChild(tdDimension);
    tr.appendChild(tdCepeda);
    tr.appendChild(tdEspriella);
    dimensionTable.appendChild(tr);
  }
  dimensionSection.appendChild(dimensionTable);
  resultsContainer.appendChild(dimensionSection);

  // Resultados por tema
  const themeSection = document.createElement('div');
  themeSection.className = 'results-section';
  const themeHeader = document.createElement('h2');
  themeHeader.textContent = 'Resultados por tema';
  themeSection.appendChild(themeHeader);
  const themeTable = document.createElement('table');
  const themeHeaderRow = document.createElement('tr');
  ['Tema', 'Candidato con mayor afinidad', 'Puntaje (%)'].forEach((text) => {
    const th = document.createElement('th');
    th.textContent = text;
    themeHeaderRow.appendChild(th);
  });
  themeTable.appendChild(themeHeaderRow);
  for (const theme of Object.keys(themeScores)) {
    const themeCandidates = themeScores[theme];
    let bestCand = null;
    let bestScore = -1;
    for (const cand of Object.keys(themeCandidates)) {
      const total = themeCandidates[cand];
      const denominator = themeDenominators[theme][cand];
      const avg = denominator > 0 ? total / denominator : 0;
      if (avg > bestScore) {
        bestScore = avg;
        bestCand = cand;
      }
    }
    const tr = document.createElement('tr');
    const tdTheme = document.createElement('td');
    tdTheme.textContent = theme;
    const tdBest = document.createElement('td');
    tdBest.textContent = bestCand || 'Sin definición';
    const tdScore = document.createElement('td');
    tdScore.textContent = bestCand ? `${Math.round(bestScore * 100)} %` : '-';
    tr.appendChild(tdTheme);
    tr.appendChild(tdBest);
    tr.appendChild(tdScore);
    themeTable.appendChild(tr);
  }
  themeSection.appendChild(themeTable);
  resultsContainer.appendChild(themeSection);

  // Preguntas con baja confianza o sin correspondencia clara
  const lowConfidenceQuestions = getLowConfidenceQuestions(questions);
  if (lowConfidenceQuestions.length > 0) {
    const lowSection = document.createElement('div');
    lowSection.className = 'results-section';
    const lowHeader = document.createElement('h2');
    lowHeader.textContent = 'Preguntas de baja confianza o sin correspondencia clara';
    lowSection.appendChild(lowHeader);
    const lowIntro = document.createElement('p');
    lowIntro.className = 'info-text';
    lowIntro.textContent = 'Estas preguntas se muestran aparte porque la diferencia entre candidatos es inferida, débil o no está claramente documentada. No las leas como una coincidencia firme.';
    lowSection.appendChild(lowIntro);
    const list = document.createElement('ul');
    lowConfidenceQuestions.forEach((q) => {
      const li = document.createElement('li');
      li.textContent = `${q.id}: ${q.title} — confianza ${formatConfidence(q.alignment_confidence)}`;
      list.appendChild(li);
    });
    lowSection.appendChild(list);
    resultsContainer.appendChild(lowSection);
  }

  }

  // Explicación detallada
  const detailSection = document.createElement('div');
  detailSection.className = 'results-section';
  const detailHeader = document.createElement('h2');
  detailHeader.textContent = 'Tu selección y correspondencia de candidatos';
  detailSection.appendChild(detailHeader);
  questions.forEach((q, i) => {
    const resp = responses[i];
    const userValue = resp ? resp.value : 0.5;
    // Determinar a qué candidato corresponde la elección
    let chosenCand = null;
    let secondCand = null;
    // Si respuesta < 0.5, se inclina hacia la izquierda; > 0.5 hacia la derecha
    if (userValue < 0.5 && q.candidate_alignment_left !== 'Unclear') {
      chosenCand = q.candidate_alignment_left;
      secondCand = q.candidate_alignment_right;
    } else if (userValue > 0.5 && q.candidate_alignment_right !== 'Unclear') {
      chosenCand = q.candidate_alignment_right;
      secondCand = q.candidate_alignment_left;
    }
    const item = document.createElement('div');
    item.style.marginBottom = '12px';
    const title = document.createElement('strong');
    title.textContent = `${i + 1}. ${q.title}`;
    item.appendChild(title);
    const p1 = document.createElement('p');
    p1.style.margin = '4px 0';
    // Mostrar qué opción eligió el usuario
    const extreme = userValue === 0.5 ? 'Neutral' : userValue < 0.5 ? 'Opción A' : 'Opción B';
    p1.textContent = `Tu respuesta: ${extreme}. Nivel de afectación: ${resp ? resp.affect : 'No me afecta/no sé'}`;
    item.appendChild(p1);
    if (revealCandidateAlignment) {
      const p2 = document.createElement('p');
      p2.style.margin = '4px 0';
      p2.textContent = `La Opción A se aproxima más a: ${q.candidate_alignment_left || 'Sin definición'}; la Opción B se aproxima más a: ${q.candidate_alignment_right || 'Sin definición'}.`;
      item.appendChild(p2);
      const p3 = document.createElement('p');
      p3.style.margin = '4px 0';
      p3.textContent = `Confianza de la correspondencia: ${formatConfidence(q.alignment_confidence)}. Base: ${q.alignment_basis || 'sin base documentada'}.`;
      item.appendChild(p3);
    }
    if (q.why_this_question_matters) {
      const p4 = document.createElement('p');
      p4.style.margin = '4px 0';
      p4.textContent = `Por qué importa: ${q.why_this_question_matters}`;
      item.appendChild(p4);
    }
    if (revealCandidateAlignment && Array.isArray(q.sources) && q.sources.length > 0) {
      const sources = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Fuentes usadas';
      sources.appendChild(summary);
      const list = document.createElement('ul');
      q.sources.forEach((source) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = `${source.publisher || 'Fuente'} — ${source.title || source.url}`;
        li.appendChild(link);
        if (source.what_it_supports) {
          const support = document.createElement('span');
          support.textContent = `: ${source.what_it_supports}`;
          li.appendChild(support);
        }
        list.appendChild(li);
      });
      sources.appendChild(list);
      item.appendChild(sources);
    }
    detailSection.appendChild(item);
  });
  resultsContainer.appendChild(detailSection);

  // Conclusión
  const conclusion = document.createElement('p');
  conclusion.className = 'info-text';
  conclusion.textContent = 'Tus respuestas parecen más cercanas a ciertas tendencias de cada candidato en distintas áreas. Esto no es una recomendación de voto: solo compara tus preferencias declaradas con posiciones públicas e inferencias razonables, con sus niveles de confianza.';
  resultsContainer.appendChild(conclusion);

  resultsContainer.classList.remove('hidden');
}
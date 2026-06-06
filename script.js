// script.js – controla la lógica del cuestionario

/*
 * Este archivo implementa una aplicación de preguntas y respuestas que utiliza
 * un archivo JSON con los dilemas políticos. Las preguntas se presentan al
 * usuario sin indicar qué candidato está asociado a cada extremo del control
 * deslizante. Al terminar, se calcula la afinidad aproximada con cada
 * candidato y se muestran los resultados por tema.
 */

// Variables globales para almacenar preguntas y respuestas
let questions = [];
let currentIndex = 0;
const responses = [];

// Referencias a elementos del DOM
const quizContainer = document.getElementById('quiz-container');
const navigation = document.getElementById('navigation');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const resultsContainer = document.getElementById('results-container');

// Inicialización
window.addEventListener('DOMContentLoaded', async () => {
  await loadQuestions();
  if (questions.length > 0) {
    navigation.classList.remove('hidden');
    showQuestion(0);
  }
});

// Cargar preguntas del archivo JSON y randomizar la orientación
async function loadQuestions() {
  try {
    const response = await fetch('questions.json');
    const data = await response.json();
    questions = data.map((q) => {
      // Clonar el objeto para no modificar el original
      const question = { ...q };
      // Randomizar la orientación izquierda/derecha
      if (Math.random() < 0.5) {
        // Intercambiar etiquetas y alineaciones
        [question.left_label, question.right_label] = [q.right_label, q.left_label];
        [question.left_cost_or_risk, question.right_cost_or_risk] = [q.right_cost_or_risk, q.left_cost_or_risk];
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
  optionA.innerHTML = `<span class="option-marker">Opción A</span><span>${escapeHtml(question.left_label)}</span>`;

  const optionB = document.createElement('div');
  optionB.className = 'option-card option-b';
  optionB.innerHTML = `<span class="option-marker">Opción B</span><span>${escapeHtml(question.right_label)}</span>`;

  const sliderInput = document.createElement('input');
  sliderInput.type = 'range';
  sliderInput.min = '0';
  sliderInput.max = '10';
  sliderInput.step = '1';
  sliderInput.value = responses[index] ? responses[index].value * 10 : 5; // valor medio por defecto
  sliderInput.className = 'slider';

  const scaleLabels = document.createElement('div');
  scaleLabels.className = 'scale-labels';
  scaleLabels.innerHTML = '<span>A / 0</span><span>Neutral / 5</span><span>B / 10</span>';

  sliderContainer.appendChild(optionA);
  sliderContainer.appendChild(optionB);
  sliderContainer.appendChild(sliderInput);
  sliderContainer.appendChild(scaleLabels);

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
    lbl.style.marginRight = '8px';
    lbl.textContent = text;
    affectContainer.appendChild(rb);
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

// Calcular y mostrar resultados
function showResults() {
  // Calcular puntajes
  const candidateScores = {};
  const candidateCounts = {};
  const themeScores = {};
  const themeCounts = {};

  questions.forEach((q, i) => {
    const resp = responses[i] || { value: 0.5, affect: 'No me afecta/no sé' };
    const value = resp.value;
    // Score for left candidate: 1 - value; right candidate: value
    const leftCand = q.candidate_alignment_left;
    const rightCand = q.candidate_alignment_right;
    if (leftCand && leftCand !== 'Unclear') {
      candidateScores[leftCand] = (candidateScores[leftCand] || 0) + (1 - value);
      candidateCounts[leftCand] = (candidateCounts[leftCand] || 0) + 1;
    }
    if (rightCand && rightCand !== 'Unclear') {
      candidateScores[rightCand] = (candidateScores[rightCand] || 0) + value;
      candidateCounts[rightCand] = (candidateCounts[rightCand] || 0) + 1;
    }
    // Theme
    const theme = q.theme;
    if (theme) {
      themeScores[theme] = themeScores[theme] || {};
      themeCounts[theme] = themeCounts[theme] || {};
      if (leftCand && leftCand !== 'Unclear') {
        themeScores[theme][leftCand] = (themeScores[theme][leftCand] || 0) + (1 - value);
        themeCounts[theme][leftCand] = (themeCounts[theme][leftCand] || 0) + 1;
      }
      if (rightCand && rightCand !== 'Unclear') {
        themeScores[theme][rightCand] = (themeScores[theme][rightCand] || 0) + value;
        themeCounts[theme][rightCand] = (themeCounts[theme][rightCand] || 0) + 1;
      }
    }
  });
  // Calcular porcentajes
  const candidatePercentages = {};
  for (const cand of Object.keys(candidateScores)) {
    const total = candidateScores[cand];
    const count = candidateCounts[cand];
    candidatePercentages[cand] = count > 0 ? Math.round((total / count) * 100) : 0;
  }
  // Preparar HTML de resultados
  resultsContainer.innerHTML = '';
  const resultsHeader = document.createElement('h2');
  resultsHeader.textContent = 'Resultados generales';
  resultsContainer.appendChild(resultsHeader);
  // Tabla de afinidad
  const table = document.createElement('table');
  const headerRow = document.createElement('tr');
  ['Candidato', 'Afinidad (%)', 'Preguntas'].forEach((text) => {
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
    tdCount.textContent = `${candidateCounts[cand] || 0}`;
    tr.appendChild(tdCand);
    tr.appendChild(tdPct);
    tr.appendChild(tdCount);
    table.appendChild(tr);
  }
  resultsContainer.appendChild(table);

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
      const count = themeCounts[theme][cand];
      const avg = count > 0 ? total / count : 0;
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
    const p2 = document.createElement('p');
    p2.style.margin = '4px 0';
    p2.textContent = `La Opción A se aproxima más a: ${q.candidate_alignment_left || 'Sin definición'}; la Opción B se aproxima más a: ${q.candidate_alignment_right || 'Sin definición'}.`;
    item.appendChild(p2);
    detailSection.appendChild(item);
  });
  resultsContainer.appendChild(detailSection);

  // Conclusión
  const conclusion = document.createElement('p');
  conclusion.className = 'info-text';
  conclusion.textContent = 'Estos resultados son orientativos. No constituyen una recomendación de voto. Tu afinidad se calcula en función de tus respuestas y de las posiciones públicas de los candidatos.';
  resultsContainer.appendChild(conclusion);

  resultsContainer.classList.remove('hidden');
}
import "./style.css";
import decisionTree from "./new_decision_tree_ukr.json";
import preferenceQuestions from "./preferences_ukr.json";
import frameworksDescription from "./frameworks_ukr.json";

const RECOMMENDATION_THRESHOLD = 0.8;
const TREE_SCALING_FACTOR = 0.5;

// DOM Elements
const elements = {
  initial: document.querySelector(".initial"),
  questionnaire: document.querySelector(".questionnaire"),
  results: document.querySelector(".results"),
  buttons: {
    start: document.querySelector("button.start"),
    next: document.querySelector("button.next"),
    restart: document.querySelector("button.restart"),
  },
  legend: document.querySelector(".questionnaire legend"),
  options: document.querySelector(".questionnaire ul.options"),
};

// Application state
let state = {
  step: "tree",
  currentQuestion: null,
  previousQuestions: [],
  results: null,
};

// Event listeners
elements.buttons.start.addEventListener("click", startQuestionnaire);
elements.buttons.next.addEventListener("click", handleNextQuestion);
elements.buttons.restart.addEventListener("click", startQuestionnaire);

// Core functions
function startQuestionnaire() {
  showComponent("questionnaire");
  state = {
    step: "tree",
    currentQuestion: decisionTree,
    previousQuestions: [],
    results: null,
  };
  renderQuestion();
}

function handleNextQuestion() {
  const checked = document.querySelector('input[name="answer"]:checked');
  if (!checked) {
    alert("Оберіть відповідь із запропонованих");
    return;
  }

  const selectedIndex = parseInt(checked.value);
  const selectedAnswer = state.currentQuestion.answers[selectedIndex];
  state.previousQuestions.push([
    state.currentQuestion.question,
    selectedAnswer.option,
  ]);

  if (state.step === "tree") {
    handleTreeAnswer(selectedAnswer);
  } else if (state.step === "preferences") {
    handlePreferenceAnswer(selectedAnswer);
  }
}

function handleTreeAnswer(selectedAnswer) {
  if (selectedAnswer.next) {
    state.currentQuestion = selectedAnswer.next;
    renderQuestion();
  } else {
    state.results = createPointsVector(selectedAnswer.frameworks);
    state.step = "preferences";
    state.currentQuestion = preferenceQuestions[0];
    renderQuestion();
  }
}

function handlePreferenceAnswer(selectedAnswer) {
  const pointsVector = scaleVector(
    state.currentQuestion.importance_coefficient,
    selectedAnswer.vector,
  );
  state.results = addVectors(state.results, pointsVector);

  const nextIndex =
    preferenceQuestions.findIndex(
      (item) => item.question === state.currentQuestion.question,
    ) + 1;

  if (nextIndex < preferenceQuestions.length) {
    state.currentQuestion = preferenceQuestions[nextIndex];
    renderQuestion();
  } else {
    showResults();
  }
}

// UI functions
function renderQuestion() {
  elements.legend.textContent = state.currentQuestion.question;
  elements.options.innerHTML = createOptionsHTML(state.currentQuestion.answers);
}

function createOptionsHTML(answers) {
  return answers
    .map(
      (answer, index) => `
      <li>
        <input type="radio" id="option${index}" name="answer" value="${index}" />
        <label for="option${index}">${answer.option}</label>
      </li>
    `,
    )
    .join("\n");
}

function showResults() {
  showComponent("results");
  const maxScore = Math.max(...state.results);
  const recommendedFrameworks = state.results
    .map((score, index) => [score, index])
    // Sort by the score (the biggest first)
    .sort((x, y) => y[0] - x[0])
    // Take up to 3 recommendations that are within RECOMMENDATION_THRESHOLD
    .filter(([score]) => score > maxScore * RECOMMENDATION_THRESHOLD)
    .slice(0, 3)
    // Map to framework names
    .map(([_, index]) => frameworksDescription[index].name);

  const recommendationsHTML = recommendedFrameworks
    .map((name) => {
      const { description, website } = frameworksDescription.find(
        (item) => item.name === name,
      );
      return `
        <dt class="framework-name">
          <a href="${website}" target="_blank">${name}</a>
        </dt>
        <dd class="framework-description">${description}</dd>
      `;
    })
    .join("\n");

  const answersHTML = state.previousQuestions
    .map(
      ([question, answer]) => `
      <dt class="question">${question}</dt>
      <dd class="answer"><strong>${answer}</strong></dd>
    `,
    )
    .join("\n");

  elements.results.querySelector(".recommendations > dl").innerHTML =
    recommendationsHTML;
  elements.results.querySelector(".answers-container > dl").innerHTML =
    answersHTML;
}

function showComponent(componentName) {
  elements.initial.style.display =
    componentName === "initial" ? "block" : "none";
  elements.questionnaire.style.display =
    componentName === "questionnaire" ? "block" : "none";
  elements.results.style.display =
    componentName === "results" ? "block" : "none";
}

// Utility functions
function createPointsVector(frameworks) {
  const scalingFactor = preferenceQuestions.length * TREE_SCALING_FACTOR;
  return frameworksDescription.map(
    (el) => scalingFactor * (frameworks.includes(el.name) ? 1 : 0),
  );
}

function scaleVector(coefficient, vector) {
  return vector.map((el) => coefficient * el);
}

function addVectors(v1, v2) {
  return v1.map((el, index) => el + v2[index]);
}

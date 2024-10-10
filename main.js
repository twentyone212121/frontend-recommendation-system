import './style.css'
import decisionTree from './new_decision_tree_ukr.json'
import preferenceQuestions from './preferences_ukr.json'
import frameworksDescription from './frameworks_ukr.json'

const initialComponent = document.querySelector(".initial");
const questionnaireComponent = document.querySelector(".questionnaire");
const resultsComponent = document.querySelector(".results");

const startButton = document.querySelector("button.start");
const nextButton = document.querySelector("button.next");
const restartButton = document.querySelector("button.restart");

startButton.addEventListener("click", startQuestionnaire);
nextButton.addEventListener("click", showNextQuestion);
restartButton.addEventListener("click", startQuestionnaire);

const legend = questionnaireComponent.querySelector("legend");
const options = questionnaireComponent.querySelector("ul.options");

let state = {};

function startQuestionnaire() {
  initialComponent.style.display = "none";
  questionnaireComponent.style.display = "block";
  resultsComponent.style.display = "none";

  state = {
    step: "tree",
    currQuestion: decisionTree,
    prevQuestions: [],
    results: null,
  }
  showCurrentQuestion();
}

function showNextQuestion() {
  const checked = document.querySelector('input[name="answer"]:checked');
  if (!checked) {
    alert("Оберіть відповідь із запропонованих");
    return;
  }

  const selectedIndex = parseInt(checked.value);
  const selectedAnswer = state.currQuestion.answers[selectedIndex];
  state.prevQuestions.push([state.currQuestion.question, selectedAnswer.option]);

  if (state.step === "tree") {
    if (selectedAnswer.next) {
      state.currQuestion = selectedAnswer.next;
      showCurrentQuestion();
    } else {
      state.results = pointsVector(selectedAnswer.frameworks);
      state.step = "preferences";
      state.currQuestion = preferenceQuestions[0];
      showCurrentQuestion();
    }
  } else if (state.step === "preferences") {
    const pointsVector = scaleVector(state.currQuestion.importance_coefficient, selectedAnswer.vector);
    state.results = addVectors(state.results, pointsVector);

    const next = preferenceQuestions.findIndex((item) => item.question === state.currQuestion.question) + 1;
    console.log(`next index is ${next}`);

    if (next < preferenceQuestions.length) {
      state.currQuestion = preferenceQuestions[next];
      showCurrentQuestion();
    } else {
      state.currQuestion = null;
      showResults();
    }
  }
  console.log(state);
}

function showCurrentQuestion() {
  legend.textContent = state.currQuestion.question;
  options.innerHTML = optionsHTML(state.currQuestion.answers);
}

function optionsHTML(answers) {
  return answers.map((val, index) => `<li>
    <input type="radio" id="option${index}" name="answer" value="${index}" />
    <label for="option${index}">${val.option}</label>
  </li>`).join("\n");
}

function showResults() {
  initialComponent.style.display = "none";
  questionnaireComponent.style.display = "none";
  resultsComponent.style.display = "block";

  const maxScore = Math.max(...state.results);
  const recommendedFrameworks = state.results
    .map((score, index) => [score, index])
    .sort((x, y) => y[0] - x[0])
    .filter(([score, index]) => score > maxScore * 0.8)
    .slice(0, 3)
    .map(([score, index]) => frameworksDescription[index].name);

  resultsComponent.querySelector(".recommendations > dl").innerHTML = resultsHTML(recommendedFrameworks);
  resultsComponent.querySelector(".answers-container > dl").innerHTML = answersHTML(state.prevQuestions);
}

function resultsHTML(frameworks) {
  return frameworks.map((name) => {
    const { description, website } = frameworksDescription.find((item) => item.name === name);
    return `<dt class="framework-name"><a href="${website}" target="_blank">${name}</a></dt>
    <dd class="framework-description">${description}</dd>`;
  }).join("\n");
}

function answersHTML(questions) {
  return questions.map(([question, answer]) => `
    <dt class="question">${question}</dt>
    <dd class="answer"><strong>${answer}</strong></dd>`
  ).join("\n");
}

function pointsVector(frameworks) {
  console.log(preferenceQuestions.length);
  const scalingFactor = preferenceQuestions.length * 0.5;
  return frameworksDescription.map((el) => scalingFactor * (frameworks.includes(el.name) ? 1 : 0));
}

function scaleVector(coef, v) {
  return v.map((el) => coef * el);
}

function addVectors(v1, v2) {
  return v1.map((el, index) => el + v2[index]);
}

'use strict';

// Data array: adult BMI categories, used to classify and display the result.
const bmiRanges = [
  { max: 18.5, label: 'Underweight', color: '#83c2ff', message: 'Your BMI is below the typical adult range. BMI alone cannot determine your health.' },
  { max: 25, label: 'Healthy weight', color: '#80e7ab', message: 'Your BMI falls within the typical adult range. BMI is only one part of a health assessment.' },
  { max: 30, label: 'Overweight', color: '#ffd17c', message: 'Your BMI is above the typical adult range. This number alone does not determine your health.' },
  { max: Infinity, label: 'Obesity', color: '#ff9685', message: 'Your BMI is in the adult obesity range. A healthcare professional can help interpret it in context.' }
];

// Second array: recent calculations in this page session only.
const history = [];
const form = document.getElementById('nutritionForm');
const fields = ['age', 'gender', 'weight', 'height'];
const $ = window.jQuery;

function calculateBMI(weight, heightCm) {
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
}

function classifyBMI(bmi) {
  for (const range of bmiRanges) {
    if (bmi < range.max) return range;
  }
  return bmiRanges[bmiRanges.length - 1];
}

function showFieldError(id, message) {
  const input = document.getElementById(id);
  document.getElementById(`${id}Error`).textContent = message;
  input.closest('.input-shell').classList.toggle('is-invalid', Boolean(message));
  input.setAttribute('aria-invalid', String(Boolean(message)));
}

function validateForm() {
  const ageRaw = document.getElementById('age').value.trim();
  const gender = document.getElementById('gender').value;
  const weightRaw = document.getElementById('weight').value.trim();
  const heightRaw = document.getElementById('height').value.trim();
  const age = Number(ageRaw);
  const weight = Number(weightRaw);
  const height = Number(heightRaw);
  const errors = {
    age: !ageRaw ? 'Please enter your age.' : (!Number.isInteger(age) || age < 2 || age > 120 ? 'Enter a whole-number age from 2 to 120.' : ''),
    gender: !gender ? 'Please choose an option.' : '',
    weight: !weightRaw ? 'Please enter your weight.' : (!Number.isFinite(weight) || weight < 1 || weight > 500 ? 'Enter a weight between 1 and 500 kg.' : ''),
    height: !heightRaw ? 'Please enter your height.' : (!Number.isFinite(height) || height < 50 || height > 250 ? 'Enter a height between 50 and 250 cm.' : '')
  };
  // Loop 1: display specific validation errors beside each field.
  for (const id of fields) showFieldError(id, errors[id]);
  return { valid: Object.values(errors).every(error => !error), age, weight, height };
}

function scalePosition(bmi) {
  // Each category has a visible quarter of the scale (not a linear BMI axis).
  if (bmi < 18.5) return Math.max(2, Math.min(24, bmi / 18.5 * 25));
  if (bmi < 25) return 25 + (bmi - 18.5) / 6.5 * 25;
  if (bmi < 30) return 50 + (bmi - 25) / 5 * 25;
  return Math.min(98, 75 + (bmi - 30) / 15 * 23);
}

function showResult(bmi, age) {
  const adult = age >= 20;
  const category = adult ? classifyBMI(bmi) : null;
  document.getElementById('bmiValue').textContent = bmi.toFixed(1);
  const categoryElement = document.getElementById('bmiCategory');
  categoryElement.textContent = adult ? category.label : 'BMI-for-age needed';
  categoryElement.style.color = adult ? category.color : '#ffd17c';
  categoryElement.style.background = adult ? `${category.color}20` : '#ffd17c20';
  document.getElementById('bmiExplanation').textContent = adult ? category.message : 'For people younger than 20, BMI must be interpreted using age- and sex-specific growth charts. This page does not calculate a BMI-for-age percentile.';
  document.getElementById('scaleValue').textContent = adult ? bmi.toFixed(1) : 'Adult scale not applicable';
  document.querySelector('.scale-block').hidden = !adult;
  if (adult) document.getElementById('scaleMarker').style.left = `${scalePosition(bmi)}%`;
  document.getElementById('emptyState').hidden = true;
  document.getElementById('resultContent').hidden = false;
  if ($) $('#resultContent').hide().fadeIn(350); // jQuery effect 1
}

function renderHistory() {
  const list = document.getElementById('historyList');
  list.replaceChildren();
  if (!history.length) {
    const empty = document.createElement('p');
    empty.className = 'history-empty';
    empty.textContent = 'No calculations yet.';
    list.appendChild(empty);
    return;
  }
  // Loop 2: dynamically create DOM cards from the history array.
  history.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'history-item';
    const number = document.createElement('strong');
    number.textContent = item.bmi.toFixed(1);
    const label = document.createElement('span');
    label.textContent = item.age >= 20 ? classifyBMI(item.bmi).label : 'BMI-for-age needed';
    const detail = document.createElement('small');
    detail.textContent = `#${index + 1} · Age ${item.age} · ${item.weight} kg · ${item.height} cm`;
    card.append(number, label, detail);
    list.appendChild(card);
  });
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const result = validateForm();
  const message = document.getElementById('formMessage');
  if (!result.valid) {
    message.textContent = 'Please correct the highlighted fields.';
    message.style.color = '#ff9d99';
    document.getElementById('resultContent').hidden = true;
    document.getElementById('emptyState').hidden = false;
    return;
  }
  const bmi = calculateBMI(result.weight, result.height);
  showResult(bmi, result.age);
  history.unshift({ bmi, age: result.age, weight: result.weight, height: result.height });
  if (history.length > 6) history.pop();
  renderHistory();
  message.textContent = 'Calculation completed successfully.';
  message.style.color = '#b2edc4';
});

form.addEventListener('reset', () => {
  for (const id of fields) showFieldError(id, '');
  document.getElementById('formMessage').textContent = '';
  document.getElementById('goalCount').textContent = '0 / 300';
  document.getElementById('resultContent').hidden = true;
  document.getElementById('emptyState').hidden = false;
  if ($) { $('#detailsContent').hide(); $('#detailsToggle').attr('aria-expanded', 'false'); }
});

// JavaScript input and change events provide immediate field feedback.
for (const id of fields) {
  const input = document.getElementById(id);
  input.addEventListener(id === 'gender' ? 'change' : 'input', () => {
    if (input.getAttribute('aria-invalid') === 'true') validateForm();
  });
}
document.getElementById('goal').addEventListener('input', event => {
  document.getElementById('goalCount').textContent = `${event.target.value.length} / 300`;
});
document.getElementById('clearHistory').addEventListener('click', () => {
  history.length = 0;
  renderHistory();
});

if ($) {
  $(function () {
    // jQuery selectors: ID (#detailsToggle), class (.result-panel), and descendant (.result-panel .details-content).
    // jQuery traversal: closest(), find(), parent(), and children().
    $('#detailsToggle').on('click', function () {
      const $panel = $(this).closest('.result-panel');
      const $content = $panel.find('.details-content');
      const expanded = $(this).attr('aria-expanded') === 'true';
      $(this).attr('aria-expanded', String(!expanded));
      $content.stop(true, true).slideToggle(250); // jQuery effect 2
    });
    $('.input-shell input').on('focus', function () {
      $(this).parent().addClass('field-focused');
    }).on('blur', function () {
      $(this).parent().removeClass('field-focused');
    });
    // Demonstrate children() traversal without changing the page structure.
    $('.section-heading').each(function () { $(this).children().length; });
  });
}

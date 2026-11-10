'use strict';

const mealPlan = [];
const nutrientFields = ['calories', 'protein', 'fat', 'carbs'];
const mealForm = document.getElementById('meal-form');
const mealMessage = document.getElementById('meal-message');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll('.section-toggle').forEach(button => {
    const content = document.getElementById(button.getAttribute('aria-controls'));
    button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(expanded));
        button.querySelector('span').textContent = expanded ? '−' : '+';
        if (window.jQuery) {
            const $content = window.jQuery(content);
            if (content.hidden) {
                $content.hide();
                content.hidden = false;
            }
            $content.stop(true, false)[expanded ? 'slideDown' : 'slideUp'](motionPreference.matches ? 0 : 380);
        } else {
            content.hidden = !expanded;
        }
    });
});

function showError(input, message) {
    input.setAttribute('aria-invalid', String(Boolean(message)));
    document.getElementById(`${input.id}-error`).textContent = message;
}

function isValidInteger(value, minimum) {
    return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) >= minimum && Number(value) <= 999999;
}

// Keep text input so decimals, signs and scientific notation cannot bypass validation.
document.querySelectorAll('[data-integer]').forEach(input => {
    input.addEventListener('beforeinput', event => {
        if (event.data && /\D/.test(event.data)) {
            event.preventDefault();
            showError(input, 'Use whole numbers only (no decimals or signs).');
        }
    });
    input.addEventListener('input', () => {
        if (/\D/.test(input.value)) {
            input.value = input.dataset.lastValid || '';
            showError(input, 'Use whole numbers only (no decimals or signs).');
        } else {
            input.dataset.lastValid = input.value;
            showError(input, '');
        }
    });
});

function calculateTotals(meals) {
    const totals = { calories: 0, protein: 0, fat: 0, carbs: 0 };
    meals.forEach(meal => nutrientFields.forEach(field => { totals[field] += meal[field]; }));
    return totals;
}

function renderPlan() {
    const body = document.getElementById('custom-meals');
    body.replaceChildren();
    mealPlan.forEach((meal, index) => {
        const row = document.createElement('tr');
        [meal.meal, meal.food, ...nutrientFields.map(field => meal[field])].forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });
        const action = document.createElement('td');
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-meal';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', `Remove ${meal.food} from ${meal.meal}`);
        remove.addEventListener('click', () => {
            mealPlan.splice(index, 1);
            renderPlan();
            mealMessage.textContent = `${meal.food} removed. Totals updated.`;
            const remaining = body.querySelectorAll('button');
            (remaining[Math.min(index, remaining.length - 1)] || document.getElementById('food')).focus();
        });
        action.appendChild(remove);
        row.appendChild(action);
        body.appendChild(row);
    });
    const totals = calculateTotals(mealPlan);
    nutrientFields.forEach(field => { document.getElementById(`total-${field}`).textContent = totals[field]; });
    document.getElementById('custom-plan').hidden = mealPlan.length === 0;
    document.getElementById('empty-plan').hidden = mealPlan.length !== 0;
}

mealForm.addEventListener('submit', event => {
    event.preventDefault();
    const food = document.getElementById('food');
    showError(food, food.value.trim() ? '' : 'Enter a food or dish name.');
    nutrientFields.forEach(field => {
        const input = document.getElementById(field);
        const minimum = Number(input.dataset.min);
        showError(input, isValidInteger(input.value, minimum) ? '' : `Enter a whole number from ${minimum} to 999999.`);
    });
    const invalid = mealForm.querySelector('[aria-invalid="true"]');
    if (invalid) {
        mealMessage.textContent = 'Please correct the highlighted fields.';
        invalid.focus();
        return;
    }
    const meal = { meal: document.getElementById('meal').value, food: food.value.trim() };
    nutrientFields.forEach(field => { meal[field] = Number(document.getElementById(field).value); });
    mealPlan.push(meal);
    renderPlan();
    mealForm.reset();
    nutrientFields.forEach(field => { document.getElementById(field).dataset.lastValid = ''; });
    mealMessage.textContent = `${meal.food} added. Totals updated.`;
    food.focus();
});

'use strict';

const nutrientFields = ['calories', 'protein', 'fat', 'carbs'];


// ANIMATIONS
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

$('.section-toggle').on('click', function () {
    const button = $(this);
    const content = document.getElementById(button.attr('aria-controls'));
    const expanded = button.attr('aria-expanded') !== 'true';
    const duration = motionPreference.matches ? 0 : 380;

    button.attr('aria-expanded', String(expanded));
    button.find('span').text(expanded ? '−' : '+');

    if (expanded) {
        content.hidden = false;
        $(content).hide().stop(true, false).slideDown(duration);
    } else {
        $(content).stop(true, false).slideUp(duration);
    }
});


// FORM VALIDATION
function showError(input, message) {
    input.setAttribute('aria-invalid', String(Boolean(message)));
    $(`#${input.id}-error`).text(message);
}

function isValidInteger(value, minimum) {
    return /^\d+$/.test(value)
        && Number.isSafeInteger(Number(value))
        && Number(value) >= minimum
        && Number(value) <= 999999;
}

$('[data-integer]').on('beforeinput', function (event) {
    const inputEvent = event.originalEvent;

    if (inputEvent.data && /\D/.test(inputEvent.data)) {
        event.preventDefault();
        showError(this, 'Use whole numbers only.');
    }
});

$('[data-integer]').on('input', function () {
    if (/\D/.test(this.value)) {
        this.value = this.dataset.lastValid || '';
        showError(this, 'Use whole numbers only.');
    } else {
        this.dataset.lastValid = this.value;
        showError(this, '');
    }
});


// CLASS: ONE MEAL
class Meal {
    constructor(type, food, calories, protein, fat, carbs) {
        this.type = type;
        this.food = food;
        this.calories = calories;
        this.protein = protein;
        this.fat = fat;
        this.carbs = carbs;
    }
}


// CLASS: MEAL PLAN
class MealPlan {
    constructor() {
        this.meals = [];
        this.load();
        this.render();
    }

    addMeal(meal) {
        this.meals.push(meal);
        this.save();
        this.render();
    }

    calculateTotals() {
        const totals = {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0
        };

        this.meals.forEach(meal => {
            nutrientFields.forEach(field => {
                totals[field] += meal[field];
            });
        });

        return totals;
    }

    reset() {
    this.meals = [];
    this.save();
    this.render();
    }



    // NEW TABLE
    render() {
        const groups = {
            Breakfast: [],
            Lunch: [],
            Dinner: [],
            Other: []
        };

        // MEALS FOR EACH CATEGORY
        this.meals.forEach(meal => {
            switch (meal.type) {
                case 'Breakfast':
                    groups.Breakfast.push(meal);
                    break;

                case 'Lunch':
                    groups.Lunch.push(meal);
                    break;

                case 'Dinner':
                    groups.Dinner.push(meal);
                    break;

                case 'Other':
                    groups.Other.push(meal);
                    break;
            }
        });

        // FILLING TABLE
        Object.keys(groups).forEach(type => {
            const key = type.toLowerCase();
            const meals = groups[type];

            // Food names
            $(`#foods-${key}`).text(
                meals.length
                    ? meals.map(meal => meal.food).join(', ')
                    : '—'
            );

            // Nutrients for each category
            nutrientFields.forEach(field => {
                const total = meals.reduce(
                    (sum, meal) => sum + meal[field], 0
                );

                $(`#${field}-${key}`).text(total);
            });
        });

        // Overall daily totals
        const totals = this.calculateTotals();

        nutrientFields.forEach(field => {
            $(`#total-${field}`).text(totals[field]);
        });
    }


    // LOCAL STORAGE: SAVE
    save() {
        localStorage.setItem('mealPlan', JSON.stringify(this.meals));
    }


    // LOCAL STORAGE: LOAD
    load() {
        const saved = localStorage.getItem('mealPlan');

        if (saved) {
            try {
                const data = JSON.parse(saved);

                if (!Array.isArray(data)) {
                    throw new Error('Invalid meal data');
                }

                this.meals = data.map(meal => new Meal(
                    meal.type,
                    meal.food,
                    meal.calories,
                    meal.protein,
                    meal.fat,
                    meal.carbs
                ));
            } catch {
                this.meals = [];
            }
        }
    }
}


// CREATE MEAL PLAN OBJECT
const mealPlan = new MealPlan();


// FORM: ADD NEW MEAL
$('#meal-form').on('submit', function (event) {
    event.preventDefault();

    const food = document.getElementById('food');

    showError(
        food,
        food.value.trim() ? '' : 'Enter a food or dish name.'
    );

    nutrientFields.forEach(field => {
        const input = document.getElementById(field);
        const minimum = Number(input.dataset.min);

        showError(
            input,
            isValidInteger(input.value, minimum)
                ? ''
                : `Enter a whole number from ${minimum} to 999999.`
        );
    });

    const invalid = this.querySelector('[aria-invalid="true"]');

    if (invalid) {
        $('#meal-message').text('Please correct the highlighted fields.');
        invalid.focus();
        return;
    }

    // Create a new Meal object
    const meal = new Meal(
        $('#meal').val(),
        food.value.trim(),
        ...nutrientFields.map(field =>
            Number($(`#${field}`).val())
        )
    );

    // Add meal to the plan
    mealPlan.addMeal(meal);

    this.reset();

    $('[data-integer]').each(function () {
        this.dataset.lastValid = '';
    });

    $('#meal-message').text(`${meal.food} added. Totals updated.`);
    food.focus();
});

// RESET PLAN
$('#reset-plan').on('click', function () {
    if (confirm('Are you sure you want to delete your entire meal plan?')) {
        mealPlan.reset();
    }
});
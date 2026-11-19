
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
        $(content).stop(true, false).slideUp(duration, function () {
            content.hidden = true;
        });
    }
});


// FORM VALIDATION
function validateForm() {
    let valid = true;

    let food = $('#food').val().trim();

    if (food.length < 2) {
        $('#food').addClass('is-invalid');
        valid = false;
    } else {
        $('#food').removeClass('is-invalid');
    }

    nutrientFields.forEach(field => {
        let value = $(`#${field}`).val();

        if (value === '' || isNaN(value) || Number(value) < 0) {
            $(`#${field}`).addClass('is-invalid');
            valid = false;
        } else {
            $(`#${field}`).removeClass('is-invalid');
        }
    });

    return valid;
}


$('#meal-form input').on('input', function () {
    $(this).removeClass('is-invalid');
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


    render() {
        const groups = {
            Breakfast: [],
            Lunch: [],
            Dinner: [],
            Other: []
        };

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

        const totals = this.calculateTotals();

        nutrientFields.forEach(field => {
            $(`#total-${field}`).text(totals[field]);
        });
    }


    // LOCAL STORAGE
    save() {
        localStorage.setItem('mealPlan', JSON.stringify(this.meals));
    }

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


const mealPlan = new MealPlan();


// FORM: ADD NEW MEAL
$('#meal-form').on('submit', function (event) {
    event.preventDefault();

    if (!validateForm()) {
        $('#meal-message').text('Please correct the highlighted fields.');
        return;
    }

    const meal = new Meal(
        $('#meal').val(),
        $('#food').val().trim(),
        ...nutrientFields.map(field => Number($(`#${field}`).val()))
    );

    mealPlan.addMeal(meal);

    this.reset();

    $('#meal-message').text(`${meal.food} added. Totals updated.`);
    $('#food').focus();
});


// RESET PLAN
$('#reset-plan').on('click', function () {
    if (confirm('Are you sure you want to delete your entire meal plan?')) {
        mealPlan.reset();
        $('#meal-message').text('Your meal plan has been reset.');
    }
});

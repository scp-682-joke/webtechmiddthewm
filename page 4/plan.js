'use strict';

// One continuous decorative layer per column preserves the semantic HTML table.
const table = document.querySelector('.plan-table');
const container = table.closest('.table-responsive');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const columns = Array.from(table.querySelectorAll('thead th'));
const shines = columns.map((column, index) => {
    const shine = document.createElement('span');
    shine.className = 'column-shine';
    shine.setAttribute('aria-hidden', 'true');
    shine.style.setProperty('--shine-delay', `${index * 0.45}s`);
    container.appendChild(shine);
    return shine;
});

function positionShines() {
    const tableBounds = table.getBoundingClientRect();
    columns.forEach((column, index) => {
        const bounds = column.getBoundingClientRect();
        Object.assign(shines[index].style, {
            left: `${column.offsetLeft}px`,
            top: `${table.offsetTop}px`,
            width: `${bounds.width}px`,
            height: `${tableBounds.height}px`
        });
    });
}

function updateMotion() {
    container.classList.toggle('shine-active', !reducedMotion.matches && !document.hidden);
}

positionShines();
new ResizeObserver(positionShines).observe(table);
document.addEventListener('visibilitychange', updateMotion);
reducedMotion.addEventListener('change', updateMotion);
updateMotion();

const storageKey = 'form-fitness-weekly-workouts';
const workoutRows = Array.from(table.querySelectorAll('tbody tr'));
const progressTrack = document.querySelector('.weekly-progress-track');
const progressFill = document.querySelector('.weekly-progress-fill');
const progressCount = document.getElementById('weekly-progress-count');
let activeWeek;

function getWeekKey(date) {
    const monday = new Date(date);
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    return `${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
}

const workouts = workoutRows.map(row => {
    const day = row.cells[0].textContent.trim();
    const exerciseCell = row.cells[2];
    const exercise = exerciseCell.textContent.trim();
    const label = document.createElement('label');
    label.className = 'workout-check';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('aria-label', `Completed: ${day}, ${exercise}`);
    label.append(checkbox, document.createTextNode(exercise));
    exerciseCell.replaceChildren(label);
    checkbox.addEventListener('change', () => {
        // Preserve this click if a page has remained open across Monday midnight.
        const checked = checkbox.checked;
        if (activeWeek !== getWeekKey(new Date())) refreshWeek();
        checkbox.checked = checked;
        updateProgress();
        try {
            localStorage.setItem(storageKey, JSON.stringify({
                week: activeWeek,
                completed: workouts.filter(workout => workout.checkbox.checked).map(workout => workout.id)
            }));
        } catch {
            document.getElementById('progress-storage-note').textContent = 'Progress works for this visit, but this browser could not save it.';
        }
    });
    return { row, day, checkbox, id: `${day}:${exercise}` };
});

function updateProgress() {
    const completed = workouts.filter(workout => workout.checkbox.checked).length;
    progressCount.textContent = `${completed} / ${workouts.length} completed`;
    progressTrack.setAttribute('aria-valuemax', workouts.length);
    progressTrack.setAttribute('aria-valuenow', completed);
    progressFill.style.width = `${completed / workouts.length * 100}%`;
    workouts.forEach(workout => workout.row.classList.toggle('is-complete', workout.checkbox.checked));
}

function refreshWeek() {
    const now = new Date();
    const week = getWeekKey(now);
    if (week !== activeWeek) {
        let completed = [];
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey));
            if (saved?.week === week && Array.isArray(saved.completed)) completed = saved.completed;
        } catch {
            // Missing or invalid storage should never prevent using the checklist.
        }
        workouts.forEach(workout => { workout.checkbox.checked = completed.includes(workout.id); });
        activeWeek = week;
    }
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    workouts.forEach(workout => workout.row.classList.toggle('is-today', workout.day === today));
    document.getElementById('today-workouts').textContent = workouts.some(workout => workout.day === today)
        ? `${today}: today's workouts are highlighted below.`
        : `${today}: rest day — no workouts scheduled.`;
    updateProgress();
}

refreshWeek();
document.querySelector('.weekly-progress').hidden = false;
window.addEventListener('focus', refreshWeek);
// Keep the day highlight and weekly reset current if the page stays open overnight.
setInterval(refreshWeek, 60000);

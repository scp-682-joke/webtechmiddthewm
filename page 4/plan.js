
'use strict';

const STORAGE_KEY = 'formFitnessWeeklyProgress';
const HISTORY_KEY = 'formFitnessWeeklyHistory';

const checkboxes = Array.from(
    document.querySelectorAll('.workout-checkbox')
);

const muscleGroups = ['Arms', 'Legs', 'Abs'];

let currentWeek = getWeekStart();
let weeklyHistory = [];
let storageAvailable = true;

function getWeekStart(date = new Date()) {
    const day = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    const weekday = day.getDay();
    const difference = (weekday + 6) % 7;

    day.setDate(day.getDate() - difference);

    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dateNumber = String(day.getDate()).padStart(2, '0');

    return `${year}-${month}-${dateNumber}`;
}

function safeRead(key, fallback) {
    try {
        const raw = localStorage.getItem(key);

        if (raw === null) return fallback;

        return JSON.parse(raw);
    } catch (error) {
        console.warn('Storage read failed:', error);
        return fallback;
    }
}

function safeWrite(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        storageAvailable = false;
        showStorageMessage(
            'Browser storage is unavailable. Changes may not be saved.'
        );
        return false;
    }
}

function showStorageMessage(message) {
    document.getElementById('storageMessage').textContent = message;
}

function getCompletionData() {
    const completed = {};

    checkboxes.forEach(checkbox => {
        completed[checkbox.dataset.id] = checkbox.checked;
    });

    return completed;
}

function applyCompletionData(data) {
    checkboxes.forEach(checkbox => {
        checkbox.checked = data[checkbox.dataset.id] === true;
    });
}

function calculateStatistics(data = getCompletionData()) {
    const total = checkboxes.length;
    let completed = 0;

    const groups = {};

    muscleGroups.forEach(group => {
        groups[group] = {
            total: 0,
            completed: 0
        };
    });

    checkboxes.forEach(checkbox => {
        const group = checkbox.dataset.group;
        const checked = data[checkbox.dataset.id] === true;

        if (!groups[group]) return;

        groups[group].total++;

        if (checked) {
            completed++;
            groups[group].completed++;
        }
    });

    return {
        total,
        completed,
        remaining: total - completed,
        percentage: total
            ? Math.round((completed / total) * 100)
            : 0,
        groups
    };
}

function updateDashboard() {
    const stats = calculateStatistics();

    document.getElementById('totalWorkouts').textContent =
        stats.total;

    document.getElementById('completedWorkouts').textContent =
        stats.completed;

    document.getElementById('remainingWorkouts').textContent =
        stats.remaining;

    document.getElementById('weeklyPercentage').textContent =
        `${stats.percentage}%`;

    document.getElementById('progressLabel').textContent =
        `${stats.completed} of ${stats.total} completed`;

    document.getElementById('weeklyProgressFill').style.width =
        `${stats.percentage}%`;

    document.getElementById('weeklyProgress').setAttribute(
        'aria-valuenow',
        String(stats.percentage)
    );

    updateMuscleChart(stats.groups);
}

function updateMuscleChart(groups) {
    const chart = document.getElementById('muscleChart');
    chart.replaceChildren();

    muscleGroups.forEach(group => {
        const data = groups[group];

        const percentage = data.total
            ? Math.round((data.completed / data.total) * 100)
            : 0;

        const row = document.createElement('div');
        row.className = 'muscle-chart-row';

        const heading = document.createElement('div');
        heading.className = 'muscle-chart-heading';

        const name = document.createElement('strong');
        name.textContent = group;

        const count = document.createElement('span');
        count.textContent =
            `${data.completed} / ${data.total} (${percentage}%)`;

        heading.append(name, count);

        const track = document.createElement('div');
        track.className = 'muscle-chart-track';

        const bar = document.createElement('div');
        bar.className = 'muscle-chart-bar';
        bar.style.width = `${percentage}%`;

        track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-label', `${group} completion`);
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        track.setAttribute('aria-valuenow', String(percentage));

        track.appendChild(bar);
        row.append(heading, track);
        chart.appendChild(row);
    });
}

function isValidWeek(value) {
    if (typeof value !== 'string') return false;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day &&
        date.getDay() === 1;
}

function isValidCompletionData(data) {
    if (!data || typeof data !== 'object' ||
        Array.isArray(data)) {
        return false;
    }

    return Object.entries(data).every(
        ([key, value]) =>
            checkboxes.some(box => box.dataset.id === key) &&
            typeof value === 'boolean'
    );
}

function createHistoryEntry(week, data) {
    return {
        week,
        ...calculateStatistics(data)
    };
}

function addHistoryEntry(week, data) {
    if (!isValidWeek(week) ||
        !isValidCompletionData(data)) {
        return;
    }

    const entry = createHistoryEntry(week, data);

    const existingIndex = weeklyHistory.findIndex(
        item => item.week === week
    );

    if (existingIndex !== -1) {
        weeklyHistory[existingIndex] = entry;
    } else {
        weeklyHistory.push(entry);
    }

    weeklyHistory.sort(
        (a, b) => b.week.localeCompare(a.week)
    );

    safeWrite(HISTORY_KEY, weeklyHistory);
}

function renderHistory() {
    const container = document.getElementById('weeklyHistory');
    container.replaceChildren();

    const previousWeeks = weeklyHistory.filter(
        item => item.week < currentWeek
    );

    if (!previousWeeks.length) {
        const empty = document.createElement('p');
        empty.className = 'history-empty';
        empty.textContent = 'No previous weekly records yet.';
        container.appendChild(empty);
        return;
    }

    previousWeeks.forEach(item => {
        const card = document.createElement('article');
        card.className = 'weekly-history-card';

        const title = document.createElement('h3');
        title.textContent = `Week of ${item.week}`;

        const details = document.createElement('p');
        details.textContent =
            `${item.completed} of ${item.total} workouts completed`;

        const percentage = document.createElement('strong');
        percentage.textContent = `${item.percentage}%`;

        const track = document.createElement('div');
        track.className = 'history-progress-track';

        const fill = document.createElement('div');
        fill.className = 'history-progress-fill';
        fill.style.width = `${item.percentage}%`;

        track.appendChild(fill);
        card.append(title, details, percentage, track);

        container.appendChild(card);
    });
}

function saveCurrentWeek() {
    const data = {
        week: currentWeek,
        completed: getCompletionData()
    };

    safeWrite(STORAGE_KEY, data);
}

function loadHistory() {
    const saved = safeRead(HISTORY_KEY, []);

    if (!Array.isArray(saved)) {
        weeklyHistory = [];
        return;
    }

    const unique = new Map();

    saved.forEach(item => {
        if (!item || !isValidWeek(item.week)) return;

        if (!Number.isInteger(item.total) ||
            !Number.isInteger(item.completed) ||
            item.total < 0 ||
            item.completed < 0 ||
            item.completed > item.total) {
            return;
        }

        if (!item.groups || typeof item.groups !== 'object') {
            return;
        }

        const groupsValid = muscleGroups.every(group => {
            const value = item.groups[group];

            return value &&
                Number.isInteger(value.total) &&
                Number.isInteger(value.completed) &&
                value.total >= 0 &&
                value.completed >= 0 &&
                value.completed <= value.total;
        });

        if (!groupsValid) return;

        const groupTotals = muscleGroups.reduce(
            (sum, group) => sum + item.groups[group].total,
            0
        );

        const groupCompleted = muscleGroups.reduce(
            (sum, group) => sum + item.groups[group].completed,
            0
        );

        if (groupTotals !== item.total ||
            groupCompleted !== item.completed) {
            return;
        }

        const percentage = item.total
            ? Math.round(item.completed / item.total * 100)
            : 0;

        unique.set(item.week, {
            week: item.week,
            total: item.total,
            completed: item.completed,
            remaining: item.total - item.completed,
            percentage,
            groups: item.groups
        });
    });

    weeklyHistory = Array.from(unique.values())
        .sort((a, b) => b.week.localeCompare(a.week));
}

function checkWeekChange() {
    const todayWeek = getWeekStart();

    if (todayWeek === currentWeek) return;

    const oldWeek = currentWeek;
    const oldData = getCompletionData();

    if (oldWeek < todayWeek) {
        addHistoryEntry(oldWeek, oldData);
    }

    currentWeek = todayWeek;
    applyCompletionData({});
    saveCurrentWeek();
    updateDashboard();
    renderHistory();
}

function initializePlan() {
    loadHistory();

    const saved = safeRead(STORAGE_KEY, null);
    const todayWeek = getWeekStart();

    if (saved &&
        isValidWeek(saved.week) &&
        isValidCompletionData(saved.completed)) {

        if (saved.week === todayWeek) {
            applyCompletionData(saved.completed);
        } else if (saved.week < todayWeek) {
            addHistoryEntry(saved.week, saved.completed);
        }
    }

    currentWeek = todayWeek;
    saveCurrentWeek();
    updateDashboard();
    renderHistory();
}

checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        checkWeekChange();
        updateDashboard();
        saveCurrentWeek();
    });
});

document.getElementById('resetWeekBtn')
    .addEventListener('click', () => {
        checkWeekChange();

        const confirmed = window.confirm(
            'Reset all completed workouts for this week?'
        );

        if (!confirmed) return;

        applyCompletionData({});
        updateDashboard();
        saveCurrentWeek();

        showStorageMessage(
            'Current week has been reset successfully.'
        );
    });

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkWeekChange();
});

window.addEventListener('focus', checkWeekChange);

initializePlan();

// Preserve the original column shimmer animation.
const planTable = document.querySelector('.plan-table');
const tableContainer = planTable?.closest('.table-responsive');

if (planTable && tableContainer) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const columns = Array.from(planTable.querySelectorAll('thead th'));

    const shines = columns.map((column, index) => {
        const shine = document.createElement('span');
        shine.className = 'column-shine';
        shine.setAttribute('aria-hidden', 'true');
        shine.style.setProperty('--shine-delay', `${index * 0.45}s`);
        tableContainer.appendChild(shine);
        return shine;
    });

    function positionShines() {
        const tableBounds = planTable.getBoundingClientRect();

        columns.forEach((column, index) => {
            const bounds = column.getBoundingClientRect();

            Object.assign(shines[index].style, {
                left: `${column.offsetLeft}px`,
                top: `${planTable.offsetTop}px`,
                width: `${bounds.width}px`,
                height: `${tableBounds.height}px`
            });
        });
    }

    function updateShimmerMotion() {
        tableContainer.classList.toggle(
            'shine-active',
            !reducedMotion.matches && !document.hidden
        );
    }

    function highlightToday() {
        const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long'
        });

        planTable.querySelectorAll('tbody tr').forEach(row => {
            const day = row.cells[0]?.textContent.trim();
            row.classList.toggle('is-today', day === today);
        });
    }

    positionShines();
    highlightToday();
    updateShimmerMotion();

    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(positionShines).observe(planTable);
    } else {
        window.addEventListener('resize', positionShines);
    }

    document.addEventListener('visibilitychange', () => {
        updateShimmerMotion();
        if (!document.hidden) highlightToday();
    });

    reducedMotion.addEventListener('change', updateShimmerMotion);

    window.addEventListener('focus', highlightToday);

    setInterval(() => {
        checkWeekChange();
        highlightToday();
    }, 60000);
}

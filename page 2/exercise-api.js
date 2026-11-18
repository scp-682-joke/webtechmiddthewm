'use strict';

(() => {
    const search = document.getElementById('api-search');
    const muscle = document.getElementById('api-muscle');
    const sort = document.getElementById('api-sort');
    const status = document.getElementById('api-status');
    const count = document.getElementById('api-count');
    const results = document.getElementById('api-results');
    const retry = document.getElementById('api-retry');
    const more = document.getElementById('api-more');
    const exercises = new Map();
    const exerciseLimit = 15;
    let nextUrl = 'https://wger.de/api/v2/exerciseinfo/?limit=50';
    let loading = false;

    function element(tag, text) {
        const node = document.createElement(tag);
        node.textContent = text;
        return node;
    }

    class Exercise {
        constructor(data, translation) {
            this.id = data.id;
            this.name = translation.name;
            this.category = data.category?.name?.toLowerCase() || '';
            // Parse remote markup in an inert template; insert only its plain text.
            const template = document.createElement('template');
            template.innerHTML = typeof translation.description === 'string' ? translation.description : '';
            this.description = template.content.textContent.trim();
            this.muscles = [...data.muscles, ...data.muscles_secondary];
            this.author = translation.license_author || data.license_author || 'wger contributors';
        }

        matches(query, muscleId) {
            return `${this.name} ${this.description}`.toLowerCase().includes(query)
                && (muscleId === 'all' || this.muscles.some(item => String(item.id) === muscleId));
        }

        createCard() {
            const card = element('article', '');
            card.className = 'exercise-card api-card';
            card.append(element('h3', this.name));
            const names = [...new Set(this.muscles.map(item => item.name_en || item.name))];
            card.append(element('p', `Muscles: ${names.join(', ') || 'Not specified'}`));
            const details = element('details', '');
            details.append(element('summary', 'Instructions'), element('p', this.description || 'No instructions supplied.'));
            const source = element('a', 'Source and license on wger');
            source.href = `https://wger.de/en/exercise/${this.id}/view/`;
            card.append(details, element('small', `By ${this.author}`), source);
            return card;
        }
    }

    function render() {
        const matches = [...exercises.values()].filter(exercise => exercise.matches(search.value.trim().toLowerCase(), muscle.value));
        matches.sort((a, b) => a.name.localeCompare(b.name) * (sort.value === 'desc' ? -1 : 1));
        results.replaceChildren(...matches.map(exercise => exercise.createCard()));
        count.textContent = `${matches.length} matching exercises out of ${exercises.size} loaded.`;
        if (!matches.length) {
            results.append(element('p', exercises.size
                ? 'No exercises match. Try another search or muscle group.'
                : 'No English exercises loaded. If available, load more to continue.'));
        }
    }

    function updateMuscles() {
        const selected = muscle.value;
        const groups = new Map();
        exercises.forEach(exercise => exercise.muscles.forEach(item => groups.set(String(item.id), item.name_en || item.name)));
        muscle.replaceChildren(new Option('All muscles', 'all'));
        [...groups].sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, name]) => muscle.add(new Option(name, id)));
        muscle.value = groups.has(selected) ? selected : 'all';
    }

    async function loadExercises() {
        if (loading || !nextUrl) return;
        loading = true;
        more.disabled = true;
        retry.disabled = true;
        results.setAttribute('aria-busy', 'true');
        status.textContent = 'Loading exercises from wger…';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
            const response = await fetch(nextUrl, { signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!data || !Array.isArray(data.results) || !Number.isInteger(data.count)
                || !(data.next === null || typeof data.next === 'string')) {
                throw new Error('Unexpected response structure');
            }
            // Follow the API's next link, not a guessed offset or page count.
            const next = data.next === null ? null : new URL(data.next, nextUrl);
            if (next && (next.origin !== 'https://wger.de' || next.pathname !== '/api/v2/exerciseinfo/' || next.href === nextUrl)) {
                throw new Error('Unexpected pagination link');
            }
            const page = [];
            for (const item of data.results) {
                if (!item || !Number.isInteger(item.id) || !Array.isArray(item.translations)
                    || !Array.isArray(item.muscles) || !Array.isArray(item.muscles_secondary)
                    || [...item.muscles, ...item.muscles_secondary].some(group => !group || !Number.isInteger(group.id) || typeof group.name !== 'string')) {
                    throw new Error('Unexpected exercise structure');
                }
                const english = item.translations.find(text => text && text.language === 2 && typeof text.name === 'string' && text.name.trim());
                if (english) page.push(new Exercise(item, english));
            }
            // Prefer a balanced selection of the page's abs, legs and arms records.
            const preferred = ['abs', 'legs', 'arms'];
            const candidates = [...exercises.values(), ...page];
            const selection = new Map();
            preferred.forEach(group => {
                candidates.filter(exercise => exercise.category === group).slice(0, 5)
                    .forEach(exercise => selection.set(exercise.id, exercise));
            });
            const remaining = candidates.filter(exercise => preferred.includes(exercise.category))
                .concat(candidates);
            for (const exercise of remaining) {
                if (selection.size >= exerciseLimit) break;
                selection.set(exercise.id, exercise);
            }
            exercises.clear();
            selection.forEach(exercise => exercises.set(exercise.id, exercise));
            nextUrl = exercises.size < exerciseLimit && next ? next.href : null;
            updateMuscles();
            render();
            status.textContent = `Exercises loaded from wger.${nextUrl ? ' Load more to complete the selection.' : exercises.size === exerciseLimit ? ' Showing a selection of 15 exercises.' : ' All available English exercises loaded.'}`;
            retry.hidden = true;
            more.hidden = !nextUrl;
        } catch (error) {
            status.textContent = 'Could not load exercises. Check your connection and retry. Previously loaded exercises remain available.';
            retry.hidden = false;
            more.hidden = true;
            console.warn('wger exercise request failed:', error);
        } finally {
            clearTimeout(timeout);
            loading = false;
            more.disabled = false;
            retry.disabled = false;
            results.setAttribute('aria-busy', 'false');
        }
    }

    search.addEventListener('input', render);
    muscle.addEventListener('change', render);
    sort.addEventListener('change', render);
    retry.addEventListener('click', loadExercises);
    more.addEventListener('click', loadExercises);
    loadExercises();
})();

'use strict';

const filterButtons = Array.from(document.querySelectorAll('[data-muscle-filter]'));
const muscleSections = Array.from(document.querySelectorAll('.muscle-section'));
const filterMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let filterVersion = 0;
let filterAnimations = [];

async function filterMuscles(group) {
    const version = ++filterVersion;
    filterAnimations.forEach(animation => animation.cancel());
    filterButtons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.muscleFilter === group));
    });

    // Fade out first, then change the layout and bring matching sections back in.
    filterAnimations = muscleSections.filter(section => !section.hidden).map(section =>
        section.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: filterMotion.matches ? 0 : 140, fill: 'forwards'
        })
    );
    await Promise.allSettled(filterAnimations.map(animation => animation.finished));
    if (version !== filterVersion) return;
    filterAnimations.forEach(animation => animation.cancel());
    muscleSections.forEach(section => { section.hidden = group !== 'all' && section.id !== group; });

    // Re-measure instruction space now that the selected sections are visible.
    window.dispatchEvent(new Event('resize'));
    const visibleSections = muscleSections.filter(section => !section.hidden);
    const count = visibleSections.reduce((total, section) => total + section.querySelectorAll('.exercise-card').length, 0);
    document.getElementById('filter-status').textContent = `${count} exercises · ${group === 'all' ? 'All muscle groups' : group[0].toUpperCase() + group.slice(1)}`;
    filterAnimations = visibleSections.map((section, index) => section.animate([
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' }
    ], { duration: filterMotion.matches ? 0 : 260, delay: filterMotion.matches ? 0 : index * 45, fill: 'backwards', easing: 'ease-out' }));
}

filterButtons.forEach(button => button.addEventListener('click', () => {
    filterMuscles(button.dataset.muscleFilter);
}));
document.querySelector('.muscle-filters').hidden = false;

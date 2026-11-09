'use strict';

// Native details remain usable if jQuery cannot load.
if (window.jQuery) {
    const $ = window.jQuery;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const disclosures = [];

    $('.exercise-card details').each(function (index) {
        const details = this;
        const $summary = $(details).children('summary');
        const $content = $(details).children('.description');
        const state = { details, $summary, $content, expanded: details.open };
        disclosures.push(state);
        $content.attr('id', `exercise-instructions-${index + 1}`);
        $summary.attr('aria-controls', $content.attr('id'));

        function updateLabel() {
            $summary.text(state.expanded ? 'Show Less' : 'Show More');
            $summary.attr('aria-expanded', String(state.expanded));
        }

        $summary.on('click', function (event) {
            event.preventDefault();
            state.expanded = !state.expanded;
            updateLabel();
            // Stop at the current height so repeated clicks smoothly reverse direction.
            $content.stop(true, false);
            const duration = reducedMotion.matches ? 0 : 380;
            if (state.expanded) {
                details.open = true;
                $content.slideDown(duration);
            } else {
                $content.slideUp(duration, function () { details.open = false; });
            }
        });
        updateLabel();
    });

    function reserveInstructionSpace() {
        disclosures.forEach(({ details, $summary, $content, expanded }) => {
            if (!details.getClientRects().length) return;
            $content.stop(true, true);
            details.open = true;
            $content.show();
            // Reserve the natural expanded height, including margins, at this width.
            details.style.minHeight = `${Math.ceil($summary.outerHeight(true) + $content.outerHeight(true))}px`;
            $content.toggle(expanded);
            details.open = expanded;
        });
    }

    reserveInstructionSpace();
    let resizeFrame;
    window.addEventListener('resize', () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(reserveInstructionSpace);
    });
    document.fonts.ready.then(reserveInstructionSpace);
    reducedMotion.addEventListener('change', reserveInstructionSpace);
}

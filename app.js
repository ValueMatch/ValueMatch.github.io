document.addEventListener('DOMContentLoaded', () => {
    const TOTAL_TOKENS = 10;
    const sliders = [
        { el: document.getElementById('slider1'), disp: document.getElementById('val1-display') },
        { el: document.getElementById('slider2'), disp: document.getElementById('val2-display') },
        { el: document.getElementById('slider3'), disp: document.getElementById('val3-display') },
        { el: document.getElementById('slider4'), disp: document.getElementById('val4-display') }
    ];
    const tokenPoolDisplay = document.getElementById('tokenPool');
    const saveButton = document.getElementById('saveAlgoBtn');

    function updateSliders(changedSliderIdx) {
        let currentTotal = 0;
        
        // Calculate the tentative sum
        sliders.forEach(s => currentTotal += parseInt(s.el.value));

        // If the allocations exceed our maximum energy budget, throttle the slider movement
        if (currentTotal > TOTAL_TOKENS) {
            const excess = currentTotal - TOTAL_TOKENS;
            const targetSlider = sliders[changedSliderIdx].el;
            targetSlider.value = parseInt(targetSlider.value) - excess;
            currentTotal = TOTAL_TOKENS;
        }

        // Render remaining energy ledger points
        const remaining = TOTAL_TOKENS - currentTotal;
        tokenPoolDisplay.textContent = remaining;

        // Sync numerical text feedback
        sliders.forEach(s => s.disp.textContent = s.el.value);
    }

    // Attach real-time input listeners to each metric track
    sliders.forEach((slider, idx) => {
        slider.el.addEventListener('input', () => updateSliders(idx));
    });

    saveButton.addEventListener('click', () => {
        const payload = {
            sustainability: sliders[0].el.value,
            labor: sliders[1].el.value,
            crueltyFree: sliders[2].el.value,
            budget: sliders[3].el.value
        };
        
        // Alert configuration state (This data will securely hit Render backend API next)
        alert(`Algorithm locked successfully!\nSustainability: ${payload.sustainability}\nLabor: ${payload.labor}\nCruelty-Free: ${payload.crueltyFree}\nBudget: ${payload.budget}`);
    });
});

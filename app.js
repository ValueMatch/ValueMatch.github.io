const RENDER_BASE_URL = 'https://yourvaluematch-backend.onrender.com';

// 12-Point Catalog Data
const sovrnMerchantCatalog = [
    {
        name: "Hurraw! Balm",
        price: "£4.10",
        img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=150&q=80",
        metrics: { clean: 98, organic: 95, crueltyFree: 100, vegan: 100, waste: 80, climate: 85, labor: 90, transparency: 95, indie: 100, inclusion: 90, local: 70, regenerative: 85 },
        evidence: "Certified Vegan & Cruelty-Free. Independent business utilizing 100% organic cold-pressed oils. Transparent supply chain mapping provided.",
        targetUrl: "https://example.com/hurraw"
    },
    {
        name: "Dr. Bronner's Organic Lip Balm",
        price: "£3.75",
        img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=150&q=80",
        metrics: { clean: 95, organic: 100, crueltyFree: 100, vegan: 50, waste: 75, climate: 90, labor: 100, transparency: 85, indie: 100, inclusion: 80, local: 60, regenerative: 95 },
        evidence: "USDA Organic and Fair Trade Certified. Family-owned (independent) with rigorous, audited labor standards and climate-neutral factory operations. Contains beeswax.",
        targetUrl: "https://example.com/drbronners"
    },
    {
        name: "EcoLips Bee Free Balm",
        price: "£4.50",
        img: "https://images.unsplash.com/photo-1608248597481-496100c8c836?auto=format&fit=crop&w=150&q=80",
        metrics: { clean: 90, organic: 85, crueltyFree: 100, vegan: 100, waste: 100, climate: 70, labor: 90, transparency: 80, indie: 90, inclusion: 85, local: 90, regenerative: 75 },
        evidence: "100% Vegan formulation (candelilla wax). Uses a fully compostable, plastic-free Plant Pod tube (100% Zero-Waste). Certified B-Corp.",
        targetUrl: "https://example.com/ecolips"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const activeProfileLabel = document.getElementById('activeProfileLabel');
    const guestPanel = document.getElementById('guestConversionPanel');
    const resetEntireSessionLink = document.getElementById('resetEntireSessionLink');
    const scoreLabel = document.getElementById('computedScoreLabel');
    const alternativesContainer = document.getElementById('alternativesContainer');

    // All 12 Sliders and Outputs
    const sliderIds = ['sl_clean', 'sl_organic', 'sl_cruelty', 'sl_vegan', 'sl_waste', 'sl_climate', 'sl_labor', 'sl_transparency', 'sl_indie', 'sl_inclusion', 'sl_local', 'sl_regenerative'];
    const sliders = sliderIds.map(id => document.getElementById(id));
    const outputs = Array.from({length: 12}, (_, i) => document.getElementById(`valOut${i}`));
    
    // --- THE HANDSHAKE: INJECT SAVED PRESETS ---
    const savedScoresJSON = localStorage.getItem('userProfileScores');
    if (savedScoresJSON) {
        const presetScores = JSON.parse(savedScoresJSON);
        console.log("Template Loaded! Syncing sliders to:", presetScores);
        sliders.forEach((slider, index) => {
            if (slider && presetScores[index] !== undefined) {
                slider.value = presetScores[index];
            }
        });
    } else {
        console.log("No preset template found in localStorage. Defaulting to 50s.");
    }

    // 1. IDENTITY CHECK
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail && savedEmail.includes('@')) {
        activeProfileLabel.innerHTML = 'ACTIVE PROFILE:<br><span style="color: #818cf8;">' + savedEmail + '</span>';
        if (guestPanel) guestPanel.style.display = 'none';
    } else {
        activeProfileLabel.innerHTML = 'ACTIVE PROFILE:<br><span>GUEST PROFILE</span>';
        if (guestPanel) guestPanel.style.display = 'block';
    }

    // 2. GUEST CONVERSION ACTION
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const emailInput = document.getElementById('conversionEmailInput').value.trim();
            if (!emailInput.includes('@')) return alert("Please enter a valid email address.");

            localStorage.setItem('savedEmail', emailInput);
            alert("Value settings saved! Your zero-party profile is anchored.");
            window.location.reload(); 
        });
    }

    // 3. UI HELPER FUNCTIONS
    function updateColorClass(element, score) {
        if (!element) return;
        if (score >= 80) { element.style.color = "var(--match-green)"; } 
        else if (score >= 50) { element.style.color = "var(--match-orange)"; } 
        else { element.style.color = "var(--match-red)"; }
    }

    function updatePillColor(element, score) {
        if (!element) return;
        if (score >= 80) {
            element.style.backgroundColor = "rgba(34, 197, 94, 0.08)";
            element.style.color = "var(--match-green)";
            element.style.borderColor = "rgba(34, 197, 94, 0.1)";
        } else if (score >= 50) {
            element.style.backgroundColor = "rgba(249, 115, 22, 0.08)";
            element.style.color = "var(--match-orange)";
            element.style.borderColor = "rgba(249, 115, 22, 0.1)";
        } else {
            element.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
            element.style.color = "var(--match-red)";
            element.style.borderColor = "rgba(239, 68, 68, 0.1)";
        }
    }

    // 4. CORE ALGORITHM LOGIC (12-Point Match)
    function recalibrateAlgorithm() {
        const userValues = sliders.map(s => parseInt(s.value) || 0);
        
        userValues.forEach((val, i) => {
            if(outputs[i]) outputs[i].textContent = val + '%';
        });

        let sumWeights = userValues.reduce((a,b) => a+b, 0);
        let avgWeight = sumWeights / 12;
        let finalHeroScore = Math.max(12, 100 - Math.round(avgWeight * 0.85));
        scoreLabel.textContent = finalHeroScore + '%';
        updateColorClass(scoreLabel, finalHeroScore);

        let calculatedDirectory = sovrnMerchantCatalog.map(product => {
            const pMetrics = [
                product.metrics.clean, product.metrics.organic, product.metrics.crueltyFree,
                product.metrics.vegan, product.metrics.waste, product.metrics.climate,
                product.metrics.labor, product.metrics.transparency, product.metrics.indie,
                product.metrics.inclusion, product.metrics.local, product.metrics.regenerative
            ];
            
            let totalVariance = 0;
            for(let i = 0; i < 12; i++) {
                let importanceMultiplier = (userValues[i] / 100) + 0.5; 
                totalVariance += Math.abs(pMetrics[i] - userValues[i]) * importanceMultiplier;
            }
            
            let avgRawVariance = totalVariance / 12;
            let alignmentPercentage = Math.max(10, Math.min(100, Math.round(100 - avgRawVariance)));
            
            return Object.assign({}, product, { computedMatchScore: alignmentPercentage });
        });

        calculatedDirectory.sort((a, b) => b.computedMatchScore - a.computedMatchScore);

        alternativesContainer.innerHTML = "";
        calculatedDirectory.forEach((product, idx) => {
            const card = document.createElement('div');
            card.className = "alternative-card";
            card.innerHTML = `
                <div class="alt-top">
                    <div style="display:flex; gap:16px; align-items:center;">
                        <div class="media-box">
                            <img src="${product.img}" alt="${product.name}">
                        </div>
                        <div>
                            <h4 class="alt-brand-name" style="margin:0;">${product.name}</h4>
                            <span class="alt-pricing">Market Price: ${product.price}</span>
                        </div>
                    </div>
                    <span class="badge-pill" id="scorePill_index_${idx}" style="border: 1px solid;">${product.computedMatchScore}% Value Alignment</span>
                </div>
                
                <div class="log-container">
                    <strong>Verified Evidence Log:</strong> ${product.evidence}
                </div>
                
                <button class="swap-button" data-product-name="${product.name}">Swap to ${product.name}</button>
            `;
            alternativesContainer.appendChild(card);
            
            const currentPill = document.getElementById('scorePill_index_' + idx);
            if (currentPill) { updatePillColor(currentPill, product.computedMatchScore); }
        });
    }

    sliders.forEach(s => { if(s) s.addEventListener('input', recalibrateAlgorithm); });
    recalibrateAlgorithm();

    // 5. TELEMETRY LOGGING (Full 12-Point Payload)
    async function sendValueTelemetry(targetAlternative) {
        const currentEmail = savedEmail || "GUEST PROFILE";
        const currentValues = sliders.map(s => parseInt(s.value) || 0);

        const valuePayload = {
            email: currentEmail,
            clicked_product: targetAlternative,
            clean_ingredients_score: currentValues[0],
            organic_score: currentValues[1],
            cruelty_free_score: currentValues[2],
            vegan_score: currentValues[3],
            low_waste_score: currentValues[4],
            climate_impact_score: currentValues[5],
            ethical_labor_score: currentValues[6],
            transparency_score: currentValues[7],
            indie_scale_score: currentValues[8],
            inclusion_score: currentValues[9],
            local_sourcing_score: currentValues[10],
            regenerative_ag_score: currentValues[11]
        };

        console.log("Transmitting 12-point value matrix to PostgreSQL...", valuePayload);

        try {
            await fetch(`${RENDER_BASE_URL}/api/logs/click`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(valuePayload),
                keepalive: true
            });
            console.log("Database transaction log committed.");
        } catch (err) {
            console.error("Telemetry channel deferred:", err);
        }
    }

    // Affiliate Routing Intercept
    alternativesContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('swap-button')) {
            const alternativeName = e.target.getAttribute('data-product-name');
            await sendValueTelemetry(alternativeName);

            const selectedProduct = sovrnMerchantCatalog.find(p => p.name === alternativeName);
            const destinationUrl = selectedProduct ? selectedProduct.targetUrl : "https://www.google.com";
            
            const SOVRN_API_KEY = "YOUR_SOVRN_API_KEY"; 
            const userTrackingId = encodeURIComponent(savedEmail || "GUEST PROFILE");

            const liveAffiliateRedirectUrl = `https://redirect.viglink.com?key=${SOVRN_API_KEY}&u=${encodeURIComponent(destinationUrl)}&cuid=${userTrackingId}`;

            console.log("Routing session through live Sovrn monetization engine...");
            window.location.href = liveAffiliateRedirectUrl;
        }
    });

    // 6. HEADER & SIDEBAR ACTIONS
    document.getElementById('triggerScanBtn').addEventListener('click', function() {
        const path = document.getElementById('itemUrlInput').value.trim();
        if(!path) return alert('Please enter a target product URL.');
        try {
            const urlObj = new URL(path);
            document.getElementById('displayDomain').textContent = urlObj.hostname.replace('www.', '');
            recalibrateAlgorithm(); 
        } catch(e) {
            document.getElementById('displayDomain').textContent = 'External Store Listing';
        }
    });

    document.getElementById('resetInputLink').addEventListener('click', function() {
        document.getElementById('itemUrlInput').value = '';
        document.getElementById('itemUrlInput').focus();
    });

    if (resetEntireSessionLink) {
        resetEntireSessionLink.addEventListener('click', function() {
            try { 
                localStorage.clear(); 
                window.location.href = 'index.html';
            } catch(err){}
        });
    }
});

const RENDER_BASE_URL = 'https://yourvaluematch-backend.onrender.com'; // <-- CHANGE THIS TO YOUR LIVE BACKEND URL
let sovrnMerchantCatalog = []; 

document.addEventListener('DOMContentLoaded', async () => {
    const activeProfileLabel = document.getElementById('activeProfileLabel');
    const guestPanel = document.getElementById('guestConversionPanel');
    const resetEntireSessionLink = document.getElementById('resetEntireSessionLink');
    const scoreLabel = document.getElementById('computedScoreLabel');
    const alternativesContainer = document.getElementById('alternativesContainer');

    const sliderIds = ['sl_clean', 'sl_organic', 'sl_cruelty', 'sl_vegan', 'sl_waste', 'sl_climate', 'sl_labor', 'sl_transparency', 'sl_indie', 'sl_inclusion', 'sl_local', 'sl_regenerative'];
    const sliders = sliderIds.map(id => document.getElementById(id));
    const outputs = Array.from({length: 12}, (_, i) => document.getElementById(`valOut${i}`));
    
    let currentScannedMetrics = null;

    // --- 1. FETCH LIVE PRODUCTS FROM POSTGRES ---
    try {
        const res = await fetch(`${RENDER_BASE_URL}/api/products`);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.products) {
                sovrnMerchantCatalog = data.products.map(p => ({
                    name: p.name,
                    price: `£${p.price}`,
                    img: p.image_url || "https://images.unsplash.com/photo-1608248597481-496100c8c836?auto=format&fit=crop&w=150&q=80",
                    metrics: {
                        clean: p.clean_ingredients_score || 50,
                        organic: 50, 
                        crueltyFree: p.cruelty_free_score || 50,
                        vegan: p.cruelty_free_score > 70 ? 90 : 50, 
                        waste: p.low_waste_score || 50,
                        climate: p.low_waste_score || 50,
                        labor: p.ethical_labor_score || 50,
                        transparency: 60,
                        indie: 70,
                        inclusion: 50,
                        local: 40,
                        regenerative: 30
                    },
                    evidence: `Verified database asset matching brand tier: ${p.brand_name}. In stock at ${p.merchant_name || 'Partner Merchant'}.`,
                    targetUrl: p.original_url || "https://www.google.com"
                }));
            }
        }
    } catch (err) {
        console.error("Failed to feed live catalog stream:", err);
    }

    // --- 2. THE HANDSHAKE: INJECT SAVED PRESETS ---
    const savedScoresJSON = localStorage.getItem('userProfileScores');
    if (savedScoresJSON) {
        const presetScores = JSON.parse(savedScoresJSON);
        sliders.forEach((slider, index) => {
            if (slider && presetScores[index] !== undefined) {
                slider.value = presetScores[index];
            }
        });
    }

    // --- 3. IDENTITY CHECK ---
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail && savedEmail.includes('@')) {
        activeProfileLabel.innerHTML = 'ACTIVE PROFILE:<br><span style="color: #818cf8;">' + savedEmail + '</span>';
        if (guestPanel) guestPanel.style.display = 'none';
    } else {
        activeProfileLabel.innerHTML = 'ACTIVE PROFILE:<br><span>GUEST PROFILE</span>';
        if (guestPanel) guestPanel.style.display = 'block';
    }

    if (document.getElementById('saveProfileBtn')) {
        document.getElementById('saveProfileBtn').addEventListener('click', () => {
            const emailInput = document.getElementById('conversionEmailInput').value.trim();
            if (!emailInput.includes('@')) return alert("Please enter a valid email address.");
            localStorage.setItem('savedEmail', emailInput);
            alert("Value settings saved! Your zero-party profile is anchored.");
            window.location.reload(); 
        });
    }

    // --- 4. UI HELPER FUNCTIONS ---
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

    // --- 5. CORE ALGORITHM LOGIC ---
    function recalibrateAlgorithm() {
        const userValues = sliders.map(s => parseInt(s.value) || 0);
        
        userValues.forEach((val, i) => {
            if(outputs[i]) outputs[i].textContent = val + '%';
        });

        if (currentScannedMetrics) {
            let totalVariance = 0;
            for(let i = 0; i < 12; i++) {
                let importanceMultiplier = (userValues[i] / 100) + 0.5; 
                totalVariance += Math.abs(currentScannedMetrics[i] - userValues[i]) * importanceMultiplier;
            }
            let avgRawVariance = totalVariance / 12;
            let finalHeroScore = Math.max(0, Math.min(100, Math.round(100 - avgRawVariance)));
            scoreLabel.textContent = finalHeroScore + '%';
            updateColorClass(scoreLabel, finalHeroScore);
        }

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

    // --- 6. TELEMETRY & SOVRN ROUTING ---
    async function sendValueTelemetry(targetAlternative) {
        const currentEmail = savedEmail || "GUEST PROFILE";
        const currentValues = sliders.map(s => parseInt(s.value) || 0);
        const valuePayload = {
            email: currentEmail, clicked_product: targetAlternative,
            clean_ingredients_score: currentValues[0], organic_score: currentValues[1],
            cruelty_free_score: currentValues[2], vegan_score: currentValues[3],
            low_waste_score: currentValues[4], climate_impact_score: currentValues[5],
            ethical_labor_score: currentValues[6], transparency_score: currentValues[7],
            indie_scale_score: currentValues[8], inclusion_score: currentValues[9],
            local_sourcing_score: currentValues[10], regenerative_ag_score: currentValues[11]
        };
        try {
            await fetch(`${RENDER_BASE_URL}/api/logs/click`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valuePayload), keepalive: true
            });
        } catch (err) { console.error("Telemetry failed:", err); }
    }

    alternativesContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('swap-button')) {
            const alternativeName = e.target.getAttribute('data-product-name');
            await sendValueTelemetry(alternativeName);
            const selectedProduct = sovrnMerchantCatalog.find(p => p.name === alternativeName);
            const destinationUrl = selectedProduct ? selectedProduct.targetUrl : "https://www.google.com";
            const SOVRN_API_KEY = "YOUR_SOVRN_API_KEY"; 
            const userTrackingId = encodeURIComponent(savedEmail || "GUEST PROFILE");
            const liveAffiliateRedirectUrl = `https://redirect.viglink.com?key=${SOVRN_API_KEY}&u=${encodeURIComponent(destinationUrl)}&cuid=${userTrackingId}`;
            window.location.href = liveAffiliateRedirectUrl;
        }
    });

    // --- 7. LIVE AI SCANNER INTEGRATION ---
    document.getElementById('triggerScanBtn').addEventListener('click', async function() {
        const path = document.getElementById('itemUrlInput').value.trim();
        if(!path) return alert('Please enter a target product URL.');
        
        const scanBtn = this;
        scanBtn.textContent = 'Auditing...';
        scanBtn.style.background = '#818cf8'; 
        scanBtn.disabled = true;

        try {
            const urlObj = new URL(path);
            document.getElementById('displayDomain').textContent = urlObj.hostname.replace('www.', '');
            
            const response = await fetch(`${RENDER_BASE_URL}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: path, userEmail: savedEmail })
            });

            const data = await response.json();
            
            if(data.success && data.auditedProduct) {
                const aiData = data.auditedProduct;
                document.getElementById('displayProductTitle').textContent = aiData.product_name || aiData.brand;
                // --- UPDATE PRICE ---
                    const priceEl = document.getElementById('displayScannedPrice');
                    if (aiData.price && aiData.price !== 'N/A') {
                        priceEl.textContent = `Est. Price: ${aiData.price}`;
                        priceEl.style.display = 'inline-block'; 
                    } else {
                        priceEl.style.display = 'none'; 
                    }
                
                    // --- UPDATE IMAGE ---
                    if (aiData.image_url) {
                        const heroImage = document.querySelector('.scanned-hero-card img');
                        if (heroImage) {
                            heroImage.src = aiData.image_url;
                        }
                    }
                
                currentScannedMetrics = [
                    aiData.metrics.clean, aiData.metrics.organic, aiData.metrics.crueltyFree,
                    aiData.metrics.vegan, aiData.metrics.waste, aiData.metrics.climate,
                    aiData.metrics.labor, aiData.metrics.transparency, aiData.metrics.indie,
                    aiData.metrics.inclusion, aiData.metrics.local, aiData.metrics.regenerative
                ];

                let evidenceBox = document.getElementById('heroEvidenceLog');
                if(!evidenceBox) {
                    evidenceBox = document.createElement('div');
                    evidenceBox.id = 'heroEvidenceLog';
                    evidenceBox.className = 'log-container';
                    evidenceBox.style.marginTop = '16px';
                    document.querySelector('.scanned-hero-card').parentElement.insertBefore(evidenceBox, document.querySelector('.stream-title-row'));
                }
                
                evidenceBox.innerHTML = `<strong>AI Audit Evidence:</strong> ${aiData.evidence}`;
                evidenceBox.style.borderLeftColor = '#ef4444'; 
                
                recalibrateAlgorithm(); 
            } else {
                alert('Audit failed. Please check your backend terminal for errors.');
            }
        } catch(e) {
            console.error(e);
            document.getElementById('displayDomain').textContent = 'External Store Listing';
            alert('Failed to connect to the backend agent.');
        } finally {
            scanBtn.textContent = 'Scan';
            scanBtn.style.background = '#0f172a';
            scanBtn.disabled = false;
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

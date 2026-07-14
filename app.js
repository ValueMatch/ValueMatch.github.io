const RENDER_BASE_URL = 'https://yourvaluematch-backend.onrender.com';
let sovrnMerchantCatalog = []; 

// --- 1. BASELINE PILLAR LOGIC ---
// Array order MUST MATCH: [Clean, Cruelty, Vegan, Waste, Climate, Labor, Independent, Inclusion]
const pillarPresets = {
    'clean-composition': [100, 60, 50, 60, 50, 50, 50, 50],
    'ethical-labour':    [50, 50, 50, 50, 50, 100, 50, 90],
    'planet-first':      [60, 50, 50, 100, 100, 60, 50, 50],
    'animal-advocate':   [60, 100, 100, 50, 60, 50, 50, 50]
};

// Global function so your HTML <select> or radio buttons onchange event can trigger it
window.applyBaselinePillar = function(pillarName) {
    const values = pillarPresets[pillarName];
    if (!values) return;

    // Save to localStorage so it persists on refresh
    localStorage.setItem('userProfileScores', JSON.stringify(values));

    const sliderIds = ['sl_clean', 'sl_cruelty', 'sl_vegan', 'sl_waste', 'sl_climate', 'sl_labor', 'sl_independent', 'sl_inclusion'];
    sliderIds.forEach((id, index) => {
        const slider = document.getElementById(id);
        const outputText = document.getElementById(`valOut${index}`);
        if (slider && outputText) {
            slider.value = values[index];
            outputText.innerText = values[index] + '%';
        }
    });

    // Fire a fake 'input' event on the first slider to force the algorithm to recalibrate
    const firstSlider = document.getElementById(sliderIds[0]);
    if(firstSlider) firstSlider.dispatchEvent(new Event('input'));
};

document.addEventListener('DOMContentLoaded', async () => {
    // Check if the user has successfully returned from Stripe checkout
    const urlParams = new URLSearchParams(window.location.search);
    const hasUnlockedPremium = urlParams.has('session_id');
    const activeProfileLabel = document.getElementById('activeProfileLabel');
    const guestPanel = document.getElementById('guestConversionPanel');
    const resetEntireSessionLink = document.getElementById('resetEntireSessionLink');
    const scoreLabel = document.getElementById('computedScoreLabel');
    const alternativesContainer = document.getElementById('alternativesContainer');

    // 8-Point Matrix
    const sliderIds = ['sl_clean', 'sl_cruelty', 'sl_vegan', 'sl_waste', 'sl_climate', 'sl_labor', 'sl_independent', 'sl_inclusion'];
    const sliders = sliderIds.map(id => document.getElementById(id));
    const outputs = Array.from({length: 8}, (_, i) => document.getElementById(`valOut${i}`));
    
    let currentScannedMetrics = null;

    // --- 2. FETCH LIVE PRODUCTS FROM POSTGRES ---
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
                        crueltyFree: p.cruelty_free_score || 50,
                        vegan: p.cruelty_free_score > 70 ? 90 : 50, 
                        waste: p.low_waste_score || 50,
                        climate: p.low_waste_score || 50,
                        labor: p.ethical_labor_score || 50,
                        independent: p.independent_scale_score || 50, 
                        inclusion: p.inclusion_score || 50 
                    },
                    evidence: `Verified database asset matching brand tier: ${p.brand_name}. In stock at ${p.merchant_name || 'Partner Merchant'}.`,
                    targetUrl: p.original_url || "https://www.google.com"
                }));
            }
        }
    } catch (err) {
        console.error("Failed to feed live catalog stream:", err);
    }

    // --- 3. THE HANDSHAKE: INJECT SAVED PRESETS ---
    const savedScoresJSON = localStorage.getItem('userProfileScores');
    if (savedScoresJSON) {
        const presetScores = JSON.parse(savedScoresJSON);
        sliders.forEach((slider, index) => {
            if (slider && presetScores[index] !== undefined) {
                slider.value = presetScores[index];
            }
        });
    }

    // --- 4. IDENTITY CHECK ---
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
            
            // Also save current slider state when anchoring profile
            const currentValues = sliders.map(s => parseInt(s.value) || 0);
            localStorage.setItem('userProfileScores', JSON.stringify(currentValues));

            alert("Value settings saved! Your zero-party profile is anchored.");
            window.location.reload(); 
        });
    }

    // --- 5. UI HELPER FUNCTIONS ---
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

    // --- 6. CORE ALGORITHM LOGIC (Updated for 8 Points) ---
    function recalibrateAlgorithm() {
        const userValues = sliders.map(s => parseInt(s.value) || 0);
        
        userValues.forEach((val, i) => {
            if(outputs[i]) outputs[i].textContent = val + '%';
        });

        if (currentScannedMetrics) {
            let totalVariance = 0;
            for(let i = 0; i < 8; i++) {
                let importanceMultiplier = (userValues[i] / 100) + 0.5; 
                totalVariance += Math.abs(currentScannedMetrics[i] - userValues[i]) * importanceMultiplier;
            }
            let avgRawVariance = totalVariance / 8;
            let finalHeroScore = Math.max(0, Math.min(100, Math.round(100 - avgRawVariance)));
            scoreLabel.textContent = finalHeroScore + '%';
            updateColorClass(scoreLabel, finalHeroScore);
        }

        let calculatedDirectory = sovrnMerchantCatalog.map(product => {
            const pMetrics = [
                product.metrics.clean, product.metrics.crueltyFree, product.metrics.vegan, 
                product.metrics.waste, product.metrics.climate, product.metrics.labor, 
                product.metrics.independent, product.metrics.inclusion
            ];
            
            let totalVariance = 0;
            for(let i = 0; i < 8; i++) {
                let importanceMultiplier = (userValues[i] / 100) + 0.5; 
                totalVariance += Math.abs(pMetrics[i] - userValues[i]) * importanceMultiplier;
            }
            let avgRawVariance = totalVariance / 8;
            let alignmentPercentage = Math.max(10, Math.min(100, Math.round(100 - avgRawVariance)));
            
            return Object.assign({}, product, { computedMatchScore: alignmentPercentage });
        });

        calculatedDirectory.sort((a, b) => b.computedMatchScore - a.computedMatchScore);

        alternativesContainer.innerHTML = "";
        calculatedDirectory.forEach(function(product, idx) {
  const card = document.createElement('div');
  card.className = "alternative-card";
  
  // Apply a CSS blur if the user has not unlocked premium
  const blurStyle = hasUnlockedPremium ? "" : "filter: blur(8px); pointer-events: none; user-select: none;";
  
  card.innerHTML = `
    <div style="position: relative;">
    
      ${!hasUnlockedPremium ? `
      <div style="position: absolute; inset: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);">
        <span style="background: #0f172a; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          ${product.computedMatchScore}% Match Found
        </span>
        
        <a href="https://buy.stripe.com/eVq7sE8Jm0109KbeV05Ne00" style="background: var(--electric-lilac); color: white; padding: 16px 28px; border-radius: 14px; font-size: 15px; font-weight: 700; text-decoration: none; box-shadow: 0 8px 24px rgba(129, 140, 248, 0.4); transition: transform 0.2s; cursor: pointer; display: inline-block;">
          Unlock Alternative Matches - $15
        </a>

      </div>
      ` : ''}
      
      <div style="${blurStyle}">
        <div class="alt-top">
          <div style="display:flex; gap:16px; align-items:center;">
            <div class="media-box">
              <img src="${hasUnlockedPremium ? product.img : 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=150&q=80'}" alt="Verified Match">
            </div>
            <div>
              <h4 class="alt-brand-name" style="margin:0;">${hasUnlockedPremium ? product.name : 'Verified Independent Brand'}</h4>
              <span class="alt-pricing">Estimated Value Validation: ${product.price}</span>
            </div>
          </div>
          <span class="badge-pill" id="scorePill_index_${idx}" style="border: 1px solid;">${product.computedMatchScore}% Match Alternative</span>
        </div>
        
        <div class="matrix-metrics-grid">
          <div class="metric-cell"><div class="cell-label">Composition</div><div class="cell-value">${product.composition}</div></div>
          <div class="metric-cell"><div class="cell-label">Labor Trace</div><div class="cell-value">${product.labor}</div></div>
          <div class="metric-cell"><div class="cell-label">Packaging</div><div class="cell-value">${product.packaging}</div></div>
        </div>
        
        <div class="log-container">
          <strong>Verification Evidence Log:</strong> ${hasUnlockedPremium ? product.evidence : 'Data verified via independent corporate registry and environmental audits.'}
        </div>
        
        <button class="swap-button" onclick="alert('Routing alternative tracking parameters via Sovrn integration loops...')">
          Swap to ${hasUnlockedPremium ? product.name : 'Aligned Brand'}
        </button>
      </div>
    </div>
  `;
  
  alternativesContainer.appendChild(card);
  const currentPill = document.getElementById('scorePill_index_' + idx);
  if (currentPill) {
    updatePillColor(currentPill, product.computedMatchScore);
  }
});

    sliders.forEach(s => { if(s) s.addEventListener('input', recalibrateAlgorithm); });
    recalibrateAlgorithm();

    // --- 7. TELEMETRY ROUTING ---
    async function sendValueTelemetry(targetAlternative) {
        const currentEmail = savedEmail || "GUEST PROFILE";
        const currentValues = sliders.map(s => parseInt(s.value) || 0);
        const valuePayload = {
            email: currentEmail, 
            clicked_product: targetAlternative,
            clean_ingredients_score: currentValues[0], 
            cruelty_free_score: currentValues[1],
            vegan_score: currentValues[2], 
            low_waste_score: currentValues[3],
            climate_impact_score: currentValues[4], 
            ethical_labor_score: currentValues[5],
            independent_scale_score: currentValues[6], 
            inclusion_score: currentValues[7]
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

    // --- 8. LIVE AI SCANNER INTEGRATION ---
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
            
            // GRAB SLIDER VALUES TO SEND TO GEMINI
            const currentValues = sliders.map(s => parseInt(s.value) || 0);

            const response = await fetch(`${RENDER_BASE_URL}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    product: path, 
                    userEmail: savedEmail,
                    userValues: currentValues 
                })
            });

            const data = await response.json();
            
            if(data.success && data.auditedProduct) {
                const aiData = data.auditedProduct;
                document.getElementById('displayProductTitle').textContent = aiData.product_name || aiData.brand;
                
                // --- UPDATE PRICE ---
                const priceEl = document.getElementById('displayScannedPrice');
                priceEl.textContent = (aiData.price && aiData.price !== 'N/A') ? `Est. Price: ${aiData.price}` : 'Price Unavailable';
                priceEl.style.display = 'inline-block';
                
                // --- UPDATE IMAGE WITH BULLETPROOF FALLBACK ---
                if (aiData.image_url && aiData.image_url.startsWith('http')) {
                    const heroImage = document.querySelector('.scanned-hero-card img') || document.querySelector('.media-box img');
                    if (heroImage) {
                        const imgTester = new Image();
                        imgTester.onload = () => { heroImage.src = aiData.image_url; };
                        imgTester.onerror = () => { heroImage.src = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80"; };
                        imgTester.src = aiData.image_url;
                    }
                } else {
                    const heroImage = document.querySelector('.scanned-hero-card img') || document.querySelector('.media-box img');
                    if (heroImage) {
                        heroImage.src = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80";
                    }
                }
                
                // Maps EXACTLY to the 8 traits
                currentScannedMetrics = [
                    aiData.metrics.clean, 
                    aiData.metrics.crueltyFree,
                    aiData.metrics.vegan, 
                    aiData.metrics.waste, 
                    aiData.metrics.climate,
                    aiData.metrics.labor, 
                    aiData.metrics.independent,
                    aiData.metrics.inclusion
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

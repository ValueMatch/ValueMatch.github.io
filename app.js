<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YourValueMatch Engine</title>
    <style>
        :root {
            --bg-canvas: #faf9f6;
            --card-surface: #ffffff;
            --text-primary: #0f172a;
            --text-secondary: #64748b;
            --electric-lilac: linear-gradient(135deg, #c084fc 0%, #818cf8 100%);
            --border-ui: rgba(129, 140, 248, 0.15);
            --match-green: #22c55e;
            --match-red: #ef4444;
        }

        body {
            margin: 0; padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
            background-color: var(--bg-canvas);
            color: var(--text-primary);
            display: flex; flex-direction: column; align-items: center; min-height: 100vh;
        }

        .app-container {
            width: 100%; max-width: 1200px; padding: 32px 24px; box-sizing: border-box;
            display: flex; flex-direction: column; gap: 24px;
        }

        header {
            width: 100%; display: flex; justify-content: space-between; align-items: center;
            padding-bottom: 16px; border-bottom: 1px solid var(--border-ui);
        }

        .logo {
            font-size: 24px; font-weight: 800;
            background: var(--electric-lilac); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            letter-spacing: -1px; text-decoration: none;
        }
        .back-link { font-size: 13px; font-weight: 600; color: var(--text-secondary); text-decoration: none; }

        /* STEP 1: SIGNUP VIEW BLOCK */
        #signupStep { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; width: 100%; box-sizing: border-box;}
        .signup-card {
            background: var(--card-surface); border: 1px solid var(--border-ui); border-radius: 24px;
            padding: 32px; width: 100%; max-width: 460px; box-shadow: 0 4px 20px rgba(0,0,0,0.01);
            display: flex; flex-direction: column; gap: 20px;
        }
        .signup-card h2 { font-size: 22px; font-weight: 800; margin: 0; text-align: center; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 13px; font-weight: 700; }
        .form-input { width: 100%; padding: 14px; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 14px; box-sizing: border-box; outline: none; }
        
        .pillar-option {
            border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; display: flex; gap: 12px; cursor: pointer;
        }
        .pillar-option.selected { border-color: #818cf8; background: rgba(129, 140, 248, 0.03); }
        .pillar-info strong { display: block; font-size: 14px; margin-bottom: 2px; }
        .pillar-info p { margin: 0; font-size: 12px; color: var(--text-secondary); line-height: 1.4; }
        .submit-btn { background: var(--electric-lilac); color: white; border: none; padding: 16px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; }

        /* STEP 2: WORKSPACE INTERACTIVE CORE UI */
        #workspaceStep { display: none; flex-direction: column; gap: 24px; width: 100%; }
        .workspace-grid { display: grid; grid-template-columns: 360px 1fr; gap: 28px; align-items: start; }

        .control-panel { background: var(--card-surface); border: 1px solid var(--border-ui); border-radius: 24px; padding: 24px; }
        .panel-title { font-size: 18px; font-weight: 700; margin: 0 0 16px 0; }
        .url-box { position: relative; margin-bottom: 24px; }
        .url-input { width: 100%; padding: 14px 90px 14px 16px; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 14px; box-sizing: border-box; outline: none; }
        .scan-btn { position: absolute; right: 8px; top: 8px; background: #0f172a; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; }

        .slider-group { margin-bottom: 20px; }
        .slider-header { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #475569; }
        .slider-ui { width: 100%; height: 6px; background: #f1f5f9; border-radius: 10px; -webkit-appearance: none; outline: none; margin: 12px 0; }
        .slider-ui::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: white; border: 4px solid #818cf8; cursor: pointer; }

        .results-stream { display: flex; flex-direction: column; gap: 24px; }
        .comparison-hero { background: var(--card-surface); border: 1px solid var(--border-ui); border-radius: 24px; padding: 20px; display: flex; align-items: center; justify-content: space-between; }
        .product-meta { display: flex; align-items: center; gap: 16px; }
        
        .img-container { width: 64px; height: 64px; border-radius: 14px; background: #f1f5f9; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; flex-shrink: 0; }
        .img-container img { width: 100%; height: 100%; object-fit: cover; }

        .product-title { font-weight: 800; font-size: 16px; margin: 0 0 4px 0; }
        .product-domain { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
        .score-val { font-size: 36px; font-weight: 900; color: var(--match-red); }

        .section-divider { font-size: 12px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.5px; display: flex; justify-content: space-between; }
        .reset-link { color: #818cf8; text-decoration: none; cursor: pointer; }

        .alt-card { background: var(--card-surface); border: 1px solid var(--border-ui); border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 18px; }
        .alt-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .alt-brand { font-size: 18px; font-weight: 800; margin: 0 0 4px 0; }
        .alt-price { font-size: 13px; color: var(--text-secondary); font-weight: 600; }
        .match-pill { background: rgba(34, 197, 94, 0.1); color: var(--match-green); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; }

        .breakdown-table { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .table-node { background: #f8fafc; border: 1px solid #f1f5f9; padding: 12px; border-radius: 12px; }
        .node-lbl { font-size: 11px; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 4px; }
        .node-val { font-size: 13px; font-weight: 700; }

        .evidence-drawer { background: rgba(129, 140, 248, 0.03); border-left: 4px solid #818cf8; padding: 14px; border-radius: 0 12px 12px 0; font-size: 13px; line-height: 1.5; color: #475569; }
        .swap-action-btn { background: var(--electric-lilac); color: white; border: none; width: 100%; padding: 16px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; text-align: center; }

        @media (max-width: 890px) { .workspace-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>

<div class="app-container">
    <header>
        <a href="index.html" class="logo">YourValueMatch</a>
        <a href="index.html" class="back-link">← Reset to Home</a>
    </header>

    <main id="signupStep">
        <div class="signup-card">
            <h2>Establish Your Matrix Identity</h2>
            
            <div class="form-group">
                <label>Account Email Address</label>
                <input type="email" id="fieldEmail" class="form-input" placeholder="name@domain.com" required>
            </div>

            <div class="form-group">
                <label>Select Primary Core Value Vector Pillar:</label>
                
                <div class="pillar-option selected" id="p1">
                    <div class="pillar-info">
                        <strong>🍃 Clean Ingredient Sourcing</strong>
                        <p>Flags synthetics, toxic compounds, and production transparency issues.</p>
                    </div>
                </div>

                <div class="pillar-option" id="p2">
                    <div class="pillar-info">
                        <strong> Cruelty-Free Accountability</strong>
                        <p>Monitors animal testing tracking declarations and supply line certifications.</p>
                    </div>
                </div>
            </div>

            <button class="submit-btn" id="btnSubmitSignup">Lock Framework & Open Engine</button>
        </div>
    </main>

    <main id="workspaceStep">
        <div class="workspace-grid">
            
            <section class="control-panel">
                <h2 class="panel-title" id="userTitleLabel">Custom Matrix Settings</h2>
                
                <div class="url-box">
                    <input type="url" id="linkField" class="url-input" value="https://www.amazon.co.uk/Burts-Bees-Lip-Balm-Pomegranate">
                    <button class="scan-btn" id="runAnalysis">Scan URL</button>
                </div>

                <div class="slider-group">
                    <div class="slider-header"><span>🍃 Cruelty-Free</span><span id="txt1">88%</span></div>
                    <input type="range" class="slider-ui" id="range1" min="0" max="100" value="88">
                </div>
                <div class="slider-group">
                    <div class="slider-header"><span>🧪 Clean Ingredients</span><span id="txt2">100%</span></div>
                    <input type="range" class="slider-ui" id="range2" min="0" max="100" value="100">
                </div>
                <div class="slider-group">
                    <div class="slider-header"><span>📦 Low-Waste Pack</span><span id="txt3">12%</span></div>
                    <input type="range" class="slider-ui" id="range3" min="0" max="100" value="12">
                </div>
            </section>

            <section class="results-stream">
                <div class="comparison-hero">
                    <div class="product-meta">
                        <div class="img-container">
                            <img src="https://images.unsplash.com/photo-1617480708386-0445240111ef?auto=format&fit=crop&w=120&q=80" alt="Current Item">
                        </div>
                        <div>
                            <h3 class="product-title" id="lblTitle">Burt's Bees Lip Balm Pomegranate</h3>
                            <span class="product-domain" id="lblDomain">amazon.co.uk</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 10px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Current Match</span>
                        <div class="score-val" id="lblScore">35%</div>
                    </div>
                </div>

                <div class="section-divider">
                    <span>Recommended Value Alternative Matches Found</span>
                    <span class="reset-link" id="clearSearch">Clear & Scan Another Link</span>
                </div>

                <div class="alt-card">
                    <div class="alt-header">
                        <div style="display:flex; gap:16px; align-items:center;">
                            <div class="img-container">
                                <img src="https://images.unsplash.com/photo-1608248597481-496100c8c836?auto=format&fit=crop&w=120&q=80" alt="Alternative Item">
                            </div>
                            <div>
                                <h4 class="alt-brand" style="margin:0;">Hurraw! Balm</h4>
                                <span class="alt-price">Estimated Match Cost: £4.10</span>
                            </div>
                        </div>
                        <span class="match-pill">96% Alternative Match</span>
                    </div>
                    
                    <div class="breakdown-table">
                        <div class="table-node"><div class="node-lbl">Composition</div><div class="node-val">100% Raw Organic</div></div>
                        <div class="table-node"><div class="node-lbl">Labor Trace</div><div class="node-val">Leaping Bunny Cert</div></div>
                        <div class="table-node"><div class="node-lbl">Packaging</div><div class="node-val">Recyclable Eco-Tube</div></div>
                    </div>
                    <div class="evidence-drawer">
                        <strong>Verification Evidence Log:</strong> Formulated using 100% organic food-grade cold-pressed oils. Production facilities operate fully solar-powered out of Whitefish, Montana, mitigating standard logistical footprints.
                    </div>
                    <button class="swap-action-btn" onclick="alert('Redirecting via verified value affiliate code parameters...')">Swap to Hurraw! Balm</button>
                </div>
            </section>
        </div>
    </main>
</div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        const signupStep = document.getElementById('signupStep');
        const workspaceStep = document.getElementById('workspaceStep');
        const btnSubmitSignup = document.getElementById('btnSubmitSignup');
        const userTitleLabel = document.getElementById('userTitleLabel');

        // Toggle choices layout logic natively
        const p1 = document.getElementById('p1');
        const p2 = document.getElementById('p2');
        p1.addEventListener('click', () => { p1.classList.add('selected'); p2.classList.remove('selected'); });
        p2.addEventListener('click', () => { p2.classList.add('selected'); p1.classList.remove('selected'); });

        btnSubmitSignup.addEventListener('click', () => {
            const email = document.getElementById('fieldEmail').value;
            if(!email || !email.includes('@')) return alert('Please input a valid email address.');
            
            localStorage.setItem('vm_email', email);
            userTitleLabel.textContent = `Profile Matrix: ${email}`;
            signupStep.style.display = 'none';
            workspaceStep.style.display = 'flex';
        });

        // Live math range controls logic mapping 
        const ranges = [document.getElementById('range1'), document.getElementById('range2'), document.getElementById('range3')];
        const outputs = [document.getElementById('txt1'), document.getElementById('txt2'), document.getElementById('txt3')];
        const scoreDisplay = document.getElementById('lblScore');

        function updateMath() {
            let sum = 0;
            ranges.forEach((r, i) => {
                outputs[i].textContent = `${r.value}%`;
                sum += parseInt(r.value);
            });
            let computed = Math.max(10, 104 - Math.round((sum / 3) * 0.8));
            scoreDisplay.textContent = `${computed}%`;
            scoreDisplay.style.color = computed > 50 ? "var(--match-green)" : "var(--match-red)";
        }
        ranges.forEach(r => r.addEventListener('input', updateMath));

        document.getElementById('runAnalysis').addEventListener('click', () => {
            const path = document.getElementById('linkField').value;
            if(!path) return alert('Input retail item tracking URL destination path.');
            try {
                const parsed = new URL(path);
                document.getElementById('lblDomain').textContent = parsed.hostname.replace('www.', '');
                alert(`Running vector data scanning loop against matching indicators on ${parsed.hostname}...`);
            } catch(e) {
                document.getElementById('lblDomain').textContent = 'External Store Listing';
            }
        });

        document.getElementById('clearSearch').addEventListener('click', () => {
            document.getElementById('linkField').value = '';
            document.getElementById('linkField').focus();
        });
    });
</script>
</body>
</html>

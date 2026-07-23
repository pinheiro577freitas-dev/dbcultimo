document.addEventListener('DOMContentLoaded', () => {
    const crimesGrid = document.getElementById('crimesGrid');
    const crimeSearch = document.getElementById('crimeSearch');
    const categoryNav = document.getElementById('categoryNav');
    const selectedCrimesList = document.getElementById('selectedCrimes');
    const totalFineEl = document.getElementById('totalFine');
    const totalJailEl = document.getElementById('totalJail');
    const clearAllBtn = document.getElementById('clearAll');
    const generateTicketBtn = document.getElementById('generateTicket');
    const extraNotesArea = document.getElementById('extraNotes');

    // Modal elements
    const configModal = document.getElementById('configModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const saveModalBtn = document.getElementById('saveModal');
    const cancelModalBtn = document.getElementById('cancelModal');

    let selectedCrimes = [];
    let activeCategory = 'Todos';
    let pendingCrime = null;

    // 1. Categories
    const categories = ['Todos', ...new Set(crimesData.map(c => c.category))];
    function renderTabs() {
        categoryNav.innerHTML = '';
        categories.forEach(cat => {
            const tab = document.createElement('div');
            tab.className = `tab ${activeCategory === cat ? 'active' : ''}`;
            tab.textContent = cat;
            tab.onclick = () => {
                activeCategory = cat;
                renderTabs();
                renderCrimes();
            };
            categoryNav.appendChild(tab);
        });
    }

    // 2. Render Crimes
    function renderCrimes() {
        const searchTerm = crimeSearch.value.toLowerCase();
        const filtered = crimesData.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm) || 
                                 c.category.toLowerCase().includes(searchTerm);
            const matchesCategory = activeCategory === 'Todos' || c.category === activeCategory;
            return matchesSearch && matchesCategory;
        });

        crimesGrid.innerHTML = '';
        filtered.forEach((crime, index) => {
            const isSelected = selectedCrimes.some(sc => sc.id === crime.id);
            const card = document.createElement('div');
            card.className = `crime-card ${isSelected ? 'selected' : ''}`;
            card.style.animationDelay = `${index * 0.03}s`; // Staggered animation
            
            card.innerHTML = `
                <div class="card-top">
                    <span class="crime-tag">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        ${crime.category}
                    </span>
                    <div class="crime-name">${crime.name}</div>
                </div>
                <div class="crime-stats">
                    <div class="stat">
                        <span class="stat-label">Multa Base</span>
                        <span class="stat-val">${crime.fine > 0 ? crime.fine.toLocaleString() + '€' : 'Decisão Judicial'}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Pena</span>
                        <span class="stat-val">${crime.jail > 0 ? crime.jail + ' meses' : 'N/A'}</span>
                    </div>
                </div>
            `;
            card.onclick = () => handleCrimeSelection(crime);
            crimesGrid.appendChild(card);
        });
    }

    // 3. Selection Logic
    function handleCrimeSelection(crime) {
        const index = selectedCrimes.findIndex(sc => sc.id === crime.id);
        if (index > -1) {
            selectedCrimes.splice(index, 1);
            updateUI();
            renderCrimes();
            return;
        }

        if (crime.hasQuantity || crime.hasMultipliers || crime.hasOfficialBonus || crime.hasSubtypes || crime.isMoneyCrime) {
            openConfigModal(crime);
        } else {
            selectedCrimes.push({ ...crime, qty: 0, mults: {} });
            updateUI();
            renderCrimes();
        }
    }

    function openConfigModal(crime) {
        pendingCrime = crime;
        modalTitle.textContent = crime.name;
        modalBody.innerHTML = '';

        if (crime.hasSubtypes) {
            const label = document.createElement('label');
            label.textContent = crime.subtypeLabel || 'Tipo:';
            const select = document.createElement('select');
            select.id = 'modalSubtype';
            select.className = 'modal-select';
            Object.entries(crime.subtypes).forEach(([name, val]) => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = `${name} (${val.toLocaleString()}€/un)`;
                select.appendChild(opt);
            });
            modalBody.appendChild(label);
            modalBody.appendChild(select);

            const qtyLabel = document.createElement('label');
            qtyLabel.textContent = 'Quantidade:';
            const qtyInput = document.createElement('input');
            qtyInput.type = 'number';
            qtyInput.id = 'modalQty';
            qtyInput.min = '1';
            qtyInput.value = '1';
            modalBody.appendChild(qtyLabel);
            modalBody.appendChild(qtyInput);
        } else if (crime.isMoneyCrime) {
            const label = document.createElement('label');
            label.textContent = 'Valor Total Apreendido (€):';
            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'modalMoney';
            input.min = '0';
            input.value = '0';
            modalBody.appendChild(label);
            modalBody.appendChild(input);

            const note = document.createElement('div');
            note.style.fontSize = '11px';
            note.style.color = 'var(--text-secondary)';
            note.style.marginTop = '-15px';
            note.style.marginBottom = '20px';
            note.textContent = 'A coima será de 75% do valor inserido. (Limite legal: 10.000€)';
            modalBody.appendChild(note);
        } else {
            if (crime.hasQuantity) {
                const label = document.createElement('label');
                label.textContent = crime.qtyLabel || 'Quantidade:';
                const input = document.createElement('input');
                input.type = 'number';
                input.id = 'modalQty';
                input.min = '0';
                input.value = crime.threshold || 1;
                modalBody.appendChild(label);
                modalBody.appendChild(input);
            }

            if (crime.hasMultipliers) {
                Object.entries(crime.types).forEach(([name, val]) => {
                    const label = document.createElement('label');
                    label.textContent = `${name} (+${val.toLocaleString()}€):`;
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'modal-mult';
                    input.dataset.name = name;
                    input.dataset.val = val;
                    input.min = '0';
                    input.value = '0';
                    modalBody.appendChild(label);
                    modalBody.appendChild(input);
                });
            }

            if (crime.hasOfficialBonus) {
                const label = document.createElement('label');
                label.className = 'check-container';
                label.innerHTML = `<input type="checkbox" id="modalBonus"> Vitima Funcionário Público (+15.000€)`;
                modalBody.appendChild(label);
            }
        }

        configModal.classList.remove('hidden');
    }

    saveModalBtn.onclick = () => {
        const qtyInput = document.getElementById('modalQty');
        const bonusInput = document.getElementById('modalBonus');
        const multInputs = document.querySelectorAll('.modal-mult');
        const subtypeSelect = document.getElementById('modalSubtype');
        const moneyInput = document.getElementById('modalMoney');

        const mults = {};
        multInputs.forEach(input => {
            mults[input.dataset.name] = { 
                qty: parseInt(input.value) || 0, 
                val: parseInt(input.dataset.val) 
            };
        });

        selectedCrimes.push({
            ...pendingCrime,
            qty: qtyInput ? parseInt(qtyInput.value) : 0,
            isOfficial: bonusInput ? bonusInput.checked : false,
            mults: mults,
            subtype: subtypeSelect ? subtypeSelect.value : null,
            moneyAmount: moneyInput ? parseInt(moneyInput.value) : 0
        });

        configModal.classList.add('hidden');
        updateUI();
        renderCrimes();
    };

    cancelModalBtn.onclick = () => configModal.classList.add('hidden');

    // 4. Update UI & Calculations
    function updateUI() {
        selectedCrimesList.innerHTML = '';
        
        let totalFine = 0;
        let totalJail = 0;

        if (selectedCrimes.length === 0) {
            selectedCrimesList.innerHTML = `
                <div class="empty-placeholder">
                    <div class="icon">⚖️</div>
                    <p>Nenhuma infração selecionada.</p>
                </div>
            `;
        }

        selectedCrimes.forEach(c => {
            let crimeFine = c.fine;
            let crimeJail = c.jail;
            let calcDesc = '';

            if (c.hasSubtypes && c.subtype) {
                const unitVal = c.subtypes[c.subtype];
                crimeFine = c.fine + (unitVal * c.qty);
                calcDesc = `${c.fine > 0 ? c.fine.toLocaleString() + '€ + ' : ''}(${c.qty}x ${c.subtype}: ${unitVal.toLocaleString()}€)`;
            } else if (c.isMoneyCrime) {
                crimeFine = c.moneyAmount * 0.75;
                calcDesc = `75% de ${c.moneyAmount.toLocaleString()}€`;
            } else {
                if (c.hasQuantity) {
                    const threshold = c.threshold || 0;
                    const extra = Math.max(0, c.qty - threshold);
                    if (extra > 0) {
                        const addValue = extra * c.addValue;
                        crimeFine += addValue;
                        calcDesc = `${c.fine.toLocaleString()}€ + (${extra} x ${c.addValue.toLocaleString()}€)`;
                    }
                    if (c.maxFine && crimeFine > c.maxFine) crimeFine = c.maxFine;
                }

                Object.values(c.mults).forEach(m => {
                    if (m.qty > 0) {
                        crimeFine += m.qty * m.val;
                    }
                });

                if (c.isOfficial) {
                    crimeFine += 15000;
                }
            }

            totalFine += crimeFine;
            totalJail += crimeJail;

            const item = document.createElement('div');
            item.className = 'reg-item';
            item.innerHTML = `
                <div class="reg-main">
                    <div class="reg-info">
                        <h4>${c.name}</h4>
                        <p>${crimeFine.toLocaleString()}€ • ${crimeJail} meses</p>
                    </div>
                    <button class="btn-remove" onclick="removeCrime(${c.id})">✕</button>
                </div>
                ${calcDesc ? `<div class="reg-calc">Cálculo: ${calcDesc}</div>` : ''}
            `;
            selectedCrimesList.appendChild(item);
        });

        totalFineEl.textContent = `${totalFine.toLocaleString()}€`;
        totalJailEl.textContent = `${totalJail} meses`;
    }

    window.removeCrime = (id) => {
        selectedCrimes = selectedCrimes.filter(c => c.id !== id);
        updateUI();
        renderCrimes();
    };

    clearAllBtn.onclick = () => {
        if (selectedCrimes.length === 0) return;
        if (confirm('Deseja limpar todos os registos?')) {
            selectedCrimes = [];
            extraNotesArea.value = '';
            updateUI();
            renderCrimes();
        }
    };

    // 5. Generate Ticket
    generateTicketBtn.onclick = () => {
        if (selectedCrimes.length === 0) {
            alert('Por favor, selecione pelo menos uma infração.');
            return;
        }

        const modal = document.getElementById('ticketModal');
        const printArea = document.getElementById('ticketPrintArea');
        const userText = extraNotesArea.value;

        let html = `
            <div class="ticket-header">
                <div style="font-size: 10px; font-weight: 800; letter-spacing: 2px; margin-bottom: 10px;">ESTADO DE LOS SANTOS</div>
                <h2>RELATÓRIO OFICIAL DE OCORRÊNCIA</h2>
                <p style="font-size: 12px; opacity: 0.7; margin-top: 5px;">EMITIDO EM: ${new Date().toLocaleString('pt-PT')}</p>
            </div>
            
            <div class="ticket-section">
                <h4>1. DESCRIÇÃO DOS FACTOS</h4>
                <div style="font-size: 13px; line-height: 1.6; padding: 15px; background: #fcfcfc; border-left: 4px solid #000;">
                    ${userText ? userText.replace(/\n/g, '<br>') : 'Nenhuma descrição adicional anexada ao processo.'}
                </div>
            </div>

            <div class="ticket-section">
                <h4>2. INFRAÇÕES E PENALIZAÇÕES</h4>
                <table class="ticket-table">
                    <thead>
                        <tr>
                            <th>INFRAÇÃO / ARTIGO</th>
                            <th style="text-align: right;">CÁLCULO DETALHADO</th>
                            <th style="text-align: right;">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        selectedCrimes.forEach(c => {
            let crimeFine = c.fine;
            let calcStr = `${c.fine.toLocaleString()}€`;
            
            if (c.hasSubtypes && c.subtype) {
                const unitVal = c.subtypes[c.subtype];
                crimeFine = c.fine + (unitVal * c.qty);
                calcStr = `${c.fine > 0 ? c.fine.toLocaleString() + '€ + ' : ''}(${c.qty}x ${c.subtype})`;
            } else if (c.isMoneyCrime) {
                crimeFine = c.moneyAmount * 0.75;
                calcStr = `75% de ${c.moneyAmount.toLocaleString()}€`;
            } else {
                if (c.hasQuantity) {
                    const threshold = c.threshold || 0;
                    const extra = Math.max(0, c.qty - threshold);
                    if (extra > 0) {
                        const add = extra * c.addValue;
                        crimeFine += add;
                        calcStr = `${c.fine.toLocaleString()}€ + (${extra}x Adicional)`;
                    }
                    if (c.maxFine && crimeFine > c.maxFine) {
                        crimeFine = c.maxFine;
                        calcStr += ` (Cap ${c.maxFine.toLocaleString()}€)`;
                    }
                }

                Object.entries(c.mults).forEach(([name, m]) => {
                    if (m.qty > 0) {
                        crimeFine += m.qty * m.val;
                        calcStr += ` + (${m.qty}x ${name})`;
                    }
                });

                if (c.isOfficial) {
                    crimeFine += 15000;
                    calcStr += ` + Bonus Func. Público`;
                }
            }

            html += `
                <tr>
                    <td><strong>${c.name}</strong><br><span style="font-size: 10px; color: #666;">${c.category}</span></td>
                    <td style="text-align: right; color: #444; font-size: 11px;">${calcStr}</td>
                    <td style="text-align: right;">
                        <div style="font-weight: 800;">${crimeFine.toLocaleString()}€</div>
                        <div style="font-size: 11px; opacity: 0.7;">${c.jail} meses</div>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>

            <div class="ticket-section">
                <h4>3. RESUMO PENAL</h4>
                <div class="ticket-summary">
                    <div class="summary-row">
                        <span>TOTAL ACUMULADO DE COIMAS:</span>
                        <span>${totalFineEl.textContent}</span>
                    </div>
                    <div class="summary-row">
                        <span>TOTAL ACUMULADO DE SENTENÇA:</span>
                        <span>${totalJailEl.textContent}</span>
                    </div>
                    <div class="summary-row total">
                        <span>VALOR FINAL A LIQUIDAR:</span>
                        <span>${totalFineEl.textContent}</span>
                    </div>
                </div>
            </div>

            <div style="margin-top: 80px; display: flex; justify-content: space-between; padding: 0 40px;">
                <div style="text-align: center;">
                    <div style="border-bottom: 1px solid #000; width: 250px; margin-bottom: 10px;"></div>
                    <p style="font-size: 11px;">Assinatura do Agente / Oficial</p>
                </div>
                <div style="text-align: center;">
                    <div style="border-bottom: 1px solid #000; width: 250px; margin-bottom: 10px;"></div>
                    <p style="font-size: 11px;">Assinatura do Infrator / Advogado</p>
                </div>
            </div>

            <div style="margin-top: 60px; text-align: center;">
                <div style="font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">
                    ESTE DOCUMENTO É UM REGISTO OFICIAL PROCESSADO PELO TERMINAL JUDICIAL CENTRAL.<br>
                    ID DA SESSÃO: ${Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
            </div>
        `;

        printArea.innerHTML = html;
        modal.classList.remove('hidden');
    };

    // Init
    renderTabs();
    renderCrimes();
    crimeSearch.oninput = renderCrimes;
});

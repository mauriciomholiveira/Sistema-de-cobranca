import { API_URL, state } from './config.js';
import { showToast, formatDate, formatCurrency } from './utils.js';

// --- Billing ---
export async function fetchBilling() {
    try {
        const res = await fetch(`${API_URL}/cobranca?mes=${state.currentMonth}`);
        state.billingData = await res.json();

        // Default Sort: A-Z by Name
        state.billingData.sort((a, b) => a.nome.localeCompare(b.nome));

        renderBillingTable();
    } catch (e) {
        console.error("Billing error:", e);
        showToast("Erro ao carregar cobranças.", true);
    }
}

export function renderBillingTable(data = state.billingData) {
    const tbody = document.getElementById('billing-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    const summaryTotalReceived = { val: 0, el: document.getElementById('billing-total-received') };
    const summaryTotalPending = { val: 0, el: document.getElementById('billing-total-pending') };
    const summaryTotalLate = { val: 0, el: document.getElementById('billing-total-late') };

    data.forEach(item => {
        // Update Summaries
        const val = parseFloat(item.valor_cobrado || 0);
        if (item.status === 'PAGO') summaryTotalReceived.val += val;
        else if (item.status === 'ATRASADO') summaryTotalLate.val += val;
        else summaryTotalPending.val += val;

        const isLate = item.status === 'ATRASADO';
        const isPaid = item.status === 'PAGO';
        const colorClass = isPaid ? 'text-success' : (isLate ? 'text-danger' : '');

        // Calculate default split if not set
        const valorTotal = parseFloat(item.valor_cobrado) || 0;
        const valorProf = item.valor_professor_recebido !== null ? parseFloat(item.valor_professor_recebido) : Math.min(100, valorTotal);
        // If not paid, show potential split. If paid, show actual.
        // Logic handled in updateRevenueSplit
        
        const valColor = valorTotal <= 0 ? '#ef4444' : '#ffffff';

        // Prof Value input logic: only show input if pending/late? Or always editable?
        // App logic implies editable.

        tbody.innerHTML += `
            <tr>
                <td>
                    <strong style="font-size: 1rem; color: #f1f5f9;">
                        ${item.nome} 
                        ${item.nome_curso ? `<span style="font-size: 0.8em; color: #94a3b8; font-weight: 400;">(${item.nome_curso})</span>` : ''}
                    </strong><br>
                    <small class="text-muted">${item.nome_professor || '-'}</small>
                </td>
                <td>
                    ${isPaid
                ? `<span class="badge-success"><i class="fa-solid fa-check"></i> Pago</span>`
                : `<span class="${colorClass}" style="font-weight: 600">${item.status}</span><br><small>Vence: ${formatDate(item.data_vencimento)}</small>`
            }
                </td>
                <td>
                    <div class="input-currency-wrapper">
                        <span>R$</span>
                        <input type="number" 
                               class="input-clean"
                               style="color: ${valColor};"
                               value="${parseFloat(item.valor_cobrado).toFixed(2)}"
                               step="0.01"
                               onblur="this.value = parseFloat(this.value).toFixed(2)"
                               onchange="updatePayment(${item.id}, 'valor_cobrado', this.value)"
                        >
                    </div>
                </td>
                <td>
                    <div class="input-currency-wrapper">
                        <span>R$</span>
                        <input type="number" 
                               class="input-clean"
                               id="prof-val-${item.id}"
                               value="${valorProf.toFixed(2)}"
                               step="0.01"
                               onchange="updateRevenueSplit(${item.id}, 'professor', this.value, ${valorTotal})"
                        >
                    </div>
                </td>
                 <td>
                    <div class="input-currency-wrapper">
                        <span>R$</span>
                         <input type="number" 
                               class="input-clean"
                               id="igreja-${item.id}"
                               value="${(item.valor_igreja_recebido !== null ? parseFloat(item.valor_igreja_recebido) : (valorTotal - valorProf)).toFixed(2)}"
                               step="0.01"
                               readonly
                               style="opacity: 0.7;"
                        >
                    </div>
                </td>
                <td>
                <td>
                    <div class="action-buttons" style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                        ${!isPaid ? `
                            <div class="status-actions" style="display:flex; gap:8px; align-items:center;">
                                <div class="msg-check ${item.msg_lembrete_enviada ? 'checked' : ''} check-lembrete" 
                                     onclick="handleActionClick(${item.id}, 'lembrete', ${!!item.msg_lembrete_enviada})"
                                     title="Lembrete"
                                     style="width: 38px; height: 38px; font-size: 1.1rem;">
                                    <i class="fa-regular fa-calendar"></i>
                                </div>
                                
                                <div class="msg-check ${item.msg_vencimento_enviada ? 'checked' : ''} check-hoje" 
                                     onclick="handleActionClick(${item.id}, 'vence_hoje', ${!!item.msg_vencimento_enviada})"
                                     title="Vence Hoje"
                                     style="width: 38px; height: 38px; font-size: 1.1rem;">
                                    <i class="fa-solid fa-bell"></i>
                                </div>
                                
                                <div class="msg-check ${item.msg_atraso_enviada ? 'checked' : ''} check-atraso" 
                                     onclick="handleActionClick(${item.id}, 'em_atraso', ${!!item.msg_atraso_enviada})"
                                     title="Atraso"
                                     style="width: 38px; height: 38px; font-size: 1.1rem;">
                                    <i class="fa-solid fa-triangle-exclamation"></i>
                                </div>
                            </div>
                            
                            <div style="width: 1px; height: 24px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>

                            <button class="btn-icon" onclick="markAsPaid(${item.id})" title="Marcar como Pago" 
                                    style="width: 38px; height: 38px; font-size: 1rem; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);">
                                <i class="fa-solid fa-check"></i>
                            </button>
                        ` : `
                            <button class="btn-icon btn-danger" onclick="reopenPayment(${item.id})" title="Reabrir" style="width: 38px; height: 38px;">
                                <i class="fa-solid fa-rotate-left"></i>
                            </button>
                            <button class="btn-icon" onclick="sendWhatsappDirect(${item.id}, 'recibo')" title="Enviar Recibo" style="width: 38px; height: 38px;">
                                <i class="fa-regular fa-file-pdf"></i>
                            </button>
                        `}
                    </div>
                </td>
                </td>
            </tr>
        `;
    });

    // Update Header Summaries
    if (summaryTotalReceived.el) summaryTotalReceived.el.textContent = formatCurrency(summaryTotalReceived.val);
    if (summaryTotalPending.el) summaryTotalPending.el.textContent = formatCurrency(summaryTotalPending.val);
    if (summaryTotalLate.el) summaryTotalLate.el.textContent = formatCurrency(summaryTotalLate.val);
}

// Actions
export async function handleActionClick(id, type, isChecked) {
    if (isChecked) {
        // Toggle OFF
        let field = null;
        if (type === 'lembrete') field = 'msg_lembrete_enviada';
        if (type === 'vence_hoje') field = 'msg_vencimento_enviada';
        if (type === 'em_atraso') field = 'msg_atraso_enviada';
        
        if (field) {
             toggleMsgStatus(id, field, false);
        }
    } else {
        // Send Message
        await sendWhatsappDirect(id, type);
    }
}

export async function toggleMsgStatus(id, field, status) {
    try {
        const body = {};
        body[field] = status;
        
        await fetch(`${API_URL}/pagamentos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const item = state.billingData.find(i => i.id === id);
        if (item) item[field] = status;
        renderBillingTable();
        
    } catch (e) {
        console.error(e);
        showToast('start status update failed', true);
    }
}

export async function updatePayment(id, field, value) {
    try {
        const body = {};
        body[field] = value;

        await fetch(`${API_URL}/pagamentos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        // Update local state without full reload if possible, but for totals recalculation reload is safer
        // Or update state.billingData and re-render
        const item = state.billingData.find(i => i.id === id);
        if (item) item[field] = value;
        
        renderBillingTable(); 
        
        // Also update revenue split if total changed?
        // Ideally backend handles this logic or we call logic here.
    } catch (error) {
        console.error(error);
        showToast('Erro ao atualizar', true);
    }
}

export async function markAsPaid(id) {
    if (!confirm('Confirmar pagamento?')) return;
    
    // Find item state to get current values to split
    const item = state.billingData.find(i => i.id === id);
    if (!item) return;

    // Use current UI inputs if possible, or state fallback?
    // Inputs: prof-val-{id} and valor_cobrado input
    // But markAsPaid button is clicked, implying "Accept Current State"
    // Let's grab values from state or inputs to be sure.
    
    // Actually, `updatePayment` updates state on change. So state should be fresh-ish.
    // But `updateRevenueSplit` updates state too.
    // Safer to read from inputs if they exist, or fallback to state.
    
    // Calculate defaults if not set
    const total = parseFloat(item.valor_cobrado || 0);
    
    // If we have manual split inputs:
    const profInput = document.getElementById(`prof-val-${id}`);
    let profVal = profInput ? parseFloat(profInput.value) : (item.valor_professor_recebido !== null ? parseFloat(item.valor_professor_recebido) : 100); // Default default? Or use logic?
    
    // Better logic: If already set in state/DB, use it. If 0/null, use default logic (e.g. 100/total-100 or course default).
    // For now, let's use the STATE value if present, else default.
    // If state is 0, it might be real 0.
    
    // Wait, the UI shows inputs. We should grab what's in the inputs because user might have just changed them without blurring/triggering change event (unlikely but possible).
    // The inputs trigger `updateRevenueSplit` on change.
    
    // Let's trust state. But if state is null/0, we need to ensure we don't save 0 if it should be 100.
    // Legacy app.js seemed to have defaults.
    // Let's try to calculate:
    if (item.valor_professor_recebido === null || item.valor_professor_recebido === undefined) {
         // Default logic?
         // Maybe just save what is currently there?
         // If we send 0, it stays 0.
         // Let's assume the user has set it or it came from defaults.
    }
    
    // CRITICAL: We need to send the split to the backend so it saves it in the 'recebido' columns.
    // Even if it's 0.
    // But if it's currently null in DB, and we send status: PAGO, does backend copy 'previsão' to 'recebido'?
    // Backend likely does nothing.
    
    // Let's send the CURRENT values from the inputs/state as the final "Recebido" values.
    const currentProfVal = item.valor_professor_recebido !== null ? parseFloat(item.valor_professor_recebido) : 0;
    const currentIgrejaVal = total - currentProfVal;

    try {
        await fetch(`${API_URL}/pagamentos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: 'PAGO', 
                data_pagamento: new Date(),
                valor_professor_recebido: currentProfVal,
                valor_igreja_recebido: currentIgrejaVal
            })
        });
        showToast('Pagamento registrado!');
        fetchBilling(); // Reload to update status and totals
        // Update Dashboard too?
        if (window.fetchDashboardData) window.fetchDashboardData();
    } catch (e) {
        showToast('Erro ao registrar pagamento', true);
    }
}

export async function reopenPayment(id) {
    if (!confirm('Reabrir esta cobrança? Status voltará para PENDENTE.')) return;
    try {
        await fetch(`${API_URL}/pagamentos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'PENDENTE', data_pagamento: null })
        });
        showToast('Cobrança reabierta!');
        fetchBilling();
        if (window.fetchDashboardData) window.fetchDashboardData();
    } catch (e) {
        showToast('Erro ao reabrir', true);
    }
}

export async function updateRevenueSplit(paymentId, field, value, totalValue) {
    const profValue = parseFloat(value);
    const churchValue = totalValue - profValue;

    if (profValue < 0 || profValue > totalValue) {
        showToast('Valor do professor deve estar entre R$ 0 e o valor total!', true);
        renderBillingTable(); // Reset inputs
        return;
    }

    const churchInput = document.getElementById(`igreja-${paymentId}`);
    if (churchInput) churchInput.value = churchValue.toFixed(2);

    try {
        const res = await fetch(`${API_URL}/pagamentos/${paymentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                valor_professor_recebido: profValue,
                valor_igreja_recebido: churchValue
            })
        });

        if (res.ok) {
            const payment = state.billingData.find(p => p.id === paymentId);
            if (payment) {
                payment.valor_professor_recebido = profValue;
                payment.valor_igreja_recebido = churchValue;
            }
            showToast('Divisão atualizada!', false);
        } else {
            showToast('Erro ao salvar divisão', true);
        }
    } catch (err) {
        console.error('Error updating split:', err);
        showToast('Erro ao salvar divisão', true);
    }
}

// --- Filtering ---

export function populateBillingProfessorFilter() {
    const select = document.getElementById('billing-professor-filter');
    if (!select) return;

    select.innerHTML = '<option value="all">Todos Professores</option>';

    state.professors.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nome;
        select.appendChild(opt);
    });
}


export function openWhatsappSender() {
    const modal = document.getElementById('whatsapp-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

let currentQuickFilter = null;

export function filterBilling(mode = null) {
    // Handle Quick Actions setting inputs
    if (mode === 'late') {
        document.getElementById('billing-status-filter').value = 'ATRASADO';
        currentQuickFilter = null; // Reset special date filter
    } else if (mode === 'today') {
        currentQuickFilter = 'today';
        // Reset status to allow seeing today's items of any status (or maybe just pending?)
        document.getElementById('billing-status-filter').value = 'all'; 
    } else if (mode === 'clear' || mode === undefined) { 
        // Called by input change
        if (mode !== undefined) currentQuickFilter = null; // Only reset if explicitly cleared? 
        // Actually, if user changes status manually, we should probably clear 'today' filter.
        currentQuickFilter = null;
    }

    const statusFilter = document.getElementById('billing-status-filter').value;
    const professorFilter = document.getElementById('billing-professor-filter')?.value || 'all';
    const term = document.getElementById('billing-search').value.toLowerCase();

    // Today Date (YYYY-MM-DD)
    const today = new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-');

    const filtered = state.billingData.filter(item => {
        let matchStatus = true;
        if (statusFilter !== 'all') {
            matchStatus = (item.status === statusFilter);
        }

        let matchProf = true;
        if (professorFilter !== 'all') {
            matchProf = (String(item.professor_id) === String(professorFilter));
        }

        const name = (item.nome || '').toLowerCase();
        const matchSearch = name.includes(term);

        let matchQuick = true;
        if (currentQuickFilter === 'today') {
            // Check day_vencimento (YYYY-MM-DD)
            matchQuick = (item.data_vencimento === today);
        }

        return matchStatus && matchProf && matchSearch && matchQuick;
    });

    renderBillingTable(filtered);
}

export function applySorting() {
    const sortField = document.getElementById('sort-field').value;
    const sortOrder = document.getElementById('sort-order').value;
    
    // First apply filters
    // This is duplicate logic of filterBilling, ideally we combine them.
    // But filterBilling calls renderBillingTable(filtered), so we should separate filter logic from render logic.
    // For now, let's just sort state.billingData OR sort the result of filtering? 
    // Usually easier to sort the source or have a `getFilteredSortedData` function.
    
    // Let's sort the state.billingData directly then re-render (which will re-apply filters if we updated filterBilling to use current data)
    // Actually `filterBilling` filters `state.billingData`. So if we sort `state.billingData` and call `filterBilling`, it works!
    
    state.billingData.sort((a, b) => {
        let valA, valB;
        switch (sortField) {
            case 'nome':
                valA = a.nome.toLowerCase();
                valB = b.nome.toLowerCase();
                break;
            case 'valor':
                valA = parseFloat(a.valor_cobrado || 0);
                valB = parseFloat(b.valor_cobrado || 0);
                break;
            case 'status':
                const statusOrder = { 'ATRASADO': 3, 'PENDENTE': 2, 'PAGO': 1 };
                valA = statusOrder[a.status] || 0;
                valB = statusOrder[b.status] || 0;
                break;
            case 'vencimento':
                valA = new Date(a.data_vencimento);
                valB = new Date(b.data_vencimento);
                break;
            default: return 0;
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    filterBilling(); 
}

export function changeBillingMonth(offset) {
    const input = document.getElementById('billing-month');
    if (!input || !input.value) return;

    const [year, month] = input.value.split('-').map(Number);
    
    let newMonth = month + offset;
    let newYear = year;

    while (newMonth > 12) { newMonth -= 12; newYear++; }
    while (newMonth < 1) { newMonth += 12; newYear--; }

    const fmtMonth = String(newMonth).padStart(2, '0');
    input.value = `${newYear}-${fmtMonth}`;
    state.currentMonth = input.value;
    
    fetchBilling();
}


// --- WhatsApp Integration ---

export async function sendWhatsappDirect(id, type = 'lembrete') {
    const item = state.billingData.find(i => i.id === id);
    if (!item) return;

    // Collect all items for this client to enable "Unified Message"
    // Collect all items for this client to enable "Unified Message"
    const sameClientItems = state.billingData.filter(i => {
        const isSameClient = i.cliente_id === item.cliente_id;
        const isSameMonth = i.data_vencimento.slice(0, 7) === item.data_vencimento.slice(0, 7);
        
        if (type === 'recibo') {
            // For Receipts, we want PAID items, including the one just paid
            // We can also just include THIS item if we only want a receipt for this specific payment
            // Legacy behavior seemed to aggregate all paid items for the month?
            // Let's filter for PAGO items in same month
            return isSameClient && i.status === 'PAGO' && isSameMonth;
        } else {
            // For Reminders, we want UNPAID items
            return isSameClient && i.status !== 'PAGO' && isSameMonth;
        }
    });

    // Auto-mark key (Bulk Update)
    let fieldToUpdate = null;
    if (type === 'lembrete') fieldToUpdate = 'msg_lembrete_enviada';
    if (type === 'vence_hoje') fieldToUpdate = 'msg_vencimento_enviada';
    if (type === 'em_atraso') fieldToUpdate = 'msg_atraso_enviada';

    if (fieldToUpdate) {
         // Update ALL siblings silently in background
         const updatePromises = sameClientItems.map(sibling => 
            fetch(`${API_URL}/pagamentos/${sibling.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [fieldToUpdate]: true })
            })
         );

         Promise.all(updatePromises).then(() => {
            console.log('Bulk message status auto-updated');
            // update local state
            sameClientItems.forEach(sib => sib[fieldToUpdate] = true);
            renderBillingTable();
        });
    }

    const nome = item.nome.split(' ')[0];
    const pixChave = '47773105000147';
    const pixCopiaCola = '00020126360014BR.GOV.BCB.PIX0114477731050001475204000053039865802BR5901N6001C62090505Aulas63043954';

    let courseText = '';
    let total = 0;
    
    sameClientItems.forEach(i => {
        const val = parseFloat(i.valor_cobrado || 0);
        total += val;
        courseText += `${i.nome_curso || 'Mensalidade'} - R$ ${val.toFixed(2).replace('.', ',')}\n`;
    });
    
    let msg = '';
    
    // Status Text
    const vencimento = formatDate(item.data_vencimento);
    let statusText = '';
    
    // Calculate Days Late
    const oneDay = 24 * 60 * 60 * 1000;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const [y, m, d] = item.data_vencimento.split('T')[0].split('-');
    const fixedDueDate = new Date(y, m - 1, d);
    const diffDaysCalculated = Math.round((todayDate - fixedDueDate) / oneDay);
    
     if (type === 'atraso' || type === 'em_atraso') {
        const dias = diffDaysCalculated > 0 ? diffDaysCalculated : 0;
        statusText = `sua mensalidade se encontra em atraso de *${dias} dias*`;
    } else if (type === 'vence_hoje') {
        statusText = `vencem *HOJE* (${vencimento}).`;
    } else {
        statusText = `vencem dia *${vencimento}* `;
    }

    if (type === 'recibo') {
        msg = `Olá ${nome}, tudo bem?\n\nConfirmamos o recebimento do seu pagamento referente a:\n${courseText}\nTotal: R$ ${total.toFixed(2).replace('.', ',')}\n\nObrigado!`;
    } else {
        msg = `Oi ${nome}, tudo bem? Graça e paz!
Mauricio aqui :-)

Passando para te lembrar das suas mensalidades:

${courseText}
*Total - R$ ${total.toFixed(2).replace('.', ',')}*

${statusText}

Sempre adicionar a chave pix, e uma atenção:
Enviar comprovante de pagamento assim que fizer o pagamento.

Chave Pix: ${pixChave}

Pix Copia-e-cola:
${pixCopiaCola}`;
    }

    let phone = (item.whatsapp || '').replace(/\D/g, '');
    if (phone.length > 0) {
         if (!phone.startsWith('55') && phone.length >= 10) phone = '55' + phone;
         const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
         window.open(url, '_blank');
         showToast('Abrindo WhatsApp...', false);
    } else {
        showToast('Cliente sem telefone cadastrado.', true);
    }
}

// Attach to window
window.fetchBilling = fetchBilling;
window.renderBillingTable = renderBillingTable;
window.updatePayment = updatePayment;
window.markAsPaid = markAsPaid;
window.reopenPayment = reopenPayment;
window.updateRevenueSplit = updateRevenueSplit;
window.populateBillingProfessorFilter = populateBillingProfessorFilter;
window.filterBilling = filterBilling;
window.applySorting = applySorting;
window.changeBillingMonth = changeBillingMonth;
window.sendWhatsappDirect = sendWhatsappDirect;
window.openWhatsappSender = openWhatsappSender;
window.handleActionClick = handleActionClick;
window.toggleMsgStatus = toggleMsgStatus;

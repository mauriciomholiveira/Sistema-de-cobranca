import { API_URL, state } from './config.js';
import { formatCurrency } from './utils.js';

// --- Dashboard ---

export async function fetchDashboard(inputMonth = null) {
    try {
        const monthInput = document.getElementById('dashboard-month');
        let mes = inputMonth || (monthInput ? monthInput.value : null);

        if (!mes) {
            mes = new Date().toISOString().slice(0, 7);
            if (monthInput) monthInput.value = mes;
        }

        const res = await fetch(`${API_URL}/dashboard?mes=${mes}`);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        // Update Stats Cards
        updateElementText('dash-total-received', formatCurrency(data.recebido || 0));
        updateElementText('dash-total-pending', formatCurrency(data.a_receber || 0));
        updateElementText('dash-total-late', formatCurrency(data.atrasados || 0));
        updateElementText('dash-total-students', data.alunos || 0);

        // Split Stats
        updateElementText('dash-total-prof', formatCurrency(data.total_professores || 0));
        updateElementText('dash-total-church', formatCurrency(data.total_igreja || 0));
        updateElementText('dash-total-exempt', data.isentos || 0);
        updateElementText('dash-total-forecast', formatCurrency(data.previsao_total || 0));

        // Update Lists
        renderDashboardList('upcoming-list', data.proximos_vencimentos, (p) => `
            <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span>${p.nome}</span>
                <span style="color: #60a5fa;">${p.vencimento}</span>
            </li>
        `, 'Nenhum vencimento próximo');

        renderDashboardList('late-list', data.atrasos_recentes, (a) => `
            <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span>${a.nome}</span>
                <span style="color: #f87171;">${a.dias_atraso} dias</span>
            </li>
        `, 'Nenhum atraso');

        // Professor Breakdown
        renderDashboardList('professor-revenue-list', data.por_professor, (p) => `
            <li style="display: flex; flex-direction: column; gap: 6px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: #f1f5f9; font-size: 1rem;">
                    <i class="fa-solid fa-chalkboard-user" style="color: #10b981;"></i>
                    <span>${p.nome || 'Sem Professor'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 20px; padding-left: 28px;">
                    <div style="flex: 1;">
                        <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 2px;">Professor Recebe</div>
                        <div style="font-size: 1.1rem; font-weight: 600; color: #10b981;">${formatCurrency(p.total_professor || 0)}</div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 2px;">Igreja Recebe</div>
                        <div style="font-size: 1.1rem; font-weight: 600; color: #8b5cf6;">${formatCurrency(p.total_igreja || 0)}</div>
                    </div>
                </div>
            </li>
        `, 'Nenhum pagamento recebido este mês');

    } catch (e) {
        console.error("Dashboard error:", e);
    }
}

function updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function renderDashboardList(elementId, items, formatter, emptyMessage) {
    const list = document.getElementById(elementId);
    if (!list) return;

    if (!items || items.length === 0) {
        list.innerHTML = `<li style="color: #94a3b8; text-align: center; padding: 10px;">${emptyMessage}</li>`;
        return;
    }

    list.innerHTML = items.map(formatter).join('');
}

export function changeDashboardMonth(offset) {
    const input = document.getElementById('dashboard-month');
    if (!input || !input.value) return;

    const [year, month] = input.value.split('-').map(Number);
    let newMonth = month + offset;
    let newYear = year;

    while (newMonth > 12) { newMonth -= 12; newYear++; }
    while (newMonth < 1) { newMonth += 12; newYear--; }

    const fmtMonth = String(newMonth).padStart(2, '0');
    input.value = `${newYear}-${fmtMonth}`;
    
    fetchDashboard(input.value);
}

// Attach to window
window.fetchDashboardData = fetchDashboard;
window.changeDashboardMonth = changeDashboardMonth;

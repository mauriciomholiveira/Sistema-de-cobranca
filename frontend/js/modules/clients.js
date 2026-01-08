import { API_URL, state } from './config.js';
import { showToast, formatDate, formatPhone, formatCurrency, openConfirmModal, closeModal } from './utils.js';
import { renderMatriculasList } from './matriculas.js'; // Future separation

// --- Client Management ---

export async function fetchClients() {
    try {
        const res = await fetch(`${API_URL}/clientes`);
        if (!res.ok) throw new Error(res.statusText);
        state.clients = await res.json();
        renderClients();
    } catch (e) {
        console.error("Clients error:", e);
        showToast("Erro ao carregar clientes.", true);
    }
}

export function renderClients() {
    const list = document.getElementById('clients-list');
    if (!list) return;

    list.innerHTML = '';
    list.classList.add('clients-grid');
    
    // Header
    list.innerHTML = `
        <div class="list-header" style="display: grid; grid-template-columns: 60px 2fr 1.5fr 1fr 1fr 100px; padding: 0.5rem 1rem; color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
            <span>#</span>
            <span>Aluno</span>
            <span>Contato</span>
            <span>Curso</span>
            <span>Valor</span>
            <span style="text-align: right">Ações</span>
        </div>
    `;

    // Filter based on Tab
    const showActive = currentClientTab === 'active';
    const filtered = state.clients.filter(c => {
        const isActive = c.active !== false; // Default true if undefined
        return showActive ? isActive : !isActive;
    });
    
    filtered.forEach(c => {
        list.innerHTML += buildClientRow(c);
    });
}

function buildClientRow(c) {
    return `
        <div class="client-row">
            <div class="client-avatar-small">
                ${c.nome.charAt(0).toUpperCase()}
            </div>
            
            <div class="cell-primary">
                <span class="client-name">${c.nome}</span>
                <small class="client-sub">${c.endereco || 'Sem endereço'}</small>
            </div>

            <div class="cell-info">
                <div style="display:flex; align-items:center; gap:0.5rem">
                        <i class="fa-brands fa-whatsapp" style="color: #25D366"></i>
                        ${formatPhone(c.whatsapp)}
                </div>
            </div>

            <div class="cell-info tag-cell">
                <span class="tag-pill">${c.cursos_nomes || '-'}</span>
            </div>

            <div class="cell-info">
                <span class="value-highlight">${formatCurrency(c.total_valor || 0)}</span>
            </div>

            <div class="cell-actions">
                <button class="btn-icon-small" onclick="editClient(${c.id})" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-icon-small text-danger" onclick="toggleClientStatus(${c.id}, false)" title="Desativar">
                    <i class="fa-solid fa-ban"></i>
                </button>
            </div>
        </div>
    `;
}

export function filterClients(searchTerm) {
    const list = document.getElementById('clients-list');
    if (!list) return;

    if (!searchTerm || searchTerm.trim() === '') {
        renderClients();
        return;
    }

    const term = searchTerm.toLowerCase().trim();
    state.filteredClients = state.clients.filter(c => {
        const matchName = c.nome.toLowerCase().includes(term);
        const matchPhone = c.whatsapp.includes(term);
        const matchAddress = (c.endereco || '').toLowerCase().includes(term);
        return matchName || matchPhone || matchAddress;
    });

    list.innerHTML = '';
    list.classList.add('clients-grid');
    
    // Header
    list.innerHTML = `
        <div class="list-header" style="display: grid; grid-template-columns: 60px 2fr 1.5fr 1fr 1fr 100px; padding: 0.5rem 1rem; color: #94a3b8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
            <span>#</span>
            <span>Aluno</span>
            <span>Contato</span>
            <span>Curso</span>
            <span>Valor</span>
            <span style="text-align: right">Ações</span>
        </div>
    `;

    const activeFiltered = state.filteredClients.filter(c => c.active !== false);

    if (activeFiltered.length === 0) {
        list.innerHTML += `
            <div style="text-align: center; padding: 2rem; color: #94a3b8;">
                <i class="fa-solid fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Nenhum cliente encontrado para "${searchTerm}"</p>
            </div>
        `;
        return;
    }

    activeFiltered.forEach(c => {
        list.innerHTML += buildClientRow(c);
    });
}

// Global Edit Action
export function editClient(id) {
    const client = state.clients.find(c => c.id === id);
    if (!client) return;

    state.editingClientId = id;

    if (window.openClientModal) window.openClientModal('Editar Cliente');

    document.getElementById('client-name').value = client.nome || '';
    document.getElementById('client-address').value = client.endereco || '';
    document.getElementById('client-phone').value = client.whatsapp || '';

    // Show actions
    document.getElementById('btn-pause-client').style.display = 'flex';
    document.getElementById('btn-delete-client').style.display = 'flex';

    // Load matriculas - Assuming matriculas.js handles this or attached to window
    if (window.renderMatriculasList) {
        window.renderMatriculasList(id);
    }
}

export function openClientModal(title) {
    const modal = document.getElementById('client-modal');
    const header = document.querySelector('#client-modal h3');
    if (header) header.innerText = title || 'Novo Cliente';

    const btnAddMatricula = document.getElementById('btn-open-matricula-modal');
    const listContainer = document.getElementById('enrollments-list');

    if (title === 'Cadastrar Novo Cliente') {
        document.getElementById('form-client').reset();
        state.editingClientId = null;
        
        document.getElementById('btn-pause-client').style.display = 'none';
        document.getElementById('btn-delete-client').style.display = 'none';
        
        if (btnAddMatricula) {
            btnAddMatricula.disabled = true;
            btnAddMatricula.style.opacity = '0.5';
            btnAddMatricula.style.cursor = 'not-allowed';
            const warningSpan = btnAddMatricula.querySelector('span');
            if (warningSpan) warningSpan.style.display = 'inline';
        }
        if (listContainer) {
            listContainer.innerHTML = '<div style="text-align: center; padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: 8px; color: #94a3b8;">Salve o cliente primeiro para adicionar matrículas.</div>';
        }
    } else {
        if (btnAddMatricula) {
            btnAddMatricula.disabled = false;
            btnAddMatricula.style.opacity = '1';
            btnAddMatricula.style.cursor = 'pointer';
            const warningSpan = btnAddMatricula.querySelector('span');
            if (warningSpan) warningSpan.style.display = 'none';
        }
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

export async function toggleClientStatus(id, status) {
    if (!confirm('Tem certeza que deseja desativar este aluno?')) return;

    try {
        await fetch(`${API_URL}/clientes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: status })
        });
        showToast('Cliente atualizado!');
        fetchClients();
        if (window.fetchDashboardData) window.fetchDashboardData();
    } catch (e) {
        showToast('Erro ao atualizar status.', true);
    }
}

// Form Submission
export async function handleClientSubmit(e) {
    e.preventDefault();

    const clientData = {
        nome: document.getElementById('client-name').value,
        endereco: document.getElementById('client-address').value,
        whatsapp: document.getElementById('client-phone').value,
        // Legacy fields defaults
        valor_padrao: 0,
        dia_vencimento: 10,
        professor_id: null,
        curso_id: null,
        valor_professor: 0,
        valor_igreja: 0
    };

    try {
        let response;
        if (state.editingClientId) {
            response = await fetch(`${API_URL}/clientes/${state.editingClientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
        } else {
            response = await fetch(`${API_URL}/clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
        }

        if (response.ok) {
            showToast(state.editingClientId ? 'Cliente atualizado!' : 'Cliente cadastrado!');
            closeModal('client-modal');
            state.editingClientId = null;
            document.getElementById('form-client').reset();
            await fetchClients();
            if (window.fetchDashboardData) window.fetchDashboardData();
        } else {
            showToast('Erro ao salvar.', true);
        }
    } catch (error) {
        console.error(error);
        showToast('Erro de conexão', true);
    }
}

let currentClientTab = 'active';

export function switchClientTab(tab) {
    currentClientTab = tab;

    // Update UI tabs
    const btnActive = document.getElementById('tab-active-clients');
    const btnInactive = document.getElementById('tab-inactive-clients');
    
    if (tab === 'active') {
        btnActive?.classList.add('active');
        btnInactive?.classList.remove('active');
    } else {
        btnActive?.classList.remove('active');
        btnInactive?.classList.add('active');
    }

    renderClients();
}

// Attach to window
window.fetchClients = fetchClients;
window.renderClients = renderClients;
window.filterClients = filterClients;
window.editClient = editClient;
window.openClientModal = openClientModal;
window.toggleClientStatus = toggleClientStatus;
window.handleClientSubmit = handleClientSubmit;
window.switchClientTab = switchClientTab;

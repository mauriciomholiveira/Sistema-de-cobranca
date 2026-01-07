const API_URL = 'http://localhost:3000/api';

// --- State ---
let clients = [];
let professors = [];
let courses = [];
let templates = [];
let billingData = [];
let currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

// --- Init ---
async function init() {
    // FORCE HIDE ALL MODALS FIRST - before anything else
    const modalsToHide = ['whatsapp-modal', 'client-modal', 'confirm-modal'];
    modalsToHide.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    });

    // Set initial month
    const monthInput = document.getElementById('billing-month');
    if (monthInput) monthInput.value = currentMonth;

    // Hash Logic: Set default if empty BEFORE listeners
    if (!window.location.hash) {
        // Only if truly empty, default to dashboard. 
        // If user refreshes, browser keeps the hash, so this is safe.
        // But to avoid "jump" if we are already at #billing, we do nothing.
        window.location.hash = '#dashboard-section';
    }

    // Setup Listeners and run Routing immediately
    setupEventListeners();

    try {
        await Promise.all([
            fetchDashboard(),
            fetchResources(),
            fetchClients() // We might fetch all, or let routing fetch specific
        ]);
    } catch (e) {
        console.error("Init failed:", e);
        showToast("Erro ao carregar dados iniciais.", true);
    }
}

// --- Fetchers ---
async function fetchDashboard() {
    try {
        const res = await fetch(`${API_URL}/dashboard?mes=${currentMonth}`);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        document.getElementById('total-alunos').textContent = data.alunos || 0;
        document.getElementById('total-atrasados').textContent = data.atrasados || 0;
        document.getElementById('total-recebido').textContent = `R$ ${parseFloat(data.recebido || 0).toFixed(2)}`;
        document.getElementById('total-areceber').textContent = `R$ ${parseFloat(data.a_receber || 0).toFixed(2)}`;

        // Isentos (New)
        const elIsentos = document.getElementById('total-isentos');
        if (elIsentos) elIsentos.textContent = data.isentos || 0;

        const list = document.getElementById('professor-stats-list');
        if (list) {
            list.innerHTML = (data.por_professor || []).map(p => `
                <li>
                    <span><i class="fa-solid fa-user-tie"></i> ${p.nome || 'Sem Professor'}</span>
                    <span class="text-success">R$ ${parseFloat(p.total).toFixed(2)}</span>
                </li>
            `).join('');
        }
    } catch (e) { console.error("Dashboard error:", e); }
}

async function fetchResources() {
    try {
        const [resProfs, resCourses, resTempl] = await Promise.all([
            fetch(`${API_URL}/professores`),
            fetch(`${API_URL}/cursos`),
            fetch(`${API_URL}/templates`)
        ]);

        professors = resProfs.ok ? await resProfs.json() : [];
        courses = resCourses.ok ? await resCourses.json() : [];
        templates = resTempl.ok ? await resTempl.json() : [];

        renderManagementLists();
        updateFormSelects();
    } catch (e) { console.error("Resources error:", e); }
}

async function fetchClients() {
    try {
        const res = await fetch(`${API_URL}/clientes`);
        if (!res.ok) throw new Error(res.statusText);
        clients = await res.json();
        renderClients();
    } catch (e) {
        console.error("Clients error:", e);
        showToast("Erro ao carregar clientes.", true);
    }
}

async function fetchBilling() {
    // Pass the selected month
    const res = await fetch(`${API_URL}/cobranca?mes=${currentMonth}`);
    billingData = await res.json();

    // Default Sort: A-Z by Name
    billingData.sort((a, b) => a.nome.localeCompare(b.nome));

    renderBillingTable();
}

// --- Billing Table Rendering ---
window.applySorting = () => {
    const sortField = document.getElementById('sort-field').value;
    const sortOrder = document.getElementById('sort-order').value;
    const filterStatus = document.getElementById('filter-status').value;

    const searchTerm = document.getElementById('billing-search').value.toLowerCase().trim();

    // Filter by status AND search term
    let filtered = billingData.filter(item => {
        // 1. Status Filter
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

        // 2. Search Filter (Name or Phone)
        const matchesSearch = !searchTerm ||
            item.nome.toLowerCase().includes(searchTerm) ||
            (item.whatsapp && item.whatsapp.includes(searchTerm));

        return matchesStatus && matchesSearch;
    });

    // Sort
    filtered.sort((a, b) => {
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
                // Order: ATRASADO > PENDENTE > PAGO
                const statusOrder = { 'ATRASADO': 3, 'PENDENTE': 2, 'PAGO': 1 };
                valA = statusOrder[a.status] || 0;
                valB = statusOrder[b.status] || 0;
                break;
            case 'vencimento':
                valA = new Date(a.data_vencimento);
                valB = new Date(b.data_vencimento);
                break;
            default:
                return 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    renderBillingTable(filtered);
};

// --- Renderers ---
function renderManagementLists() {
    // Professors
    document.getElementById('professors-list').innerHTML = professors.map(p => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(30, 41, 59, 0.3); border-radius: 6px; margin-bottom: 0.5rem;">
            <div>
                <strong>${p.nome}</strong>
                ${p.pix ? `<br><small style="color: #94a3b8;">PIX: ${p.pix}</small>` : ''}
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editProfessor(${p.id})" class="btn-icon" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="deleteProfessor(${p.id}, '${p.nome}')" class="btn-icon btn-danger" title="Excluir">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </li>
    `).join('');

    // Courses
    document.getElementById('courses-list').innerHTML = courses.map(c => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(30, 41, 59, 0.3); border-radius: 6px; margin-bottom: 0.5rem;">
            <div>
                <strong>${c.nome}</strong>
                <br><small style="color: #94a3b8;">R$ ${parseFloat(c.mensalidade_padrao || 0).toFixed(2)}</small>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editCourse(${c.id})" class="btn-icon" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="deleteCourse(${c.id}, '${c.nome}')" class="btn-icon btn-danger" title="Excluir">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </li>
    `).join('');
}

function updateFormSelects() {
    const profSelect = document.getElementById('client-professor');
    const courseSelect = document.getElementById('client-course');

    // Keep first option
    profSelect.innerHTML = '<option value="">Selecione...</option>' +
        professors.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');

    courseSelect.innerHTML = '<option value="">Selecione...</option>' +
        courses.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

// ... Client Render ...
// ... Client Render ...
function renderClients() {
    const list = document.getElementById('clients-list');
    if (!list) return;

    // List Header (Only once)
    const container = list.parentElement; // Assuming list is inside a container, or we just prepend
    // Actually, let's just use the list div itself.

    // Clear content
    list.innerHTML = '';
    list.classList.add('clients-grid'); // Ensure class is present

    // Header Row
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

    // Filter out inactive unless we implement a toggle visibility feature later
    const activeClients = clients.filter(c => c.active !== false);

    activeClients.forEach(c => {
        list.innerHTML += `
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
                    <span class="tag-pill">${c.nome_curso || '-'}</span>
                </div>

                <div class="cell-info">
                    <span class="value-highlight">R$ ${parseFloat(c.valor_padrao).toFixed(2)}</span>
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
    });
}

// Edit Mode State
let editingClientId = null;
let filteredClients = []; // Store filtered results

// Filter Clients Function
window.filterClients = (searchTerm) => {
    const list = document.getElementById('clients-list');
    if (!list) return;

    // If search is empty, show all clients
    if (!searchTerm || searchTerm.trim() === '') {
        renderClients();
        return;
    }

    // Filter clients based on search term (case-insensitive)
    const term = searchTerm.toLowerCase().trim();
    filteredClients = clients.filter(c => {
        const matchName = c.nome.toLowerCase().includes(term);
        const matchPhone = c.whatsapp.includes(term);
        const matchAddress = (c.endereco || '').toLowerCase().includes(term);
        return matchName || matchPhone || matchAddress;
    });

    // Clear and rebuild list with filtered results
    list.innerHTML = '';
    list.classList.add('clients-grid');

    // Header Row
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

    // Filter active clients
    const activeFilteredClients = filteredClients.filter(c => c.active !== false);

    // Show message if no results
    if (activeFilteredClients.length === 0) {
        list.innerHTML += `
            <div style="text-align: center; padding: 2rem; color: #94a3b8;">
                <i class="fa-solid fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Nenhum cliente encontrado para "${searchTerm}"</p>
            </div>
        `;
        return;
    }

    // Render filtered clients
    activeFilteredClients.forEach(c => {
        list.innerHTML += `
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
                    <span class="tag-pill">${c.nome_curso || '-'}</span>
                </div>

                <div class="cell-info">
                    <span class="value-highlight">R$ ${parseFloat(c.valor_padrao).toFixed(2)}</span>
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
    });
};


// Global Actions for Client
window.editClient = (id) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    editingClientId = id;

    // Populate Form
    document.getElementById('client-name').value = client.nome;
    document.getElementById('client-address').value = client.endereco;
    document.getElementById('client-phone').value = client.whatsapp;
    document.getElementById('client-value').value = client.valor_padrao;
    document.getElementById('client-due-day').value = client.dia_vencimento;
    document.getElementById('client-professor').value = client.professor_id || '';
    document.getElementById('client-course').value = client.curso_id || '';

    // Open Modal via global helper
    if (window.openClientModal) window.openClientModal('Editar Cliente');

    // Show actions
    document.getElementById('btn-pause-client').style.display = 'flex';
    document.getElementById('btn-delete-client').style.display = 'flex';
    document.getElementById('btn-apply-to-pending').style.display = 'flex';

    // Store original values for change detection
    window.originalClientValues = {
        valor: client.valor_padrao,
        prof: client.professor_id,
        curso: client.curso_id,
        valor_prof: document.getElementById('client-valor-professor').value // Get from input as it might be calculated/default
    };
};

window.openClientModal = (title) => {
    // Helper to reset and open
    const modal = document.getElementById('client-modal');
    document.querySelector('#client-modal h3').innerText = title || 'Novo Cliente';

    if (title === 'Cadastrar Novo Cliente') {
        // Reset form if new
        document.getElementById('form-client').reset();
        editingClientId = null;
        document.getElementById('btn-pause-client').style.display = 'none';
        document.getElementById('btn-delete-client').style.display = 'none';
        document.getElementById('btn-apply-to-pending').style.display = 'none';
        window.originalClientValues = null;
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
};

// Wire up the new client button safely
document.getElementById('btn-new-client').onclick = () => window.openClientModal('Cadastrar Novo Cliente');

window.toggleClientStatus = async (id, status) => {
    if (!confirm('Tem certeza que deseja desativar este aluno?')) return;

    await fetch(`${API_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: status })
    });
    showToast('Cliente atualizado!');
    fetchClients();
    fetchDashboard();
};

// Submit Form
document.getElementById('form-client').addEventListener('submit', async (e) => {
    e.preventDefault();

    const clientData = {
        nome: document.getElementById('client-name').value,
        endereco: document.getElementById('client-address').value,
        whatsapp: document.getElementById('client-phone').value,
        valor_padrao: parseFloat(document.getElementById('client-value').value),
        dia_vencimento: parseInt(document.getElementById('client-due-day').value) || 10,
        professor_id: document.getElementById('client-professor').value || null,
        curso_id: document.getElementById('client-course').value || null,
        valor_professor: parseFloat(document.getElementById('client-valor-professor').value) || 0,
        valor_igreja: parseFloat(document.getElementById('client-valor-igreja').value) || 0
    };

    try {
        let response;
        if (editingClientId) {
            // Update
            response = await fetch(`${API_URL}/clientes/${editingClientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
        } else {
            // Create
            response = await fetch(`${API_URL}/clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
        }

        if (response.ok) {

            // Check for revenue changes to prompt for bulk update
            const newValor = parseFloat(clientData.valor_padrao);
            const newValorProf = parseFloat(document.getElementById('client-valor-professor').value || 0);

            // Capture ID locally to avoid race conditions with global state
            const targetId = editingClientId;

            let promptForBulk = false;
            // Use targetId instead of editingClientId in check
            if (targetId && window.originalClientValues) {
                const oldValor = parseFloat(window.originalClientValues.valor);
                const oldValorProf = parseFloat(window.originalClientValues.valor_prof || 0);

                if (newValor !== oldValor || newValorProf !== oldValorProf) {
                    promptForBulk = true;
                }
            }

            if (promptForBulk) {
                window.openConfirmModal(
                    'Alteração Financeira',
                    'Você alterou valores financeiros. Deseja aplicar os novos valores a todas as mensalidades PENDENTES deste aluno?',
                    async () => {
                        // Use local targetId
                        await fetch(`${API_URL}/clientes/${targetId}/aplicar-divisao`, { method: 'PUT' });
                        showToast('Valores aplicados aos pendentes!');
                        fetchBilling();
                    }
                );
            }

            // Use targetId for toast message logic as well, or keep as is (since it runs immediately)
            showToast(targetId ? 'Cliente atualizado!' : 'Cliente cadastrado!');

            // Close modal by clicking the cancel button (which triggers the generic close)
            const btnClose = document.getElementById('btn-cancel-client-modal');
            if (btnClose) btnClose.click();

            await fetchClients();
            fetchDashboard();
        } else {
            showToast('Erro ao salvar.', true);
        }
    } catch (error) {
        showToast('Erro de conexão', true);
    }
});
function renderBillingTable(data = billingData) {
    const tbody = document.getElementById('billing-list');
    tbody.innerHTML = '';

    data.forEach(item => {
        const isLate = item.status === 'ATRASADO';
        const isPaid = item.status === 'PAGO';
        const colorClass = isPaid ? 'text-success' : (isLate ? 'text-danger' : '');

        // Calculate default split if not set
        const valorTotal = parseFloat(item.valor_cobrado) || 0;
        const valorProf = item.valor_professor_recebido !== null ? parseFloat(item.valor_professor_recebido) : Math.min(100, valorTotal);
        const valorIgreja = item.valor_igreja_recebido !== null ? parseFloat(item.valor_igreja_recebido) : (valorTotal - valorProf);

        tbody.innerHTML += `
            <tr>
                <td>
                    <strong style="font-size: 1rem; color: #f1f5f9;">${item.nome}</strong><br>
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
                               value="${valorProf.toFixed(2)}"
                               step="0.01"
                               onblur="this.value = parseFloat(this.value).toFixed(2)"
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
                               value="${valorIgreja.toFixed(2)}"
                               step="0.01"
                               readonly
                               style="cursor: not-allowed; opacity: 0.7;"
                        >
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                        <!-- Action Trio -->
                        <button class="btn-icon-action" onclick="sendWhatsappDirect(${item.id}, 'lembrete')" title="Lembrete" style="color: #60a5fa;">
                            <i class="fa-regular fa-calendar"></i>
                        </button>
                        <button class="btn-icon-action" onclick="sendWhatsappDirect(${item.id}, 'vence_hoje')" title="Vence Hoje" style="color: #fbbf24;">
                            <i class="fa-solid fa-bell"></i>
                        </button>
                        <button class="btn-icon-action" onclick="sendWhatsappDirect(${item.id}, 'em_atraso')" title="Em Atraso" style="color: #f87171;">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </button>
                        
                        <div style="width: 1px; height: 24px; background: rgba(255,255,255,0.1); margin: 0 8px;"></div>

                        <!-- Toggle Payment -->
                        <button class="btn-toggle-pay ${isPaid ? 'active' : ''}" 
                                onclick="togglePaymentStatus(${item.id}, '${item.status}')" 
                                title="${isPaid ? 'Desfazer Pagamento' : 'Marcar como Pago'}">
                            <i class="fa-solid ${isPaid ? 'fa-xmark' : 'fa-check'}"></i> 
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// --- Actions ---
window.updatePayment = async (id, field, value) => {
    try {
        await fetch(`${API_URL}/pagamentos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value })
        });
        showToast('Atualizado!');
        // Refresh depends on context. For now, simple refresh of data.
        // Optimization: Update local array and re-render row to avoid full fetch.
        // For safety/simplicity:
        if (field === 'status' || field === 'data_pagamento') {
            fetchDashboard();
            fetchBilling();
        }
    } catch (e) {
        console.error(e);
        showToast('Erro ao atualizar', true);
    }
};

// --- Confirm Modal Logic ---
window.openConfirmModal = (title, message, onConfirm) => {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;

    // Reset previous listeners to avoid duplicates
    const btn = document.getElementById('btn-confirm-action');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.onclick = async () => {
        await onConfirm();
        window.closeConfirmModal();
    };

    modal.classList.remove('hidden');
    modal.style.display = 'flex'; // Restore flex display
};

window.closeConfirmModal = () => {
    const modal = document.getElementById('confirm-modal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
};

window.togglePaymentStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'PAGO' ? 'PENDENTE' : 'PAGO';
    const isPaying = newStatus === 'PAGO';

    const title = isPaying ? 'Confirmar Pagamento?' : 'Desfazer Pagamento?';
    const message = isPaying
        ? 'Deseja marcar esta mensalidade como PAGA?'
        : 'Atenção! Isso removerá o status de pagamento. Deseja continuar?';

    window.openConfirmModal(title, message, async () => {
        if (isPaying) {
            const today = new Date().toISOString().split('T')[0];
            await window.updatePayment(id, 'data_pagamento', today);
        } else {
            await window.updatePayment(id, 'data_pagamento', null);
        }
        await window.updatePayment(id, 'status', newStatus);
        fetchBilling(); // Refresh UI
    });
};

// WhatsApp Direct Send (No Modal)
window.sendWhatsappDirect = async (id, type) => {
    try {
        showToast('Carregando mensagem...', false);

        const item = billingData.find(i => i.id === id);
        if (!item) {
            showToast('Erro: Cliente não encontrado', true);
            return;
        }

        // Load template
        const response = await fetch(`${API_URL}/templates/${type}`);
        if (!response.ok) throw new Error('Template não encontrado');
        let template = await response.text();

        // Calculate days late
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [y, m, d] = item.data_vencimento.split('T')[0].split('-');
        const dueDate = new Date(y, m - 1, d);
        const diffDays = Math.max(0, Math.round((today - dueDate) / (1000 * 60 * 60 * 24)));

        // Replace variables
        const nome = item.nome.split(' ')[0];
        const valor = parseFloat(item.valor_cobrado || 0).toFixed(2).replace('.', ',');
        const vencimento = formatDate(item.data_vencimento);
        const pixChave = '47773105000147';
        const pixCopiaCola = '00020126360014BR.GOV.BCB.PIX0114477731050001475204000053039865802BR5901N6001C62090505Aulas63043954';

        template = template
            .replace(/\{\{nome\}\}/g, nome)
            .replace(/\{\{valor\}\}/g, valor)
            .replace(/\{\{vencimento\}\}/g, vencimento)
            .replace(/\{\{dias_atraso\}\}/g, diffDays)
            .replace(/\{\{pix_chave\}\}/g, pixChave)
            .replace(/\{\{pix_copia_cola\}\}/g, pixCopiaCola);

        // Clean phone number
        let phone = (item.whatsapp || '').replace(/\D/g, '');
        if (!phone.startsWith('55') && phone.length > 9) phone = '55' + phone;

        // Open WhatsApp
        const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(template)}`;
        window.open(url, '_blank');

        showToast('Abrindo WhatsApp...', false);
    } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error);
        showToast('Erro ao carregar template: ' + error.message, true);
    }
};

// Legacy function - kept for compatibility but redirects to new function
window.openWhatsappModal = (id, type = 'lembrete') => {
    window.sendWhatsappDirect(id, type);
};

window.setMsgType = (type) => window.generateWhatsAppMessage(type);

window.generateWhatsAppMessage = (type) => {
    if (!currentBillingId) return;
    const item = billingData.find(i => i.id === currentBillingId);
    if (!item) return;

    const today = new Date();
    const dueDate = new Date(item.data_vencimento);
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Format values
    const valueFormatted = parseFloat(item.valor_cobrado).toFixed(2).replace('.', ',');
    const dueDateFormatted = formatDate(item.data_vencimento);

    // --- Dynamic Greeting ---
    const hour = today.getHours();
    let greeting = 'Bom dia';
    if (hour >= 12) greeting = 'Boa tarde';
    if (hour >= 18) greeting = 'Boa noite';

    const nome = item.nome.split(' ')[0]; // First name
    const valor = parseFloat(item.valor_cobrado).toFixed(2);
    const vencimento = formatDate(item.data_vencimento);

    // Calculate Days Late
    const oneDay = 24 * 60 * 60 * 1000;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const dueDateObj = new Date(item.data_vencimento);
    // Fix TZ issues roughly by splitting YMD
    const [y, m, d] = item.data_vencimento.split('T')[0].split('-');
    const fixedDueDate = new Date(y, m - 1, d);

    const diffDaysCalculated = Math.round((todayDate - fixedDueDate) / oneDay); // Renamed to avoid conflict

    let statusText = '';
    if (type === 'atraso') {
        const dias = diffDays > 0 ? diffDays : 0; // Avoid negative if clicked wrong
        statusText = `sua mensalidade se encontra em atraso de *${dias} dias*`;
    } else {
        statusText = `ela vence dia *${vencimento}*`;
    }

    const pixKey = '47773105000147';
    const pixCopiaCola = '00020126360014BR.GOV.BCB.PIX0114477731050001475204000053039865802BR5901N6001C62090505Aulas63043954';

    const msg = `Oi ${nome}, tudo bem? Graça e paz!
Mauricio aqui :-) 
Passando para te lembrar que sua mensalidade do curso no valor de *R$ ${valor}*
Data de vencimento: *${vencimento}*

${statusText}

Sempre adicionar a chave pix, e uma atenção:
Enviar comprovante de pagamento assim que fizer o pagamento.

Chave Pix: ${pixKey}

Pix Copia-e-cola:
${pixCopiaCola}`;

    document.getElementById('whatsapp-preview').value = msg;

    // Update active button state
    document.querySelectorAll('.template-actions button').forEach(b => {
        b.classList.remove('active'); // You might want to add styles for .btn-secondary.active
        if (b.getAttribute('onclick').includes(type)) b.classList.add('text-primary');
    });
}
// Removed generic updateMessagePreview and template fetcher for now as we use specialized logic
function old_updateMessagePreview(item) {
    // Legacy placeholder
}

// --- Utils & Event Listeners ---
function setupEventListeners() {
    // --- Generic Modal Handling (DRY) ---
    function setupModal(modalId, btnOpenId, btnCloseId, btnCancelId, onOpen = null, onClose = null) {
        const modal = document.getElementById(modalId);
        const btnOpen = document.getElementById(btnOpenId);
        const btnClose = document.getElementById(btnCloseId);
        const btnCancel = document.getElementById(btnCancelId);

        // Force hide on init
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }

        const open = () => {
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                if (onOpen) onOpen();
            }
        };

        const close = () => {
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                if (onClose) onClose();
            }
        };

        if (btnOpen) btnOpen.addEventListener('click', open);
        if (btnClose) btnClose.addEventListener('click', close);
        if (btnCancel) btnCancel.addEventListener('click', close);

        // Close on click outside card
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) close();
            });
        }

        return { open, close };
    }

    // Initialize Client Modal
    const clientModalCtrl = setupModal(
        'client-modal',
        'btn-new-client',
        'btn-close-client-modal',
        'btn-cancel-client-modal',
        () => {
            // Reset form on New (not Edit)
            if (!editingClientId) {
                document.getElementById('form-client').reset();
                document.querySelector('#client-modal h3').textContent = 'Cadastrar Novo Cliente';
            }
        },
        () => {
            editingClientId = null;
            document.getElementById('form-client').reset();
        }
    );

    // Expose open for global edit function
    window.openClientModal = (title) => {
        const modal = document.getElementById('client-modal');
        if (modal) {
            modal.querySelector('h3').textContent = title || 'Cadastrar Novo Cliente';
            clientModalCtrl.open();
        }
    };

    // Initialize WhatsApp Modal
    setupModal(
        'whatsapp-modal',
        null,
        'btn-close-modal', // Corrected ID from HTML
        null
    );

    // --- Modal Listeners (WhatsApp Specifics) ---
    // Safely attach listener, removing old one if exists (to prevent duplicates if init runs twice)
    const btnSendWhatsapp = document.getElementById('btn-send-whatsapp');
    if (btnSendWhatsapp) {
        // Clone to clear listeners or just add if first time. Better to use standard addEventListener
        // assuming init runs once.
        btnSendWhatsapp.onclick = () => { // Direct assignment to ensure single handler
            if (!currentBillingId) {
                console.error("No billing ID selected");
                return;
            }
            const item = billingData.find(i => i.id === currentBillingId);
            if (!item) return;

            const msg = document.getElementById('whatsapp-preview').value;
            // Clean phone number: remove non-numeric
            let phone = item.whatsapp.replace(/\D/g, '');
            if (!phone.startsWith('55') && phone.length > 9) phone = '55' + phone;

            const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
            document.getElementById('whatsapp-modal').classList.add('hidden');
        };
    }

    // Old manual listeners removed...
    const templateSelect = document.getElementById('whatsapp-template');
    if (templateSelect) {
        templateSelect.addEventListener('change', () => {
            if (currentBillingId) {
                const item = billingData.find(i => i.id === currentBillingId);
                updateMessagePreview(item);
            }
        });
    }

    // --- Management Actions ---
    const btnAddProf = document.getElementById('btn-add-prof');
    if (btnAddProf) {
        btnAddProf.addEventListener('click', async () => {
            const nome = document.getElementById('new-prof-name').value;
            const pix = document.getElementById('new-prof-pix').value;
            if (!nome) return;

            const res = await fetch(`${API_URL}/professores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, pix: pix || null })
            });

            if (res.ok) {
                document.getElementById('new-prof-name').value = '';
                document.getElementById('new-prof-pix').value = '';
                await fetchProfessors();
                showToast('Professor adicionado!', false);
            }
        });
    }

    const btnAddCourse = document.getElementById('btn-add-course');
    if (btnAddCourse) {
        btnAddCourse.addEventListener('click', async () => {
            const nome = document.getElementById('new-course-name').value;
            const valor = document.getElementById('new-course-value').value;
            if (!nome || !valor) return;

            const res = await fetch(`${API_URL}/cursos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, mensalidade_padrao: parseFloat(valor) })
            });

            if (res.ok) {
                document.getElementById('new-course-name').value = '';
                document.getElementById('new-course-value').value = '';
                await fetchCourses();
                showToast('Curso adicionado!', false);
            }
        });
    }

    // --- Quick Add Listeners ---
    const btnQuickProf = document.getElementById('btn-quick-add-prof');
    if (btnQuickProf) {
        btnQuickProf.addEventListener('click', async () => {
            const nome = prompt("Nome do Novo Professor:");
            if (nome) {
                await fetch(`${API_URL}/professores`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome })
                });
                await fetchResources(); // Reload selects
                // Auto-select the last one? Or just reload
                showToast('Professor adicionado!');
            }
        });
    }

    const btnQuickCourse = document.getElementById('btn-quick-add-course');
    if (btnQuickCourse) {
        btnQuickCourse.addEventListener('click', async () => {
            const nome = prompt("Nome do Novo Curso:");
            if (nome) {
                const valor = prompt("Valor Padrão (R$):", "0.00");
                await fetch(`${API_URL}/cursos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, mensalidade_padrao: parseFloat(valor) || 0 })
                });
                await fetchResources();
                showToast('Curso adicionado!');
            }
        });
    }

    // --- Navigation & Filters ---
    const monthInput = document.getElementById('billing-month');
    if (monthInput) {
        monthInput.addEventListener('change', (e) => {
            currentMonth = e.target.value;
            fetchBilling();
            fetchDashboard();
        });
    }

    // --- Navigation (Hash Routing) ---
    function handleRouting() {
        const hash = window.location.hash.replace('#', '') || 'dashboard-section';

        // Update Sidebar
        document.querySelectorAll('.sidebar a').forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('data-target') === hash) a.classList.add('active');
        });

        // Update Content
        document.querySelectorAll('.tab-content').forEach(c => {
            c.classList.remove('active');
            if (c.id === hash) {
                c.classList.add('active');

                // Content Refresh
                if (hash === 'clients-section') fetchClients();
                if (hash === 'billing-section') fetchBilling();
                if (hash === 'dashboard-section') fetchDashboard();
            }
        });
    }

    // Hash Change Listener
    window.addEventListener('hashchange', handleRouting);

    // Initial Route (Run immediately)
    handleRouting();

    // Load templates into select (Deferred)
    setTimeout(() => {
        const tSelect = document.getElementById('whatsapp-template');
        if (tSelect) {
            tSelect.innerHTML = '<option value="">Padrão do Sistema</option>' +
                templates.map(t => `<option value="${t.id}">${t.titulo}</option>`).join('');
        }
    }, 1000);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

function formatPhone(phone) {
    if (!phone) return '';
    return phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

// Run
document.addEventListener('DOMContentLoaded', init);

// Edit Professor Function
window.editProfessor = async (id) => {
    const prof = professors.find(p => p.id === id);
    if (!prof) return;

    const newName = prompt('Novo nome do professor:', prof.nome);
    if (!newName || newName === prof.nome) {
        const newPix = prompt('Chave PIX (deixe vazio para remover):', prof.pix || '');
        if (newPix === (prof.pix || '')) return;

        const res = await fetch(`${API_URL}/professores/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pix: newPix || null })
        });

        if (res.ok) {
            await fetchProfessors();
            showToast('PIX atualizado!', false);
        }
        return;
    }

    const newPix = prompt('Chave PIX (deixe vazio para remover):', prof.pix || '');

    const res = await fetch(`${API_URL}/professores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newName, pix: newPix || null })
    });

    if (res.ok) {
        await fetchProfessors();
        showToast('Professor atualizado!', false);
    } else {
        showToast('Erro ao atualizar professor', true);
    }
};

// Toggle Professor Active Status (renamed from delete)
window.deleteProfessor = async (id, nome) => {
    if (!confirm(`Desativar o professor "${nome}"?\n\nO professor não será excluído, apenas ocultado.\nO histórico de pagamentos será preservado.`)) return;

    const res = await fetch(`${API_URL}/professores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false })
    });

    if (res.ok) {
        await fetchProfessors();
        showToast('Professor desativado!', false);
    } else {
        showToast('Erro ao desativar professor', true);
    }
};

// Edit Course Function
window.editCourse = async (id) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;

    const newName = prompt('Novo nome do curso:', course.nome);
    if (!newName) return;

    const newValue = prompt('Novo valor padrão (R$):', parseFloat(course.mensalidade_padrao).toFixed(2));
    if (!newValue) return;

    const res = await fetch(`${API_URL}/cursos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newName, mensalidade_padrao: parseFloat(newValue) })
    });

    if (res.ok) {
        await fetchCourses();
        showToast('Curso atualizado!', false);
    } else {
        showToast('Erro ao atualizar curso', true);
    }
};

// Toggle Course Active Status (renamed from delete)
window.deleteCourse = async (id, nome) => {
    if (!confirm(`Desativar o curso "${nome}"?\n\nO curso não será excluído, apenas ocultado.\nO histórico de pagamentos será preservado.`)) return;

    const res = await fetch(`${API_URL}/cursos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false })
    });

    if (res.ok) {
        await fetchCourses();
        showToast('Curso desativado!', false);
    } else {
        showToast('Erro ao desativar curso', true);
    }
};

// Switch between active and inactive clients
window.switchClientTab = (tab) => {
    const activeTab = document.getElementById('tab-active-clients');
    const inactiveTab = document.getElementById('tab-inactive-clients');
    const activeContainer = document.getElementById('active-clients-container');
    const inactiveContainer = document.getElementById('inactive-clients-container');

    if (tab === 'active') {
        activeTab.classList.add('active');
        inactiveTab.classList.remove('active');
        activeContainer.style.display = 'block';
        inactiveContainer.style.display = 'none';
    } else {
        activeTab.classList.remove('active');
        inactiveTab.classList.add('active');
        activeContainer.style.display = 'none';
        inactiveContainer.style.display = 'block';
        renderInactiveClients();
    }
};

// Render inactive clients
function renderInactiveClients() {
    const list = document.getElementById('inactive-clients-list');
    if (!list) return;

    const inactiveClients = clients.filter(c => !c.active);

    if (inactiveClients.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Nenhum cliente inativo</p>';
        return;
    }

    list.innerHTML = '';
    inactiveClients.forEach(c => {
        list.innerHTML += `
            <div class="client-row" style="opacity: 0.6;">
                <div class="cell-avatar">
                    <div class="avatar">${c.nome.charAt(0).toUpperCase()}</div>
                </div>

                <div class="cell-info">
                    <strong>${c.nome}</strong>
                    <small>${c.nome_professor || 'Sem professor'} • ${c.nome_curso || 'Sem curso'}</small>
                </div>

                <div class="cell-info">
                    <small style="color: #94a3b8;">Desativado</small>
                </div>

                <div class="cell-actions">
                    <button class="btn-primary" onclick="reactivateClient(${c.id}, '${c.nome}')" title="Reativar">
                        <i class="fa-solid fa-rotate-left"></i> Reativar
                    </button>
                </div>
            </div>
        `;
    });
}

// Reactivate client
window.reactivateClient = async (id, nome) => {
    const generateBilling = confirm(`Reativar o cliente "${nome}"?\n\nDeseja gerar cobrança para o mês atual?`);

    const res = await fetch(`${API_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true })
    });

    if (res.ok) {
        await fetchClients();

        if (generateBilling) {
            // Generate billing for current month
            const currentMonth = new Date().toISOString().slice(0, 7);
            await fetch(`${API_URL}/pagamentos/gerar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mes: currentMonth, cliente_id: id })
            });
            await fetchBilling();
        }

        showToast('Cliente reativado!', false);
        switchClientTab('active');
    } else {
        showToast('Erro ao reativar cliente', true);
    }
};

// Filter clients by search term
window.filterClients = (searchTerm) => {
    const term = searchTerm.toLowerCase().trim();
    const activeTab = document.getElementById('tab-active-clients').classList.contains('active');

    if (activeTab) {
        const filteredClients = clients.filter(c =>
            c.active && (
                c.nome.toLowerCase().includes(term) ||
                (c.nome_professor && c.nome_professor.toLowerCase().includes(term)) ||
                (c.nome_curso && c.nome_curso.toLowerCase().includes(term))
            )
        );
        renderFilteredClients(filteredClients);
    } else {
        const filteredInactive = clients.filter(c =>
            !c.active && (
                c.nome.toLowerCase().includes(term) ||
                (c.nome_professor && c.nome_professor.toLowerCase().includes(term)) ||
                (c.nome_curso && c.nome_curso.toLowerCase().includes(term))
            )
        );
        renderFilteredInactiveClients(filteredInactive);
    }
};

function renderFilteredClients(filteredClients) {
    const list = document.getElementById('clients-list');
    if (!list) return;

    list.innerHTML = '';
    filteredClients.forEach(c => {
        list.innerHTML += `
            <div class="client-row">
                <div class="cell-avatar">
                    <div class="avatar">${c.nome.charAt(0).toUpperCase()}</div>
                </div>

                <div class="cell-info">
                    <strong>${c.nome}</strong>
                    <small>${c.nome_professor || 'Sem professor'} • ${c.nome_curso || 'Sem curso'}</small>
                </div>

                <div class="cell-info">
                    <span class="value-highlight">R$ ${parseFloat(c.valor_padrao).toFixed(2)}</span>
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
    });
}

function renderFilteredInactiveClients(filteredClients) {
    const list = document.getElementById('inactive-clients-list');
    if (!list) return;

    if (filteredClients.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Nenhum cliente inativo encontrado</p>';
        return;
    }

    list.innerHTML = '';
    filteredClients.forEach(c => {
        list.innerHTML += `
            <div class="client-row" style="opacity: 0.6;">
                <div class="cell-avatar">
                    <div class="avatar">${c.nome.charAt(0).toUpperCase()}</div>
                </div>

                <div class="cell-info">
                    <strong>${c.nome}</strong>
                    <small>${c.nome_professor || 'Sem professor'} • ${c.nome_curso || 'Sem curso'}</small>
                </div>

                <div class="cell-info">
                    <small style="color: #94a3b8;">Desativado</small>
                </div>

                <div class="cell-actions">
                    <button class="btn-primary" onclick="reactivateClient(${c.id}, '${c.nome}')" title="Reativar">
                        <i class="fa-solid fa-rotate-left"></i> Reativar
                    </button>
                </div>
            </div>
        `;
    });
}

// Calculate revenue split automatically
window.calculateRevenueSplit = () => {
    const totalValue = parseFloat(document.getElementById('client-value').value) || 0;
    const professorValue = document.getElementById('client-valor-professor');
    const churchValue = document.getElementById('client-valor-igreja');

    // If professor value is empty, suggest 100 or total (whichever is smaller)
    if (!professorValue.value || parseFloat(professorValue.value) === 0) {
        const suggested = Math.min(100, totalValue);
        professorValue.value = suggested.toFixed(2);
    }

    calculateChurchPortion();
};

window.calculateChurchPortion = () => {
    const totalValue = parseFloat(document.getElementById('client-value').value) || 0;
    const professorValue = parseFloat(document.getElementById('client-valor-professor').value) || 0;
    const churchValue = document.getElementById('client-valor-igreja');

    const churchPortion = totalValue - professorValue;

    if (churchPortion < 0) {
        showToast('Valor do professor não pode ser maior que o total!', true);
        document.getElementById('client-valor-professor').value = totalValue.toFixed(2);
        churchValue.value = '0.00';
    } else {
        churchValue.value = churchPortion.toFixed(2);
    }
};

// Update revenue split for a payment
window.updateRevenueSplit = async (paymentId, field, value, totalValue) => {
    const profValue = parseFloat(value);
    const churchValue = totalValue - profValue;

    // Validation
    if (profValue < 0 || profValue > totalValue) {
        showToast('Valor do professor deve estar entre R$ 0 e o valor total!', true);
        await fetchBilling(); // Reload to reset
        return;
    }

    // Update church field visually
    const churchInput = document.getElementById(`igreja-${paymentId}`);
    if (churchInput) {
        churchInput.value = churchValue.toFixed(2);
    }

    // Save to backend
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
            // Update local data
            const payment = billingData.find(p => p.id === paymentId);
            if (payment) {
                payment.valor_professor_recebido = profValue;
                payment.valor_igreja_recebido = churchValue;
            }
            showToast('Divisão atualizada!', false);
        } else {
            showToast('Erro ao salvar divisão', true);
        }
    } catch (err) {
        console.error('Error updating revenue split:', err);
        showToast('Erro ao salvar divisão', true);
    }
};

// Show pause/delete buttons when editing a client
window.showClientActionButtons = (clientId) => {
    const pauseBtn = document.getElementById('btn-pause-client');
    const deleteBtn = document.getElementById('btn-delete-client');

    if (clientId) {
        pauseBtn.style.display = 'flex';
        deleteBtn.style.display = 'flex';

        pauseBtn.onclick = () => pauseClient(clientId);
        deleteBtn.onclick = () => deleteClient(clientId);

        // Also show apply button
        toggleApplyButton(clientId);
    } else {
        pauseBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        toggleApplyButton(null);
    }
};

// Pause/Unpause client (toggle active status)
window.pauseClient = async (clientId) => {
    const client = clientsData.find(c => c.id === clientId);
    if (!client) return;

    const action = client.active ? 'pausar' : 'reativar';
    const confirmMsg = client.active
        ? 'Tem certeza que deseja pausar este cliente? Ele não aparecerá mais na lista de ativos.'
        : 'Deseja reativar este cliente?';

    if (!confirm(confirmMsg)) return;

    try {
        const res = await fetch(`${API_URL}/clientes/${clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !client.active })
        });

        if (res.ok) {
            showToast(`Cliente ${action === 'pausar' ? 'pausado' : 'reativado'} com sucesso!`, false);
            closeModal('client-modal');
            await fetchClients();
            renderActiveClients();
        }
    } catch (err) {
        console.error('Error pausing client:', err);
        showToast('Erro ao pausar cliente', true);
    }
};

// Delete client permanently
window.deleteClient = async (clientId) => {
    if (!confirm('⚠️ ATENÇÃO: Excluir o cliente irá remover TODOS os pagamentos associados! Esta ação não pode ser desfeita. Tem certeza?')) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/clientes/${clientId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showToast('Cliente excluído permanentemente!', false);
            closeModal('client-modal');
            await fetchClients();
            renderActiveClients();
        }
    } catch (err) {
        console.error('Error deleting client:', err);
        showToast('Erro ao excluir cliente', true);
    }
};

// Apply revenue split to all pending payments
window.applyRevenueSplitToPending = async (clientId) => {
    const client = clientsData.find(c => c.id === clientId);
    if (!client) return;

    const valorProf = parseFloat(document.getElementById('client-professor-value').value) || 0;
    const valorIgreja = parseFloat(document.getElementById('client-igreja').value) || 0;

    if (valorProf + valorIgreja !== client.valor_padrao) {
        showToast('Erro: Professor + Igreja deve ser igual ao Valor Total', true);
        return;
    }

    const confirmMsg = `Aplicar R$ ${valorProf.toFixed(2)} (Professor) e R$ ${valorIgreja.toFixed(2)} (Igreja) a TODOS os meses pendentes?\n\nIsso irá sobrescrever valores editados manualmente em meses pendentes.`;

    if (!confirm(confirmMsg)) return;

    try {
        const res = await fetch(`${API_URL}/clientes/${clientId}/aplicar-divisao`, {
            method: 'PUT'
        });

        if (res.ok) {
            const data = await res.json();
            showToast(`✅ ${data.updated} pagamento(s) atualizado(s)!`, false);
            await fetchBillingData();
            renderBillingTable(billingData);
        } else {
            showToast('Erro ao aplicar divisão', true);
        }
    } catch (err) {
        console.error('Error applying split:', err);
        showToast('Erro ao aplicar divisão', true);
    }
};

// Show/hide apply button when editing client
window.toggleApplyButton = (clientId) => {
    const applyBtn = document.getElementById('btn-apply-to-pending');
    if (clientId && applyBtn) {
        applyBtn.style.display = 'block';
        applyBtn.onclick = () => applyRevenueSplitToPending(clientId);
    } else if (applyBtn) {
        applyBtn.style.display = 'none';
    }
};

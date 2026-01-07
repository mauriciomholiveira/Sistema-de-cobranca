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

// --- Dashboard ---
// Alias to match HTML onclick
window.fetchDashboardData = fetchDashboard;

async function fetchDashboard() {
    try {
        const monthInput = document.getElementById('dashboard-month');
        let mes = monthInput ? monthInput.value : null;

        if (!mes) {
            mes = new Date().toISOString().slice(0, 7);
            if (monthInput) monthInput.value = mes;
        }

        // Logic to Lazy Generate Payments for Dashboard if they don't exist? 
        // For now, let's assume specific month viewing implies checking status. 
        // If we want accurate forecasting for future months without visiting billing, we might need to hit a generate endpoint.
        // But dashboard is usually read-only. Let's start with just reading.
        
        const res = await fetch(`${API_URL}/dashboard?mes=${mes}`);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        const elRecebido = document.getElementById('dash-total-received');
        if (elRecebido) elRecebido.textContent = `R$ ${parseFloat(data.recebido || 0).toFixed(2)}`;

        const elPendente = document.getElementById('dash-total-pending');
        if (elPendente) elPendente.textContent = `R$ ${parseFloat(data.a_receber || 0).toFixed(2)}`;

        const elAtrasado = document.getElementById('dash-total-late');
        if (elAtrasado) elAtrasado.textContent = `R$ ${parseFloat(data.atrasados || 0).toFixed(2)}`;

        const elStudents = document.getElementById('dash-total-students');
        if (elStudents) elStudents.textContent = data.alunos || 0;

        // Split Totals
        const elProf = document.getElementById('dash-total-prof');
        if (elProf) elProf.textContent = `R$ ${parseFloat(data.total_professores || 0).toFixed(2)}`;

        const elIgreja = document.getElementById('dash-total-church');
        if (elIgreja) elIgreja.textContent = `R$ ${parseFloat(data.total_igreja || 0).toFixed(2)}`;

        const elExempt = document.getElementById('dash-total-exempt');
        if (elExempt) elExempt.textContent = data.isentos || 0;

        const elForecast = document.getElementById('dash-total-forecast');
        if (elForecast) elForecast.textContent = `R$ ${parseFloat(data.previsao_total || 0).toFixed(2)}`;

        // Update lists
        const upcomingList = document.getElementById('upcoming-list');
        if (upcomingList) {
            upcomingList.innerHTML = (data.proximos_vencimentos || []).map(p => `
                <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span>${p.nome}</span>
                    <span style="color: #60a5fa;">${p.vencimento}</span>
                </li>
            `).join('') || '<li style="color: #94a3b8; text-align: center;">Nenhum vencimento próximo</li>';
        }

        const lateList = document.getElementById('late-list');
        if (lateList) {
            lateList.innerHTML = (data.atrasos_recentes || []).map(a => `
                <li style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span>${a.nome}</span>
                    <span style="color: #f87171;">${a.dias_atraso} dias</span>
                </li>
            `).join('') || '<li style="color: #94a3b8; text-align: center;">Nenhum atraso</li>';
        }


        // Professor Revenue Breakdown
        const profRevenueList = document.getElementById('professor-revenue-list');
        if (profRevenueList) {
            profRevenueList.innerHTML = (data.por_professor || []).map(p => `
                <li style="display: flex; flex-direction: column; gap: 6px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: #f1f5f9; font-size: 1rem;">
                        <i class="fa-solid fa-chalkboard-user" style="color: #10b981;"></i>
                        <span>${p.nome || 'Sem Professor'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 20px; padding-left: 28px;">
                        <div style="flex: 1;">
                            <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 2px;">Professor Recebe</div>
                            <div style="font-size: 1.1rem; font-weight: 600; color: #10b981;">R$ ${parseFloat(p.total_professor || 0).toFixed(2)}</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 2px;">Igreja Recebe</div>
                            <div style="font-size: 1.1rem; font-weight: 600; color: #8b5cf6;">R$ ${parseFloat(p.total_igreja || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </li>
            `).join('') || '<li style="color: #94a3b8; text-align: center; padding: 20px;">Nenhum pagamento recebido este mês</li>';
        }
    } catch (e) { console.error("Dashboard error:", e); }
}

window.changeDashboardMonth = (offset) => {
    const input = document.getElementById('dashboard-month');
    if (!input || !input.value) return;

    // input.value is "YYYY-MM"
    const [year, month] = input.value.split('-').map(Number);
    // Create date for 1st of that month (Use local or UTC? Local is fine for month arithmetic usually if middle of day used, 
    // but strict YYYY-MM math is safer)
    
    // Math way:
    let newMonth = month + offset;
    let newYear = year;

    while (newMonth > 12) {
        newMonth -= 12;
        newYear++;
    }
    while (newMonth < 1) {
        newMonth += 12;
        newYear--;
    }

    const fmtMonth = String(newMonth).padStart(2, '0');
    input.value = `${newYear}-${fmtMonth}`;
    
    fetchDashboardData();
};

window.changeBillingMonth = (offset) => {
    const input = document.getElementById('billing-month');
    if (!input || !input.value) return;

    // input.value is "YYYY-MM"
    const [year, month] = input.value.split('-').map(Number);
    
    // Math way:
    let newMonth = month + offset;
    let newYear = year;

    while (newMonth > 12) {
        newMonth -= 12;
        newYear++;
    }
    while (newMonth < 1) {
        newMonth += 12;
        newYear--;
    }

    const fmtMonth = String(newMonth).padStart(2, '0');
    input.value = `${newYear}-${fmtMonth}`;
    
    fetchBilling();
};

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
    const profSelect = document.getElementById('matricula-professor');
    const courseSelect = document.getElementById('matricula-course');

    // Populate Matricula Modal Selects
    if (profSelect) {
        profSelect.innerHTML = '<option value="">Selecione...</option>' +
            professors.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    }

    if (courseSelect) {
        courseSelect.innerHTML = '<option value="">Selecione...</option>' +
            courses.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    }
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
                    <span class="tag-pill">${c.cursos_nomes || '-'}</span>
                </div>

                <div class="cell-info">
                    <span class="value-highlight">R$ ${parseFloat(c.total_valor || 0).toFixed(2)}</span>
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

    // Set editing ID BEFORE opening modal so the modal logic can enable the button
    editingClientId = id;

    // Open Modal via global helper - this will enable the matricula button
    if (window.openClientModal) window.openClientModal('Editar Cliente');

    // Populate fields with client data
    document.getElementById('client-name').value = client.nome || '';
    document.getElementById('client-address').value = client.endereco || '';
    document.getElementById('client-phone').value = client.whatsapp || '';
    
    // Note: Legacy financial fields (due day, standard value) are now handled via Matriculas
    // and do not exist in the main client form anymore.

    // Show actions
    document.getElementById('btn-pause-client').style.display = 'flex';
    document.getElementById('btn-delete-client').style.display = 'flex';

    // Load matriculas for this client
    if (typeof renderMatriculasList === 'function') {
        renderMatriculasList(id);
    }

    // Store original values (Legacy: kept for reference if needed, but logic moved to matriculas)
    window.originalClientValues = {};
};

window.openClientModal = (title) => {
    // Helper to reset and open
    const modal = document.getElementById('client-modal');
    const header = document.querySelector('#client-modal h3');
    if (header) header.innerText = title || 'Novo Cliente';

    // Handle Matricula/Enrollment Logic
    const btnAddMatricula = document.getElementById('btn-open-matricula-modal');
    const listContainer = document.getElementById('enrollments-list');

    if (title === 'Cadastrar Novo Cliente') {
        // Reset form if new
        document.getElementById('form-client').reset();
        editingClientId = null;
        
        // Hide Actions
        document.getElementById('btn-pause-client').style.display = 'none';
        document.getElementById('btn-delete-client').style.display = 'none';
        
        // Disable Matricula Adding
        if (btnAddMatricula) {
            btnAddMatricula.disabled = true;
            btnAddMatricula.style.opacity = '0.5';
            btnAddMatricula.style.cursor = 'not-allowed';
            // Show the warning text
            const warningSpan = btnAddMatricula.querySelector('span');
            if (warningSpan) warningSpan.style.display = 'inline';
        }
        if (listContainer) {
            listContainer.innerHTML = '<div style="text-align: center; padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: 8px; color: #94a3b8;">Salve o cliente primeiro para adicionar matrículas.</div>';
        }

        window.originalClientValues = null;
    } else {
        // Editing Mode
        if (btnAddMatricula) {
            btnAddMatricula.disabled = false;
            btnAddMatricula.style.opacity = '1';
            btnAddMatricula.style.cursor = 'pointer';
            // Hide the warning text in edit mode
            const warningSpan = btnAddMatricula.querySelector('span');
            if (warningSpan) warningSpan.style.display = 'none';
        }
        // Load Enrollments
        if (typeof renderMatriculasList === 'function' && editingClientId) {
            renderMatriculasList(editingClientId);
        }
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

document.getElementById('client-search').addEventListener('input', (e) => {
    filterClients(e.target.value);
});

// Dashboard Filter
const dashboardFilter = document.getElementById('dashboard-month-filter');
if (dashboardFilter) {
    dashboardFilter.addEventListener('change', () => fetchDashboard());
}

// Submit Form
document.getElementById('form-client').addEventListener('submit', async (e) => {
    e.preventDefault();

    const clientData = {
        nome: document.getElementById('client-name').value,
        endereco: document.getElementById('client-address').value,
        whatsapp: document.getElementById('client-phone').value,
        // Legacy fields - sending defaults to satisfy backend if needed, 
        // but real data is now in Matriculas
        valor_padrao: 0,
        dia_vencimento: 10,
        professor_id: null,
        curso_id: null,
        valor_professor: 0,
        valor_igreja: 0
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
            // Toast logic simplified (removed revenue check since fields are gone)
            showToast(editingClientId ? 'Cliente atualizado!' : 'Cliente cadastrado!');

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

            // Explicitly close modal
            const modal = document.getElementById('client-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none'; // Force hide
            }
            editingClientId = null; // Clear ID

            // Reset form
            document.getElementById('form-client').reset();

            await fetchClients();
            fetchDashboard();
        } else {
            showToast('Erro ao salvar.', true);
        }
    } catch (error) {
        console.error(error);
        showToast('Erro de conexão', true);
    }
});
function renderBillingTable(data = billingData) {
    const tbody = document.getElementById('billing-list');
    if (!tbody) return; // Exit if element doesn't exist
    tbody.innerHTML = '';

    data.forEach(item => {
        const isLate = item.status === 'ATRASADO';
        const isPaid = item.status === 'PAGO';
        const colorClass = isPaid ? 'text-success' : (isLate ? 'text-danger' : '');

        // Calculate default split if not set
        const valorTotal = parseFloat(item.valor_cobrado) || 0;
        const valorProf = item.valor_professor_recebido !== null ? parseFloat(item.valor_professor_recebido) : Math.min(100, valorTotal);
        const valorIgreja = item.valor_igreja_recebido !== null ? parseFloat(item.valor_igreja_recebido) : (valorTotal - valorProf);
        
        const valColor = valorTotal <= 0 ? '#ef4444' : '#ffffff';

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
                        <!-- Action Trio (Merged Buttons) -->
                        <div class="status-actions" style="display:flex; gap:8px;">
                            <div class="msg-check ${item.msg_lembrete_enviada ? 'checked' : ''} check-lembrete" 
                                 onclick="handleActionClick(${item.id}, 'lembrete', ${!!item.msg_lembrete_enviada})"
                                 title="Lembrete">
                                <i class="fa-regular fa-calendar"></i>
                            </div>
                            
                            <div class="msg-check ${item.msg_vencimento_enviada ? 'checked' : ''} check-hoje" 
                                 onclick="handleActionClick(${item.id}, 'vence_hoje', ${!!item.msg_vencimento_enviada})"
                                 title="Vence Hoje">
                                <i class="fa-solid fa-bell"></i>
                            </div>
                            
                            <div class="msg-check ${item.msg_atraso_enviada ? 'checked' : ''} check-atraso" 
                                 onclick="handleActionClick(${item.id}, 'em_atraso', ${!!item.msg_atraso_enviada})"
                                 title="Atraso">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                            </div>
                        </div>
                        
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
        // Refresh triggers
        const refreshFields = [
            'status', 'data_pagamento', 'valor_cobrado', 
            'valor_professor_recebido', 'valor_igreja_recebido',
            'msg_lembrete_enviada', 'msg_vencimento_enviada', 'msg_atraso_enviada'
        ];
        
        if (refreshFields.includes(field)) {
            // For message status, we only strictly need billing, but dashboard is safe too
            fetchBilling(); 
            if (!field.startsWith('msg_')) fetchDashboard();
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
        try {
            const payload = { status: newStatus };

            if (isPaying) {
                const today = new Date().toISOString().split('T')[0];
                payload.data_pagamento = today;

                // Capture current split values from UI to save them definitively
                const profInput = document.getElementById(`prof-val-${id}`);
                const churchInput = document.getElementById(`igreja-${id}`);
                
                if (profInput && churchInput) {
                    payload.valor_professor_recebido = parseFloat(profInput.value) || 0;
                    payload.valor_igreja_recebido = parseFloat(churchInput.value) || 0;
                }
            } else {
                payload.data_pagamento = null;
                // Optional: clear split values when unpaying? Or keep them?
                // Keeping them is safer for history, but maybe NULLing them is cleaner?
                // Left alone for now (they stay in DB but status is NOT PAGO so they are ignored by dashboard query)
            }

            const res = await fetch(`${API_URL}/pagamentos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast(isPaying ? 'Pagamento confirmado!' : 'Pagamento desfeito!');
                fetchBilling(); 
                fetchDashboard();
            } else {
                showToast('Erro ao atualizar status', true);
            }
        } catch (e) {
            console.error(e);
            showToast('Erro de conexão', true);
        }
    });
};

// Toggle Message Status Manually
window.toggleMsgStatus = async (id, field, value) => {
    // Prevent event bubbling if necessary (though divs are separate)
    await window.updatePayment(id, field, value);
    // UI update is handled by updatePayment calling fetchBilling
};

// Smart Action Handler
window.handleActionClick = (id, type, isChecked) => {
    if (isChecked) {
        // If checked, toggle OFF
        let field = null;
        if (type === 'lembrete') field = 'msg_lembrete_enviada';
        if (type === 'vence_hoje') field = 'msg_vencimento_enviada';
        if (type === 'em_atraso') field = 'msg_atraso_enviada';
        
        if (field) {
            // Also sync siblings? User didn't strictly say uncheck all, but implied behavior consistency.
            // Let's uncheck ONLY this one for safety, or use the bulk logic if we want to keep them in sync.
            // Given "Daniela" case, we probably want to uncheck all if we check all.
            // Let's try single uncheck first to avoid accidents, or bulk?
            // "todos eles mesmo com um curso acontece o mesmo DA BORDA COLORIDA" implies visual sync.
             window.toggleMsgStatus(id, field, false);
        }
    } else {
        // If unchecked, Send Message (Start Flow)
        window.sendWhatsappDirect(id, type);
    }
};

// WhatsApp Direct Send (With Aggregation & Preview)
// WhatsApp Direct Send (With Aggregation & Preview)
window.sendWhatsappDirect = async (id, type) => {
    try {
        const item = billingData.find(i => i.id === id);
        if (!item) {
            showToast('Erro: Cliente não encontrado', true);
            return;
        }

        // --- Aggregation Logic (Calculate First) ---
        // Find other unpaid items for this client in the same month/view
        const sameClientItems = billingData.filter(i => 
            i.cliente_id === item.cliente_id && 
            i.status !== 'PAGO' && 
            i.data_vencimento.slice(0, 7) === item.data_vencimento.slice(0, 7) // Same YYYY-MM
        );

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
                setTimeout(fetchBilling, 2000); 
            });
        }

        const nome = item.nome.split(' ')[0];
        const vencimento = formatDate(item.data_vencimento);
        const pixChave = '47773105000147';
        const pixCopiaCola = '00020126360014BR.GOV.BCB.PIX0114477731050001475204000053039865802BR5901N6001C62090505Aulas63043954';

        // --- Unified List Construction (Always use List) ---
        let total = 0;
        let coursesList = '*Cursos:*\n';
        
        sameClientItems.forEach(i => {
            const val = parseFloat(i.valor_cobrado || 0);
            total += val;
            const cName = i.nome_curso || 'Curso';
            coursesList += `${cName} - R$ ${val.toFixed(2).replace('.', ',')}\n`;
        });
        const totalFormatted = total.toFixed(2).replace('.', ',');

        let statusText = '';
        if (type === 'atraso') {
            statusText = `constam pendentes em nosso sistema.`;
        } else if (type === 'vence_hoje') {
            statusText = `vencem *HOJE* (${vencimento}).`;
        } else {
            // Lembrete
            statusText = `vencem dia *${vencimento}*.\nCaso já tenha efetuado o pagamento, desconsidere.`;
        }
        
        const msg = `Oi ${nome}, tudo bem? Graça e paz!
Mauricio aqui :-)

Passando para te lembrar das suas mensalidades:

${coursesList}
*Total - R$ ${totalFormatted}*

${statusText}

Sempre adicionar a chave pix, e uma atenção:
Enviar comprovante de pagamento assim que fizer o pagamento.

Chave Pix: ${pixChave}

Pix Copia-e-cola:
${pixCopiaCola}`;

        // Direct Open (No Modal as requested)
        let phone = (item.whatsapp || '').replace(/\D/g, '');
        if (!phone.startsWith('55') && phone.length > 9) phone = '55' + phone;
        const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');

        showToast('Abrindo WhatsApp...', false);
    } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error);
        showToast('Erro ao gerar mensagem: ' + error.message, true);
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

    // Note: window.openClientModal is defined earlier in the file (around line 483)
    // with full matricula/enrollment logic. Do not redefine it here.

    // Initialize WhatsApp Modal
    setupModal(
        'whatsapp-modal',
        null,
        'btn-close-modal', // Corrected ID from HTML
        null
    );

    // Initialize Matricula Modal
    const matriculaModalCtrl = setupModal(
        'matricula-modal',
        'btn-open-matricula-modal',
        'btn-close-matricula-modal',
        'btn-cancel-matricula-modal',
        () => {
            // onOpen: Reset for new enrollment
            document.getElementById('form-matricula').reset();
            document.getElementById('matricula-id').value = '';
            
            // Set title to "Vincular Curso" for new enrollment
            const modalTitle = document.querySelector('#matricula-modal h3');
            if (modalTitle) modalTitle.textContent = 'Vincular Curso';
            
            // Remove inline display style to allow modal to show
            const modal = document.getElementById('matricula-modal');
            modal.style.display = 'flex';
            
            // Check if we have a client context
            if (!editingClientId) {
                showToast('Erro: Cliente não identificado', true);
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        },
        () => {
            // onClose: Clean up
            document.getElementById('form-matricula').reset();
            document.getElementById('matricula-id').value = '';
            const modal = document.getElementById('matricula-modal');
            modal.style.display = 'none'; // Ensure inline style is removed
        }
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

    // --- Course Selection Logic (Matricula Modal) ---
    const matCourseSelect = document.getElementById('matricula-course');
    if (matCourseSelect) {
        matCourseSelect.addEventListener('change', (e) => {
            const courseId = parseInt(e.target.value);
            if (!courseId) return;

            const course = courses.find(c => c.id === courseId);
            if (course) {
                // Auto-fill value
                document.getElementById('matricula-value').value = parseFloat(course.mensalidade_padrao).toFixed(2);
                
                // Trigger recalc of revenue split (Matricula specific)
                calculateMatriculaSplit();
            }
        });
    }

    // Auto-calc split on value change
    const matValueInput = document.getElementById('matricula-value');
    if (matValueInput) {
        matValueInput.addEventListener('change', calculateMatriculaSplit);
    }
    const matProfValueInput = document.getElementById('matricula-valor-professor');
    if (matProfValueInput) {
        matProfValueInput.addEventListener('change', calculateMatriculaSplit);
    }

    // --- Course Selection Logic ---
    const clientCourseSelect = document.getElementById('client-course');
    if (clientCourseSelect) {
        clientCourseSelect.addEventListener('change', (e) => {
            const courseId = parseInt(e.target.value);
            if (!courseId) return;

            const course = courses.find(c => c.id === courseId);
            if (course) {
                // Auto-fill value
                document.getElementById('client-value').value = parseFloat(course.mensalidade_padrao).toFixed(2);
                
                // Trigger recalc of revenue split
                calculateRevenueSplit();
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

    // Add click handlers for sidebar navigation
    document.querySelectorAll('.sidebar a[data-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            if (target) {
                window.location.hash = '#' + target;
            }
        });
    });

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
    // Just trigger the church portion calculation based on current values
    calculateChurchPortion();
};

window.calculateChurchPortion = () => {
    const totalValue = parseFloat(document.getElementById('client-value').value) || 0;
    const professorValue = parseFloat(document.getElementById('client-valor-professor').value) || 0;
    const churchValue = document.getElementById('client-valor-igreja');

    const churchPortion = totalValue - professorValue;
    churchValue.value = churchPortion.toFixed(2);

    if (churchPortion < 0) {
        // Optional: warn user but don't force reset immediately to allow typing
        churchValue.style.color = '#ef4444'; // Red
    } else {
        churchValue.style.color = 'inherit';
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

// Change Dashboard Month
window.changeMonth = (delta) => {
    const input = document.getElementById('dashboard-month-filter');
    if (!input.value) return;

    // Parse current YYYY-MM
    const [year, month] = input.value.split('-').map(Number);

    // Create date (day 1 to avoid overflow issues)
    const date = new Date(year, month - 1 + delta, 1);

    // Format back to YYYY-MM
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');

    input.value = `${newYear}-${newMonth}`;

    // Trigger refresh
    fetchDashboard();
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

// --- MULTI-MATRICULA MANAGEMENT ---

window.renderMatriculasList = async (clientId) => {
    const list = document.getElementById('enrollments-list');
    if (!list) return;
    
    list.innerHTML = '<div style="text-align: center; color: #94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</div>';

    try {
        const res = await fetch(`${API_URL}/matriculas/${clientId}`);
        const matriculas = await res.json();

        if (matriculas.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: 8px; color: #94a3b8;">Nenhum curso vinculado.</div>';
            return;
        }

        list.innerHTML = matriculas.map(m => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="font-weight: 600; color: white;">${m.nome_curso || 'Curso desconhecido'}</div>
                    <div style="font-size: 0.85rem; color: #94a3b8;">Prof. ${m.nome_professor || 'N/A'}</div>
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 0.2rem;">
                        Venc: Dia ${m.dia_vencimento} • <span style="color: #4ade80;">R$ ${parseFloat(m.valor_mensalidade).toFixed(2)}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button type="button" class="btn-icon-small" onclick='editMatricula(${JSON.stringify(m).replace(/'/g, "&#39;")})' title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" class="btn-icon-small text-danger" onclick="deleteMatricula(${m.id})" title="Remover">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error(err);
        list.innerHTML = '<div style="color: #ef4444; text-align: center;">Erro ao carregar matrículas.</div>';
    }
};

window.calculateMatriculaSplit = () => {
    const total = parseFloat(document.getElementById('matricula-value').value) || 0;
    const prof = parseFloat(document.getElementById('matricula-valor-professor').value) || 0;
    const churchInput = document.getElementById('matricula-valor-igreja');

    const church = total - prof;
    churchInput.value = church.toFixed(2);
    
    if (church < 0) churchInput.style.color = '#ef4444';
    else churchInput.style.color = 'inherit';
};

window.handleMatriculaSubmit = async (e) => {
    e.preventDefault();
    if (!editingClientId) return;

    const id = document.getElementById('matricula-id').value;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/matriculas/${id}` : `${API_URL}/matriculas`;

    const valorMensalidade = document.getElementById('matricula-value').value;
    const diaVencimento = document.getElementById('matricula-due-day').value;
    const valorProfessor = document.getElementById('matricula-valor-professor').value;
    const valorIgreja = document.getElementById('matricula-valor-igreja').value;

    if (!valorMensalidade || !diaVencimento || !valorProfessor || !valorIgreja) {
        showToast('Preencha todos os campos financeiros!', true);
        return;
    }

    const body = {
        cliente_id: editingClientId,
        curso_id: document.getElementById('matricula-course').value,
        professor_id: document.getElementById('matricula-professor').value,
        dia_vencimento: parseInt(diaVencimento),
        valor_mensalidade: parseFloat(valorMensalidade),
        valor_professor: parseFloat(valorProfessor),
        valor_igreja: parseFloat(valorIgreja)
    };

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            showToast('Vínculo salvo com sucesso!');
            const modal = document.getElementById('matricula-modal');
            modal.classList.add('hidden');
            modal.style.display = 'none'; // Fix: Remove inline style
            renderMatriculasList(editingClientId); // Refresh List
            fetchClients(); // Refresh Client List (Dashboard)
            // Ideally trigger billing refresh if needed
        } else {
            showToast('Erro ao salvar vínculo.', true);
        }
    } catch (err) {
        console.error(err);
        showToast('Erro de conexão.', true);
    }
};

window.editMatricula = (m) => {
    // Populate Modal
    document.getElementById('matricula-id').value = m.id;
    document.getElementById('matricula-course').value = m.curso_id;
    document.getElementById('matricula-professor').value = m.professor_id;
    document.getElementById('matricula-due-day').value = m.dia_vencimento;
    document.getElementById('matricula-value').value = m.valor_mensalidade;
    document.getElementById('matricula-valor-professor').value = m.valor_professor;
    document.getElementById('matricula-valor-igreja').value = m.valor_igreja;
    
    document.querySelector('#matricula-modal h3').innerText = 'Editar Matrícula';
    
    // Open Modal
    const modal = document.getElementById('matricula-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
};

window.deleteMatricula = async (id) => {
    if (!confirm('Remover este curso do aluno?')) return;
    try {
        await fetch(`${API_URL}/matriculas/${id}`, { method: 'DELETE' });
        renderMatriculasList(editingClientId);
        fetchClients();
        fetchBilling(); // Refresh billing to remove unpaid items
        showToast('Curso excluído.');
    } catch (err) {
        console.error(err);
        showToast('Erro ao excluir.', true);
    }
};

// --- Combined Search & Filter for Billing ---
window.filterBilling = () => {
    const statusFilter = document.getElementById('billing-status-filter').value;
    const searchTerm = document.getElementById('billing-search').value.toLowerCase().trim();

    const filtered = billingData.filter(item => {
        // Status Check
        const statusMatch = (statusFilter === 'all') || (item.status === statusFilter);

        // Search Check (Name or Course)
        const name = (item.nome || '').toLowerCase();
        const course = (item.nome_curso || '').toLowerCase();
        const searchMatch = !searchTerm || name.includes(searchTerm) || course.includes(searchTerm);

        return statusMatch && searchMatch;
    });

    renderBillingTable(filtered);
};

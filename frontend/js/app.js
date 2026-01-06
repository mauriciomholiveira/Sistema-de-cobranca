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

    // Setup Listeners FIRST
    setupEventListeners();

    try {
        await Promise.all([
            fetchDashboard(),
            fetchResources(),
            fetchClients()
        ]);

        // Hash Logic handles the storage/defaults naturally now
        if (!window.location.hash) {
            window.location.hash = '#dashboard-section';
        }
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
    renderBillingTable();
}

// --- Renderers ---
function renderManagementLists() {
    // Professors
    document.getElementById('professors-list').innerHTML = professors.map(p => `
        <li>${p.nome}</li>
    `).join('');

    // Courses
    document.getElementById('courses-list').innerHTML = courses.map(c => `
        <li>
            <span>${c.nome}</span>
            <small>R$ ${parseFloat(c.mensalidade_padrao || 0).toFixed(2)}</small>
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
};

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
        curso_id: document.getElementById('client-course').value || null
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
            showToast(editingClientId ? 'Cliente atualizado!' : 'Cliente cadastrado!');

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
function renderBillingTable() {
    const tbody = document.getElementById('billing-list');
    tbody.innerHTML = '';

    billingData.forEach(item => {
        const isLate = item.status === 'ATRASADO';
        const isPaid = item.status === 'PAGO';
        const colorClass = isPaid ? 'text-success' : (isLate ? 'text-danger' : '');

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
                <td>
                    <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
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
            if (!nome) return;
            await fetch(`${API_URL}/professores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome })
            });
            document.getElementById('new-prof-name').value = '';
            fetchResources();
        });
    }

    const btnAddCourse = document.getElementById('btn-add-course');
    if (btnAddCourse) {
        btnAddCourse.addEventListener('click', async () => {
            const nome = document.getElementById('new-course-name').value;
            const valor = document.getElementById('new-course-value').value;
            if (!nome) return;
            await fetch(`${API_URL}/cursos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, mensalidade_padrao: valor || 0 })
            });
            document.getElementById('new-course-name').value = '';
            document.getElementById('new-course-value').value = '';
            fetchResources();
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

    // Initial Route (Run once, small delay to ensure DOM is ready)
    setTimeout(handleRouting, 50);

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

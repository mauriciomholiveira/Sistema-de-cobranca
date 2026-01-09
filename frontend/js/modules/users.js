import { API_URL } from './config.js';
import { showToast } from './utils.js';

export async function fetchUsers() {
    try {
        const res = await fetch(`${API_URL}/users`);
        if (!res.ok) throw new Error('Erro ao buscar usuários');
        const users = await res.json();
        renderUsers(users);
    } catch (err) {
        console.error(err);
        showToast('Erro ao carregar usuários', 'danger');
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        // Show Name if available, otherwise Email
        const displayName = user.nome ? `${user.nome} <br><small style="color:#94a3b8">${user.email}</small>` : user.email;
        
        tr.innerHTML = `
            <td>${displayName}</td>
            <td><span class="status-badge ${user.role === 'ADMIN' ? 'status-paid' : (user.role === 'OWNER' ? 'status-blue' : 'status-pending')}">${user.role}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick='window.editUser(${JSON.stringify(user)})'>
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    ${user.role !== 'OWNER' ? `
                    <button class="btn-icon" onclick="window.deleteUser('${user.id}')" style="color: #ef4444;">
                        <i class="fa-solid fa-trash"></i>
                    </button>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export function openUserModal(user = null) {
    // Determine if we are editing or creating based on if 'user' object is passed or if it's an ID (legacy)
    // The previous code passed specific args. Now we pass the full object if editing.
    // However, window.editUser might pass object now.
    
    // Reset Form
    document.getElementById('form-user').reset();
    document.getElementById('user-id').value = '';
    
    // Default Permissions
    document.querySelectorAll('input[name="menu_permission"]').forEach(cb => cb.checked = false);

    // Restore Permissions Group Visibility
    const permGroup = document.getElementById('user-permissions-group');
    if (permGroup) permGroup.style.display = 'block'; // Ensure visible

    if (user && typeof user === 'object') {
        // Edit Mode
        document.getElementById('user-id').value = user.id;
        document.getElementById('user-email').value = user.email || '';
        document.getElementById('user-name').value = user.nome || '';
        document.getElementById('user-phone').value = user.telefone || '';
        document.getElementById('user-cpf').value = user.cpf || '';
        
        if (user.data_nascimento) {
            document.getElementById('user-dob').value = user.data_nascimento.split('T')[0];
        }

        document.getElementById('user-role').value = user.role || 'VIEWER';
        
        // Permissions
        if (user.permissions && Array.isArray(user.permissions)) {
            user.permissions.forEach(perm => {
                const cb = document.querySelector(`input[name="menu_permission"][value="${perm}"]`);
                if (cb) cb.checked = true;
            });
        }

        document.getElementById('user-modal-title').innerText = 'Editar Usuário';
    } else {
        // New Mode
        document.getElementById('user-role').value = 'VIEWER';
        document.getElementById('user-modal-title').innerText = 'Novo Usuário';
    }
    
    // Toggle permissions visibility logic
    togglePermissionsCheckboxes();

    // UX Protection: Prevent User from changing their own role
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const roleSelect = document.getElementById('user-role');
    
    // Reset previous disabled state/message
    roleSelect.disabled = false;
    const roleWarning = document.getElementById('role-warning-msg');
    if (roleWarning) roleWarning.remove();

    if (user && user.id == currentUser.id) {
        roleSelect.disabled = true;
        roleSelect.title = "Você não pode alterar seu próprio nível de acesso.";
        
        const small = document.createElement('small');
        small.id = 'role-warning-msg';
        small.style.color = '#f59e0b';
        small.innerText = ' (Você não pode alterar seu próprio nível)';
        roleSelect.parentNode.appendChild(small);
    }

    document.getElementById('user-modal').classList.remove('hidden');
    document.getElementById('user-modal').style.display = 'flex';
}

// Special mode for Professor Access
window.openUserModalForProfessor = function(professor) {
    document.getElementById('user-id').value = ''; // New User
    document.getElementById('user-professor-id').value = professor.id; // Link!

    document.getElementById('user-email').value = professor.email || '';
    document.getElementById('user-name').value = professor.nome || '';
    document.getElementById('user-phone').value = professor.telefone || '';
    document.getElementById('user-cpf').value = professor.cpf || '';
    document.getElementById('user-dob').value = '';
    
    document.getElementById('user-role').value = 'PROFESSOR';
    
    document.getElementById('user-password').value = '';
    document.getElementById('user-confirm-password').value = '';

    // Uncheck permissions (managed by Role/Dashboard logic)
    document.querySelectorAll('input[name="menu_permission"]').forEach(cb => {
        cb.checked = false; // Uncheck visual
        if (cb.value === 'clientes' || cb.value === 'dashboard') cb.checked = true; // Auto select basic view permissions?
        // Actually user says "only sees his own", so maybe dashboard is enough. Let's keep dashboard.
    });
    
    // Hide Permissions Group to avoid confusion
    const permGroup = document.getElementById('user-permissions-group');
    if (permGroup) permGroup.style.display = 'none';

    const roleSelect = document.getElementById('user-role');
    roleSelect.disabled = true; // Lock role
    
    togglePermissionsCheckboxes(); 

    document.getElementById('user-modal').classList.remove('hidden');
    document.getElementById('user-modal').style.display = 'flex';
}

export function togglePermissionsCheckboxes() {
    const role = document.getElementById('user-role').value;
    const container = document.getElementById('permissions-container');
    const inputs = container.querySelectorAll('input');

    if (role === 'OWNER') {
        // Owner has all permissions implicitly, maybe disable checkboxes and check all?
        // Or just hide? User requested: "dono nao tem como ele remover os acessos dele"
        inputs.forEach(input => {
            input.checked = true;
            input.disabled = true;
        });
        container.style.opacity = '0.5';
    } else {
        inputs.forEach(input => {
            input.disabled = false;
        });
        container.style.opacity = '1';
    }
}

export async function handleUserSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('user-id').value;
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    const confirmPassword = document.getElementById('user-confirm-password').value;
    const role = document.getElementById('user-role').value;
    const nome = document.getElementById('user-name').value;
    const telefone = document.getElementById('user-phone').value;
    const cpf = document.getElementById('user-cpf').value;
    const data_nascimento = document.getElementById('user-dob').value;

    // Validate Password
    if (password || confirmPassword) {
        if (password !== confirmPassword) {
            showToast('As senhas não conferem!', true);
            return;
        }
        if (!id && !password) {
            showToast('Senha é obrigatória para novos usuários!', true);
            return;
        }
    }

    // Collect Permissions
    const permissions = [];
    document.querySelectorAll('input[name="menu_permission"]:checked').forEach(cb => {
        permissions.push(cb.value);
    });

    // If OWNER, ensure all permissions are set (backend enforces logic too, but frontend helps)
    if (role === 'OWNER') {
        const allPerms = ['dashboard', 'cobranca', 'clientes', 'professores', 'cursos', 'financeiro'];
        // Merge to ensure no missing
        allPerms.forEach(p => {
             if (!permissions.includes(p)) permissions.push(p);
        });
    }

    const payload = { 
        email, 
        password, 
        role, 
        nome, 
        telefone, 
        cpf, 
        data_nascimento,
        permissions 
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/users/${id}` : `${API_URL}/users`;

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Erro ao salvar usuário');
        }

        showToast('Usuário salvo com sucesso!');
        document.getElementById('user-modal').classList.add('hidden');
        document.getElementById('user-modal').style.display = 'none';
        fetchUsers();
    } catch (err) {
        console.error(err);
        showToast(err.message, true);
    }
}

export async function deleteUser(id) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
        const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
        if (!res.ok) {
             const data = await res.json();
             throw new Error(data.error || 'Erro ao excluir');
        }
        showToast('Usuário excluído');
        fetchUsers();
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

// Attach to window
window.openUserModal = openUserModal;
window.editUser = openUserModal; // Reuse openUserModal for editing
window.deleteUser = deleteUser;
window.handleUserSubmit = handleUserSubmit;
window.togglePermissionsCheckboxes = togglePermissionsCheckboxes;

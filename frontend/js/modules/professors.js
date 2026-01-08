import { API_URL, state } from './config.js';
import { showToast, closeModal } from './utils.js';

// --- Global Actions for Professor ---

export function openProfessorModal(id = null) {
    const modal = document.getElementById('professor-modal');
    if (!modal) return;

    if (id) {
        // Edit Mode
        const prof = state.professors.find(p => p.id === id);
        if (!prof) return;

        document.getElementById('prof-id').value = prof.id;
        document.getElementById('prof-nome').value = prof.nome;
        document.getElementById('prof-pix').value = prof.pix || '';
        document.getElementById('prof-cpf').value = prof.cpf || '';
        document.getElementById('prof-contato').value = prof.contato || '';
        document.getElementById('prof-endereco').value = prof.endereco || '';
        document.getElementById('prof-dados-bancarios').value = prof.dados_bancarios || '';
        
        document.querySelector('#professor-modal h3').innerText = 'Editar Professor';
    } else {
        // New Mode
        document.getElementById('form-professor').reset();
        document.getElementById('prof-id').value = '';
        document.querySelector('#professor-modal h3').innerText = 'Novo Professor';
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

export async function handleProfessorSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('prof-id').value;
    const body = {
        nome: document.getElementById('prof-nome').value,
        pix: document.getElementById('prof-pix').value,
        cpf: document.getElementById('prof-cpf').value,
        contato: document.getElementById('prof-contato').value,
        endereco: document.getElementById('prof-endereco').value,
        dados_bancarios: document.getElementById('prof-dados-bancarios').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/professores/${id}` : `${API_URL}/professores`;

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            showToast(id ? 'Professor atualizado!' : 'Professor cadastrado!');
            closeModal('professor-modal');
            // Refresh
            if (window.fetchResources) window.fetchResources(); 
        } else {
            showToast('Erro ao salvar.', true);
        }
    } catch (err) {
        console.error(err);
        showToast('Erro de conexão.', true);
    }
}

export async function deleteProfessor(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir o professor "${nome}"?`)) return;

    try {
        const res = await fetch(`${API_URL}/professores/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Professor excluído!');
            if (window.fetchResources) window.fetchResources();
        } else {
            showToast('Erro ao excluir (verifique se há vínculos).', true);
        }
    } catch (err) {
        console.error(err);
        showToast('Erro ao excluir.', true);
    }
}

// Attach to window
window.openProfessorModal = openProfessorModal;
window.handleProfessorSubmit = handleProfessorSubmit;
window.deleteProfessor = deleteProfessor;

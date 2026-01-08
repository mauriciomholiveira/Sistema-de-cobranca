import { API_URL, state } from './config.js';
import { showToast, closeModal } from './utils.js';

// --- Matricula Management ---

export async function renderMatriculasList(clientId) {
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
}

export function editMatricula(m) {
    document.getElementById('matricula-id').value = m.id;
    document.getElementById('matricula-course').value = m.curso_id;
    document.getElementById('matricula-professor').value = m.professor_id;
    document.getElementById('matricula-due-day').value = m.dia_vencimento;
    document.getElementById('matricula-value').value = m.valor_mensalidade;
    document.getElementById('matricula-valor-professor').value = m.valor_professor;
    document.getElementById('matricula-valor-igreja').value = m.valor_igreja;
    
    document.querySelector('#matricula-modal h3').innerText = 'Editar Matrícula';
    
    const modal = document.getElementById('matricula-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

export function openMatriculaModal() {
    // Reset Form
    document.getElementById('form-matricula').reset();
    document.getElementById('matricula-id').value = '';
    
    // Set Defaults
    document.getElementById('matricula-due-day').value = 10;
    
    document.querySelector('#matricula-modal h3').innerText = 'Vincular Curso';
    
    const modal = document.getElementById('matricula-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

export async function handleMatriculaSubmit(e) {
    e.preventDefault();
    if (!state.editingClientId) return;

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
        cliente_id: state.editingClientId,
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
            modal.style.display = 'none';
            renderMatriculasList(state.editingClientId);
            if (window.fetchClients) window.fetchClients();
        } else {
            showToast('Erro ao salvar vínculo.', true);
        }
    } catch (err) {
        console.error(err);
        showToast('Erro de conexão.', true);
    }
}

export async function deleteMatricula(id) {
    if (!confirm('Remover este curso do aluno?')) return;
    try {
        await fetch(`${API_URL}/matriculas/${id}`, { method: 'DELETE' });
        renderMatriculasList(state.editingClientId);
        if (window.fetchClients) window.fetchClients();
        if (window.fetchBilling) window.fetchBilling(); 
        showToast('Curso excluído.');
    } catch (err) {
        console.error(err);
        showToast('Erro ao excluir.', true);
    }
}

export function calculateMatriculaSplit() {
    const total = parseFloat(document.getElementById('matricula-value').value) || 0;
    const prof = parseFloat(document.getElementById('matricula-valor-professor').value) || 0;
    const churchInput = document.getElementById('matricula-valor-igreja');

    const church = total - prof;
    churchInput.value = church.toFixed(2);
    
    if (church < 0) churchInput.style.color = '#ef4444';
    else churchInput.style.color = 'inherit';
}

// Attach to window
window.renderMatriculasList = renderMatriculasList;
window.editMatricula = editMatricula;
window.openMatriculaModal = openMatriculaModal;
window.handleMatriculaSubmit = handleMatriculaSubmit;
window.deleteMatricula = deleteMatricula;
window.calculateMatriculaSplit = calculateMatriculaSplit;

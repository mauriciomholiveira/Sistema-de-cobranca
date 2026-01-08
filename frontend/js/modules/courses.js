import { API_URL, state } from './config.js';
import { showToast, closeModal } from './utils.js';

// --- Global Actions for Course ---

export function openCourseModal(id = null) {
    const modal = document.getElementById('course-modal');
    if (!modal) return;

    if (id) {
        // Edit Mode
        const course = state.courses.find(c => c.id === id);
        if (!course) return;

        document.getElementById('course-id').value = course.id;
        document.getElementById('course-nome').value = course.nome;
        document.getElementById('course-value').value = course.mensalidade_padrao;
        document.getElementById('course-active').checked = course.active;
        
        document.querySelector('#course-modal h3').innerText = 'Editar Curso';
    } else {
        // New Mode
        document.getElementById('form-course').reset();
        document.getElementById('course-id').value = '';
        document.getElementById('course-active').checked = true;
        document.querySelector('#course-modal h3').innerText = 'Novo Curso';
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

export async function handleCourseSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('course-id').value;
    const body = {
        nome: document.getElementById('course-nome').value,
        mensalidade_padrao: parseFloat(document.getElementById('course-value').value),
        active: document.getElementById('course-active').checked
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/cursos/${id}` : `${API_URL}/cursos`;

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            showToast(id ? 'Curso atualizado!' : 'Curso cadastrado!');
            closeModal('course-modal');
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

export async function deleteCourse(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir o curso "${nome}"?`)) return;

    try {
        const res = await fetch(`${API_URL}/cursos/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Curso excluído!');
            if (window.fetchResources) window.fetchResources();
        } else {
            showToast('Erro ao excluir (provavelmente tem alunos vinculados).', true);
        }
    } catch (err) {
        console.error(err);
        showToast('Erro ao excluir.', true);
    }
}

// Attach to window
window.openCourseModal = openCourseModal;
window.handleCourseSubmit = handleCourseSubmit;
window.deleteCourse = deleteCourse;

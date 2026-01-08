import { API_URL, state } from './config.js';
import { showToast, closeModal, openConfirmModal } from './utils.js';
import { fetchClients, filterClients, renderClients } from './clients.js';
import { fetchBilling, changeBillingMonth, applySorting, populateBillingProfessorFilter, filterBilling } from './billing.js';
import { fetchDashboard, changeDashboardMonth } from './dashboard.js';
import { openProfessorModal, handleProfessorSubmit, deleteProfessor } from './professors.js';
import { openCourseModal, handleCourseSubmit, deleteCourse } from './courses.js';
import { renderMatriculasList } from './matriculas.js';

// --- Initialization ---

async function init() {
    console.log("🚀 Main.js Init starting...");
    // Hide Modals
    ['whatsapp-modal', 'client-modal', 'confirm-modal', 'professor-modal', 'course-modal', 'matricula-modal'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    });

    // Initial Month
    const billInput = document.getElementById('billing-month');
    if (billInput) billInput.value = state.currentMonth;
    const dashInput = document.getElementById('dashboard-month');
    if (dashInput) dashInput.value = state.currentMonth;

    // Routing
    if (!window.location.hash) {
        window.location.hash = '#dashboard-section';
    }
    handleRouting();

    setupEventListeners();

    try {
        await Promise.all([
            fetchDashboard(),
            fetchResources(),
            fetchClients()
        ]);
    } catch (e) {
        console.error("Init failed:", e);
        showToast("Erro ao carregar dados iniciais.", true);
    }
}

// --- Resources (Professors, Courses, Templates) ---
// Kept in main or util? Since they are shared, let's keep fetchResources accessible.
window.fetchResources = async function() {
    try {
        const [resProfs, resCourses, resTempl] = await Promise.all([
            fetch(`${API_URL}/professores`),
            fetch(`${API_URL}/cursos`),
            fetch(`${API_URL}/templates`)
        ]);

        state.professors = resProfs.ok ? await resProfs.json() : [];
        state.courses = resCourses.ok ? await resCourses.json() : [];
        state.templates = resTempl.ok ? await resTempl.json() : [];

        renderManagementLists();
        updateFormSelects();
        populateBillingProfessorFilter();
        
        // Refresh filtering if needed
        filterBilling();

    } catch (e) { console.error("Resources error:", e); }
};

function renderManagementLists() {
    // Professors
    const pList = document.getElementById('professors-list');
    if (pList) {
        pList.innerHTML = state.professors.map(p => `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(30, 41, 59, 0.3); border-radius: 6px; margin-bottom: 0.5rem;">
                <div>
                    <strong>${p.nome}</strong>
                    ${p.pix ? `<br><small style="color: #94a3b8;">PIX: ${p.pix}</small>` : ''}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="openProfessorModal(${p.id})" class="btn-icon" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="deleteProfessor(${p.id}, '${p.nome}')" class="btn-icon btn-danger" title="Excluir">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </li>
        `).join('');
    }

    // Courses
    const cList = document.getElementById('courses-list');
    if (cList) {
        cList.innerHTML = state.courses.map(c => `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(30, 41, 59, 0.3); border-radius: 6px; margin-bottom: 0.5rem;">
                <div>
                    <strong>${c.nome}</strong>
                    <br><small style="color: #94a3b8;">R$ ${parseFloat(c.mensalidade_padrao).toFixed(2)}</small>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="openCourseModal(${c.id})" class="btn-icon">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="deleteCourse(${c.id}, '${c.nome}')" class="btn-icon btn-danger">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </li>
        `).join('');
    }
}

function updateFormSelects() {
    const profSelect = document.getElementById('matricula-professor');
    const courseSelect = document.getElementById('matricula-course');

    if (profSelect) {
        profSelect.innerHTML = '<option value="">Selecione...</option>' +
            state.professors.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    }

    if (courseSelect) {
        courseSelect.innerHTML = '<option value="">Selecione...</option>' +
            state.courses.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    }
}

// --- Navigation & Listeners ---

function handleRouting() {
    const hash = window.location.hash || '#dashboard-section';
    
    // Reset active states
    // Reset active states
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
        sec.style.opacity = '0'; 
    });

    // Activate Nav Link
    const link = document.querySelector(`.nav-links a[href="${hash}"]`);
    if (link) link.classList.add('active');

    // Activate Section
    const target = document.querySelector(hash);
    if (target) {
        target.style.display = 'block';
        // Trigger specific loads
        if (hash === '#billing-section') fetchBilling();
        if (hash === '#clients-section') fetchClients(); 
        if (hash === '#dashboard-section') fetchDashboard(); // Refresh stats
        
        requestAnimationFrame(() => {
            target.classList.add('active');
            target.style.opacity = '1';
        });
    }
}

function setupEventListeners() {
    // Nav Links
    window.addEventListener('hashchange', handleRouting);
    
    // Sort
    document.getElementById('sort-field')?.addEventListener('change', applySorting);
    document.getElementById('sort-order')?.addEventListener('change', applySorting);

    // New Client Button
    document.getElementById('btn-new-client')?.addEventListener('click', () => {
         if (window.openClientModal) window.openClientModal('Cadastrar Novo Cliente');
    });
    
    
    // Modals Close - Generic
    // Modals Close - Generic
    document.querySelectorAll('.modal .btn-secondary, .modal .close, .modal-overlay .btn-secondary, .modal-overlay .close').forEach(btn => {
        btn.onclick = () => {
            const modal = btn.closest('.modal') || btn.closest('.modal-overlay');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        };
    });

    window.onclick = (e) => {
        if (e.target.classList.contains('modal') || e.target.classList.contains('modal-overlay')) {
            e.target.classList.add('hidden');
            e.target.style.display = 'none';
        }
    };
    
    // Switch Management Tabs
    window.switchManagementTab = (tab) => {
        const tabProf = document.getElementById('tab-man-professors');
        const tabCourses = document.getElementById('tab-man-courses');
        const contentProf = document.getElementById('man-professors-content');
        const contentCourses = document.getElementById('man-courses-content');
        
        if (!tabProf || !tabCourses || !contentProf || !contentCourses) return;
        
        if (tab === 'professors') {
            tabProf.classList.add('active');
            tabCourses.classList.remove('active');
            contentProf.style.display = 'block';
            contentCourses.style.display = 'none';
        } else {
            tabProf.classList.remove('active');
            tabCourses.classList.add('active');
            contentProf.style.display = 'none';
            contentCourses.style.display = 'block';
        }
    };
}

// Start
document.addEventListener('DOMContentLoaded', init);

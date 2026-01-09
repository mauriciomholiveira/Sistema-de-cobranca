// Renderizar matrículas pendentes (para novos clientes)
function renderPendingEnrollments() {
    console.log('📋 Renderizando matrículas pendentes:', pendingEnrollments);
    const list = document.getElementById('enrollments-list');
    if (!list) {
        console.error('❌ Elemento enrollments-list não encontrado!');
        return;
    }
    
    if (pendingEnrollments.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: 8px; color: #94a3b8;">Nenhum curso vinculado ainda.</div>';
        return;
    }
    
    list.innerHTML = pendingEnrollments.map((m, index) => `
        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 1rem; display: flex; align-items: center; justify-content: space-between;">
            <div>
                <div style="font-weight: 600; color: white;">${m.nome_curso}</div>
                <div style="font-size: 0.85rem; color: #94a3b8;">Prof. ${m.nome_professor}</div>
                <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 0.2rem;">
                    Venc: Dia ${m.dia_vencimento} • <span style="color: #4ade80;">R$ ${m.valor_mensalidade.toFixed(2)}</span>
                </div>
            </div>
            <div>
                <button type="button" class="btn-icon-small text-danger" onclick="removePendingEnrollment(${index})" title="Remover">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

window.removePendingEnrollment = (index) => {
    pendingEnrollments.splice(index, 1);
    renderPendingEnrollments();
    showToast('Matrícula removida');
};

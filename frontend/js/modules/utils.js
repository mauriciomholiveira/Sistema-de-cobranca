// --- Utility Functions ---

export function showToast(message, isError = false) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

export function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Use UTC methods to avoid timezone shift if dateString is just YYYY-MM-DD
    // If it's specifically timezone aware, use local. 
    // Assuming YYYY-MM-DD strings from DB:
    if (dateString.length === 10) {
        const [y, m, d] = dateString.split('-');
        return `${d}/${m}/${y}`;
    }
    return date.toLocaleDateString('pt-BR');
}

export function formatPhone(phone) {
    if (!phone) return '-';
    let p = phone.replace(/\D/g, '');
    if (p.length > 11) p = p.slice(0, 11);
    
    if (p.length === 11) {
        return `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
    } else if (p.length === 10) {
        return `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}`;
    }
    return phone;
}

export function formatCurrency(value) {
    return `R$ ${parseFloat(value || 0).toFixed(2).replace('.', ',')}`;
}

// Modal Helpers
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none'; // Force hide
    }
}

export function openConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;

    modal.querySelector('h3').textContent = title;
    modal.querySelector('p').textContent = message;

    const btn = document.getElementById('btn-confirm-action');
    // Remove old listeners to avoid stacking
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.onclick = () => {
        onConfirm();
        closeModal('confirm-modal');
    };

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

// Attach to window for legacy onclick support
window.showToast = showToast;
window.formatDate = formatDate;
window.formatPhone = formatPhone;
window.formatCurrency = formatCurrency;
window.closeModal = closeModal;
window.openConfirmModal = openConfirmModal;

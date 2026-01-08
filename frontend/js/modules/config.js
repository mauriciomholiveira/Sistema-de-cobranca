export const API_URL = 'http://localhost:3000/api';

// --- State ---
// Using window global to maintain compatibility with legacy code if needed, 
// but ideally we should export these. For now, let's keep them as mutable exports 
// or attach to window for 'onclick' handlers to find them easily if they are referenced there.

// Ideally, state should be managed within modules.
// But valid "Global" state:
export const state = {
    clients: [],
    professors: [],
    courses: [],
    templates: [],
    billingData: [],
    currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
    editingClientId: null,
    filteredClients: [],
    originalClientValues: null
};

// Make state globally accessible for legacy compatibility
window.API_URL = API_URL;
window.state = state;
window.clients = state.clients;
window.professors = state.professors;
window.courses = state.courses;
window.templates = state.templates;
window.billingData = state.billingData;
window.currentMonth = state.currentMonth;

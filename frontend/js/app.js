/**
 * ============================================================
 * APP MODULE — Main application controller
 * ============================================================
 */

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (Auth.getToken()) {
        initApp();
    } else {
        showPage('auth');
    }

    // Set current date
    updateCurrentDate();
});

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    if (page === 'auth') {
        document.getElementById('auth-page').classList.add('active');
    } else {
        document.getElementById('app-page').classList.add('active');
    }
}

async function initApp() {
    showPage('app');

    // Set user info in sidebar
    const user = Auth.getUser();
    document.getElementById('user-name').textContent = user.fullName || 'User';
    document.getElementById('user-avatar').textContent = (user.fullName || 'U').charAt(0).toUpperCase();

    // Set current month/year in budget filters
    const now = new Date();
    document.getElementById('budget-month').value = now.getMonth() + 1;
    document.getElementById('budget-year').value = now.getFullYear();

    // Load categories first (needed for dropdowns)
    await loadCategories();

    // Load dashboard data
    navigateTo('dashboard');
}

function navigateTo(page) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');

    // Update sections
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${page}-section`).classList.add('active');

    // Update title
    const titles = { dashboard: 'Dashboard', transactions: 'Transactions', budgets: 'Budgets' };
    document.getElementById('current-page-title').textContent = titles[page] || page;

    // Load data for the page
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'transactions':
            loadTransactions();
            break;
        case 'budgets':
            loadBudgets();
            break;
    }

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
}

function updateCurrentDate() {
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }
});

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;

    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

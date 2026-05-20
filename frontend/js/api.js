/**
 * ============================================================
 * API MODULE — Handles all HTTP communication with the backend
 * ============================================================
 *
 * This module:
 * 1. Stores the JWT token
 * 2. Adds Authorization headers to all requests
 * 3. Handles JSON serialization/deserialization
 * 4. Provides clean methods for each API endpoint
 */

const API_BASE = 'http://localhost:8080/api';

// Store auth data in localStorage so it survives page refreshes
const Auth = {
    getToken: () => localStorage.getItem('fintrack_token'),
    setToken: (token) => localStorage.setItem('fintrack_token', token),
    getUser: () => JSON.parse(localStorage.getItem('fintrack_user') || '{}'),
    setUser: (user) => localStorage.setItem('fintrack_user', JSON.stringify(user)),
    clear: () => { localStorage.removeItem('fintrack_token'); localStorage.removeItem('fintrack_user'); }
};

/**
 * Base fetch wrapper — adds auth headers and handles errors
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add JWT token if available
    const token = Auth.getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        // Handle 401 Unauthorized — token expired or invalid
        if (response.status === 401) {
            Auth.clear();
            showPage('auth');
            showToast('Session expired. Please login again.', 'error');
            throw new Error('Unauthorized');
        }

        // Handle 204 No Content (successful delete)
        if (response.status === 204) return null;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        if (error.message === 'Failed to fetch') {
            showToast('Cannot connect to server. Is the backend running?', 'error');
        }
        throw error;
    }
}

// ==================== AUTH API ====================

const AuthAPI = {
    register: (data) => apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    login: (data) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
    })
};

// ==================== TRANSACTIONS API ====================

const TransactionsAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams();
        if (params.type) query.set('type', params.type);
        if (params.startDate) query.set('startDate', params.startDate);
        if (params.endDate) query.set('endDate', params.endDate);
        if (params.categoryId) query.set('categoryId', params.categoryId);
        const qs = query.toString();
        return apiRequest(`/transactions${qs ? '?' + qs : ''}`);
    },

    getById: (id) => apiRequest(`/transactions/${id}`),

    create: (data) => apiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    update: (id, data) => apiRequest(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    delete: (id) => apiRequest(`/transactions/${id}`, {
        method: 'DELETE'
    })
};

// ==================== CATEGORIES API ====================

const CategoriesAPI = {
    getAll: (type) => {
        const qs = type ? `?type=${type}` : '';
        return apiRequest(`/categories${qs}`);
    }
};

// ==================== BUDGETS API ====================

const BudgetsAPI = {
    getAll: (month, year) => {
        const params = new URLSearchParams();
        if (month) params.set('month', month);
        if (year) params.set('year', year);
        const qs = params.toString();
        return apiRequest(`/budgets${qs ? '?' + qs : ''}`);
    },

    create: (data) => apiRequest('/budgets', {
        method: 'POST',
        body: JSON.stringify(data)
    })
};

// ==================== DASHBOARD API ====================

const DashboardAPI = {
    getData: () => apiRequest('/dashboard')
};

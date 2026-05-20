/**
 * ============================================================
 * TRANSACTIONS MODULE — CRUD operations for transactions
 * ============================================================
 */

let allCategories = [];

async function loadCategories() {
    try {
        allCategories = await CategoriesAPI.getAll();
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

function loadCategoryOptions() {
    const type = document.getElementById('txn-type').value;
    const select = document.getElementById('txn-category');

    const filtered = allCategories.filter(c => c.type === type);
    select.innerHTML = filtered.map(c =>
        `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`
    ).join('');
}

function loadBudgetCategoryOptions() {
    const select = document.getElementById('budget-category');
    const expenseCategories = allCategories.filter(c => c.type === 'EXPENSE');
    select.innerHTML = expenseCategories.map(c =>
        `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`
    ).join('');
}

async function loadTransactions() {
    const type = document.getElementById('filter-type').value;
    const startDate = document.getElementById('filter-start').value;
    const endDate = document.getElementById('filter-end').value;

    try {
        const transactions = await TransactionsAPI.getAll({
            type: type || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined
        });

        renderTransactionsTable(transactions);
    } catch (error) {
        console.error('Failed to load transactions:', error);
    }
}

function renderTransactionsTable(transactions) {
    const tbody = document.getElementById('transactions-tbody');

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No transactions found</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        const date = new Date(t.transactionDate).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        const isExpense = t.type === 'EXPENSE';
        const sign = isExpense ? '-' : '+';
        const amountClass = isExpense ? 'expense' : 'income';
        const typeClass = isExpense ? 'expense' : 'income';

        return `
            <tr>
                <td>${date}</td>
                <td><span>${t.categoryIcon || ''}</span> ${t.categoryName}</td>
                <td>${t.description || '—'}</td>
                <td><span class="type-badge ${typeClass}">${t.type}</span></td>
                <td class="txn-amount ${amountClass}">${sign}₹${formatCurrency(t.amount)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-ghost btn-sm" onclick="editTransaction(${t.id})" title="Edit">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${t.id})" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openTransactionModal(editData = null) {
    const modal = document.getElementById('transaction-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('transaction-form');
    const editIdField = document.getElementById('txn-edit-id');

    form.reset();
    editIdField.value = '';

    if (editData) {
        title.textContent = 'Edit Transaction';
        document.getElementById('txn-type').value = editData.type;
        loadCategoryOptions();
        document.getElementById('txn-category').value = editData.categoryId;
        document.getElementById('txn-amount').value = editData.amount;
        document.getElementById('txn-date').value = editData.transactionDate;
        document.getElementById('txn-description').value = editData.description || '';
        editIdField.value = editData.id;
    } else {
        title.textContent = 'Add Transaction';
        document.getElementById('txn-date').value = new Date().toISOString().split('T')[0];
        loadCategoryOptions();
    }

    modal.classList.remove('hidden');
}

async function handleTransactionSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById('txn-submit-btn');
    setButtonLoading(btn, true);

    const editId = document.getElementById('txn-edit-id').value;
    const data = {
        categoryId: parseInt(document.getElementById('txn-category').value),
        amount: parseFloat(document.getElementById('txn-amount').value),
        type: document.getElementById('txn-type').value,
        description: document.getElementById('txn-description').value,
        transactionDate: document.getElementById('txn-date').value
    };

    try {
        if (editId) {
            await TransactionsAPI.update(parseInt(editId), data);
            showToast('Transaction updated!', 'success');
        } else {
            await TransactionsAPI.create(data);
            showToast('Transaction added!', 'success');
        }
        closeModal('transaction-modal');
        loadTransactions();
        loadDashboard();
    } catch (error) {
        showToast(error.message || 'Failed to save transaction', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

async function editTransaction(id) {
    try {
        const txn = await TransactionsAPI.getById(id);
        openTransactionModal(txn);
    } catch (error) {
        showToast('Failed to load transaction', 'error');
    }
}

async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
        await TransactionsAPI.delete(id);
        showToast('Transaction deleted', 'success');
        loadTransactions();
        loadDashboard();
    } catch (error) {
        showToast('Failed to delete transaction', 'error');
    }
}

function clearFilters() {
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-start').value = '';
    document.getElementById('filter-end').value = '';
    loadTransactions();
}

// ==================== BUDGETS ====================

async function loadBudgets() {
    const month = document.getElementById('budget-month').value;
    const year = document.getElementById('budget-year').value;

    try {
        const budgets = await BudgetsAPI.getAll(month, year);
        renderBudgetCards(budgets);
    } catch (error) {
        console.error('Failed to load budgets:', error);
    }
}

function renderBudgetCards(budgets) {
    const grid = document.getElementById('budgets-grid');

    if (!budgets || budgets.length === 0) {
        grid.innerHTML = '<p class="empty-state">No budgets set for this period. Click "Add Budget" to create one!</p>';
        return;
    }

    grid.innerHTML = budgets.map(b => {
        const pct = Math.min(b.percentage || 0, 100);
        const statusClass = b.overBudget ? 'danger' : (b.percentage || 0) > 75 ? 'warning' : 'safe';
        const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        return `
            <div class="card budget-card ${b.overBudget ? 'over-budget' : ''}">
                <div class="budget-card-header">
                    <div class="budget-card-category">
                        <span class="cat-icon">${b.categoryIcon || '📦'}</span>
                        ${b.categoryName}
                    </div>
                    <span class="budget-card-period">${months[b.month]} ${b.year}</span>
                </div>
                <div class="budget-card-amounts">
                    <span class="budget-card-spent" style="color: ${statusClass === 'danger' ? '#ef4444' : statusClass === 'warning' ? '#f59e0b' : '#10b981'}">
                        ₹${formatCurrency(b.spent || 0)} spent
                    </span>
                    <span class="budget-card-limit">of ₹${formatCurrency(b.amountLimit)}</span>
                </div>
                <div class="budget-card-progress">
                    <div class="budget-card-progress-bar ${statusClass}" style="width: ${pct}%; background: ${b.categoryColor || '#6366f1'}"></div>
                </div>
                <div class="budget-card-percentage" style="color: ${statusClass === 'danger' ? '#ef4444' : statusClass === 'warning' ? '#f59e0b' : '#10b981'}">
                    ${b.overBudget ? '⚠️ Over budget!' : `${(b.percentage || 0).toFixed(0)}% used`}
                </div>
            </div>
        `;
    }).join('');
}

function openBudgetModal() {
    loadBudgetCategoryOptions();
    document.getElementById('budget-form').reset();
    document.getElementById('budget-modal').classList.remove('hidden');
}

async function handleBudgetSubmit(event) {
    event.preventDefault();

    const month = document.getElementById('budget-month').value;
    const year = document.getElementById('budget-year').value;

    const data = {
        categoryId: parseInt(document.getElementById('budget-category').value),
        amountLimit: parseFloat(document.getElementById('budget-amount').value),
        month: parseInt(month),
        year: parseInt(year)
    };

    try {
        await BudgetsAPI.create(data);
        showToast('Budget saved!', 'success');
        closeModal('budget-modal');
        loadBudgets();
        loadDashboard();
    } catch (error) {
        showToast(error.message || 'Failed to save budget', 'error');
    }
}

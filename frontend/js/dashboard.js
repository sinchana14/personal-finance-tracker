/**
 * ============================================================
 * DASHBOARD MODULE — Loads and renders dashboard data
 * ============================================================
 */

async function loadDashboard() {
    try {
        const data = await DashboardAPI.getData();

        // Update summary cards with animated counting
        animateValue('total-income', data.totalIncome, 'income');
        animateValue('total-expense', data.totalExpense, 'expense');
        animateValue('total-balance', data.balance, 'balance');

        // Render charts
        renderMonthlyTrendChart(data.monthlyTrend || []);
        renderCategoryChart(data.categoryBreakdown || []);

        // Render budget statuses
        renderBudgetStatuses(data.budgetStatuses || []);

        // Render recent transactions
        renderRecentTransactions(data.recentTransactions || []);

    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

function animateValue(elementId, value, type) {
    const el = document.getElementById(elementId);
    const numValue = Number(value) || 0;
    const prefix = type === 'balance' && numValue < 0 ? '-₹' : '₹';
    const absValue = Math.abs(numValue);

    // Simple animation: count up from 0
    let current = 0;
    const duration = 800;
    const steps = 30;
    const increment = absValue / steps;
    const interval = duration / steps;

    const timer = setInterval(() => {
        current += increment;
        if (current >= absValue) {
            current = absValue;
            clearInterval(timer);
        }
        el.textContent = prefix + formatCurrency(current);
    }, interval);
}

function formatCurrency(amount) {
    return Number(amount).toLocaleString('en-IN', {
        maximumFractionDigits: 0
    });
}

function renderBudgetStatuses(budgets) {
    const container = document.getElementById('budget-status-list');

    if (!budgets || budgets.length === 0) {
        container.innerHTML = '<p class="empty-state">No budgets set for this month. <a href="#" onclick="navigateTo(\'budgets\')">Set one now →</a></p>';
        return;
    }

    container.innerHTML = budgets.map(b => {
        const pct = Math.min(b.percentage, 100);
        const statusClass = b.overBudget ? 'danger' : b.percentage > 75 ? 'warning' : 'safe';
        return `
            <div class="budget-item">
                <div class="budget-item-header">
                    <span class="budget-item-name">
                        <span>${b.icon || '📦'}</span>
                        ${b.categoryName}
                    </span>
                    <span class="budget-item-amounts">
                        ₹${formatCurrency(b.spent)} / ₹${formatCurrency(b.limit)}
                    </span>
                </div>
                <div class="budget-progress">
                    <div class="budget-progress-bar ${statusClass}" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderRecentTransactions(transactions) {
    const container = document.getElementById('recent-transactions-list');

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p class="empty-state">No transactions yet. Click "Add Transaction" to start!</p>';
        return;
    }

    container.innerHTML = transactions.map(t => {
        const isExpense = t.type === 'EXPENSE';
        const sign = isExpense ? '-' : '+';
        const amountClass = isExpense ? 'expense' : 'income';
        const date = new Date(t.transactionDate).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short'
        });

        return `
            <div class="transaction-item">
                <div class="txn-icon" style="background: ${t.categoryColor}20">
                    ${t.categoryIcon || '📦'}
                </div>
                <div class="txn-details">
                    <div class="txn-name">${t.description || t.categoryName}</div>
                    <div class="txn-date">${date} · ${t.categoryName}</div>
                </div>
                <span class="txn-amount ${amountClass}">${sign}₹${formatCurrency(t.amount)}</span>
            </div>
        `;
    }).join('');
}

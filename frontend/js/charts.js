/**
 * ============================================================
 * CHARTS MODULE — Chart.js visualizations
 * ============================================================
 */

let monthlyTrendChart = null;
let categoryChart = null;

function renderMonthlyTrendChart(data) {
    const canvas = document.getElementById('monthly-trend-chart');
    const ctx = canvas.getContext('2d');

    // Destroy previous chart if exists
    if (monthlyTrendChart) monthlyTrendChart.destroy();

    const labels = data.map(d => d.month);
    const incomeData = data.map(d => d.income || 0);
    const expenseData = data.map(d => d.expense || 0);

    monthlyTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2.5,
                    pointBackgroundColor: '#10b981',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2.5,
                    pointBackgroundColor: '#ef4444',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Inter', size: 12, weight: '500' },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: '#1a1d2e',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { family: 'Inter', weight: '600' },
                    bodyFont: { family: 'Inter' },
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
                    ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
                    ticks: {
                        color: '#64748b',
                        font: { family: 'Inter', size: 11 },
                        callback: (v) => '₹' + (v >= 1000 ? (v/1000) + 'k' : v)
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function renderCategoryChart(data) {
    const canvas = document.getElementById('category-chart');
    const ctx = canvas.getContext('2d');

    if (categoryChart) categoryChart.destroy();

    if (!data || data.length === 0) {
        // Show empty state
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['rgba(255,255,255,0.05)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                cutout: '70%'
            }
        });
        return;
    }

    const labels = data.map(d => `${d.icon || ''} ${d.categoryName}`);
    const amounts = data.map(d => d.amount);
    const colors = data.map(d => d.color || '#6366f1');

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderColor: '#1a1d2e',
                borderWidth: 2,
                hoverBorderColor: '#242840',
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Inter', size: 11 },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 12,
                        generateLabels: (chart) => {
                            const d = chart.data;
                            return d.labels.map((label, i) => ({
                                text: `${label} (${d.datasets[0].data[i].toLocaleString('en-IN', {style: 'currency', currency: 'INR', maximumFractionDigits: 0})})`,
                                fillStyle: d.datasets[0].backgroundColor[i],
                                strokeStyle: 'transparent',
                                index: i,
                                hidden: false,
                                pointStyle: 'circle'
                            }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#1a1d2e',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((ctx.parsed / total) * 100).toFixed(1);
                            return `₹${ctx.parsed.toLocaleString('en-IN')} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

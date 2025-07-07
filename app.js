// Expense Tracker App
let transactions = [];
let editIndex = null;
const transactionForm = document.getElementById('transaction-form');
const transactionTable = document.getElementById('transaction-table').querySelector('tbody');
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expensesEl = document.getElementById('expenses');
const filterCategory = document.getElementById('filter-category');
const filterStart = document.getElementById('filter-start');
const filterEnd = document.getElementById('filter-end');
const searchInput = document.getElementById('search');
const exportBtn = document.getElementById('export-csv');
const themeToggle = document.getElementById('theme-toggle');
const editModal = document.getElementById('edit-modal');
const closeEdit = document.getElementById('close-edit');
const editForm = document.getElementById('edit-form');

// Chart.js
let categoryChart, trendChart;

// Confetti animation
function showConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    canvas.classList.remove('hidden');
    const ctx = canvas.getContext('2d');
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    let particles = [];
    for (let i = 0; i < 120; i++) {
        particles.push({
            x: Math.random() * W,
            y: Math.random() * -H,
            r: Math.random() * 6 + 4,
            d: Math.random() * 80 + 40,
            color: `hsl(${Math.random()*360},90%,60%)`,
            tilt: Math.random() * 10 - 10
        });
    }
    let angle = 0;
    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r/3, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.r);
            ctx.stroke();
        }
        update();
    }
    function update() {
        angle += 0.01;
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            p.y += (Math.cos(angle + p.d) + 3 + p.r/2) * 0.8;
            p.x += Math.sin(angle) * 2;
            p.tilt = Math.sin(angle - i) * 15;
            if (p.y > H) {
                p.x = Math.random() * W;
                p.y = -10;
            }
        }
    }
    function loop() {
        draw();
        frame++;
        if (frame < 80) {
            requestAnimationFrame(loop);
        } else {
            canvas.classList.add('hidden');
        }
    }
    loop();
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}
function loadTransactions() {
    const data = localStorage.getItem('transactions');
    transactions = data ? JSON.parse(data) : [];
}
function renderSummary() {
    const income = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    balanceEl.textContent = `$${(income - expenses).toFixed(2)}`;
    incomeEl.textContent = `$${income.toFixed(2)}`;
    expensesEl.textContent = `$${expenses.toFixed(2)}`;
}
function renderTransactions(list = transactions) {
    transactionTable.innerHTML = '';
    if (list.length === 0) {
        transactionTable.innerHTML = '<tr><td colspan="6" style="text-align:center;">No transactions found.</td></tr>';
        return;
    }
    list.forEach((t, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.date}</td>
            <td>${t.description}</td>
            <td>${t.category}</td>
            <td class="${t.type}">${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</td>
            <td class="${t.type}">${t.type === 'expense' ? '-' : '+'}$${t.amount.toFixed(2)}</td>
            <td>
                <button onclick="editTransaction(${i})">✏️</button>
                <button class="delete" onclick="deleteTransaction(${i})">🗑️</button>
            </td>
        `;
        transactionTable.appendChild(tr);
    });
}
function addTransaction(e) {
    e.preventDefault();
    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    if (!description || isNaN(amount) || !date) return;
    transactions.push({ description, amount, type, date, category });
    saveTransactions();
    renderAll();
    transactionForm.reset();
    showConfetti();
}
function deleteTransaction(index) {
    if (!confirm('Delete this transaction?')) return;
    transactions.splice(index, 1);
    saveTransactions();
    renderAll();
}
window.deleteTransaction = deleteTransaction;
function editTransaction(index) {
    editIndex = index;
    const t = transactions[index];
    document.getElementById('edit-description').value = t.description;
    document.getElementById('edit-amount').value = t.amount;
    document.getElementById('edit-type').value = t.type;
    document.getElementById('edit-date').value = t.date;
    document.getElementById('edit-category').value = t.category;
    editModal.classList.remove('hidden');
}
window.editTransaction = editTransaction;
function saveEdit(e) {
    e.preventDefault();
    if (editIndex === null) return;
    const description = document.getElementById('edit-description').value.trim();
    const amount = parseFloat(document.getElementById('edit-amount').value);
    const type = document.getElementById('edit-type').value;
    const date = document.getElementById('edit-date').value;
    const category = document.getElementById('edit-category').value;
    if (!description || isNaN(amount) || !date) return;
    transactions[editIndex] = { description, amount, type, date, category };
    saveTransactions();
    renderAll();
    editModal.classList.add('hidden');
    editIndex = null;
}
function closeEditModal() {
    editModal.classList.add('hidden');
    editIndex = null;
}
function filterTransactions() {
    let filtered = [...transactions];
    const cat = filterCategory.value;
    const start = filterStart.value;
    const end = filterEnd.value;
    const search = searchInput.value.trim().toLowerCase();
    if (cat !== 'all') filtered = filtered.filter(t => t.category === cat);
    if (start) filtered = filtered.filter(t => t.date >= start);
    if (end) filtered = filtered.filter(t => t.date <= end);
    if (search) filtered = filtered.filter(t => t.description.toLowerCase().includes(search));
    renderTransactions(filtered);
    renderCharts(filtered);
}
function renderCharts(list = transactions) {
    // Vibrant color palette for charts
    const pieColors = [
        '#6c47ff', '#ff6b6b', '#ffd166', '#4f8cff', '#7cffb2', '#ff8b8b', '#8f5cff', '#23274d'
    ];
    // Category Pie Chart
    const catTotals = {};
    list.forEach(t => {
        if (!catTotals[t.category]) catTotals[t.category] = 0;
        catTotals[t.category] += t.type === 'expense' ? t.amount : 0;
    });
    const catLabels = Object.keys(catTotals);
    const catData = Object.values(catTotals);
    const totalExpenses = catData.reduce((a, b) => a + b, 0);
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(document.getElementById('categoryChart'), {
        type: 'doughnut',
        data: {
            labels: catLabels,
            datasets: [{
                data: catData,
                backgroundColor: pieColors.slice(0, catLabels.length),
                borderColor: '#fff',
                borderWidth: 3,
                hoverOffset: 18,
                borderJoinStyle: 'round',
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Expenses by Category',
                    color: '#6c47ff',
                    font: { size: 20, weight: 'bold', family: 'Montserrat' }
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#23274d',
                        font: { size: 15, family: 'Montserrat', weight: 'bold' },
                        padding: 18,
                        boxWidth: 22,
                        boxHeight: 22,
                        borderRadius: 8
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percent = totalExpenses ? ((value / totalExpenses) * 100).toFixed(1) : 0;
                            return `${context.label}: $${value.toLocaleString()} (${percent}%)`;
                        }
                    },
                    backgroundColor: '#fff',
                    titleColor: '#6c47ff',
                    bodyColor: '#23274d',
                    borderColor: '#6c47ff',
                    borderWidth: 2,
                    padding: 12,
                    cornerRadius: 8
                },
                datalabels: {
                    color: '#23274d',
                    font: { weight: 'bold', family: 'Montserrat', size: 14 },
                    formatter: function(value, context) {
                        const percent = totalExpenses ? ((value / totalExpenses) * 100).toFixed(1) : 0;
                        return `$${value.toLocaleString()}\n${percent}%`;
                    },
                    anchor: 'center',
                    align: 'center',
                    borderRadius: 6,
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    padding: 6,
                    display: function(context) {
                        return context.dataset.data[context.dataIndex] > 0;
                    }
                },
                doughnutlabel: {
                    labels: [
                        {
                            text: `Total\n$${totalExpenses.toLocaleString()}`,
                            font: { size: 18, weight: 'bold', family: 'Montserrat' },
                            color: '#6c47ff'
                        }
                    ]
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200,
                easing: 'easeOutBounce'
            },
            layout: {
                padding: 24
            },
            responsive: true,
            cutout: '60%',
        },
        plugins: [ChartDataLabels]
    });
    // Trend Line Chart
    const dateTotals = {};
    list.forEach(t => {
        if (!dateTotals[t.date]) dateTotals[t.date] = 0;
        dateTotals[t.date] += t.type === 'expense' ? t.amount : -t.amount;
    });
    const sortedDates = Object.keys(dateTotals).sort();
    let running = 0;
    const trendData = sortedDates.map(date => {
        running += dateTotals[date];
        return running;
    });
    if (trendChart) trendChart.destroy();
    trendChart = new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Balance Over Time',
                data: trendData,
                fill: true,
                borderColor: '#6c47ff',
                backgroundColor: 'rgba(76, 72, 255, 0.10)',
                pointBackgroundColor: '#ff6b6b',
                pointBorderColor: '#fff',
                pointRadius: 7,
                pointHoverRadius: 12,
                borderWidth: 4,
                tension: 0.35,
                shadowOffsetX: 0,
                shadowOffsetY: 4,
                shadowBlur: 16,
                shadowColor: 'rgba(76,72,255,0.18)'
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Balance Trend',
                    color: '#6c47ff',
                    font: { size: 20, weight: 'bold', family: 'Montserrat' }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#6c47ff',
                    bodyColor: '#23274d',
                    borderColor: '#6c47ff',
                    borderWidth: 2,
                    padding: 12,
                    cornerRadius: 8
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            },
            layout: {
                padding: 24
            },
            responsive: true,
            scales: {
                x: {
                    title: { display: true, text: 'Date', color: '#6c47ff', font: { family: 'Montserrat', weight: 'bold', size: 15 } },
                    grid: { color: 'rgba(76,72,255,0.08)' },
                    ticks: { color: '#23274d', font: { family: 'Montserrat', size: 13 } }
                },
                y: {
                    title: { display: true, text: 'Balance ($)', color: '#6c47ff', font: { family: 'Montserrat', weight: 'bold', size: 15 } },
                    grid: { color: 'rgba(76,72,255,0.08)' },
                    ticks: { color: '#23274d', font: { family: 'Montserrat', size: 13 } }
                }
            }
        }
    });
}
function exportCSV() {
    let csv = 'Date,Description,Category,Type,Amount\n';
    transactions.forEach(t => {
        csv += `${t.date},${t.description},${t.category},${t.type},${t.amount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
}
function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
}
function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark');
        themeToggle.textContent = '🌙';
    }
}
function renderAll() {
    renderSummary();
    filterTransactions();
    renderCharts();
}
// Event Listeners
transactionForm.addEventListener('submit', addTransaction);
editForm.addEventListener('submit', saveEdit);
closeEdit.addEventListener('click', closeEditModal);
window.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });
filterCategory.addEventListener('change', filterTransactions);
filterStart.addEventListener('change', filterTransactions);
filterEnd.addEventListener('change', filterTransactions);
searchInput.addEventListener('input', filterTransactions);
exportBtn.addEventListener('click', exportCSV);
themeToggle.addEventListener('click', toggleTheme);
// Floating Action Button: scroll to form and focus
const fabAdd = document.getElementById('fab-add');
fabAdd.addEventListener('click', () => {
    document.getElementById('description').focus();
    window.scrollTo({
        top: transactionForm.getBoundingClientRect().top + window.scrollY - 40,
        behavior: 'smooth'
    });
});
// Ripple effect for all buttons (for keyboard users too)
document.querySelectorAll('button, #fab-add').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.left = (e.offsetX || 0) + 'px';
        ripple.style.top = (e.offsetY || 0) + 'px';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    });
});
// Animate SVG background on load
window.addEventListener('DOMContentLoaded', () => {
    const svg = document.querySelector('.bg-shape path');
    if (svg) {
        svg.style.opacity = 0;
        svg.style.transform = 'translateY(-40px) scaleX(0.95)';
        setTimeout(() => {
            svg.style.transition = 'all 1.2s cubic-bezier(.68,-0.55,.27,1.55)';
            svg.style.opacity = 1;
            svg.style.transform = 'translateY(0) scaleX(1)';
        }, 200);
    }
});
// Init
loadTheme();
loadTransactions();
renderAll(); 
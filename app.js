let budget = { amount: 0, period: "" };
let expenses = [];
let currentChartType = "pie";
let chart;

// ===== Budget Form =====
document.getElementById("budget-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const amt = parseFloat(document.getElementById("budget-amount").value);
  const per = document.getElementById("budget-period").value;
  if (isNaN(amt) || !per) return;
  budget.amount = amt;
  budget.period = per;
  document.getElementById("budget-info").textContent =
    `Budget set: $${amt.toFixed(2)} (${per})`;
  this.reset();
});

// ===== Expense Form =====
document.getElementById("expense-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const desc = document.getElementById("expense-description").value.trim();
  const amt = parseFloat(document.getElementById("expense-amount").value);
  const cat = document.getElementById("expense-category").value;
  if (!desc || isNaN(amt) || !cat) return;
  expenses.push({ description: desc, amount: amt, category: cat });
  renderExpenses();
  renderChart();
  this.reset();
});

function renderExpenses() {
  const tbody = document.querySelector("#expenses-table tbody");
  tbody.innerHTML = "";
  expenses.forEach((exp, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${exp.description}</td>
      <td>$${exp.amount.toFixed(2)}</td>
      <td>${exp.category}</td>
      <td><button onclick="deleteExpense(${i})">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteExpense(idx) {
  expenses.splice(idx, 1);
  renderExpenses();
  renderChart();
}

// ===== Corrected Calculate Budget Status =====
document.getElementById("calculate-btn").addEventListener("click", calculateBudgetStatus);

function calculateBudgetStatus() {
  const statusEl = document.getElementById("budget-status");
  const suggList = document.getElementById("suggestions-list");
  const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
  const diff = budget.amount - totalExp;

  // Clear previous highlights & suggestions
  document.querySelectorAll("#expenses-table tbody tr")
    .forEach(r => r.classList.remove("over-budget"));
  suggList.innerHTML = "";

  // Overall status message
  if (diff >= 0) {
    statusEl.textContent = `✅ You're within budget! Remaining: $${diff.toFixed(2)}`;
    // No single expense above budget → suggest two categories
    const priority = ["Entertainment", "Utilities", "Food", "Rent"];
    let count = 0;
    for (let cat of priority) {
      if (expenses.some(e => e.category === cat)) {
        const li = document.createElement("li");
        li.textContent = `Reduce ${cat}`;
        suggList.appendChild(li);
        if (++count === 2) break;
      }
    }
    if (count === 0) {
      const li = document.createElement("li");
      li.textContent = "No categories to suggest.";
      suggList.appendChild(li);
    }

  } else {
    statusEl.textContent = `⚠️ You're over budget by $${Math.abs(diff).toFixed(2)}.`;

    // Highlight & suggest **every** expense > budget
    const rows = document.querySelectorAll("#expenses-table tbody tr");
    expenses.forEach((exp, i) => {
      if (exp.amount > budget.amount) {
        rows[i].classList.add("over-budget");
        const li = document.createElement("li");
        li.textContent = `Remove "${exp.description}" ($${exp.amount.toFixed(2)})`;
        suggList.appendChild(li);
      }
    });

    // If none individually > budget (edge case), fall back to two-category suggestion
    if (suggList.childElementCount === 0) {
      const fallback = ["Entertainment", "Utilities", "Food", "Rent"];
      let cnt = 0;
      for (let cat of fallback) {
        if (expenses.some(e => e.category === cat)) {
          const li = document.createElement("li");
          li.textContent = `Reduce ${cat}`;
          suggList.appendChild(li);
          if (++cnt === 2) break;
        }
      }
    }
  }
}

// ===== Chart Rendering =====
function renderChart() {
  const ctx = document.getElementById("expenseChart").getContext("2d");
  if (chart) chart.destroy();

  const totals = {};
  expenses.forEach(e => totals[e.category] = (totals[e.category] || 0) + e.amount);

  chart = new Chart(ctx, {
    type: currentChartType,
    data: {
      labels: Object.keys(totals),
      datasets: [{
        label: "Expenses",
        data: Object.values(totals),
        backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

document.getElementById("toggle-chart").addEventListener("click", () => {
  currentChartType = currentChartType === "pie" ? "bar" : "pie";
  renderChart();
});

document.getElementById("export-btn").addEventListener("click", () => {
  if (!expenses.length) return;
  let csv = "data:text/csv;charset=utf-8,Description,Amount,Category\n";
  expenses.forEach(e => csv += `${e.description},${e.amount},${e.category}\n`);
  const link = document.createElement("a");
  link.href = encodeURI(csv);
  link.download = "expenses.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

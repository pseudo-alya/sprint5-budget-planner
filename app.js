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

// ===== Calculate Budget Status & Suggestions =====
document
  .getElementById("calculate-btn")
  .addEventListener("click", calculateBudgetStatus);

function calculateBudgetStatus() {
  const statusEl = document.getElementById("budget-status");
  const suggList = document.getElementById("suggestions-list");
  const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
  const diff = budget.amount - totalExp;
  const rows = document.querySelectorAll("#expenses-table tbody tr");

  // 1) Clear previous highlights & suggestions
  rows.forEach((r) => r.classList.remove("over-budget"));
  suggList.innerHTML = "";

  // 2) Show overall status
  if (diff >= 0) {
    statusEl.textContent = `✅ You're within budget! Remaining: $${diff.toFixed(
      2
    )}`;

    // Case 2 fallback: all individual <= budget but sum <= budget → no suggestions
    return;
  } else {
    statusEl.textContent = `⚠️ You're over budget by $${Math.abs(
      diff
    ).toFixed(2)}. Consider cutting:`;
  }

  // 3) Case 1: Are there any expenses > total budget?
  const overItems = expenses
    .map((exp, i) => ({ exp, i }))
    .filter(({ exp }) => exp.amount > budget.amount);

  if (overItems.length > 0) {
    // Highlight & suggest each
    overItems.forEach(({ exp, i }) => {
      rows[i].classList.add("over-budget");
      const li = document.createElement("li");
      li.textContent = `Remove "${exp.description}" ($${exp.amount.toFixed(
        2
      )})`;
      suggList.appendChild(li);
    });
    return;
  }

  // 4) Case 2: sum > budget but no single expense > budget
  //    Suggest 2 expenses in this category priority, picking the largest in each
  const priority = ["Other", "Entertainment", "Utilities", "Food", "Rent"];
  let suggested = 0;
  for (let cat of priority) {
    if (suggested >= 2) break;
    // find all in this category
    const candidates = expenses
      .map((exp, i) => ({ exp, i }))
      .filter(({ exp }) => exp.category === cat);
    if (candidates.length) {
      // pick largest
      candidates.sort((a, b) => b.exp.amount - a.exp.amount);
      const { exp, i } = candidates[0];
      rows[i].classList.add("over-budget");
      const li = document.createElement("li");
      li.textContent = `Remove "${exp.description}" ($${exp.amount.toFixed(
        2
      )})`;
      suggList.appendChild(li);
      suggested++;
    }
  }

  // If still none (edge), say no suggestions
  if (suggested === 0) {
    const li = document.createElement("li");
    li.textContent = "No suggestions available.";
    suggList.appendChild(li);
  }
}

// ===== Chart.js Rendering =====
function renderChart() {
  const ctx = document.getElementById("expenseChart").getContext("2d");
  if (chart) chart.destroy();
  const totals = {};
  expenses.forEach((e) => (totals[e.category] = (totals[e.category] || 0) + e.amount));
  chart = new Chart(ctx, {
    type: currentChartType,
    data: {
      labels: Object.keys(totals),
      datasets: [
        {
          label: "Expenses",
          data: Object.values(totals),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
    },
  });
}

// ===== Toggle Chart Type =====
document.getElementById("toggle-chart").addEventListener("click", () => {
  currentChartType = currentChartType === "pie" ? "bar" : "pie";
  renderChart();
});

// ===== Export to CSV =====
document.getElementById("export-btn").addEventListener("click", () => {
  if (!expenses.length) return;
  let csv = "data:text/csv;charset=utf-8,Description,Amount,Category\n";
  expenses.forEach((e) => (csv += `${e.description},${e.amount},${e.category}\n`));
  const link = document.createElement("a");
  link.href = encodeURI(csv);
  link.download = "expenses.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

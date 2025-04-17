let budget = {
  amount: 0,
  period: ""
};

let expenses = [];
let currentChartType = "pie";

// ===== Budget Form Handling =====
document.getElementById("budget-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("budget-amount").value);
  const period = document.getElementById("budget-period").value;

  if (isNaN(amount) || !period) return;

  budget.amount = amount;
  budget.period = period;

  document.getElementById("budget-info").textContent = `Budget set: $${amount.toFixed(2)} (${period})`;
  document.getElementById("budget-form").reset();
});

// ===== Expense Form Handling =====
document.getElementById("expense-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const description = document.getElementById("expense-description").value.trim();
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const category = document.getElementById("expense-category").value;

  if (!description || isNaN(amount) || !category) return;

  expenses.push({ description, amount, category });
  renderExpenses();
  renderChart();
  document.getElementById("expense-form").reset();
});

// ===== Render Expenses Table =====
function renderExpenses() {
  const tbody = document.querySelector("#expenses-table tbody");
  tbody.innerHTML = "";

  expenses.forEach((expense, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${expense.description}</td>
      <td>$${expense.amount.toFixed(2)}</td>
      <td>${expense.category}</td>
      <td><button onclick="deleteExpense(${index})">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

// ===== Delete Expense Entry =====
function deleteExpense(index) {
  expenses.splice(index, 1);
  renderExpenses();
  renderChart();
}

// ===== Calculate Budget Status & Suggestions =====
document.getElementById("calculate-btn").addEventListener("click", calculateBudgetStatus);

function calculateBudgetStatus() {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const difference = budget.amount - totalExpenses;
  const statusElement = document.getElementById("budget-status");
  const suggestionsList = document.getElementById("suggestions-list");

  // Reset previous highlights and suggestions
  document.querySelectorAll(".over-budget").forEach(row => {
    row.classList.remove("over-budget");
  });
  suggestionsList.innerHTML = "";

  if (difference >= 0) {
    statusElement.textContent = `✅ You're within budget! Remaining: $${difference.toFixed(2)}`;
  } else {
    statusElement.textContent = `⚠️ You're over budget by $${Math.abs(difference).toFixed(2)}. Consider cutting:`;

    const priority = ["Entertainment", "Food", "Utilities", "Rent", "Other"];
    let suggestedCategory = null;

    for (let category of priority) {
      const expensesInCategory = expenses.filter(e => e.category === category);
      if (expensesInCategory.length > 0) {
        suggestedCategory = category;

        // Highlight one matching row
        const rows = document.querySelectorAll("#expenses-table tbody tr");
        for (let row of rows) {
          const rowCategory = row.cells[2].textContent;
          if (rowCategory === category) {
            row.classList.add("over-budget");
            break;
          }
        }

        // Add suggestion
        const categoryTotal = expensesInCategory.reduce((sum, e) => sum + e.amount, 0);
        const suggestionItem = document.createElement("li");
        suggestionItem.textContent = `${category} - $${categoryTotal.toFixed(2)}`;
        suggestionsList.appendChild(suggestionItem);
        break; // Only show the first matching suggestion
      }
    }

    if (!suggestedCategory) {
      const li = document.createElement("li");
      li.textContent = "No suggestions available.";
      suggestionsList.appendChild(li);
    }
  }
}

// ===== Chart.js Rendering =====
let chart;

function renderChart() {
  const ctx = document.getElementById("expenseChart").getContext("2d");

  if (chart) chart.destroy();

  const categoryTotals = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  chart = new Chart(ctx, {
    type: currentChartType,
    data: {
      labels: labels,
      datasets: [{
        label: "Expenses",
        data: data,
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
      }
    }
  });
}

// ===== Toggle Chart Type =====
document.getElementById("toggle-chart").addEventListener("click", () => {
  currentChartType = currentChartType === "pie" ? "bar" : "pie";
  renderChart();
});

// ===== Export to CSV =====
document.getElementById("export-btn").addEventListener("click", function () {
  if (expenses.length === 0) return;

  let csvContent = "data:text/csv;charset=utf-8,Description,Amount,Category\n";
  expenses.forEach(e => {
    csvContent += `${e.description},${e.amount},${e.category}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "expenses.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});


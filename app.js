let budget = { amount: 0, period: "" };
let expenses = [];
let currentChartType = "pie";
let chart;

// DOM elements
const crackOverlay = document.getElementById("crack-overlay");
const resetBtn     = document.getElementById("reset-btn");
const statusEl     = document.getElementById("budget-status");
const suggList     = document.getElementById("suggestions-list");
const rowSelector  = "#expenses-table tbody tr";

// ===== Budget Form =====
document.getElementById("budget-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const amt = parseFloat(this.querySelector("#budget-amount").value);
  const per = this.querySelector("#budget-period").value;
  if (isNaN(amt) || !per) return;
  budget.amount = amt;
  budget.period = per;
  document.getElementById("budget-info").textContent =
    `Budget set: $${amt.toFixed(2)} (${per})`;
  this.reset();
});

// ===== Expense Form =====
document.getElementById("expense-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const desc = this.querySelector("#expense-description").value.trim();
  const amt  = parseFloat(this.querySelector("#expense-amount").value);
  const cat  = this.querySelector("#expense-category").value;
  if (!desc || isNaN(amt) || !cat) return;
  expenses.push({ description: desc, amount: amt, category: cat });
  renderExpenses();
  renderChart();
  this.reset();
});

// ===== Reset Button (Story #10) =====
resetBtn.addEventListener("click", () => location.reload());

// ===== Render Expenses =====
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

function deleteExpense(i) {
  expenses.splice(i, 1);
  renderExpenses();
  renderChart();
}

// ===== Calculate & Suggestions =====
document.getElementById("calculate-btn")
  .addEventListener("click", calculateBudgetStatus);

function calculateBudgetStatus() {
  // clear previous
  document.querySelectorAll(rowSelector)
    .forEach(r => r.classList.remove("over-budget"));
  suggList.innerHTML = "";
  crackOverlay.classList.remove("visible");

  // totals
  const total = expenses.reduce((s,e) => s + e.amount, 0);
  const diff  = budget.amount - total;

  // Case: within budget → confetti (Story #12)
  if (diff >= 0) {
    statusEl.textContent = `✅ You're within budget! Remaining: $${diff.toFixed(2)}`;
    showConfetti();
    return;
  }

  // over budget
  statusEl.textContent = `⚠️ You're over budget by $${Math.abs(diff).toFixed(2)}.`;
  showCrackScreen(); // Story #11

  // Case 1: any expense alone > budget?
  let overItems = [];
  expenses.forEach((e,i) => {
    if (e.amount > budget.amount) overItems.push({e,i});
  });
  if (overItems.length) {
    overItems.forEach(({e,i}) => {
      highlightRow(i);
      addSuggestion(`Remove "${e.description}" ($${e.amount.toFixed(2)})`);
    });
    return;
  }

  // Case 2: sum > budget only → suggest two by priority
  const priorities = ["Other","Entertainment","Utilities","Food","Rent"];
  let picks = 0;
  for (let cat of priorities) {
    if (picks === 2) break;
    let candidates = expenses.filter(e => e.category===cat);
    if (!candidates.length) continue;
    let top = candidates.reduce((a,b) => a.amount>b.amount?a:b);
    let idx = expenses.indexOf(top);
    highlightRow(idx);
    addSuggestion(`Remove "${top.description}" ($${top.amount.toFixed(2)})`);
    picks++;
  }
  if (!picks) addSuggestion("No suggestions available.");
}

function highlightRow(i) {
  document.querySelectorAll(rowSelector)[i].classList.add("over-budget");
}
function addSuggestion(text) {
  const li = document.createElement("li");
  li.textContent = text;
  suggList.appendChild(li);
}

// ===== Crack-Screen Jump Scare (Story #11) =====
function showCrackScreen() {
  crackOverlay.classList.add("visible");
  setTimeout(() => crackOverlay.classList.remove("visible"), 1200);
}

// ===== Confetti Celebration (Story #12) =====
function showConfetti() {
  if (typeof confetti === "function") {
    confetti({ particleCount:100, spread:70, origin:{y:0.6} });
  }
}

// ===== Chart.js Rendering =====
function renderChart() {
  const ctx = document.getElementById("expenseChart").getContext("2d");
  if (chart) chart.destroy();
  const totals = {};
  expenses.forEach(e => totals[e.category] = (totals[e.category]||0)+e.amount);
  chart = new Chart(ctx, {
    type: currentChartType,
    data: {
      labels: Object.keys(totals),
      datasets:[{ label:"Expenses", data:Object.values(totals),
        backgroundColor:['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF'] }]
    },
    options:{ responsive:true, plugins:{ legend:{position:'bottom'} } }
  });
}

// ===== Toggle Chart Type =====
document.getElementById("toggle-chart")
  .addEventListener("click", () => {
    currentChartType = currentChartType==='pie'?'bar':'pie';
    renderChart();
});

// ===== Export to CSV =====
document.getElementById("export-btn")
  .addEventListener("click", () => {
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

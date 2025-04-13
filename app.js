// Arrays and variables to store expenses and budget info
let expenses = [];
let budget = null;
let budgetPeriod = '';
let currentChartType = 'pie';
let expenseChart = null;

// Handle Expense Form Submission
document.getElementById('expense-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const desc = document.getElementById('expense-description').value;
  const amt = parseFloat(document.getElementById('expense-amount').value);
  const cat = document.getElementById('expense-category').value;
  
  // Input validation (required fields already enforced by HTML, but we check number value)
  if (!desc || isNaN(amt) || !cat) {
    alert("Please fill all fields correctly.");
    return;
  }
  
  // Create expense object and add to expenses array
  const expense = { id: Date.now(), description: desc, amount: amt, category: cat };
  expenses.push(expense);
  updateExpensesTable();
  
  // Reset form
  this.reset();
});

// Update Expenses Table
function updateExpensesTable() {
  const tbody = document.querySelector('#expenses-table tbody');
  tbody.innerHTML = ''; // Clear existing rows
  expenses.forEach(exp => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${exp.description}</td>
      <td>${exp.amount.toFixed(2)}</td>
      <td>${exp.category}</td>
      <td>
        <button onclick="editExpense(${exp.id})">Edit</button>
        <button onclick="deleteExpense(${exp.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  updateChart();
}

// Delete Expense
function deleteExpense(id) {
  expenses = expenses.filter(exp => exp.id !== id);
  updateExpensesTable();
}

// Edit Expense (a simple prompt implementation)
function editExpense(id) {
  const exp = expenses.find(exp => exp.id === id);
  if (!exp) return;
  const newDesc = prompt("Edit description:", exp.description);
  const newAmt = parseFloat(prompt("Edit amount:", exp.amount));
  const newCat = prompt("Edit category:", exp.category);
  if (newDesc && !isNaN(newAmt) && newCat) {
    exp.description = newDesc;
    exp.amount = newAmt;
    exp.category = newCat;
    updateExpensesTable();
  }
}

// Handle Budget Form Submission
document.getElementById('budget-form').addEventListener('submit', function(e) {
  e.preventDefault();
  budget = parseFloat(document.getElementById('budget-amount').value);
  budgetPeriod = document.getElementById('budget-period').value;
  if (isNaN(budget) || !budgetPeriod) {
    alert("Please provide a valid budget amount and period.");
    return;
  }
  document.getElementById('budget-info').textContent = `Budget: $${budget.toFixed(2)} (${budgetPeriod})`;
  this.reset();
});

// Handle Budget Calculation
document.getElementById('calculate-btn').addEventListener('click', function() {
  if (budget === null) {
    alert("Please set your budget first.");
    return;
  }
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const statusEl = document.getElementById('budget-status');
  
  // Calculate remaining vs. exceeded budget
  if (totalExpenses <= budget) {
    statusEl.textContent = `You are within your budget. Remaining: $${(budget - totalExpenses).toFixed(2)}`;
    statusEl.style.color = 'green';
    document.getElementById('suggestions-list').innerHTML = '';
  } else {
    statusEl.textContent = `You have exceeded your budget by $${(totalExpenses - budget).toFixed(2)}`;
    statusEl.style.color = 'red';
    displaySuggestions();
  }
});

// Provide expense reduction suggestions
function displaySuggestions() {
  const suggestions = [
    "Review your food expenses for possible savings.",
    "Cut down on non-essential entertainment costs.",
    "Consider reducing utility usage or renegotiating bills."
  ];
  const ul = document.getElementById('suggestions-list');
  ul.innerHTML = '';
  suggestions.forEach(suggestion => {
    const li = document.createElement('li');
    li.textContent = suggestion;
    ul.appendChild(li);
  });
}

// CSV Export Functionality (User Story #9)
document.getElementById('export-btn').addEventListener('click', function() {
  let csvContent = "Description,Amount,Category\r\n";
  expenses.forEach(exp => {
    csvContent += `${exp.description},${exp.amount},${exp.category}\r\n`;
  });
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "expenses.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Chart Display Functionality (User Story #7)
// Create or update the chart displaying expense data
function updateChart() {
  const ctx = document.getElementById('expenseChart').getContext('2d');
  
  // Aggregate expenses by category
  const dataMap = {};
  expenses.forEach(exp => {
    dataMap[exp.category] = (dataMap[exp.category] || 0) + exp.amount;
  });
  const labels = Object.keys(dataMap);
  const dataValues = Object.values(dataMap);
  
  // If chart exists, destroy it to update
  if (expenseChart) {
    expenseChart.destroy();
  }
  expenseChart = new Chart(ctx, {
    type: currentChartType,
    data: {
      labels: labels,
      datasets: [{
        label: 'Expenses by Category',
        data: dataValues,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// Toggle Chart Type (User Story #7)
document.getElementById('toggle-chart').addEventListener('click', function() {
  currentChartType = (currentChartType === 'pie') ? 'bar' : 'pie';
  updateChart();
});

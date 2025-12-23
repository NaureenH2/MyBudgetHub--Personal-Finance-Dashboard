async function loadBudgets() {
  const response = await fetch("http://127.0.0.1:5000/budgets");
  const budgets = await response.json();

  console.log("Budgets:", budgets);
  renderBudgetBarChart(budgets);
}

async function loadExpenses() {
  const response = await fetch("http://127.0.0.1:5000/expenses");
  const expenses = await response.json();

  console.log("Expenses:", expenses);
  renderExpenseChart(expenses);
  renderMonthlyLineChart(expenses);
}


loadBudgets();
loadExpenses();

let expenseChart = null;

function renderExpenseChart(expenses) {
  const totals = {};

  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  const ctx = document.getElementById("expenseChart").getContext("2d");

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(totals),
      datasets: [{
        data: Object.values(totals)
      }]
    }
  });
}

function renderMonthlyLineChart(expenses) {
  const monthlyTotals = {};

  expenses.forEach(e => {
    const month = e.date.slice(0, 7); // YYYY-MM
    monthlyTotals[month] = (monthlyTotals[month] || 0) + e.amount;
  });

  const labels = Object.keys(monthlyTotals).sort();
  const data = labels.map(m => monthlyTotals[m]);

  const ctx = document.getElementById("monthlyChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Monthly Spending",
        data: data,
        fill: false,
        tension: 0.2
      }]
    }
  });
}

function renderBudgetBarChart(budgets) {
  const labels = budgets.map(b => b.category);
  const spent = budgets.map(b => b.spent);
  const limits = budgets.map(b => b.limit);

  const ctx = document.getElementById("budgetChart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Spent",
          data: spent
        },
        {
          label: "Budget Limit",
          data: limits
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

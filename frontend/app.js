async function loadBudgets() {
  const response = await fetch("http://127.0.0.1:5000/budgets");
  const data = await response.json();
  console.log("Budgets:", data);
}

async function loadExpenses() {
  const response = await fetch("http://127.0.0.1:5000/expenses");
  const data = await response.json();
  console.log("Expenses:", data);
  renderExpenseChart(data);
}

loadBudgets();
loadExpenses();

function renderExpenseChart(expenses) {
  const totals = {};

  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  const ctx = document.getElementById("expenseChart").getContext("2d");

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(totals),
      datasets: [{
        data: Object.values(totals)
      }]
    }
  });
}

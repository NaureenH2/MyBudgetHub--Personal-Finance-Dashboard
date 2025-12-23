async function loadBudgets() {
  const response = await fetch("http://127.0.0.1:5000/budgets");
  const data = await response.json();
  console.log("Budgets:", data);
}

async function loadExpenses() {
  const response = await fetch("http://127.0.0.1:5000/expenses");
  const data = await response.json();
  console.log("Expenses:", data);
}

loadBudgets();
loadExpenses();

async function loadBudgets() {
  const response = await fetch("http://127.0.0.1:5000/budgets");
  const budgets = await response.json();

  console.log("Budgets:", budgets);
  renderBudgetBarChart(budgets);
  renderBudgetWarnings(budgets);
}

async function loadExpenses() {
  const response = await fetch("http://127.0.0.1:5000/expenses");
  const expenses = await response.json();

  console.log("Expenses:", expenses);
  renderExpenseChart(expenses);
  renderMonthlyLineChart(expenses);
  renderMonthlyTotal(expenses);
  renderTopCategory(expenses);
  renderMonthComparison(expenses);
  renderWeeklyComparison(expenses);
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

function renderMonthlyTotal(expenses) {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

  const total = expenses
    .filter(e => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  document.getElementById("monthlyTotal").innerText =
    `💰 Total spent this month: $${total.toFixed(2)}`;
}

function renderTopCategory(expenses) {
  const totals = {};

  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  let topCat = null;
  let max = 0;

  for (const cat in totals) {
    if (totals[cat] > max) {
      max = totals[cat];
      topCat = cat;
    }
  }

  document.getElementById("topCategory").innerText =
    `🏆 Top category: ${topCat} ($${max.toFixed(2)})`;
}

function renderMonthComparison(expenses) {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);

  const sumForMonth = month =>
    expenses
      .filter(e => e.date.startsWith(month))
      .reduce((sum, e) => sum + e.amount, 0);

  const currentTotal = sumForMonth(currentMonth);
  const lastTotal = sumForMonth(lastMonth);

  if (lastTotal === 0) {
    document.getElementById("monthComparison").innerText =
      "📊 No data for last month";
    return;
  }

  const percent = ((currentTotal - lastTotal) / lastTotal) * 100;
  const arrow = percent >= 0 ? "↑" : "↓";

  document.getElementById("monthComparison").innerText =
    `📈 You spent ${arrow} ${Math.abs(percent).toFixed(1)}% vs last month`;
}

function renderBudgetWarnings(budgets) {
  const warnings = budgets.filter(b => b.warning);

  if (warnings.length === 0) {
    document.getElementById("budgetWarnings").innerText =
      "✅ All budgets are under control";
    return;
  }

  document.getElementById("budgetWarnings").innerHTML =
    warnings
      .map(b =>
        `⚠️ ${b.category}: ${b.percent_used.toFixed(0)}% of budget used`
      )
      .join("<br>");
}

function renderWeeklyComparison(expenses) {
  const now = new Date();

  const startOfThisWeek = new Date(now);
  startOfThisWeek.setHours(0, 0, 0, 0);
  startOfThisWeek.setDate(now.getDate() - now.getDay());

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const sumInRange = (start, end) =>
    expenses
      .filter(e => {
        const d = new Date(e.date);
        return d >= start && d < end;
      })
      .reduce((sum, e) => sum + e.amount, 0);

  const thisWeek = sumInRange(startOfThisWeek, now);
  const lastWeek = sumInRange(startOfLastWeek, startOfThisWeek);

  const el = document.getElementById("weeklyComparison");

  if (lastWeek === 0) {
    el.innerText = "📅 No data for last week";
    return;
  }

  const percent = ((thisWeek - lastWeek) / lastWeek) * 100;
  const arrow = percent >= 0 ? "↑" : "↓";
  const sign = percent >= 0 ? "+" : "";

  el.innerText = `📅 ${arrow} ${sign}${percent.toFixed(1)}% vs last week`;
}
async function loadBudgets() {
  try {
    const response = await fetch("http://127.0.0.1:5000/budgets", {
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated, redirect will be handled by auth.js
        return;
      }
      throw new Error('Failed to load budgets');
    }
    
    const budgets = await response.json();
    console.log("Budgets:", budgets);
    renderBudgetBarChart(budgets);
    renderBudgetWarnings(budgets);
  } catch (error) {
    console.error('Error loading budgets:', error);
  }
}

async function loadExpenses() {
  try {
    const response = await fetch("http://127.0.0.1:5000/expenses", {
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated, redirect will be handled by auth.js
        return;
      }
      throw new Error('Failed to load expenses');
    }
    
    const expenses = await response.json();
    console.log("Expenses:", expenses);
    renderExpenseChart(expenses);
    renderMonthlyLineChart(expenses);
    renderMonthlyTotal(expenses);
    renderTopCategory(expenses);
    renderMonthComparison(expenses);
    renderWeeklyComparison(expenses);
  } catch (error) {
    console.error('Error loading expenses:', error);
  }
}

// Wait for auth check before loading data
// This ensures we only load data if authenticated
// The auth check in index.html will redirect if not authenticated,
// so we can safely load data here
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure auth check completes first
  setTimeout(() => {
    loadBudgets();
    loadExpenses();
  }, 100);
});

let expenseChart = null;
let monthlyChart = null;
let budgetChart = null;

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
    const month = e.date.slice(0, 7);
    monthlyTotals[month] = (monthlyTotals[month] || 0) + e.amount;
  });

  const labels = Object.keys(monthlyTotals).sort();
  const data = labels.map(m => monthlyTotals[m]);

  const ctx = document.getElementById("monthlyChart").getContext("2d");

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Monthly Spending",
        data,
        tension: 0.3
      }]
    }
  });
}

function renderBudgetBarChart(budgets) {
  const labels = budgets.map(b => b.category);
  const spent = budgets.map(b => b.spent);
  const limits = budgets.map(b => b.limit);

  const ctx = document.getElementById("budgetChart").getContext("2d");

  if (budgetChart) budgetChart.destroy();

  budgetChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Spent", data: spent },
        { label: "Budget Limit", data: limits }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderMonthlyTotal(expenses) {
  const el = document.getElementById("monthlyTotal");
  if (!el) return;

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);

  const total = expenses
    .filter(e => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  const text = `$${total.toFixed(2)}`;
  if (el.innerText !== text) el.innerText = text;
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
  const el = document.getElementById("monthComparison");
  if (!el) return;

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

  el.className = "";

  if (lastTotal === 0) {
    el.classList.add("neutral");
    el.innerText = "📊 No data for last month";
    return;
  }

  const percent = ((currentTotal - lastTotal) / lastTotal) * 100;
  const arrow = percent >= 0 ? "↑" : "↓";

  el.classList.add(percent <= 0 ? "good" : "bad");

  el.innerText =
    `📊 ${arrow} ${Math.abs(percent).toFixed(1)}% vs last month`;
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
  const el = document.getElementById("weeklyComparison");
  if (!el) return;

  const now = new Date();

  const startOfThisWeek = new Date(now);
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

  el.className = "";

  if (lastWeek === 0) {
    el.classList.add("neutral");
    el.innerText = "📅 No data for last week";
    return;
  }

  const percent = ((thisWeek - lastWeek) / lastWeek) * 100;
  const arrow = percent >= 0 ? "↑" : "↓";

  el.classList.add(percent <= 0 ? "good" : "bad");

  el.innerText =
    `📅 ${arrow} ${Math.abs(percent).toFixed(1)}% vs last week`;
}

// Logout is now handled by auth.js
// The logout button with data-logout-btn attribute will be automatically handled
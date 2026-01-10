const API_BASE = 'http://127.0.0.1:5000';

document.addEventListener("DOMContentLoaded", () => {

  // Add expense
  document.getElementById("expense-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      description: document.getElementById("expense-description").value,
      amount: document.getElementById("expense-amount").value,
      category: document.getElementById("expense-category").value,
      date: document.getElementById("expense-date").value
    };

    await fetch(`${API_BASE}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data)
    });

    e.target.reset();
    await loadExpenses();
    await loadBudgets();
  });

  // Export CSV
  document.getElementById("export-expenses").addEventListener("click", () => {
    window.location.href = `${API_BASE}/expenses/export`;
  });

  // Import CSV
  document.getElementById("import-expenses").addEventListener("change", async (e) => {
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    await fetch(`${API_BASE}/expenses/import`, {
      method: "POST",
      credentials: "include",
      body: formData
    });

    await loadExpenses();
    await loadBudgets();
  });
});

async function loadExpenses() {
  const res = await fetch(`${API_BASE}/expenses`, { credentials: "include" });
  const expenses = await res.json();

  const tbody = document.getElementById("expenses-body");
  tbody.innerHTML = "";

  expenses.forEach(e => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${e.description}</td>
      <td>$${e.amount.toFixed(2)}</td>
      <td>${e.category}</td>
      <td>${e.date.split("T")[0]}</td>
      <td>
        <button onclick="deleteExpense(${e.id})">🗑</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function deleteExpense(id) {
  await fetch(`${API_BASE}/expenses/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  await loadExpenses();
  await loadBudgets();
}
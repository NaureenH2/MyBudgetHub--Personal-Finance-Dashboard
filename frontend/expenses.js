document.addEventListener("DOMContentLoaded", () => {
  // Add expense
  const expenseForm = document.getElementById("expense-form");
  if (expenseForm) {
    expenseForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        description: document.getElementById("expense-description").value,
        amount: document.getElementById("expense-amount").value,
        category: document.getElementById("expense-category").value,
        date: document.getElementById("expense-date").value
      };

      const res = await fetch(`${API_BASE}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });

      if (res.ok) {
        e.target.reset();
        // Reload all data
        loadExpenses();
        loadBudgets();
      }
    });
  }

  // Export CSV
  const exportBtn = document.getElementById("export-expenses");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      window.location.href = `${API_BASE}/expenses/export`;
    });
  }

  // Import CSV
  const importInput = document.getElementById("import-expenses");
  if (importInput) {
    importInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      const fileNameSpan = document.getElementById("file-name");
      
      if (file) {
        // Update the filename display
        fileNameSpan.textContent = file.name;
        
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE}/expenses/import`, {
          method: "POST",
          credentials: "include",
          body: formData
        });

        if (res.ok) {
          loadExpenses();
          loadBudgets();
          // Reset after successful import
          fileNameSpan.textContent = "No file chosen";
          e.target.value = '';
        }
      }
    });
  }

  // Render expense table
  renderExpenseTable();
});

async function deleteExpense(id) {
  await fetch(`${API_BASE}/expenses/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  loadExpenses();
  loadBudgets();
  renderExpenseTable();
}

async function renderExpenseTable() {
  const res = await fetch(`${API_BASE}/expenses`, { credentials: "include" });
  const expenses = await res.json();

  const tbody = document.getElementById("expenses-body");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  expenses.forEach(e => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${e.description}</td>
      <td>$${e.amount.toFixed(2)}</td>
      <td>${e.category}</td>
      <td>${e.date.split("T")[0]}</td>
      <td>
        <button class="btn-submit" onclick="deleteExpense(${e.id})">🗑</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}
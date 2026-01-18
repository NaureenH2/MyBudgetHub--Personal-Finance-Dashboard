# MyBudgetHub: Personal Finance Dashboard
MyBudgetHub is a full-stack personal finance web application that helps users track expenses, manage budgets, and gain insights into their spending habits through interactive visualizations. The application is designed to make budgeting simple, visual, and actionable.

## Features:

1. **Authentication**
  - Secure registration and login
  - Session-based authentication
  - Per-user data isolation

2. **Expense Management**
  - Add, edit, and delete expenses
  - Automatic expense categorization
  - Interactive spending visualizations
  - Monthly and weekly comparisons

3. **Budgeting**
  - Create, edit, and delete budgets by category
  - Real-time budget usage tracking
  - Visual progress indicators and warnings

4. **CSV Import & Export**
  - Import expenses from bank CSV files
  - Export expenses for external analysis

5. **Insights Dashboard**
  - Category-based expense charts **(data visualization)
  - Monthly spending trends
  - Top spending category highlights
  - Budget alerts when limits are approached

## Tech Stack

**Frontend:** HTML, CSS, JavaScript, Chart.js

**Backend:** Python, Flask, Flask-Login

**Database:** PostgreSQL, SQLAlchemy (Flask-SQLAlchemy through ORM)

## How to run locally:

**1. Clone the repository**

git clone https://github.com/your-username/mybudgethub.git
cd mybudgethub

**2. Create and activate a virtual environment**

python -m venv venv
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows

**3. Install dependencies**

pip install -r requirements.txt

**4. Set up PostgreSQL**

- Create a PostegreSQL Database locally
- Update your database connection string in your Flask configuration
    - Ex. postgresql://username:password@localhost:5432/mybudgethub

**5. Initialize the database**

flask db upgrade

**6. Run the Application**

The app will be available at: http://127.0.0.1:5000
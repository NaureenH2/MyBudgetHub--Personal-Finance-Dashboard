from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
from models import db, Expense
import csv
from io import StringIO
from flask import Response

expenses_bp = Blueprint("expenses", __name__)

@expenses_bp.route("/expenses", methods=["POST"])
@login_required
def add_expense():
    data = request.get_json()

    expense = Expense(
        description=data["description"],
        amount=float(data["amount"]),
        category=data["category"],
        date=datetime.strptime(data["date"], "%Y-%m-%d"),
        user_id=current_user.id
    )

    db.session.add(expense)
    db.session.commit()

    return jsonify({"message": "Expense added"}), 201


@expenses_bp.route("/expenses", methods=["GET"])
@login_required
def get_expenses():
    expenses = Expense.query.filter_by(user_id=current_user.id).all()

    result = []
    for e in expenses:
        result.append({
            "id": e.id,
            "description": e.description,
            "amount": e.amount,
            "category": e.category,
            "date": e.date.isoformat()
        })

    return jsonify(result)

@expenses_bp.route("/expenses/<int:expense_id>", methods=["PUT"])
@login_required
def update_expense(expense_id):
    data = request.get_json()

    expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()

    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    expense.description = data.get("description", expense.description)
    expense.amount = float(data.get("amount", expense.amount))
    expense.category = data.get("category", expense.category)
    expense.date = datetime.strptime(
        data.get("date", expense.date.strftime("%Y-%m-%d")),
        "%Y-%m-%d"
    )

    db.session.commit()

    return jsonify({"message": "Expense updated"})

@expenses_bp.route("/expenses/<int:expense_id>", methods=["DELETE"])
@login_required
def delete_expense(expense_id):
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()

    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    db.session.delete(expense)
    db.session.commit()

    return jsonify({"message": "Expense deleted"})

@expenses_bp.route("/expenses/export", methods=["GET"])
@login_required
def export_expenses():
    expenses = Expense.query.filter_by(user_id=current_user.id).all()

    output = StringIO()
    writer = csv.writer(output)

    writer.writerow(["description", "amount", "category", "date"])

    for e in expenses:
        writer.writerow([
            e.description,
            e.amount,
            e.category,
            e.date.isoformat()
        ])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=expenses.csv"
        }
    )

def auto_category(description):
    d = description.lower()

    FOOD_KEYWORDS = [
        "coffee", "cafe", "restaurant", "diner", "grill",
        "pizza", "burger", "food", "bakery", "tim hortons",
        "mcdonald", "kfc", "subway"
    ]

    GROCERY_KEYWORDS = [
        "grocery", "market", "supermarket", "foods",
        "walmart", "target", "costco", "loblaws", "metro"
    ]

    TRANSPORT_KEYWORDS = [
        "uber", "lyft", "taxi", "bus", "train", "transit",
        "gas", "fuel", "shell", "esso", "petro"
    ]

    SHOPPING_KEYWORDS = [
        "amazon", "store", "shop", "mall", "online"
    ]

    RENT_KEYWORDS = [
        "rent", "lease", "apartment", "housing"
    ]

    if any(k in d for k in FOOD_KEYWORDS):
        return "Food"

    if any(k in d for k in GROCERY_KEYWORDS):
        return "Groceries"

    if any(k in d for k in TRANSPORT_KEYWORDS):
        return "Transport"

    if any(k in d for k in RENT_KEYWORDS):
        return "Rent"

    if any(k in d for k in SHOPPING_KEYWORDS):
        return "Shopping"

    return "Other"

@expenses_bp.route("/expenses/import", methods=["POST"])
@login_required
def import_expenses():
    if "file" not in request.files:
        return {"error": "No file uploaded"}, 400

    file = request.files["file"]

    if not file.filename.endswith(".csv"):
        return {"error": "Invalid file type"}, 400
    
    # Expense.query.filter_by(user_id=current_user.id).delete()
    # db.session.commit()

    stream = file.stream.read().decode("utf-8").splitlines()
    reader = csv.DictReader(stream)

    imported = 0

    for row in reader:
        # Handle both lowercase and uppercase headers
        description = row.get("description") or row.get("Description")
        amount = float(row.get("amount") or row.get("Amount"))
        category = row.get("category") or row.get("Category") or auto_category(description)
        date_str = row.get("date") or row.get("Date")
        
        # Handle different date formats
        try:
            # Try YYYY-MM-DD format first
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            try:
                # Try M/D/YYYY format
                date_obj = datetime.strptime(date_str, "%m/%d/%Y")
            except ValueError:
                # Try other common formats
                date_obj = datetime.strptime(date_str, "%d/%m/%Y")

        # Accept all expenses (positive or negative)
        expense = Expense(
            description=description,
            amount=abs(amount),  # Always store as positive
            category=category,
            date=date_obj,
            user_id=current_user.id
        )

        db.session.add(expense)
        imported += 1

    db.session.commit()

    return {
        "message": f"{imported} expenses imported"
    }

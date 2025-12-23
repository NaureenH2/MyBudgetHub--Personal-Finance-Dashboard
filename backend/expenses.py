from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
from models import db, Expense
import csv
from io import StringIO
from flask import Response

expenses_bp = Blueprint("expenses", __name__)

@expenses_bp.route("/expenses", methods=["POST"])
# @login_required
def add_expense():
    data = request.get_json()

    expense = Expense(
        description=data["description"],
        amount=float(data["amount"]),
        category=data["category"],
        date=datetime.strptime(data["date"], "%Y-%m-%d"),
        # user_id=current_user.id
        user_id=1
    )

    db.session.add(expense)
    db.session.commit()

    return jsonify({"message": "Expense added"}), 201


@expenses_bp.route("/expenses", methods=["GET"])
# @login_required
def get_expenses():
    # expenses = Expense.query.filter_by(user_id=current_user.id).all()
    expenses = Expense.query.filter_by(user_id=1).all()

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
def update_expense(expense_id):
    data = request.get_json()

    expense = Expense.query.filter_by(id=expense_id, user_id=1).first()

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
def delete_expense(expense_id):
    expense = Expense.query.filter_by(id=expense_id, user_id=1).first()

    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    db.session.delete(expense)
    db.session.commit()

    return jsonify({"message": "Expense deleted"})

@expenses_bp.route("/expenses/export", methods=["GET"])
def export_expenses():
    expenses = Expense.query.all()

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


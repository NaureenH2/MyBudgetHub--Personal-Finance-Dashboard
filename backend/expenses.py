from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
from models import db, Expense

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

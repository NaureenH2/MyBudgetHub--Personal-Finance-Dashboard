from flask import Blueprint, request, jsonify
from sqlalchemy import func
from models import db, Budget, Expense

budgets_bp = Blueprint("budgets", __name__)

@budgets_bp.route("/budgets", methods=["POST"])
def create_budget():
    data = request.get_json()

    budget = Budget(
        category=data["category"],
        limit=float(data["limit"]),
        user_id=1
    )

    db.session.add(budget)
    db.session.commit()

    return jsonify({"message": "Budget created"}), 201


@budgets_bp.route("/budgets", methods=["GET"])
def get_budgets():
    budgets = Budget.query.filter_by(user_id=1).all()
    result = []

    for b in budgets:
        spent = (
            db.session.query(func.coalesce(func.sum(Expense.amount), 0))
            .filter(
                Expense.user_id == 1,
                Expense.category == b.category
            )
            .scalar()
        )

        percent_used = (spent / b.limit) * 100 if b.limit > 0 else 0

        result.append({
            "id": b.id,
            "category": b.category,
            "limit": b.limit,
            "spent": float(spent),
            "remaining": round(b.limit - spent, 2),
            "percent_used": round(percent_used, 2),
            "warning": percent_used >= 80,
            "alert_level": (
                "danger" if percent_used >= 100 else
                "warning" if percent_used >= 80 else
                "safe"
            )
        })


    return jsonify(result)
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import func
from models import db, Budget, Expense

budgets_bp = Blueprint("budgets", __name__)

@budgets_bp.route("/budgets", methods=["POST"])
@login_required
def create_budget():
    data = request.get_json()

    budget = Budget(
        category=data["category"],
        limit=float(data["limit"]),
        user_id=current_user.id
    )

    db.session.add(budget)
    db.session.commit()

    return jsonify({"message": "Budget created"}), 201


@budgets_bp.route("/budgets", methods=["GET"])
@login_required
def get_budgets():
    budgets = Budget.query.filter_by(user_id=current_user.id).all()
    result = []

    for b in budgets:
        spent = (
            db.session.query(func.coalesce(func.sum(Expense.amount), 0))
            .filter(
                Expense.user_id == current_user.id,
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

@budgets_bp.route("/budgets/<int:budget_id>", methods=["PUT"])
@login_required
def update_budget(budget_id):
    data = request.get_json()

    budget = Budget.query.filter_by(
        id=budget_id,
        user_id=current_user.id
    ).first()

    if not budget:
        return jsonify({"error": "Budget not found"}), 404

    budget.category = data.get("category", budget.category)
    budget.limit = float(data.get("limit", budget.limit))

    db.session.commit()

    return jsonify({"message": "Budget updated"})


@budgets_bp.route("/budgets/<int:budget_id>", methods=["DELETE"])
@login_required
def delete_budget(budget_id):
    budget = Budget.query.filter_by(
        id=budget_id,
        user_id=current_user.id
    ).first()

    if not budget:
        return jsonify({"error": "Budget not found"}), 404

    db.session.delete(budget)
    db.session.commit()

    return jsonify({"message": "Budget deleted"})
from flask import Blueprint, jsonify
from datetime import date, timedelta
from models import Expense

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard/weekly")
def weekly_summary():
    today = date.today()

    start_this_week = today - timedelta(days=today.weekday())
    start_last_week = start_this_week - timedelta(days=7)
    end_last_week = start_this_week - timedelta(days=1)

    this_week_total = sum(
        e.amount for e in Expense.query.filter(
            Expense.date >= start_this_week
        ).all()
    )

    last_week_total = sum(
        e.amount for e in Expense.query.filter(
            Expense.date >= start_last_week,
            Expense.date <= end_last_week
        ).all()
    )

    percent_change = 0
    if last_week_total > 0:
        percent_change = round(
            ((this_week_total - last_week_total) / last_week_total) * 100, 1
        )

    return jsonify({
        "this_week": round(this_week_total, 2),
        "last_week": round(last_week_total, 2),
        "percent_change": percent_change
    })
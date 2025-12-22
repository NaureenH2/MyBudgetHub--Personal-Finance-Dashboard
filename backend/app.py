from flask import Flask
from dotenv import load_dotenv
from flask_login import LoginManager
import os

from models import db, User
from auth import auth_bp
from expenses import expenses_bp
from budgets import budgets_bp

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(expenses_bp)
app.register_blueprint(budgets_bp)

@app.route("/")
def home():
    return "MyBudgetHub backend running!"

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)

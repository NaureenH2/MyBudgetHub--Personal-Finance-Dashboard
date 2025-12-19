from flask import Flask
from dotenv import load_dotenv
from flask_login import LoginManager
import os

from models import db, User

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

@app.route("/")
def home():
    return "MyBudgetHub backend running!"

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)

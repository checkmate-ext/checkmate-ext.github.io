from flask import Flask
from models import db, User, ArticleSearch, SimilarArticle
from dotenv import load_dotenv
import os

def create_app():
    """Creates and configures the Flask application"""
    app = Flask(__name__)
    load_dotenv()

    # Get database configuration from environment variables
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME")

    # Validate database environment variables
    if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_NAME]):
        raise ValueError("Missing required database environment variables. Please check your .env file.")

    # Configure database connection
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize Flask-SQLAlchemy
    db.init_app(app)

    return app

def init_database():
    """Initialize the database by creating all tables"""
    try:
        print("Starting database initialization...")

        # Create Flask app
        app = create_app()

        # Create tables within app context
        with app.app_context():
            print("Creating tables...")
            db.create_all()
            print("\nTable creation summary:")
            print("- users table created")
            print("- article_searches table created")
            print("- similar_articles table created")
            print("\nDatabase initialization completed successfully!")

    except Exception as e:
        print(f"\nError during database initialization: {str(e)}")
        raise

if __name__ == "__main__":
    init_database()
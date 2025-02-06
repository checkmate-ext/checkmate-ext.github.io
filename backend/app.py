from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, ArticleSearch, SimilarArticle
from GoogleSearch import GoogleSearch
import os
import random
from datetime import datetime

def create_app():
    """
    Creates and configures the Flask application with database and CORS support.
    Sets up all necessary configurations from environment variables.
    """
    app = Flask(__name__)
    CORS(app)
    load_dotenv()

    # Load all required API keys and configurations
    app.config['G_API_KEY'] = os.getenv("G_API_KEY")
    app.config['CX_ID'] = os.getenv("CX_ID")
    app.config['VISION_API_KEY'] = os.getenv("VISION_API_KEY")

    # Database configuration
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME")

    required_vars = ['G_API_KEY', 'CX_ID', 'VISION_API_KEY',
                     'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    # Configure PostgreSQL database connection
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize the database with the app
    db.init_app(app)

    return app

app = create_app()

@app.route('/scrap_and_search', methods=['POST'])
def scrap_and_search():
    try:
        # Extract URL from request JSON
        data = request.json
        url = data.get('url')
        if not url:
            return jsonify({'error': 'URL parameter is required'}), 400

        print(f"Processing URL: {url}")

        # Initialize GoogleSearch and perform scraping & custom search
        google_search = GoogleSearch(app.config['G_API_KEY'], app.config['CX_ID'],app.config['VISION_API_KEY'], url)
        similar_articles = google_search.get_similar()
        article = google_search.article  # Original article data
        images_data = google_search.get_images_data()  # Analyze images for web detection
        reliability_score = random.randint(30, 95)

        print(similar_articles)
        # Return the results as JSON
        return jsonify({
            'reliability_score': reliability_score,
            'message': f"Results for {url}",
            'article': article,
            'similar_articles': similar_articles,
            'images_data': images_data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/user/register', methods=['POST'])
def register_user():
    """
    Endpoint for user registration.
    Accepts email and password, creates new user if email isn't already registered.
    """
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({
                'error': 'Missing credentials',
                'message': 'Both email and password are required'
            }), 400

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({
                'error': 'Registration failed',
                'message': 'Email already registered'
            }), 400

        # Create new user
        new_user = User(email=email)
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'message': 'User registered successfully',
            'user_id': new_user.id
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error registering user: {str(e)}")
        return jsonify({
            'error': 'Registration failed',
            'message': str(e)
        }), 500

@app.route('/user/login', methods=['POST'])
def login_user():
    """
    Endpoint for user login.
    Verifies email and password, returns user_id if successful.
    """
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({
                'error': 'Missing credentials',
                'message': 'Both email and password are required'
            }), 400

        # Find and verify user
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            return jsonify({
                'message': 'Login successful',
                'user_id': user.id
            })

        return jsonify({
            'error': 'Login failed',
            'message': 'Invalid email or password'
        }), 401

    except Exception as e:
        print(f"Error during login: {str(e)}")
        return jsonify({
            'error': 'Login failed',
            'message': str(e)
        }), 500

@app.route('/user/<int:user_id>/searches', methods=['GET'])
def get_user_searches(user_id):
    """
    Endpoint to retrieve all searches performed by a specific user.
    Returns a list of search results with their similar articles.
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'Invalid user_id provided'
            }), 404

        searches = ArticleSearch.query.filter_by(user_id=user_id).all()
        return jsonify({
            'message': 'Search history retrieved',
            'data': [search.to_dict() for search in searches]
        })

    except Exception as e:
        print(f"Error retrieving user searches: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve searches',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
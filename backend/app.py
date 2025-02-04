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
    """
    Main endpoint for article analysis and similarity search.
    Accepts a POST request with URL and user_id, returns analysis results.
    Checks database for existing results before performing new analysis.
    """
    try:
        data = request.json
        url = data.get('url')
        #user_id = data.get('user_id')

        if not url:
            return jsonify({
                'error': 'Missing required parameters',
                'message': 'Both URL and user_id are required'
            }), 400

        #user = User.query.get(user_id)
        #if not user:
         #   return jsonify({
          #      'error': 'User not found',
           #     'message': 'Invalid user_id provided'
            #}), 404

        from datetime import datetime, timedelta
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        recent_searches_count = ArticleSearch.query.filter(
            #ArticleSearch.user_id == user_id,
            ArticleSearch.created_at >= twenty_four_hours_ago
        ).count()

        if recent_searches_count >= 5:
            return jsonify({
                'error': 'Daily limit exceeded',
                'message': 'You have reached the limit of 5 articles per 24 hours',
                'searches_remaining': 0,
                'next_available': twenty_four_hours_ago + timedelta(hours=24)
            }), 429

        # Check if article has been analyzed before
        existing_search = ArticleSearch.query.filter_by(url=url).first()
        if existing_search:
            return jsonify({
                'message': 'Article already analyzed',
                'data': existing_search.to_dict()
            })


        print("LALALALLALALALLALAEHLAHLALHALEHLAEHLAEHAE")
        # Initialize GoogleSearch and perform analysis
        google_search = GoogleSearch(
            app.config['G_API_KEY'],
            app.config['CX_ID'],
            app.config['VISION_API_KEY'],
            url
        )

        # Get search results and article data
        article = google_search.article
        similar_articles = google_search.get_similar()
        reliability_score = random.randint(30, 95)
        objectivity_score = random.randint(30, 95)
        credibility_score = random.randint(30, 95)
        bias_score = random.randint(30, 95)

        # Create new article search record
        new_search = ArticleSearch(
            user_id=1,
            url=url,
            title=article.get('title', ''),
            reliability_score=reliability_score,
            objectivity_score=objectivity_score,
            credibility_score=credibility_score,
            bias_score=bias_score
        )
        db.session.add(new_search)
        db.session.flush()  # Get the ID of the new search

        # Store similar articles with similarity scores
        for similar in similar_articles:
            similar_article = SimilarArticle(
                main_article_id=new_search.id,
                title=similar.get('title', ''),
                url=similar.get('link', ''),
                similarity_score=random.uniform(0.1, 1.0)  # Replace with actual similarity calculation
            )
            db.session.add(similar_article)

        # Commit all database changes
        db.session.commit()

        # Return response with analysis results
        return jsonify({
            'message': f"Results for {url}",
            'data': new_search.to_dict()
        })

    except Exception as e:
        # Roll back any database changes if an error occurs
        db.session.rollback()
        print(f"Error processing request: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

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
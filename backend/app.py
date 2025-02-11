from dotenv import load_dotenv
from flask import Flask, request, jsonify, current_app
from flask_cors import CORS
from models import db, User, ArticleSearch, SimilarArticle
from GoogleSearch import GoogleSearch
import os
import random
import jwt
from datetime import datetime, timedelta
from functools import wraps


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
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

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


def token_required(f):
    """
    Decorator to protect endpoints with JWT authentication.
    Looks for a token in the Authorization header in the format: Bearer <token>
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Attempt to retrieve the token from the Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        try:
            # Decode the token using the app's secret key and HS256 algorithm
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token!'}), 401

        # Pass the current_user to the wrapped route function
        return f(current_user, *args, **kwargs)

    return decorated


@app.route('/scrap_and_search', methods=['POST'])
@token_required
def scrap_and_search(current_user):
    try:
        # Extract URL from request JSON
        data = request.json
        url = data.get('url')
        if not url:
            return jsonify({'error': 'URL parameter is required'}), 400

        # get the article from the database if it is already analyzed
        past_article = ArticleSearch.query.filter_by(url=url).first()
        if past_article:
            past_similar_articles = SimilarArticle.query.filter_by(main_article_id=past_article.id).all()

            article_data = {
                'url': past_article.url,
                'title': past_article.title
            }

            similar_articles_data = [{
                'url': article.url,
                'title': article.title,
                'similarity_score': article.similarity_score
            } for article in past_similar_articles]

            return jsonify({
                'reliability_score': past_article.reliability_score,
                'message': f"Results for {url}",
                'article': article_data,
                'similar_articles': similar_articles_data,
                'images_data': []
            })

        print(f"Processing URL: {url}")

        # Initialize GoogleSearch and perform scraping & custom search
        google_search = GoogleSearch(app.config['G_API_KEY'], app.config['CX_ID'], app.config['VISION_API_KEY'], url)
        similar_articles = google_search.get_similar()
        article = google_search.article  # Original article data
        images_data = google_search.get_images_data()  # Analyze images for web detection
        reliability_score = random.randint(30, 95)
        credibility_score = random.randint(30, 95)
        objectivity_score = random.randint(30, 95)
        bias_score = random.randint(30, 95)

        new_search = ArticleSearch(
            user_id=current_user.id,
            url=article['url'],
            title=article['title'],
            reliability_score=reliability_score,
            credibility_score=credibility_score,
            objectivity_score=objectivity_score,
            bias_score=bias_score
        )

        db.session.add(new_search)
        db.session.flush()

        similiar_articles_to_insert = [
            SimilarArticle(
                main_article_id=new_search.id,
                title=article['title'],
                url=article['url'],
                similarity_score=article['similarity_score']
            )
            for article in similar_articles
        ]

        if similiar_articles_to_insert:
            db.session.bulk_save_objects(similiar_articles_to_insert)

        db.session.commit()
        print(similar_articles)
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
    Verifies email and password and returns a JWT token if successful.
    """

    print("Login request received")
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
            # Generate a JWT token valid for 1 hour
            token = jwt.encode({
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(hours=1)
            }, app.config['JWT_SECRET_KEY'], algorithm='HS256')
            return jsonify({
                'message': 'Login successful',
                'token': token
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
@token_required
def get_user_searches(current_user, user_id):
    """
    Endpoint to retrieve all searches performed by a specific user.
    Returns a list of search results with their similar articles.
    This endpoint is protected and requires a valid JWT token.
    """
    # Ensure that the token belongs to the user making the request
    if current_user.id != user_id:
        return jsonify({'error': 'Unauthorized access'}), 401

    try:
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


@app.route('/article/<int:article_id>/', methods=['GET'])
@token_required
def get_article_data(article_id):
    """
    Endpoint to retrieve the data about the article, including similar articles
    :return:
    """
    try:
        article = ArticleSearch.query.filter_by(id=article_id).first()
        if article:
            similar_articles = SimilarArticle.filtery_by(main_article_id=article.id).all()

            article_data = {
                'url': article.url,
                'title': article.title
            }

            similar_articles_data = [{
                'url': article.url,
                'title': article.title,
                'similarity_score': article.similarity_score
            } for article in similar_articles]

            return jsonify({
                'reliability_score': article.reliability_score,
                'article': article_data,
                'similar_articles': similar_articles_data,
                'images_data': []
            })

    except Exception as e:
        print(f"Error retrieving article data: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve article data',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True)

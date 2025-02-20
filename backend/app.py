from dotenv import load_dotenv
from flask import Flask, request, jsonify, current_app
from flask_mail import Mail, Message
from flask_cors import CORS
from google.auth.transport import requests

from models import db, User, ArticleSearch, SimilarArticle, ArticleRequest
from GoogleSearch import GoogleSearch
import os
import random
import jwt
from datetime import datetime, timedelta
from functools import wraps
from website_checker import check_website_score
from email_verification.TOTPVerification import TOTPVerification


def create_app():
    """
    Creates and configures the Flask application with database and CORS support.
    Sets up all necessary configurations from environment variables.
    """
    app = Flask(__name__)
    CORS(app)
    load_dotenv()

    # Email Configuration
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

    # Initialize Flask-Mail
    mail = Mail(app)
    app.mail = mail  # Store mail instance in app context

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

    # Configure CORS to allow requests from your Chrome extension
    CORS(app, resources={
        r"/*": {
            "origins": [
                "chrome-extension://jknabnhokhooponmdfanhjonneoeckjm",  # Your extension ID
                "http://localhost:5000"  # Local development
            ],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    # Load all required API keys and configurations
    app.config['G_API_KEY'] = os.getenv("G_API_KEY")
    app.config['CX_ID'] = os.getenv("CX_ID")
    app.config['VISION_API_KEY'] = os.getenv("VISION_API_KEY")
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
    app.config['GOOGLE_CLIENT_ID'] = "1029076451566-fdl9g8jq85793ej9290cddon3dt2d6rt.apps.googleusercontent.com",
    app.config['EMAIL_VERIFICATION_SECRET_KEY'] = os.getenv('EMAIL_VERIFICATION_SECRET_KEY')

    # Database configuration
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME")

    required_vars = ['G_API_KEY', 'CX_ID', 'VISION_API_KEY',
                     'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME',
                     'MAIL_USERNAME', 'MAIL_PASSWORD']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    # Configure PostgreSQL database connection
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['DAILY_USAGE'] = 100
    # Initialize the database with the app
    db.init_app(app)

    return app


app = create_app()
verifier = TOTPVerification(app.config['EMAIL_VERIFICATION_SECRET_KEY'])


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

        print(f"Processing URL:")
        website_credibility = check_website_score(url)
        print(website_credibility['credibility_score'])
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

            past_request = ArticleRequest.query.filter_by(user_id=current_user.id,article_id=past_article.id).first()
            if not past_request:
                article_request = ArticleRequest(
                    user_id=current_user.id,
                    article_id=past_article.id
                )
                db.session.add(article_request)
                db.session.commit()

            return jsonify({
                'reliability_score': past_article.reliability_score,
                'message': f"Results for {url}",
                'article': article_data,
                'similar_articles': similar_articles_data,
                'images_data': [],
                'website_credibility': website_credibility['credibility_score']
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

        print("article : ", article)

        new_search = ArticleSearch(
            url=article['url'],
            title=article['title'],
            reliability_score=reliability_score,
            credibility_score=credibility_score,
            objectivity_score=objectivity_score,
            bias_score=bias_score
        )

        db.session.add(new_search)
        db.session.flush()

        article_request = ArticleRequest(
            user_id=current_user.id,
            article_id=new_search.id
        )
        db.session.add(article_request)

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
            'images_data': images_data,
            'website_credibility': website_credibility['credibility_score'],
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


@app.route('/user/searches', methods=['GET'])
@token_required
def get_user_searches(current_user):
    """
    Endpoint to retrieve all searches performed by a specific user.
    Returns a list of search results with their similar articles.
    This endpoint is protected and requires a valid JWT token.
    """
    try:
        searches = ArticleSearch.query.join(ArticleRequest) \
            .filter(ArticleRequest.user_id == current_user.id) \
            .all()

        articles_data = [{
            'url': article.url,
            'title': article.title,
            'reliability_score': article.reliability_score,
            'credibility_score': article.credibility_score,
            'objectivity_score': article.objectivity_score,
            'created_at': article.created_at,
            'id': article.id,
        } for article in searches]

        return jsonify({
            'message': 'Search history retrieved',
            'data': articles_data
        })

    except Exception as e:
        print(f"Error retrieving user searches: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve searches',
            'message': str(e)
        }), 500


@app.route('/article/<int:article_id>/', methods=['GET'])
@token_required
def get_article_data(current_user, article_id):
    try:
        article = ArticleSearch.query.filter_by(id=article_id).first()
        if article:
            # Note: change "filtery_by" to "query.filter_by" if that was a typo.
            similar_articles = SimilarArticle.query.filter_by(main_article_id=article.id).all()
            website_credibility = check_website_score(article.url)

            article_data = {
                'url': article.url,
                'title': article.title
            }

            similar_articles_data = [{
                'url': sim_article.url,
                'title': sim_article.title,
                'similarity_score': sim_article.similarity_score
            } for sim_article in similar_articles]

            return jsonify({
                'reliability_score': article.reliability_score,
                'article': article_data,
                'similar_articles': similar_articles_data,
                'images_data': [],
                'website_credibility': website_credibility['credibility_score'],
            })

    except Exception as e:
        print(f"Error retrieving article data: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve article data',
            'message': str(e)
        }), 500


def generate_verification_code():
    return str(random.randint(100000, 999999))


def send_verification_email(user_email, verification_code):
    """
    Sends an email verification code.
    """
    print(f"📧 Sending verification email to: {user_email} with code: {verification_code}")  # Debug log

    msg = Message(
        'Verify Your Email Address',
        recipients=[user_email]
    )
    msg.body = f"""
    Hello,

    Your email verification code is: {verification_code}

    Please enter this code in the verification page to confirm your email.

    If you did not request this, please ignore this email.

    Best regards,
    CheckMate
    """
    try:
        with current_app.app_context():
            current_app.mail.send(msg)
        print(" Email sent successfully!")
        print()
    except Exception as mail_error:
        print(f" Error sending verification email: {str(mail_error)}")  # Print error


@app.route("/user/send-verification-code", methods=["POST"])
def send_verification_code():
    try:
        email = request.json.get("email")
        if not email:
            return jsonify({"error": "Missing email"}), 400

        code = verifier.generate_code(email)
        send_verification_email(email, code)
        print('code is:', code)
        return jsonify({"message": "Code sent"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/user/verify-code", methods=["POST"])
def verify_code():
    try:
        email = request.json.get("email")
        code = request.json.get("code")

        print('code we got is:', code)
        if verifier.verify_code(email, code):
            return jsonify({"message": "Verified"}), 200
        return jsonify({"error": "Invalid code"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/user/verify-email", methods=["POST"])
def verify_email():
    """
    Endpoint to verify the email using the code sent to the user.
    """
    try:
        data = request.json
        email = data.get("email")
        code = data.get("code")

        if not email or not code:
            return jsonify({"error": "Missing email or code"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        if user.verification_code != code:
            return jsonify({"error": "Invalid verification code"}), 400

        user.is_verified = True
        user.verification_code = None  # Remove code after successful verification
        db.session.commit()

        return jsonify({"message": "Email verified successfully"}), 200

    except Exception as e:
        print(f"Error in email verification: {str(e)}")
        return jsonify({"error": "Verification failed", "message": str(e)}), 500


@app.route('/user/update-plan', methods=['POST'])
@token_required
def update_user_plan(current_user):
    try:
        data = request.json
        plan = data.get('plan')

        if not plan:
            return jsonify({'error': 'Plan is required'}), 400

        current_user.subscription_plan = plan
        db.session.commit()

        return jsonify({
            'message': f'Plan updated to {plan}',
            'plan': plan
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating plan: {str(e)}")  # Add logging
        return jsonify({'error': 'Failed to update plan'}), 500


@app.route('/login/google/callback', methods=['POST'])
def google_auth_callback():
    try:
        data = request.json
        google_token = data.get('google_token')
        email = data.get('email')
        name = data.get('name')

        if not google_token or not email:
            return jsonify({
                'error': 'Missing credentials',
                'message': 'Google token and email are required'
            }), 400

        # Verify the token with Google
        google_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/tokeninfo',
            params={'access_token': google_token}
        )

        if not google_response.ok:
            return jsonify({
                'error': 'Invalid token',
                'message': 'Failed to verify Google token'
            }), 401

        google_data = google_response.json()

        # Verify the audience matches our client ID
        if google_data.get('aud') != app.config['GOOGLE_CLIENT_ID']:
            return jsonify({
                'error': 'Invalid client',
                'message': 'Token was not issued for this application'
            }), 401

        # Check if user exists
        user = User.query.filter_by(email=email).first()

        if not user:
            # Create new user
            user = User(
                email=email,
                name=name,
                google_id=google_data.get('sub')
            )
            # Set a random password for Google users
            random_password = os.urandom(24).hex()
            user.set_password(random_password)

            db.session.add(user)
            db.session.commit()

        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=1)
        }, app.config['JWT_SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'message': 'Login successful',
            'token': token
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error during Google authentication: {str(e)}")
        return jsonify({
            'error': 'Authentication failed',
            'message': str(e)
        }), 500


@app.route('/user/update-password', methods=['POST'])
@token_required
def update_password(current_user):
    try:
        data = request.json
        new_password = data.get('new_password')

        if not new_password:
            return jsonify({'error': 'New password is required'}), 400

        # Update the password with hash
        current_user.set_password(new_password)
        db.session.commit()

        return jsonify({
            'message': 'Password updated successfully',
            'status': 'success'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating password: {str(e)}")  # Add logging
        return jsonify({'error': 'Failed to update password'}), 500


@app.route('/user/update-forgotten-password', methods=['POST'])
def update_forgotten_password():
    try:
        data = request.json
        new_password = data.get('new_password')
        email = data.get('email')

        if not new_password:
            return jsonify({'error': 'New password is required'}), 400

        user = User.query.filter_by(email=email).first()
        # Update the password with hash
        user.set_password(new_password)
        db.session.commit()

        return jsonify({
            'message': 'Password updated successfully',
            'status': 'success'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating password: {str(e)}")  # Add logging
        return jsonify({'error': 'Failed to update password'}), 500

@app.route('/report', methods=['POST'])
@token_required
def report(current_user):
    try:
        data = request.json
        report_type = data.get('reportType', 'Bug')
        message_content = data.get('message', '')
        reporter_email = current_user.email

        subject = f"New Report: {report_type}"
        body = (
            f"Report Type: {report_type}\n\n"
            f"Message:\n{message_content}\n\n"
            f"Reporter Email: {reporter_email}"
        )

        msg = Message(subject=subject, recipients=[os.getenv('MAIL_DEFAULT_SENDER')])
        msg.body = body

        current_app.mail.send(msg)
        return jsonify({'message': 'Report sent successfully.'}), 200

    except Exception as e:
        print("Error sending email:", e)
        return jsonify({'error': 'Failed to send report.'}), 500

@app.route('/user/stats', methods=['GET'])
@token_required
def fetch_stats(current_user):
    try:
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)

        recent_articles = ArticleSearch.query.join(ArticleRequest) \
            .filter(
            ArticleRequest.user_id == current_user.id,
            ArticleRequest.created_at >= twenty_four_hours_ago
        ).all()

        articles_data = [{
            'url': article.url,
            'title': article.title,
            'reliability_score': article.reliability_score,
            'credibility_score': article.credibility_score,
            'objectivity_score': article.objectivity_score,
            'created_at': article.created_at,
            'id': article.id,
        } for article in recent_articles]

        return jsonify({
            'articles_analyzed': len(recent_articles),
            'daily_usage_left': app.config['DAILY_USAGE'] - len(recent_articles),
            'articles': articles_data
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error fetching stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch daily stats'}), 500


if __name__ == '__main__':
    app.run(debug=True)

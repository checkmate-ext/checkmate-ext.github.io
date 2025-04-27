import requests
import iyzipay
from dotenv import load_dotenv
from flask import Flask, request, jsonify, current_app
from flask_mail import Mail, Message
from flask_cors import CORS
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy import func
from itsdangerous import URLSafeTimedSerializer
from flask import url_for

import hmac
import hashlib
import base64
import string
from models import db, User, ArticleSearch, SimilarArticle, ArticleRequest
from ArticleAnalyzer import ArticleAnalyzer, validate_article_data, ArticleExtractionError
import os
import random
import jwt
import json
from datetime import datetime, timedelta
from functools import wraps
from website_checker import check_website_score
from email_verification.TOTPVerification import TOTPVerification

PLAN_PRICES = {
    'premium': '49.99',
    'enterprise': '199.99'
}


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

    # Load İyzico credentials from .env
    app.config['IYZICO_API_KEY'] = os.getenv('IYZICO_API_KEY')
    app.config['IYZICO_SECRET_KEY'] = os.getenv('IYZICO_SECRET_KEY')

    # Initialize Flask-Mail
    mail = Mail(app)
    app.mail = mail  # Store mail instance in app context

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

    # Configure CORS to allow requests from your Chrome extension
    CORS(app, resources={
        r"/*": {
            "origins": [
                "chrome-extension://kmgjckbbdjcmoeflecnlmndlgdjfkdfl",  # Your extension ID
                "http://localhost:5000",  # Local development
                "http://172.20.10.9:5000",
                "capacitor://localhost",
                "http://localhost",
                "*"  # Allow all origins (use for testing only!)
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
    app.config['EMAIL_VERIFICATION_SECRET_KEY'] = os.getenv('EMAIL_VERIFICATION_SECRET_KEY')
    app.config['GOOGLE_CLIENT_ID'] = "94517049358-tgqqobr0kk38dofd1h5l0bm019url60c.apps.googleusercontent.com"
    app.config["SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

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


# helper to build options
def iyzi_options():
    return {
        'api_key': current_app.config['IYZICO_API_KEY'],
        'secret_key': current_app.config['IYZICO_SECRET_KEY'],
        'base_url': 'sandbox-api.iyzipay.com'
    }


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
    print("[DEBUG] scrap_and_search: Endpoint called for user:", current_user.email)
    try:
        data = request.json
        url = data.get('url')
        if not url:
            print("[DEBUG] scrap_and_search: URL parameter missing")
            return jsonify({'error': 'URL parameter is required'}), 400
        print(f"[DEBUG] scrap_and_search: Processing URL: {url}")

        website_credibility = check_website_score(url)
        cred_score = website_credibility.get('credibility_score')
        if cred_score is None:
            cred_score = 1
        print("[DEBUG] scrap_and_search: Website credibility score:", website_credibility['credibility_score'])

        past_article = ArticleSearch.query.filter_by(url=url).first()
        if past_article:
            print("[DEBUG] scrap_and_search: Found past article with ID:", past_article.id)
            past_similar_articles = SimilarArticle.query.filter_by(main_article_id=past_article.id).all()
            print("[DEBUG] scrap_and_search: Found", len(past_similar_articles), "similar articles from database")

            article_data = {
                'url': past_article.url,
                'title': past_article.title
            }

            similar_articles_data = [{
                'url': article.url,
                'title': article.title,
                'similarity_score': article.similarity_score
            } for article in past_similar_articles]

            past_request = ArticleRequest.query.filter_by(user_id=current_user.id, article_id=past_article.id).first()
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
                'website_credibility': website_credibility['credibility_score'],
                'article_id': past_article.id,
                'objectivity_score': past_article.objectivity_score,
                'bias_prediction': past_article.bias_prediction,
                'bias_probabilities': past_article.bias_probabilities
            })

        print(f"Processing URL: {url}")

        print(f"[DEBUG] scrap_and_search: No past article found. Proceeding to extract new article for URL: {url}")
        try:
            google_search = ArticleAnalyzer(
                app.config['G_API_KEY'],
                app.config['CX_ID'],
                app.config['VISION_API_KEY'],
                url
            )
            if not validate_article_data(google_search.article):
                print("[DEBUG] scrap_and_search: Article validation failed")
                return jsonify({'error': f"Could not extract meaningful content from {url}"}), 400

            similar_articles = google_search.get_similar()
            article = google_search.article
            print("[DEBUG] scrap_and_search: Article extracted successfully.")
            images_data = []
        except Exception as e:
            print("[DEBUG] scrap_and_search: Exception during article extraction:", e)
            return jsonify({'error': str(e)}), 400

        print("article : ", article)

        new_search = ArticleSearch(
            url=article['url'],
            title=article['title'],
            reliability_score=article.get('reliability_score', -1),
            credibility_score=cred_score,
            objectivity_score=article.get('objectivity_score', -1),  # Fixed: Use get() with default
            bias_prediction=article.get('bias_prediction', -1),
            bias_probabilities=article.get('bias_probabilities', -1)
        )

        db.session.add(new_search)
        db.session.flush()

        article_request = ArticleRequest(
            user_id=current_user.id,
            article_id=new_search.id
        )

        db.session.add(article_request)

        similar_articles_to_insert = []
        for sim in similar_articles:
            safe_title = (sim.get('title') or '')[:500]
            safe_url   = (sim.get('url')   or '')[:500]
            sim_score  = sim.get('similarity_score', 0.0)
            similar_articles_to_insert.append(
                SimilarArticle(
                    main_article_id=new_search.id,
                    title=safe_title,
                    url=safe_url,
                    similarity_score=sim_score
                )
            )

        if similar_articles_to_insert:
            db.session.bulk_save_objects(similar_articles_to_insert)

        db.session.commit()
        print(similar_articles)
        print("[DEBUG] scrap_and_search: Database commit successful. Similar articles count:", len(similar_articles))
        return jsonify({
            'reliability_score': article['reliability_score'],
            'message': f"Results for {url}",
            'article': article,
            'similar_articles': similar_articles,
            'images_data': images_data,
            'website_credibility': cred_score,
            'article_id': new_search.id,
            'objectivity_score': article['objectivity_score'],
            'bias_prediction': article['bias_prediction'],
            'bias_probabilities': article['bias_probabilities']
        })

    except Exception as e:
        # Rollback any database changes if there was an error
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# --- Helper functions for token generation ---
def generate_confirmation_token(email):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt='email-confirm-salt')


def confirm_token(token, expiration=3600):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = serializer.loads(token, salt='email-confirm-salt', max_age=expiration)
    except Exception as e:
        print(f"[DEBUG] Token verification error: {e}")
        return False
    return email


# --- Email sending functions ---
def send_registration_email(user_email, form_link):
    msg = Message("Welcome to CheckMate!",
                  recipients=[user_email])
    msg.body = (
        f"Thank you for registering with CheckMate!\n\n"
        f"We'd love to hear your feedback. Please fill out this brief survey:\n{form_link}\n\n"
        f"Best regards,\n"
        f"The CheckMate Team"
    )
    try:
        current_app.mail.send(msg)
        print(f"Registration email sent to {user_email}")
    except Exception as e:
        print(f"Error sending registration email to {user_email}: {e}")


def send_confirmation_email(user_email, token):
    confirm_url = url_for('confirm_email', token=token, _external=True)
    msg = Message("Confirm Your Email - CheckMate",
                  recipients=[user_email])
    msg.body = (
        f"Welcome to CheckMate!\n\n"
        f"Please click the link below to confirm your email address and complete your registration:\n\n"
        f"{confirm_url}\n\n"
        f"If you did not register, please ignore this email.\n\n"
        f"Thank you,\n"
        f"The CheckMate Team"
    )
    try:
        current_app.mail.send(msg)
        print(f"[DEBUG] Confirmation email sent to {user_email}")
    except Exception as e:
        print(f"[DEBUG] Error sending confirmation email to {user_email}: {e}")


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
        if User.query.filter_by(email=email).first():
            return jsonify({
                'error': 'Registration failed',
                'message': 'Email already registered'
            }), 400
        new_user = User(email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        form_link = "https://forms.gle/8RzCPFMX5YaxuWW58"
        send_registration_email(email, form_link)
        token = generate_confirmation_token(email)
        send_confirmation_email(email, token)
        return jsonify({
            'message': 'User registered successfully. A confirmation email has been sent.',
            'user_id': new_user.id
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error registering user: {str(e)}")
        return jsonify({
            'error': 'Registration failed',
            'message': str(e)
        }), 500


@app.route('/user/confirm-email')
def confirm_email():
    token = request.args.get('token')
    if not token:
        return "Missing token", 400
    email = confirm_token(token)
    if not email:
        return "The confirmation link is invalid or has expired.", 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return "User not found.", 404
    user.is_verified = True
    db.session.commit()
    return "Your email has been confirmed. Thank you!"


@app.route('/user/login', methods=['POST'])
def login_user():
    """
    Endpoint for user login.
    Verifies email and password and returns a JWT token if successful.
    """
    print("[DEBUG] Login request received")
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            print("[DEBUG] Missing credentials: email or password not provided")
            return jsonify({
                'error': 'Missing credentials',
                'message': 'Both email and password are required'
            }), 400

        # Find the user by email
        user = User.query.filter_by(email=email).first()
        if not user:
            print(f"[DEBUG] User not found for email: {email}")
            return jsonify({
                'error': 'Login failed',
                'message': 'Invalid email or password'
            }), 401

        # Debug: log the user's verification status
        print(f"[DEBUG] Found user: {user.email}, is_verified: {user.is_verified}")

        # Verify the password
        if not user.check_password(password):
            print("[DEBUG] Password check failed for user:", email)
            return jsonify({
                'error': 'Login failed',
                'message': 'Invalid email or password'
            }), 401

        # Optionally enforce email confirmation (uncomment if needed)
        if not user.is_verified:
            print("[DEBUG] User email is not confirmed.")
            return jsonify({
                'error': 'Login failed',
                'message': 'Email not confirmed. Please confirm your email before logging in.'
            }), 401

        # Set token expiration based on the "rememberMe" flag:
        # If rememberMe is true, the token will expire in 30 days; otherwise, in 1 hour.
        if data.get('rememberMe'):
            expiration = timedelta(days=30)
            print("[DEBUG] Remember me is checked, setting token expiration to 30 days")
        else:
            expiration = timedelta(hours=1)
            print("[DEBUG] Remember me is not checked, setting token expiration to 1 hour")

        # Generate a JWT token with the appropriate expiration:
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + expiration
        }, app.config['JWT_SECRET_KEY'], algorithm='HS256')
        print(f"[DEBUG] Generated JWT token: {token}")

        user_data = {
            'id': user.id,
            'email': user.email,
            'subscription_plan': user.subscription_plan,
            'created_at': user.created_at.isoformat(),
        }

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user_data
        })
    except Exception as e:
        print(f"[DEBUG] Error during login: {str(e)}")
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
            'bias_prediction': article.bias_prediction,
            'bias_probabilities': article.bias_probabilities,
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
                'message': f"Results for {article.url}",
                'article': article_data,
                'similar_articles': similar_articles_data,
                'images_data': [],
                'website_credibility': website_credibility['credibility_score'],
                'article_id': article.id,
                'objectivity_score': article.objectivity_score,
                'bias_prediction': article.bias_prediction,
                'bias_probabilities': article.bias_probabilities
            })
        else:
            return jsonify({
                'error': 'Article not found',
                'message': f'Article with ID {article_id} does not exist'
            }), 404

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


@app.route('/user/subscribe', methods=['POST'])
@token_required
def subscribe_user(current_user):
    data = request.json
    plan = data.get('plan')
    payment_token = data.get('paymentToken')
    card_user_key = data.get('cardUserKey') or current_user.iyzico_customer_id

    if plan not in PLAN_PRICES or not payment_token:
        return jsonify({'error': 'Plan and valid paymentToken required'}), 400

    price = PLAN_PRICES[plan]
    options = {
        'api_key': current_app.config['IYZICO_API_KEY'],
        'secret_key': current_app.config['IYZICO_SECRET_KEY'],
        'base_url': 'https://sandbox-api.iyzipay.com'
    }

    # Updated to include currency, basketId, registerCard
    payment_request = {
        'locale': 'tr',
        'conversationId': str(current_user.id),
        'price': price,
        'paidPrice': price,
        'currency': 'TRY',
        'installment': '1',
        'paymentChannel': 'WEB',
        'basketId': f"PLAN_{plan}_{current_user.id}",
        'paymentGroup': 'PRODUCT',
        'paymentCard': {
            'cardUserKey': card_user_key or '',
            'cardToken': payment_token,
            'registerCard': '1'
        },
        'buyer': {
            'id': str(current_user.id),
            'email': current_user.email,
            'name': current_user.email.split('@')[0],
            'surname': '',
            'gsmNumber': '',
            'identityNumber': '',
            'registrationAddress': '',
            'ip': request.remote_addr,
            'city': '',
            'country': 'Turkey',
            'zipCode': ''
        },
        'basketItems': [{
            'id': f"PLAN_{plan}_{current_user.id}",
            'price': price,
            'name': f'{plan} Subscription',
            'category1': 'Subscription',
            'itemType': 'VIRTUAL'
        }]
    }

    # execute the payment and parse JSON
    raw_resp = iyzipay.Payment().create(payment_request, options).read()
    payment_resp = json.loads(raw_resp)

    if payment_resp.get('status') != 'success':
        return jsonify({
            'error': 'Payment failed',
            'message': payment_resp.get('errorMessage', 'Card was declined')
        }), 402

    # save new cardUserKey if returned
    txn = (payment_resp.get('itemTransactions') or [{}])[0]
    if txn.get('cardUserKey'):
        current_user.iyzico_customer_id = txn['cardUserKey']
        db.session.commit()

    # finally upgrade plan
    current_user.subscription_plan = plan
    db.session.commit()

    return jsonify({
        'message': 'Subscription successful',
        'plan': plan
    }), 200


def generate_iyzico_v2_headers(uri: str, body: str, api_key: str, secret_key: str):
    """
    Implements iyzico’s HMACSHA256 identity auth:
     1. encryptedData = HMACSHA256(randomKey + uri + requestBody, secretKey)
     2. base64Encoded = Base64("apiKey:"+apiKey+"&randomKey:"+randomKey+"&signature:"+encryptedData)
     3. Authorization = "IYZWSv2 " + base64Encoded
     4. x-iyzi-rnd = randomKey
    :contentReference[oaicite:0]{index=0}
    """
    # 1) randomKey (x-iyzi-rnd)
    random_key = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
    # 2) encryptedData: HMACSHA256(randomKey + uri + body, secretKey)
    mac = hmac.new(
        secret_key.encode('utf-8'),
        msg=(random_key + uri + body).encode('utf-8'),
        digestmod=hashlib.sha256
    ).hexdigest()
    # 3) build and base64-encode the authorization string
    plain = f"apiKey:{api_key}&randomKey:{random_key}&signature:{mac}"
    b64 = base64.b64encode(plain.encode('utf-8')).decode('utf-8')
    # 4) return both headers
    return {
        'Content-Type': 'application/json',
        'Authorization': f"IYZWSv2 {b64}",
        'x-iyzi-rnd': random_key
    }


@app.route('/cf/initialize', methods=['POST'])
@token_required
def cf_initialize(current_user):
    data = request.json or {}
    payload = {
        "locale": "tr",
        "conversationId": str(current_user.id),
        "price": data.get("price"),
        "paidPrice": data.get("price"),
        "currency": "TRY",
        "basketId": f"PLAN_{data.get('plan')}_{current_user.id}",
        "paymentGroup": "PRODUCT",
        "callbackUrl": data.get("callbackUrl"),
        "buyer": {
            "id": str(current_user.id),
            "name": current_user.email.split('@')[0],
            "surname": current_user.email.split('@')[0],
            "email": current_user.email,
            "identityNumber": "123123",
            "registrationAddress": "123123",
            "city": "123",
            "country": "Turkey",
            "zipCode": "123",
            "ip": request.remote_addr
        },
        # <<< ADD THESE TWO SECTIONS >>>
        "shippingAddress": {
            "contactName": current_user.email.split('@')[0],
            "city": "1234",
            "country": "Turkey",
            "address": "12412",
            "zipCode": "12412"
        },
        "billingAddress": {
            "contactName": current_user.email.split('@')[0],
            "city": "124",
            "country": "Turkey",
            "address": "124",
            "zipCode": "124"
        },
        # <<< END ADDITIONS >>>
        "basketItems": [{
            "id": f"PLAN_{data.get('plan')}_{current_user.id}",
            "price": data.get("price"),
            "name": f"{data.get('plan').title()} Subscription",
            "category1": "Subscription",
            "itemType": "VIRTUAL"
        }]
    }

    # 1) Serialize body JSON with no spaces
    body_json = json.dumps(payload, separators=(',', ':'))
    # 2) Build headers per iyzico HMACSHA256 spec
    uri = "/payment/iyzipos/checkoutform/initialize/auth/ecom"
    api_key = current_app.config['IYZICO_API_KEY']
    secret = current_app.config['IYZICO_SECRET_KEY']
    headers = generate_iyzico_v2_headers(uri, body_json, api_key, secret)
    # 3) POST to sandbox endpoint
    url = f"https://sandbox-api.iyzipay.com{uri}"
    resp = requests.post(url, data=body_json, headers=headers)
    result = resp.json()
    print(result)

    if result.get("status") != "success":
        return jsonify({"error": result.get("errorMessage")}), 400

    return jsonify({
        "checkoutFormContent": result["checkoutFormContent"],
        "paymentPageUrl": result["paymentPageUrl"],
        "token": result["token"]
    }), 200


# ─── Query CheckoutForm Result ───
@app.route('/cf/query', methods=['POST'])
@token_required
def cf_query(current_user):
    data = request.json or {}
    payload = {
        "locale": "tr",
        "conversationId": str(current_user.id),
        "token": data.get("token")
    }
    print("token is: ", data.get("token"))
    body_json = json.dumps(payload, separators=(',', ':'))
    uri = "/payment/iyzipos/checkoutform/auth/ecom/detail"
    api_key = current_app.config['IYZICO_API_KEY']
    secret = current_app.config['IYZICO_SECRET_KEY']
    headers = generate_iyzico_v2_headers(uri, body_json, api_key, secret)

    url = f"https://sandbox-api.iyzipay.com{uri}"
    resp = requests.post(url, data=body_json, headers=headers)
    result = resp.json()
    print(result)
    if result.get("status") != "success":
        return jsonify({"error": result.get("errorMessage")}), 400

    if result.get("paymentStatus") == "SUCCESS":
        current_user.subscription_plan = data.get("plan")
        db.session.commit()

    return jsonify(result), 200


@app.route('/auth/google_userinfo', methods=['POST'])
def google_userinfo_auth():
    """
    Endpoint for Google Sign-In authentication using userinfo approach.
    Receives Google user info and access token from the frontend,
    verifies the token against Google's API, and authenticates the user.
    """
    try:
        data = request.json
        google_id = data.get('google_id')
        email = data.get('email')
        name = data.get('name', '')
        access_token = data.get('access_token')

        if not google_id or not email or not access_token:
            return jsonify({'error': 'Missing required information'}), 400

        # Verify the token with Google by validating it against the tokeninfo endpoint
        try:
            tokeninfo_url = f"https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={access_token}"
            response = requests.get(tokeninfo_url)

            if response.status_code != 200:
                return jsonify({'error': 'Invalid access token'}), 401

            token_info = response.json()

            # Verify the audience matches your client ID
            if token_info.get('aud') != app.config['GOOGLE_CLIENT_ID']:
                return jsonify({'error': 'Token not intended for this application'}), 401

            # Verify that the token's user ID matches the one sent
            if token_info.get('sub') != google_id:
                return jsonify({'error': 'User ID mismatch'}), 401

        except Exception as e:
            return jsonify({'error': 'Failed to verify token', 'message': str(e)}), 401

        # Find user by Google ID or email
        user = User.query.filter_by(google_id=google_id).first()

        if not user:
            user = User.query.filter_by(email=email).first()
            if user:
                # Update existing user with Google ID
                user.google_id = google_id
                user.is_verified = True
            else:
                # create new user
                user = User(
                    email=email,
                    google_id=google_id,
                    subscription_plan="Free",
                    is_verified=True
                )
                # Set a random password for Google users
                random_password = os.urandom(24).hex()
                user.set_password(random_password)

                db.session.add(user)

            db.session.commit()

        # Generate JWT token for your app
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=1)
        }, app.config['JWT_SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'message': 'Google authentication successful',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'subscription_plan': user.subscription_plan
            }
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error during Google authentication: {str(e)}")
        return jsonify({
            'error': 'Authentication failed',
            'message': str(e)
        }), 500


@app.route('/auth/facebook', methods=['POST'])
def facebook_auth():
    try:
        data = request.json
        facebook_token = data.get('facebook_token')

        if not facebook_token:
            return jsonify({'error': 'Missing Facebook token'}), 400

        # Step 1: Verify the token with Facebook Graph API
        app_id = os.getenv('FACEBOOK_APP_ID')
        app_secret = os.getenv('FACEBOOK_APP_SECRET')

        # First, get app token for verification
        app_token_url = f"https://graph.facebook.com/oauth/access_token?client_id={app_id}&client_secret={app_secret}&grant_type=client_credentials"
        app_token_response = requests.get(app_token_url)

        if not app_token_response.ok:
            return jsonify({'error': 'Failed to obtain app token for verification'}), 500

        app_token = app_token_response.json().get('access_token')

        # Verify the user token
        token_verification_url = f"https://graph.facebook.com/debug_token?input_token={facebook_token}&access_token={app_token}"
        verification_response = requests.get(token_verification_url)

        if not verification_response.ok:
            return jsonify({'error': 'Failed to verify token with Facebook'}), 401

        verification_data = verification_response.json().get('data', {})

        # Check if token is valid
        if not verification_data.get('is_valid'):
            return jsonify({'error': 'Invalid Facebook token'}), 401

        print('huhauhaha')
        # Step 2: Get user data from Facebook
        user_data_url = f"https://graph.facebook.com/me?fields=id,name,email&access_token={facebook_token}"
        user_response = requests.get(user_data_url)

        if not user_response.ok:
            return jsonify({'error': 'Failed to get user data from Facebook'}), 500

        fb_user_data = user_response.json()
        facebook_id = fb_user_data.get('id')
        email = fb_user_data.get('email')
        name = fb_user_data.get('name', '')

        if not facebook_id or not email:
            return jsonify({'error': 'Facebook account missing required information (email)'}), 400

        # Step 3: Find user by Facebook ID or email
        user = User.query.filter_by(facebook_id=facebook_id).first()

        if not user:
            # Check if a user with this email exists
            user = User.query.filter_by(email=email).first()

            if user:
                # Update existing user with Facebook ID
                user.facebook_id = facebook_id
                # Don't try to set name if not in model
            else:
                # Create new user - only use fields that exist in your model
                user = User(
                    email=email,
                    facebook_id=facebook_id,
                    is_verified=True,  # Facebook users are considered verified
                    subscription_plan="Free"
                )

                # Set a random password for Facebook users
                random_password = os.urandom(24).hex()
                user.set_password(random_password)

                db.session.add(user)

            db.session.commit()

        # Step 4: Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=1)
        }, app.config['JWT_SECRET_KEY'], algorithm='HS256')

        # Return only fields that exist in your User model
        return jsonify({
            'message': 'Facebook authentication successful',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'subscription_plan': user.subscription_plan
                # Don't include 'name' here
            }
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error during Facebook authentication: {str(e)}")
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
        print(current_user.email)
        # Get timeframes for different metrics
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        # Get recent articles (last 24 hours)
        recent_articles = ArticleSearch.query.join(ArticleRequest).filter(
            ArticleRequest.user_id == current_user.id,
            ArticleRequest.created_at >= twenty_four_hours_ago
        ).all()

        # Get weekly articles
        weekly_articles = ArticleSearch.query.join(ArticleRequest).filter(
            ArticleRequest.user_id == current_user.id,
            ArticleRequest.created_at >= seven_days_ago
        ).all()

        # Get monthly articles
        monthly_articles = ArticleSearch.query.join(ArticleRequest).filter(
            ArticleRequest.user_id == current_user.id,
            ArticleRequest.created_at >= thirty_days_ago
        ).all()

        # Get all-time articles count
        total_articles = ArticleRequest.query.filter(
            ArticleRequest.user_id == current_user.id
        ).count()

        # Calculate average scores for accuracy metrics
        # Daily (last 24 hours)
        daily_scores = []
        for article in recent_articles:
            daily_scores.append(article.reliability_score)
        avg_daily_accuracy = sum(daily_scores) / len(daily_scores) if daily_scores else 0

        # Weekly
        weekly_scores = []
        for article in weekly_articles:
            weekly_scores.append(article.reliability_score)
        avg_weekly_accuracy = sum(weekly_scores) / len(weekly_scores) if weekly_scores else 0

        # Monthly
        monthly_scores = []
        for article in monthly_articles:
            monthly_scores.append(article.reliability_score)
        avg_monthly_accuracy = sum(monthly_scores) / len(monthly_scores) if monthly_scores else 0

        # Get article distribution by day for the past week
        daily_counts = db.session.query(
            func.date(ArticleRequest.created_at).label('date'),
            func.count(ArticleRequest.article_id).label('count')
        ).filter(
            ArticleRequest.user_id == current_user.id,
            ArticleRequest.created_at >= seven_days_ago
        ).group_by(
            func.date(ArticleRequest.created_at)
        ).all()

        daily_distribution = {
            str(day.date): day.count for day in daily_counts
        }

        # Get article distribution by week (last 4 weeks)
        four_weeks_ago = datetime.utcnow() - timedelta(weeks=4)
        weekly_counts = db.session.query(
            func.date_trunc('week', ArticleRequest.created_at).label('week'),
            func.count(ArticleRequest.article_id).label('count')
        ).filter(
            ArticleRequest.user_id == current_user.id,
            ArticleRequest.created_at >= four_weeks_ago
        ).group_by(
            func.date_trunc('week', ArticleRequest.created_at)
        ).all()

        weekly_distribution = {
            str(week.week.date()): week.count for week in weekly_counts
        }

        # Get article distribution by month (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        monthly_counts = db.session.query(
            func.date_trunc('month', ArticleRequest.created_at).label('month'),
            func.count(ArticleRequest.article_id).label('count')
        ).filter(
            ArticleRequest.user_id == current_user.id,
            ArticleRequest.created_at >= six_months_ago
        ).group_by(
            func.date_trunc('month', ArticleRequest.created_at)
        ).all()

        monthly_distribution = {
            str(month.month.date()): month.count for month in monthly_counts
        }

        # Format recent articles data
        articles_data = [{
            'url': article.url,
            'title': article.title,
            'reliability_score': article.reliability_score,
            'credibility_score': article.credibility_score,
            'objectivity_score': article.objectivity_score,
            'bias_prediction': article.bias_prediction,
            'bias_probabilities': article.bias_probabilities,
            'created_at': article.created_at.isoformat(),
            'id': article.id,
        } for article in recent_articles]

        return jsonify({
            # Daily stats
            'articles_analyzed': len(recent_articles),
            'daily_usage_left': app.config['DAILY_USAGE'] - len(recent_articles),
            'daily_accuracy': avg_daily_accuracy,
            'daily_distribution': daily_distribution,

            # Weekly stats
            'articles_analyzed_weekly': len(weekly_articles),
            'weekly_accuracy': avg_weekly_accuracy,
            'weekly_distribution': weekly_distribution,

            # Monthly stats
            'articles_analyzed_monthly': len(monthly_articles),
            'monthly_accuracy': avg_monthly_accuracy,
            'monthly_distribution': monthly_distribution,

            # Other stats
            'total_articles': total_articles,
            'articles': articles_data,
            'subscription_plan': current_user.subscription_plan,
            'daily_limit': app.config['DAILY_USAGE']
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error fetching stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch stats'}), 500


if __name__ == '__main__':
    # Run the app on all network interfaces (0.0.0.0) instead of just localhost
    app.run(host='0.0.0.0', port=5000, debug=True)

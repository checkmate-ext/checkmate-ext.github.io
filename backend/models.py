from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    subscription_plan = db.Column(db.String(50), default="Free")
    article_requests = db.relationship('ArticleRequest', backref='user', lazy=True)
    google_id = db.Column(db.String(128), unique=True, nullable=True)
    facebook_id = db.Column(db.String(128), nullable=True, unique=True)
    is_verified = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class ArticleSearch(db.Model):
    __tablename__ = 'article_searches'

    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(500), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    reliability_score = db.Column(db.Float(precision=53))
    credibility_score = db.Column(db.Float(precision=53))
    objectivity_score = db.Column(db.Float(precision=53))
    bias_prediction = db.Column(db.String(50))  # to store "Left", "Center", or "Right"
    bias_probabilities = db.Column(db.JSON)       # to store the entire probabilities dictionary
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    similar_articles = db.relationship('SimilarArticle', backref='main_article', lazy=True)
    requests = db.relationship('ArticleRequest', backref='article', lazy=True)

class SimilarArticle(db.Model):
    __tablename__ = 'similar_articles'

    id = db.Column(db.Integer, primary_key=True)
    main_article_id = db.Column(db.Integer, db.ForeignKey('article_searches.id'), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    similarity_score = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'title': self.title,
            'url': self.url,
            'similarity_score': self.similarity_score
        }


class ArticleRequest(db.Model):
    __tablename__ = 'article_requests'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('article_searches.id'), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

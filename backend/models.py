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
    searches = db.relationship('ArticleSearch', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class ArticleSearch(db.Model):
    __tablename__ = 'article_searches'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    reliability_score = db.Column(db.Float(precision=53))
    credibility_score = db.Column(db.Float(precision=53))
    objectivity_score = db.Column(db.Float(precision=53))
    bias_score = db.Column(db.Float(precision=53))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    similar_articles = db.relationship('SimilarArticle', backref='main_article', lazy=True)

    def to_dict(self):
        return {
            'article': {
                'title': self.title,
                'url': self.url,
            },
            'reliability_score': self.reliability_score,
            'credibility_score': self.credibility_score,
            'objectivity_score': self.objectivity_score,
            'bias_score': self.bias_score,
            'similar_articles': [article.to_dict() for article in self.similar_articles],
            'created_at': self.created_at.isoformat()
        }

class SimilarArticle(db.Model):
    __tablename__ = 'similar_articles'

    id = db.Column(db.Integer, primary_key=True)
    main_article_id = db.Column(db.Integer, db.ForeignKey('article_searches.id'), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    similarity_score = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
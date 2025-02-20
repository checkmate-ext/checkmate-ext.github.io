"""Migration script to add ArticleRequest table

Revision ID: 78b9e4d2f91a
Revises: previous_revision_id
Create Date: 2025-02-20 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic
revision = '78b9e4d2f91a'
down_revision = '1f4a4316c260'  # replace with your previous migration id
branch_labels = None
depends_on = None


def upgrade():
    # Create article_requests table
    op.create_table(
        'article_requests',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('article_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('was_cached', sa.Boolean(), nullable=False, default=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['article_id'], ['article_searches.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'article_id')
    )

    # Add initial records for existing article_searches
    # This ensures we have a record of who originally requested each article
    op.execute("""
        INSERT INTO article_requests (user_id, article_id, created_at, was_cached)
        SELECT user_id, id, created_at, false
        FROM article_searches
    """)


def downgrade():
    # Remove the article_requests table
    op.drop_table('article_requests')
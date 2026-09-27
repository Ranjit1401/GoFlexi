"""006_trips_table

Revision ID: 006_trips
Revises: 005_merge_sources_and_directory
Create Date: 2026-09-27 06:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '006_trips'
down_revision: Union[str, None] = '005_merge_sources_and_directory'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'trips' not in inspector.get_table_names():
        op.create_table(
            'trips',
            sa.Column('id', sa.CHAR(36), nullable=False),
            sa.Column('user_id', sa.CHAR(36), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('destination', sa.String(length=255), nullable=False),
            sa.Column('start_date', sa.String(length=50), nullable=False),
            sa.Column('end_date', sa.String(length=50), nullable=False),
            sa.Column('days', sa.Integer(), server_default='1', nullable=False),
            sa.Column('travelers_count', sa.Integer(), server_default='1', nullable=False),
            sa.Column('budget', sa.String(length=100), server_default='₹25,000', nullable=False),
            sa.Column('status', sa.String(length=50), server_default='Upcoming', nullable=False),
            sa.Column('image_url', sa.Text(), nullable=True),
            sa.Column('itinerary_summary', sa.Text(), nullable=True),
            sa.Column('tags', sa.JSON(), nullable=True),
            sa.Column('stops', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        )
        op.create_index('ix_trips_user_id', 'trips', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_trips_user_id', table_name='trips')
    op.drop_table('trips')

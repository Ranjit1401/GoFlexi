"""005_merge_sources_and_directory

Revision ID: 005_merge_sources_and_directory
Revises: 004_destination_sources
Create Date: 2026-09-26 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '005_merge_sources_and_directory'
down_revision: Union[str, None] = '004_destination_sources'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'tours' not in tables:
        op.create_table(
            'tours',
            sa.Column('id', sa.CHAR(36), nullable=False),
            sa.Column('agent_id', sa.CHAR(36), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('destination', sa.String(length=255), nullable=True),
            sa.Column('start_date', sa.Date(), nullable=True),
            sa.Column('end_date', sa.Date(), nullable=True),
            sa.Column('status', sa.String(length=50), server_default='Draft', nullable=False),
            sa.Column('max_participants', sa.Integer(), server_default='20', nullable=False),
            sa.Column('budget_per_person', sa.Numeric(12, 2), nullable=True),
            sa.Column('currency', sa.String(length=10), server_default='INR', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        )

    if 'tour_members' not in tables:
        op.create_table(
            'tour_members',
            sa.Column('id', sa.CHAR(36), nullable=False),
            sa.Column('tour_id', sa.CHAR(36), nullable=False),
            sa.Column('traveler_profile_id', sa.CHAR(36), nullable=False),
            sa.Column('role_in_tour', sa.String(length=100), nullable=True),
            sa.Column('dietary_restrictions', sa.Text(), nullable=True),
            sa.Column('medical_notes', sa.Text(), nullable=True),
            sa.Column('emergency_contact_name', sa.String(length=255), nullable=True),
            sa.Column('emergency_contact_phone', sa.String(length=50), nullable=True),
            sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['tour_id'], ['tours.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['traveler_profile_id'], ['traveler_profiles.id'], ondelete='CASCADE'),
        )


def downgrade() -> None:
    op.drop_table('tour_members')
    op.drop_table('tours')

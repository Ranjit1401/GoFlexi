"""002_traveler_preferences_tables

Revision ID: 002_traveler_preferences_tables
Revises: 001_initial_auth_tables
Create Date: 2026-09-25 20:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_traveler_preferences_tables'
down_revision: Union[str, None] = '001_initial_auth_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create traveler_profiles table
    op.create_table(
        'traveler_profiles',
        sa.Column('id', sa.CHAR(36), nullable=False),
        sa.Column('user_id', sa.CHAR(36), nullable=False),
        sa.Column('travel_style', sa.String(length=50), nullable=False, server_default=''),
        sa.Column('companions', sa.String(length=50), nullable=False, server_default=''),
        sa.Column('transport', sa.String(length=255), nullable=False, server_default=''),
        sa.Column('itinerary_pace', sa.String(length=50), nullable=False, server_default=''),
        sa.Column('budget_range', sa.String(length=100), nullable=False, server_default=''),
        sa.Column('onboarding_completed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_traveler_profiles_id'), 'traveler_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_traveler_profiles_user_id'), 'traveler_profiles', ['user_id'], unique=True)

    # 2. Create traveler_interests table
    op.create_table(
        'traveler_interests',
        sa.Column('id', sa.CHAR(36), nullable=False),
        sa.Column('traveler_profile_id', sa.CHAR(36), nullable=False),
        sa.Column('interest_type', sa.String(length=50), nullable=False),
        sa.Column('interest_value', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['traveler_profile_id'], ['traveler_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('traveler_profile_id', 'interest_type', 'interest_value', name='uq_traveler_interest')
    )
    op.create_index(op.f('ix_traveler_interests_id'), 'traveler_interests', ['id'], unique=False)
    op.create_index(op.f('ix_traveler_interests_profile_id'), 'traveler_interests', ['traveler_profile_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_traveler_interests_profile_id'), table_name='traveler_interests')
    op.drop_index(op.f('ix_traveler_interests_id'), table_name='traveler_interests')
    op.drop_table('traveler_interests')

    op.drop_index(op.f('ix_traveler_profiles_user_id'), table_name='traveler_profiles')
    op.drop_index(op.f('ix_traveler_profiles_id'), table_name='traveler_profiles')
    op.drop_table('traveler_profiles')

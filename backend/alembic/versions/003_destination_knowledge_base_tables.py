"""003_destination_knowledge_base_tables

Revision ID: 003_destinations_kb
Revises: 002_traveler_preferences_tables
Create Date: 2026-09-26 03:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_destinations_kb'
down_revision: Union[str, None] = '002_traveler_preferences_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. destinations table
    op.create_table(
        'destinations',
        sa.Column('id', sa.CHAR(36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('country', sa.String(length=100), nullable=False, server_default='India'),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('short_description', sa.String(length=500), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('budget_min', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('budget_max', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('popularity_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', 'state', name='uq_destination_name_state')
    )
    op.create_index(op.f('ix_destinations_id'), 'destinations', ['id'], unique=False)
    op.create_index(op.f('ix_destinations_name'), 'destinations', ['name'], unique=False)
    op.create_index(op.f('ix_destinations_state'), 'destinations', ['state'], unique=False)
    op.create_index(op.f('ix_destinations_city'), 'destinations', ['city'], unique=False)
    op.create_index(op.f('ix_destinations_country'), 'destinations', ['country'], unique=False)
    op.create_index(op.f('ix_destinations_popularity_score'), 'destinations', ['popularity_score'], unique=False)

    # 2. destination_tags table
    op.create_table(
        'destination_tags',
        sa.Column('id', sa.CHAR(36), nullable=False),
        sa.Column('destination_id', sa.CHAR(36), nullable=False),
        sa.Column('tag_type', sa.String(length=50), nullable=False),
        sa.Column('tag_value', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('destination_id', 'tag_type', 'tag_value', name='uq_destination_tag')
    )
    op.create_index(op.f('ix_destination_tags_id'), 'destination_tags', ['id'], unique=False)
    op.create_index(op.f('ix_destination_tags_destination_id'), 'destination_tags', ['destination_id'], unique=False)
    op.create_index(op.f('ix_destination_tags_tag_type'), 'destination_tags', ['tag_type'], unique=False)
    op.create_index(op.f('ix_destination_tags_tag_value'), 'destination_tags', ['tag_value'], unique=False)

    # 3. destination_travel_styles table
    op.create_table(
        'destination_travel_styles',
        sa.Column('id', sa.CHAR(36), nullable=False),
        sa.Column('destination_id', sa.CHAR(36), nullable=False),
        sa.Column('travel_style', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('destination_id', 'travel_style', name='uq_destination_travel_style')
    )
    op.create_index(op.f('ix_destination_travel_styles_id'), 'destination_travel_styles', ['id'], unique=False)
    op.create_index(op.f('ix_destination_travel_styles_destination_id'), 'destination_travel_styles', ['destination_id'], unique=False)
    op.create_index(op.f('ix_destination_travel_styles_travel_style'), 'destination_travel_styles', ['travel_style'], unique=False)

    # 4. destination_companions table
    op.create_table(
        'destination_companions',
        sa.Column('id', sa.CHAR(36), nullable=False),
        sa.Column('destination_id', sa.CHAR(36), nullable=False),
        sa.Column('companion_type', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('destination_id', 'companion_type', name='uq_destination_companion')
    )
    op.create_index(op.f('ix_destination_companions_id'), 'destination_companions', ['id'], unique=False)
    op.create_index(op.f('ix_destination_companions_destination_id'), 'destination_companions', ['destination_id'], unique=False)
    op.create_index(op.f('ix_destination_companions_companion_type'), 'destination_companions', ['companion_type'], unique=False)

    # 5. destination_transport table
    op.create_table(
        'destination_transport',
        sa.Column('id', sa.CHAR(36), nullable=False),
        sa.Column('destination_id', sa.CHAR(36), nullable=False),
        sa.Column('transport_type', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('destination_id', 'transport_type', name='uq_destination_transport')
    )
    op.create_index(op.f('ix_destination_transport_id'), 'destination_transport', ['id'], unique=False)
    op.create_index(op.f('ix_destination_transport_destination_id'), 'destination_transport', ['destination_id'], unique=False)
    op.create_index(op.f('ix_destination_transport_transport_type'), 'destination_transport', ['transport_type'], unique=False)

    # 6. destination_paces table
    op.create_table(
        'destination_paces',
        sa.Column('id', sa.CHAR(36), nullable=False),
        sa.Column('destination_id', sa.CHAR(36), nullable=False),
        sa.Column('pace', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('destination_id', 'pace', name='uq_destination_pace')
    )
    op.create_index(op.f('ix_destination_paces_id'), 'destination_paces', ['id'], unique=False)
    op.create_index(op.f('ix_destination_paces_destination_id'), 'destination_paces', ['destination_id'], unique=False)
    op.create_index(op.f('ix_destination_paces_pace'), 'destination_paces', ['pace'], unique=False)

    # 7. destination_best_months table
    op.create_table(
        'destination_best_months',
        sa.Column('id', sa.CHAR(36), nullable=False),
        sa.Column('destination_id', sa.CHAR(36), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('destination_id', 'month', name='uq_destination_best_month')
    )
    op.create_index(op.f('ix_destination_best_months_id'), 'destination_best_months', ['id'], unique=False)
    op.create_index(op.f('ix_destination_best_months_destination_id'), 'destination_best_months', ['destination_id'], unique=False)
    op.create_index(op.f('ix_destination_best_months_month'), 'destination_best_months', ['month'], unique=False)


def downgrade() -> None:
    op.drop_table('destination_best_months')
    op.drop_table('destination_paces')
    op.drop_table('destination_transport')
    op.drop_table('destination_companions')
    op.drop_table('destination_travel_styles')
    op.drop_table('destination_tags')
    op.drop_table('destinations')

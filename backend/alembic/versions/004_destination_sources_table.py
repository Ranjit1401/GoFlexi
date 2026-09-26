"""004_destination_sources_table

Revision ID: 004_destination_sources
Revises: 003_destinations_kb
Create Date: 2026-09-26 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_destination_sources'
down_revision: Union[str, None] = '003_destinations_kb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'destination_sources',
        sa.Column('id', sa.CHAR(36), nullable=False),
        sa.Column('destination_id', sa.CHAR(36), nullable=False),
        sa.Column('source_name', sa.String(length=100), nullable=False),
        sa.Column('source_url', sa.String(length=500), nullable=True),
        sa.Column('source_type', sa.String(length=100), nullable=False),
        sa.Column('external_id', sa.String(length=255), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('destination_id', 'source_name', 'external_id', name='uq_destination_source')
    )
    op.create_index(op.f('ix_destination_sources_id'), 'destination_sources', ['id'], unique=False)
    op.create_index(op.f('ix_destination_sources_destination_id'), 'destination_sources', ['destination_id'], unique=False)
    op.create_index(op.f('ix_destination_sources_source_name'), 'destination_sources', ['source_name'], unique=False)
    op.create_index(op.f('ix_destination_sources_source_type'), 'destination_sources', ['source_type'], unique=False)
    op.create_index(op.f('ix_destination_sources_external_id'), 'destination_sources', ['external_id'], unique=False)


def downgrade() -> None:
    op.drop_table('destination_sources')

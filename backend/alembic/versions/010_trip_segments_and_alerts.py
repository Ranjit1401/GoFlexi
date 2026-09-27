"""010_trip_segments_and_alerts

Revision ID: 010_trip_segments_and_alerts
Revises: 009_trip_fields
Create Date: 2026-09-27 08:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '010_trip_segments_and_alerts'
down_revision: Union[str, None] = '009_trip_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'trip_segments' not in tables:
        op.create_table(
            'trip_segments',
            sa.Column('id', sa.CHAR(36), nullable=False),
            sa.Column('trip_id', sa.CHAR(36), nullable=False),
            sa.Column('segment_type', sa.String(length=50), nullable=False),
            sa.Column('provider_name', sa.String(length=255), nullable=False),
            sa.Column('reference_code', sa.String(length=100), nullable=False),
            sa.Column('origin', sa.String(length=255), nullable=True),
            sa.Column('destination', sa.String(length=255), nullable=True),
            sa.Column('scheduled_start', sa.String(length=100), nullable=False),
            sa.Column('scheduled_end', sa.String(length=100), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='Scheduled', nullable=False),
            sa.Column('details', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
        )

    if 'trip_alerts' not in tables:
        op.create_table(
            'trip_alerts',
            sa.Column('id', sa.CHAR(36), nullable=False),
            sa.Column('trip_id', sa.CHAR(36), nullable=False),
            sa.Column('segment_id', sa.CHAR(36), nullable=False),
            sa.Column('user_id', sa.CHAR(36), nullable=False),
            sa.Column('disruption_type', sa.String(length=50), nullable=False),
            sa.Column('is_adjustable', sa.Boolean(), server_default='true', nullable=False),
            sa.Column('delay_minutes', sa.Integer(), nullable=True),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
            sa.Column('alternate_options', sa.JSON(), nullable=True),
            sa.Column('email_sent', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('email_sent_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['segment_id'], ['trip_segments.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'trip_alerts' in tables:
        op.drop_table('trip_alerts')
    if 'trip_segments' in tables:
        op.drop_table('trip_segments')

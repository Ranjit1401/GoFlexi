"""011_operator_foundation

Revision ID: 011_operator_foundation
Revises: 010_trip_segments_and_alerts
Create Date: 2026-09-27 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '011_operator_foundation'
down_revision: Union[str, None] = '010_trip_segments_and_alerts'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # 1. operator_travelers table
    if 'operator_travelers' not in tables:
        op.create_table(
            'operator_travelers',
            sa.Column('id', sa.CHAR(36), nullable=False),
            sa.Column('agent_id', sa.CHAR(36), nullable=False),
            sa.Column('traveler_user_id', sa.CHAR(36), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['traveler_user_id'], ['users.id'], ondelete='CASCADE'),
            sa.UniqueConstraint('agent_id', 'traveler_user_id', name='uq_operator_traveler')
        )
        op.create_index('ix_operator_travelers_agent_id', 'operator_travelers', ['agent_id'])
        op.create_index('ix_operator_travelers_traveler_user_id', 'operator_travelers', ['traveler_user_id'])

    # 2. operator_alerts table
    if 'operator_alerts' not in tables:
        op.create_table(
            'operator_alerts',
            sa.Column('id', sa.CHAR(36), nullable=False),
            sa.Column('agent_id', sa.CHAR(36), nullable=False),
            sa.Column('type', sa.String(length=50), nullable=False),
            sa.Column('severity', sa.String(length=50), server_default='info', nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        )
        op.create_index('ix_operator_alerts_agent_id', 'operator_alerts', ['agent_id'])

    # 3. Add destination_id to tours if not present
    if 'tours' in tables:
        tour_cols = [c['name'] for c in inspector.get_columns('tours')]
        if 'destination_id' not in tour_cols:
            op.add_column('tours', sa.Column('destination_id', sa.CHAR(36), nullable=True))
            op.create_foreign_key(
                'fk_tours_destination_id',
                'tours',
                'destinations',
                ['destination_id'],
                ['id'],
                ondelete='SET NULL'
            )
            op.create_index('ix_tours_destination_id', 'tours', ['destination_id'])

    # 4. Add tour_id and traveler_user_id to bookings if not present
    if 'bookings' in tables:
        booking_cols = [c['name'] for c in inspector.get_columns('bookings')]
        if 'tour_id' not in booking_cols:
            op.add_column('bookings', sa.Column('tour_id', sa.CHAR(36), nullable=True))
            op.create_foreign_key(
                'fk_bookings_tour_id',
                'bookings',
                'tours',
                ['tour_id'],
                ['id'],
                ondelete='SET NULL'
            )
            op.create_index('ix_bookings_tour_id', 'bookings', ['tour_id'])
        if 'traveler_user_id' not in booking_cols:
            op.add_column('bookings', sa.Column('traveler_user_id', sa.CHAR(36), nullable=True))
            op.create_foreign_key(
                'fk_bookings_traveler_user_id',
                'bookings',
                'users',
                ['traveler_user_id'],
                ['id'],
                ondelete='SET NULL'
            )
            op.create_index('ix_bookings_traveler_user_id', 'bookings', ['traveler_user_id'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'bookings' in tables:
        booking_cols = [c['name'] for c in inspector.get_columns('bookings')]
        if 'traveler_user_id' in booking_cols:
            op.drop_constraint('fk_bookings_traveler_user_id', 'bookings', type_='foreignkey')
            op.drop_column('bookings', 'traveler_user_id')
        if 'tour_id' in booking_cols:
            op.drop_constraint('fk_bookings_tour_id', 'bookings', type_='foreignkey')
            op.drop_column('bookings', 'tour_id')

    if 'tours' in tables:
        tour_cols = [c['name'] for c in inspector.get_columns('tours')]
        if 'destination_id' in tour_cols:
            op.drop_constraint('fk_tours_destination_id', 'tours', type_='foreignkey')
            op.drop_column('tours', 'destination_id')

    if 'operator_alerts' in tables:
        op.drop_table('operator_alerts')

    if 'operator_travelers' in tables:
        op.drop_table('operator_travelers')

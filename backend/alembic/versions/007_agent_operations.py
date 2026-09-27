"""007_agent_operations

Revision ID: 007_agent_operations
Revises: 006_trips
Create Date: 2026-09-27 06:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '007_agent_operations'
down_revision: Union[str, None] = '006_trips'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # 1. Bookings table
    if 'bookings' not in tables:
        op.create_table(
            'bookings',
            sa.Column('id', sa.CHAR(36), nullable=False),
            sa.Column('agent_id', sa.CHAR(36), nullable=False),
            sa.Column('booking_code', sa.String(length=50), nullable=False),
            sa.Column('traveler_name', sa.String(length=255), nullable=False),
            sa.Column('traveler_email', sa.String(length=255), nullable=False),
            sa.Column('tour_name', sa.String(length=255), nullable=False),
            sa.Column('service', sa.String(length=100), nullable=False),
            sa.Column('departure_date', sa.String(length=50), nullable=False),
            sa.Column('amount', sa.String(length=100), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='Confirmed', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        )
        op.create_index('ix_bookings_agent_id', 'bookings', ['agent_id'])
        op.create_index('ix_bookings_booking_code', 'bookings', ['booking_code'])

    # 2. Schedules table
    if 'schedules' not in tables:
        op.create_table(
            'schedules',
            sa.Column('id', sa.CHAR(36), nullable=False),
            sa.Column('agent_id', sa.CHAR(36), nullable=False),
            sa.Column('time', sa.String(length=50), nullable=False),
            sa.Column('date', sa.String(length=50), nullable=False),
            sa.Column('item_type', sa.String(length=50), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('details', sa.Text(), nullable=True),
            sa.Column('traveler_or_group', sa.String(length=255), nullable=False),
            sa.Column('location', sa.String(length=255), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='Scheduled', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        )
        op.create_index('ix_schedules_agent_id', 'schedules', ['agent_id'])

    # 3. Vendors table
    if 'vendors' not in tables:
        op.create_table(
            'vendors',
            sa.Column('id', sa.CHAR(36), nullable=False),
            sa.Column('agent_id', sa.CHAR(36), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('category', sa.String(length=100), nullable=False),
            sa.Column('location', sa.String(length=255), nullable=False),
            sa.Column('contact_person', sa.String(length=255), nullable=False),
            sa.Column('phone', sa.String(length=50), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('rating', sa.Float(), server_default='4.5', nullable=False),
            sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        )
        op.create_index('ix_vendors_agent_id', 'vendors', ['agent_id'])

    # 4. Enhance tours table with missing columns if not present
    if 'tours' in tables:
        tour_cols = [c['name'] for c in inspector.get_columns('tours')]
        if 'duration' not in tour_cols:
            op.add_column('tours', sa.Column('duration', sa.String(length=100), nullable=True))
        if 'booked_slots' not in tour_cols:
            op.add_column('tours', sa.Column('booked_slots', sa.Integer(), server_default='0', nullable=False))
        if 'image_url' not in tour_cols:
            op.add_column('tours', sa.Column('image_url', sa.Text(), nullable=True))

    # 5. Agent notifications & alerts table
    if 'agent_notifications' not in tables:
        op.create_table(
            'agent_notifications',
            sa.Column('id', sa.CHAR(36), nullable=False),
            sa.Column('agent_id', sa.CHAR(36), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('category', sa.String(length=100), nullable=False),
            sa.Column('notification_type', sa.String(length=50), server_default='notification', nullable=False),
            sa.Column('urgency', sa.String(length=50), server_default='info', nullable=False),
            sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('time_label', sa.String(length=50), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        )
        op.create_index('ix_agent_notifications_agent_id', 'agent_notifications', ['agent_id'])


def downgrade() -> None:
    op.drop_table('agent_notifications')
    op.drop_table('vendors')
    op.drop_table('schedules')
    op.drop_table('bookings')

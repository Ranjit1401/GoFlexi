"""009_trip_fields

Revision ID: 009_trip_fields
Revises: 008_trip_payments
Create Date: 2026-09-27 07:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '009_trip_fields'
down_revision: Union[str, None] = '008_trip_payments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('trips')]

    if 'destination_id' not in cols:
        op.add_column('trips', sa.Column('destination_id', sa.CHAR(36), nullable=True))
        op.create_foreign_key(
            'fk_trips_destination_id',
            'trips',
            'destinations',
            ['destination_id'],
            ['id'],
            ondelete='SET NULL'
        )

    if 'travel_style' not in cols:
        op.add_column('trips', sa.Column('travel_style', sa.String(length=50), server_default='Balanced', nullable=False))

    if 'companions' not in cols:
        op.add_column('trips', sa.Column('companions', sa.String(length=50), server_default='Solo', nullable=False))

    if 'transport' not in cols:
        op.add_column('trips', sa.Column('transport', sa.String(length=255), server_default='Flexible', nullable=False))

    if 'itinerary_pace' not in cols:
        op.add_column('trips', sa.Column('itinerary_pace', sa.String(length=50), server_default='Balanced', nullable=False))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('trips')]

    for col in ['itinerary_pace', 'transport', 'companions', 'travel_style']:
        if col in cols:
            op.drop_column('trips', col)

    if 'destination_id' in cols:
        op.drop_constraint('fk_trips_destination_id', 'trips', type_='foreignkey')
        op.drop_column('trips', 'destination_id')

"""008_trip_payments

Revision ID: 008_trip_payments
Revises: 007_agent_operations
Create Date: 2026-09-27 07:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '008_trip_payments'
down_revision: Union[str, None] = '007_agent_operations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('trips')]

    if 'payment_status' not in cols:
        op.add_column('trips', sa.Column('payment_status', sa.String(length=50), server_default='Pending', nullable=False))
    if 'cost_breakdown' not in cols:
        op.add_column('trips', sa.Column('cost_breakdown', sa.JSON(), nullable=True))
    if 'payment_id' not in cols:
        op.add_column('trips', sa.Column('payment_id', sa.String(length=100), nullable=True))
    if 'paid_at' not in cols:
        op.add_column('trips', sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('trips')]

    if 'paid_at' in cols:
        op.drop_column('trips', 'paid_at')
    if 'payment_id' in cols:
        op.drop_column('trips', 'payment_id')
    if 'cost_breakdown' in cols:
        op.drop_column('trips', 'cost_breakdown')
    if 'payment_status' in cols:
        op.drop_column('trips', 'payment_status')

"""rbac 授权：role data_scope + agent created_by_id

Revision ID: ea9f2d695f2f
Revises: d858feccac09
Create Date: 2026-11-07 23:55:51.622993

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ea9f2d695f2f'
down_revision: Union[str, Sequence[str], None] = 'd858feccac09'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # roles.data_scope：普通加列即可
    op.add_column('roles', sa.Column('data_scope', sa.String(length=20), nullable=False,
                                     server_default='self', comment='数据范围: all/self'))

    # agents.created_by_id + 外键：SQLite 需 batch mode（copy-and-move）
    with op.batch_alter_table('agents') as batch_op:
        batch_op.add_column(sa.Column('created_by_id', sa.BigInteger(), nullable=True,
                                      comment='创建者用户ID（数据范围过滤用）'))
        batch_op.create_foreign_key('fk_agents_created_by_id_users', 'users',
                                    ['created_by_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('agents') as batch_op:
        batch_op.drop_constraint('fk_agents_created_by_id_users', type_='foreignkey')
        batch_op.drop_column('created_by_id')
    op.drop_column('roles', 'data_scope')

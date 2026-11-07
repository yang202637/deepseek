# 知识库管理 模块实施计划

> **实现方式：** 使用 superpowers:executing-plans 或 subagent-driven-development 逐任务实施。步骤使用 `- [ ]` 复选框跟踪。

**目标：** 为知识库补齐数据权限（`created_by` 升级外键 + 查询过滤 + 写入归属）与功能权限（接口挂载 `knowledge:*` 权限码）。

**架构：** 将 `knowledge_bases.created_by` 从 `String(100)` 升级为外键；查询按当前用户数据范围过滤，创建自动写归属；接口按 `knowledge:view/create/update/delete/document-manage` 挂载 `require_permission`。文档/分段子资源跟随所属知识库的数据范围。

**技术栈：** Python 3.13 + FastAPI + SQLAlchemy 2.0 async + Alembic。

**Spec：** `docs/spec/PROJECT_SPEC_V2.md`（§5.1.5 挂载矩阵、§5.2.4 过滤与写入规则、§6.2 created_by 迁移）

## 全局约束

- `created_by` 升级为外键指向 `users.id`；旧数据按 `users.username` 回填，无法匹配置空。
- `self` 范围仅见自己创建的知识库；文档/分段子资源继承知识库数据范围。
- 接口权限码：`knowledge:view` / `knowledge:create` / `knowledge:update` / `knowledge:delete` / `knowledge:document-manage`。

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/modules/knowledge/model.py` | `created_by` 改为外键 |
| 新建 | `alembic/versions/xxxx_knowledge_created_by_fk.py` | 迁移 |
| 修改 | `src/modules/knowledge/repository.py` | 查询过滤 + 写入归属 |
| 修改 | `src/modules/knowledge/service.py` | 数据范围透传 |
| 修改 | `src/modules/knowledge/api.py` | 挂载权限码 + 注入当前用户 |
| Test | `test/test_knowledge.py` | 数据范围测试 |

## 任务分解

### Task 1: `created_by` 升级外键 + 迁移

- [ ] 修改 `KnowledgeBase.created_by` 为 `BigInteger, ForeignKey("users.id", ondelete="SET NULL")`
- [ ] 生成迁移并补回填逻辑
- [ ] `alembic upgrade head`
- [ ] 提交

### Task 2: 数据范围过滤与写入归属

- [ ] 编写失败测试：`self` 范围仅见自己知识库，`all` 范围见全部
- [ ] 运行确认失败
- [ ] 实现 `owner_id` 过滤参数 + 创建写 `created_by`；子资源（文档/分段）按父知识库归属过滤
- [ ] 运行确认通过
- [ ] 提交

### Task 3: 接口挂载功能权限

- [ ] `GET` → `knowledge:view`；`POST` → `knowledge:create`；`PUT` → `knowledge:update`；`DELETE` → `knowledge:delete`；文档上传/处理/分段接口 → `knowledge:document-manage`
- [ ] 注入 `current_user` 供过滤；越权详情返回 403
- [ ] 提交

## 评审要点（Review Focus）

1. 子资源继承：文档/分段接口不得绕过知识库数据范围——Task 2 测试覆盖。
2. 越权详情 403 不泄露存在性——Task 3 覆盖。
3. 超管/`all` 范围不过滤——Task 2 覆盖。

## 验收标准

- [ ] `self` 用户仅见自己创建的知识库及其文档/分段。
- [ ] 无对应权限码访问返回 403。
- [ ] `all` 范围用户可见全部知识库。

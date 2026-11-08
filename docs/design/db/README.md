# 数据库详细设计（RBAC V2）

> 依据：`docs/spec/PROJECT_SPEC_V2.md` + `docs/design/plans/*-plan.md`
> 目标库：**SQLite 3**（当前阶段）→ **MySQL 8.0+**（上线）

## 1. 交付物

| 文件 | 说明 |
|------|------|
| `rbac.db` | SQLite 数据库文件（已建表 + 已灌入初始化数据） |
| `script.sql` | 建表脚本（15 张表 + 21 个索引），含 MySQL 迁移对照表 |
| `init-data.sql` | 初始化数据脚本（幂等） |

### 重建步骤

```bash
cd docs/design/db
sqlite3 rbac.db < script.sql       # 建表
sqlite3 rbac.db < init-data.sql    # 造数
```

---

## 2. 实体关系图（ERD）

```
                    ┌──────────┐
                    │  users   │
                    └────┬─────┘
                         │ M:N（user_roles）
                    ┌────┴─────┐
                    │  roles   │──────────┐
                    └────┬─────┘          │
                         │ M:N            │ 1:N
                （role_permissions）       │
                    ┌────┴────────┐        │
                    │ permissions │        │
                    └─────────────┘        │
                                           │
   ┌──────────────┐ 1:N   ┌────────────┐   │
   │model_providers│──────│   models   │   │
   └──────────────┘       └─────┬──────┘   │
                                │ 1:N      │
                          ┌─────┴─────┐    │
                          │  agents   │◄───┘ created_by_id（数据范围）
                          └─────┬─────┘
                                │ 1:N
                          ┌─────┴────────┐
                          │agent_versions│
                          └──────────────┘

   ┌──────────┐ 1:N  ┌───────────────┐
   │ prompts  │──────│prompt_versions│
   └──────────┘      └───────────────┘

   ┌──────────────────┐ 1:N  ┌───────────┐ 1:N  ┌──────────┐
   │ knowledge_bases  │──────│ documents │──────│ segments │
   └──────────────────┘      └───────────┘      └──────────┘
             └────────────────── segments 同时直连 knowledge_base_id

   ┌───────┐
   │ tools │  （独立表）
   └───────┘
```

---

## 3. 表字典

### 3.1 RBAC 核心

#### users — 用户表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, 自增 | 主键 |
| username | VARCHAR(50) | NOT NULL, UNIQUE | 登录账号 |
| email | VARCHAR(100) | NOT NULL, UNIQUE | 邮箱 |
| hashed_password | VARCHAR(255) | NOT NULL | bcrypt 哈希 |
| is_active | BOOLEAN | NOT NULL, 默认 1 | 是否启用 |
| is_superuser | BOOLEAN | NOT NULL, 默认 0 | 超管（绕过所有授权校验） |
| last_login | DATETIME | NULL | 最后登录时间 |
| created_at / updated_at | DATETIME | NOT NULL | 自动维护 |

#### roles — 角色表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK | |
| code | VARCHAR(100) | NOT NULL, UNIQUE | 角色编码，如 `super_admin` |
| name | VARCHAR(100) | NOT NULL | 角色名称 |
| description | VARCHAR(200) | NULL | |
| **data_scope** | VARCHAR(20) | NOT NULL, 默认 `self` | **数据范围**：`all` / `self`，含 CHECK 约束 |

#### permissions — 权限表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK | |
| code | VARCHAR(100) | NOT NULL, UNIQUE | 权限码 `模块:操作` |
| name / description | VARCHAR | — | 名称与说明 |

#### user_roles / role_permissions — 关联表

复合主键，双向 `ON DELETE CASCADE`，天然防重复。

---

### 3.2 共享资源（不受数据范围约束）

#### model_providers — 供应商

`name` / `type`（openai/anthropic/aliyun/azure/local/custom）/ `status` / `endpoint` / `api_key`（加密存储）。

#### models — 模型

`model_id` 全局唯一；`provider_id` → `model_providers.id`（CASCADE）；
`capabilities` 逗号分隔；`input_price` / `output_price` 为 `NUMERIC(10,6)`（每 1K tokens）。

---

### 3.3 业务资源（受数据范围约束）

#### agents — Agent

| 关键字段 | 说明 |
|----------|------|
| `type` | conversation / tool / analysis / creative / workflow |
| `status` | active / inactive / error / draft |
| `model_id` | → `models.id`，`ON DELETE SET NULL` |
| `config` | JSON：model / prompt / rag / tools / advanced 五段式配置 |
| `created_by` | 创建者用户名（展示用） |
| **`created_by_id`** | → `users.id`，**数据范围过滤依据**，`ON DELETE SET NULL` |

#### prompts — Prompt

`tags` / `variables` 为 JSON；`status` draft / published。

#### knowledge_bases — 知识库

含分段策略（`chunk_method` / `chunk_size` / `chunk_overlap`）与检索策略（`retrieval_strategy` / `top_k` / `similarity_threshold`）。

#### documents / segments — 文档与分段

`documents.knowledge_base_id` → `knowledge_bases.id`（CASCADE）；
`segments` 同时引用 `knowledge_base_id` 与 `document_id`，便于按知识库直接检索。

#### tools — 工具

`name` 唯一；`config` 与 `function_definition` 为 JSON（OpenAI Function Calling 格式）。

---

## 4. 关键设计决策

| 决策 | 理由 |
|------|------|
| **权限码不建 `module` 列** | 模块名可从 `code` 的冒号前缀解析（如 `agent:view` → `agent`），避免冗余与不一致 |
| **角色挂 `data_scope`** | 数据范围与功能权限解耦；「运营/审计」可获全量数据而不必成为超管 |
| **`created_by` 与 `created_by_id` 并存** | 前者保留展示用用户名，后者承担外键过滤；兼容既有数据与代码 |
| **模型/供应商不加 `created_by`** | 组织级共享资源，有 `view` 权限即全员可见 |
| **JSON 字段存 TEXT 亲和** | SQLite 无原生 JSON 类型；MySQL 迁移时直接改 `JSON` |
| **id 用 `INTEGER PRIMARY KEY`** | SQLite 仅此写法支持自增；MySQL 换 `BIGINT AUTO_INCREMENT` |

---

## 5. 数据范围判定（与应用层一致）

```
优先级：
1. users.is_superuser = 1                    → all
2. 用户任一 roles.data_scope = 'all'          → all
3. 其余                                       → self
```

SQL 等价写法：

```sql
SELECT u.username,
       CASE WHEN u.is_superuser = 1 THEN 'all'
            WHEN MAX(CASE WHEN r.data_scope='all' THEN 1 ELSE 0 END)=1 THEN 'all'
            ELSE 'self' END AS data_scope
FROM users u
LEFT JOIN user_roles ur       ON ur.user_id = u.id
LEFT JOIN roles r             ON r.id = ur.role_id
GROUP BY u.id;
```

`self` 范围的列表查询追加过滤：

```sql
WHERE agents.created_by_id = :current_user_id
```

---

## 6. 初始化数据概览

| 表 | 条数 | 说明 |
|----|------|------|
| permissions | **44** | 9 个模块的权限码（见下方说明） |
| roles | 3 | 超管(all) / 运营人员(all) / 普通用户(self) |
| role_permissions | 70 | 超管 44 + 运营 20 + 普通用户 6 |
| users | 4 | admin(超管) / zhangsan(运营) / lisi(普通) / wangwu(禁用) |
| user_roles | 4 | 一人一角色 |
| model_providers | 3 | OpenAI / Anthropic / 阿里云百炼 |
| models | 3 | gpt-4o / claude-sonnet-4-5 / qwen-max |
| agents | 5 | 覆盖 5 种类型、4 种状态、3 个不同归属 |
| agent_versions | 3 | Agent 1 有两个版本 |
| prompts / prompt_versions | 3 / 3 | 覆盖 published 与 draft |
| knowledge_bases | 2 | ready / indexing |
| documents / segments | 3 / 5 | 含 completed 与 processing |
| tools | 3 | enabled / disabled，3 种类型 |

**默认口令**：所有用户密码均为 `123456`（bcrypt cost=12）。

### 权限码数量说明

`PROJECT_SPEC_V2.md` §5.1.3 标注"共 43 个权限码"，但按该节逐模块清单实际为 **44 个**：

| 模块 | 数量 |
|------|------|
| user | 5 |
| role | 5 |
| permission | 4 |
| agent | 5 |
| model | 5 |
| provider | 5 |
| prompt | 5 |
| knowledge | 5 |
| tool | 5 |
| **合计** | **44** |

本设计以逐模块清单为准，采用 44 个。若确认应为 43，请指出需删减的权限码。

---

## 7. 验证结果

| 检查项 | 结果 |
|--------|------|
| 建表 | ✅ 15 张表、21 个索引 |
| 造数 | ✅ 全部表数据就位 |
| 外键完整性 `PRAGMA foreign_key_check` | ✅ 0 条违规 |
| bcrypt 口令校验（admin / 123456） | ✅ 通过 |
| 权限聚合 | ✅ admin=44、zhangsan=20、lisi=6 |
| 数据范围 | ✅ admin/zhangsan=all、lisi/wangwu=self |
| 数据范围过滤 | ✅ lisi 仅见自己创建的 1 个 Agent，admin 见全部 5 个 |

---

## 8. 上线切换 MySQL

`script.sql` 末尾附有完整的 **MySQL 迁移对照表**，核心替换项：

| SQLite | MySQL 8.0 |
|--------|-----------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY` |
| `BOOLEAN` | `TINYINT(1)` |
| `JSON`（TEXT 亲和） | `JSON` |
| `NUMERIC(a,b)` | `DECIMAL(a,b)` |
| 自动更新时间需手写触发器 | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |
| `PRAGMA foreign_keys = ON` | 不需要（默认强制） |
| — | `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4` |

-- =====================================================================
-- 辰光 Agent 平台 — 数据库建表脚本 (RBAC V2)
-- =====================================================================
-- 目标库 : SQLite 3（当前阶段）
-- 上线库 : MySQL 8.0+（见文件末尾「MySQL 迁移对照表」）
-- 说明   : 本脚本与 src/modules/*/model.py 中的 ORM 定义保持一致
-- 执行   : sqlite3 rbac.db < script.sql
-- 幂等   : 重复执行会先 DROP 再重建（仅限开发/设计阶段）
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- 0. 清理（按外键依赖倒序）
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS segments;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS knowledge_bases;
DROP TABLE IF EXISTS prompt_versions;
DROP TABLE IF EXISTS prompts;
DROP TABLE IF EXISTS agent_versions;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS models;
DROP TABLE IF EXISTS model_providers;
DROP TABLE IF EXISTS tools;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

-- =====================================================================
-- 一、RBAC 核心：用户 / 角色 / 权限
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. users 用户表
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id              INTEGER      PRIMARY KEY AUTOINCREMENT,
    username        VARCHAR(50)  NOT NULL,                 -- 用户名（登录账号）
    email           VARCHAR(100) NOT NULL,                 -- 邮箱
    hashed_password VARCHAR(255) NOT NULL,                 -- bcrypt 密码哈希
    is_active       BOOLEAN      NOT NULL DEFAULT 1,       -- 是否启用
    is_superuser    BOOLEAN      NOT NULL DEFAULT 0,       -- 是否超级管理员
    last_login      DATETIME     NULL,                     -- 最后登录时间
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uk_users_username ON users (username);
CREATE UNIQUE INDEX uk_users_email    ON users (email);

-- ---------------------------------------------------------------------
-- 2. roles 角色表
-- ---------------------------------------------------------------------
CREATE TABLE roles (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    code        VARCHAR(100) NOT NULL,                     -- 角色编码，如 super_admin
    name        VARCHAR(100) NOT NULL,                     -- 角色名称
    description VARCHAR(200) NULL,                         -- 角色描述
    data_scope  VARCHAR(20)  NOT NULL DEFAULT 'self',      -- 数据范围: all / self
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_roles_data_scope CHECK (data_scope IN ('all', 'self'))
);
CREATE UNIQUE INDEX uk_roles_code ON roles (code);

-- ---------------------------------------------------------------------
-- 3. permissions 权限表（权限码 模块:操作）
-- ---------------------------------------------------------------------
CREATE TABLE permissions (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    code        VARCHAR(100) NOT NULL,                     -- 权限码，如 agent:view
    name        VARCHAR(100) NOT NULL,                     -- 权限名称
    description VARCHAR(200) NULL,                         -- 权限描述
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uk_permissions_code ON permissions (code);

-- ---------------------------------------------------------------------
-- 4. user_roles 用户-角色关联表（M:N）
-- ---------------------------------------------------------------------
CREATE TABLE user_roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 5. role_permissions 角色-权限关联表（M:N）
-- ---------------------------------------------------------------------
CREATE TABLE role_permissions (
    role_id       INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_perm FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
);

-- =====================================================================
-- 二、模型与供应商（组织级共享资源，不受数据范围约束）
-- =====================================================================

-- ---------------------------------------------------------------------
-- 6. model_providers 模型供应商表
-- ---------------------------------------------------------------------
CREATE TABLE model_providers (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(100) NOT NULL,                     -- 供应商名称
    type        VARCHAR(50)  NOT NULL,                     -- openai/anthropic/aliyun/azure/local/custom
    status      VARCHAR(50)  NOT NULL DEFAULT 'disconnected', -- connected/disconnected/error
    endpoint    VARCHAR(500) NOT NULL,                     -- API 端点
    api_key     TEXT         NULL,                         -- API 密钥（加密存储）
    description VARCHAR(500) NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 7. models 大语言模型表
-- ---------------------------------------------------------------------
CREATE TABLE models (
    id             INTEGER       PRIMARY KEY AUTOINCREMENT,
    name           VARCHAR(100)  NOT NULL,                 -- 模型显示名称
    model_id       VARCHAR(100)  NOT NULL,                 -- 模型标识符，如 gpt-4o
    provider_id    INTEGER       NOT NULL,                 -- 所属供应商
    capabilities   VARCHAR(500)  NULL,                     -- 能力标签，逗号分隔
    context_length INTEGER       NOT NULL DEFAULT 4096,    -- 上下文窗口
    status         VARCHAR(50)   NOT NULL DEFAULT 'available', -- available/unavailable/rate_limited
    input_price    NUMERIC(10,6) NOT NULL DEFAULT 0,       -- 输入价格（每 1K tokens）
    output_price   NUMERIC(10,6) NOT NULL DEFAULT 0,       -- 输出价格（每 1K tokens）
    currency       VARCHAR(10)   NOT NULL DEFAULT 'USD',
    is_default     BOOLEAN       NOT NULL DEFAULT 0,       -- 是否默认模型
    description    TEXT          NULL,
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_models_provider FOREIGN KEY (provider_id)
        REFERENCES model_providers (id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX uk_models_model_id ON models (model_id);
CREATE INDEX ix_models_provider_id ON models (provider_id);

-- =====================================================================
-- 三、Agent 管理（受数据范围约束）
-- =====================================================================

-- ---------------------------------------------------------------------
-- 8. agents Agent 表
-- ---------------------------------------------------------------------
CREATE TABLE agents (
    id             INTEGER      PRIMARY KEY AUTOINCREMENT,
    name           VARCHAR(200) NOT NULL,                  -- Agent 名称
    description    TEXT         NULL,
    type           VARCHAR(50)  NOT NULL,                  -- conversation/tool/analysis/creative/workflow
    status         VARCHAR(50)  NOT NULL DEFAULT 'draft',  -- active/inactive/error/draft
    model_id       INTEGER      NULL,                      -- 关联模型
    config         JSON         NULL,                      -- Agent 完整配置
    success_rate   NUMERIC(5,2) NOT NULL DEFAULT 0,        -- 成功率 %
    call_count_7d  INTEGER      NOT NULL DEFAULT 0,        -- 近7天调用次数
    version        VARCHAR(50)  NOT NULL DEFAULT 'v0.1',   -- 当前版本号
    created_by     VARCHAR(100) NULL,                      -- 创建者用户名（展示用）
    created_by_id  INTEGER      NULL,                      -- 创建者用户ID（数据范围过滤）
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agents_model FOREIGN KEY (model_id)
        REFERENCES models (id) ON DELETE SET NULL,
    CONSTRAINT fk_agents_created_by FOREIGN KEY (created_by_id)
        REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX ix_agents_created_by_id ON agents (created_by_id);
CREATE INDEX ix_agents_model_id      ON agents (model_id);
CREATE INDEX ix_agents_status        ON agents (status);

-- ---------------------------------------------------------------------
-- 9. agent_versions Agent 版本表
-- ---------------------------------------------------------------------
CREATE TABLE agent_versions (
    id           INTEGER      PRIMARY KEY AUTOINCREMENT,
    agent_id     INTEGER      NOT NULL,                    -- 所属 Agent
    version      VARCHAR(50)  NOT NULL,                    -- 版本号
    config       JSON         NULL,                        -- 该版本配置快照
    changelog    VARCHAR(500) NULL,                        -- 变更说明
    is_current   BOOLEAN      NOT NULL DEFAULT 0,          -- 是否当前版本
    published_by VARCHAR(100) NULL,                        -- 发布者
    published_at DATETIME     NULL,                        -- 发布时间
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agent_versions_agent FOREIGN KEY (agent_id)
        REFERENCES agents (id) ON DELETE CASCADE
);
CREATE INDEX ix_agent_versions_agent_id ON agent_versions (agent_id);

-- =====================================================================
-- 四、Prompt 管理（受数据范围约束）
-- =====================================================================

-- ---------------------------------------------------------------------
-- 10. prompts Prompt 模板表
-- ---------------------------------------------------------------------
CREATE TABLE prompts (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(200) NOT NULL,
    description VARCHAR(500) NULL,
    category    VARCHAR(50)  NOT NULL DEFAULT 'general',   -- 分类
    tags        JSON         NULL,                         -- 标签列表（JSON 数组）
    content     TEXT         NOT NULL,                     -- Prompt 正文
    variables   JSON         NULL,                         -- 变量定义（JSON 数组）
    version     VARCHAR(50)  NOT NULL DEFAULT 'v0.1',
    status      VARCHAR(50)  NOT NULL DEFAULT 'draft',     -- draft/published
    created_by  VARCHAR(100) NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_prompts_status  ON prompts (status);
CREATE INDEX ix_prompts_created_by ON prompts (created_by);

-- ---------------------------------------------------------------------
-- 11. prompt_versions Prompt 版本表
-- ---------------------------------------------------------------------
CREATE TABLE prompt_versions (
    id           INTEGER      PRIMARY KEY AUTOINCREMENT,
    prompt_id    INTEGER      NOT NULL,
    version      VARCHAR(50)  NOT NULL,
    content      TEXT         NOT NULL,                    -- 该版本内容快照
    changelog    VARCHAR(500) NULL,
    is_current   BOOLEAN      NOT NULL DEFAULT 0,
    published_by VARCHAR(100) NULL,
    published_at DATETIME     NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prompt_versions_prompt FOREIGN KEY (prompt_id)
        REFERENCES prompts (id) ON DELETE CASCADE
);
CREATE INDEX ix_prompt_versions_prompt_id ON prompt_versions (prompt_id);

-- =====================================================================
-- 五、知识库管理（受数据范围约束）
-- =====================================================================

-- ---------------------------------------------------------------------
-- 12. knowledge_bases 知识库表
-- ---------------------------------------------------------------------
CREATE TABLE knowledge_bases (
    id                   INTEGER      PRIMARY KEY AUTOINCREMENT,
    name                 VARCHAR(200) NOT NULL,
    description          VARCHAR(500) NULL,
    status               VARCHAR(50)  NOT NULL DEFAULT 'empty',   -- ready/indexing/error/empty
    document_count       INTEGER      NOT NULL DEFAULT 0,
    segment_count        INTEGER      NOT NULL DEFAULT 0,
    embedding_model      VARCHAR(100) NOT NULL DEFAULT 'text-embedding-ada-002',
    -- 分段策略
    chunk_method         VARCHAR(20)  NOT NULL DEFAULT 'fixed',   -- fixed/sentence/paragraph
    chunk_size           INTEGER      NOT NULL DEFAULT 500,       -- tokens
    chunk_overlap        INTEGER      NOT NULL DEFAULT 50,        -- tokens
    -- 检索策略
    retrieval_strategy   VARCHAR(20)  NOT NULL DEFAULT 'hybrid',  -- vector/fulltext/hybrid
    top_k                INTEGER      NOT NULL DEFAULT 5,
    similarity_threshold FLOAT        NOT NULL DEFAULT 0.7,
    created_by           VARCHAR(100) NULL,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_knowledge_bases_created_by ON knowledge_bases (created_by);
CREATE INDEX ix_knowledge_bases_status     ON knowledge_bases (status);

-- ---------------------------------------------------------------------
-- 13. documents 文档表
-- ---------------------------------------------------------------------
CREATE TABLE documents (
    id                INTEGER      PRIMARY KEY AUTOINCREMENT,
    knowledge_base_id INTEGER      NOT NULL,
    file_name         VARCHAR(500) NOT NULL,
    file_type         VARCHAR(50)  NOT NULL,               -- pdf/docx/md/txt/html/csv
    file_size         VARCHAR(50)  NULL,
    minio_path        VARCHAR(1000) NULL,                  -- 对象存储路径
    status            VARCHAR(50)  NOT NULL DEFAULT 'pending', -- pending/processing/completed/failed
    segment_count     INTEGER      NOT NULL DEFAULT 0,
    word_count        INTEGER      NOT NULL DEFAULT 0,
    error_message     TEXT         NULL,
    uploaded_by       VARCHAR(100) NULL,
    processed_at      DATETIME     NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_kb FOREIGN KEY (knowledge_base_id)
        REFERENCES knowledge_bases (id) ON DELETE CASCADE
);
CREATE INDEX ix_documents_kb_id  ON documents (knowledge_base_id);
CREATE INDEX ix_documents_status ON documents (status);

-- ---------------------------------------------------------------------
-- 14. segments 文档分段表
-- ---------------------------------------------------------------------
CREATE TABLE segments (
    id                INTEGER  PRIMARY KEY AUTOINCREMENT,
    knowledge_base_id INTEGER  NOT NULL,
    document_id       INTEGER  NOT NULL,
    position          INTEGER  NOT NULL,                   -- 在文档中的序号
    content           TEXT     NOT NULL,
    word_count        INTEGER  NOT NULL DEFAULT 0,
    token_count       INTEGER  NOT NULL DEFAULT 0,
    hit_count         INTEGER  NOT NULL DEFAULT 0,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_segments_kb FOREIGN KEY (knowledge_base_id)
        REFERENCES knowledge_bases (id) ON DELETE CASCADE,
    CONSTRAINT fk_segments_document FOREIGN KEY (document_id)
        REFERENCES documents (id) ON DELETE CASCADE
);
CREATE INDEX ix_segments_kb_id       ON segments (knowledge_base_id);
CREATE INDEX ix_segments_document_id ON segments (document_id);

-- =====================================================================
-- 六、工具管理（受数据范围约束）
-- =====================================================================

-- ---------------------------------------------------------------------
-- 15. tools 工具表
-- ---------------------------------------------------------------------
CREATE TABLE tools (
    id                  INTEGER      PRIMARY KEY AUTOINCREMENT,
    name                VARCHAR(200) NOT NULL,
    description         TEXT         NULL,
    type                VARCHAR(50)  NOT NULL,              -- builtin/http_api/custom_function
    status              VARCHAR(50)  NOT NULL DEFAULT 'disabled', -- enabled/disabled/error
    config              JSON         NULL,                  -- 工具配置
    function_definition JSON         NULL,                  -- Function Calling 定义
    call_count_7d       INTEGER      NOT NULL DEFAULT 0,
    success_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
    avg_latency         INTEGER      NOT NULL DEFAULT 0,    -- 平均延迟 ms
    created_by          VARCHAR(100) NULL,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uk_tools_name ON tools (name);
CREATE INDEX ix_tools_status     ON tools (status);

-- =====================================================================
-- 七、MySQL 迁移对照表（上线时按此替换）
-- =====================================================================
-- SQLite 写法                          MySQL 8.0 写法
-- ----------------------------------   ----------------------------------------
-- INTEGER PRIMARY KEY AUTOINCREMENT    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY
-- BOOLEAN DEFAULT 1                    TINYINT(1) NOT NULL DEFAULT 1
-- DATETIME DEFAULT CURRENT_TIMESTAMP   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
-- updated_at 自动更新                   ... DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- JSON（实为 TEXT 亲和）                JSON
-- FLOAT                                FLOAT
-- NUMERIC(5,2)                         DECIMAL(5,2)
-- 无字符集概念                          ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
-- 无表注释                              COMMENT='xxx'（本脚本中各字段注释可直接转为 COMMENT）
-- PRAGMA foreign_keys = ON             MySQL 默认强制外键，无需该语句
--
-- 注意：MySQL 下请将 NUMERIC 全部改为 DECIMAL，布尔改为 TINYINT(1)，
--       并为每张表追加 ENGINE/CHARSET 子句。
-- =====================================================================

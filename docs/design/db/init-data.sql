-- =====================================================================
-- 辰光 Agent 平台 — 初始化数据脚本 (RBAC V2)
-- =====================================================================
-- 目标库 : SQLite 3（rbac.db）
-- 前置   : 先执行 script.sql 建表
-- 执行   : sqlite3 rbac.db < init-data.sql
-- 幂等   : 使用 INSERT OR REPLACE / 固定主键，可重复执行
--
-- 说明：PROJECT_SPEC_V2 §5.1.3 标注「共 43 个权限码」，但按该节
--       逐模块清单实际为 44 个（user 5 + role 5 + permission 4 +
--       agent 5 + model 5 + provider 5 + prompt 5 + knowledge 5 +
--       tool 5）。本脚本以逐模块清单为准，共 44 个。
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- 1. 权限码（44 个）
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO permissions (id, code, name, description) VALUES
-- 用户 user（5）
(1,  'user:view',              '查看用户',     '分页搜索/查看用户列表'),
(2,  'user:create',            '创建用户',     '新建用户账号'),
(3,  'user:update',            '编辑用户',     '修改用户信息、状态'),
(4,  'user:delete',            '删除用户',     '删除用户账号'),
(5,  'user:assign-role',       '分配用户角色', '给用户分配或变更角色'),
-- 角色 role（5）
(6,  'role:view',              '查看角色',     '分页搜索/查看角色列表'),
(7,  'role:create',            '创建角色',     '新建角色'),
(8,  'role:update',            '编辑角色',     '修改角色信息与数据范围'),
(9,  'role:delete',            '删除角色',     '删除角色'),
(10, 'role:assign-permission', '分配角色权限', '给角色分配或变更权限'),
-- 权限 permission（4）
(11, 'permission:view',        '查看权限',     '分页搜索/查看权限列表'),
(12, 'permission:create',      '创建权限',     '新建权限码'),
(13, 'permission:update',      '编辑权限',     '修改权限名称与描述'),
(14, 'permission:delete',      '删除权限',     '删除权限码'),
-- Agent（5）
(15, 'agent:view',             '查看 Agent',   '查看 Agent 列表与详情'),
(16, 'agent:create',           '创建 Agent',   '新建 Agent 配置'),
(17, 'agent:update',           '编辑 Agent',   '修改 Agent 配置、启停'),
(18, 'agent:delete',           '删除 Agent',   '删除 Agent'),
(19, 'agent:publish',          '发布 Agent',   '发布/回滚 Agent 版本'),
-- 模型 model（5）
(20, 'model:view',             '查看模型',     '查看模型列表与详情'),
(21, 'model:create',           '创建模型',     '新建模型配置'),
(22, 'model:update',           '编辑模型',     '修改模型配置'),
(23, 'model:delete',           '删除模型',     '删除模型'),
(24, 'model:test',             '模型连接测试', '测试模型连通性'),
-- 供应商 provider（5）
(25, 'provider:view',          '查看供应商',   '查看供应商列表与详情'),
(26, 'provider:create',        '创建供应商',   '新建供应商'),
(27, 'provider:update',        '编辑供应商',   '修改供应商配置'),
(28, 'provider:delete',        '删除供应商',   '删除供应商'),
(29, 'provider:test',          '供应商连接测试','测试供应商连通性'),
-- Prompt（5）
(30, 'prompt:view',            '查看 Prompt',  '查看 Prompt 列表与详情'),
(31, 'prompt:create',          '创建 Prompt',  '新建 Prompt'),
(32, 'prompt:update',          '编辑 Prompt',  '修改 Prompt 内容'),
(33, 'prompt:delete',          '删除 Prompt',  '删除 Prompt'),
(34, 'prompt:publish',         '发布 Prompt',  '发布/回滚 Prompt 版本'),
-- 知识库 knowledge（5）
(35, 'knowledge:view',         '查看知识库',   '查看知识库列表与详情'),
(36, 'knowledge:create',       '创建知识库',   '新建知识库'),
(37, 'knowledge:update',       '编辑知识库',   '修改知识库配置'),
(38, 'knowledge:delete',       '删除知识库',   '删除知识库'),
(39, 'knowledge:document-manage','管理知识库文档','文档上传/处理/分段管理'),
-- 工具 tool（5）
(40, 'tool:view',              '查看工具',     '查看工具列表与详情'),
(41, 'tool:create',            '创建工具',     '新建工具'),
(42, 'tool:update',            '编辑工具',     '修改工具配置'),
(43, 'tool:delete',            '删除工具',     '删除工具'),
(44, 'tool:test',              '工具测试',     '测试工具 API 调用');

-- ---------------------------------------------------------------------
-- 2. 角色（3 个）
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO roles (id, code, name, description, data_scope) VALUES
(1, 'super_admin', '超管',     '系统超级管理员，拥有全部权限与全量数据', 'all'),
(2, 'operator',    '运营人员', '可查看全部数据，可创建编辑业务资源',     'all'),
(3, 'user',        '普通用户', '仅可查看本人创建的业务资源',             'self');

-- ---------------------------------------------------------------------
-- 3. 角色-权限映射
-- ---------------------------------------------------------------------
-- 3.1 超管：全部 44 个权限
INSERT OR REPLACE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- 3.2 运营人员：业务模块的查看/创建/编辑/发布（无删除、无系统管理）
INSERT OR REPLACE INTO role_permissions (role_id, permission_id) VALUES
(2, 15), (2, 16), (2, 17), (2, 19),              -- agent: view/create/update/publish
(2, 20), (2, 24),                                 -- model: view/test
(2, 25), (2, 29),                                 -- provider: view/test
(2, 30), (2, 31), (2, 32), (2, 34),              -- prompt: view/create/update/publish
(2, 35), (2, 36), (2, 37), (2, 39),              -- knowledge: view/create/update/document-manage
(2, 40), (2, 41), (2, 42), (2, 44);              -- tool: view/create/update/test

-- 3.3 普通用户：业务模块只读
INSERT OR REPLACE INTO role_permissions (role_id, permission_id) VALUES
(3, 15),   -- agent:view
(3, 20),   -- model:view
(3, 25),   -- provider:view
(3, 30),   -- prompt:view
(3, 35),   -- knowledge:view
(3, 40);   -- tool:view

-- ---------------------------------------------------------------------
-- 4. 用户（4 个）
--    口令均为 123456（bcrypt cost=12）
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO users (id, username, email, hashed_password, is_active, is_superuser, last_login) VALUES
(1, 'admin',    'admin@chenguang.ai',    '$2b$12$7C.WPCbLhskNDlOjs/y1ieYE1o6jLtgyOTR24cYXYBlU.fnbe3nrK', 1, 1, '2026-11-08 09:00:00'),
(2, 'zhangsan', 'zhangsan@chenguang.ai', '$2b$12$7C.WPCbLhskNDlOjs/y1ieYE1o6jLtgyOTR24cYXYBlU.fnbe3nrK', 1, 0, '2026-11-07 18:20:00'),
(3, 'lisi',     'lisi@chenguang.ai',     '$2b$12$7C.WPCbLhskNDlOjs/y1ieYE1o6jLtgyOTR24cYXYBlU.fnbe3nrK', 1, 0, '2026-11-07 14:05:00'),
(4, 'wangwu',   'wangwu@chenguang.ai',   '$2b$12$7C.WPCbLhskNDlOjs/y1ieYE1o6jLtgyOTR24cYXYBlU.fnbe3nrK', 0, 0, '2026-10-30 11:00:00');

-- ---------------------------------------------------------------------
-- 5. 用户-角色映射
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO user_roles (user_id, role_id) VALUES
(1, 1),   -- admin    -> 超管
(2, 2),   -- zhangsan -> 运营人员
(3, 3),   -- lisi     -> 普通用户
(4, 3);   -- wangwu   -> 普通用户（已禁用）

-- ---------------------------------------------------------------------
-- 6. 模型供应商（3 个）
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO model_providers (id, name, type, status, endpoint, api_key, description) VALUES
(1, 'OpenAI',      'openai',    'connected', 'https://api.openai.com/v1',      'sk-encrypted-openai-key',    'OpenAI 官方 API'),
(2, 'Anthropic',   'anthropic', 'connected', 'https://api.anthropic.com',      'sk-encrypted-anthropic-key', 'Anthropic Claude 系列'),
(3, '阿里云百炼',   'aliyun',    'connected', 'https://dashscope.aliyuncs.com', 'sk-encrypted-aliyun-key',    '阿里云通义千问系列');

-- ---------------------------------------------------------------------
-- 7. 模型（3 个）
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO models
(id, name, model_id, provider_id, capabilities, context_length, status, input_price, output_price, currency, is_default, description) VALUES
(1, 'GPT-4o',        'gpt-4o',          1, 'function_call,vision,streaming', 128000, 'available', 0.005000, 0.015000, 'USD', 1, 'OpenAI 旗舰多模态模型'),
(2, 'Claude Sonnet', 'claude-sonnet-4-5', 2, 'function_call,vision,streaming', 200000, 'available', 0.003000, 0.015000, 'USD', 0, 'Anthropic 均衡型模型'),
(3, '通义千问 Max',   'qwen-max',        3, 'function_call,streaming',         32768, 'available', 0.002400, 0.009600, 'CNY', 0, '阿里云旗舰模型，中文能力强');

-- ---------------------------------------------------------------------
-- 8. Agent（5 个）
--    数据范围验证用：admin(1) 与 zhangsan(2)、lisi(3) 各有权属数据
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO agents
(id, name, description, type, status, model_id, config, success_rate, call_count_7d, version, created_by, created_by_id) VALUES
(1, '智能客服Agent', '处理客户咨询与常见问题解答',   'conversation', 'active',   1,
 '{"model":{"temperature":0.7,"maxTokens":4096},"prompt":{"systemPrompt":"你是一名专业的客服人员，请礼貌、准确地回答用户问题。"},"rag":{"enabled":true,"topK":5},"tools":{"enabled":false}}',
 98.50, 12847, 'v1.1', 'admin', 1),
(2, '代码审查Agent', '自动化代码审查与质量检查',     'tool',         'active',   2,
 '{"model":{"temperature":0.2,"maxTokens":8192},"prompt":{"systemPrompt":"你是资深代码审查专家，请指出潜在缺陷并给出修改建议。"},"tools":{"enabled":true}}',
 97.10, 8234,  'v1.0', 'zhangsan', 2),
(3, '数据分析Agent', '数据分析与可视化报告生成',     'analysis',     'draft',    1,
 '{"model":{"temperature":0.3,"maxTokens":4096},"prompt":{"systemPrompt":"你是数据分析师，请基于给定数据生成结论。"}}',
 95.20, 5632,  'v0.1', 'admin', 1),
(4, '翻译助手Agent', '多语言翻译与本地化服务',       'creative',     'inactive', 3,
 '{"model":{"temperature":0.5,"maxTokens":2048},"prompt":{"systemPrompt":"你是专业译者，译文需自然流畅。"}}',
 99.10, 4521,  'v1.0', 'lisi', 3),
(5, '文档摘要Agent', '长文档智能摘要提取',           'tool',         'error',    2,
 '{"model":{"temperature":0.4,"maxTokens":4096},"prompt":{"systemPrompt":"请提取文档核心要点，输出结构化摘要。"}}',
 88.50, 2134,  'v1.1', 'zhangsan', 2);

-- ---------------------------------------------------------------------
-- 9. Agent 版本
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO agent_versions
(id, agent_id, version, config, changelog, is_current, published_by, published_at) VALUES
(1, 1, 'v1.0', '{"model":{"temperature":0.7}}', '初始版本',                   0, 'admin',    '2026-10-20 10:00:00'),
(2, 1, 'v1.1', '{"model":{"temperature":0.7},"rag":{"enabled":true,"topK":5}}', '添加 RAG 知识库检索', 1, 'admin', '2026-11-01 15:30:00'),
(3, 2, 'v1.0', '{"model":{"temperature":0.2}}', '初始版本',                   1, 'zhangsan','2026-10-25 09:15:00');

-- ---------------------------------------------------------------------
-- 10. Prompt 模板（3 个）
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO prompts
(id, name, description, category, tags, content, variables, version, status, created_by) VALUES
(1, '客服应答模板', '标准客服话术模板', 'service', '["客服","话术"]',
 '你是 {{company}} 的客服代表。用户问题：{{question}}。请基于知识库内容作答，语气礼貌。',
 '[{"name":"company","type":"string","description":"公司名称","required":true},{"name":"question","type":"string","description":"用户问题","required":true}]',
 'v1.0', 'published', 'admin'),
(2, '代码审查模板', 'Pull Request 审查提示词', 'development', '["代码","审查"]',
 '请审查以下 {{language}} 代码，指出安全、性能与可读性问题：\n\n{{code}}',
 '[{"name":"language","type":"string","description":"编程语言","required":true},{"name":"code","type":"text","description":"待审查代码","required":true}]',
 'v1.0', 'published', 'zhangsan'),
(3, '会议纪要模板', '将会议记录整理为结构化纪要', 'general', '["会议","纪要"]',
 '请将以下会议记录整理为结构化纪要，包含：议题、结论、待办事项。\n\n{{transcript}}',
 '[{"name":"transcript","type":"text","description":"会议原始记录","required":true}]',
 'v0.1', 'draft', 'lisi');

-- ---------------------------------------------------------------------
-- 11. Prompt 版本
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO prompt_versions
(id, prompt_id, version, content, changelog, is_current, published_by, published_at) VALUES
(1, 1, 'v1.0', '你是 {{company}} 的客服代表。用户问题：{{question}}。请基于知识库内容作答，语气礼貌。', '初始版本', 1, 'admin', '2026-10-22 11:00:00'),
(2, 2, 'v1.0', '请审查以下 {{language}} 代码，指出安全、性能与可读性问题：\n\n{{code}}', '初始版本', 1, 'zhangsan', '2026-10-26 16:40:00'),
(3, 3, 'v0.1', '请将以下会议记录整理为结构化纪要，包含：议题、结论、待办事项。\n\n{{transcript}}', '初始草稿', 1, 'lisi', NULL);

-- ---------------------------------------------------------------------
-- 12. 知识库（2 个）
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO knowledge_bases
(id, name, description, status, document_count, segment_count, embedding_model,
 chunk_method, chunk_size, chunk_overlap, retrieval_strategy, top_k, similarity_threshold, created_by) VALUES
(1, '产品文档知识库', '产品手册与使用说明',     'ready',     2, 5, 'text-embedding-3-small', 'fixed', 500, 50, 'hybrid', 5, 0.70, 'admin'),
(2, '内部制度知识库', '公司规章制度与流程文档', 'indexing',  1, 0, 'text-embedding-3-small', 'sentence', 300, 30, 'vector', 3, 0.75, 'zhangsan');

-- ---------------------------------------------------------------------
-- 13. 文档（3 个）
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO documents
(id, knowledge_base_id, file_name, file_type, file_size, minio_path, status, segment_count, word_count, uploaded_by, processed_at) VALUES
(1, 1, '产品手册_v2.pdf',   'pdf', '2.4MB', 'knowledge-docs/1/产品手册_v2.pdf',   'completed', 3, 3200, 'admin',    '2026-11-02 10:20:00'),
(2, 1, '常见问题FAQ.md',    'md',  '48KB',  'knowledge-docs/1/常见问题FAQ.md',    'completed', 2, 1500, 'admin',    '2026-11-02 10:25:00'),
(3, 2, '员工手册.docx',      'docx','1.1MB', 'knowledge-docs/2/员工手册.docx',     'processing', 0, 0,    'zhangsan', NULL);

-- ---------------------------------------------------------------------
-- 14. 分段（5 个）
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO segments
(id, knowledge_base_id, document_id, position, content, word_count, token_count, hit_count) VALUES
(1, 1, 1, 1, '产品概述：辰光 Agent 平台是面向企业的 AI Agent 管理与编排系统，支持 Agent 全生命周期管理。', 42, 58, 36),
(2, 1, 1, 2, '核心能力：知识库 RAG、Prompt 工程化管理、多模型调度、工具编排与对话日志分析。',        38, 52, 28),
(3, 1, 1, 3, '部署方式：支持私有化部署，数据库可选用 MySQL 或 SQLite，对象存储兼容 MinIO。',          34, 47, 19),
(4, 1, 2, 1, '常见问题一：如何创建 Agent？进入 Agent 管理页，点击「创建 Agent」，填写基本信息与模型配置后发布。', 50, 72, 41),
(5, 1, 2, 2, '常见问题二：如何分配权限？在系统管理中为用户分配角色，角色决定功能权限与数据范围。',      40, 56, 33);

-- ---------------------------------------------------------------------
-- 15. 工具（3 个）
-- ---------------------------------------------------------------------
INSERT OR REPLACE INTO tools
(id, name, description, type, status, config, function_definition, call_count_7d, success_rate, avg_latency, created_by) VALUES
(1, '网页搜索', '调用搜索引擎获取实时网页结果', 'http_api', 'enabled',
 '{"method":"GET","url":"https://api.search.example.com/v1/search","headers":{"Authorization":"Bearer sk-xxx"}}',
 '{"name":"web_search","description":"搜索网页","parameters":{"type":"object","properties":{"query":{"type":"string","description":"搜索关键词"}},"required":["query"]}}',
 3420, 99.20, 820, 'admin'),
(2, '代码执行', '在沙箱中执行 Python 代码',     'builtin',  'enabled',
 '{"runtime":"python3.11","timeout":30}',
 '{"name":"run_python","description":"执行 Python 代码","parameters":{"type":"object","properties":{"code":{"type":"string","description":"要执行的代码"}},"required":["code"]}}',
 1876, 96.50, 1450, 'zhangsan'),
(3, '邮件发送', '通过 SMTP 发送邮件',          'http_api', 'disabled',
 '{"method":"POST","url":"https://api.mail.example.com/send"}',
 '{"name":"send_email","description":"发送邮件","parameters":{"type":"object","properties":{"to":{"type":"string"},"subject":{"type":"string"},"body":{"type":"string"}},"required":["to","subject","body"]}}',
 0, 0.00, 0, 'admin');

-- =====================================================================
-- 初始化完成
-- =====================================================================

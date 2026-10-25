# 辰光Agent平台 — 产品需求文档 V2（RBAC 授权功能）

> 本文档是 `PROJECT_SPEC.md`（V1）的需求增量补充，聚焦于 **RBAC 授权（Authorization）** 能力的补齐。
> 阅读本文档前请先阅读 V1：`docs/PROJECT_SPEC.md`。

---

## 1. 文档信息

| 项 | 内容 |
|---|---|
| 文档名称 | PROJECT_SPEC_V2.md |
| 版本 | V2.0（初稿） |
| 编写日期 | 2026-10-25 |
| 状态 | 需求对齐完成，待评审 |
| 前置文档 | `docs/PROJECT_SPEC.md`（V1） |
| 目标读者 | 后端开发者、前端开发者、测试、产品 |
| 变更类型 | 需求增量（在 V1 基础上新增授权能力） |

---

## 2. 背景与目标

### 2.1 背景

V1 已经完成了 RBAC 的 **前半段**：

- **认证（Authentication）**：登录 → 验证码 → JWT → `get_current_user`，能确认"你是谁"。
- **权限对象管理**：用户、角色、权限三张表及 `user_roles`、`role_permissions` 关联表已建好，CRUD、分页搜索、分配角色、分配权限接口均已实现。

但 RBAC 的 **后半段——授权（Authorization）缺失**。当前系统"能管权限，却不查权限"：

- 所有受保护接口只做认证，不做授权，任何人登录后即可调用任意接口（含删除用户、改角色权限）。
- `is_superuser`、`Permission.code` 字段已建好但从未被校验。
- 业务数据（Agent、知识库、Prompt、工具）虽有 `created_by` 字段，但只是字符串，未参与任何隔离。

### 2.2 目标

在 V1 基础上补齐 **授权** 能力，使系统达到：

1. **功能权限（接口级授权）**：每个接口都能校验"当前用户是否具备所需权限码"，无权限则拒绝。
2. **数据权限（两档数据范围）**：普通用户默认只能看到自己创建的业务数据；被授予 `all` 范围的角色（含超管）可见全部数据。

### 2.3 成功标准

- 一个无权限的普通用户，无法通过直接调用接口访问/操作任何未授权的资源（后端拦截，而非仅前端隐藏）。
- 一个 `data_scope=self` 的用户，即使拿到正确的接口权限，也查询不到他人创建的 Agent/知识库/Prompt/工具。
- 超管可绕过一切功能权限与数据权限校验。
- 前端菜单与按钮按当前用户权限动态显隐，无权限操作给出明确反馈。

---

## 3. 现状基线（已核实）

> 以下为写本文档时对代码的核实结果，作为 PRD 的"起点"。

### 3.1 已有能力

| 能力 | 现状 |
|---|---|
| 用户/角色/权限 CRUD + 分页搜索 | ✅ 已实现 |
| 用户-角色、角色-权限 多对多关联 | ✅ 已实现（`lazy="selectin"`） |
| 登录（验证码 + JWT） | ✅ 已实现 |
| `get_current_user` 认证依赖 | ✅ 已实现（`src/core/deps.py`） |
| `is_superuser` / `Permission.code` 字段 | ✅ 字段已建，❌ 从未校验 |
| 业务模块（agent/knowledge/model/prompt/provider/tool） | ✅ 已实现（V1 标注"待实现"已过时） |
| `created_by` 字段 | ⚠️ 存在于 agent/knowledge/prompt/tool，为 `String(100)`，非外键 |

### 3.2 缺口清单

| 缺口 | 影响 |
|---|---|
| 无任何授权依赖（无 `require_permission` / `require_superuser`） | 接口登录即放行，越权风险 |
| `is_superuser` 从未参与判定 | 超管概念形同虚设 |
| `created_by` 为字符串而非外键 | 无法可靠地按用户做数据隔离 |
| 登录只返回 token，`UserRead` 不含角色/权限 | 前端无法知道"我能做什么" |
| 迁移无种子数据，无初始超管创建路径 | 授权落地后缺少引导数据 |

---

## 4. 需求范围

### 4.1 本期纳入（In Scope）

1. 功能权限：接口级授权依赖 + 全量权限码清单 + 接口挂载。
2. 数据权限：两档数据范围（`all` / `self`），挂载在角色上。
3. 前端授权：登录返回权限、菜单/按钮动态显隐、无权限反馈。
4. 引导数据：初始超管、初始角色、全量权限码。
5. 数据模型变更：`Role.data_scope` 新增、`created_by` 升级外键。

### 4.2 本期明确不做（Out of Scope）

| 不做项 | 说明 |
|---|---|
| 部门/组织层级 | 无部门表，本期不做"本部门/本部门及以下" |
| 五档数据范围 | 只做 `all` / `self` 两档，不做"自定义" |
| 字段级/单元格级权限 | 权限粒度到"接口 + 数据行"，不到字段 |
| 业务模块功能本身 | 不改 Agent/知识库等模块已有业务逻辑，只加授权 |
| 审计日志 | 本期不做授权审计（系统管理"审计日志"属另一需求） |

---

## 5. 需求详述

### 5.1 功能权限（接口级授权）

#### 5.1.1 授权模型与语义

- **授权单位**：权限码（`Permission.code`）。
- **判定语义**：OR 语义——当前用户所拥有的任一角色、其任一权限码与接口要求的权限码集合存在交集，即放行。
- **超管绕过**：`is_superuser=True` 的用户，跳过一切功能权限校验，直接放行。
- **未登录**：由 `get_current_user` 兜底，返回 401（现状不变）。
- **已登录但无权限**：拒绝访问，返回业务错误码 `403`，message 提示"无权限"。

#### 5.1.2 权限码规范

- 格式：`模块:操作`，全小写，模块与操作之间用英文冒号分隔。
- 模块：与后端 `src/modules/` 目录对应。
- 操作：`view`（查看/列表）、`create`（创建）、`update`（编辑）、`delete`（删除），以及模块特定操作（如 `publish`、`assign-role`、`test`、`document-manage`）。

#### 5.1.3 全量权限码清单

| 模块 | 权限码 | 说明 |
|---|---|---|
| 用户 user | `user:view` | 查看/分页搜索用户 |
| | `user:create` | 创建用户 |
| | `user:update` | 编辑用户 |
| | `user:delete` | 删除用户 |
| | `user:assign-role` | 给用户分配/变更角色 |
| 角色 role | `role:view` | 查看/分页搜索角色 |
| | `role:create` | 创建角色 |
| | `role:update` | 编辑角色 |
| | `role:delete` | 删除角色 |
| | `role:assign-permission` | 给角色分配/变更权限 |
| 权限 permission | `permission:view` | 查看/分页搜索权限 |
| | `permission:create` | 创建权限 |
| | `permission:update` | 编辑权限 |
| | `permission:delete` | 删除权限 |
| Agent | `agent:view` | 查看 Agent |
| | `agent:create` | 创建 Agent |
| | `agent:update` | 编辑 Agent |
| | `agent:delete` | 删除 Agent |
| | `agent:publish` | 发布 Agent / 版本管理 |
| 模型 model | `model:view` | 查看模型 |
| | `model:create` | 创建模型 |
| | `model:update` | 编辑模型 |
| | `model:delete` | 删除模型 |
| | `model:test` | 模型连接测试 |
| 供应商 provider | `provider:view` | 查看供应商 |
| | `provider:create` | 创建供应商 |
| | `provider:update` | 编辑供应商 |
| | `provider:delete` | 删除供应商 |
| | `provider:test` | 供应商连接测试 |
| Prompt | `prompt:view` | 查看 Prompt |
| | `prompt:create` | 创建 Prompt |
| | `prompt:update` | 编辑 Prompt |
| | `prompt:delete` | 删除 Prompt |
| | `prompt:publish` | 发布 Prompt / 版本管理 |
| 知识库 knowledge | `knowledge:view` | 查看知识库 |
| | `knowledge:create` | 创建知识库 |
| | `knowledge:update` | 编辑知识库（含配置） |
| | `knowledge:delete` | 删除知识库 |
| | `knowledge:document-manage` | 文档上传/处理/分段管理 |
| 工具 tool | `tool:view` | 查看工具 |
| | `tool:create` | 创建工具 |
| | `tool:update` | 编辑工具 |
| | `tool:delete` | 删除工具 |
| | `tool:test` | 工具测试 |

> 共 9 个模块、43 个权限码。认证（auth）、验证码（captcha）为公开接口，无需权限码。

#### 5.1.4 授权依赖定义

在 `src/core/deps.py` 中新增两个依赖工厂（实现细节由开发完成，此处只描述行为）：

- **`require_permission(*codes)`**：
  1. 依赖 `get_current_user` 完成认证。
  2. 若 `user.is_superuser` 为真 → 放行。
  3. 否则汇总 `user.roles[*].permissions[*].code`，与 `codes` 求交集。
  4. 交集为空 → 抛 `403 无权限`。
- **`require_superuser`**：非超管 → 抛 `403 无权限`。

#### 5.1.5 接口挂载规则与矩阵

- **挂载规则**：`GET`（列表/详情）→ `模块:view`；`POST` → `模块:create`；`PUT` → `模块:update`；`DELETE` → `模块:delete`；模块特定动作（分配、发布、测试、文档管理）→ 对应特定权限码。
- **系统管理接口**（用户/角色/权限）整体挂 `require_superuser`（超管专属），不再按细粒度权限码逐个校验。

| 模块 | 接口（前缀） | 所需授权 |
|---|---|---|
| 认证 auth | `POST /auth/login` | 公开 |
| 验证码 captcha | `GET /captcha`、`POST /captcha` | 公开 |
| 用户 user | `/users/*`（全部） | `require_superuser` |
| 角色 role | `/roles/*`（全部） | `require_superuser` |
| 权限 permission | `/permissions/*`（全部） | `require_superuser` |
| Agent | `GET /agents*` | `require_permission("agent:view")` |
| | `POST /agents` | `require_permission("agent:create")` |
| | `PUT /agents*` | `require_permission("agent:update")` |
| | `DELETE /agents*` | `require_permission("agent:delete")` |
| | 发布/版本接口 | `require_permission("agent:publish")` |
| 模型 model | 对应 GET/POST/PUT/DELETE | `model:view` / `model:create` / `model:update` / `model:delete` |
| | 连接测试接口 | `require_permission("model:test")` |
| 供应商 provider | 对应 GET/POST/PUT/DELETE | `provider:view` / `provider:create` / `provider:update` / `provider:delete` |
| | 连接测试接口 | `require_permission("provider:test")` |
| Prompt | 对应 GET/POST/PUT/DELETE | `prompt:view` / `prompt:create` / `prompt:update` / `prompt:delete` |
| | 发布/版本接口 | `require_permission("prompt:publish")` |
| 知识库 knowledge | 对应 GET/POST/PUT/DELETE | `knowledge:view` / `knowledge:create` / `knowledge:update` / `knowledge:delete` |
| | 文档上传/处理/分段接口 | `require_permission("knowledge:document-manage")` |
| 工具 tool | 对应 GET/POST/PUT/DELETE | `tool:view` / `tool:create` / `tool:update` / `tool:delete` |
| | 测试接口 | `require_permission("tool:test")` |

> 具体到每个路由的精确权限码，在开发阶段以各模块 `api.py` 的实际路由清单为准，遵循上述映射规则逐一挂载。

### 5.2 数据权限（两档数据范围）

#### 5.2.1 数据范围定义

- 新增 `Role.data_scope` 字段，枚举值：`all`（全部数据）、`self`（仅本人数据），默认 `self`。
- 超管角色（或超管用户）锁定为 `all`，不可修改。

#### 5.2.2 当前用户数据范围判定

按以下优先级判定当前登录用户的数据范围：

1. 若 `user.is_superuser` 为真 → `all`。
2. 若用户的任一角色 `data_scope == "all"` → `all`。
3. 否则 → `self`。

#### 5.2.3 资源边界

| 资源 | 数据范围约束 | 说明 |
|---|---|---|
| Agent | ✅ 受约束 | `self` 用户仅见自己创建的 |
| 知识库 knowledge | ✅ 受约束 | 同上 |
| Prompt | ✅ 受约束 | 同上 |
| 工具 tool | ✅ 受约束 | 同上 |
| 模型 model | ❌ 不受约束 | 组织级共享，有 `model:view` 即全员可见 |
| 供应商 provider | ❌ 不受约束 | 组织级共享，有 `provider:view` 即全员可见 |
| 用户/角色/权限 | ❌ 不适用 | 超管专属，不按创建者隔离 |

#### 5.2.4 过滤与写入规则

- **查询过滤**：对受约束资源，当当前用户数据范围为 `self` 时，列表/搜索/详情查询须追加"创建者 = 当前用户"条件；范围为 `all` 时不过滤。
- **写入归属**：受约束资源创建时，自动写入"创建者 = 当前用户"。
- **越权访问**：`self` 用户访问他人创建的数据，返回 `403 无权限`（或等价的"资源不存在"语义，避免泄露资源存在性）。

### 5.3 前端授权

#### 5.3.1 权限获取

- 登录成功响应扩展，除 `access_token` 外返回当前用户的 **权限码列表** 与 **数据范围**（`permissions`、`data_scope`）。
- 提供当前用户信息接口（扩展 `/users/me` 或新增接口），返回角色、权限码、数据范围，供前端刷新权限。

#### 5.3.2 菜单/按钮动态显隐

- 新增前端权限上下文（存储当前用户权限码 + 数据范围）。
- 侧边栏菜单项按所需权限码显隐（无权限的菜单不渲染）。
- 页面内按钮（创建/编辑/删除/发布等）按权限码显隐。
- 提供权限判断能力（如"是否拥有某权限码"），供各页面组件复用。

#### 5.3.3 无权限反馈

- 后端返回 403 时，前端统一提示"无权限"，不跳转登录（与 401 区分）。
- 数据范围受限时，列表仅展示本人数据，无需特殊提示。

### 5.4 引导数据（Seed）

新增初始化/引导机制（seed 脚本或首次启动检查），写入：

1. **初始超管**：`admin`（`is_superuser=True`，密码首登强制修改，具体实现由开发确定）。
2. **初始角色**：
   - 「超管」角色：`data_scope=all`，锁定不可改，绑定全量权限码。
   - 「普通用户」角色：`data_scope=self`，绑定常用查看类权限码。
3. **全量权限码**：按 5.1.3 清单写入 `permissions` 表。

> 引导数据须幂等（重复执行不产生重复数据），且不影响既有数据。

---

## 6. 数据模型变更

### 6.1 变更清单

| 表/模型 | 变更 | 说明 |
|---|---|---|
| `roles` | 新增字段 `data_scope` | `String(20)`，枚举 `all`/`self`，默认 `self`，非空 |
| `agents.created_by` | 类型变更 | 由 `String(100)` 升级为指向 `users.id` 的外键 |
| `knowledge_bases.created_by` | 类型变更 | 同上 |
| `prompts.created_by` | 类型变更 | 同上 |
| `tools.created_by` | 类型变更 | 同上 |

> 不新增表；`user_roles`、`role_permissions` 结构不变。

### 6.2 迁移与兼容策略

- 通过 Alembic 生成迁移脚本（新增 `roles.data_scope`；变更 `created_by` 类型）。
- **`created_by` 旧数据迁移**：现有值为"创建者字符串"（历史开发/测试数据）。迁移时：
  - 按旧字符串匹配 `users.username` 回填为新外键值；
  - 无法匹配的记录置空，置空数据的资源仅 `all` 范围用户可见；
  - 若旧数据为可丢弃的开发数据，允许在迁移说明中声明后直接清空。
- **既有角色**：`data_scope` 默认回填 `self`；将既有超管绑定角色的 `data_scope` 回填为 `all`。

---

## 7. 接口规范变更

| 接口 | 变更 |
|---|---|
| `POST /auth/login` | 响应增加 `permissions`、`data_scope` 字段 |
| `GET /users/me` | 返回结构增加角色、权限码、数据范围（或新增等价接口） |
| 用户/角色/权限 全部接口 | 挂载 `require_superuser`（行为变化） |
| 业务模块接口 | 按 5.1.5 挂载对应权限码（行为变化） |
| 角色 `RoleCreate` / `RoleUpdate` / `RoleRead` | 增加 `data_scope` 字段 |

> 通用响应格式（`code` / `message` / `data`）与分页格式不变。403 通过业务错误码返回（与 401 区分）。

---

## 8. 非功能性需求

| 项 | 要求 |
|---|---|
| 安全 | 授权判定必须在后端强制（前端隐藏仅为体验优化，不可作为安全边界） |
| 性能 | 权限/数据范围判定避免每请求多次查询；可结合 `selectin` 预加载或缓存当前用户权限码 |
| 兼容 | 不破坏既有认证链路与通用响应格式；`VITE_USE_MOCK` 前端 mock 模式需同步提供权限模拟数据 |
| 幂等 | seed 引导数据可重复执行 |
| 可观测 | 无权限拒绝建议记录日志（含用户、接口、所需权限码），便于排查 |

---

## 9. 验收标准

### 9.1 功能权限

- [ ] 普通用户（无 `user:view` 权限）访问用户列表接口 → 返回 403。
- [ ] 超管访问任意接口 → 放行。
- [ ] 拥有 `agent:create` 但无 `agent:delete` 的用户：可创建、不可删除。

### 9.2 数据权限

- [ ] `data_scope=self` 用户查询 Agent 列表 → 仅返回自己创建的数据。
- [ ] `data_scope=self` 用户访问他人创建的 Agent 详情 → 返回 403。
- [ ] `data_scope=all` 角色（非超管）查询 Agent 列表 → 返回全部数据。
- [ ] 模型/供应商列表 → 有 `view` 权限即全员可见，不受数据范围影响。

### 9.3 前端

- [ ] 登录后侧边栏菜单按权限显隐。
- [ ] 无权限按钮不渲染；403 返回时提示"无权限"且不跳登录。

### 9.4 引导数据

- [ ] seed 执行后存在 `admin` 超管、「超管」「普通用户」角色、全量权限码。
- [ ] 重复执行 seed 无重复数据。

---

## 10. 风险与依赖

| 风险/依赖 | 说明 | 应对 |
|---|---|---|
| `created_by` 类型迁移 | 旧字符串数据可能无法全部匹配用户 | 按 6.2 策略回填/置空，迁移前备份 |
| 接口挂载遗漏 | 手动逐路由挂载易漏 | 以 `api.py` 实际路由清单逐一对账，纳入测试覆盖 |
| 前端 mock 与后端不一致 | mock 模式需模拟权限/数据范围 | mock 层提供同构权限数据 |
| 权限码膨胀 | 43 个权限码需种子维护 | seed 幂等 + 权限管理页可维护 |

---

## 11. 变更记录

| 日期 | 版本 | 说明 |
|---|---|---|
| 2026-10-25 | V2.0 | 需求对齐完成，新增 RBAC 授权（功能权限 + 两档数据权限 + 前端授权 + 引导数据）需求 |

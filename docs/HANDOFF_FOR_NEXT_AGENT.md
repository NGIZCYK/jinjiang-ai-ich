# 锦江苏绣项目交接文档

更新时间：2026-09-19  
项目目录：`C:\Users\21701\Desktop\jinjiang-ai-ich`  
技术栈：Vite、React、TypeScript、Tailwind、Supabase Auth/Postgres/Edge Functions、DeepSeek、Python 分析快照

## 当前结论

项目已经形成“探索苏绣 → 保存探索卡 → 个性化推荐 → 提交体验意向 → 运营处理 → 住客反馈 → 运营统计”的课程 MVP。Supabase 后端、Edge Function、DeepSeek 和 42 个滚动演示场次已经部署；前端公网地址尚未发布。

当前代码新增了正式测试数据隔离方案。2026-09-19 的只读线上核验显示云端仍返回能力版本 `2026.09.15-guide-v2`，且 `participant_roster` RPC 为 404，因此迁移 `202609190003_guide_signals_and_cohorts.sql` 和最新版 Edge Function尚未推送。部署前端或正式测试前必须先完成这两项。

## 核心行为

- 新账号固定进入 `Demo`，注册页面不能自行选择 `Study 01` 或运营角色。
- 运营在 `/operations` 把尚未产生任何活动的住客分配到 `Study 01`；产生记录后批次锁定。
- 导览不保存聊天原文。未登录访客的结构化标签只保留当前会话；登录住客的主题、时长、预算、同行类型和情感按批次写入 Supabase。
- 运营不能读取逐条导览标签，只能通过 `trial_analytics` 获取批次聚合。
- AI 运营简报在 Edge Function 内重新读取当前批次统计，不信任浏览器提交的漏斗或导览数字。
- 演示场次、价格、容量、“完成”和收入模拟均为课程原型，不代表真实酒店服务。

## 主要代码位置

- `web/src/components/ExplorationTask.tsx`：三步探索任务与探索卡。
- `web/src/components/RecommendationPanel.tsx`：需求卡、规则推荐和 AI 解释。
- `web/src/pages/MyPage.tsx`：推荐、意向、状态历史、撤回和反馈。
- `web/src/pages/OperationsPage.tsx`：参与者批次分配及意向处理。
- `web/src/pages/AnalyticsPage.tsx`：试用观察、批次导览聚合、经营模拟和 AI 简报。
- `supabase/migrations/202609180001_journey.sql`：基础业务表、RLS 和状态 RPC。
- `supabase/migrations/202609180002_ai_quota.sql`：AI 请求限额。
- `supabase/migrations/202609190003_guide_signals_and_cohorts.sql`：正式导览信号、批次分配和聚合统计。
- `supabase/functions/concierge/index.ts`：鉴权后的聊天、推荐解释、语音令牌与运营简报。

## 路由与角色

| 路由 | 用途 | 权限 |
| :--- | :--- | :--- |
| `/` | 礼遇首页 | 公开 |
| `/auth` | 登录和注册 | 公开 |
| `/guide` | 婉娘导览与推荐 | 公开预览；正式信号和保存需登录 |
| `/immersive` | 苏绣艺境与探索任务 | 公开预览；云端保存需登录 |
| `/my` | 探索卡、推荐、意向和反馈 | 登录 |
| `/operations` | 批次分配与体验处理 | 运营 |
| `/studio` | 内容工作台 | 运营 |
| `/analytics` | 试用统计与经营模拟 | 运营 |

页面使用 React lazy loading。构建后的入口主包已从约 653 KB 降到约 433 KB，分析、运营、导览、沉浸和语音 SDK 分包加载。

## 已验证内容

- `npm test -- --run`：2 个测试文件、30 项测试通过。
- 数据库测试覆盖 RLS、角色、批次分配、活动后锁定、导览幂等、跨批次隔离、容量并发、重复意向、状态机、反馈和 AI 配额。
- `npm run build`：TypeScript 与 Vite 构建通过；入口主包不再超过 500 KB。
- 线上现有 v2 环境可访问 Supabase、DeepSeek 和 42 个未来场次，但尚未包含本轮批次隔离接口；部署新迁移后仍需再次回归。

## 部署与验证顺序

1. 运行 `npm test -- --run` 和 `npm run build`。
2. 执行 `supabase db push`，确认迁移 003 生效。
3. 执行 `supabase functions deploy concierge`，检查 `capabilities` 返回 API 版本 `2026.09.19-guide-v3`。
4. 用运营账号给一个全新住客分配 `Study 01`。
5. 两个浏览器走完导览、探索、推荐、意向、确认、模拟完成和反馈。
6. 在 `/analytics` 验证 Study 01 漏斗和导览聚合更新，Demo 数据不混入。
7. 发布前端后，把正式域名加入 `ALLOWED_ORIGINS`，并更新 Supabase Auth Site URL。

完整命令和静态托管配置见根目录 `SUPABASE_SETUP.md` 与 `netlify.toml`。

## 不得破坏的约束

- 不把 service role、DeepSeek、Azure 或 Supabase 管理 token 放入 Vite 环境变量或文档。
- 不在仓库保存有效运营账号密码。
- 不允许注册者自行选择正式测试批次或运营角色。
- 不让客户端直接修改 booking status、capacity、events、reviewer 或批次字段。
- 不把本机会话标签作为正式运营证据。
- 不把模拟完成描述为真实到场，不把经营模拟描述为酒店真实收入。
- AI 失效时必须保留本地知识回答和规则推荐。

## 仍需团队执行

- 轮换已暴露的 Supabase access token、DeepSeek key 和运营账号密码。
- 选择静态托管平台并发布前端，提供正式域名。
- 用两台设备完成人工验收。
- 招募至少 10 名真实测试者，并补充录屏、用户原话和实际完成率。
- 补齐 Checkpoint 报告中导师、用户研究、截图和公网地址占位符。

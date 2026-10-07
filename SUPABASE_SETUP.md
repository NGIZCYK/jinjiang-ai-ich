# Supabase 部署说明

当前仓库包含共享账号、探索卡、个性化推荐、体验意向、运营处理、批次化导览聚合和试用统计迁移。课程使用的 Supabase 后端已经建立，但克隆或移交仓库不会自动获得项目权限；新环境仍需单独 link 和配置。

2026-10-07 已在本地加入后台发布标识 `2026.10.07-concierge-r1`、前端发布回归和只读上线检查。协议仍为 `2026.09.19-guide-v3`；协议相同不表示新代码已部署。原演示项目 uxfxhqdfrzkafekrbzcf 的官网 Origin 能力请求仍为 403；新项目 jhosvgldwgndpudwentv 已部署三个迁移与 concierge，官网能力 200、聊天预检 204，新 revision 已匹配；DeepSeek Key、真实账号验收及原数据恢复仍待完成。最新状态见 [新账户迁移记录](docs/21_新账户后台迁移记录_20261007.md)，此前实施记录见 [线上稳定性实施与验收](docs/20_线上稳定性实施与验收_20261007.md)。

## 1. 创建项目

本节仅用于全新、空的项目。现有课程演示项目 `jhosvgldwgndpudwentv` 使用第 8 节，先核对迁移，不重复 seed 或重置数据。在 Supabase 创建独立项目后执行（Windows PowerShell 使用 `npm.cmd`，避免系统对 `npm.ps1` 的执行策略拦截）：

```powershell
npm.cmd exec --cache .cache/npm --yes --package supabase@2.120.0 -- supabase login
npm.cmd exec --cache .cache/npm --yes --package supabase@2.120.0 -- supabase db push --project-ref <NEW_PROJECT_REF> --include-seed --skip-vault
```

仅全新项目使用 `--include-seed` 创建未来 14 天的演示场次。演示场次的容量、价格和完成记录都是原型假设，不代表真实酒店库存或收入。

## 2. 配置前端

复制 `web/.env.example` 为 `web/.env`，只填写 Supabase 浏览器公开配置：

```env
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

不要把 `service_role`、DeepSeek 或 Azure 密钥写入 `web/.env`，也不要提交 `web/.env`。

## 3. 配置 Edge Function

部署 `supabase/functions/concierge`（共享模块会随函数一起打包），显式指定演示项目：

```powershell
npm.cmd exec --cache .cache/npm --yes --package supabase@2.120.0 -- supabase functions deploy concierge --project-ref jhosvgldwgndpudwentv --use-api
```

在该项目的 **Edge Functions → Secrets** 填写 `DEEPSEEK_API_KEY`，设置 `DEEPSEEK_MODEL=deepseek-chat`、`DEEPSEEK_BASE_URL=https://api.deepseek.com`。`ALLOWED_ORIGINS` 精确包含 `https://idyllic-bubblegum-1f5a5c.netlify.app`（不带末尾斜杠、不使用通配符）。现有源码也默认包含该官网及本地 5180/5181 Origin。真实密钥不要放到命令行参数、聊天或文件提交中。

本轮使用浏览器语音。Edge Function 会验证 Supabase Auth JWT、限制 AI 请求频率，并把聊天、推荐解释和运营简报与模型密钥隔离；不新增 Azure 配置。

## 4. 分配运营账号

先用网页注册账号，再在 Supabase SQL Editor 中由项目管理员执行：

```sql
update public.profiles
set role = 'ops'
where id = '<AUTH_USER_UUID>';
```

运营角色不能由注册表单自行选择。普通用户只能访问自己的探索卡、推荐、意向和反馈；运营人员可以处理意向和查看指定批次的去重统计。

## 5. 测试参与者分配

普通注册账号固定进入 `Demo`。运营账号登录 `/operations` 后，在参与者产生任何探索、推荐、意向或导览记录前将其分配至 `Study 01`。服务端会拒绝普通住客分配批次，并拒绝移动已有活动的参与者。

## 6. 静态部署

仓库根目录的 `netlify.toml` 设置 `web` 为构建目录、`dist` 为发布目录（解析为 `web/dist`），并配置 SPA 回退。构建按以下顺序执行，任一步失败都阻止发布：安装 Python 依赖 → 4 项 Python 测试 → 生成统计 JSON → `npm run test` → 清除旧托管变量覆盖后执行 `build:demo` → `scripts/check-demo-build.mjs` 产物检查。Python 版本为 3.14。

官网为 https://idyllic-bubblegum-1f5a5c.netlify.app 。静态发布已经成功，不能据此认定后台模型、保存和账号隔离已验收。Supabase Auth Site URL 应设置为该官网，重定向地址只保留实际需要的官网及本地地址。Netlify 控制台删除与演示配置冲突的旧托管变量；公开构建使用仓库 `web/.env.demo`。用户已明确要求课程演示恢复住客、运营两个账号卡片，点击仅填入，提交后才登录。

线上验收顺序：注册住客账号（默认 Demo）→ 运营在任务开始前分配 `Study 01` → 住客提交结构化导览需求、保存探索卡和推荐、提交意向 → 运营确认 → 住客刷新查看状态 → 运营标记“模拟流程已完成” → 住客提交一次数字流程反馈 → 运营看板选择 `Study 01` 查看漏斗和导览聚合。

如果没有 Supabase 配置，游客仍可完成艺境探索并使用规则推荐；保存、跨设备同步和运营协同会显示未配置提示，不会伪造成功状态。

## 7. 公开课程演示环境

公开账号自填功能必须使用一个与正式测试项目完全分离的 Supabase 项目。对独立项目执行全部迁移与 `seed.sql`，创建一名住客和一名运营演示用户，再按第 4 节将运营用户设为 `ops`。独立部署 `concierge`，将公开站点域名加入 `ALLOWED_ORIGINS`，并使用单独、低额度的模型密钥。

当前课程演示的两组浏览器可见变量配置在仓库 `web/.env.demo`，供 Netlify 一致构建：

```env
VITE_SHOW_DEMO_ACCOUNTS=true
VITE_DEMO_GUEST_EMAIL=<public-demo-guest-email>
VITE_DEMO_GUEST_PASSWORD=<public-demo-guest-password>
VITE_DEMO_OPS_EMAIL=<public-demo-ops-email>
VITE_DEMO_OPS_PASSWORD=<public-demo-ops-password>
```

这些变量会进入前端构建产物，属于用户授权公开的课程演示账号。登录页在开关为 `true` 且两组值完整时显示住客与运营卡片，点击只填入，不自动登录。Netlify 固定执行 `build:demo`，校验独立演示后台和两个账号预设，并拒绝服务端管理密钥进入产物。正式测试部署应省略这些变量或设置 `VITE_SHOW_DEMO_ACCOUNTS=false`。演示前核验“住客登录 → 退出 → 运营登录 → 退出 → 住客登录”。QA 验收仅清理本次创建的专用账号及关联记录，禁止整库重置或重新 seed。

当前本地 Origin 白名单已精确包含官网；部署后仍需检查真实预检、登录后的回复和来源。2026-10-04 的历史记录见 [发布前验收](docs/14_课程演示修复与验收记录.md)；2026-10-07 已获准执行隔离演示项目的后台发布与专用 QA 账号验收，实际完成情况以本轮验收记录为准。

## 8. 发布到新演示项目（本轮顺序）

原项目为 uxfxhqdfrzkafekrbzcf，新目标为 jhosvgldwgndpudwentv；不要在旧项目执行目标部署命令。完整数据迁移需先取得原项目的管理权限或备份，包含 Auth 用户及关联业务记录，不能只更换 URL 就宣称数据迁移完成。原数据不可取得时，须明确标为架构重建，演示账号需另行创建。

先完成本地测试和构建，再登录。下列命令从仓库根目录执行，所有远程操作都显式指定 `jhosvgldwgndpudwentv`；不依赖 `supabase/.temp/project-ref` 的旧关联。

```powershell
npm.cmd exec --cache .cache/npm --yes --package supabase@2.120.0 -- supabase login
npm.cmd exec --cache .cache/npm --yes --package supabase@2.120.0 -- supabase migration list --project-ref jhosvgldwgndpudwentv
npm.cmd exec --cache .cache/npm --yes --package supabase@2.120.0 -- supabase db query --linked --project-ref jhosvgldwgndpudwentv --file scripts/inspect-demo-backend.sql
```

只读 SQL 用于迁移后的核对，返回迁移版本、RPC 定义/授权与表 RLS 状态，不读取住客或 Auth 记录。空项目没有迁移历史表时先检查 migration list，完成初始化或备份恢复后再执行 SQL。预期迁移为 `202609180001`、`202609180002`、`202609190003`；核对 RPC 定义与仓库相符，客户端 RPC 仅授予 authenticated，敏感表启用 RLS。如线上全部已有，不执行 `db push`。只有确认缺少已有迁移时才先预检：

```powershell
npm.cmd exec --cache .cache/npm --yes --package supabase@2.120.0 -- supabase db push --project-ref jhosvgldwgndpudwentv --skip-vault --dry-run
```

完整备份恢复时先按迁移记录核对，不能再次执行已有 schema。使用仓库重建空项目时，核对预检仅包含三个现有迁移，再去掉 `--dry-run` 应用；不加 `--include-seed`、不执行 reset 或迁移历史修复。已有迁移但 RPC 与仓库不符时先定位差异，不能重跑已存在的整份迁移。

完成第 3 节服务端 Secrets 和函数发布后，从仓库根目录运行：

```powershell
node scripts/check-live-site.mjs
```

脚本仅发公开 GET/OPTIONS，无登录或写入；输出检查时间、状态和布尔结果，失败返回退出码 1。它检查首页、统计 JSON、带官网 Origin 的能力（200、新发布标识、DeepSeek）、聊天预检（204、精确 Origin 与请求头）和陌生 Origin 拒绝。能力声明不证明模型密钥有效，必须接着使用专用账号验证真实流式回答、来源、推荐解释、运营简报和住客—运营闭环。

后台验收通过后才推送 GitHub，等待 Netlify 构建 Published，再重复只读检查并执行浏览器验收。历史公开过的运营密码需要管理员轮换并撤销旧会话；不能把“新包不含密码”当作轮换证据。专用 QA 用户及记录标记为 QA，只清理本次创建的 UUID，保留清理结果。验收项目详见 [本轮记录](docs/20_线上稳定性实施与验收_20261007.md)。

## 9. 新目标部署结果（2026-10-07）

新项目直连 PostgreSQL 的预检被网络中断，已通过 CLI 的 HTTPS `db query --linked --project-ref jhosvgldwgndpudwentv` 将三个原始迁移作为一个事务执行，附加空库保护和迁移历史记录，未执行 seed/reset。13 个 RPC 函数体与仓库一致，执行授权及 11 张业务表 RLS 检查通过。

数据库专用验收：

```powershell
npm.cmd exec --cache .cache/npm --yes --package supabase@2.120.0 -- supabase db query --linked --project-ref jhosvgldwgndpudwentv --file scripts/qa-demo-database.sql
```

该测试以事务内的两名住客和一名运营验证 RPC/RLS、意向、状态、反馈、统计及审核保存，最后回滚全部 QA 数据。它不验证真实 Auth 登录、浏览器或模型，因此不能替代那些验收。初始迁移的事务生成文件与 SHA256 清单保留在本地 `.cache/migration/`，不得在已初始化项目重跑。

用户已授权真实 QA 脚本。`scripts/prepare-qa-accounts.mjs` 创建/恢复/清理三个专用账号，`scripts/check-qa-backend.mjs` 实际执行 12 项后台检查全部通过。管理密钥仅从 stdin 进入进程、不保存、不输出，QA 登录凭据只进入 Git 忽略的缓存，清理后已删除。

新项目关闭新表自动授权，service_role 没有业务表 CRUD 权限；脚本通过 `QA_SUPABASE_CLI` 指定已安装 CLI 的绝对路径，用管理查询进行限于本次 UUID 的角色设置和清理，不扩张 Data API 授权。每次查询都显式指定新 ref；仅身份创建/删除使用 Auth Admin。部分失败可用 `--resume` 继续三个已有账号，`--cleanup` 在账号 metadata 与 manifest 匹配后清理专属业务引用及账号，并再次核验残留为 0。

用户决定不保留旧数据，本轮已改为架构重建。`scripts/prepare-demo-accounts.mjs` 在新项目中建立住客和运营，首次初始化 42 个演示场次。仅在新项目无场次时初始化；重复运行按本地 manifest 恢复，不再 seed。旧源项目不删除、不导入。随后用户明确要求恢复两个公开课程演示入口；现沿用这两名账号，在 `web/.env.demo` 声明预设并允许点击填入。本地备份仍位于 Git 忽略的 `.cache/migration/运营登录凭据.md`，服务端管理密钥仍不进入前端。

最新前端回归为 139 项，另有 4 项 Python 测试；构建与产物检查通过。实际后台及浏览器验收见 [新账户重建记录](docs/21_新账户后台迁移记录_20261007.md)。

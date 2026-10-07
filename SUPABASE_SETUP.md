# Supabase 部署说明

当前仓库包含共享账号、探索卡、个性化推荐、体验意向、运营处理、批次化导览聚合和试用统计迁移。课程使用的 Supabase 后端已经建立，但克隆或移交仓库不会自动获得项目权限；新环境仍需单独 link 和配置。

2026-10-05 只读核对课程演示环境的 `/capabilities`：云端接口为 `2026.09.19-guide-v3`，前端源码已同步该标识。这个标识表示聊天协议兼容性，不表示本轮优化代码已部署。本轮的运营简报 JSON 校验和服务诊断仍需由具有项目权限的成员部署 `concierge`；不新增数据库迁移。具体检查与发布步骤见 `docs/12_Checkpoint前优化与验收_20261005.md`。

## 1. 创建项目

在 Supabase 创建一个独立的课程项目，然后执行：

```powershell
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
supabase db seed
```

`supabase db seed` 会创建未来 14 天的演示场次。演示场次的容量、价格和完成记录都是原型假设，不代表真实酒店库存或收入。

## 2. 配置前端

复制 `web/.env.example` 为 `web/.env`，只填写 Supabase 浏览器公开配置：

```env
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

不要把 `service_role`、DeepSeek 或 Azure 密钥写入 `web/.env`，也不要提交 `web/.env`。

## 3. 配置 Edge Function

部署 `supabase/functions/concierge`，再在 Supabase Function Secrets 中设置：

```powershell
supabase functions deploy concierge
supabase secrets set `
  DEEPSEEK_API_KEY=<server-only-key> `
  DEEPSEEK_MODEL=deepseek-chat `
  DEEPSEEK_BASE_URL=https://api.deepseek.com `
  ALLOWED_ORIGINS=https://<your-site>,http://127.0.0.1:5180,http://127.0.0.1:5181
```

Azure Speech 是可选的；未配置时浏览器会使用本地语音降级。Edge Function 会验证 Supabase Auth JWT、限制 AI 请求频率，并把聊天、推荐解释和运营简报与模型密钥隔离。

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

仓库根目录的 `netlify.toml` 已设置 `web` 为构建目录、`npm run build` 为构建命令、`web/dist` 为发布产物，并配置 SPA 回退。其他托管平台需要配置同等 rewrite。

首次发布后还必须执行两项控制台配置：把正式域名加入 Edge Function 的 `ALLOWED_ORIGINS`，并把 Supabase Auth Site URL 设置为该域名。当前尚无公网前端地址。

线上验收顺序：注册住客账号（默认 Demo）→ 运营在任务开始前分配 `Study 01` → 住客提交结构化导览需求、保存探索卡和推荐、提交意向 → 运营确认 → 住客刷新查看状态 → 运营标记“模拟流程已完成” → 住客提交一次数字流程反馈 → 运营看板选择 `Study 01` 查看漏斗和导览聚合。

如果没有 Supabase 配置，游客仍可完成艺境探索并使用规则推荐；保存、跨设备同步和运营协同会显示未配置提示，不会伪造成功状态。

## 7. 公开课程演示环境

公开账号自填功能必须使用一个与正式测试项目完全分离的 Supabase 项目。对独立项目执行全部迁移与 `seed.sql`，创建一名住客和一名运营演示用户，再按第 4 节将运营用户设为 `ops`。独立部署 `concierge`，将公开站点域名加入 `ALLOWED_ORIGINS`，并使用单独、低额度的模型密钥。

在公开站点的部署环境中配置以下浏览器可见变量，不要把具体值写进仓库：

```env
VITE_SHOW_DEMO_ACCOUNTS=true
VITE_DEMO_GUEST_EMAIL=<public-demo-guest-email>
VITE_DEMO_GUEST_PASSWORD=<public-demo-guest-password>
```

这些变量会进入前端构建产物，不能视为秘密。登录页只有在开关为 `true` 且住客账号值完整时显示住客卡。运营手工登录，运营凭据禁止配置为 `VITE_*`。Netlify 固定执行 `build:demo` 并校验独立演示后端；删除旧 `VITE_DEMO_OPS_*` 托管变量后再构建。正式测试部署应省略这些变量或设置 `VITE_SHOW_DEMO_ACCOUNTS=false`。演示前核验“住客登录 → 退出 → 运营登录 → 退出 → 住客登录”，演示后关闭入口或轮换演示密码，并重置独立项目中的虚拟数据。

当前本地 Origin 白名单已精确包含 `https://idyllic-bubblegum-1f5a5c.netlify.app`；部署后仍需检查真实预检、登录后的回复和来源。2026-10-04 本轮未部署或查询参与者记录，云端私有检查需先明确授权。见 [发布前验收](docs/14_课程演示修复与验收记录.md)。

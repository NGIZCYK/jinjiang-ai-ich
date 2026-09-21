# 锦江 AI + 苏绣非遗酒店体验原型（jinjiang-ai-ich）

> 本文件原在项目根目录，现已归档至 `docs/`；根目录仍保留 `SUPABASE_SETUP.md` 部署说明。

面向 ENT207 / 锦江杯「AI + 非遗」题目的可运行原型：酒店主线、苏绣内容、数字人导览、沉浸角、预约闭环与商业分析。

## 目录

```text
jinjiang-ai-ich/
├── docs/          规划、PRD、非遗来源、演示脚本
├── web/           Vite + React + TS + Tailwind 前端
├── analytics/     pandas + scikit-learn 分析脚本
└── .env.example
```

## 快速开始（前端）

### Windows 推荐（一键）

进入 `web` 目录后双击/运行：

```powershell
.\start-dev.ps1
```

浏览器访问：**http://127.0.0.1:5180/**

### 命令行

```bash
cd web
npm install
npm run dev
```

### 共享试用环境（可选）

项目现在支持 Supabase Auth + Postgres 跨设备试用。没有 Supabase 配置时，游客探索和规则推荐仍可运行；保存、跨设备同步及运营处理会明确提示服务未配置。完整迁移、Edge Function、角色分配和部署步骤见 [SUPABASE_SETUP.md](../SUPABASE_SETUP.md)。

前端只读取 `web/.env` 中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`。DeepSeek、Azure Speech 和 Supabase service role 密钥只能配置在 Edge Function 的服务端 secrets 中。

> 默认端口已改为 **5180**（5173 常被本机其它程序占用，例如 MiMo Desktop）。

### 打不开时排查

| 现象 | 原因 | 处理 |
| :--- | :--- | :--- |
| 一直转圈 / 无法连接 | 开发服务器没在运行 | 先执行 `.\start-dev.ps1` 或 `npm run dev` |
| 访问 5173 失败 | 5173 被其它软件占用 | 改用 **http://127.0.0.1:5180/** |
| 双击 `dist/index.html` 白屏 | `file://` 无法加载 ES 模块 | 不要用资源管理器直接打开；用 `.\start-preview.ps1` |
| 页面有内容但沉浸角黑屏 | 浏览器不支持或 CDN 超时 | 使用热点卡片 2D 回退讲解 |

### 演示账号

有效账号和密码不写入仓库，由团队负责人通过独立渠道提供。新注册账号固定进入 `Demo`；运营人员可在 `/operations` 中把尚未开始任务的住客分配到 `Study 01`。运营角色仍须由 Supabase 管理员授予，注册页面不能自行选择。

### 真实 LLM 与数字人语音（可选，婉娘导览）

在线模型和语音密钥只放在 Supabase Edge Function secrets 中。浏览器端只需要 Supabase 的公开配置；复制 `web/.env.example` 为 `web/.env`：

```env
# Supabase browser-safe values
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=你的publishable或anon公钥
```

重启 `start-dev.ps1` 或 `npm run dev` 后，完成 Supabase Edge Function 部署即可启用在线能力：
- **LLM 生成**：Edge Function 支持 DeepSeek 流式 SSE 回答与本地非遗知识库兜底；未配置 Supabase 时自动降级为本地规则推荐和问答；
- **数字人语音**：Edge Function 可提供 Azure Viseme 短时令牌（10分钟有效期），长期密钥绝不进入前端；未配置时降级为浏览器原生发音；
- **数字人双轨渲染**：配置 Live2D 资产时由 WebGL 渲染，若未配置或加载超时（>500ms）自动无缝切换至高保真静态图（`StaticAvatar`），零闪屏、零阻断；
- **无障碍支持**：支持全局 `Esc` 快捷键极速打断生成与停播朗读（<50ms），全状态具备 `aria-live="polite"` 与高对比度指示。

`web/.env` 已被 `.gitignore` 忽略，不要提交或打包真实密钥。

## 分析层

```bash
cd analytics
pip install -r requirements.txt
python analyze.py
```

生成 `analytics/output/analytics_snapshot.json`，并同步到 `web/public/analytics/analytics_snapshot.json` 供看板加载。

分析看板支持：客群筛选、收入/ROI 情景模拟、按测试批次去重的行为漏斗，以及可选的 **AI 运营简报**（由 Supabase Edge Function 读取服务端模型密钥）。

链路：婉娘导览匿名意向 → 看板计算 → DeepSeek 简报 → 试点/扩大/暂停建议。

## 八个页面

1. `/auth` 登录注册  
2. `/` 首页场景  
3. `/guide` 婉娘导览  
4. `/immersive` A-Frame 非遗角  
5. `/studio` 行程/文案生成  
6. `/my` 预约与我的体验  
7. `/operations` 体验意向与测试参与者管理  
8. `/analytics` 分析看板  

## 说明

- 非遗内容整理自公开资料，正式商用需授权与审核。  
- 分析数据为合成样本 + 方法说明，非锦江真实经营数据。  
- 本项目与 ENT207 Obsidian 知识库目录相互独立。  

# 锦江 AI + 苏绣非遗酒店体验原型（jinjiang-ai-ich）

> 本文件原在项目根目录，现已归档至 `docs/`；根目录仍保留 `SUPABASE_SETUP.md` 部署说明。

面向 ENT207 / 锦江杯「AI + 非遗」题目的可运行原型：酒店主线、苏绣内容、数字人导览、沉浸角、预约闭环与商业分析。

## 文档导航

按用途阅读；带日期的核查和日志是当时的记录，不能直接当作当前部署状态。当前代码状态以 `web/`、`supabase/` 为准，云端状态须单独核验。

| 用途 | 文档 | 阅读提示 |
| :--- | :--- | :--- |
| 当前交接与部署 | [新账户重建与上线](21_新账户后台迁移记录_20261007.md)、[本轮实施与验收](20_线上稳定性实施与验收_20261007.md)、[交接文档](HANDOFF_FOR_NEXT_AGENT.md)、[Supabase 配置](../SUPABASE_SETUP.md)、[更新日志](CHANGELOG.md) | 新目标 jhosvgldwgndpudwentv；用户放弃旧数据，后台、真实 QA、139 项回归、新演示账号、Netlify 发布与官网登录问答验收已完成；证据见最新记录 |
| 产品起点与内容 | [开发规划](00_项目开发规划.md)、[需求说明](01_产品需求说明.md)、[非遗内容与来源](02_非遗内容与来源.md) | 前两份是初期范围与决策，不是功能验收报告 |
| 演示与前端方案 | [演示脚本与账号](03_演示脚本与账号.md)、[前端优化任务书](04_前端优化改造任务书.md) | 演示前先核验云端能力；任务书保留历史方案 |
| 婉娘数字人 | [实施任务书](06_婉娘Live2D数字人实施任务书.md)、[角色与资产规范](07_婉娘角色设计与Live2D资产规范.md) | Live2D 模型与授权资产是否可用须以实际资产和运行结果为准 |
| ENT207 过程与提交 | [每周日志目录](05_每周日志/README_目录说明.md)、[Week 02 方案选择](08_Week02_Problem_Solution_Choice.md)、[达标核查](09_ENT207达标核查与差距清单.md)、[检查点1报告](10_Checkpoint1_Report_初稿.md)、[检查点1十项对照与证据包](15_Checkpoint1_十项对照与证据包.md)、[原型报告 Draft 1](17_Digital_Prototype_Report_Draft1.md)、[团队看板补录清单](16_团队看板补录清单_Week4.md)、[P0 操作指引](11_P0操作指引.md) | Checkpoint 1 报告 v2 为 2026-10-05 成稿，十项内容全覆盖；[原型报告 Draft 1](17_Digital_Prototype_Report_Draft1.md) 对应 Week 4（10月7日）里程碑，是最终 Digital Prototype Report 的底稿，需在同一文件上持续改进。文中 `【PLACEHOLDER】` 与证据缺口仍需真实材料补齐。看板补录清单用于把 47 张卡录入课程看板，**Done 列为 2026-10-05 补录**，日期取自日志，需每人核对并自行录入本人卡片 |
| 发布与验收 | [2026-10-07 缺口复核](19_项目缺口复核_20261007.md)、[本轮实施与验收](20_线上稳定性实施与验收_20261007.md)、[2026-10-04 修复记录](14_课程演示修复与验收记录.md) | 区分静态发布、后台发布和真实服务验收；历史记录保留当时状态 |
| **核查与技术优化（当前有效）** | [全面核查与技术优化报告](12_全面核查与技术优化报告.md)、[技术问题复核清单](13_技术问题复核清单.md) | **2026-10-04 本地实施复核**：修复与本地验证已完成，线上与浏览器验收待完成；旧报告保留历史边界 |

`05_每周日志/` 下分为 Form 1 周报、成员工作日志、组员交付日志和合并说明。旧方案和合并说明用于追溯过程；引用当前实现时先查代码与交接文档。

## 目录

```text
jinjiang-ai-ich/
├── docs/          产品、技术方案、课程材料、过程日志与交接
├── web/           Vite + React + TS + Tailwind 前端
├── analytics/     pandas + scikit-learn 分析脚本
└── .env.example
```

## 快速开始（前端）

### Windows 推荐（一键）

直接双击项目根目录的 `启动网站.cmd`（端口 5181），或进入 `web` 目录后运行：

```powershell
.\start-dev.ps1
```

浏览器访问：脚本对应 **http://127.0.0.1:5180/**，根目录快捷启动对应 **http://127.0.0.1:5181/**。

该脚本使用 `web/.env.demo.local` 启动独立的公开课程演示环境；登录页仅提供“住客演示”快捷填充卡，运营人员手工登录。需要连接正式测试环境时，请使用下方普通 `npm run dev`，不要把正式账号写入演示变量。

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

正式测试账号和密码不写入仓库，由团队负责人通过独立渠道提供。公开课程展示使用独立的纯演示 Supabase 项目；运行 `start-dev.ps1` 后，登录页角色卡点击只会填入表单，不会自动登录。角色卡由 `VITE_SHOW_DEMO_ACCOUNTS` 和四项账号环境变量控制，禁止将正式运营账号填入这些浏览器可见变量。新注册账号固定进入 `Demo`；运营角色仍须由 Supabase 管理员授予。

演示模式配置保存在被 Git 忽略的 `web/.env.demo.local` 中。团队共享压缩包时需保留该文件；如果通过 Git 共享，则由演示负责人根据 `web/.env.example` 在接收端补建。所有 `VITE_*` 值都会进入公开网页资源，因此这里只允许使用纯虚拟演示账号和浏览器可公开的 Supabase publishable key。

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
- **数字人渲染（2026-09-26 更正）**：默认渲染 **puppet 分层立绘**，可见动效为眨眼 + 下颚律动 + 状态/情绪/手势/节奏语义表演。**口型贴片已停用**（素材异源无法合成，见 `web/public/avatar/wanniang/README.md` 与 `docs/evidence/mouth-sprite-falsification/`）。Live2D 分支保留但需合法 Cubism 模型与已注册运行时才会接管；未配置时降级为静态图（`StaticAvatar`），零闪屏、零阻断；
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
4. `/immersive` 苏绣艺境（DOM/CSS 场景 + 交互展签；**非 3D/WebGL**）
5. `/studio` 行程/文案生成  
6. `/my` 预约与我的体验  
7. `/operations` 体验意向与测试参与者管理  
8. `/analytics` 分析看板  

## 说明

- 非遗内容整理自公开资料，正式商用需授权与审核。  
- 分析数据为合成样本 + 方法说明，非锦江真实经营数据。  
- 本项目与 ENT207 Obsidian 知识库目录相互独立。  

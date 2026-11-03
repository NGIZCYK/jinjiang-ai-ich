# 锦江苏州苏绣文化礼宾

ENT207 课程原型，包含住客体验与酒店运营后台。运营账号登录进入 `/ops`，住客账号登录进入首页。

## 本地运行

使用 Node 24.22.1（版本约束见 `.nvmrc`），在 `web` 中执行 `npm ci`、`npm run dev:demo`。也可双击根目录 `启动网站.cmd`；启动器会核对项目目录和 Node 版本。

`web` 保存前端、测试与运行素材；`supabase` 保存数据库迁移及函数；`analytics` 和 `shared` 保存分析层；`assets-source` 保存素材来源、清单和归档。缓存、依赖和构建产物不提交。

## 验证与发布

在 `web` 中运行 `npm test`、`npm run build:demo`、`node ../scripts/check-demo-build.mjs`。Python 检查为根目录执行 `python -m unittest discover -s analytics -p 'test_*.py'`。

GitHub 主分支推送后的 Netlify 构建由根目录 `netlify.toml` 控制；上线后需核对实际构建资源和账号读取流程。Supabase 变更需要单独部署，不能将前端发布当作后台已经更新。

- [项目文档](docs/README.md)
- [Supabase 配置](SUPABASE_SETUP.md)
- [Netlify 部署](NETLIFY_DEPLOYMENT.md)
- [2026-11-01 整合说明](docs/2026-11-01_独立运营后台整合与验证.md)

生产凭据和私密环境文件不应随项目分享。课程演示配置中的公开测试账号按演示用途保留。

## 2026-11-03 本地整合预览

住宿预订与新版苏绣艺境已合并。审核期间运行 `powershell -File scripts/start-stays.ps1 -NoOpen`，访问 <http://127.0.0.1:5184/stays>。该模式使用独立的本地 PGlite 服务（54329），不会连接线上 Supabase；演示住客与运营卡片沿用项目现有公开演示账户。

原有云端演示启动方式、Node 24 配置及5182端口的无云端艺境预览均保留。整合说明见 [本地合并记录](docs/2026-11-03_住宿预订与艺境整合.md)。用户最终批准前，不提交、推送或发布，不应用线上迁移。

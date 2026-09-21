# Netlify 发布清单

## 已完成的本地准备

- [x] Vite 生产构建通过。
- [x] `netlify.toml` 已指定：根目录 `web`、构建命令 `npm run build`、发布目录 `dist`。
- [x] 单页应用重定向已配置，公开网址可直接打开 `/guide`、`/immersive` 等页面。
- [x] `.gitignore` 已排除 `.env`、`node_modules`、`dist` 和 Supabase 本地临时文件。

## 1. 创建 GitHub 仓库

1. 在 GitHub 创建新仓库，例如 `jinjiang-ai-ich`。
2. 不要在网页中上传 `web/.env`、`node_modules` 或 `web/dist`。
3. 将此项目的本地 Git 仓库连接到 GitHub，并推送 `main` 分支。

## 2. 在 Netlify 连接仓库

1. 登录 Netlify，选择 **Add new project** → **Import an existing project** → **GitHub**。
2. 选择 `jinjiang-ai-ich` 仓库。
3. 确认构建设置：

   | 设置 | 值 |
   | --- | --- |
   | Base directory | `web` |
   | Build command | `npm run build` |
   | Publish directory | `dist` |

## 3. 设置 Netlify 环境变量

在 **Project configuration** → **Environment variables** 添加：

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_WANNIANG_LIVE2D_MODEL   # 只有使用 Live2D 模型时才填
```

变量值从本机 `web/.env` 读取即可。

**绝不添加** `DEEPSEEK_API_KEY`、Supabase Secret Key 或 Azure Speech Key；这些只保存在 Supabase Edge Function 的 Secrets 中。

## 4. 发布与认证设置

1. 点击 **Deploy**，取得 `https://<site-name>.netlify.app`。
2. 若站点默认私有，选择 **Publish** 使其公开。
3. 在 Supabase Dashboard 的 **Authentication** → **URL Configuration**：
   - `Site URL`：填写 Netlify 的公开网址。
   - `Redirect URLs`：添加 `https://<site-name>.netlify.app/**`。
   - 保留本地开发地址 `http://127.0.0.1:5180/**`。
4. 用一个全新的测试邮箱完成：注册 → 登录 → 婉娘对话 → 保存体验意向 → 刷新页面，确认记录仍存在。

## 5. 自定义域名（可选）

在 Netlify 的 **Domain management** → **Production domains** 添加已购买的域名。然后将该域名一并加入 Supabase 的 `Site URL` 或 `Redirect URLs`。

## 6. 发布前安全收尾

- 将 Edge Function 的 CORS 允许来源限制为 Netlify 地址、正式域名和本地开发地址。
- 保持 Supabase 的 RLS 策略开启。
- 在 Supabase 项目中为至少两名组员授予管理员访问权限，避免账号只由一人控制。
- 上线前轮换曾在聊天或测试中暴露过的 API 密钥。

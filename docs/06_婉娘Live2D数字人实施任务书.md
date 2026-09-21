---
title: 婉娘 Live2D 数字人实施任务书
project: 锦江 AI + 苏绣非遗酒店体验原型
status: approved-for-implementation
priority: P0
updated: 2026-09-15
owner_scope: 婉娘礼宾 /guide
---

# 婉娘 Live2D 数字人实施任务书

> 项目根目录：`C:\Users\21701\Desktop\jinjiang-ai-ich`  
> 前端目录：`web/`  
> 当前技术栈：Vite + React 18 + TypeScript + Tailwind + Zustand  
> 目标路线：**Live2D 婉娘 + DeepSeek SSE 流式回答 + 句子级 TTS 队列 + 口型同步 + 静态图降级**  
> 本文用于交给后续模型分阶段执行。执行时必须遵守范围、验收和回退约束，不得一次性推翻现有导览。

---

## 0. 最终目标

将当前“三段循环视频切换”的婉娘升级为具有连续生命感的数字文化礼宾：

1. DeepSeek 回答可以逐段显示，用户无需等待全文生成完成。
2. 完整句子依次进入语音队列，文本生成、字幕显示和声音播放互不阻塞。
3. 数字人根据待机、聆听、思考、讲解、暂停和异常状态自然变化。
4. 配置支持 Viseme 的 TTS 后，语音时间轴驱动 Live2D 嘴形。
5. Live2D、TTS 或网络不可用时，自动降级到静态人物和文字对话。
6. 保留现有中英文、知识卡来源、对话清空、停止生成、意向提取和“我的行程”功能。

本轮不是制作娱乐型虚拟主播，而是塑造一位克制、可信、符合精品酒店气质的“当代江南文化礼宾”。

---

## 1. 当前基线

### 1.1 已有能力

- `/guide` 已支持中文和英文。
- 已接入 DeepSeek，并保留本地知识模式和失败回退。
- 对话记录保存在浏览器本地。
- 支持停止回答、清空记录、知识卡来源展开和体验意向提取。
- 浏览器 `SpeechSynthesis` 可朗读回答。
- 当前有三段数字人视频：
  - `web/public/videos/wanniang-idle.mp4`
  - `web/public/videos/wanniang-listening.mp4`
  - `web/public/videos/wanniang-speaking.mp4`
- 当前静态回退图：`web/public/images/wanniang-concierge.png`。

### 1.2 当前问题

- `GuidePage.tsx` 使用 `key={avatarVideo}` 切换三段 MP4，状态变化会重建视频，可能闪烁或从头跳播。
- “聆听”和“模型思考”没有区分。
- DeepSeek 接口返回完整 JSON，不支持增量输出。
- 浏览器语音与视频嘴形没有时间同步。
- 动作、目光和表情没有被回答状态或语义驱动。
- 浏览器声音因设备和操作系统不同而差异明显。

---

## 2. 强制实施原则

1. **渐进增强**：文字对话永远是主功能，数字人只能增强体验，不能阻塞问答。
2. **状态单一来源**：人物状态只能由统一状态机产生，禁止组件分别推断状态。
3. **服务解耦**：DeepSeek、TTS 和 Live2D 分别使用适配器，不把供应商逻辑写死在页面组件中。
4. **密钥不进前端**：DeepSeek 和语音服务密钥只能读取 `web/.env`，不得使用 `VITE_` 前缀。
5. **不删除现有回退资产**：正式验收前保留当前 PNG 和 MP4，确认新链路稳定后再决定是否归档视频。
6. **不扩大范围**：不改首页、沉浸非遗角、内容工作台、我的行程和分析看板的业务结构。
7. **中英文同等可用**：流式输出、分句、声音、字幕、停止和降级均需覆盖中英文。
8. **尊重授权**：Live2D 模型、美术、字体、声音和第三方 SDK 必须记录来源与使用许可。

---

## 3. 目标技术架构

```text
用户输入
  ↓
GuidePage / 对话控制器
  ↓
POST /api/chat（fetch 读取 SSE）
  ↓
Vite 服务端中间件
  ↓
DeepSeek stream=true
  ↓
meta / delta / done / error 事件
  ├─ 增量更新当前回答文本
  ├─ 完整句子送入 SentenceSegmenter
  └─ 回答完成后写入 Zustand

SentenceSegmenter
  ↓
SpeechQueue（逐句顺序播放）
  ↓
TTS Provider
  ├─ Azure Speech + Viseme（首选，可配置）
  └─ Browser Speech（无凭证时回退）
  ↓
AvatarDirector
  ├─ Live2D Renderer（正式模型存在时）
  └─ Static Renderer（模型/性能/SDK异常时）
```

### 3.1 推荐供应商策略

- LLM：继续使用 DeepSeek。
- 高质量 TTS：默认预留 Azure Speech 适配器，因为其可提供 Viseme 事件。
- 无 TTS 凭证：使用浏览器 `SpeechSynthesis`，嘴形采用低幅度节奏动画，不宣称精确同步。
- Live2D：使用 Cubism Web SDK 和合法导出的模型资源。

如执行时选择其他支持 Viseme 的语音服务，只允许替换 TTS 适配器，不得改动页面和人物状态机协议。

---

## 4. 建议目录结构

```text
web/src/
├── components/avatar/
│   ├── AvatarStage.tsx            # 页面唯一使用的数字人入口
│   ├── Live2DAvatar.tsx           # Live2D 渲染器
│   ├── StaticAvatar.tsx           # 静态图/轻动画降级
│   └── avatarTypes.ts             # 状态、口型、动作类型
├── hooks/
│   ├── useAvatarDirector.ts       # 统一人物状态机
│   └── useSpeechQueue.ts          # 句子级语音队列
├── lib/
│   ├── guideStream.ts             # SSE 解析与取消
│   ├── sentenceSegmenter.ts       # 中英文分句
│   └── tts/
│       ├── types.ts               # TTS Provider 接口
│       ├── browserTts.ts          # 浏览器语音回退
│       └── azureTts.ts            # Viseme 语音适配器
└── pages/GuidePage.tsx

web/public/avatar/wanniang/
├── wanniang.model3.json
├── wanniang.moc3
├── textures/
├── motions/
├── expressions/
└── LICENSE.md
```

如果正式 Live2D 模型尚未提供，先完成接口、状态机和静态降级，不得虚构模型文件或下载来源不明的角色资产。

---

## 5. 核心类型与协议

### 5.1 数字人状态

```ts
export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'paused'
  | 'error'

export type AvatarEmotion =
  | 'neutral'
  | 'warm'
  | 'thoughtful'

export type AvatarGesture =
  | 'none'
  | 'introduce'
  | 'emphasis'
  | 'acknowledge'

export type VisemeFrame = {
  offsetMs: number
  id: number
  mouthOpen: number
  mouthForm?: number
}
```

状态转换必须遵循：

```text
idle → listening → thinking → speaking → idle
                     ↓           ↓
                   error       paused
```

- 用户聚焦或输入时可以进入 `listening`。
- 提交问题后立即进入 `thinking`，不能继续显示“正在聆听”。
- 第一段可播放语音开始时进入 `speaking`。
- 停止生成或停止朗读时进入 `paused`，短暂提示后回到 `idle`。
- 网络、TTS 或模型异常只影响对应能力，页面仍必须可输入。

### 5.2 SSE 事件协议

`POST /api/chat` 根据请求头 `Accept: text/event-stream` 返回：

```text
event: meta
data: {"requestId":"...","provider":"deepseek","language":"zh"}

event: delta
data: {"requestId":"...","text":"苏绣"}

event: done
data: {"requestId":"...","content":"完整回答","usage":null}

event: error
data: {"requestId":"...","code":"UPSTREAM_ERROR","message":"导览服务暂时不可用"}
```

要求：

- 服务端设置 `Content-Type: text/event-stream; charset=utf-8`、`Cache-Control: no-cache`。
- DeepSeek 请求使用 `stream: true`。
- 服务端解析上游 SSE，只转发需要的文本，不把上游原始对象直接暴露给前端。
- 每个事件都包含同一个 `requestId`。
- 客户端断开时中止 DeepSeek 上游请求。
- 保留原 JSON 返回路径，作为兼容和故障回退。
- 不得在日志或 SSE 中输出 API Key、系统提示词或完整隐私数据。

### 5.3 TTS Provider 接口

```ts
export type SpeechRequest = {
  id: string
  text: string
  language: 'zh' | 'en'
  messageId: string
}

export type SpeechPlayback = {
  play(): Promise<void>
  stop(): void
  visemes?: VisemeFrame[]
  durationMs?: number
}

export interface TtsProvider {
  readonly mode: 'viseme' | 'browser' | 'unavailable'
  prepare(request: SpeechRequest, signal: AbortSignal): Promise<SpeechPlayback>
}
```

页面不得直接调用具体 TTS SDK，只能操作 `TtsProvider` 和 `SpeechQueue`。

---

## 6. 分阶段实施

## 阶段 A：建立安全基线与人物状态机

### 目标

在不改变问答能力的前提下，把人物显示从 `GuidePage` 中解耦，并保证任何情况下都有静态回退。

### 修改范围

- 新建 `components/avatar/avatarTypes.ts`。
- 新建 `AvatarStage.tsx`、`StaticAvatar.tsx`。
- 新建 `useAvatarDirector.ts`。
- `GuidePage.tsx` 改为只传入人物状态、语言和无障碍文字。
- 保留现有 `wanniang-concierge.png` 作为默认视觉。

### 要求

- 不再使用 `key` 重建人物组件。
- 待机状态提供轻微呼吸、眨眼和景深变化，但遵守 `prefers-reduced-motion`。
- 状态文字放在人物舞台下缘或人物外，不遮挡面部。
- 异常时显示静态人物，不能显示空白或黑块。
- 现有三段 MP4 暂时保留，但不再作为主状态机的必要条件。

### 验收

- 中文和英文切换时人物不闪白。
- 提交问题后依次出现“正在查阅”“正在讲解”等正确状态。
- 禁止动画后仍可正常使用全部问答功能。
- `npm run build` 通过。

---

## 阶段 B：DeepSeek SSE 流式回答

### 目标

让答案边生成边显示，并支持可靠停止。

### 修改范围

- `web/vite.config.ts`
- `web/src/lib/llm.ts`
- 新建 `web/src/lib/guideStream.ts`
- `web/src/pages/GuidePage.tsx`

### 要求

1. 增加 `askWanNiangStream()`，不得破坏现有 `askWanNiang()`。
2. 创建一条临时 assistant 消息并增量更新；完成后再固化来源、情感和行动卡。
3. 流式内容只保存在内存中的当前回答，完成后一次写入 Zustand，避免每个 token 写入 localStorage。
4. `AbortController` 同时停止前端读取和服务端上游请求。
5. DeepSeek 不可用时自动调用现有本地回答逻辑。
6. 页面刷新后不得残留“半条正在生成”的消息。

### 验收

- 正常网络下，提交后约 1 秒内出现第一段文字。
- 点击停止后不再出现新文本。
- 中途断网时保留已收到内容，并给出可理解的失败提示。
- 本地知识卡来源和行动卡仍正常显示。
- JSON 兼容模式仍可调用。

---

## 阶段 C：中英文句子切分与 TTS 队列

### 目标

将流式文本切为适合朗读的完整句子，并严格按顺序播放。

### 修改范围

- 新建 `sentenceSegmenter.ts`。
- 新建 `useSpeechQueue.ts`。
- 新建 `tts/types.ts` 和 `tts/browserTts.ts`。
- 调整 `GuidePage.tsx` 中自动朗读和单条朗读按钮。

### 分句规则

- 中文主要终止符：`。！？；`。
- 英文主要终止符：`. ! ? ;`。
- 避免把小数、常见英文缩写和 URL 错误切断。
- 单句过短时与下一段合并，建议最少 8 个中文字符或 20 个英文字符。
- 单句过长时优先在逗号、冒号或换行处分段，建议上限 120 个中文字符或 260 个英文字符。
- `done` 事件到达后必须冲刷剩余文本。

### 队列行为

- 队列严格串行，不允许两句声音重叠。
- 停止朗读会终止当前句并清空未播放句子。
- 新问题提交前停止上一条回答的朗读。
- 切换语言时清空旧语言队列。
- 自动朗读关闭时仍可手动朗读完整回答。
- TTS 失败不影响文字继续生成。

### 验收

- 长回答按自然句子依次朗读，没有重叠或乱序。
- 停止朗读响应时间不超过 300ms。
- 中英文切换后不会继续播放上一语言声音。
- 页面卸载后无残留语音。

---

## 阶段 D：支持 Viseme 的 TTS 与口型同步

### 目标

在配置语音凭证时，使用真实时间轴驱动嘴形；无凭证时自动回退。

### 环境变量

在 `web/.env.example` 增加占位，不得写入真实值：

```env
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
AZURE_SPEECH_VOICE_ZH=
AZURE_SPEECH_VOICE_EN=
```

### 安全要求

- `AZURE_SPEECH_KEY` 只能由 Vite 服务端读取。
- 如浏览器端 SDK 需要授权，只允许服务端签发短时令牌。
- 不得把长期密钥写入源码、构建产物、localStorage 或网络响应。

### 口型映射

将供应商 Viseme 收敛为项目内部参数：

- 闭口：`mouthOpen = 0`
- 小开口：`0.2–0.35`
- 中开口：`0.4–0.65`
- 大开口：`0.7–1`
- 圆唇和展唇通过 `mouthForm` 表示。

每帧使用插值过渡，禁止嘴形瞬间跳变。没有 Viseme 时，使用低幅度节奏动画，并在代码中标记为 approximate fallback。

### 验收

- 有凭证时 TTS 模式显示为 `viseme`。
- 无凭证时自动进入 `browser`，无浏览器语音时进入 `unavailable`。
- 语音结束后嘴形可靠闭合。
- 暂停、错误和切换页面时嘴形立即复位。
- 目标口型时间偏差：Viseme 模式 ≤ 120ms；回退模式不宣称精确同步。

---

## 阶段 E：接入正式 Live2D 婉娘

### 前置条件

必须具备以下资产后才执行本阶段：

- 合法授权的 `model3.json`、`moc3`、纹理、动作和表情文件。
- 模型参数至少包含眨眼、嘴部开合、嘴形、头部转动和身体呼吸。
- `LICENSE.md` 记录美术、模型和 SDK 授权范围。

### 角色美术方向

- 当代江南酒店文化礼宾，不做纯古装、网红主播或游戏 NPC。
- 半身构图，目光接近镜头但不持续直盯。
- 酒店制服轮廓中加入克制的苏绣纹样和丝线光泽。
- 主色为墨绿、米白、暖金和低饱和胭脂色。
- 动作幅度小，以呼吸、眨眼、轻微转头和点头为主。
- 背景与网站现有精品酒店视觉统一，不添加科幻面板和发光HUD。

### 技术要求

- Live2D SDK 懒加载，只在进入 `/guide` 后加载。
- `AvatarStage` 根据模型可用性选择 `Live2DAvatar` 或 `StaticAvatar`。
- 渲染器读取统一 `AvatarState`、`AvatarEmotion`、`AvatarGesture` 和口型参数。
- 手势只能来自白名单，不允许模型返回任意动作名或代码。
- WebGL 上下文丢失后自动降级静态图。

### 验收

- 人物持续运行时没有状态切换闪屏。
- 空闲动画不机械重复，动作频率克制。
- 回答时口型、眨眼和轻微动作能够同时运行。
- Live2D 加载失败时 500ms 内显示静态人物。
- 初始人物资源建议不超过 4MB，非首屏动作按需加载。

---

## 阶段 F：语义表演与界面融合

### 目标

让人物动作服务于内容，不把婉娘做成过度表演的虚拟主播。

### 语义协议

允许 DeepSeek 在独立结构字段中返回：

```json
{
  "emotion": "warm",
  "gesture": "introduce",
  "pace": "calm"
}
```

服务端和前端都必须验证枚举。无法解析时统一使用：

```json
{
  "emotion": "neutral",
  "gesture": "none",
  "pace": "calm"
}
```

### 表演约束

- 一段回答最多触发 1–2 次明显动作。
- 工艺说明使用 `thoughtful` 或 `introduce`。
- 行程建议使用 `warm`。
- 安全提示、资料边界和错误信息使用 `neutral`。
- 禁止随机大幅摇头、持续摆动和频繁手势。

### 界面要求

- 桌面端人物约占 35%，对话约占 65%，两者保持同屏。
- 平板端允许人物区域缩短，但不能遮挡输入框。
- 手机端使用紧凑人物名片或可收起舞台；收起后继续播放语音时需保留清晰停止入口。
- 字幕与聊天正文保持同一份文本来源，禁止维护重复字幕状态。
- 人物状态标签不能遮挡面部、嘴部或重要服装纹样。

---

## 阶段 G：质量、性能与降级验收

### 功能矩阵

| 场景 | 文字 | 声音 | 人物 | 预期结果 |
| :--- | :--- | :--- | :--- | :--- |
| DeepSeek + TTS + Live2D 正常 | 流式 | Viseme TTS | Live2D | 完整体验 |
| DeepSeek 正常，TTS 无凭证 | 流式 | 浏览器语音 | Live2D 近似口型 | 自动回退 |
| Live2D 加载失败 | 流式 | 可用 TTS | 静态人物 | 对话不受影响 |
| DeepSeek 失败 | 本地回答 | 可用 TTS | Live2D/静态 | 明确标注回退 |
| 浏览器禁音或不支持语音 | 流式 | 无 | Live2D/静态 | 文字完整可用 |
| 用户停止生成 | 停止增长 | 队列清空 | paused → idle | 无残留任务 |

### 性能指标

- 首段文本目标：提交后约 1 秒可见，网络条件差时提供持续状态反馈。
- 首句语音目标：第一句完整后 1.5–2.5 秒内开始。
- 桌面端目标接近 60fps，普通手机不低于 30fps。
- Live2D 和语音 SDK 不进入首页首屏包。
- 页面离开后终止 SSE、TTS、动画帧和音频资源。
- 图片、模型和纹理全部走本地路径，核心演示不依赖临时外链。

### 无障碍

- 所有状态通过 `aria-live="polite"` 提供文字反馈。
- 自动朗读默认由用户设置决定，不强制播放。
- 支持键盘停止生成和停止朗读。
- `prefers-reduced-motion` 下关闭非必要呼吸、轨迹和转场动画。
- 仅凭颜色不能作为思考、朗读、暂停和错误的唯一提示。

### 构建检查

每个阶段完成后都必须执行：

```powershell
cd C:\Users\21701\Desktop\jinjiang-ai-ich\web
npm run build
```

同时检查：

- `/guide` 中文和英文。
- 自动朗读开/关。
- 单条回答手动朗读与停止。
- 生成中停止、朗读中停止、切换语言和离开页面。
- DeepSeek、TTS 和 Live2D 分别不可用时的降级表现。
- 控制台无未处理 Promise、媒体错误或 WebGL 循环报错。

---

## 7. 推荐执行批次

为了降低一次性改造风险，后续模型按以下批次提交：

### 批次 1：A + B

- 建立人物状态机和静态降级。
- 完成 DeepSeek SSE。
- 不接外部 TTS，不要求正式 Live2D 资产。

### 批次 2：C

- 完成中英文分句和浏览器 TTS 队列。
- 修复停止、切语言和页面卸载生命周期。

### 批次 3：D

- 接入可配置 Viseme TTS。
- 完成口型时间轴和供应商降级。

### 批次 4：E + F

- 在正式模型资产齐备后接入 Live2D。
- 完成克制表演和界面融合。

### 批次 5：G

- 完成功能矩阵、性能、无障碍和课堂演示验收。
- 验收通过后再决定是否归档旧 MP4。

每个批次完成后先构建、检查并写日志，再进入下一批。禁止在同一批中同时重写对话、人物、沉浸场景和全站样式。

---

## 8. 模型执行时的禁止事项

- 不得删除或泄露 `web/.env`。
- 不得在前端代码中硬编码 DeepSeek 或 TTS 密钥。
- 不得下载来源和授权不明的 Live2D 模型。
- 不得把浏览器语音动画描述为“精确口型同步”。
- 不得因数字人加载失败而禁用文本聊天。
- 不得用轮询模拟 SSE。
- 不得在每个 token 到达时写 localStorage。
- 不得让多个音频实例同时播放。
- 不得在组件卸载后继续更新 React 状态。
- 不得把 DeepSeek 返回的动作名直接映射为任意文件路径或函数调用。
- 不得为了人物舞台再次造成页面自动滚到底部。
- 不得破坏现有来源披露、隐私说明和原型服务边界。

---

## 9. 完成定义（Definition of Done）

只有同时满足以下条件，才可将该重构标记为完成：

1. `/guide` 支持稳定的 DeepSeek 流式文字输出。
2. 中文和英文均可按句顺序朗读、暂停并清空队列。
3. 配置 Viseme TTS 时，Live2D 嘴形由真实时间轴驱动。
4. 未配置 Viseme TTS 时存在明确、可靠的语音或无声回退。
5. Live2D 不可用时静态婉娘立即接管，聊天功能不受影响。
6. 人物状态机无互相冲突、闪屏和残留任务。
7. 对话框和数字人在桌面端保持同屏，移动端输入区始终可操作。
8. DeepSeek、TTS 与 Live2D 的失败场景均完成验证。
9. `npm run build` 通过。
10. README、`.env.example` 和当日成员工作日志同步更新。

---

## 10. 执行起点

后续模型开始实施时，应先执行以下检查，不要直接写代码：

1. 阅读本文全文。
2. 阅读 `GuidePage.tsx`、`llm.ts`、`store.ts`、`vite.config.ts` 和相关 CSS。
3. 确认工作区是否存在用户未提交修改并予以保留。
4. 确认正式 Live2D 模型和 TTS 凭证是否存在。
5. 若资产尚未齐备，从“批次 1”开始，不等待外部资产。
6. 每完成一个批次，报告修改文件、功能变化、构建结果、已知限制和下一批前置条件。


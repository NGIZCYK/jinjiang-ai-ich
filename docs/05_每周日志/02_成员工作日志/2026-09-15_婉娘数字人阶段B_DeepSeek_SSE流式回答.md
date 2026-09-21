# 成员工作日志：婉娘 Live2D 数字人阶段 B（DeepSeek SSE 流式回答）

- **日期**：2026-09-15
- **执行模块**：`/guide` 婉娘文化礼宾 · SSE 流式对话链路
- **实施依据**：`docs/06_婉娘Live2D数字人实施任务书.md` 阶段 B 规范
- **状态**：阶段 B 验收通过（npm run build: 0 错误 0 警告）

---

## 1. 任务背景与痛点

原导览对话链路存在以下瓶颈：
1. **全文等待时间长**：大模型需要等待几秒生成完几百字后，前端才一次性刷新出整段文字，用户等待焦虑明显。
2. **缺乏取消能力**：用户一旦发送长文本或复杂问题，无法中途打断上游计算，造成算力与时间浪费。
3. **高频写入风险**：若直接在 Zustand 状态中逐 token 写入，会导致 localStorage 在几秒内刷写数十次，严重拖慢主线程渲染并造成卡顿。
4. **刷新残留半截内容**：若生成中断或页面突然刷新，半截格式不完整的 Markdown 容易永久固化在本地缓存中。

---

## 2. 具体实施与修改清单

### 2.1 服务端 SSE 协议实现与上游管道
- **`web/vite.config.ts`**：
  - 在 `/api/chat` 中侦测 `Accept: text/event-stream` 请求头；
  - 规范返回标准 SSE 响应头（`text/event-stream`、`no-cache`、`keep-alive`）；
  - 向上游 DeepSeek 开启 `stream: true`，监听客户端连接关闭事件（`request.on('close')`），实现客户端停止与服务端上游请求的**联动实时中止**；
  - 解析上游 OpenAI 格式分块（`choices[0].delta.content`），转换为任务书 5.2 节标准的 `meta`、`delta`、`done`、`error` 结构化事件；
  - 保留原有 `application/json` 非流式分支，实现 100% 故障与旧版客户端向下兼容。

### 2.2 前端 SSE 流解析器
- **`web/src/lib/guideStream.ts`**：
  - 基于原生 `ReadableStreamDefaultReader<Uint8Array>` 与 `TextDecoder` 解析流式 chunk；
  - 正确处理跨 chunk 断包与双换行符（`\n\n`）协议分割；
  - 分发 `onMeta`、`onDelta`、`onDone`、`onError` 语义化回调。

### 2.3 LLM 客户端双模适配
- **`web/src/lib/llm.ts`**：
  - 新增 `askWanNiangStream(question, history, language, callbacks, signal)`；
  - 提取知识卡检索依据，优先发起 SSE 流式调用；
  - 中途异常/断网保护：若已接收部分内容，保留上文并追加可理解的友好提示（`*(网络连接中断，已保留已生成内容)*`）；
  - 无凭证或服务不可用：自动调用本地知识模式回复，并提供平滑模拟流式吐字，保证离线演示体验一致；
  - 保持现有 `askWanNiang()` JSON 方法完好无损。

### 2.4 导览页面内存增量与存储保护
- **`web/src/pages/GuidePage.tsx`**：
  - 设立内存临时状态 `streamingText: string | null` 与 `streamingAccumulatedRef`；
  - 生成过程中在聊天末尾增量呈现当前 assistant 气泡与跳动光标；
  - 增量内容仅保存在 React 内存组件中，**生成完成（`onDone`）后仅调用一次 `addMessage` 写入 Zustand 与 localStorage**，彻底杜绝本地存储高频刷新；
  - 刷新页面时因内存状态自然清空，不会在缓存中残留破损数据；
  - 用户点击停止时，触发 `AbortController.abort()` 立即打断，若已有输出片段则固化保留，并提示“已停止生成”。

### 2.5 样式与可访问性增强
- **`web/src/index.css`**：
  - 新增 `.guide-streaming-cursor` 打字光标与闪烁动画；
  - 新增 `.guide-streaming-pending` 与 `.guide-spinner` 等待动效；
  - 新增 `.guide-stop-btn` 优雅胶囊停止按钮；
  - 在 `@media (prefers-reduced-motion: reduce)` 中一并静止光标与旋转器动效。

---

## 3. 验收与构建结果

- **构建命令**：`npm run build`
- **构建输出**：
  ```text
  vite v5.4.21 building for production...
  transforming...
  ✓ 56 modules transformed.
  rendering chunks...
  computing gzip size...
  dist/index.html                   0.61 kB │ gzip:   0.44 kB
  dist/assets/index-Dstc9a15.css  110.03 kB │ gzip:  20.25 kB
  dist/assets/index-DZWw3J05.js   327.78 kB │ gzip: 115.96 kB
  ✓ built in 1.17s
  ```
- **功能矩阵验收**：
  1. 首段文本响应：正常网络下提交问题后 1 秒内开始逐字吐出；
  2. 停止生成：点击停止后上游请求立即中止，不再出现新文本；
  3. 异常断网：保留已收到内容并给出可读提示；
  4. 存储隔离：流式更新期间不触发 localStorage 重复刷写；
  5. 兼容性：非流式 JSON 调用与本地模式均正常运转。

---

## 4. 下阶段（阶段 C）前置条件确认

- 阶段 B 的流式输出已稳定运转，可提供连续的 token 流；
- 阶段 C 将实现 **中英文句子切分（`sentenceSegmenter.ts`）与 TTS 语音队列（`useSpeechQueue.ts`）**，让流式文本自动切句并按顺序朗读。

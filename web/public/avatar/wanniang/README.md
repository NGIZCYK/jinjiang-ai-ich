# 婉娘 Live2D 资产接入说明

当前网页默认使用 `images/wanniang-concierge-v2.png` 作为真实标注的静态降级形象。
不要把单张 PNG、空 Canvas 或整图缩放记录为“Live2D 已完成”。

## 当前数字人的真实能力（2026-09-26 核验）

`/guide` 页实际渲染的是 **puppet 分层立绘**（`web/src/components/avatar/PuppetAvatar.tsx`），可见动效为：

- **眨眼**（`eyes.webp` 贴片，锚点由 `anchors.json` 提供，合成质量良好）；
- **下颚律动**（`.puppet-jaw` + `--jaw-open`，由 `mouthOpen` 驱动，无贴片合成）；
- **克制语义表演**：状态 / 情绪 / 手势 / 节奏四条通道映射为 CSS 类名与 data 属性。

**口型贴片（viseme 驱动嘴形）已停用**，原因见下节。因此对外材料不得再表述为“口型同步”，
只能表述为“眨眼 + 下颚律动 + 语义表演”。

## 为什么停用口型贴片

`raw/mouths.png` 与 `raw/base.png` **并非同源图像**，属两次不同的 AI 生成。经参数化复测
（加宽/加高嘴部盒、收紧抠图阈值、加强色彩校正强度 6 组组合）确认无法合成：

- 原图下唇与唇角微笑线无法被贴片完全覆盖，静默时出现“双嘴”；
- 贴片唇部偏暖粉、base 面部偏中性橄榄，`color_match` 仅做肤色均值平移，
  无法消除色域差异；扩大嘴部盒只会把暖色块铺到更大范围（经鼻底至颏部）。

复测对比图存档于 `docs/evidence/mouth-sprite-falsification/`。
**若将来要恢复口型，必须从 base 同源重绘嘴部帧**（例如对 base 做图生视频得到一致光影序列后抽帧），
不得复用 `vibe_images/*_raw_*.png` 中的异源部件。

## 启用 Live2D 的条件

1. 使用 Live2D Cubism Editor 将经过确认的分层 PSD 完成建模与绑定。
2. 将取得合法授权的模型文件放入本目录，包括：
   - `wanniang.model3.json`
   - `.moc3`
   - 纹理文件
   - physics、expressions、motions 等模型实际引用的文件
3. 依据所采用 Cubism Web SDK 的许可要求引入运行时。
4. 实现并注册 `window.WanniangLive2DRuntime.mount(canvas, { modelPath })`；返回的控制器必须支持：
   - `setParameters({ mouthOpen, mouthForm })`
   - `setPerformance({ state, emotion, gesture })`（可选）
   - `resize()`（可选）
   - `destroy()`
5. 在 `web/.env` 中设置：

   ```env
   VITE_WANNIANG_LIVE2D_MODEL=/avatar/wanniang/wanniang.model3.json
   ```

模型或运行时缺失、加载失败、WebGL 上下文丢失时，页面会继续显示静态礼宾形象。

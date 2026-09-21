# 婉娘 Live2D 资产接入说明

当前网页默认使用 `images/wanniang-concierge-v2.png` 作为真实标注的静态降级形象。
不要把单张 PNG、空 Canvas 或整图缩放记录为“Live2D 已完成”。

## 启用条件

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

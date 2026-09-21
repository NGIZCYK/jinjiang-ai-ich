# 婉娘角色设计与 Live2D 资产规范

> 更新日期：2026-09-15  
> 当前状态：当代礼宾静态主视觉 v2 已接入；分层 PSD、Cubism 模型与浏览器运行时尚未交付。

## 1. 角色定位

婉娘是“锦江苏州的当代江南文化礼宾”，不是古装历史人物，也不是游戏或写真角色。

- 气质：成熟、可信、温和、克制。
- 专长：苏绣工艺解释、苏州城市导览、住中体验规划。
- 服装：现代酒店制服融入旗袍结构，只在领口或袖缘保留少量苏绣细节。
- 色彩：墨玉绿、丝绸米白、少量哑金。
- 禁止：古装披帛、夸张发簪与流苏、手持针线摆拍、浓重网红妆、过量花纹。

当前静态资产：`web/public/images/wanniang-concierge-v2.png`。

## 2. Live2D 原画交付

单张 PNG 不能直接成为 Live2D 模型。正式制作需提供至少 4096px 高的分层 PSD，并保持以下结构可独立变形：

- 头部：脸部底色、左右耳、鼻部阴影、面部高光。
- 眼部：左右眼白、虹膜、瞳孔、上眼睑、下眼睑、睫毛、眉毛。
- 口部：上唇、下唇、口腔、牙齿、舌头、嘴角阴影。
- 头发：前发、侧发、后发与碎发至少分为 6–10 组。
- 身体：颈部、上身、左右肩臂、制服各主要片区、刺绣纹样与饰物。
- 遮挡关系：转头时会露出的皮肤和头发必须补画完整。

## 3. Cubism 参数

最低可验收参数：

- `ParamAngleX / Y / Z`
- `ParamBodyAngleX / Y / Z`
- `ParamEyeLOpen / ParamEyeROpen`
- `ParamEyeBallX / ParamEyeBallY`
- `ParamBrowLY / ParamBrowRY`
- `ParamMouthOpenY / ParamMouthForm`
- `ParamBreath`

建议表情：neutral、warm、thoughtful；建议动作：idle、introduce、acknowledge。动作必须克制，不持续摇摆。

## 4. 网页接入条件

1. 将有合法授权的 `model3.json`、`.moc3`、纹理、physics、expressions 与 motions 放入 `web/public/avatar/wanniang/`。
2. 按 `web/public/avatar/wanniang/README.md` 实现真实 Cubism Web 运行时适配器。
3. 在 `web/.env` 设置：

   ```env
   VITE_WANNIANG_LIVE2D_MODEL=/avatar/wanniang/wanniang.model3.json
   ```

4. 未满足上述条件时，界面必须显示“礼宾静态形象”，不得显示“Live2D 已完成”。

## 5. 语音与口型边界

- 配置 Azure Speech 后，Viseme 时间轴可驱动 `ParamMouthOpenY` 与 `ParamMouthForm`。
- 未配置 Azure 时，只能使用浏览器朗读；静态图不模拟嘴部运动。
- 必须验证停止、清空对话、切换语言与连续提问时无叠音。

## 6. 验收标准

- 首屏始终有静态形象，不因模型加载出现黑屏。
- Live2D 只在模型真实加载完成后接管显示。
- 面部占人物舞台的主要视觉区域，嘴和眼睛清晰可见。
- 状态、表情、口型均由同一状态链路驱动。
- 模型加载失败、WebGL 丢失或 TTS 不可用时自动回退，并保持对话可用。

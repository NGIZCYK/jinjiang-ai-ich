# 婉娘 v3 统一形象

生成方式：内置 imagegen，非 CLI。参考旧备用人像的现代江南服装与摄影构图，重新设计约30—33岁、温柔亲切、专业自然的统一文化礼宾形象。中英文均使用同一人物。

- `portrait-original.png`：生成原图，保留透明通道。
- `portrait-preview.png`：叠加页面背景色的检查预览，不是网站截图。
- 页面资源：`../../web/public/avatar/wanniang-v3/portrait.webp`，896×1344，保留透明通道。
- 页面默认静态呈现；未制作或启用嘴型、眼部贴片，避免异源接缝和整图晃动。
- 旧人物素材仍保留，当前导览页不再切换到旧脸。

## 最终生成提示词

```text
Use case: photorealistic-natural character redesign / transparent portrait asset.
Input image: reference for the modern Jiangnan concierge clothing palette, natural photographic look, and waist-up composition. Reimagine this fictional concierge as Wanniang, a warm contemporary Suzhou cultural concierge with an apparent age around 30 to 33, to match a youthful clear female Mandarin voice and a gentle English female voice. One consistent identity for both languages.
Primary request: a polished but natural, approachable adult Chinese woman, softly attentive eyes, a very gentle welcoming closed-mouth smile, fresh subtle makeup, realistic skin texture, calm professional presence, relaxed shoulders and upright head without a head tilt. Dark hair in a neat relaxed low updo with a few naturally soft strands. Modern ivory and muted jade-green silk uniform inspired by Jiangnan, a restrained small Su embroidery flower motif near the collar, no ornate historical costume, no large gold ornament. Softer, lighter and more approachable than the reference, not stern or matronly, not a glamorous model.
Composition: portrait 2:3, from top of head to just below the waist, looking directly at the visitor; head centered, both shoulders fully visible, natural hands resting loosely together low near the abdomen; keep 7 percent clear space above hair and generous side margins. Single still portrait, no frames or alternate states.
Lighting: soft warm-neutral hotel portrait light with clear eyes, gentle shadows and natural fabric texture.
Background: genuinely transparent alpha background, clean hair and garment edges. No scenery, no black backdrop, no magenta/green chroma-key field, no painted checkerboard, no text, no logo, no watermark. Preserve a realistic elegant person suitable for a hotel cultural concierge website.
```

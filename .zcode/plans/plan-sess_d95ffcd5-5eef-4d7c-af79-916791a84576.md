基于 ENT207 Module Handbook 核查结论,获批后执行以下工作:

## 1. 落盘《达标核查与差距清单》文档
新建 `docs/09_ENT207达标核查与差距清单.md`:完整版 handbook 硬性门槛对照表、Appendix A feature 逐条对照、四个考核组件就绪度、P0-P3 优化路线图(含截止日期),供团队按周勾销。

## 2. 修复看板情感/兴趣标签断链(P1 代码项)
`web/src/pages/AnalyticsPage.tsx:139-140` 硬编码空数组导致情感统计与"匿名兴趣标签汇总"恒为零。方案:从 events/trial_analytics 服务端聚合读取,或从 store 聚合,恢复"导览情感信号 → 看板"链路(同时补上锦江杯 sentiment-aware 卖点);在 `web/tests/journey.test.ts` 补对应用例。

## 3. 更新过时演示脚本
重写 `docs/03_演示脚本与账号.md`:从已废弃的 localStorage 账号 + `VITE_DEEPSEEK_API_KEY` 更新为 Supabase 架构(demo@hotel.local / ops@hotel.local + Edge Function),并新增 handbook 要求的"交互场景模拟"演示动线(游客输入 → 探索/推荐交互 → 产出 → 如何支撑运营决策),含 Plan B(无网络降级路径)。

## 4. 起草 Checkpoint 1 Report 初稿(第 3 周末截止)
基于 docs/00/01/02 与 week2提交内容.md,按 handbook 三要素成文:problem choice and validation evidence / solution concept / digital prototype(chosen features),标注需团队补真实证据(截图、日期)的占位符。

## 5. 输出 P0 操作指引(只写指引,不代执行)
- Form 1 每周证据收集模板与提交前检查(衔接现有 00_采分对照文档)
- 外部导师预约话术与 Form 3 填写要点
- 10 人测试者招募计划(招募渠道、测试脚本、数据留存表)
- 密钥轮换步骤(Supabase access token、DeepSeek key、作废 web/.env 旧 key)

## 6. 验证
运行 `npm test`(21 用例)与 `npm run build` 确认修复无回归。

不阻塞的后续决策项(列入文档供团队选择):Live2D 授权资产获取方式、A-Frame 恢复或彻底移除、茶艺辅非遗与雅凭凭证的实现优先级。
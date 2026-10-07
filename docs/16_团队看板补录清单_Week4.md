---
type: ENT207过程材料
project: 锦江苏绣文化礼宾原型
component: Component 1 — Weekly Process（课程看板 / Kanban）
version: v1 · 2026-10-05
purpose: 把 2026-09-11 至 2026-10-05 已真实完成的工作、本周 Checkpoint 1 冲刺任务与下一步，逐条落成课程看板卡片（标题 / 负责人 / 状态 / 日期），供每位成员自行录入
companion: 10_Checkpoint1_Report_初稿.md、15_Checkpoint1_十项对照与证据包.md
---

# 课程看板（Kanban）补录清单 · Week 4

> **为什么需要这份清单**：截至 2026-10-05，课程看板只有 **1 张 Done 卡**（`Assign tasks, begin the project`），
> 而 `docs/CHANGELOG.md` 与 `docs/05_每周日志/` 记录了三周多的真实工程与验证工作。
> 导师在看板上看到的进度，与团队实际进度不一致——这正是 Week 3 周报里我们自己记下的问题
> （见 [week3提交内容](../每周提交内容/week3提交内容.md) 第二节「Challenges encountered」）。
> 本清单把真实工作拆成**一人一卡、有负责人、有日期、有证据**的 47 张卡片，用于补正这条记录。

**总览：47 张卡 = 23 Done + 14 In Progress + 10 To Do。**

---

## 一、一页速览：给导师看的口径（可直接粘贴到周报 / 故事页）

### 中文（约 180 字）

> 本周我们补正了团队看板：此前看板只有 1 张卡，而实际工作记录在仓库日志里。现在看板上是 **47 张有负责人、有日期的任务卡**：**23 张 Done** 覆盖 2026-09-11 至 10-05 已交付的工作（非遗知识库与来源核验、婉娘 AI 导览与数字人、苏绣艺境、Supabase 共享后端与批次隔离、分析看板与统一 ROI 模型、前端 76 项与 Python 4 项测试、Checkpoint 1 报告 v2）；**14 张 In Progress** 是本周 Checkpoint 1 冲刺（Figma/Visily/Pixso 交付、首次 3–5 人真实用户 pilot、云端发布与浏览器验收、密钥轮换）；**10 张 To Do** 指向 Week 5–9（外部导师会面、累计 10+ 用户测试、Checkpoint 2）。**说明：Done 卡是 10 月 5 日补录，描述的是已有日志与代码日期支撑的既有工作，不是本周新做的功能**；真实用户测试截至今日尚未开始，仍如实留在 In Progress。

### English

> We have corrected our course board this week. It previously held a single card while our actual work was recorded in dated engineering logs. The board now shows **47 owner-assigned, dated tasks**: **23 Done** covering work delivered between 11 September and 5 October (verified ICH knowledge base, the Wanniang AI guide and avatar, the Su embroidery experience, the shared Supabase backend with test-cohort isolation, the analytics dashboard with a unified ROI model, 76 frontend and 4 Python tests, and the Checkpoint 1 report v2); **14 In Progress** for this week's Checkpoint 1 sprint (Figma/Visily/Pixso delivery, the first 3–5 participant pilot, cloud release and browser acceptance, credential rotation); and **10 To Do** towards Weeks 5–9 (external mentor consultation, 10+ user tests, Checkpoint 2). **Disclosure:** the Done cards were entered on 5 October and describe already-completed work evidenced by dated logs, not new features built this week. Real user testing has not started yet and is honestly kept In Progress.

### 周报「Kanban board status」字段（可直接粘贴，替换 Week 3 的备用段落）

```text
Our board now shows 23 Done, 14 In Progress and 10 To Do cards. The Done cards record work delivered between 11 September and 5 October, each linked to a dated engineering log, test result or document in our repository; they were entered on 5 October to correct a recording gap we had already flagged in our Week 3 log. In Progress covers this week's Checkpoint 1 sprint, including the Figma MVP build requested by our TA on 24 September, the first 3-5 participant pilot, cloud release and browser acceptance.
```

---

## 二、录入方法（每位成员 15–25 分钟）

**平台规则要求「每位同学添加自己的任务」**（看板提示：*Each student adds their own tasks · 每位同学添加自己的任务*）。
因此**请每位成员登录自己的账号，只录入下面「负责人」是自己名字的卡片**，平台才能记录你的贡献。

1. 打开小组看板，在**目标列**（TO DO / IN PROGRESS / DONE）点「＋ 添加卡片」。
2. 粘贴卡片标题（直接复制本清单第 3–5 节的标题列）。
3. 「截止时间」按卡片表最后一列之前的**日期列**填写：
   - **Done 卡**填**该任务的实际完成日期**（与日志一致，例如 `2026/09/11`），不要填今天；
   - **In Progress / To Do 卡**填**内部目标日期**（口径见第四节）。
4. 「添加」后，在卡片上**指派负责人为自己**。
5. 录完后全组一起核对一次三列数量（应为 **23 / 14 / 10**），并截一张**全貌图**：
   文件名按 [P0 操作指引](11_P0操作指引.md) 的约定存为
   `docs/05_每周日志/Week04_证据1_看板全貌_2026-10-05.png`，截图里要能同时看到**标题、负责人、状态**。

> **补录说明（必读）**：平台会记录卡片的创建时间，Done 卡创建时间会是 **2026-10-05**。
> 这是补正记录的正常现象。**不要倒填系统时间、不要为了好看改日志日期**；
> 我们在 Week 3 周报里已经如实说明「此前未在看板登记，现补正」，这句话就是这件事的说明。

**时间紧时的最小录入方案**：只录 14 张 In Progress + 10 张 To Do + 每个成员至少 1 张本人 Done 卡（共 30 张），
其余 Done 工作每周补一批。**但 Minimum 方案必须在周报里写明「Done 列尚未录完」**，不能只截部分图当作全部。

---

## 三、DONE · 完成（23 张）

> 口径：完成日期取自 `docs/CHANGELOG.md` 与 `docs/05_每周日志/` 的**日期记录**，不另行编造。

| # | 卡片标题（中文 · English） | 负责人 | 完成日期 | 证据 / 交付物 |
| :-: | :--- | :--- | :--- | :--- |
| D1 | 选题与问题定义：5 维度打分矩阵确定方向 · Topic selection via a 5-dimension scoring matrix | Xiang Li | 2026/09/11 | [Week 02 方案选择](08_Week02_Problem_Solution_Choice.md)；[Week 01 周报](05_每周日志/01_Form1周报/Week01_项目立项与问题定义.md) |
| D2 | 非遗知识库与内容来源核验（9 张非遗卡 + 苏州攻略卡） · ICH knowledge base with verified sources | Licheng Yang | 2026/09/11 | `supabase/functions/_shared/ichItems.ts`；[非遗内容与来源](02_非遗内容与来源.md) |
| D3 | 婉娘导览与 DeepSeek 对话接入 · Wanniang guide with DeepSeek conversation | Zhiyuan Liang | 2026/09/11 | [成员日志 09-11](05_每周日志/02_成员工作日志/2026-09-11_婉娘导览与DeepSeek.md) |
| D4 | 沉浸艺境场景重构与 3D 全景可行性验证（结论：改用二维艺境） · Immersive scene rebuild and 3D panorama feasibility test | Licheng Yang | 2026/09/12 | [成员日志 09-12](05_每周日志/02_成员工作日志/2026-09-12_沉浸非遗角与8K全景.md) |
| D5 | 全站美学设计系统（江南五度色谱） · Site-wide aesthetic system and colour scale | Zeyu Gong | 2026/09/13 | [成员日志 09-13 阶段三](05_每周日志/02_成员工作日志/2026-09-13_阶段三_全站美学设计系统.md) |
| D6 | 策展工作台状态机与商业闭环 · Curator workbench state machine and business loop | Guanqiao Feng | 2026/09/13 | [成员日志 09-13 阶段二](05_每周日志/02_成员工作日志/2026-09-13_阶段二_工作台状态机与商业闭环.md) |
| D7 | 全站可信体验与功能逻辑重构 · Site-wide trustworthy-experience and logic rebuild | Zeyu Gong | 2026/09/13 | [成员日志 09-13 阶段四](05_每周日志/02_成员工作日志/2026-09-13_阶段四_全站可信体验与功能逻辑.md) |
| D8 | 苏绣工艺资产：长卷微距重构 + 试针四部曲实拍 · Su embroidery assets: scroll macro and four-step needlework photos | Licheng Yang | 2026/09/14 | [成员日志 09-13 苏绣工坊](05_每周日志/02_成员工作日志/2026-09-13_苏绣工坊与长卷微距重构.md)；[09-14 试针四部曲](05_每周日志/02_成员工作日志/2026-09-14_试针四部曲实拍资产.md) |
| D9 | 分析看板与 AI 运营简报 · Analytics dashboard and AI operations brief | Guanqiao Feng | 2026/09/14 | [组员交付日志 09-14](05_每周日志/03_组员交付日志/2026-09-14_分析看板运营简报.md)；`analytics/output/analytics_snapshot.json` |
| D10 | 一键启动演示环境与本地运行稳定性 · One-click demo environment and local stability | Wenjun Li | 2026/09/14 | [成员日志 09-14 稳定性](05_每周日志/02_成员工作日志/2026-09-14_婉娘导览与快捷启动稳定性.md) |
| D11 | 婉娘数字人状态机、降级链路与礼宾问答路由修复 · Wanniang state machine, fallbacks and guide routing fix | Zhiyuan Liang | 2026/09/15 | [成员日志 09-15 礼宾修复](05_每周日志/02_成员工作日志/2026-09-15_婉娘礼宾问答路由与角色呈现修复.md) |
| D12 | 语音链路：中英文切分、TTS 串行队列与 Esc 打断 · Speech pipeline: sentence splitting, serial TTS queue, Esc interrupt | Zhiyuan Liang | 2026/09/15 | [成员日志 09-15 阶段C](05_每周日志/02_成员工作日志/2026-09-15_婉娘数字人阶段C_句子切分与TTS队列.md) |
| D13 | 全站酒店美学与沉浸艺境重构 · Hotel aesthetic and immersive experience rebuild | Zeyu Gong | 2026/09/15 | [成员日志 09-15 全站美学](05_每周日志/02_成员工作日志/2026-09-15_全站酒店美学与沉浸艺境重构.md) |
| D14 | Supabase 共享后端真实部署与住客主链路验收（含登录校验修复） · Supabase shared backend deployment and guest-flow acceptance | Xiang Li | 2026/09/19 | `supabase/migrations/202609180001_journey.sql`；[CHANGELOG 09-19](CHANGELOG.md) |
| D15 | 正式测试数据隔离：批次分配与导览聚合 · Test-cohort isolation: batch assignment and guide-signal aggregation | Wenjun Li | 2026/09/19 | `supabase/migrations/202609190003_guide_signals_and_cohorts.sql` |
| D16 | ENT207 达标核查与八步演示脚本重写 · ENT207 compliance audit and eight-step demo script | Xiang Li | 2026/09/19 | [达标核查](09_ENT207达标核查与差距清单.md)；[演示脚本与账号](03_演示脚本与账号.md) |
| D17 | 婉娘 Puppet 分层偶动画（眨眼 / 下颚律动 / 语义表演） · Wanniang layered puppet animation | Zhiyuan Liang | 2026/09/22 | [成员日志 09-22](05_每周日志/02_成员工作日志/2026-09-22_婉娘Puppet数字人.md)；`web/src/components/avatar/PuppetAvatar.tsx` |
| D18 | 口型贴片证伪实验与死资产清理（释放约 33.8 MB） · Mouth-sprite falsification experiment and dead-asset cleanup | Wenjun Li | 2026/09/26 | `docs/evidence/mouth-sprite-falsification/`；[CHANGELOG 09-26](CHANGELOG.md) |
| D19 | Week 1–3 周报、周会记录与真实证据归档 · Weeks 1–3 weekly logs and evidence archiving | Xiang Li | 2026/09/26 | [每周提交内容](../每周提交内容/)；[周日志目录](05_每周日志/README_目录说明.md) |
| D20 | 本地课程演示修复：API 契约 v3 / Origin 白名单 / 知识检索与来源返回 · Local demo fixes: API contract v3, Origin allow-list, knowledge retrieval and source return | Zhiyuan Liang | 2026/10/04 | [修复与验收记录](14_课程演示修复与验收记录.md) |
| D21 | ROI 与商业情景跨语言统一、分析证据门槛收紧 · Unified ROI model across Python/TS and stricter evidence gates | Guanqiao Feng | 2026/10/04 | `shared/roi-assumptions.json`；`analytics/roi.py` |
| D22 | 前端 76 项 + Python 4 项测试回归与双构建通过 · 76 frontend and 4 Python tests, both builds passing | Wenjun Li | 2026/10/04 | `web/tests/`（10 个测试文件）；`analytics/test_analysis.py` |
| D23 | Checkpoint 1 报告 v2 成稿（十项内容全覆盖） · Checkpoint 1 report v2 completed | Xiang Li | 2026/10/05 | [报告初稿 v2](10_Checkpoint1_Report_初稿.md)；[十项对照与证据包](15_Checkpoint1_十项对照与证据包.md) |

---

## 四、IN PROGRESS · 进行中（14 张）

> 口径：截止时间 = **内部目标日期**（非课程官方截止，见第五节的日期说明）。

| # | 卡片标题（中文 · English） | 负责人 | 截止（内部目标） | 交付物 / 验收 |
| :-: | :--- | :--- | :--- | :--- |
| P1 | 课程看板补正：真实任务、负责人与状态全貌截图 · Kanban correction: real tasks, owners and full-board screenshot | Xiang Li | 2026/10/07 | 本清单录入完成 + 三列数量核对（23/14/10）+ 全貌截图 |
| P2 | Figma MVP build：Visily 线框 → Figma 精修 → Pixso 可点击原型 · Figma MVP build (Visily → Figma → Pixso) | Zeyu Gong | 2026/10/11 | Figma 文件链接 + 版本时间；助教 9-24 明确要求的交付项 |
| P3 | Visily / Figma / Pixso 个人操作与截图（Xiang Li） · Personal Visily/Figma/Pixso work and screenshots | Xiang Li | 2026/10/11 | 本人三工具操作截图 |
| P4 | Visily / Figma / Pixso 个人操作与截图（Zeyu Gong） · Personal Visily/Figma/Pixso work and screenshots | Zeyu Gong | 2026/10/11 | 本人三工具操作截图 |
| P5 | Visily / Figma / Pixso 个人操作与截图（Zhiyuan Liang） · Personal Visily/Figma/Pixso work and screenshots | Zhiyuan Liang | 2026/10/11 | 本人三工具操作截图 |
| P6 | Visily / Figma / Pixso 个人操作与截图（Licheng Yang） · Personal Visily/Figma/Pixso work and screenshots | Licheng Yang | 2026/10/11 | 本人三工具操作截图 |
| P7 | Visily / Figma / Pixso 个人操作与截图（Guanqiao Feng） · Personal Visily/Figma/Pixso work and screenshots | Guanqiao Feng | 2026/10/11 | 本人三工具操作截图 |
| P8 | Visily / Figma / Pixso 个人操作与截图（Wenjun Li） · Personal Visily/Figma/Pixso work and screenshots | Wenjun Li | 2026/10/11 | 本人三工具操作截图 |
| P9 | Study 01 首次真实用户测试（3–5 人 pilot + 录屏 + 现场记录表） · First real user pilot (Study 01, 3–5 participants) | Wenjun Li | 2026/10/11 | 录屏 + 现场记录表 + 用户原话；脚本见 [P0 操作指引](11_P0操作指引.md) 第三节 |
| P10 | 云端发布与浏览器验收（演示函数 + 前端 + 双端闭环） · Cloud release and browser acceptance | Xiang Li | 2026/10/11 | 公网可用链接 + 验收记录；[发布前待验收项](14_课程演示修复与验收记录.md) |
| P11 | Checkpoint 1 演示排练与 6–8 页辅助幻灯片 · Checkpoint 1 rehearsal and slide deck | Xiang Li | 2026/10/11 | 走完八步动线 + 幻灯片；脚本见 [十项对照与证据包](15_Checkpoint1_十项对照与证据包.md) 第五节 |
| P12 | 密钥轮换与凭据收口（Supabase token / DeepSeek key / 运营密码） · Credential rotation and cleanup | Zhiyuan Liang | 2026/10/11 | 轮换记录（只写日期与范围，不写密钥值） |
| P13 | 公网六路由截图与报告占位符替换 · Six-route public screenshots and placeholder replacement | Licheng Yang | 2026/10/11 | `/`、`/guide`、`/immersive`、`/my`、`/operations`、`/analytics` 截图 |
| P14 | ROI 数值与报告口径统一 · Align ROI figures and assumptions with the report | Guanqiao Feng | 2026/10/11 | 报告数值与快照一致（合成假设须标注） |

> **P3–P8 是六张同题卡，每人一张。** 课程要求每位学生**拥有自己的账号并亲自尝试全部三个工具**，
> 「一个队友完成了设计」不能作为其他人的贡献证明（[Week 3 与 Checkpoint 1 准备指南](../ENT207_Week3与Checkpoint1准备指南.md) 第 2.4 节）。
> 每人**自己添加自己那张卡**，这样看板上能直接看到六个人的独立贡献。

---

## 五、TO DO · 待办（10 张）

| # | 卡片标题（中文 · English） | 负责人 | 截止（内部目标） | 交付物 / 验收 |
| :-: | :--- | :--- | :--- | :--- |
| T1 | 预约并完成首次外部导师会面（Form 3） · Book and complete the first external mentor consultation | Xiang Li | 2026/10/18 | 会议纪要 + 建议采纳前后对照；邮件模板见 [P0 操作指引](11_P0操作指引.md) 第二节 |
| T2 | Studio 接入在线 LLM 生成 · Studio online LLM generation | Zeyu Gong | 2026/10/18 | 功能 + 测试（当前为规则/模板生成） |
| T3 | 导览对话历史持久化 · Guide conversation history persistence | Zhiyuan Liang | 2026/10/25 | 功能 + 测试（当前不保存聊天原文） |
| T4 | 累计 ≥10 名真实用户测试（≥8 人无协助走完全流程） · 10+ real user tests (8+ unaided) | Wenjun Li | 2026/11/15 | User Testing Report 的数据来源；Demo Day 明文门槛 |
| T5 | User Testing Report 撰写 · Write the User Testing Report | Licheng Yang | 2026/11/15 | 报告（含用户原话与据反馈实施的改动） |
| T6 | Checkpoint 2 准备：可运行应用 + 3 项核心功能现场演示 · Checkpoint 2 preparation | Xiang Li | 2026/11/01 | Checkpoint 2 Report + 现场演示 |
| T7 | 非遗素材与内容授权人工核验 · Manual check of ICH content and asset licensing | Licheng Yang | 2026/10/25 | 来源与授权边界清单更新 |
| T8 | 双端人工验收闭环（确认 → 完成 → 反馈 → 漏斗复核，Demo 批次） · Two-device end-to-end acceptance loop | Wenjun Li | 2026/10/11 | 验收记录；依赖 P10 发布完成 |
| T9 | 多端与无障碍回归（375/768/1440/1920px、中英文、断网降级） · Responsive and accessibility regression | Zeyu Gong | 2026/10/11 | 四宽度 × 两语言检查记录 |
| T10 | 分析看板真实批次转化与四周经营门槛 · Real cohort conversion and four-week business gate | Guanqiao Feng | 2026/11/01 | 真实测试批次数据（当前只有 Demo 批次与合成假设） |

---

## 六、按成员索引（每人只录自己的卡）

| 成员 | 角色侧重 | 卡片编号 | 数量 |
| :--- | :--- | :--- | :-: |
| **Xiang Li**（组长） | 项目统筹、交付与发布、导师沟通 | D1、D14、D16、D19、D23 ／ P1、P3、P10、P11 ／ T1、T6 | **11** |
| **Zhiyuan Liang** | AI 导览、数字人与语音链路 | D3、D11、D12、D17、D20 ／ P5、P12 ／ T3 | **8** |
| **Wenjun Li** | 测试、环境与证据归档 | D10、D15、D18、D22 ／ P8、P9 ／ T4、T8 | **8** |
| **Zeyu Gong** | 前端、设计系统与交互体验 | D5、D7、D13 ／ P2、P4 ／ T2、T9 | **7** |
| **Licheng Yang** | 沉浸内容、非遗素材与文档 | D2、D4、D8 ／ P6、P13 ／ T5、T7 | **7** |
| **Guanqiao Feng** | 数据分析与商业模型 | D6、D9、D21 ／ P7、P14 ／ T10 | **6** |

> **分工纪律**：这张表按工作流平均分配，**组长承担最多（11 张）**。
> 但看板负责人必须**与实际贡献者一致**：录入前请每人核对自己的卡，**如某项实际不是你做的，请改派或删除**；
> 不要为了「每人都有卡」而认领没参与的工作——导师会按人问细节。

---

## 七、内部日期口径（**不是**课程官方截止）

截止 2026-10-05，Handbook、GroupCW 与 Week 3 页面**均未写明 Checkpoint 1 的具体公历日期、时段与演示方式**
（见 [十项对照与证据包](15_Checkpoint1_十项对照与证据包.md) 第四节）。本清单的日期是**团队内部目标**，
用于排期与看板填写，**不得作为课程截止日期写进报告或对外材料**。

| 阶段 | 内部目标区间 | 依据 |
| :--- | :--- | :--- |
| Checkpoint 1 冲刺（本周） | 2026-10-05 → 2026-10-11 | 课程已确认 Checkpoint 1 延至 **Week 4 末**；具体日期待确认 |
| Week 5 | 2026-10-12 → 2026-10-18 | 内部排期假设 |
| Week 6 | 2026-10-19 → 2026-10-25 | 内部排期假设 |
| Week 7（Checkpoint 2） | 2026-10-26 → 2026-11-01 | 内部排期假设 |
| Week 8–9（User Testing Report） | 2026-11-02 → 2026-11-15 | 内部排期假设 |

**待确认后统一改期**：请把 TA 回复的官方日期、演示时段与提交入口更新回本文件与看板。
（可直接使用的询问文字见 [十项对照与证据包](15_Checkpoint1_十项对照与证据包.md) 第四节。）

---

## 八、诚实边界（红线）

缺口的正确写法是「尚未进行」，不是含糊措辞，更不是编造。以下五条在本清单中已落实：

1. **Done 卡是补录**：卡片内容是 2026-09-11 至 10-05 已有日志 / 代码 / 测试日期支撑的既有工作，
   不是 10 月 5 日当周新做的功能。补录事实在周报与导师汇报中如实说明。
2. **真实用户测试尚未开始**：截至 2026-10-05 项目**没有**真实访谈、问卷或原型测试记录，
   因此 P9（首次 pilot）在 **In Progress**、T4（10+ 用户）在 **To Do**，**不写成已完成**，也不虚构人数与用户原话。
3. **Figma 交付未完成前不得写成已完成**：助教 9-24 明确要求 Figma MVP build；
   P2 在完成前保持在 In Progress，不能用公网网页截图冒充 Figma 交付。
4. **不虚构导师意见与经营数据**：外部导师会面在 T1 待办；ROI 272.8% / 回收期 3.22 个月
   是**可调合成假设**，不是实测回报；Demo 批次与账号数不能作为「扩大」依据。
5. **不倒填时间戳**：不改系统时间、不改日志日期；Done 卡的「截止时间」填**实际完成日期**，
   平台记录的创建时间（2026-10-05）保持原样。

---

## 九、提交前核对清单

- [ ] 卡片录入完成：完整版 **47 张**（23 / 14 / 10）；若采用第二节的最小方案，则 ≥30 张，**并在周报里注明 Done 列尚未录完**。
- [ ] **每人在自己账号下录入本人卡片**，平台创建人即贡献者（满足「每位同学添加自己的任务」）。
- [ ] 每张卡都有**负责人**，且与第六节成员索引一致；无人认领的卡已改派或删除。
- [ ] Done 卡的「截止时间」= 日志中的实际完成日期；未倒填、未改系统时间。
- [ ] 已截**看板全貌图**（标题 + 负责人 + 状态同屏），存为 `docs/05_每周日志/Week04_证据1_看板全貌_2026-10-05.png`。
- [ ] 周报「Kanban board status」字段已用第一节的真实数字替换（不再使用 Week 3 的备用段落）。
- [ ] Figma、真实用户测试、外部导师会面等**未完成项仍如实留在进行中 / 待办**。
- [ ] 获知官方日期与演示时段后，已回填本文件第七节并统一调整看板截止时间。

---

## 十、与其他文档的关系

| 文档 | 关系 |
| :--- | :--- |
| [CHANGELOG](CHANGELOG.md) | 第三节 Done 卡的**完成日期与事实来源**，逐条可核对 |
| [Checkpoint 1 报告 v2](10_Checkpoint1_Report_初稿.md) | §8.1 优先任务分工表的看板落地版本；报告里的【PLACEHOLDER：姓名】可用本清单第六节替换 |
| [十项对照与证据包](15_Checkpoint1_十项对照与证据包.md) | C 组缺口（E5/E6、Figma、看板截图、公网截图）在本清单中的对应卡：P9、P2–P8、P1、P13 |
| [P0 操作指引](11_P0操作指引.md) | 每周证据节奏、导师邮件模板、测试脚本与记录表、密钥轮换步骤 |
| [Week 3 周报](../每周提交内容/week3提交内容.md) | 该周报已如实记录「看板只有 1 张卡」的问题，本清单是它的补正动作 |

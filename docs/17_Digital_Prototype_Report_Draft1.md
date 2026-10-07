---
type: ENT207考核文档
project: 锦江苏绣文化礼宾原型
component: Component 2 — Final Deliverables · Digital Prototype Report
version: Draft 1 (Week 4 提交稿) · 2026-10-05
status: Draft 1 三项要求已完整覆盖；第 1.4、6 节为后续版本预留，已标明
deadline: Week 4 · 2026-10-07
living_document: true
封面语言: 中文正文 + 英文对照；课程未明确本次语言，两组可独立抽出
---

# Digital Prototype Report — 姑苏非遗数字文化礼宾与住中体验闭环

**Jinjiang AI ICH Concierge & Heritage Stay**

| 项目 Item | 内容 Content |
| :--- | :--- |
| 团队 Team | **THISISIT2018** · Table 20 |
| 组号 Group number | **Group 20** |
| 成员 Members | Xiang Li（李享，组长）、Zhiyuan Liang（梁之源）、Wenjun Li（李文俊）、Zeyu Gong（龚泽宇）、Licheng Yang（杨立诚）、Guanqiao Feng（凤冠桥） |
| 学号 Student IDs | Xiang Li 2472682 · Zhiyuan Liang 2363950 · Wenjun Li 2470787 · Zeyu Gong 2472137 · Licheng Yang 2468210 · Guanqiao Feng 2471032 |
| 课程 Module | ENT207TC Digital Startup Lab |
| 提交组件 Component | Component 2 — Final Deliverables · **Digital Prototype Report · Draft 1** |
| 提交日期 Date | **2026-10-07**（Week 4） |
| 版本 Version | Draft 1 |
| 建议文件名 Filename | `Group20_Component2_DigitalPrototypeReport_Draft1_2026-10-07` |
| 文档状态 Status | **Living document** — 本文件将持续演进为最终 Digital Prototype Report，不另起新稿 |

---

## 阅读说明 · How to read this report

> **提交前请删除本节。**
>
> 1. **本报告是 Living document。** 课程明确要求：Draft 1 是最终 Digital Prototype Report 的**底稿**，后续在同一份文件上改进，而不是最后重写一份。因此本稿已按「Draft 1 必交内容」与「终稿将扩充内容」分区，见下方路线图。
> 2. **Draft 1 必交三项**（平台原文）：① Document the problem: who has it, what it is, why it matters；② Document your solution concept and how it addresses the problem；③ Document your chosen features and why you selected them。分别对应本报告第 **1、2、3** 章。
> 3. **中文为正文、英文为对照。** 课程未明确本次报告语言；两组文字均可独立抽出提交。
> 4. `【PLACEHOLDER: …】` 必须替换为真实日期、链接或姓名。**禁止倒填日期、禁止虚构用户数据与导师意见。**
> 5. **写作纪律：** 本报告只写已实现或已决策的内容。团队复核中发现的过度声称（Live2D、口型同步、sort/search、3D 全景、Studio 在线生成）已全部从本文剔除，理由记录在第 3.7 节——**我们主动写下了自己删掉了什么，因为这也是「why we selected them」的一部分。**

### 版本路线图 · Version roadmap

| 章节 | Draft 1（本次，Week 4） | 最终版（Week 10 前） |
| :--- | :--- | :--- |
| 1 问题 | ✅ 完整 | 补充真人用户验证数据 |
| 2 解决方案概念 | ✅ 完整 | 按测试反馈修订 |
| 3 选定功能及理由 | ✅ 完整 | 补充功能完成度与实测表现 |
| 4 架构与技术栈 | 🟡 已列骨架（素材齐，Week 5–6 成稿） | 系统架构图、数据模型、技术选型论证 |
| 5 原型现状与访问 | 🟡 已列访问方式 | 正式域名、评分人访问指引、演示账号 |
| 6 已知限制 | 🟡 已列九条 | 按版本更新 |
| — | — | **新增：** 开发过程反思、测试证据与用户原话、商业化路径 |

---

## 0. 摘要 · Executive summary

**中文：** 本项目为锦江国际集团文旅场景设计一款**住中时段的 AI 苏绣文化礼宾**。高星文旅酒店的大堂非遗展陈是静态的——住客有停留时间却只拍照打卡，酒店无法为每位住客配备讲解员，高溢价非遗体验难以转化。我们用数字人「婉娘」把住客的一时好奇，转化为一段沉浸式微距观绣、一次可处理的 90 分钟工坊意向，以及一份告诉酒店「下一步该做什么」的运营看板。Draft 1 记录问题、解决方案概念与选定功能及其选择理由。

**English:** This project designs an **in-stay AI Su-embroidery cultural concierge** for Jinjiang International's hospitality and cultural-tourism scenarios. Heritage displays in luxury hotel lobbies are static — guests linger but only take photos, the hotel cannot staff a curator per guest, and high-margin heritage experiences convert poorly. The digital host "Wanniang" turns a guest's passing curiosity into an immersive macro-embroidery experience, a processable 90-minute workshop request, and an operations dashboard that tells the hotel what to do next. Draft 1 documents the problem, the solution concept, and the chosen features with the reasoning behind each selection.

| 项 Item | 一句话 One line |
| :--- | :--- |
| 问题 Problem | 静态展陈 + 无法配备讲解员 = 住客没获得深度体验，酒店错失高溢价消费 |
| 用户 Users | C 端：高星文旅酒店的中高端文化度假住客；B 端：酒店市场与运营团队 |
| 解法 Solution | 住中闭环：微距观绣 → 婉娘问答 → 记录意向 → 运营处理与去重漏斗 |
| 选定功能 Chosen features | ① 知识库约束的婉娘问答 ② 个性化推荐与意向闭环 ③ 商业分析看板与决策门 |
| 最大缺口 Biggest gap | **真人用户测试尚未启动**（Week 4 启动 Study 01）；本报告不使用虚构验证数据 |

---

## 1. 问题 · The problem

> **Draft 1 第 ① 项：** Document the problem — who has it, what it is, why it matters.

### 1.1 问题陈述 · What the problem is

**中文：** 入住锦江等高星文旅酒店的中高端文化度假住客，在办理入住后到晚餐前有一段 15–30 分钟的空闲停留，人就在酒店大堂公区，身边就有非遗展陈与主题房。但面对传统静态展陈，体验是扁平的——多数住客只拍照打卡，无法理解劈丝、针法等微观工艺；而酒店难以常驻高成本的一对一专业讲解员来填补这个缺口。结果是双重损失：住客错过了真正有文化含量的体验，酒店错过了每房晚约 ¥300–¥600 的非遗增值消费。

**English:** Guests on a cultural leisure trip who stay at luxury heritage hotels such as Jinjiang have an idle 15–30 minute window between check-in and dinner. They are physically standing in the hotel lobby, surrounded by heritage displays and themed rooms. Yet static displays give a flat experience — most guests only take photos and never understand the micro-craftsmanship of silk-splitting or stitch technique — while the hotel cannot afford to station a dedicated one-to-one curator for every guest. The result is a double loss: the guest misses a genuinely cultural experience, and the hotel misses roughly ¥300–¥600 of heritage-attached spending per room night.

**一句话版本 · One-liner：**

> 问题不在于酒店没有非遗内容，而在于**从「看见」到「理解」再到「参与」之间没有触点**。
> The problem is not that the hotel lacks heritage content; it is that **no touchpoint connects seeing, to understanding, to participating.**

### 1.2 谁有这个问题 · Who has it

| 用户 User | 是谁 Who | 使用情境 Context | 核心诉求 Core need |
| :--- | :--- | :--- | :--- |
| **C 端 · 主要** 住客 Guest | 入住高星文旅酒店的 25–45 岁中高端文化度假住客；对非遗有兴趣但无专业背景 | 住中空闲时段，用手机在大堂、客房或酒店内使用 | 「我现在这 2 小时能做什么真正有文化含量的体验？值不值？」 |
| **B 端 · 次要** 酒店运营 Operations | 酒店市场与运营团队、非遗体验项目负责人 | 每批次体验结束后，在后台复盘与排期 | 「哪些客群真的会转化？下一轮该继续试点、调整还是暂缓？」 |
| 间接受益 Indirect | 非遗传承人与工坊、地方文旅 | 通过酒店渠道获得高意愿客群与稳定订单 | 让手艺被真正理解，而不只是被拍照 |

**情境细节 · Context notes：** C 端用户的使用条件有三个硬约束，它们直接决定了设计：① **时间碎片化**（只有 15–30 分钟空闲，不能要求长流程）；② **注意力和耐心有限**（需要即时反馈，不能要求阅读长文）；③ **手机为主**（界面必须单手可用、加载快）。这三条约束是第 3 章功能取舍的直接依据。

**代表画像 · Representative persona（示例，非已验证真人）：**

> **陈女士，34 岁，带着 6 岁孩子旅行，入住苏州一家高星酒店。** 下午 4 点回房，晚饭前有约 2 小时空档，预算约 ¥150 想让孩子接触点真正的手艺。她在酒店大堂看到苏绣展陈，拍了两张照，读了一段 3 行的展签，仍然不知道「劈丝到底是什么感觉」「现在能不能真的上手试」。
>
> 她的决策链条是：**「值得吗？」（3 秒）→「要多久、多少钱？」（10 秒）→「现在能约上吗？」（30 秒）→「孩子能参与吗？」** 任何一环给不出答案，她就放弃。

**为什么用这个画像 · Why we frame it this way：** 这不是真实访谈对象，而是我们用来**统一设计判断与演示脚本**的合成画像——它是 §1.5 中 E5 的待验证对象，不是已验证结论。演示时我们固定用这个场景（带孩子、下午 2 小时、预算 150）走完整流程，正是为了让读者看到「一个具体的人」而不是抽象的「中高端客群」。

### 1.3 用户现在怎么办，以及为什么不够 · Current alternatives, and why they fall short

**Draft 1 要求记录「谁有这个问题」，但更重要的是：他们今天已经在用别的办法解决，而我们要说明那些办法为什么不够。** 这是问题真实性的第一个检验点。以下四条为团队整理的**待验证假设**（待 E5/E6 验证），不是实测数据：

| 现有做法 Current workaround | 用户体验 Experience | 为什么不够 Why insufficient |
| :--- | :--- | :--- |
| **只看大堂展陈** | 拍几张照、读 3 行展签就走 | 理解门槛太高。工艺价值无法用静态展签传递，看完仍不知道「好在哪里」 |
| **问前台 / 礼宾** | 得到方向性回答或一张宣传单 | 前台不是非遗专业讲解，无法回答工艺细节；且高峰期无法一对一 |
| **自己搜攻略** | 打开小红书/大众点评搜索「苏州 苏绣 体验」 | 信息碎片、质量参差、与酒店现场脱节；从「产生兴趣」到「找到可预订的选项」要跨 3–4 个 App |
| **彻底放弃** | 回房休息或刷手机 | 这是最常见的结果——不是没兴趣，而是**转化摩擦大于兴趣强度** |

**由此得到的判断 · What this tells us：** 问题不是「住客没有兴趣」，也不是「酒店没有内容」，而是**兴趣产生的那一刻与可行动的那一刻之间是断开的**。任何要求住客离开当前页面、切换 App、或等待人工响应的方案，都在这段断裂里流失用户。**这直接推导出第 2 章「在住客已经打开的那个界面里完成闭环」的设计要求。**

### 1.4 为什么重要 · Why it matters

| 视角 Perspective | 为什么值得解决 Why it matters |
| :--- | :--- |
| **对住客 For guests** | 高星酒店住客已为文化溢价付费，却没得到对应的文化体验；他们缺的不是信息，而是**可理解、可参与**的入口 |
| **对酒店 For the hotel** | 非遗体验是高毛利、可差异化的增值品类。转化率偏低不是因为没需求，而是因为**没有低成本的转化触点**——这正是 AI 可以补位的地方 |
| **对非遗 For ICH** | 「拍照打卡」式传播无法传递工艺价值。把理解门槛降低，才可能把观赏者变成参与者与付费者 |
| **对课程/课题 For the brief** | 课题要求聚焦「AI + 非遗」并落在酒店运营、旅游产品或景区管理之一，本问题明确落在**酒店运营**域，且非遗（苏绣）与酒店场景有天然结合点 |

### 1.5 证据现状与局限 · Evidence status and its limits

> **我们不把计划写成结果。** 这一节是本节最需要导师注意的部分。

| # | 证据 Evidence | 类型 Type | 状态 Status |
| :-: | :--- | :--- | :--- |
| E1 | 团队 20 分钟结构化选题冲刺：3 个候选问题-解法对按 5 维度打分（24 / 16 / 16） | 团队过程记录（真实） | ✅ 见 [Week 02 方案选择](08_Week02_Problem_Solution_Choice.md) |
| E2 | **2026-09-24 助教反馈**：提案获认可、可继续；要求尽快完成 Figma MVP build | 口头反馈（团队转述，无原始截图） | ⚠️ 见 [反馈留痕](evidence/20260924-TA-feedback.md)；不得写成签字批准 |
| E3 | 苏绣知识库 9 张非遗卡 + 1 张苏州攻略卡，均标注公开来源与「需传承人复核」边界 | 二手资料整理（真实） | ✅ 见 [非遗内容与来源](02_非遗内容与来源.md) |
| E4 | 高星酒店大堂场景与非遗体验课的现场观察 | 非正式观察（真实，非访谈） | 🟡 有素材，待整理成可引用记录 |
| E5 | **真实用户访谈 / 问卷** | 一手用户证据 | ❌ **尚未开展。** Week 4 启动 Study 01（3–5 人 pilot；Week 8–9 累计 ≥10 人） |
| E6 | **原型可用性测试记录** | 一手用户证据 | ❌ **尚未开展。** 目前只有团队内部走查 |
| E7 | 酒店侧成本与转化率一手数据 | 一手经营证据 | ❌ 未获得。¥300–¥600 与转化率为**待验证估计** |

**能主张什么、不能主张什么 · What we can and cannot claim：**

- **可以主张：** 选题经过结构化比较而非主观判断；问题在公开资料与现场观察层面成立；非遗内容来源可溯且已标注授权边界。
- **不能主张：** 问题严重度已被用户验证；转化率与客单价数字已被实测；原型已被真实住客使用过。
- **下一步验证：** E5、E6 于 Week 4 启动，测试脚本与记录模板已就绪（见 [P0 操作指引](11_P0操作指引.md) 第三节）。**本节将在最终版中以实测数据替换估计值。**

---

## 2. 解决方案概念 · Solution concept

> **Draft 1 第 ② 项：** Document your solution concept and how it addresses the problem.

### 2.0 我们考虑过并被否掉的替代方案 · Rejected alternatives

**「你们为什么是这个方案？」——在说明我们做了什么之前，先说明我们比过什么。** 在 Week 2 的 20 分钟结构化冲刺中，团队对三个候选「问题—解法」对按 5 维度打分（触达、严重度、证据、可行性、团队意愿，各 1–5 分，满分 25）。以下是被否掉的两个方案及否掉的理由：

| 候选 Candidate | 问题 | 提议解法 | 得分 | 未采用的原因 Why rejected |
| :--- | :--- | :--- | :-: | :--- |
| **选项 1 · 采用** 住中非遗活态转化与 AI 文化礼宾 | 高星酒店住客住中空闲时段面对静态展陈，酒店无法配备一对一讲解员 | 数字文化礼宾 + 微距工坊闭环 + 运营看板 | **24/25** | —（最终选定） |
| 选项 2 · 否掉 独立工坊与新手学徒的预约与认知断层 | 苏州独立苏绣工坊与新手学员靠微信零散沟通 25 分钟以上，退课率约 20% | 轻量级「起针互动拆解 + 工坊席位预约」小程序 | 16/25 | **触达面窄**（单店工坊，难以规模化）；**与酒店运营域关联弱**，对课题三个业务域的对齐度低；更关键的是它只解决「预约摩擦」，不解决「住客根本不了解工艺所以不产生兴趣」这个上游问题 |
| 选项 3 · 否掉 深度自由行游客的碎片化踩坑 | 姑苏区自由行游客只有 2–3 小时空闲，找不到可靠的非遗工坊信息，浪费 1–2 小时试错 | 基于时间与地理位置的「2 小时非遗微度假」即时匹配与雅凭生成器 | 16/25 | **证据最弱**（无一手游客数据支撑「1–2 小时试错」的规模）；**可行性偏低**——实时席位匹配依赖工坊侧真实库存接入，课程周期内无法完成；且与选项 1 相比缺少 B 端付费方 |

**这次比较教了我们什么 · What the comparison taught us：**

- **上游问题比下游摩擦更值得解决。** 选项 2 优化的是「已经决定要去的人如何更顺利地预约」；我们选择的是「让还没产生兴趣的人产生兴趣并立即行动」——后者的价值链条更长，也更能解释为什么需要 AI（降低理解门槛正是 AI 擅长的）。
- **有付费方的方案更完整。** 选项 3 的受益者只有 C 端游客；选项 1 同时服务 C 端住客与 B 端酒店运营，后者才是预算的来源。
- **可行性是硬门槛。** 两个被否方案都依赖我们无法在课程周期内接入的外部系统（工坊实时库存）；选项 1 的闭环可以完全在我们自己的原型内跑通。

> 完整的候选陈述、打分矩阵与依据见 [Week 02 方案选择](08_Week02_Problem_Solution_Choice.md)。**打分是团队内部判断，不是外部验证**——它的作用是让选择过程可追溯、可质疑。

### 2.1 概念 · The concept

**中文：** 面向锦江酒店住中场景的 **AI 苏绣文化礼宾**。数字人「婉娘」作为统一的交互入口，把住客的一时好奇推进为：一段沉浸式微距观绣体验 → 一次基于时间/预算/同行/兴趣的个性化推荐 → 一条可被酒店处理的 90 分钟工坊意向 → 一份帮助酒店判断「继续试点、调整还是暂缓」的运营看板与可调 ROI 情景。

**English:** An **in-stay AI Su-embroidery cultural concierge** for Jinjiang hotels. The digital host "Wanniang" acts as a single conversational entry point that moves a guest from curiosity to: an immersive macro-embroidery experience → a personalised recommendation based on available time, budget, party and interest → a processable 90-minute workshop request → an operations dashboard with adjustable ROI scenarios that helps the hotel decide whether to pilot, adjust or pause.

**它是什么，不是什么 · What it is and is not：**

| 它是 It is | 它不是 It is not |
| :--- | :--- |
| 一个把线上兴趣转成线下可处理需求的**转化闭环** | 一个孤立的聊天机器人 |
| 一套**知识库约束**的 AI 问答（有来源、有降级、有边界） | 一个放任模型自由发挥的通用问答 |
| 一个给酒店的**决策支持**工具（区分观测行为与合成假设） | 一套真实的酒店 PMS 或预订系统 |
| 一个**非遗内容有版权与尊重边界**的产品 | 一个把非遗当作装饰素材的展示页 |

### 2.2 它如何回应问题 · How it addresses the problem

问题的每一环都有对应的产品机制，没有一环是靠「界面更好看」解决的：

| 问题环节 Problem element | 产品回应 Product response | 机制 Mechanism |
| :--- | :--- | :--- |
| 静态展陈无法产生理解 | **微距观绣 + 交互展签 + 三步探索任务** | 把「看」变成主动操作：切换主题/色样/受光，比较两种劈丝等级，完成探索卡 |
| 无法为每位住客配讲解员 | **知识库约束的 AI 问答** | 可并发、无排队、中英双语；模型不可用时回退本地知识回答并明示 |
| 兴趣无法转化为消费 | **显式确认的推荐与意向提交** | 规则筛选推荐 → 用户主动提交意向 → 运营侧确认/拒绝（拒绝必填原因）→ 住客反馈 |
| 酒店不知道规模该多大 | **按批次去重的行为漏斗 + ROI 情景 + 决策门** | 8 级漏斗只统计完成前序步骤的人；默认只输出「试点/暂缓」；Demo 数据不作为扩大依据 |
| AI 介入非遗的伦理风险 | **来源披露 + 内容边界 + 密钥边界** | 回答标注实际选用的资料；知识卡标注「非传承人定稿、商用需授权」；模型密钥仅存服务端 |

**核心设计判断 · The key design judgement：** 我们没有把产品做在「让 AI 讲得更生动」上，而是做在**「让兴趣有下一步」**上。讲解的流畅度是模型的通用能力，任何团队都能调用；而**从兴趣到可处理需求的链路**是本项目真正的产品价值，也是第 3 章功能取舍的出发点。

### 2.3 用户如何走完一次完整体验 · The user journey

```text
激发兴趣            理解文脉            形成意向            运营处理            复盘决策
Immersive scroll → Wanniang AI guide → Save recommendation → Ops handling → Analytics
   /immersive          /guide            /my (intent submit)   /operations    /analytics
```

| # | 步骤 Step | 页面 Route | 用户做什么 User action | 系统做什么 System response |
| :-: | :--- | :--- | :--- | :--- |
| 1 | 进入 Enter | `/` `/auth` | 浏览首页场景；需要保存时登录 | 服务端决定测试批次（`Demo` / `Study 01`），注册者不能自行选择 |
| 2 | 探索 Explore | `/guide` | 提问，例如「我带孩子，下午有 2 小时，预算 150，想体验苏绣」 | 知识库检索 + 意图识别；在线时 DeepSeek 流式回答，不可用时切本地知识回答并明示 |
| 3 | 沉浸 Immerse | `/immersive` | 切换主题、色样、受光与劈丝等级，完成探索卡并保存 | 三步任务按真实判据计算进度（默认值不计入；主动选择去重累计），跨设备保存 |
| 4 | 推荐 Recommend | `/immersive` → 推荐卡 | 点击「让婉娘推荐体验」，核对需求卡 | 规则筛选（按时长/预算/同行过滤后按兴趣匹配排序）+ AI 解释（模型失败时回退规则文案） |
| 5 | 意向 Express intent | `/my` | 选择体验场次并**主动提交**意向 | 容量与防重复校验；提交前需显式确认 |
| 6 | 处理 Handle | `/operations` | 运营筛选当前批次，确认名额或拒绝（拒绝必须填写原因） | 角色权限校验 + 状态机流转 |
| 7 | 确认 Confirm | `/my` | 刷新查看最新状态，提交一次数字流程反馈 | 跨设备同步；一单一评 |
| 8 | 决策 Decide | `/analytics` | 运营选择批次，查看漏斗与导览意向汇总 | 8 级去重漏斗 + 兴趣分布 + 反馈；AI 简报仅接收聚合数据 |

> **这就是我们在演示中会现场走完的那一条完整流程。** 只展示独立页面无法说明用户如何得到结果，因此每次演示都以「一个带孩子的住客、下午有 2 小时、预算 150」为具体场景，从第 1 步走到第 8 步。

### 2.4 设计原则 · Design principles

产品中三个反复出现的判断，它们是范围决策的依据，也是我们主动给自己设的限制：

1. **不假装成功 · No fake success.** 服务未配置或模型不可用时，界面明示降级状态，绝不显示虚假成功。断网时不谎报保存成功。
2. **AI 不替代人 · AI does not replace practitioners.** 内容标注来源并保留传承人复核边界；合规与文化尊重是产品约束，不是宣传文案。系统不保存聊天原文，只保存结构化字段。
3. **区分三类信息 · Separate three kinds of truth.** 界面与报告严格区分「观测到的用户行为」「合成的经营假设」「真实的经营结论」。Demo 批次与账号数量不能作为扩大投入的依据。

---

## 3. 选定功能及选择理由 · Chosen features and why we selected them

> **Draft 1 第 ③ 项：** Document your chosen features and why you selected them.

### 3.1 判据：什么算「选定功能」 · Our selection criteria

我们采用课程 Appendix A 的业务判据，并加了一条自己的门槛：**一个功能必须能完整回答「用户输入什么 → 系统如何处理 → 产生什么用户价值」**，否则不计入。

| 课程判据 Appendix A | 本项目的对应 |
| :--- | :--- |
| Chatbot trained on specific user needs or data | 功能一 |
| Secure and useful use of LLM APIs | 功能一（服务端密钥 + 配额 + Origin 白名单） |
| Input analysis with personalized recommendations | 功能二 |
| Dynamic task/goal tracker with progress logic | 功能二（探索卡三步真实判据） |
| User-facing database features (filter, status workflow) | 功能二（运营端筛选与状态流） |
| Analytics dashboard that visualizes trends | 功能三 |
| AI-generated suggestions from aggregated data | 功能三（AI 运营简报） |

### 3.2 功能一 · 婉娘知识库问答（Feature 1 — Wanniang knowledge-grounded Q&A）

| 环节 | 内容 |
| :--- | :--- |
| **输入 Input** | 住客的自然语言提问（中文或英文），可含同行人、可用时长、预算、兴趣 |
| **处理 Process** | 服务端检索苏绣知识库并按问题识别意图 → 交给 DeepSeek 流式生成（SSE）→ 返回实际选用的资料来源；模型密钥仅存在于服务端 Edge Function |
| **输出 Output** | 可中断的流式回答 + 来源披露 + 结构化意图字段（体验类型、同行、时长、预算、情感信号） |
| **用户价值 Value** | 住客不用排队等讲解员就能理解工艺文脉；酒店侧获得可归因的兴趣信号 |
| **降级 Fallback** | 模型不可用/超时 → 本地知识回答并如实标注；两者都不可用 → 明示「共享服务未配置」 |

**为什么选它 · Why we selected it：**

- 它直接回应问题中最硬的一环：**「无法为每位住客配备讲解员」是成本结构问题，不是意愿问题。** 只有可并发的 AI 问答能把讲解的边际成本降到接近零。
- 它是整条闭环的**入口**。没有它，第 2–8 步都无从开始。
- 它是课程判据中权重最明确的一项（特定数据训练的问答 + 安全使用 LLM API）。

**我们主动加的限制：** ① 回答只基于策展过的知识卡，超出范围时明确提示「以下为基于公开常识的补充」；② 不保存聊天原文，只写入结构化字段；③ 知识库明确标注「非传承人口述定稿，正式商用需授权与复核」。

### 3.3 功能二 · 个性化推荐与体验意向闭环（Feature 2 — Personalised recommendation and intent loop）

| 环节 | 内容 |
| :--- | :--- |
| **输入 Input** | 时间 / 预算 / 同行构成 / 兴趣四类结构化输入，可由问答自动带入或手工调整 |
| **处理 Process** | 服务端校验参数 → 规则筛选匹配 90 分钟工坊（按时长、预算、同行过滤后按兴趣匹配与时长排序）→ AI 生成推荐解释（失败回退规则文案）→ 用户显式确认后提交意向 → 运营侧确认/拒绝 → 住客反馈 |
| **输出 Output** | 推荐卡 + 意向记录 + 状态变更（提交 / 已确认 / 已拒绝 / 模拟完成）+ 一条反馈 |
| **用户价值 Value** | 把「有点兴趣」变成有状态、有责任人、可追踪的具体请求；酒店侧获得可处理的需求队列 |
| **完整性约束** | 容量防超卖、幂等提交、一单一评、批次隔离（`Demo` 与 `Study 01` 不互串） |

**为什么选它 · Why we selected it：**

- **这是我们最重要的功能，也是最容易被误认为「只是聊天机器人」的部分。** 聊天只是触点之一；真正的产品价值在于把兴趣落成一条**有状态、有责任人、可追踪**的业务对象。没有它，产品就只是一个会说苏绣的问答玩具。
- 推荐逻辑是**真规则而非模板**：按时长/预算/同行过滤，再按兴趣匹配与时长排序；兴趣由探索行为推断而非用户自报——这让推荐有可解释性，也便于在测试中验证。
- 它同时满足课程两项判据（个性化推荐分析 + 带进度逻辑的任务追踪）。

**诚实边界 · Honest boundary：** 场次、容量、确认与「模拟完成」**全部是原型状态机，不是真实酒店库存或真实预约**。本阶段明确不做真实 PMS 对接与在线支付——这是有意的范围决定，理由见第 3.4 节。

### 3.4 功能三 · 商业分析看板与决策门（Feature 3 — Commercial analytics with decision gates）

| 环节 | 内容 |
| :--- | :--- |
| **输入 Input** | ① 按批次去重的真实用户行为事件（注册→探索→完成→保存→提交→确认→完成→反馈）；② Python 分析层产出的 1,200 条匿名合成住客样本与可调经营假设 |
| **处理 Process** | pandas 特征整理 → scikit-learn `KMeans(k=3)` 标准化后客群分层 → 收入与 ROI 情景计算（`shared/roi-assumptions.json` 为前后端唯一口径）→ 触发试点/扩大/暂缓决策门 |
| **输出 Output** | 8 级去重漏斗、探索兴趣分布、数字流程反馈、客群筛选、可调情景 ROI、AI 运营简报与书面门槛 |
| **用户价值 Value** | 酒店不再凭感觉排期：能区分「观测行为」「合成假设」与「真实结论」，并据此决定下一轮动作 |

**为什么选它 · Why we selected it：**

- 它面向 **B 端付费方**。C 端体验再好在酒店内部也没有预算，除非运营能用它做排期决策——**这是商业可行性论证的必要一环，不是课程的附加要求。**
- 课题明确要求「含基于 Python（pandas、scikit-learn）的商业分析层，用于客群分层、收入预测或 ROI 情景」。我们用了真实算法（`KMeans(k=3)`、标准化、可复现随机种子）而非硬编码数字。
- 它让整条闭环**可回到决策**：漏斗不是装饰性图表，而是「下一轮继续试点 / 调整 / 暂缓」的输入。

**我们主动加的克制 · Deliberate restraint：** 系统默认只输出「试点」或「暂缓」；即使模型给出「扩大」，也会被降级为「试点」并注明扩大仍须以真实试验与人工复核为依据。**Demo 批次与账号数量不能作为扩大依据。**

**关于合成数据的声明：** 1,200 条样本为可复现的匿名合成数据，非锦江真实经营数据。默认主题房情景下月新增收入 ¥125,520、月经营成本 ¥32,320、月贡献 ¥93,200、启动投入 ¥300,000，12 个月净 ROI 272.8%、回收期约 3.22 个月。**此为可调经营假设，不是实测回报**；不含税、折现与折旧。

### 3.5 三者缺一不可 · Why all three are required

| 功能 Feature | 如果没有它会怎样 If absent |
| :--- | :--- |
| 一 · 知识库问答 | 住客的「为什么」无人回答，静态展陈的问题原样存在，整条闭环无从开始 |
| 二 · 推荐与意向闭环 | 产品沦为会聊天的问答玩具，兴趣无处落地，酒店没有可处理的对象 |
| 三 · 分析看板与决策门 | C 端体验无法转化为 B 端决策依据，商业可行性无法论证 |

> 三者的关系是**一条链而不是三个并列功能**：功能一产生兴趣信号 → 功能二把信号落成可处理需求 → 功能三把行为沉淀为决策依据。缺任何一环，闭环就断在那一环。

### 3.6 我们刻意不计入核心功能的部分 · Deliberately excluded

评审最常追问的是「凭什么登录和首页不算核心功能」。我们的判据是：**没有「用户输入 → 处理 → 价值」逻辑的，一律不计入。**

| 实现 Implementation | 为什么不计为核心功能 Why excluded | 它的真实定位 |
| :--- | :--- | :--- |
| 注册登录、角色权限 | 纯基础设施。登录本身不证明产品解决了问题 | 支撑功能二的数据归属与权限边界 |
| 首页品牌场景 | 展示为主，没有用户输入与结果逻辑 | 入口与氛围 |
| 数字人婉娘形象 | 呈现层，不产生业务结果 | 交互人格化载体 |
| Studio 内容工作台 | 当前为**规则/模板生成**，界面已如实标注；接入在线 LLM 属后续版本 | 运营侧辅助工具 |

### 3.7 我们删掉了什么，以及为什么 · What we removed, and why

**这一节属于「why we selected them」的反面——我们主动记录了放弃的功能，因为克制本身就是设计决策，而不是没做完。**

| 删除项 Removed | 触发 Trigger | 理由 Rationale | 处置 Outcome |
| :--- | :--- | :--- | :--- |
| 3D / A-Frame 全景沉浸 | 团队实测观感模糊、「AI 味重」 | 8K 等距柱状全景摊到约 90° 视口后有效像素仅约 2048px 宽，与一张 2K 平面图等强——模糊是该投影的**固有上限**，不是调参问题 | 连代码与 14 个全景素材（约 27MB）一并移除；对外统一称「苏绣艺境」 |
| 口型同步贴片 | 6 组参数复测**证伪**：立绘与口型素材异源，无法合成 | 素材来源不一致是根因，继续投入不会收敛 | 停用，改为下颚律动；对外口径为「眨眼 + 下颚律动 + 语义表演」 |
| Live2D 正式模型 | 缺少合法 Cubism 模型与已注册运行时 | 授权与资产不可验证，硬接会带来合规风险 | 保留分支代码，配置到位即可接管；未配置时降级为零闪屏静态图 |
| 防伪入席雅凭 | 复核发现文档承诺超出实现 | 承诺未兑现项是评审风险 | 从对外表述撤下，列为后续版本 |
| 茶艺交叉推荐规则 | 同上 | 同上 | 同上 |
| Studio 在线生成 | 实现为规则/模板 | 界面已如实标注，不宣称 LLM 生成 | 列为后续版本 |
| 真实 PMS / 在线支付 | 主动排除 | 合规成本过高，且与「短周期内交付可演示闭环」冲突 | 明确写入范围外（第 6 节） |

> **一句总结：** 我们把「想做的」和「能证明做成的」严格分开。每一项删除都有触发原因、依据与处置结果——**这是范围管理能力，而不是功能缺失。**

---

## 4. 架构与技术栈 · Architecture and tech stack

> 🟡 **Draft 1 骨架。** 素材已齐（见 [交接文档](HANDOFF_FOR_NEXT_AGENT.md) 的架构与路由表），Week 5–6 扩充为完整章节。

### 4.1 当前技术栈 · Current stack

| 层 Layer | 选型 Choice | 选它的理由 Why |
| :--- | :--- | :--- |
| 前端 Frontend | Vite + React + TypeScript + Tailwind | 构建快、类型安全；8 条路由全部懒加载，入口主包约 433 KB（分包后） |
| 后端 Backend | Supabase Auth + Postgres + Edge Functions | 免自建服务；RLS 提供行级隔离；Edge Function 天然适合「密钥不出服务端」 |
| AI | DeepSeek（OpenAI 兼容）经 Edge Function 调用 | 中文非遗语境表现好、成本可控；服务端调用保证密钥边界 |
| 分析 Analytics | Python：pandas + scikit-learn | 课题要求；算法可复现（固定随机种子），产物 JSON 回填前端看板 |
| 数字人 Avatar | 分层立绘（puppet）+ CSS 变量驱动 | 无需 Live2D 授权即可获得可信动效；未配置时降级为静态图 |

### 4.2 路由与角色 · Routes and roles

| 路由 Route | 用途 Purpose | 权限 Access |
| :--- | :--- | :--- |
| `/` | 礼遇首页 | 公开 |
| `/auth` | 登录和注册 | 公开 |
| `/guide` | 婉娘导览与推荐 | 公开预览；正式信号与保存需登录 |
| `/immersive` | 苏绣艺境与探索任务 | 公开预览；云端保存需登录 |
| `/my` | 探索卡、推荐、意向和反馈 | 登录 |
| `/operations` | 批次分配与体验处理 | 运营 |
| `/studio` | 内容工作台 | 运营 |
| `/analytics` | 试用统计与经营模拟 | 运营 |

### 4.3 关键工程约束 · Engineering constraints we do not break

- 不把 service role、DeepSeek、Azure 或 Supabase 管理 token 放入前端环境变量或文档。
- 不在仓库保存有效运营账号密码。
- 不允许注册者自行选择正式测试批次或运营角色。
- 不让客户端直接修改意向状态、容量、事件或批次字段。
- AI 失效时必须保留本地知识回答和规则推荐。
- AI 运营简报在服务端重新读取当前批次统计，**不信任浏览器提交的漏斗数字**。

### 4.4 待扩充 · To be expanded in the final version

- [ ] 系统架构图（前端 / Edge Function / Postgres / Python 分析层的调用关系）
- [ ] 数据模型与 RLS 策略说明
- [ ] 关键状态机图（意向生命周期）
- [ ] 技术选型对比（为何 Supabase 而非自建、为何服务端调用 LLM）

---

## 5. 原型现状与访问 · Prototype status and access

> 🟡 **Draft 1 骨架。** 访问方式已定，正式域名与验收在 Week 4 完成。

### 5.1 今天实际能运行的部分 · What is running today

| 层 Layer | 实现 Implementation |
| :--- | :--- |
| 前端 | 8 条路由全部懒加载；中英双语；住客/运营角色分离（角色不可自行指定） |
| 后端 | Supabase Auth + Postgres + Edge Functions；3 个迁移；RLS 全表隔离；批次服务端分配 |
| AI | DeepSeek 经服务端调用（SSE 流式）；前端仅持有 publishable key；60 次/小时/人配额 + Origin 白名单 + JWT 自校验 |
| 分析 | `analytics/analyze.py`：pandas + `KMeans(k=3)`，输出 1,200 条匿名合成样本快照 |
| 数字人 | 分层立绘：眨眼 + 下颚律动 + 语义表演；含静态图与减少动态效果降级 |
| 业务闭环 | 探索 → 推荐 → 意向 → 运营处理 → 住客反馈 → 批次去重漏斗，可端到端走通 |

### 5.2 评分人如何访问 · Access for assessors

| 方式 | 地址 / 步骤 | 状态 |
| :--- | :--- | :--- |
| 公网预览 | <https://idyllic-bubblegum-1f5a5c.netlify.app/> | 🟡 站点存在；**本地网络当前无法完成 HTTP 复检**，提交前须重新确认可用性 |
| 本地一键启动 | 项目根目录双击 `启动网站.cmd`（端口 5181）或 `web/start-dev.ps1`（端口 5180）→ <http://127.0.0.1:5181/> | ✅ 可用 |
| 演示账号 | 公示页面仅提供「住客演示」卡（点击只填表单、不自动登录）；运营账号由团队负责人通过独立渠道发放，**不写入仓库或本报告** | ✅ 策略已实现 |
| 演示动线 | 八步动线见 [演示脚本与账号](03_演示脚本与账号.md) 第二节 | ✅ 已定稿 |

### 5.3 数字界面工具交付 · Design-tool deliverables

| 工具 Tool | 内容 Content | 状态 |
| :--- | :--- | :--- |
| Visily | 手绘草图转数字线框图 | 【PLACEHOLDER：文件链接 + 每位成员的工作截图】 |
| Figma | MVP build（助教 9-24 明确要求的交付项） | 【PLACEHOLDER：Figma 文件链接 + 版本时间 + 各成员编辑截图】 |
| Pixso | 页面跳转与交互连接，生成可点击原型 | 【PLACEHOLDER：原型链接 + 交互连接截图】 |

> **红线：** 公网网页截图**不能**代替 Figma 交付。每位成员都需要自己的账号与三工具工作截图——「一个队友完成了设计」不构成其他成员的贡献证明。

### 5.4 质量验证 · Quality verification

| 项 | 结果 | 说明 |
| :--- | :--- | :--- |
| 前端自动化测试 | **76 项通过 / 10 个测试文件** | 含 RLS 隔离、批次归属、容量防超卖、幂等、AI 配额、SSE、ROI 一致性、语音订阅 |
| Python 分析回归 | **4 项通过** | 样本可复现性、分层稳定性、ROI 跨语言一致、亏损无回收期 |
| 构建 | 普通构建与独立演示构建均通过 | — |
| 技术证伪实验 | 口型贴片 6 组参数复测 → **证伪** | 证据归档 `docs/evidence/mouth-sprite-falsification/` |

> **测试数字的核算口径：** 上述结果引自 [修复与验收记录](14_课程演示修复与验收记录.md)（2026-10-04 同机实测）。2026-10-05 复核时 `web/tests/` 下 **10 个测试文件确实存在**；但本机 Python 依赖包的 Windows 文件权限异常导致测试**无法在本环境重跑**。**提交前请在正常环境重跑 `npm test` 与 `analytics/recompute.ps1` 并更新此表。**
>
> ⚠️ **这些测试证明「代码按设计工作」，不能证明「住客愿意用」。** 用户验证见第 1.5 节 E5/E6。

---

## 6. 已知限制 · Known limitations

> 🟡 逐版本更新。**主动列出限制是可信度的一部分，不是减分项。**

| # | 限制 Limitation | 性质 Nature |
| :-: | :--- | :--- |
| L1 | **未与任何真实用户一起测试过** | 最大缺口。Week 4 启动 Study 01 |
| L2 | 场次、容量、「模拟完成」是原型状态机，非真实酒店库存或预约 | 有意为之的范围决定 |
| L3 | 1,200 条样本与 ROI 情景均为合成数据与可调假设，非实测回报 | 已在界面与文档双重标注 |
| L4 | 数字人为分层立绘；Live2D 正式模型与授权未落实；口型贴片已停用 | 已决策：分层立绘 + 静态双轨 |
| L5 | Studio 为规则/模板生成，非在线 LLM 生成 | 后续版本 |
| L6 | 对话历史刷新即丢 | 后续版本 |
| L7 | 无真实 PMS 与支付集成 | 明确排除在范围外 |
| L8 | 知识库内容非传承人定稿，商用需授权复核 | 内容合规边界 |
| L9 | 云端部署、浏览器视觉验收与密钥轮换尚未完成 | 见 [修复与验收记录](14_课程演示修复与验收记录.md) |

---

## 7. 下一步 · Next steps

| 优先级 | 任务 Task | 负责人 Owner | 交付物 Deliverable | 时间 Target |
| :-: | :--- | :--- | :--- | :--- |
| **P0** | 完成 Figma MVP build（Visily 线框 → Figma 精修 → Pixso 可点击原型） | Zeyu Gong（卡 P2） | Figma 链接 + 版本时间 | Week 4 |
| **P0** | 六人各自完成 Visily / Figma / Pixso 操作与个人截图 | 全员（卡 P3–P8） | 每人三工具工作截图 | Week 4 |
| **P0** | 启动 Study 01：3–5 人 pilot 用户测试 | Wenjun Li（卡 P9） | 录屏 + 现场记录表 + 用户原话 | Week 4 |
| **P0** | 云端发布与浏览器验收（含密钥轮换） | Xiang Li（卡 P10）；Zhiyuan Liang 负责密钥（P12） | 验收记录 + 可用公网链接 | Week 4 |
| **P0** | 公网六路由截图并替换本报告与 Checkpoint 1 的占位符 | Licheng Yang（卡 P13） | 截图 + 更新后的报告 | Week 4 |
| **P0** | 课程看板补正：真实任务、负责人与全貌截图 | Xiang Li（卡 P1） | 看板全貌截图 | Week 4 |
| **P1** | 预约并完成首次外部导师会面（Form 3） | Xiang Li（卡 T1） | 会议纪要 + 建议采纳前后对照 | Week 4–9 |
| **P1** | 统一 ROI 数值与报告口径 | Guanqiao Feng（卡 P14） | 一致的口径说明 | Week 4–5 |
| **P1** | 扩充本报告第 4 章（架构图、数据模型、状态机） | Zeyu Gong + Guanqiao Feng | Digital Prototype Report 修订版 | Week 5–6 |
| **P2** | 累计 ≥10 名真实用户测试（≥8 人无协助完成） | Wenjun Li（卡 T4） | User Testing Report | Week 8–9 |
| **P2** | 非遗素材与内容授权人工核验 | Licheng Yang（卡 T7） | 核验记录 | Week 5–6 |
| **P2** | 本报告终稿（含评分人访问指引与最新限制） | Xiang Li | Digital Prototype Report 终稿 | Week 10 前 |

> **分工口径说明：** 负责人取自团队 2026-10-05 的课程看板补录清单（`docs/16_团队看板补录清单_Week4.md`），用于让「下一步」可执行、可追踪。**这些是计划分工，不是已完成的工作**——看板负责人必须与实际贡献者一致，若某项实际不是你做的，请改派而不是认领。

### 仍需验证的假设 · Assumptions still to verify

| # | 假设 Hypothesis | 验证方式 | 若被推翻 If disproved |
| :-: | :--- | :--- | :--- |
| H1 | 住客愿意在大堂用手机完成 8 步流程而不中途放弃 | Study 01 漏斗完成率 + 卡点记录 | 缩短为 4 步，把推荐前置到导览内 |
| H2 | 住客对 90 分钟工坊有真实付费意愿（约 ¥128 级） | 测试固定问题「你愿意为 90 分钟工坊付 ¥128 吗？为什么？」 | 下调时长/价格，或改为轻体验包 |
| H3 | ¥300–¥600/房晚的增值空间成立 | 酒店侧一手数据 + 试点转化 | 下调商业情景，或改为纯成本节省叙事 |
| H4 | 运营端真的会用这份看板做排期决策 | 与酒店运营人员访谈 | 简化为单一决策指标 |
| H5 | 双语 + AI 讲解足以替代人工讲解员的核心价值 | 用户对回答质量的评价 | 引入传承人录制的权威内容包 |

---

## 8. 参考文献 · References

1. Jinjiang Group. (2026). *"Jinjiang Cup" National College Student AI + ICH Innovation Challenge — problem brief* [Course challenge document]. ENT207TC Digital Startup Lab.
2. ENT207TC Module Team. (2026). *ENT207TC Module Handbook 2627* [Module handbook]. Xi'an Jiaotong-Liverpool University.
3. ENT207TC Module Team. (2026). *ENT207TC Group Coursework Brief 2627* [Assessment brief]. Xi'an Jiaotong-Liverpool University.
4. 苏绣工艺公开资料整理（博物馆展陈、工艺介绍与百科条目）. (n.d.). 见项目文档 [`02_非遗内容与来源.md`](02_非遗内容与来源.md)。*注：本知识库为公开资料整理，非传承人口述定稿；正式商用需授权与传承人复核。*

> **引用规范提醒：** 请团队补齐实际查阅过的具体文献条目（含访问日期），并将第 4 条替换为逐条列出的真实来源。

---

## 附录 · Draft 1 要求对照表

| 平台要求 Platform requirement | 本报告位置 | 状态 |
| :--- | :--- | :--- |
| 1. Document the problem: who has it, what it is, why it matters | §1.1（what）、§1.2（who，含代表画像）、§1.3（现有哪些替代做法及为何不够）、§1.4（why it matters）、§1.5（证据与局限） | ✅ 完整 |
| 2. Document your solution concept and how it addresses the problem | §2.0（被否掉的替代方案及原因）、§2.1（概念）、§2.2（逐环回应）、§2.3（用户流程）、§2.4（设计原则） | ✅ 完整 |
| 3. Document your chosen features and why you selected them | §3.1（判据）、§3.2–3.4（三功能含输入/处理/输出/价值/选择理由）、§3.5（三者缺一不可）、§3.6（不计入项）、§3.7（删掉什么及为什么） | ✅ 完整 |
| 4. Living document — 后续在同一份文件上改进 | 版本路线图 + §4/§5/§6 已标 🟡 待扩充 | ✅ 已按此结构组织 |
| What to submit: Draft 1 of the Digital Prototype Report | 本文件 | ✅ |
| What good looks like: 读者从未见过项目也能看懂问题、用户、方案、主要功能与选择理由 | §0 摘要提供四条一句话结论；§1–3 不依赖前文即可读懂 | ✅ |

### 提交前自查

- [ ] 所有 `【PLACEHOLDER: …】` 已替换为真实信息
- [ ] 助教反馈按「团队转述」口径书写，未伪造截图
- [ ] 模拟/合成数据均有标注；无一处把「计划做」写成「已经做」
- [ ] 第 5.4 节测试数字已在正常环境复跑确认
- [ ] 文件名与上传入口已向 TA 确认；由组长上传并确认文件可打开

---

*本报告所有技术断言均可在项目仓库中逐条核对。与旧版方案文件（`docs/00`、`docs/08`）冲突时，以本文与 [`14_课程演示修复与验收记录.md`](14_课程演示修复与验收记录.md) 为准。*

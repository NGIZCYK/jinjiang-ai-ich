---
type: ENT207考核文档
project: 锦江苏绣文化礼宾原型
component: Component 2 — Final Deliverables · Checkpoint 1 Report
version: v2 (中英对照完整稿 · 2026-10-05)
status: 结构完整、内容可提交；仅剩日期、组号、Figma 链接与个人截图待填
deadline: 第 4 周末(End of Week 4，课程负责人 2026-09-23 调整)
language_status: 课程未明确本次报告语言；本稿中文正文 + 英文对照，任一语言可独立抽出提交
real_evidence_status: 无真实用户访谈、无问卷、无原型测试记录；第 1.3、3.3、7 节已按此如实标注
---

# Checkpoint 1 Report — 姑苏非遗数字文化礼宾与住中体验闭环

**Jinjiang AI ICH Concierge & Heritage Stay**

| 项目 Item | 内容 Content |
| :--- | :--- |
| 团队 Team | **THISISIT2018** · Table 20 |
| 组号 Group number | **Group 20** |
| 成员 Members | Xiang Li（李享，组长）· Zhiyuan Liang（梁之源）· Wenjun Li（李文俊）· Zeyu Gong（龚泽宇）· Licheng Yang（杨立诚）· Guanqiao Feng（凤冠桥） |
| 学号 Student IDs | 2472682 · 2363950 · 2470787 · 2472137 · 2468210 · 2471032（顺序同上一行） |
| 课程 Module | ENT207TC Digital Startup Lab |
| 提交组件 Component | Component 2 — Final Deliverables · Checkpoint 1 |
| 提交日期 Date | 【PLACEHOLDER：实际提交日期，需向 TA 确认 Checkpoint 1 的公历日期】 |
| 版本 Version | v2 · 2026-10-05 |
| 建议文件名 Filename | `Group20_Component2_Checkpoint1_<日期>` |

---

## 阅读说明 · How to read this report

> **提交前请删除本节。**
>
> 1. 官方对 Checkpoint 1 的三项硬性要求是 **problem choice and validation evidence / solution concept / digital prototype (chosen features)**。本报告第 1、2–4、5–6 章分别对应，并在第 8 章末尾给出逐项对照表。
> 2. **中文为正文，英文为对照**，每个小节先中文后英文。课程未明确本次报告语言，两组文字均可独立抽出使用；若最终确认为单一语言，删除另一组即可，无需改写。
> 3. 所有 `【PLACEHOLDER: …】` 必须替换为真实日期、链接、姓名或截图。**禁止倒填日期、禁止虚构访谈人数与导师意见、禁止把合成数据写成真实经营数据。**
> 4. 与旧版初稿相比，本稿删除了尚未实现的承诺（A-Frame/3D 全景、Live2D 真实模型、口型同步贴片、防伪雅凭、Studio 在线生成），并补齐了第 7 章「测试与决策」和第 4 章「用户流程」。对照依据见 [最新修复与验收记录](14_课程演示修复与验收记录.md)。
> 5. 文件名规则：`GroupNumber_Component2_Checkpoint1_Date`，由组长上传 LMO，全组确认文件可打开。

---

## 0. 摘要 · Executive summary

| 项 Item | 一句话结论 One-line conclusion |
| :--- | :--- |
| **问题 Problem** | 锦江等高星文旅酒店的大堂非遗展陈是静态的，住客有 15–30 分钟停留却只拍照打卡，酒店无法为每位住客配备讲解员，高溢价非遗体验难以转化。 |
| **用户 Users** | C 端：入住高星文旅酒店的中高端文化度假住客；B 端：酒店市场与运营团队（看板使用者）。 |
| **解法 Solution** | 住中场景的 AI 苏绣文化礼宾：微距观绣激发兴趣 → 婉娘问答解释文脉 → 记录 90 分钟工坊意向 → 运营处理与去重漏斗，把兴趣变成可处理的需求和可复盘的观察数据。 |
| **MVP** | 8 个页面中冻结 4 个住中闭环页面为必须项；3 个核心功能（知识库问答、个性化推荐与意向闭环、商业分析看板）。 |
| **原型 Prototype** | 可运行 Web 原型，含 Supabase 共享后端与 [公网预览](https://idyllic-bubblegum-1f5a5c.netlify.app/)；本地前端 76 项测试通过、Python 4 项分析回归通过。 |
| **当前最大缺口 Biggest gap** | **真人用户测试尚未启动**；Figma MVP build 与课程看板截图仍待补。本章第 1.3、3.3、7 节按此如实标注。 |

---

## 1. 问题与目标用户 · Problem and target users

> 对应 Checkpoint 1 第 1 项「问题」与第 2 项「目标用户」。

### 1.1 问题陈述 · Problem statement

**中文（一句话）：** 入住锦江等高星文旅酒店的中高端文化度假住客，在大堂有 15–30 分钟的空闲停留，但面对传统静态非遗展陈体验扁平——多数住客只拍照打卡、无法理解微观工艺；酒店又难以常驻高成本的一对一专业讲解员，导致高溢价非遗体验转化率偏低，每房晚错失约 ¥300–¥600 的非遗增值消费。

**English (one sentence):** Mid-to-high-end cultural leisure guests staying at luxury heritage hotels such as Jinjiang spend 15–30 idle minutes in the lobby, yet the static heritage displays give them a flat experience — most only take photos without understanding the micro-craftsmanship — while the hotel cannot afford a dedicated one-to-one curator for every guest, so high-margin heritage experiences convert poorly and roughly ¥300–¥600 of heritage-attached spending is lost per room night.

**问题发生的具体场景 · Where it happens：** 办理入住后到晚餐前的空闲时段，住客身处酒店大堂公区，身边就有非遗展陈与主题房，但没有任何一个触点能把「看见」推进到「理解」再到「参与」。

**English:** The gap sits in the idle window between check-in and dinner, in the hotel's own lobby, where heritage displays and themed rooms are physically present but no touchpoint moves a guest from *seeing* to *understanding* to *participating*.

### 1.2 目标用户 · Target users

| 维度 Dimension | C 端住客 Guest | B 端运营 Hotel operations |
| :--- | :--- | :--- |
| 是谁 Who | 入住高星文旅酒店的中高端文化度假住客、对非遗有兴趣的预订用户 | 酒店市场与运营团队、非遗体验项目负责人 |
| 使用情境 Context | 住中空闲时段，用手机在酒店内、客房内使用 | 每批次体验结束后，在后台复盘与排期 |
| 主要需求 Core need | 「我现在这 2 小时能做什么真正有文化含量的体验？值不值？」 | 「哪些客群真的会转化？下一轮该继续试点、调整还是暂缓？」 |
| 当前替代方案 Current alternative | 只看大堂展陈、自行搜索攻略、放弃 | 凭经验与主观判断排期，缺少可归因的观察数据 |

**边界的诚实说明 · Honest scoping note：** 本阶段我们没有锦江真实住客的行为数据。上述用户画像是基于课题文本（`锦江ENT.txt`）、公开文旅行业描述与团队对同类高星酒店场景的观察建立的**待验证假设**，不是已证实的用户事实。验证方式见第 1.3 与第 7 节。

**English:** We hold no real Jinjiang guest behaviour data at this stage. The above persona is a *hypothesis to be tested*, built from the challenge brief, public cultural-tourism descriptions and team observation of comparable luxury-hotel settings — not verified user fact.

### 1.3 证据现状 · Evidence status（这是本报告最需要导师注意的一节）

> **我们不把计划写成结果。** 下表区分「已有真实证据」「间接证据」与「尚未获得的证据」。

| # | 证据 Evidence | 类型 Type | 状态 Status |
| :-: | :--- | :--- | :--- |
| E1 | 团队 20 分钟结构化选题冲刺，3 个候选问题-解法对按 5 维度打分（24 / 16 / 16） | 团队过程记录（真实） | ✅ 已完成，见 [Week 02 方案选择](08_Week02_Problem_Solution_Choice.md) |
| E2 | **2026-09-24 助教反馈**：提案获认可、可继续当前项目，并要求尽快完成本周 Figma MVP build | 口头反馈（团队转述，无原始截图） | ⚠️ 有，但仅口头；不得写成签字批准，见 [反馈留痕](evidence/20260924-TA-feedback.md) |
| E3 | 苏绣非遗知识库 9 张知识卡 + 1 张苏州攻略卡，均标注公开来源与「需传承人复核」边界 | 二手资料整理（真实） | ✅ 已完成，见 [非遗内容与来源](02_非遗内容与来源.md) |
| E4 | 团队对高星酒店大堂场景与非遗体验课的现场观察（照片与行程记录） | 非正式观察（真实，非访谈） | 🟡 有素材，尚未整理成可引用记录 |
| E5 | **真实用户访谈 / 问卷** | 一手用户证据 | ❌ **尚未开展。** 计划于 Week 4 启动 Study 01（3–5 人 pilot，Week 8–9 累计 ≥10 人） |
| E6 | **原型可用性测试记录** | 一手用户证据 | ❌ **尚未开展。** 只有团队内部走查，不构成用户测试 |
| E7 | 酒店侧成本与转化率的一手数据 | 一手经营证据 | ❌ 未获得；报告中 ¥300–¥600 与转化率均为待验证估计 |

**因此，本报告能主张什么 · What we can and cannot claim：**

- **可以主张：** 选题经过结构化比较而非拍脑袋；问题在公开资料与现场观察层面成立；非遗内容有来源可溯且已标注授权边界。
- **不能主张：** 问题严重度已被用户验证；转化率与客单价数字已被实测；原型已被真实用户使用过。
- **Week 4 要补：** E5、E6 两项一手证据，以及 E4 的整理。测试脚本与记录模板已就绪，见 [P0 操作指引](11_P0操作指引.md) 第三节。

**English summary:** E1–E4 are real but secondary or process evidence. **E5–E7 (real user interviews, usability testing, first-party hotel economics) do not exist yet.** We state this explicitly rather than manufacturing validation: the ¥300–¥600 estimate and the conversion figures remain hypotheses until Study 01 runs.

---

## 2. 解决方案概念 · Solution concept

> 对应 Checkpoint 1 第 4 项「解决方案」。

**一句话 · One-liner：** 面向锦江酒店住中场景的 AI 苏绣文化礼宾——数字人「婉娘」把住客对苏绣的一时好奇，转化为一段沉浸式微距观绣体验、一次可处理的 90 分钟工坊意向，以及一份告诉酒店「下一步该做什么」的运营看板。

**English:** An in-stay AI heritage concierge for Jinjiang hotels — the digital host "Wanniang" turns a guest's fleeting curiosity about Su embroidery into an immersive micro-atelier experience, a processable 90-minute workshop request, and an operations dashboard that tells the hotel what to do next.

**它为什么回应了问题 · How it answers the problem：**

| 问题环节 Problem element | 产品的回应 Product response |
| :--- | :--- |
| 静态展陈无法产生理解 | 微距观绣 + 交互展签 + 三步探索任务，把「看见」变成主动操作 |
| 无法为每位住客配讲解员 | 知识库约束的 AI 问答，可并发、可双语、无排队 |
| 兴趣无法转化为消费 | 显式确认的推荐与意向提交，运营在另一侧可处理、可反馈 |
| 酒店不知道规模该多大 | 按批次去重的行为漏斗 + ROI 情景模拟 + 试点/扩大/暂缓决策门 |

**设计原则 · Design principles：**

1. **不假装成功**（No fake success）：服务未配置或模型不可用时，界面明示降级状态，不显示虚假成功。
2. **AI 不替代人**（AI does not replace practitioners）：内容标注来源并保留传承人复核边界；合规与文化尊重是产品约束，不是文案。
3. **数据边界前置**（Boundaries first）：不保存聊天原文，只保存结构化字段；匿名访客标签不进入正式统计。

---

## 3. 用户流程 · User flow

> 对应 Checkpoint 1 第 5 项「用户流程」。

### 3.1 宏观闭环 · Macro loop

```text
激发兴趣            理解文脉            形成意向            运营处理            复盘决策
Immersive scroll → Wanniang AI guide → Save recommendation → Ops handling → Analytics
   /immersive          /guide            /my (intent submit)    /operations     /analytics
```

### 3.2 逐步操作顺序 · Step-by-step sequence

| # | 步骤 Step | 页面 Route | 用户做什么 User action | 系统做什么 System response |
| :-: | :--- | :--- | :--- | :--- |
| 1 | 进入 Enter | `/` `/auth` | 浏览首页场景；需要保存时登录（新账号固定进入 `Demo` 批次） | 服务端决定测试批次，注册者无法自行污染正式测试数据 |
| 2 | 探索 Explore | `/guide` | 提问，例如「我带孩子，下午有 2 小时，预算 150，想体验苏绣」 | 知识库检索 + 意图识别；在线时 DeepSeek 流式回答，不可用时切本地知识回答并明示 |
| 3 | 沉浸 Immerse | `/immersive` | 在观绣 / 识线 / 试针中切换主题、色样、受光与劈丝等级，完成探索卡并保存 | 三步任务进度（默认值不计入进度，主动选择去重累计），跨设备保存 |
| 4 | 推荐 Recommend | `/immersive` → 推荐卡 | 点击「让婉娘推荐体验」，核对需求卡 | 规则筛选 + AI 解释（模型失败时回退规则文案），生成 90 分钟工坊推荐 |
| 5 | 意向 Express intent | `/my` | 选择体验场次并**主动提交**意向 | 容量与防重复校验；提交前需显式确认 |
| 6 | 处理 Handle | `/operations` | 运营筛选当前批次，确认名额或拒绝（拒绝必须填写原因） | 角色权限校验 + 状态机流转 |
| 7 | 确认 Confirm | `/my` | 刷新查看最新状态，提交一次数字流程反馈 | 跨设备同步；一单一评 |
| 8 | 决策 Decide | `/analytics` | 运营选择批次，查看漏斗与导览意向汇总 | 8 级去重漏斗 + 兴趣分布 + 反馈；AI 运营简报仅接收聚合数据 |

### 3.3 本流程的验证程度 · How far this flow has been verified

- ✅ **代码与自动化测试层面**：上述状态流转、批次隔离、容量与防重复、拒绝必填原因、一单一评均有测试覆盖（前端 76 项测试通过）。
- ⚠️ **浏览器端到端层面**：云端部署与浏览器视觉验收**尚未完成**，见 [修复与验收记录](14_课程演示修复与验收记录.md) 的「发布前待验收」清单。
- ❌ **真实用户层面**：**没有任何真实住客走过这条流程。** 演示场次、容量与「模拟流程已完成」全部是原型假设，不代表真实酒店库存、预约、到场或收入。

---

## 4. 核心功能 · Core features

> 对应 Checkpoint 1 第 7 项「核心功能」。

我们按课程判据（用户输入 → 系统处理 → 用户价值）筛选核心功能，**登录、首页、纯视觉美化均不计入**——它们不构成「产品为用户解决了什么问题」的证据。

### 4.1 功能一：婉娘知识库问答 · Feature 1 — Wanniang knowledge-grounded Q&A

| 环节 | 内容 |
| :--- | :--- |
| **输入 Input** | 住客的自然语言提问（中文或英文），可含同行人、可用时长、预算、兴趣 |
| **处理 Process** | 服务端检索苏绣知识库并按问题识别意图 → 交给 DeepSeek 流式生成（SSE）→ 返回实际选用的资料来源；密钥仅存在于服务端，前端不可读 |
| **输出 Output** | 可中断的流式回答 + 来源披露 + 结构化意图字段（体验类型、同行、时长、预算、情感信号） |
| **用户价值 Value** | 住客不用排队等讲解员就能理解工艺文脉；酒店侧获得可归因的兴趣信号 |
| **降级 Fallback** | 模型不可用/超时 → 本地知识回答并如实标注；两者都不可用 → 明示「共享服务未配置」 |
| **课程判据 Appendix A** | Chatbot trained on specific user needs or data; secure and useful use of LLM APIs |

**我们诚实标注的两件事：** ①「返回所用资料」不等于「每句生成内容已通过人工核验」；② 知识库共 10 张卡（9 张苏绣/非遗 + 1 张苏州攻略），来自公开百科、博物馆与工艺介绍，**非传承人口述定稿**，正式商用需授权与复核。

### 4.2 功能二：个性化推荐与体验意向闭环 · Feature 2 — Personalised recommendation and intent loop

| 环节 | 内容 |
| :--- | :--- |
| **输入 Input** | 时间 / 预算 / 同行构成 / 兴趣四类结构化输入，可由问答自动带入或手工调整 |
| **处理 Process** | 服务端校验参数 → 规则筛选匹配 90 分钟工坊 → AI 生成推荐解释（失败回退规则文案）→ 用户显式确认后提交意向 → 运营侧确认/拒绝（拒绝必填原因）→ 住客反馈 |
| **输出 Output** | 推荐卡 + 意向记录 + 状态变更（提交 / 已确认 / 已拒绝 / 模拟完成）+ 一条反馈 |
| **用户价值 Value** | 把「有点兴趣」变成一个有状态、有责任人、可追踪的具体请求；酒店侧获得可处理的需求队列 |
| **完整性约束** | 容量防超卖、幂等提交、一单一评、批次隔离（`Demo` 与 `Study 01` 不互串） |
| **课程判据 Appendix A** | Input analysis with personalized recommendations; dynamic task tracker with progress logic |

**诚实边界：** 场次、容量、确认与「模拟完成」**全部是原型状态机，不是真实酒店库存或真实预约**。本阶段明确不做真实 PMS 对接与在线支付——这是有意的范围决定，不是遗漏。

### 4.3 功能三：商业分析看板与决策门 · Feature 3 — Commercial analytics with decision gates

| 环节 | 内容 |
| :--- | :--- |
| **输入 Input** | ① 按批次去重的真实用户行为事件（注册→探索→完成→保存→提交→确认→完成→反馈）；② Python 分析层产出的 1,200 条匿名合成住客样本与可调经营假设 |
| **处理 Process** | pandas 特征整理 → scikit-learn `KMeans(k=3)` 标准化后客群分层（文化体验型 / 亲子休闲型 / 商务快捷型）→ 收入与 ROI 情景计算（`shared/roi-assumptions.json` 为前后端唯一口径）→ 触发试点/扩大/暂缓决策门 |
| **输出 Output** | 8 级去重漏斗、探索兴趣分布、数字流程反馈、客群筛选、可调情景 ROI、AI 运营简报与书面门槛 |
| **用户价值 Value** | 酒店不再凭感觉排期：能区分「观测到的行为」「合成经营假设」与「真实经营结论」三类信息，并据此决定下一轮继续试点、调整还是暂缓 |
| **课程判据 Appendix A** | Analytics dashboard that visualizes trends; AI-generated suggestions from aggregated data; user-facing database features (filter, sort, search) |

**合成情景的已确认数值（仅作方法演示）：** 默认主题房情景下，月新增收入 ¥125,520、月经营成本 ¥32,320、月贡献 ¥93,200、启动投入 ¥300,000，12 个月净 ROI 272.8%、回收期约 3.22 个月。**这是可调的经营假设，不是实测回报**；不含税、折现与折旧。

**我们主动加的一层克制：** 系统默认只输出「试点」或「暂缓」；即使模型给出「扩大」，也会被降级为「试点」并注明扩大仍须以真实试验与人工复核为依据。**Demo 批次与账号数量不能作为扩大依据。**

### 4.4 可辩护但未列为核心的实现 · Defensible but not claimed as core

| 实现 | 为什么不计入核心功能 |
| :--- | :--- |
| 注册登录、角色权限 | 基础设施。登录本身不能证明产品解决了问题 |
| 首页品牌场景 | 展示为主，没有用户输入与结果逻辑 |
| Studio 内容工作台（行程/文案） | 当前为**规则/模板生成**，界面已如实标注；接入在线 LLM 属于后续版本 |
| 数字人婉娘形象 | 呈现层。当前为分层立绘（眨眼 + 下颚律动 + 语义表演），**口型贴片已因素材异源被证伪并停用** |

---

## 5. MVP 与范围 · MVP and scope

> 对应 Checkpoint 1 第 6 项「MVP」。

**MVP 定义：** 能够向目标用户展示有意义价值的最小产品版本。

### 5.1 三档功能清单 · MUST / SHOULD / LATER

| 档位 | 功能 | 判定理由 |
| :--- | :--- | :--- |
| **MUST HAVE** | ① 知识库约束的婉娘问答（含来源披露与降级） | 没有它，住客的「为什么」无法被回答，静态展陈的问题原样存在 |
| **MUST HAVE** | ② 八步住中闭环：探索 → 推荐 → 意向 → 运营处理 → 反馈 | 这是「把兴趣变成可处理需求」的唯一证据链，缺一环则无法证明转化路径 |
| **MUST HAVE** | ③ 按批次去重的行为漏斗 + 收入/ROI 情景与决策门 | 这是面向酒店侧的价值主张，也是课程硬性要求的商业分析层 |
| **MUST HAVE** | ④ 最小信任与安全基线：服务端密钥、来源披露、角色权限、诚实降级 | 非遗与 AI 结合的伦理前提；也是评审会追问的必答项 |
| **SHOULD HAVE** | Studio 行程/文案生成接入在线 LLM | 有 Edge Function 基建，成本低，但非住宿闭环必需 |
| **SHOULD HAVE** | 对话历史持久化（当前刷新即丢） | 影响体验连续性，不影响闭环成立 |
| **SHOULD HAVE** | 内容工作台与数字人语音的更深整合 | 锦上添花 |
| **LATER** | 真实 PMS / 支付 / 客房挂账对接 | 高合规成本，课程周期内不可行 |
| **LATER** | Live2D 正式模型与授权资产 | 需要合法 Cubism 模型与已注册运行时；当前保留分层立绘与静态降级双轨 |
| **LATER** | 3D / 全景沉浸场景 | **已于 2026-09-26 决定不做。** 团队实测 8K 等距柱状全景在约 90° 视口下有效像素仅约 2048px 宽，观感模糊，已连代码与素材一并移除 |
| **LATER** | 多物业、多语言深度本地化、真实营收核算 | 规模化阶段议题 |

### 5.2 范围边界 · Scope boundary

**做 Doing：** 8 条路由（`/auth`、`/`、`/guide`、`/immersive`、`/studio`、`/my`、`/operations`、`/analytics`）、中英双语、住客/运营角色分离、结构化行为事件、Python 分析层、演示数据与降级路径。

**不做 Not doing（并说明理由）：** 真实 PMS、在线支付、Unity 3D、多物业权限、真实营收核算——这些要么合规成本过高，要么与「4–5 周内交付可演示闭环」的课程约束冲突。

**从早期方案中删掉的内容 · Removed from the earlier plan：** 3D/A-Frame 全景沉浸、Live2D 真实模型、口型同步贴片、防伪入席雅凭、茶艺交叉推荐规则、Studio 在线生成。详见第 7 章。

---

## 6. 数字原型 · Digital prototype

> 对应 Checkpoint 1 第 8 项「原型」。

### 6.1 今天实际能运行的部分 · What is running today

| 层 Layer | 实现 Implementation |
| :--- | :--- |
| 前端 Frontend | Vite + React + TypeScript + Tailwind；8 条路由全部懒加载；中英双语；住客/运营角色分离（角色不可自行指定） |
| 后端 Backend | Supabase Auth + Postgres + Edge Functions；3 个迁移；RLS 全表隔离；批次（`Demo` / `Study 01`）服务端分配 |
| AI 层 AI | DeepSeek 经服务端 Edge Function 调用（SSE 流式）；前端仅持有 publishable key；60 次/小时/人配额 + Origin 白名单 + JWT 自校验 |
| 分析层 Analytics | `analytics/analyze.py`：pandas + `KMeans(k=3)`，输出 1,200 条匿名合成样本快照，同步至前端看板 |
| 数字人 Avatar | 分层立绘（puppet）：眨眼 + 下颚律动 + 语义表演；含静态图与减少动态效果降级 |
| 质量验证 Quality | 前端 **76 项测试 / 10 个测试文件通过**；Python **4 项分析回归测试通过**；普通构建与独立演示构建均通过（见下方核算口径） |

> **测试数字的核算口径 · How these numbers were verified：** 上述结果引自 [修复与验收记录](14_课程演示修复与验收记录.md)（2026-10-04，同机实测）。2026-10-05 复核时，`web/tests/` 下 **10 个测试文件确实存在**；但本机 `analytics/.cache/python-deps` 依赖包的 Windows 文件权限异常（pip 写入时未包含本机账户），导致 Python 测试**无法在本环境重跑**。前端测试重跑亦受环境限制未完成。**提交前请在正常环境重跑 `npm test` 与 `analytics/recompute.ps1` 并更新此表，不要在未复跑的情况下沿用数字。**

### 6.2 评分人如何访问 · Access for assessors

| 方式 | 地址 / 步骤 | 状态 |
| :--- | :--- | :--- |
| 公网预览 Public preview | <https://idyllic-bubblegum-1f5a5c.netlify.app/> | 🟡 站点存在；**本地网络当前无法完成 HTTP 复检**，最新可用性须在提交前重新确认 |
| 本地一键启动 Local | 项目根目录双击 `启动网站.cmd`（端口 5181）或 `web/start-dev.ps1`（端口 5180）→ <http://127.0.0.1:5181/> | ✅ 可用，读取被 Git 忽略的 `web/.env.demo.local` |
| 演示账号 Demo accounts | 公示页面仅提供「住客演示」卡（点击只填表单、不自动登录）；运营账号由团队负责人通过独立渠道发放，**不写入仓库或本报告** | ✅ 策略已实现 |
| 演示动线 Demo route | 八步动线见 [演示脚本与账号](03_演示脚本与账号.md) 第二节 | ✅ 已定稿 |

**Figma / Visily / Pixso 数字界面与可点击原型：**

| 工具 Tool | 内容 Content | 状态 |
| :--- | :--- | :--- |
| Visily | 手绘草图转数字线框图 | 【PLACEHOLDER：文件链接 + 每位成员的工作截图】 |
| Figma | MVP build（助教 9-24 明确要求的本周交付项） | 【PLACEHOLDER：Figma 文件链接 + 版本时间 + 各成员编辑截图】 |
| Pixso | 页面跳转与交互连接，生成可点击原型 | 【PLACEHOLDER：原型链接 + 交互连接截图】 |

> **红线提醒：** 公网网页截图**不能**代替 Figma 交付。若 Figma MVP build 尚未完成，请如实写「进行中」并给出计划日期，不要用网页界面冒充。每位成员都需要自己的账号与三工具工作截图——「一个队友完成了设计」不构成其他成员的贡献证明。

### 6.3 已知限制 · Known limitations

| # | 限制 Limitation | 性质 |
| :-: | :--- | :--- |
| L1 | **未与任何真实用户一起测试过** | 最大缺口。计划 Week 4 启动 Study 01 |
| L2 | 场次、容量、「模拟完成」是原型状态机，非真实酒店库存或预约 | 有意为之的范围决定 |
| L3 | 1,200 条样本与 ROI 情景均为合成数据与可调假设，非实测回报 | 已在界面与文档双重标注 |
| L4 | 数字人为分层立绘；Live2D 正式模型与授权未落实；口型贴片已停用 | 已决策：维持分层立绘 + 静态双轨 |
| L5 | Studio 为规则/模板生成，非在线 LLM 生成 | 后续版本 |
| L6 | 对话历史刷新即丢 | 后续版本 |
| L7 | 无真实 PMS 与支付集成 | 明确排除在范围外 |
| L8 | 知识库内容非传承人定稿，商用需授权复核 | 内容合规边界 |
| L9 | 云端部署、浏览器视觉验收与密钥轮换尚未完成 | 见 [修复与验收记录](14_课程演示修复与验收记录.md) |

---

## 7. 测试、发现与决策 · Testing, findings and decisions

> 对应 Checkpoint 1 第 9 项「决策」，同时回应第 3 项「证据」的缺口。

### 7.1 我们做了哪些验证 · What verification we actually ran

| 验证类型 | 内容 | 结论 |
| :--- | :--- | :--- |
| 结构化选题比较 | 3 个候选问题-解法对，5 维度打分（触达/严重度/证据/可行性/团队意愿） | 选项 1 得 24/25，全组一致选定 |
| 团队内部走查 | 按八步动线逐页走查，验证状态流转与降级路径 | 发现 2 个真实缺陷（见下） |
| 自动化测试 | 前端 76 项（含 RLS 隔离、批次归属、容量防超卖、幂等、AI 配额、SSE、ROI 一致性、语音订阅）；Python 4 项分析回归 | 通过 |
| 技术证伪实验 | 口型贴片以 6 组参数复测 | **证伪**：异源素材无法合成，已停用并改为下颚律动 |

> ⚠️ **以上都不是用户测试。** 自动化测试证明的是「代码按设计工作」，不能证明「住客愿意用」。

### 7.2 关键决策记录（改了什么、删了什么、为什么）· Key decisions log

| # | 决策 Decision | 触发 Trigger | 依据 Rationale | 影响 Impact |
| :-: | :--- | :--- | :--- | :--- |
| D1 | 3D/A-Frame 全景**彻底移除** | 团队实测观感模糊、「AI 味重」 | 8K 等距柱状全景摊到约 90° 视口后有效像素仅约 2048px 宽，与一张 2K 平面图等强——模糊是该投影的固有上限，不是调参问题 | 删除 1.33MB 库、类型桩与 14 个全景素材（约 27MB）；对外统一称「苏绣艺境」，不再提 3D |
| D2 | 口型同步贴片**停用**，改为下颚律动 | 6 组参数复测证伪：立绘与口型素材异源，无法合成 | 素材来源不一致是根因，继续投入不会收敛 | 对外口径统一为「眨眼 + 下颚律动 + 语义表演」；证据归档于 `docs/evidence/mouth-sprite-falsification/` |
| D3 | Live2D 正式模型**暂不接入**，维持分层立绘 + 静态双轨 | 缺少合法 Cubism 模型与已注册运行时 | 授权与资产不可验证，硬接会带来合规风险 | 保留 Live2D 分支代码，配置到位即可接管；未配置时降级为零闪屏静态图 |
| D4 | 数字人**不做情感自适应叙事**的过度宣称 | 复核发现情感链路虽端到端连通，但不足以支撑「情感感知叙事」表述 | 链路连通 ≠ 能力成立 | 收敛为「结构化情感信号进入聚合看板」，避免过度承诺 |
| D5 | 4 屏闭环**扩展为 8 条路由**（结构上仍是 4 个住中核心环节） | 助教 9-24 反馈要求完成 Figma MVP build；演示需要运营侧与内容侧可独立展示 | 课程 GroupCW 要求 ≥5 屏 + 逻辑化导航；8 屏同时满足演示与判据 | 住中闭环四环节不变，运营/内容页作为支撑面 |
| D6 | ROI 模型**统一为单一真源** | 复核发现 Python 与 TS 两处实现不一致，Python 侧存在硬编码 | 同一模型两处实现会产生矛盾结论，评审一问即穿 | 抽出 `shared/roi-assumptions.json` 作为唯一口径；Python 不再硬编码回收期 |
| D7 | 分析结论**主动降级**：默认只输出试点/暂缓 | 合成情景容易被误读为真实经营结论 | Demo 批次与账号数量不能作为扩大依据 | 即使模型建议「扩大」也降为「试点」，并书面写明扩大门槛与暂停条件 |
| D8 | 防伪入席雅凭、茶艺交叉推荐、Studio 在线生成**从对外承诺中撤下** | 复核发现文档承诺超出实现 | 承诺未兑现项是评审风险 | 三项改列为后续版本；雅凭相关的印刷/凭证渲染不再作为已实现功能出现 |

### 7.3 反馈如何改变了产品 · How feedback changed the product

| 反馈来源 | 反馈内容 | 我们的采纳 | 状态 |
| :--- | :--- | :--- | :--- |
| 助教 2026-09-24 | 提案获认可可继续；尽快完成 Figma MVP build | 确认选题不变；将 Figma MVP build 列为本期独立交付项并优先处理 | 🟡 选题已确认；Figma 交付进行中 |
| 团队内部走查 | 登录表单校验缺陷 | 修复校验逻辑 | ✅ |
| 团队内部走查 | 数字人朗读打断边界情况 | 修复打断并保留静态降级 | ✅ |
| 团队内部技术复核 | 文档承诺超出实现（D1–D8） | 逐条删除或降级对外表述，并同步内容与界面文案 | ✅ |
| **外部导师 / 真实用户** | **尚未进行** | — | ❌ Week 4–9 计划 |

> **纪律说明：** 本表只记录真实发生过的反馈。**没有虚构的访谈对象、没有编造的导师意见、没有伪造的截图。** 缺口以「尚未进行」明示，而不是用模糊措辞掩盖。

---

## 8. 下一步 · Next steps

> 对应 Checkpoint 1 第 10 项「下一步」。

### 8.1 优先任务与分工 · Priorities and ownership

| 优先级 | 任务 Task | 负责人 Owner | 交付物 Deliverable | 时间 Target |
| :-: | :--- | :--- | :--- | :--- |
| **P0** | 完成 Figma MVP build（含 Visily/Pixso 全流程） | 【PLACEHOLDER：姓名】 | Figma 文件链接 + 版本时间 + 全员编辑截图 | Week 4 |
| **P0** | 启动 Study 01：3–5 人 pilot，使用既定脚本与记录表 | 【PLACEHOLDER：姓名】 | 录屏 + 现场记录表 + 原话引用 | Week 4 |
| **P0** | 更新课程看板：真实任务、负责人、状态并截全貌图 | 【PLACEHOLDER：姓名】 | 看板截图 | Week 4 |
| **P0** | 云端发布与浏览器验收（含密钥轮换） | 【PLACEHOLDER：姓名】 | 验收记录 + 公网可用链接 | Week 4 |
| **P1** | 预约并完成第一次外部导师会面（Form 3） | 【PLACEHOLDER：姓名】 | 会议纪要 + 建议采纳前后对照 | Week 4–9 |
| **P1** | Studio 接入在线 LLM 生成 | 【PLACEHOLDER：姓名】 | 功能 + 测试 | Week 4–5 |
| **P1** | 对话历史持久化 | 【PLACEHOLDER：姓名】 | 功能 + 测试 | Week 5 |
| **P2** | 累计 ≥10 名真实用户测试（≥8 人无协助完成） | 【PLACEHOLDER：姓名】 | User Testing Report | Week 8–9 |
| **P2** | Checkpoint 2：可运行应用 + 3 功能现场演示 | 全组 | Checkpoint 2 Report | Week 7 |

### 8.2 仍待验证的假设 · Assumptions still to verify

| # | 假设 Hypothesis | 验证方式 | 若被推翻怎么办 |
| :-: | :--- | :--- | :--- |
| H1 | 住客愿意在大堂用手机完成 8 步流程而不中途放弃 | Study 01 漏斗完成率 + 卡点记录 | 缩短为 4 步、把推荐前置到导览内 |
| H2 | 住客对 90 分钟工坊有真实付费意愿（约 ¥128 级） | 测试固定问题「你愿意为 90 分钟工坊付 ¥128 吗？为什么？」 | 下调时长/价格，或改为轻体验包 |
| H3 | ¥300–¥600/房晚的增值空间成立 | 酒店侧一手数据 + 试点转化 | 下调商业情景或改为纯成本节省叙事 |
| H4 | 运营端真的会用这份看板做排期决策 | 与酒店运营人员访谈 | 简化为单一决策指标 |
| H5 | 双语 + AI 讲解足以替代人工讲解员的核心价值 | 用户对回答质量的评价 | 引入传承人录制的权威内容包 |

---

## 9. 参考文献 · References

1. Jinjiang Group. (2026). *"Jinjiang Cup" National College Student AI + ICH Innovation Challenge — problem brief* [Course challenge document]. ENT207TC Digital Startup Lab.
2. ENT207TC Module Team. (2026). *ENT207TC Module Handbook 2627* [Module handbook]. Xi'an Jiaotong-Liverpool University.
3. ENT207TC Module Team. (2026). *ENT207TC Group Coursework Brief 2627* [Assessment brief]. Xi'an Jiaotong-Liverpool University.
4. 苏绣工艺公开资料整理（博物馆展陈、工艺介绍与百科条目）. (n.d.). 见项目文档 [`02_非遗内容与来源.md`](02_非遗内容与来源.md)。*注：本知识库为公开资料整理，非传承人口述定稿；正式商用需授权与传承人复核。*

> **引用规范提醒：** GroupCW 要求外部资料使用 APA 文内引用并附参考文献。请团队补齐实际查阅过的具体文献条目（含访问日期），并将上表第 4 条替换为逐条列出的真实来源。

---

## 附录 A · Checkpoint 1 十项内容对照表 · Ten-item coverage map

| # | 官方要求 Official item | 本报告位置 Location | 覆盖状态 Coverage |
| :-: | :--- | :--- | :--- |
| 1 | 问题 What problem are you solving? | 0 摘要、1.1 | ✅ 完整 |
| 2 | 目标用户 Who experiences it? | 1.2 | ✅ 完整（并标注为待验证假设） |
| 3 | 证据 What proves it is real and worth solving? | 1.3、7.1、7.3 | ⚠️ 二手与过程证据完整；**一手用户证据缺失** |
| 4 | 解决方案 What are you proposing? | 2 | ✅ 完整 |
| 5 | 用户流程 How will users use it? | 3.1–3.2 | ✅ 完整（3.3 标注验证程度） |
| 6 | MVP What is the minimum version? | 5.1–5.2 | ✅ 完整 |
| 7 | 核心功能 What does it actually do for users? | 4.1–4.4（含输入/处理/输出/价值） | ✅ 完整 |
| 8 | 原型 Can we see and click it? | 6.1–6.3 | 🟡 可运行原型完整；**Figma 链接与成员截图待补** |
| 9 | 决策 What changed, and why? | 7.2（D1–D8）、7.3 | ✅ 完整 |
| 10 | 下一步 What will you build next? | 8.1–8.2 | ✅ 完整 |

**演示要求：** 现场须走完**一条有意义的完整用户流程**，只展示独立页面无法说明用户如何得到结果。建议按 [演示脚本与账号](03_演示脚本与账号.md) 第二节的八步动线演示。

---

## 附录 B · 附件清单 · Evidence checklist to attach

**必须附上 · Required**

- [ ] 选题打分矩阵现场照片或白板照（E1）
- [ ] 2026-09-24 助教反馈的原始消息/课堂记录（E2）——**若只有口头反馈，如实标注，不要制作截图**
- [ ] Figma / Visily / Pixso 文件链接 + **每位成员**的工作截图
- [ ] 与 Figma 版本时间一致的公网页面截图（首页 `/`、`/guide`、`/immersive`、`/my`、`/operations`、`/analytics`）
- [ ] 课程看板（Kanban）全貌截图：能看到任务标题、负责人与状态
- [ ] 用户流程图（宏观闭环 + 八步顺序）

**有则附上，无则留空并说明 · If available**

- [ ] 真实用户访谈/测试记录与录屏（E5、E6）——**当前缺失，Week 4 补**
- [ ] 外部导师会议纪要（Form 3）
- [ ] 口型贴片证伪实验记录 `docs/evidence/mouth-sprite-falsification/`
- [ ] 分析层快照与方法说明 `analytics/output/analytics_snapshot.json`

**截图纪律 · Screenshot discipline**

1. 保留浏览器地址栏或 Figma 文件名，能看出截图来源。
2. 文件名或备注写明日期、路由、演示账号角色、它证明的那个操作。
3. 不展示密码、真实用户资料；**模拟场次一律标注 `simulated session`**。
4. 任何合成数据、模拟完成、经营情景都必须在图注中标注为演示数据。

---

## 附录 C · 待确认事项 · Open questions for the TA

1. 报告是否有字数或页数要求，附录与参考文献是否计入？
2. 每组演示多少分钟，是否包含问答？
3. 报告与演示使用什么语言？
4. 具体日期、时段与演示方式；是否只向 assigned Mentor 汇报？
5. 是否需要提交 PPT 或录屏？
6. Checkpoint 1 Report 与 Draft 1 是否分别上传，对应入口与截止时间？

---

*本报告所有技术断言均可在项目仓库中逐条核对；旧版方案文件（`docs/00`、`docs/08`、`docs/10` v1）保留历史记录，与本文冲突时**以本文与 [`14_课程演示修复与验收记录.md`](14_课程演示修复与验收记录.md) 为准**。*

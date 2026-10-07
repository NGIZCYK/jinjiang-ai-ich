# ENT207TC Digital Startup Lab — Week 3 Weekly Log 提交稿

> **项目**：Jinjiang AI ICH Concierge & Heritage Stay（锦江国际·姑苏非遗数字文化礼宾）  
> **团队**：THIS IS IT · Table 20  
> **整理日期**：2026-09-26  
> **状态**：团队记录草稿；用户已补充 2026-09-24 助教反馈（提案获准继续、需尽快完成 Figma MVP build）。反馈原始凭证、Figma 交付状态和看板状态仍待核实；下方另有供本人核对的个人反思草稿。  
> **时间口径**：以下把 2026-09-19 至 09-24 的有日期记录与用户补充的反馈作为本期进展。更早完成的页面仅作为本周集成和验证的基础；以课程平台实际 Week 3 周界为准，若某项不在本周，请移到相应周次。  
> **当前公网预览**：[婉娘 · 锦江苏绣非遗体验](https://idyllic-bubblegum-1f5a5c.netlify.app/)（本次只读 HTTP 核对：首页及关键路由返回 200；尚未完成浏览器视觉与登录流程验收）。

## 一、可直接填入表单的团队内容（英文）

### Team name / Session and group name/table / Members

团队名称填 `THIS IS IT`，场次填 `THIS IS IT · Table 20`。成员栏以系统已载入的姓名和学号为准；当前截图显示的是邮箱，不能把邮箱擅自当成学号。

### Kanban board status · 看板状态

截至所附 Week 3 表单截图，看板摘要为 **1 Done、0 In Progress、0 To Do**。这与工程日志中的工作量不一致。先把真实任务、负责人和实际状态录入课程看板，再截一张全貌图；将下方方括号替换为该截图的真实数字。若提交时仍只有一张卡，使用其后的备用版本，不要填写 Week 2 文件中未经核实的“18 张卡”。

```text
Our Week 3 board currently shows [X] Done, [Y] In Progress and [Z] To Do cards. We updated the owner and status of the prototype integration, guest/operations flow verification, Wanniang avatar iteration, and Checkpoint 1 evidence tasks. The attached board screenshot shows the actual status at submission time.
```

**仅当看板仍为截图所示状态时，改用这一段：**

```text
The board currently shows one completed card and no cards in progress or to do. Our dated engineering logs document additional prototype and verification work, but these tasks have not yet been reflected as owner-assigned cards on the course board. We are correcting that record and will use the board for subsequent weekly tracking.
```

### 1. Summary of work completed this week

```text
This week we integrated and checked a high-fidelity prototype that had already been developed ahead of the course schedule. The new work was validation and refinement, rather than a claim that every screen was first built this week.

On 19 September, we connected the guest journey to a shared Supabase demonstration backend and tested the flow from exploration card and recommendation to experience request and operations handling. The browser checks also exposed a login form validation issue, which we fixed. We then added cohort separation and aggregated guide-intent logic in the local code so rehearsal activity can be kept apart from a future user study; the latest cohort migration and function still required cloud deployment and regression checks at the last documented audit.

On 22 September, we replaced Wanniang's static presentation with a locally hosted 2D puppet prototype. It responds to speech mouth cues, blinking, mood, gesture and pace, with a static-image fallback when assets are unavailable or reduced motion is preferred. The dated engineering log records 45 passing automated checks, a successful build and browser sampling of speech interruption. On 23 September, we added guest and operations demo role cards that fill the login form without submitting it, and added a dedicated build configuration for a separate synthetic-data demo environment. The prototype is now available at https://idyllic-bubblegum-1f5a5c.netlify.app/; the deployment date and full browser acceptance still need evidence. Real-user testing remains pending.
```

### 2. Challenges encountered

```text
Our main challenge was keeping the prototype's apparent completeness aligned with what had actually been verified. The shared backend flow worked in the documented browser checks, but the later cohort-isolation code was ahead of the cloud version at the last audit. We recorded that gap and kept formal study activity separate from rehearsal data until deployment and regression checks are complete.

We also found that a static portrait did not communicate Wanniang's speech and state changes. A fully modelled Live2D asset would require layered artwork and licensing that we could not yet verify, so we built a lightweight 2D puppet and retained a static fallback. Early facial-part processing distorted the image; we narrowed the edits to individual features and retested speech interruption. The TA's reminder also exposed a deliverable gap: having a coded prototype does not itself complete the required Figma MVP build. Finally, the course board screenshot still lists only one task, so task ownership and status need to be recorded there before submission.
```

### 3. Help requested and evidence

**用户补充的真实反馈**：**9 月 24 日**，助教转达提案已获认可，可以继续做当前项目，并提醒尽快完成本周任务 **Figma MVP build**。尚未提供助教姓名或原始消息截图，因此不填写这些细节，也不把口头反馈写成有附件的正式签字批准。

```text
On 24 September, our TA told us that the proposal had been approved and that we could continue developing this project. The TA also reminded us to complete this week's Figma MVP build as soon as possible. This is our team's account of the feedback; we have not yet added the original message or a meeting note as evidence. We have not recorded an external-mentor consultation this week. Our public prototype and dated engineering logs show development progress, but internal test accounts and synthetic sessions are not real-user validation.
```

### 4. Support outcome

```text
The feedback confirmed that we should continue with the current project proposal, so no change of topic was needed. We will prioritize the Figma MVP build as a separate Week 3 deliverable and add its link or screenshots to the board once it is finished; its completion has not yet been verified for this log. In parallel, we fixed the documented login validation issue and the avatar's speech-interruption edge case, while retaining a static-image fallback. The cohort-isolation deployment and Checkpoint 1 validation evidence remain open tasks.
```

## 二、Individual weekly reflection · 你的个人反思草稿

以下只为你本人准备；提交前请确认“我”的感受和行动符合你的真实经历，再在自己的账号中保存。其他成员的反思由他们自行处理。

```text
One challenge I faced this week was that our working website made the project feel more complete than our weekly design submission actually was. At the 24 September check-in, the TA confirmed that our proposal could continue and reminded us to finish the Figma MVP build promptly. I realised that a deployed prototype does not replace the required Figma deliverable, so I am treating that build and its evidence as my immediate priority. Next week I will check that the Figma flow, the live prototype screenshots and the course board accurately show what we have completed and what still needs testing.
```

## 三、Images (up to 8) · 本周可用证据

优先使用**当下从公网实际页面与 Figma 文件截取的图**。截图保留浏览器地址栏或 Figma 文件名，并在文件名/备注写明日期、路由、演示账号角色和它证明的操作。不要展示密码、真实用户资料或把模拟场次写成真实预约。现有 `ENT207` 目录中的 09-13 页面截图只能标为早期原型基线。

| 序号 | 建议截图（最多 8 张，按优先级） | 图注与证明点 |
| :---: | :--- | :--- |
| 1 | **课程看板全貌**：To Do / In Progress / Done、卡片标题及负责人同屏 | `Week 3 task ownership and actual board status`。先更新真实任务，再截图；目前表单只显示 1 Done。 |
| 2 | **9 月 24 日助教反馈**：原始消息或带日期的课堂记录 | `24 Sep TA feedback: proposal approved; Figma MVP build requested`。如果只有口头反馈、没有记录，就**不要制作假截图**；将此名额留给下方候补图。 |
| 3 | **Figma MVP 总览**：主要画板和页面跳转关系同屏，文件名可见 | `Figma MVP flow for the guest journey`。只有 Figma 文件确实已完成才上传；公网网页截图不能代替它。 |
| 4 | **公网首页 `/`**：品牌入口、导航与地址栏同屏 | `Publicly accessible high-fidelity prototype`。URL 为 `https://idyllic-bubblegum-1f5a5c.netlify.app/`；如展示时间与发布记录不一致，只写“当前可访问”。 |
| 5 | **婉娘导览 `/guide`**：形象、你输入的苏绣/体验问题及实际返回结果同屏 | `Interactive concierge and Wanniang avatar`。若 AI 未返回，改截真实的本地知识回复并如实标注。 |
| 6 | **沉浸艺境 `/immersive`**：苏绣互动区或三步探索卡的已完成进度 | `Heritage exploration with a user action`。优先展示操作后的状态，不只拍静态首屏。 |
| 7 | **我的行程 `/my`**：已保存推荐、演示场次意向或状态记录 | `Guest journey from recommendation to an experience request`。需用合成演示账号，图注标明 `simulated session`。 |
| 8 | **运营 `/operations` 或分析 `/analytics`**：选有实际可见结果的一页 | `Operations handling` 或 `Cohort analytics`。前者展示待处理/已确认状态，后者展示批次漏斗；不要把合成经营情景写成真实营收。 |

**候补**：若第 2 张没有原始凭证，改拍 `/auth` 的住客/运营演示角色卡，或把第 8 张未选的运营/分析页补上。若 Figma 文件尚未完成，第 3 张暂时空着或用候补图，不把网页界面冒充 Figma 交付。

**工程证据位置**：`docs/CHANGELOG.md` 的 09-19 与 09-22 条目；`docs/05_每周日志/02_成员工作日志/2026-09-22_婉娘Puppet数字人.md`；`web/src/components/avatar/PuppetAvatar.tsx`；`web/src/pages/AuthPage.tsx`；`web/tests/`；`supabase/migrations/202609190003_guide_signals_and_cohorts.sql`。上述文件证明本地实现与记录，不自动证明公网已发布或真实用户已测试。

## 四、提交前需要团队核实

- [ ] 课程系统实际 Week 3 周界覆盖上述日期；若不覆盖，移动对应事项。
- [ ] 用最新看板截图替换 `[X]/[Y]/[Z]`，并核对负责人；若未更新，使用“1 Done”备用段落。
- [x] 已按用户补充记录本周助教反馈：提案获准继续，需尽快完成 Figma MVP build。
- [x] 反馈日期已由用户确认为 9 月 24 日。
- [ ] 如能找到原始消息/课堂记录，再补助教姓名和截图；没有凭证时维持“团队转述”口径。
- [ ] 实际完成 Figma MVP build 后，补上链接、截图、版本时间和看板任务状态；未完成前不得写成已完成。
- [ ] 你本人核对上方个人反思是否符合真实经历，再在自己的账号中保存。
- [ ] 上传当前原型和测试的真实截图；任何合成场次、模拟完成和商业情景都标注为演示数据。
- [ ] Checkpoint 1 如需另交，按其要求补齐问题验证、用户反馈和原型凭证；本周报不代替该报告。

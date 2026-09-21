---
type: ENT207考核文档
project: 锦江苏绣文化礼宾原型
component: Component 2 — Checkpoint 1 Report
status: 初稿(占位符待替换真实证据后提交)
deadline: 第 3 周末(End of Week 3)
---

# Checkpoint 1 Report — Draft

> **提交前必读(中文,提交时删除本节)**
> 1. Handbook 对 Checkpoint 1 的三项要求:problem choice and validation evidence / solution concept / digital prototype (chosen features)。本稿已按此结构成文。
> 2. 所有 `【PLACEHOLDER: …】` 处必须替换为真实截图、日期、姓名或数据——**不要倒填日期、不要虚构访谈或评分过程**(真实性红线见 `docs/05_每周日志/00_采分对照与提交清单.md`)。
> 3. 命名:`GroupX_Component2_Checkpoint1_2026.pdf`,由组长上传 LMO;Checkpoint Reports 可在各 checkpoint 时增量提交。
> 4. 篇幅建议 4-6 页;截图至少覆盖:打分矩阵现场照、GYR 互评表、线框图 2-3 张、当前原型界面 2-3 张、看板卡片。

---

**Team:** THIS IS IT · Table 20
**Date:** 【PLACEHOLDER: 提交日期】
**Component:** 2 — Final Deliverables · Checkpoint 1 (End of Week 3)
**Project:** Jinjiang AI ICH Concierge & Heritage Stay — 姑苏非遗数字文化礼宾与住中体验闭环

---

## 1. Problem Choice and Validation Evidence

### 1.1 Problem selection process

In Week 2 the team ran a structured 20-minute scoring sprint over three candidate problem–solution pairs, rated on the course 5-dimension matrix (Reach, Severity, Evidence, Feasibility, Team Interest):

| Candidate | Reach | Severity | Evidence | Feasibility | Interest | Total |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: |
| **1. Jinjiang luxury hotel in-stay heritage revitalization + AI cultural concierge** | 5 | 5 | 4 | 5 | 5 | **24/25** |
| 2. 【PLACEHOLDER: 候选 2 名称与得分】 | | | | | | /25 |
| 3. 【PLACEHOLDER: 候选 3 名称与得分】 | | | | | | /25 |

**Chosen problem (Option 1):** Guests at Jinjiang luxury hotels face static, unengaging heritage exhibits in the lobby; the hotel misses an estimated ¥300–600 per stay of premium cultural-experience spending, and the ICH (Su embroidery) story is told without interactivity or a path to booking.

### 1.2 Validation evidence

- **Peer feedback (GREEN/YELLOW/RED):** 【PLACEHOLDER: Table 19 互评结论——GREEN 放行或 YELLOW 修改点,1-2 句 + 互评表截图】
- **Mentor / TA consultation (Week 2 studio):** 【PLACEHOLDER: 导师对 Option 1 与 "Right Size" 边界的确认,1-2 句 + 会议记录/邮件截图】
- **Domain research:** Curated Su embroidery knowledge fragments (relative silk-splitting levels, stitch categories, Qing-dynasty Gusu scroll references) to ground the AI while explicitly marking material that still needs practitioner review — see `docs/02_非遗内容与来源.md` 【PLACEHOLDER: 来源复核进度】.
- **Target users:** C-end hotel guests / booking-interest users; B-end hotel marketing & operations (analytics consumers). 【PLACEHOLDER: 至少 2-3 次 informal 用户访谈或问卷的原始记录;若无,如实写明计划在第 4 周完成,不要虚构】

### 1.3 Pivot / refinement history

【PLACEHOLDER: 如有 YELLOW 反馈后的范围调整(例如简化弹层、将"防伪入席雅凭"定为核心凭证),用 2-3 句记录决策前后对照;没有则删去本节】

---

## 2. Solution Concept

**One-liner:** An in-stay AI heritage concierge for Jinjiang hotels — the digital host "Wanniang" turns Su embroidery curiosity into an immersive micro-atelier experience, a personalized workshop booking, and an operations dashboard that tells the hotel what to scale.

**User journey (4-screen closed loop → refined to 7 screens):**

> Macro-Atelier immersive scroll → Wanniang AI concierge → My booking & pass → Operations BI dashboard

During prototyping the loop expanded into seven structured screens with logical navigation (satisfying the brief's minimum of five): `/auth` → `/` home → `/guide` → `/immersive` → `/studio` content workbench → `/my` → `/analytics`.

**Three core features (Appendix A-aligned):**

| # | Feature | Appendix A category |
| :-: | :--- | :--- |
| 1 | Wanniang AI concierge: streaming chat grounded in a curated Su embroidery knowledge base, with source disclosure and safe local fallback | Chatbot trained on specific user needs/data; secure use of LLM APIs |
| 2 | Personalized recommendation & booking loop: time/budget/party/interest inputs → server-validated recommendation → intention submission → ops confirmation → guest feedback | Input analysis with personalized recommendations; dynamic task tracker with progress logic |
| 3 | Commercial analytics dashboard: pandas + KMeans guest segmentation, 8-step trial funnel deduplicated by test batch, ROI scenario simulation, and pilot/scale/pause decision gates | Analytics dashboard that visualizes trends; AI-generated suggestions from aggregated data |

**Plan B architecture (resilience by design):** local knowledge-base fallback for AI dialogue, browser-native TTS fallback, static-portrait fallback for the digital human, and honest "service not configured" states instead of fake success — classroom demos never stall.

---

## 3. Digital Prototype (Chosen Features)

### 3.1 What is running today

A working web prototype (Vite + React + TypeScript + Tailwind; Supabase Auth/Postgres/Edge Functions; DeepSeek via server-only keys; Python analytics layer). The shared backend and 42 rolling demonstration sessions are deployed on Supabase; the public frontend URL is still pending.

- 7 screens implemented; zh/en bilingual; guest/ops role separation (role cannot be self-assigned)
- Full business loop testable end-to-end: explore → recommend → submit intention → ops confirm/reject with mandatory reason → guest feedback (1-per-booking) → batch-deduplicated funnel
- 30 automated tests (PGlite: RLS isolation, cohort assignment, batch-scoped guide aggregation, capacity anti-oversell, idempotency and AI rate-limit; unit: recommendation rules and session-only preview storage)
- 【PLACEHOLDER: 截图 2-3 张——首页/导览/看板;如已部署公网链接,附访问地址】

### 3.2 Access for assessors

【PLACEHOLDER: 部署完成后的公网链接;或本地 `web/start-dev.ps1` 一键启动说明;演示账号与动线见 `docs/03_演示脚本与账号.md`】

### 3.3 Known limitations (honest boundaries)

- Demo sessions, capacity and completion marks are prototype assumptions, not real hotel inventory; analytics snapshot uses 1,200 synthetic records with published method notes.
- The digital human renders as a static portrait with semantic performance; Live2D asset licensing is pending 【PLACEHOLDER: 决策与进展】.
- No real PMS or payment integration (explicitly out of scope).

### 3.4 Next steps to Checkpoint 2 (Week 7)

1. Recruit and run the first 3–5 pilot testers (Study 01), scaling to 10+ for user testing report.
2. First external mentor session (Form 3) before Week 9, ideally Weeks 3–4.
3. 【PLACEHOLDER: 按团队周计划填写——例如 TTS 队列、雅凭凭证、内容生成接入 LLM】

---

## Appendix: Evidence checklist (attach)

- [ ] 打分矩阵冲刺现场照片/白板照
- [ ] Peer GYR 互评表(Table 19)
- [ ] 导师/TA 会议记录或邮件
- [ ] 4 屏线框图(桌面 + 移动)
- [ ] 当前原型界面截图 ×3
- [ ] UnoAnalyzer 看板全貌截图
- [ ] 【PLACEHOLDER: 其他】

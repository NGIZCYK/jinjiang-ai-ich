"""苏绣非遗酒店产品商业分析层（课程合成样本）。

运行本脚本会完成三件事：
1. 使用 pandas 整理 1,200 条匿名合成住客样本；
2. 使用 scikit-learn 的 KMeans 进行客群分层；
3. 输出可被前端分析看板直接读取的 JSON 快照。

数据仅用于 ENT207 原型演示，不代表锦江真实经营数据。
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans

RNG = np.random.default_rng(42)


def make_sample() -> pd.DataFrame:
    """构造可解释的住客特征，不包含姓名、联系方式等个人信息。"""
    profiles = [
        # 样本量、停留时长、客房消费、非遗兴趣、商务概率
        (430, 30, 7, 590, 105, 0.43, 0.11),
        (405, 22, 5, 475, 90, 0.20, 0.10),
        (365, 28, 7, 650, 110, 0.73, 0.13),
    ]
    frames: list[pd.DataFrame] = []
    for size, stay_mean, stay_sd, spend_mean, spend_sd, interest_mean, interest_sd in profiles:
        stay_hours = RNG.normal(stay_mean, stay_sd, size).clip(6, 72)
        room_spend = RNG.normal(spend_mean, spend_sd, size).clip(180, 1_500)
        interest = RNG.normal(interest_mean, interest_sd, size).clip(0.02, 0.98)
        business_probability = 0.16 if interest_mean > 0.6 else (0.79 if spend_mean < 500 else 0.10)
        is_business = (RNG.random(size) < business_probability).astype(int)
        total_spend = room_spend * (1 + 0.16 * interest) * np.where(is_business == 1, 0.94, 1.07)
        frames.append(
            pd.DataFrame(
                {
                    "stay_hours": stay_hours,
                    "room_spend": room_spend,
                    "interest": interest,
                    "is_business": is_business,
                    "total_spend": total_spend,
                }
            )
        )
    return pd.concat(frames, ignore_index=True)


def segment(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    cols = ["stay_hours", "room_spend", "interest", "is_business"]
    X = df[cols].to_numpy(dtype=float)
    X = (X - X.mean(axis=0)) / (X.std(axis=0) + 1e-9)
    labels = KMeans(n_clusters=3, n_init=20, random_state=42).fit_predict(X)
    work = df.copy()
    work["cluster"] = labels
    stats = work.groupby("cluster").agg(
        business=("is_business", "mean"),
        interest=("interest", "mean"),
    )
    biz_id = int(stats["business"].idxmax())
    remaining = [i for i in stats.index if i != biz_id]
    cult_id = int(stats.loc[remaining, "interest"].idxmax())
    family_id = [i for i in remaining if i != cult_id][0]
    profile_map = {
        biz_id: ("business-efficiency", "商务快捷型", "Business efficiency"),
        cult_id: ("culture-led", "文化体验型", "Culture-led experience"),
        family_id: ("family-leisure", "亲子休闲型", "Family leisure"),
    }
    work["segment_id"] = work["cluster"].map(lambda cluster: profile_map[int(cluster)][0])
    out: list[dict] = []
    for c, g in work.groupby("cluster"):
        segment_id, name, name_en = profile_map[int(c)]
        out.append(
            {
                "id": segment_id,
                "name": name,
                "nameEn": name_en,
                "share": round(len(g) / len(work), 4),
                "description": f"样本 {len(g)}；均值停留 {g.stay_hours.mean():.1f}h，兴趣指数 {g.interest.mean():.2f}",
                "descriptionEn": f"{len(g)} samples · mean stay {g.stay_hours.mean():.1f}h · interest index {g.interest.mean():.2f}",
                "avgSpendIndex": round(float(g.total_spend.mean() / work.total_spend.mean()), 3),
                "avgStayHours": round(float(g.stay_hours.mean()), 1),
                "avgRoomSpend": round(float(g.room_spend.mean()), 0),
                "avgInterest": round(float(g.interest.mean()), 2),
                "businessShare": round(float(g.is_business.mean()), 2),
                "sampleCount": int(len(g)),
            }
        )
    return work, sorted(out, key=lambda x: x["share"], reverse=True)


def revenue_scenarios(base: float = 100.0) -> list[dict]:
    specs = [
        ("baseline", "基线（无非遗模块）", "Baseline · no heritage module", 0.0, 0.0, {"monthlyHotelGuests": 1_000, "ticketPrice": 0, "sessions": 0, "seatsPerSession": 0, "unitCost": 0, "fixedMonthlyCost": 0, "initialInvestment": 0}),
        ("light-experience", "情景 A（轻体验包）", "Scenario A · light experience", 0.18, 0.01, {"monthlyHotelGuests": 1_000, "ticketPrice": 228, "sessions": 16, "seatsPerSession": 12, "unitCost": 42, "fixedMonthlyCost": 7_000, "initialInvestment": 180_000}),
        ("themed-room-workshop", "情景 B（主题房+体验课）", "Scenario B · themed room + workshop", 0.32, 0.03, {"monthlyHotelGuests": 1_000, "ticketPrice": 398, "sessions": 20, "seatsPerSession": 12, "unitCost": 68, "fixedMonthlyCost": 16_000, "initialInvestment": 300_000}),
    ]
    rows = []
    for scenario_id, name, name_en, attach, uplift, defaults in specs:
        projected = base * (1 + attach * (0.35 + uplift * 2))
        rows.append(
            {
                "id": scenario_id,
                "name": name,
                "nameEn": name_en,
                "baseRevenue": base,
                "ichAttachRate": attach,
                "avgTicketUplift": uplift,
                "projectedRevenue": round(float(projected), 1),
                "defaults": defaults,
            }
        )
    return rows


def roi_table() -> list[dict]:
    plans = [
        ("light-experience", "轻体验包", "Light experience", 18.0, 12.1, 9),
        ("themed-room-workshop", "主题房+体验课", "Themed room + workshop", 30.0, 22.4, 11),
    ]
    out = []
    for plan_id, name, name_en, inv, inc, months in plans:
        out.append(
            {
                "id": plan_id,
                "name": name,
                "nameEn": name_en,
                "investment": inv,
                "incrementalRevenue": inc,
                "roiPct": round((inc / inv) * 100, 1),
                "paybackMonths": months,
            }
        )
    return out


def main() -> None:
    df = make_sample()
    segmented, segments = segment(df)
    records = [
        {
            "id": f"sample-{index + 1:04d}",
            "segmentId": row.segment_id,
            "stayHours": round(float(row.stay_hours), 1),
            "roomSpend": round(float(row.room_spend), 0),
            "interest": round(float(row.interest), 2),
            "isBusiness": bool(row.is_business),
            "totalSpend": round(float(row.total_spend), 0),
        }
        for index, row in segmented.iterrows()
    ]
    payload = {
        "generatedAt": pd.Timestamp.now().isoformat(),
        "source": "ENT207 课程匿名合成样本；不含个人身份信息，非锦江真实经营数据。",
        "method": "pandas 特征整理；scikit-learn KMeans(k=3) 客群分层；收入与 ROI 为可调经营假设。",
        "sampleSize": len(segmented),
        "segments": segments,
        "records": records,
        "revenueScenarios": revenue_scenarios(),
        "roi": roi_table(),
    }
    project_root = Path(__file__).resolve().parent.parent
    output_paths = [
        project_root / "analytics" / "output" / "analytics_snapshot.json",
        project_root / "web" / "public" / "analytics" / "analytics_snapshot.json",
    ]
    for output_path in output_paths:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"written: {output_path}")


if __name__ == "__main__":
    main()

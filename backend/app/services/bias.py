from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, List


def compute_parity(decisions: List[Dict[str, Any]], field: str) -> Dict[str, Any]:
    buckets: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for item in decisions:
        key = item.get(field) or "unknown"
        tag = item.get("tag") or "unknown"
        buckets[key][tag] += 1

    parity: Dict[str, Any] = {"field": field, "groups": {}, "flags": []}
    for group, tag_counts in buckets.items():
        total = sum(tag_counts.values())
        if total == 0:
            continue
        parity["groups"][group] = {tag: count / total for tag, count in tag_counts.items()}

    # Flag if any group has a tag ratio 2x higher than another group for same tag
    tags = {tag for counts in buckets.values() for tag in counts.keys()}
    for tag in tags:
        ratios = []
        for group, tag_counts in buckets.items():
            total = sum(tag_counts.values())
            if total == 0:
                continue
            ratios.append((group, tag_counts.get(tag, 0) / total))
        if len(ratios) < 2:
            continue
        ratios.sort(key=lambda x: x[1])
        if ratios[-1][1] >= 2 * max(ratios[0][1], 0.01):
            parity["flags"].append(
                {
                    "tag": tag,
                    "highest_group": ratios[-1][0],
                    "highest_ratio": ratios[-1][1],
                    "lowest_group": ratios[0][0],
                    "lowest_ratio": ratios[0][1],
                }
            )

    return parity


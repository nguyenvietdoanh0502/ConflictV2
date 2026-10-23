"""Bảng giờ tiết học: nguồn duy nhất trong AI Engine.

Prompt và mock đều đọc từ đây. Backend có thể gửi `period_table` trong request
để ghi đè (khi bảng giờ được cấu hình tập trung ở backend theo AGENT.md §10).
"""
from datetime import time

# (số tiết, giờ bắt đầu, giờ kết thúc) - múi giờ Asia/Ho_Chi_Minh (+07:00)
DEFAULT_PERIODS: list[tuple[int, time, time]] = [
    (1, time(7, 0), time(7, 50)),
    (2, time(7, 50), time(8, 40)),
    (3, time(8, 45), time(9, 35)),
    (4, time(9, 40), time(10, 30)),
    (5, time(10, 35), time(11, 25)),
    (6, time(11, 25), time(12, 15)),
    (7, time(12, 30), time(13, 20)),
    (8, time(13, 20), time(14, 10)),
    (9, time(14, 15), time(15, 5)),
    (10, time(15, 10), time(16, 0)),
    (11, time(16, 5), time(16, 55)),
    (12, time(16, 55), time(17, 45)),
    (13, time(18, 0), time(18, 50)),
    (14, time(18, 50), time(19, 40)),
    (15, time(19, 45), time(20, 35)),
    (16, time(20, 35), time(21, 25)),
]

# Buổi học khi tin nhắn không ghi rõ tiết: (tiết đầu, tiết cuối)
SESSION_DEFAULTS: dict[str, tuple[int, int]] = {
    "sáng": (1, 6),
    "chiều": (7, 12),
    "tối": (13, 16),
}

# Các dải tiết hay gặp, dùng làm ví dụ trong prompt
EXAMPLE_RANGES: list[tuple[int, int]] = [(1, 3), (4, 6), (7, 9), (10, 12), (13, 15), (13, 16)]


def period_range(
    first: int,
    last: int,
    periods: list[tuple[int, time, time]] | None = None,
) -> tuple[time, time]:
    """Giờ bắt đầu của tiết đầu và giờ kết thúc của tiết cuối trong dải."""
    table = {p[0]: (p[1], p[2]) for p in (periods or DEFAULT_PERIODS)}
    if first not in table or last not in table or first > last:
        raise ValueError(f"Dải tiết không hợp lệ: {first}-{last}")
    return table[first][0], table[last][1]


def _fmt(t: time) -> str:
    return t.strftime("%H:%M")


def render_period_rules(periods: list[tuple[int, time, time]] | None = None) -> str:
    """Sinh đoạn prompt mô tả bảng tiết, quy tắc ghép dải và mặc định theo buổi."""
    table = periods or DEFAULT_PERIODS
    lines = ["### BẢNG QUY ĐỔI TIẾT HỌC CHUẨN (Múi giờ Asia/Ho_Chi_Minh: +07:00):"]
    lines += [f"- Tiết {n}: {_fmt(s)} – {_fmt(e)}" for n, s, e in table]
    lines += [
        "",
        "* Quy tắc ghép dải tiết học:",
        "- Giờ bắt đầu (`start_datetime`) lấy theo giờ bắt đầu của tiết đầu tiên trong dải.",
        "- Giờ kết thúc (`end_datetime`) lấy theo giờ kết thúc của tiết cuối cùng trong dải.",
        "Ví dụ:",
    ]
    max_period = max(p[0] for p in table)
    for first, last in EXAMPLE_RANGES:
        if last <= max_period:
            s, e = period_range(first, last, table)
            lines.append(f'+ "Tiết {first}-{last}": {_fmt(s)} – {_fmt(e)}')
    for session, (first, last) in SESSION_DEFAULTS.items():
        if last <= max_period:
            s, e = period_range(first, last, table)
            lines.append(
                f'- Nếu tin nhắn chỉ ghi "{session}" mà không ghi rõ tiết: Mặc định {_fmt(s)} – {_fmt(e)}.'
            )
    lines.append(
        "- Nếu tin nhắn chỉ ghi ngày mà không ghi giờ (ví dụ kiểm tra hoặc nộp bài): "
        "Mặc định theo giờ học chuẩn của môn hoặc kết thúc vào 23:59:00 đối với deadline."
    )
    return "\n".join(lines)

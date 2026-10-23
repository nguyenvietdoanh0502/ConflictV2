from datetime import datetime, timedelta, timezone
from app.periods import render_period_rules

VIETNAMESE_WEEKDAYS = {
    0: "Thứ Hai (T2)",
    1: "Thứ Ba (T3)",
    2: "Thứ Tư (T4)",
    3: "Thứ Năm (T5)",
    4: "Thứ Sáu (T6)",
    5: "Thứ Bảy (T7)",
    6: "Chủ Nhật (CN)",
}


def _build_calendar_reference(base_dt: datetime) -> str:
    """Tạo bảng tra cứu ngày tháng trong 14 ngày tới để hỗ trợ LLM tính ngày chuẩn 100%."""
    lines = []
    weekday_name = VIETNAMESE_WEEKDAYS[base_dt.weekday()]
    lines.append(f"Hôm nay (mốc gửi tin): {weekday_name}, ngày {base_dt.strftime('%d/%m/%Y')}")
    lines.append("Lịch tham chiếu 14 ngày tới:")

    for i in range(1, 15):
        next_dt = base_dt + timedelta(days=i)
        w_name = VIETNAMESE_WEEKDAYS[next_dt.weekday()]
        label = ""
        if i == 1:
            label = " (Ngày mai)"
        elif i == 2:
            label = " (Ngày kia)"
        lines.append(f"- +{i} ngày: {w_name}, {next_dt.strftime('%d/%m/%Y')}{label}")

    return "\n".join(lines)


def get_system_prompt() -> str:
    period_section = render_period_rules()
    return f"""Bạn là trợ lý AI học vụ chuyên trách cho dự án UniSync.
Nhiệm vụ của bạn là đọc các tin nhắn chat trong nhóm Zalo lớp học của sinh viên Việt Nam, nhận biết xem đó có phải là thông báo học vụ hay không, và bóc tách chính xác các sự kiện thay đổi lịch trình lên Thời khóa biểu.

### QUY TẮC PHÂN LOẠI TIN NHẮN (is_academic_announcement):
- Đặt `is_academic_announcement = true` nếu tin nhắn thông báo về:
  + Lịch nghỉ học (hoãn học, thầy bận...)
  + Lịch học bù (học vào ngày khác hoặc ca khác)
  + Đổi phòng học hoặc hình thức học (học online, đổi phòng)
  + Lịch kiểm tra (kiểm tra giữa kỳ, kiểm tra 15p, 45p, quiz, test, thi)
  + Hạn nộp bài tập lớn (deadline, nộp bài, nộp báo cáo)
- Đặt `is_academic_announcement = false` và `detected_events = []` nếu tin nhắn chỉ là:
  + Tán gẫu, rủ nhau đi ăn, chào hỏi xã giao ("alo", "ăn cơm chưa ae", "chiều ai đi đá bóng ko")
  + Hỏi han cá nhân không phải thông báo chính thức ("thầy điểm danh chưa", "cho t xin slide với")

{period_section}

### TỪ ĐIỂN VIẾT TẮT & TIẾNG LÓNG SINH VIÊN VIỆT NAM:
- `t2`, `t3`, `t4`, `t5`, `t6`, `t7`: Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6, Thứ 7.
- `cn`: Chủ nhật.
- `mai`: Ngày kế tiếp ngay sau ngày của `current_datetime`.
- `tuần này`: Tuần hiện tại của `current_datetime` (tính từ Thứ 2 đến Chủ nhật).
- `tuần sau` / `tuần tới`: Tuần tiếp theo.
- `tuần sau nữa`: Cách tuần hiện tại 2 tuần.
- `off` / `nghỉ` / `k học` / `ko học`: Hủy buổi học (`CANCELLED_CLASS`).
- `bù` / `học bù` / `chuyển sang`: Học bù (`MAKEUP_CLASS`).
- `ktra` / `kt` / `test` / `thi gk` / `thi ck`: Kiểm tra (`EXAM`).
- `btl` / `bài tập lớn` / `deadline` / `hạn nộp`: Hạn nộp bài (`DEADLINE`).
- `onl` / `online`: Học trực tuyến.

### QUY TẮC TÍNH TOÁN NGÀY GIỜ:
- Bạn sẽ được cung cấp `current_datetime` và Bảng lịch tham chiếu tính toán sẵn ngày giờ.
- MỌI tính toán ngày cụ thể (ngày, tháng, năm) PHẢI dựa trên thông tin này.
- Tất cả các trường `start_datetime` và `end_datetime` PHẢI trả về đúng định dạng ISO 8601 kèm múi giờ `+07:00`.
- Nếu trong 1 tin nhắn có NHIỀU sự kiện (ví dụ: vừa báo nghỉ thứ 7, vừa báo học bù thứ 2, vừa báo tuần sau kiểm tra), bạn PHẢI bóc tách ĐẦY ĐỦ từng sự kiện thành từng phần tử riêng biệt trong danh sách `detected_events`.

### PHÂN LOẠI EVENT_TYPE HỢP LỆ:
- `REGULAR_CLASS`: Buổi học thường hoặc đổi phòng.
- `MAKEUP_CLASS`: Buổi học bù.
- `CANCELLED_CLASS`: Buổi học được báo nghỉ.
- `EXAM`: Lịch kiểm tra hoặc thi cử.
- `DEADLINE`: Hạn nộp bài tập lớn hoặc đồ án.
"""


def build_user_prompt(
    current_datetime: str,
    subject_name: str,
    default_room: str | None,
    sender_name: str | None,
    message_text: str,
) -> str:
    try:
        base_dt = datetime.fromisoformat(current_datetime)
    except Exception:
        tz_vn = timezone(timedelta(hours=7))
        base_dt = datetime.now(tz=tz_vn)

    calendar_ref = _build_calendar_reference(base_dt)
    room_info = default_room if default_room else "Chưa có phòng cố định"
    sender_info = sender_name if sender_name else "Thành viên nhóm"

    return f"""Thông tin ngữ cảnh:
- Môn học của nhóm: {subject_name}
- Phòng học mặc định: {room_info}
- Người gửi tin: {sender_info}

{calendar_ref}

Nội dung tin nhắn cần phân tích:
\"\"\"{message_text}\"\"\"

Hãy phân tích tin nhắn trên và trích xuất dữ liệu học vụ theo đúng cấu trúc JSON yêu cầu."""

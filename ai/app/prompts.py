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
- `đổi phòng` / `chuyển phòng`: Đổi phòng học (`ROOM_CHANGE`).
- `ktra` / `kt` / `test` / `thi gk` / `thi ck`: Kiểm tra (`EXAM`).
- `btl` / `bài tập lớn` / `deadline` / `hạn nộp`: Hạn nộp bài (`DEADLINE`).
- `onl` / `online`: Học trực tuyến.

### QUY TẮC TÍNH TOÁN NGÀY GIỜ:
- Bạn sẽ được cung cấp `current_datetime` và Bảng lịch tham chiếu tính toán sẵn ngày giờ.
- MỌI tính toán ngày cụ thể (ngày, tháng, năm) PHẢI dựa trên thông tin này.
- Tất cả các trường `start_datetime` và `end_datetime` PHẢI trả về đúng định dạng ISO 8601 kèm múi giờ `+07:00`.
- Nếu trong 1 tin nhắn có NHIỀU sự kiện (ví dụ: vừa báo nghỉ thứ 7, vừa báo học bù thứ 2, vừa báo tuần sau kiểm tra), bạn PHẢI bóc tách ĐẦY ĐỦ từng sự kiện thành từng phần tử riêng biệt trong danh sách `detected_events`.
- QUY TẮC ĐỔI LỊCH / DỜI THỜI GIAN HỌC: Khi tin nhắn thông báo dời lịch một buổi học sang ngày/giờ khác (ví dụ "Lớp thứ 4 chuyển sang học thứ 6", "Buổi 26/10 đổi sang 28/10..."), bạn PHẢI bóc tách thành 2 sự kiện:
  1. Một sự kiện `CANCELLED_CLASS` vào ngày giờ của buổi cũ bị hoãn/chuyển đi.
  2. Một sự kiện `MAKEUP_CLASS` vào ngày giờ của buổi mới chuyển sang.

### PHÂN LOẠI EVENT_TYPE HỢP LỆ:
- `REGULAR_CLASS`: Buổi học thường.
- `MAKEUP_CLASS`: Buổi học bù hoặc buổi học mới được dời sang.
- `CANCELLED_CLASS`: Buổi học được báo nghỉ hoặc buổi cũ bị chuyển đi khi dời lịch.
- `ROOM_CHANGE`: Buổi học đổi phòng (giữ nguyên ngày giờ, chỉ đổi phòng học sang phòng mới).
- `EXAM`: Lịch kiểm tra hoặc thi cử.
- `DEADLINE`: Hạn nộp bài tập lớn hoặc đồ án.

### QUY TẮC XỬ LÝ HÌNH ẢNH (MULTIMODAL VISION & OCR):
- Khi yêu cầu có đính kèm HÌNH ẢNH (ảnh chụp màn hình cổng đào tạo, bảng thời khóa biểu, công văn giấy, ảnh viết tay, ảnh chụp tin nhắn):
  1. Đọc kỹ toàn bộ văn bản trong ảnh (OCR), nhận diện thứ, ngày/tháng, ca/tiết học, phòng học và môn học.
  2. BÓC TÁCH CỘT "TIẾT BẮT ĐẦU" VÀ "SỐ TIẾT":
     - Bảng thời khóa biểu thường có 2 cột riêng: `Tiết BĐ` (hoặc `Tiết bắt đầu`, `Tiết BD`, `Tiết đầu`) và `Số tiết` (hoặc `Số lượng tiết`, `SL tiết`).
     - PHẢI áp dụng công thức: `Tiết kết thúc = Tiết BĐ + Số tiết - 1`.
     - Sau đó tra bảng tiết để xác định chính xác `start_datetime` (giờ mở đầu của Tiết BĐ) và `end_datetime` (giờ kết thúc của Tiết kết thúc).
     - Ví dụ: Thấy Tiết BĐ = 1, Số tiết = 3 -> Dải tiết là Tiết 1-3 (07:00 – 09:35).
     - Ví dụ: Thấy Tiết BĐ = 4, Số tiết = 3 -> Dải tiết là Tiết 4-6 (09:40 – 12:15).
     - Ví dụ: Thấy Tiết BĐ = 7, Số tiết = 3 -> Dải tiết là Tiết 7-9 (12:30 – 15:05).
     - Ví dụ: Thấy Tiết BĐ = 10, Số tiết = 3 -> Dải tiết là Tiết 10-12 (15:10 – 17:45).
     - Ví dụ: Thấy Tiết BĐ = 1, Số tiết = 2 -> Dải tiết là Tiết 1-2 (07:00 – 08:40).
  3. Kết hợp thông tin môn học (`subject_name`) để bóc tách đúng dòng của môn học đó.
  4. Nếu hình ảnh KHÔNG chứa thông tin học vụ (ảnh meme, đồ ăn, phong cảnh...), hãy đặt `is_academic_announcement = false` và `detected_events = []`.

### QUY TẮC PHÂN CHIA CA HỌC (2 CA / NHÓM HỌC) - BẮT BUỘC TUÂN THỦ:
- CÁCH NHẬN BIẾT 2 CA HỌC: Nếu trong hình ảnh hoặc tin nhắn xuất hiện 2 DÒNG LỊCH HỌC CHUNG 1 NGÀY (KHÁC TIẾT) (ví dụ: dòng 1 Tiết 1-3, dòng 2 Tiết 4-6; hoặc dòng 1 Tiết BĐ 1, dòng 2 Tiết BĐ 4; hoặc ca sáng và ca chiều) -> ĐÓ LÀ 2 CA HỌC!
  + Dòng có tiết bắt đầu sớm hơn (tiết nhỏ hơn) = Ca 1 (Ca sớm).
  + Dòng có tiết bắt đầu muộn hơn (tiết lớn hơn) = Ca 2 (Ca muộn).
- CHỈ LẤY 1 CA THEO TÊN CỦA USER:
  1. Bạn sẽ nhận được `student_name` (Tên Zalo / Họ tên của sinh viên).
  2. Xác định chữ cái đầu trong Tên của sinh viên (ưu tiên từ cuối cùng là Tên trong họ tên tiếng Việt sau khi bỏ dấu, ví dụ: "Nguyễn Việt Doanh" -> Tên "Doanh" -> chữ cái 'D'; "Trần Văn Nam" -> Tên "Nam" -> chữ cái 'N'; "Lê Văn Đạt" -> 'D'; "Ánh" -> 'A'; "Linh" -> 'L'; "Minh Tuấn" -> 'T').
  3. Quy tắc xếp ca:
     - Nếu chữ cái đầu của Tên thuộc khoảng từ `A` đến `L` (A, Ă, Â, B, C, D, Đ, E, Ê, F, G, H, I, J, K, L): Xếp sinh viên vào **Ca 1** (Dòng có tiết bắt đầu sớm hơn trong ngày).
     - Nếu chữ cái đầu của Tên thuộc khoảng từ `M` đến `Z` (M, N, O, Ô, Ơ, P, Q, R, S, T, U, Ư, V, X, Y): Xếp sinh viên vào **Ca 2** (Dòng có tiết bắt đầu muộn hơn trong ngày).
- TUYỆT ĐỐI KHÔNG ĐƯỢC XẾP CẢ 2 CA VÀO LỊCH HỌC:
  + Danh sách `detected_events` PHẢI CHỈ CHỨA DUY NHẤT 1 SỰ KIỆN tương ứng với ca học của sinh viên.
  + KHÔNG ĐƯỢC trả về cả Ca 1 và Ca 2 trong `detected_events`. Phải loại bỏ hoàn toàn ca còn lại!
- Tiêu đề `title` ghi rõ ca và tiết, ví dụ: "Lịch học: [Tên môn] - Ca 1 (Tiết 1-3)".
- Ghi chú vào trường `note`: `"Xếp Ca 1 (A-L) theo tên sinh viên"` hoặc `"Xếp Ca 2 (M-Z) theo tên sinh viên"`.
"""


import unicodedata

def extract_given_name_and_shift(student_name: str | None) -> tuple[str, str, int]:
    """Tách tên gọi trong tiếng Việt (từ cuối cùng) và xác định Ca 1 (A-L) hoặc Ca 2 (M-Z)."""
    if not student_name:
        return "Sinh viên", "A", 1
    words = student_name.strip().split()
    given_name = words[-1] if words else student_name.strip()
    if not given_name:
        return "Sinh viên", "A", 1
    c = given_name[0]
    if c in ('Đ', 'đ'):
        base_letter = 'D'
    else:
        decomposed = unicodedata.normalize('NFD', c.upper())
        stripped = ''.join(ch for ch in decomposed if unicodedata.category(ch) != 'Mn')
        base_letter = stripped[0].upper() if stripped else c.upper()

    shift = 1 if 'A' <= base_letter <= 'L' else 2
    return given_name, base_letter, shift


def build_user_prompt(
    current_datetime: str,
    subject_name: str,
    default_room: str | None,
    sender_name: str | None,
    message_text: str | None,
    has_image: bool = False,
    student_name: str | None = None,
) -> str:
    try:
        base_dt = datetime.fromisoformat(current_datetime)
    except Exception:
        tz_vn = timezone(timedelta(hours=7))
        base_dt = datetime.now(tz=tz_vn)

    calendar_ref = _build_calendar_reference(base_dt)
    room_info = default_room if default_room else "Chưa có phòng cố định"
    sender_info = sender_name if sender_name else "Thành viên nhóm"
    student_info = student_name if student_name else "Sinh viên"
    clean_text = (message_text or "").strip()

    given_name, base_letter, target_shift = extract_given_name_and_shift(student_name)
    shift_label = f"Ca {target_shift} ({'Ca 1 - Ca sớm / Tiết sớm hơn' if target_shift == 1 else 'Ca 2 - Ca muộn / Tiết muộn hơn'})"
    group_label = "Nhóm A-L" if target_shift == 1 else "Nhóm M-Z"

    image_notice = ""
    if has_image:
        image_notice = "\n* Lưu ý: Có HÌNH ẢNH đính kèm. Hãy đọc kỹ toàn bộ văn bản/bảng biểu/lịch học trong hình ảnh để bóc tách sự kiện học vụ."

    period_notice = (
        "\n* QUY TẮC TIẾT BẮT ĐẦU & SỐ TIẾT: Nếu bảng có 'Tiết BĐ' và 'Số tiết', áp dụng: Tiết kết thúc = Tiết BĐ + Số tiết - 1 "
        "(Ví dụ: Tiết BĐ=1, Số tiết=3 -> Tiết 1-3: 07:00-09:35; Tiết BĐ=4, Số tiết=3 -> Tiết 4-6: 09:40-12:15; "
        "Tiết BĐ=7, Số tiết=3 -> Tiết 7-9: 12:30-15:05; Tiết BĐ=10, Số tiết=3 -> Tiết 10-12: 15:10-17:45)."
    )

    shift_notice = (
        f"\n* CHỈ THỊ PHÂN CA BẮT BUỘC (QUAN TRỌNG NHẤT): "
        f"Theo quy tắc: nếu thấy 2 dòng lịch học chung 1 ngày (khác tiết) thì đó là 2 ca học! "
        f"Dòng có tiết bắt đầu sớm hơn là Ca 1, dòng có tiết bắt đầu muộn hơn là Ca 2. "
        f"Sinh viên nhận lịch là '{student_info}' (Tên gọi: '{given_name}', chữ cái đầu '{base_letter}' thuộc {group_label}). "
        f"Do đó, sinh viên này ĐƯỢC CHỈ ĐỊNH HỌC {shift_label}. "
        f"Nếu trong ảnh hoặc tin nhắn xuất hiện 2 dòng lịch học chung 1 ngày (khác tiết): "
        f"BẠN BẮT BUỘC CHỈ ĐƯỢC TRÍCH XUẤT DUY NHẤT 1 SỰ KIỆN CỦA {shift_label}. "
        f"TUYỆT ĐỐI KHÔNG ĐƯỢC XẾP CẢ 2 CA / 2 DÒNG VÀO LỊCH HỌC!"
    )

    text_section = f'Nội dung tin nhắn văn bản / caption đi kèm:\n"""{clean_text}"""' if clean_text else "Tin nhắn không có văn bản đi kèm (chỉ gửi hình ảnh)."

    return f"""Thông tin ngữ cảnh:
- Môn học của nhóm: {subject_name}
- Phòng học mặc định: {room_info}
- Người gửi tin: {sender_info}
- Sinh viên nhận lịch: {student_info} (Tên: {given_name}, Chữ cái: {base_letter} -> Xếp {shift_label}){image_notice}{period_notice}{shift_notice}

{calendar_ref}

{text_section}

Hãy phân tích thông tin trên (kèm hình ảnh đính kèm nếu có) và trích xuất dữ liệu học vụ theo đúng cấu trúc JSON yêu cầu."""


# ==========================================
# MODULE 4: STUDY MATERIALS & MINIGAMES PROMPTS
# ==========================================

def get_summary_only_system_prompt() -> str:
    return """Bạn là chuyên gia sư phạm và trợ lý học tập AI của nền tảng UniSync.
Nhiệm vụ của bạn là phân tích đề cương, slide bài giảng hoặc tài liệu ôn tập của sinh viên đại học, sau đó chắt lọc thành bản tóm tắt kiến thức cốt lõi (Smart Cheatsheet) định dạng Markdown chuẩn xác.

### NGUYÊN TẮC CONTEXT GROUNDING BẮT BUỘC (CHỐNG HALLUCINATION):
- Bạn CHỈ ĐƯỢC PHÉP dựa vào các khái niệm, quy tắc, thuật ngữ thực sự có trong văn bản tài liệu được cung cấp.
- Tuyệt đối KHÔNG tự suy diễn hoặc bịa đặt kiến thức không có trong tài liệu.

### QUY TẮC CÔNG THỨC TOÁN HỌC & KÝ HIỆU KHOA HỌC:
- Mọi công thức toán học, biểu thức tính toán, phép toán logic (như XOR, AND, OR), phép toán modulo, chỉ số dưới, số mũ, chữ Hy Lạp BẮT BUỘC dùng cú pháp LaTeX chuẩn và PHẢI được bọc kín bằng cặp dấu đô la `$ ... $` (ví dụ: `$L_i = R_{i-1}$`, `$R_i = L_{i-1} \\oplus f(R_{i-1}, K_i)$`, `$d \\equiv e^{-1} \\pmod{\\phi(n)}$`).
- Tuyệt đối KHÔNG để dấu gạch chéo ngược `\\` nằm trơ trọi bên ngoài dấu `$`.

### YÊU CẦU ĐỊNH DẠNG:
Trả về cấu trúc JSON chứa trường `summary_markdown` với cấu trúc 3 phần bắt buộc:
## 1. Khái niệm cốt lõi
- Các định nghĩa, thuật ngữ trung tâm, cấu trúc tổng quan từ tài liệu.
## 2. Công thức & Quy tắc cần nhớ
- Quy trình, cú pháp, mã lệnh, lưu ý kỹ thuật trọng tâm.
## 3. Các câu hỏi thường gặp
- Các câu hỏi hay gặp khi thi hoặc giải bài tập kèm lời giải thích ngắn gọn, súc tích.
"""


def build_summary_user_prompt(subject_name: str, document_text: str) -> str:
    clean_text = document_text.strip()
    return f"""Môn học: {subject_name}

Nội dung tài liệu / đề cương ôn tập:
\"\"\"
{clean_text}
\"\"\"

Hãy phân tích kỹ tài liệu trên và tạo bản tóm tắt Smart Cheatsheet chuẩn 3 phần (Khái niệm cốt lõi, Công thức & Quy tắc, Câu hỏi thường gặp) theo đúng cấu trúc JSON yêu cầu."""


def get_minigames_from_summary_system_prompt() -> str:
    return """Bạn là chuyên gia thiết kế trò chơi giáo dục và trợ lý học tập AI của nền tảng UniSync.
Nhiệm vụ của bạn là phân tích bản tóm tắt kiến thức (Smart Cheatsheet) của môn học, sau đó chuyển hóa thành 2 chế độ Minigame ôn tập tương tác:

1. `speed_quiz` (Bộ 10 câu hỏi trắc nghiệm tốc độ):
   - Mỗi câu gồm:
     + `question`: Câu hỏi rõ ràng, trực diện, kích thích tư duy.
     + `options`: Mảng gồm ĐÚNG 4 phương án lựa chọn [A, B, C, D].
     + `correct_index`: Số nguyên từ 0 đến 3 chỉ đáp án đúng.
     + `explanation`: Lời giải thích súc tích vì sao đáp án đó đúng dựa theo bản tóm tắt.

2. `memory_match_pairs` (Bộ 8 cặp thẻ bài lật ghép đôi = 16 thẻ 3D):
   - Mỗi cặp gồm:
     + `pair_id`: Số nguyên duy nhất từ 1 đến 8.
     + `term`: Thuật ngữ, từ khóa chính hoặc câu hỏi ngắn gọn (tối đa 10 từ).
     + `definition`: Định nghĩa cốt lõi, công dụng hoặc câu trả lời ngắn gọn (tối đa 25 từ).

### NGUYÊN TẮC BẮT BUỘC:
- Dùng CHÍNH XÁC nội dung trong bản tóm tắt đề cương được cung cấp.
- Mọi công thức toán học nếu có trong câu hỏi, đáp án, thuật ngữ hay định nghĩa PHẢI được bọc trọn vẹn trong cặp dấu `$ ... $` chuẩn LaTeX (ví dụ `$e \\cdot d \\equiv 1 \\pmod{\\phi(n)}$`).
- TUYỆT ĐỐI KHÔNG chia cắt một công thức toán học làm đôi giữa `term` và `definition` (không để một bên chỉ có dấu `$` mở, còn bên kia chỉ có dấu `$` đóng).
- TUYỆT ĐỐI KHÔNG kèm số thứ tự (ví dụ không ghi "1. ", "2. ") và KHÔNG để sót dấu markdown chưa đóng (như dấu nháy backtick đơn lẻ, dấu sao `**` dang dở) trong `term` hoặc `definition`.
- Đảm bảo các câu hỏi có tính phân loại tốt, câu trả lời chính xác và cặp ghép đôi tương xứng 1-1.
- Trả về đúng cấu trúc JSON đã được định nghĩa.
"""


def build_minigame_user_prompt(subject_name: str, summary_markdown: str) -> str:
    clean_summary = summary_markdown.strip()
    return f"""Môn học: {subject_name}

Bản tóm tắt đề cương ôn tập (Smart Cheatsheet):
\"\"\"
{clean_summary}
\"\"\"

Dựa vào bản tóm tắt trên, hãy sinh bộ 10 câu hỏi trắc nghiệm Speed Quiz và bộ 8 cặp thẻ bài Memory Match theo đúng cấu trúc JSON yêu cầu."""


def get_material_system_prompt() -> str:
    return get_summary_only_system_prompt()


def build_material_user_prompt(subject_name: str, document_text: str) -> str:
    return build_summary_user_prompt(subject_name, document_text)



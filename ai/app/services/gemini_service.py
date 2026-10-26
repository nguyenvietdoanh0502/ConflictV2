import asyncio
import base64
import logging
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional
import unicodedata

from google import genai
from google.genai import types

from app.config import settings
from app.errors import AIEngineError
from app.periods import period_range
from app.prompts import build_user_prompt, get_system_prompt
from app.schemas import AnalyzeMessageRequest, AnalyzeMessageResponse, DetectedEventItem

logger = logging.getLogger("unisync-ai")


def get_base_letter(char: str) -> str:
    """Loại bỏ dấu thanh/dấu tiếng Việt để lấy chữ cái gốc ASCII (A-Z)."""
    if not char:
        return 'A'
    c = char.upper()
    if c in ('Đ', 'đ'):
        return 'D'
    decomposed = unicodedata.normalize('NFD', c)
    stripped = ''.join(ch for ch in decomposed if unicodedata.category(ch) != 'Mn')
    base = stripped[0].upper() if stripped else c[0]
    return base if 'A' <= base <= 'Z' else 'A'


def get_student_shift(student_name: Optional[str]) -> int:
    """Xác định ca học (1 hoặc 2) dựa trên chữ cái đầu của Tên sinh viên (A-L: Ca 1, M-Z: Ca 2)."""
    if not student_name:
        return 1
    # Tách từ cuối cùng (Tên gọi trong họ tên tiếng Việt, vd: 'Nguyễn Việt Doanh' -> 'Doanh', 'Ánh' -> 'Ánh')
    words = student_name.strip().split()
    target_word = words[-1] if words else student_name.strip()
    if not target_word:
        return 1
    base_letter = get_base_letter(target_word[0])
    if 'A' <= base_letter <= 'L':
        return 1
    return 2


def _get_vn_date_str(iso_str: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_str)
        tz_vn = timezone(timedelta(hours=7))
        return dt.astimezone(tz_vn).strftime("%Y-%m-%d")
    except Exception:
        return iso_str[:10] if iso_str and len(iso_str) >= 10 else "default"


def enforce_single_shift(events: list[DetectedEventItem], student_name: Optional[str]) -> list[DetectedEventItem]:
    """Đảm bảo TUYỆT ĐỐI không xếp cả 2 ca vào lịch học:
    Quy tắc: Nếu 2 dòng lịch học chung 1 ngày (khác tiết) thì đó là 2 ca học. Chỉ lấy 1 ca theo tên của user.
    - Dòng có tiết bắt đầu sớm hơn = Ca 1 (Ca sớm).
    - Dòng có tiết bắt đầu muộn hơn = Ca 2 (Ca muộn).
    - User tên A-L: Giữ Ca 1, bỏ Ca 2.
    - User tên M-Z: Giữ Ca 2, bỏ Ca 1.
    """
    if len(events) <= 1:
        return events

    target_shift = get_student_shift(student_name)

    # 1. Tìm theo nhãn rõ ràng: Ca 1 / Ca 2 (kíp 1 / kíp 2 / nhóm 1 / nhóm 2)
    ca1_indices = [i for i, e in enumerate(events) if re.search(r'\b(ca\s*1|kíp\s*1|nhóm\s*1|đợt\s*1)\b', (e.title + " " + (e.note or "")).lower())]
    ca2_indices = [i for i, e in enumerate(events) if re.search(r'\b(ca\s*2|kíp\s*2|nhóm\s*2|đợt\s*2)\b', (e.title + " " + (e.note or "")).lower())]

    if ca1_indices and ca2_indices:
        indices_to_remove = set(ca2_indices if target_shift == 1 else ca1_indices)
        filtered = [e for i, e in enumerate(events) if i not in indices_to_remove]
        if filtered:
            return filtered

    # 2. Gom nhóm theo ngày học: nếu 2 dòng lịch học chung 1 ngày (khác tiết) -> đó là 2 ca học!
    events_by_date = defaultdict(list)
    for i, e in enumerate(events):
        date_str = _get_vn_date_str(e.start_datetime)
        events_by_date[date_str].append((i, e))

    indices_to_drop = set()
    for date_str, date_events in events_by_date.items():
        if len(date_events) >= 2:
            # Sắp xếp theo start_datetime tăng dần
            sorted_events = sorted(date_events, key=lambda x: x[1].start_datetime)
            first_start = sorted_events[0][1].start_datetime
            has_different_periods = any(ev[1].start_datetime != first_start for ev in sorted_events[1:])
            if has_different_periods:
                shift1_idx = sorted_events[0][0]
                shift2_idx = sorted_events[1][0]
                if target_shift == 1:
                    # Sinh viên A-L: chỉ lấy Ca 1 (dòng có tiết sớm hơn)
                    for idx, _ in sorted_events[1:]:
                        indices_to_drop.add(idx)
                else:
                    # Sinh viên M-Z: chỉ lấy Ca 2 (dòng có tiết muộn hơn)
                    indices_to_drop.add(shift1_idx)
                    for idx, _ in sorted_events[2:]:
                        indices_to_drop.add(idx)

    if indices_to_drop:
        return [e for i, e in enumerate(events) if i not in indices_to_drop]

    return events


class GeminiService:
    def __init__(self):
        self._client: Optional[genai.Client] = None
        self._init_client()

    def _init_client(self):
        if settings.is_live_configured:
            try:
                # Cấu hình timeout qua HttpOptions
                http_options = types.HttpOptions(timeout=settings.gemini_timeout_ms)
                self._client = genai.Client(
                    api_key=settings.gemini_api_key,
                    http_options=http_options
                )
                logger.info(f"Gemini Client initialized với model: {settings.gemini_model}")
            except Exception as e:
                logger.error(f"Khởi tạo Gemini Client thất bại: {e}")
                self._client = None
        else:
            logger.info("AI Service đang ở MOCK MODE (Chưa có GEMINI_API_KEY hoặc AI_MODE=mock)")

    async def analyze_message(self, request: AnalyzeMessageRequest) -> AnalyzeMessageResponse:
        """Phân tích tin nhắn Zalo thành cấu trúc sự kiện học vụ.

        - Chế độ Mock (AI_MODE=mock): Chạy bộ phân tích giả lập deterministic phục vụ kiểm thử và offline demo.
        - Chế độ Live (AI_MODE=live): Gọi Gemini API không đồng bộ. Khi có lỗi sẽ retry 1 lần, nếu vẫn lỗi sẽ ném AIEngineError (không âm thầm trả mock).
        """
        if settings.is_mock_mode:
            return self._mock_analyze_message(request)

        # Chế độ Live
        if not settings.is_live_configured or self._client is None:
            raise AIEngineError(
                error_code="AI_NOT_CONFIGURED",
                message="AI Service đang ở chế độ live nhưng GEMINI_API_KEY chưa được cấu hình hợp lệ trong .env",
                status_code=503
            )

        has_image = bool(request.image_base64 or request.image_url)
        user_prompt = build_user_prompt(
            current_datetime=request.current_datetime,
            subject_name=request.subject_name,
            default_room=request.default_room,
            sender_name=request.sender_name,
            message_text=request.message_text,
            has_image=has_image,
            student_name=request.student_name,
        )

        contents = []
        if request.image_base64:
            clean_b64 = request.image_base64.strip()
            if "," in clean_b64:
                clean_b64 = clean_b64.split(",", 1)[1]
            try:
                img_bytes = base64.b64decode(clean_b64)
                mime = request.image_mime_type or "image/jpeg"
                contents.append(types.Part.from_bytes(data=img_bytes, mime_type=mime))
                logger.info(f"Đã nạp ảnh đính kèm (size: {len(img_bytes)} bytes, mime: {mime}) vào prompt Gemini")
            except Exception as b64_err:
                logger.warning(f"Không thể giải mã image_base64: {b64_err}")

        contents.append(user_prompt)

        config = types.GenerateContentConfig(
            system_instruction=get_system_prompt(),
            response_mime_type="application/json",
            response_schema=AnalyzeMessageResponse,
            temperature=0.1,
        )

        # Thử gọi API (tối đa 2 lần nếu gặp sự cố mạng/quá tải)
        last_exception = None
        for attempt in range(1, 3):
            try:
                response = await self._client.aio.models.generate_content(
                    model=settings.gemini_model,
                    contents=contents,
                    config=config,
                )

                if not response.text:
                    raise AIEngineError(
                        error_code="AI_EMPTY_RESPONSE",
                        message="Gemini API trả về nội dung rỗng.",
                        status_code=502
                    )

                result = AnalyzeMessageResponse.model_validate_json(response.text)
                # Hậu kiểm quy tắc 2 ca: Tuyệt đối không xếp cả 2 ca vào lịch học
                result.detected_events = enforce_single_shift(result.detected_events, request.student_name)
                logger.info(f"Phân tích tin nhắn thành công qua Gemini {settings.gemini_model}. Sự kiện: {len(result.detected_events)}")
                return result

            except Exception as e:
                last_exception = e
                logger.warning(f"Lần gọi Gemini thứ {attempt} thất bại: {e}")
                if attempt < 2:
                    await asyncio.sleep(0.5)

        logger.error(f"Gọi Gemini API thất bại hoàn toàn sau 2 lần: {last_exception}")
        raise AIEngineError(
            error_code="AI_ENGINE_UNAVAILABLE",
            message=f"Lỗi khi gọi mô hình Gemini ({settings.gemini_model}): {str(last_exception)}",
            status_code=502
        )

    def _mock_analyze_message(self, request: AnalyzeMessageRequest) -> AnalyzeMessageResponse:
        """Bộ phân tích giả lập (Mock Parser) chất lượng cao phục vụ kiểm thử và kịch bản demo độc lập."""
        text = (request.message_text or "").strip()
        text_lower = text.lower()
        now_dt = self._parse_iso_datetime(request.current_datetime)
        has_image = bool(request.image_base64 or request.image_url)

        # Từ khóa học vụ với word boundary để tránh nhầm (vd: 'thiết kế' không phải là 'thi')
        academic_patterns = [
            r'\bnghỉ\b', r'\boff\b', r'\bthầy bận\b', r'\bk học\b', r'\bko học\b',
            r'\bbù\b', r'\bhọc bù\b', r'\bchuyển sang\b', r'\bđổi phòng\b', r'\bchuyển phòng\b', r'\bsang phòng\b',
            r'\bđổi lịch\b', r'\bdời lịch\b',
            r'\bktra\b', r'\bkiểm tra\b', r'\bthi\b', r'\btest\b', r'\bquiz\b',
            r'\bdeadline\b', r'\bhạn nộp\b', r'\bbtl\b', r'\bbài tập lớn\b',
            r'\bca\s*[12]\b', r'\b2\s*ca\b', r'\bhai\s*ca\b', r'\bchia ca\b', r'\bthực hành\b', r'\bchia làm 2 ca\b', r'\bchia 2 nhóm\b',
            r'tiết\s*(?:bắt\s*đầu|bđ)', r'số\s*(?:lượng\s*)?tiết'
        ]

        has_academic_pattern = any(re.search(pat, text_lower) for pat in academic_patterns)

        # Nhận diện cột / thông tin Tiết BĐ và Số tiết (ví dụ: 'Tiết BĐ: 1, Số tiết: 3' hoặc 'Tiết bắt đầu: 4, Số tiết: 3')
        p_start_match = re.search(r'(?:tiết\s*(?:bắt\s*đầu|bđ)?|bắt\s*đầu\s*từ\s*tiết)\s*[:=]?\s*([0-9]+)', text_lower)
        p_count_match = re.search(r'(?:số\s*tiết|số\s*lượng\s*tiết|học\s*trong)\s*[:=]?\s*([0-9]+)', text_lower)
        custom_periods = None
        if p_start_match and p_count_match:
            p_s = int(p_start_match.group(1))
            p_c = int(p_count_match.group(1))
            p_e = p_s + p_c - 1
            if 1 <= p_s <= 16 and 1 <= p_e <= 16:
                custom_periods = (p_s, p_e)

        # Nếu có ảnh và không có từ khóa text rõ rệt, sinh sự kiện mock bóc tách từ ảnh thời khóa biểu
        if has_image and not has_academic_pattern:
            target_shift = get_student_shift(request.student_name)
            t_start, t_end = period_range(1, 3) if target_shift == 1 else period_range(4, 6)
            shift_title = "Ca 1 (Tiết 1-3)" if target_shift == 1 else "Ca 2 (Tiết 4-6)"
            group_label = "A-L" if target_shift == 1 else "M-Z"
            target_date = now_dt + timedelta(days=2)
            default_room = request.default_room or "401-A1"
            return AnalyzeMessageResponse(
                is_academic_announcement=True,
                confidence_score=0.92,
                detected_events=[
                    DetectedEventItem(
                        event_type="MAKEUP_CLASS",
                        title=f"Lịch học (từ ảnh): {request.subject_name} - {shift_title}",
                        start_datetime=target_date.strftime(f"%Y-%m-%dT{t_start.strftime('%H:%M:00')}+07:00"),
                        end_datetime=target_date.strftime(f"%Y-%m-%dT{t_end.strftime('%H:%M:00')}+07:00"),
                        room=default_room,
                        note=f"Trích xuất từ ảnh thời khóa biểu Zalo. Xếp {shift_title} cho sinh viên '{request.student_name or group_label}' ({group_label})."
                    )
                ]
            )

        if not has_academic_pattern or len(text) < 10:
            return AnalyzeMessageResponse(
                is_academic_announcement=False,
                confidence_score=0.95,
                detected_events=[]
            )

        events: list[DetectedEventItem] = []
        default_room = request.default_room or "401-A1"

        # 0.1 Phát hiện thông tin Tiết BĐ + Số tiết chỉ định rõ ràng
        if custom_periods:
            t_start, t_end = period_range(custom_periods[0], custom_periods[1])
            target_date = self._find_target_date(text_lower, now_dt, default_offset_days=2, target_role="makeup")
            period_label = f"Tiết {custom_periods[0]}-{custom_periods[1]}"
            events.append(
                DetectedEventItem(
                    event_type="MAKEUP_CLASS",
                    title=f"Lịch học: {request.subject_name} ({period_label})",
                    start_datetime=target_date.strftime(f"%Y-%m-%dT{t_start.strftime('%H:%M:00')}+07:00"),
                    end_datetime=target_date.strftime(f"%Y-%m-%dT{t_end.strftime('%H:%M:00')}+07:00"),
                    room=default_room,
                    note=f"Trích xuất từ bảng: Tiết BĐ {custom_periods[0]}, Số tiết {custom_periods[1] - custom_periods[0] + 1} -> {period_label}"
                )
            )
            return AnalyzeMessageResponse(
                is_academic_announcement=True,
                confidence_score=0.96,
                detected_events=events
            )

        # 0. Phát hiện thông báo chia 2 ca (Ca 1 / Ca 2)
        if re.search(r'(2\s*ca|hai\s*ca|chia làm 2 ca|chia 2 nhóm|ca 1.*ca 2|ca 2.*ca 1)', text_lower, re.DOTALL):
            target_shift = get_student_shift(request.student_name)
            shift_date = self._find_target_date(text_lower, now_dt, default_offset_days=3, target_role="makeup")
            t_start, t_end = period_range(1, 3) if target_shift == 1 else period_range(4, 6)
            period_str = "Tiết 1-3" if target_shift == 1 else "Tiết 4-6"
            shift_label = f"Ca {target_shift} ({period_str})"
            group_label = "A-L" if target_shift == 1 else "M-Z"
            student_display = request.student_name if request.student_name else group_label
            events.append(
                DetectedEventItem(
                    event_type="MAKEUP_CLASS",
                    title=f"Lịch học: {request.subject_name} - {shift_label}",
                    start_datetime=shift_date.strftime(f"%Y-%m-%dT{t_start.strftime('%H:%M:00')}+07:00"),
                    end_datetime=shift_date.strftime(f"%Y-%m-%dT{t_end.strftime('%H:%M:00')}+07:00"),
                    room=default_room,
                    note=f"Xếp {shift_label} cho sinh viên '{student_display}' theo phân ca {group_label} (tên bắt đầu bằng chữ cái {group_label})"
                )
            )
            return AnalyzeMessageResponse(
                is_academic_announcement=True,
                confidence_score=0.96,
                detected_events=events
            )

        # 1. Phát hiện sự kiện đổi phòng học (ROOM_CHANGE)
        if re.search(r'\b(đổi phòng|chuyển phòng|sang phòng|chuyển sang phòng)\b', text_lower) and not re.search(r'\b(bù|học bù|đổi lịch|dời lịch)\b', text_lower):
            room_date = self._find_target_date(text_lower, now_dt, default_offset_days=1, target_role="room")
            room_match = re.search(r'(?:phòng|p\.?)\s*([0-9]{3}-?[a-zA-Z0-9]*)', text_lower)
            new_room = room_match.group(1).upper() if room_match else "502-A2"
            t_start, t_end = period_range(1, 3)
            events.append(
                DetectedEventItem(
                    event_type="ROOM_CHANGE",
                    title=f"Đổi phòng: {request.subject_name}",
                    start_datetime=room_date.strftime(f"%Y-%m-%dT{t_start.strftime('%H:%M:00')}+07:00"),
                    end_datetime=room_date.strftime(f"%Y-%m-%dT{t_end.strftime('%H:%M:00')}+07:00"),
                    room=new_room,
                    note=f"Đổi phòng học sang {new_room}"
                )
            )

        # 2. Phát hiện sự kiện báo nghỉ (CANCELLED_CLASS)
        if re.search(r'\b(nghỉ|off|thầy bận|k học|ko học|đổi lịch|dời lịch)\b', text_lower):
            cancel_date = self._find_target_date(text_lower, now_dt, default_offset_days=2, target_role="cancel")
            t_start, t_end = period_range(1, 3)
            events.append(
                DetectedEventItem(
                    event_type="CANCELLED_CLASS",
                    title=f"Nghỉ học: {request.subject_name}",
                    start_datetime=cancel_date.strftime(f"%Y-%m-%dT{t_start.strftime('%H:%M:00')}+07:00"),
                    end_datetime=cancel_date.strftime(f"%Y-%m-%dT{t_end.strftime('%H:%M:00')}+07:00"),
                    room=default_room,
                    note="Giảng viên thông báo nghỉ học"
                )
            )

        # 3. Phát hiện sự kiện học bù hoặc đổi thời gian học (MAKEUP_CLASS)
        if re.search(r'\b(bù|học bù|chuyển sang|đổi lịch|dời lịch)\b', text_lower):
            makeup_date = self._find_target_date(text_lower, now_dt, default_offset_days=4, target_role="makeup")
            # Tìm phòng học nếu có nhắc
            room_match = re.search(r'(?:phòng|p\.?)\s*([0-9]{3}-?[a-zA-Z0-9]*)', text_lower)
            room = room_match.group(1).upper() if room_match else default_room

            # Tìm ca/tiết
            if "chiều" in text_lower or "tiết 7" in text_lower or "tiết 7-9" in text_lower:
                t_start, t_end = period_range(7, 9)
                period_title = "Tiết 7-9"
            elif "tối" in text_lower or "tiết 13" in text_lower:
                t_start, t_end = period_range(13, 15)
                period_title = "Tiết 13-15"
            else:
                t_start, t_end = period_range(1, 3)
                period_title = "Tiết 1-3"

            events.append(
                DetectedEventItem(
                    event_type="MAKEUP_CLASS",
                    title=f"Học bù: {request.subject_name} ({period_title})",
                    start_datetime=makeup_date.strftime(f"%Y-%m-%dT{t_start.strftime('%H:%M:00')}+07:00"),
                    end_datetime=makeup_date.strftime(f"%Y-%m-%dT{t_end.strftime('%H:%M:00')}+07:00"),
                    room=room,
                    note=f"Học bù tại phòng {room}"
                )
            )

        # 3. Phát hiện sự kiện kiểm tra / thi (EXAM)
        if re.search(r'\b(ktra|kiểm tra|thi|test|quiz)\b', text_lower):
            exam_date = now_dt + timedelta(days=7)
            t_start, t_end = period_range(1, 3)
            events.append(
                DetectedEventItem(
                    event_type="EXAM",
                    title=f"Kiểm tra giữa kỳ: {request.subject_name}",
                    start_datetime=exam_date.strftime(f"%Y-%m-%dT{t_start.strftime('%H:%M:00')}+07:00"),
                    end_datetime=exam_date.strftime(f"%Y-%m-%dT{t_end.strftime('%H:%M:00')}+07:00"),
                    room=default_room,
                    note="Kiểm tra đánh giá quá trình"
                )
            )

        # 4. Phát hiện sự kiện Deadline
        if re.search(r'\b(deadline|hạn nộp|btl|bài tập lớn)\b', text_lower):
            dl_date = now_dt + timedelta(days=5)
            events.append(
                DetectedEventItem(
                    event_type="DEADLINE",
                    title=f"Hạn nộp bài tập lớn: {request.subject_name}",
                    start_datetime=dl_date.strftime("%Y-%m-%dT23:59:00+07:00"),
                    end_datetime=dl_date.strftime("%Y-%m-%dT23:59:00+07:00"),
                    room=None,
                    note="Hạn chót nộp bài tập lớn"
                )
            )

        events = enforce_single_shift(events, request.student_name)
        return AnalyzeMessageResponse(
            is_academic_announcement=len(events) > 0,
            confidence_score=0.96 if events else 0.85,
            detected_events=events
        )

    def _parse_iso_datetime(self, dt_str: str) -> datetime:
        try:
            return datetime.fromisoformat(dt_str)
        except Exception:
            tz_vn = timezone(timedelta(hours=7))
            return datetime.now(tz=tz_vn)

    def _find_target_date(self, text: str, base_dt: datetime, default_offset_days: int, target_role: str = "") -> datetime:
        monday_this_week = base_dt - timedelta(days=base_dt.weekday())

        # Nếu tin nhắn có ghi rõ ngày tháng (ví dụ: 24/10 hoặc (24/10))
        date_match = re.search(r'\(?(\d{1,2})/(\d{1,2})\)?', text)
        if target_role == "cancel" and date_match:
            try:
                day, month = int(date_match.group(1)), int(date_match.group(2))
                return base_dt.replace(month=month, day=day)
            except Exception:
                pass

        if target_role == "cancel":
            if "t7" in text or "thứ 7" in text:
                return monday_this_week + timedelta(days=5)  # Thứ 7 tuần này
            if "t6" in text or "thứ 6" in text:
                return monday_this_week + timedelta(days=4)  # Thứ 6 tuần này
            if "mai" in text:
                return base_dt + timedelta(days=1)

        if target_role == "makeup":
            if "t2" in text or "thứ 2" in text:
                if "tuần sau" in text:
                    return monday_this_week + timedelta(days=7)  # Thứ 2 tuần sau
                return monday_this_week
            if "t7" in text or "thứ 7" in text:
                if "tuần sau" in text:
                    return monday_this_week + timedelta(days=12)  # Thứ 7 tuần sau
                return monday_this_week + timedelta(days=5)

        if "mai" in text:
            return base_dt + timedelta(days=1)
        if "thứ 2" in text or "t2" in text:
            if "tuần sau" in text:
                return monday_this_week + timedelta(days=7)
            return monday_this_week
        if "thứ 7" in text or "t7" in text:
            if "tuần sau" in text:
                return monday_this_week + timedelta(days=12)
            return monday_this_week + timedelta(days=5)

        return base_dt + timedelta(days=default_offset_days)


# Singleton service instance
ai_service = GeminiService()

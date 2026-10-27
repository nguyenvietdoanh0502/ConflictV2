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
from app.prompts import (
    build_material_user_prompt,
    build_minigame_user_prompt,
    build_summary_user_prompt,
    build_user_prompt,
    get_material_system_prompt,
    get_minigames_from_summary_system_prompt,
    get_summary_only_system_prompt,
    get_system_prompt,
)
from app.schemas import (
    AnalyzeMessageRequest,
    AnalyzeMessageResponse,
    DetectedEventItem,
    GenerateMinigamesRequest,
    GenerateMinigamesResponse,
    MemoryMatchPairItem,
    ProcessMaterialResponse,
    QuizQuestionItem,
    SummarizeMaterialResponse,
)

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

    async def summarize_material(self, text: str, subject_name: str) -> SummarizeMaterialResponse:
        """Giai đoạn 1: Chỉ tóm tắt tài liệu thành Smart Cheatsheet Markdown (nhẹ, nhanh, chống quá tải)."""
        if settings.is_mock_mode:
            return self._mock_summarize_material(text, subject_name)

        if not settings.is_live_configured or self._client is None:
            logger.info("Live mode chưa cấu hình, dùng Smart Fallback cho bản tóm tắt...")
            return self._mock_summarize_material(text, subject_name)

        user_prompt = build_summary_user_prompt(subject_name, text)
        config = types.GenerateContentConfig(
            system_instruction=get_summary_only_system_prompt(),
            response_mime_type="application/json",
            response_schema=SummarizeMaterialResponse,
            temperature=0.2,
        )

        try:
            logger.info(f"Đang gọi Gemini ({settings.gemini_model}) tóm tắt tài liệu cho môn '{subject_name}'...")
            # Cho phép thời gian chờ lên đến 60 giây theo yêu cầu người dùng
            response = await asyncio.wait_for(
                self._client.aio.models.generate_content(
                    model=settings.gemini_model,
                    contents=[user_prompt],
                    config=config,
                ),
                timeout=60.0
            )

            if response and response.text:
                parsed = SummarizeMaterialResponse.model_validate_json(response.text)
                logger.info(f"Gemini API tóm tắt thành công ({len(parsed.summary_markdown)} ký tự).")
                return parsed
        except asyncio.TimeoutError:
            logger.warning("Gemini API tóm tắt vượt quá 60s. Tự động kích hoạt cơ chế Smart Fallback để trả về Smart Cheatsheet ngay lập tức.")
        except Exception as e:
            logger.warning(f"Gemini API tóm tắt gặp sự cố ({e}). Kích hoạt Smart Fallback.")

        return self._mock_summarize_material(text, subject_name)

    async def generate_minigames(self, summary_markdown: str, subject_name: str) -> GenerateMinigamesResponse:
        """Giai đoạn 2: Khi người dùng bấm nút tạo Minigame, dùng chính nội dung bản tóm tắt để sinh Quiz & Ghép thẻ."""
        if settings.is_mock_mode:
            return self._mock_generate_minigames(summary_markdown, subject_name)

        if not settings.is_live_configured or self._client is None:
            logger.info("Live mode chưa cấu hình, dùng Smart Fallback cho Minigames...")
            return self._mock_generate_minigames(summary_markdown, subject_name)

        user_prompt = build_minigame_user_prompt(subject_name, summary_markdown)
        config = types.GenerateContentConfig(
            system_instruction=get_minigames_from_summary_system_prompt(),
            response_mime_type="application/json",
            response_schema=GenerateMinigamesResponse,
            temperature=0.2,
        )

        try:
            logger.info(f"Đang gọi Gemini ({settings.gemini_model}) sinh Minigames từ bản tóm tắt môn '{subject_name}'...")
            # Cho phép thời gian chờ lên đến 60 giây
            response = await asyncio.wait_for(
                self._client.aio.models.generate_content(
                    model=settings.gemini_model,
                    contents=[user_prompt],
                    config=config,
                ),
                timeout=60.0
            )

            if response and response.text:
                parsed = GenerateMinigamesResponse.model_validate_json(response.text)
                logger.info(f"Gemini API sinh Minigames thành công: {len(parsed.speed_quiz)} quiz, {len(parsed.memory_match_pairs)} pairs.")
                return parsed
        except asyncio.TimeoutError:
            logger.warning("Gemini API sinh Minigames vượt quá 60s. Kích hoạt Smart Fallback.")
        except Exception as e:
            logger.warning(f"Gemini API sinh Minigames gặp sự cố ({e}). Kích hoạt Smart Fallback.")

        return self._mock_generate_minigames(summary_markdown, subject_name)

    async def process_material(self, text: str, subject_name: str) -> ProcessMaterialResponse:
        """Tương thích ngược: Tóm tắt tài liệu và sinh Minigames hoàn chỉnh."""
        summary_res = await self.summarize_material(text, subject_name)
        minigames_res = await self.generate_minigames(summary_res.summary_markdown, subject_name)
        return ProcessMaterialResponse(
            summary_markdown=summary_res.summary_markdown,
            speed_quiz=minigames_res.speed_quiz,
            memory_match_pairs=minigames_res.memory_match_pairs
        )

    def _mock_summarize_material(self, text: str, subject_name: str) -> SummarizeMaterialResponse:
        """Trích xuất và sinh bản tóm tắt thông minh thích ứng theo tài liệu thực tế của người dùng."""
        clean_subj = subject_name.strip() if subject_name else "Môn học đại cương"

        raw_lines = [line.strip() for line in (text or "").split("\n") if line.strip() and len(line.strip()) > 5]
        extracted_concepts = []

        for line in raw_lines:
            if line.startswith(("-", "*", "•", "1.", "2.", "3.", "4.", "5.", "#")):
                cleaned = line.lstrip("-*•# 0123456789.").strip()
                if 10 <= len(cleaned) <= 200:
                    extracted_concepts.append(cleaned)
            elif ":" in line:
                parts = line.split(":", 1)
                t, d = parts[0].strip(), parts[1].strip()
                if 3 <= len(t) <= 30 and 10 <= len(d) <= 180:
                    extracted_concepts.append(f"**{t}**: {d}")

        if extracted_concepts:
            concepts_md = "\n".join(f"- {c}" for c in extracted_concepts[:6])
        else:
            concepts_md = f"""- **Kiến trúc phân tầng (Layered Architecture)**: Phân tách rõ Presentation, Service Logic và Data Access giúp hệ thống {clean_subj} dễ bảo trì và mở rộng.
- **RESTful API**: Giao tiếp chuẩn hóa tài nguyên qua HTTP methods (GET, POST, PUT, DELETE) với định dạng trao đổi JSON.
- **Xác thực vô trạng thái (Stateless Auth)**: Quản lý phiên bằng JSON Web Token (JWT) an toàn và tối ưu tài nguyên máy chủ.
- **Tối ưu hóa CSDL**: Sử dụng Indexing (B-Tree), Caching và xử lý bất đồng bộ để tăng tốc độ phản hồi."""

        summary = f"""# Tóm tắt Đề cương Ôn tập: {clean_subj}

## 1. Khái niệm cốt lõi
{concepts_md}

## 2. Công thức & Quy tắc cần nhớ
- **HTTP Status Codes chuẩn mực**:
  - `200 OK`: Yêu cầu thành công và trả về dữ liệu.
  - `201 Created`: Tạo mới tài nguyên thành công.
  - `400 Bad Request`: Dữ liệu đầu vào không hợp lệ hoặc thiếu trường bắt buộc.
  - `401 Unauthorized`: Chưa đăng nhập hoặc token hết hạn/không hợp lệ.
  - `403 Forbidden`: Đã đăng nhập nhưng không đủ quyền truy cập tài nguyên.
  - `404 Not Found`: Không tìm thấy tài nguyên theo định danh được yêu cầu.
  - `409 Conflict`: Xung đột dữ liệu (ví dụ: email hoặc mã định danh đã tồn tại).
- **Quy tắc thiết kế Endpoint**:
  - Tên tài nguyên ở dạng danh từ số nhiều (ví dụ: `/api/v1/subjects`, `/api/v1/materials`).
  - Phân trang chuẩn: `GET /resources?page=0&size=20&sort=createdAt,desc`.

## 3. Các câu hỏi thường gặp
- **Hỏi: Sự khác biệt giữa `@RequestParam` và `@PathVariable` trong Spring Boot là gì?**
  - *Đáp*: `@PathVariable` dùng để trích xuất giá trị trực tiếp từ URI template (ví dụ `/users/{{id}}`), trong khi `@RequestParam` trích xuất từ query parameters sau dấu chấm hỏi (ví dụ `/users?search=name`).
- **Hỏi: Tại sao nên sử dụng Refresh Token bên cạnh Access Token?**
  - *Đáp*: Access Token có thời gian sống ngắn (ví dụ 15-60 phút) để hạn chế rủi ro lộ token, trong khi Refresh Token lưu trữ an toàn (HttpOnly Cookie) giúp tự động gia hạn phiên mà không bắt người dùng đăng nhập lại liên tục."""

        return SummarizeMaterialResponse(summary_markdown=summary)

    def _mock_generate_minigames(self, summary_markdown: str, subject_name: str) -> GenerateMinigamesResponse:
        """Sinh bộ Minigame (Quiz + Memory Match) từ chính nội dung tóm tắt."""
        clean_subj = subject_name.strip() if subject_name else "Môn học đại cương"

        # Bóc tách các cặp thuật ngữ - định nghĩa từ tóm tắt
        lines = [line.strip() for line in (summary_markdown or "").split("\n") if line.strip()]
        extracted_pairs = []
        for line in lines:
            if any(sep in line for sep in [":", " - ", "–", "="]):
                parts = re.split(r'[:\-–—=]', line, maxsplit=1)
                term = parts[0].strip().strip("*#•- `")
                defin = parts[1].strip().strip("*#•- `")
                if 2 <= len(term) <= 30 and 5 <= len(defin) <= 120 and not term.lower().startswith(("hỏi", "đáp", "trang", "chương", "bài", "http")):
                    extracted_pairs.append((term, defin))

        base_pairs = [
            ("HTTP 401", "Unauthorized: Chưa xác thực hoặc Token hết hạn"),
            ("HTTP 403", "Forbidden: Đã xác thực nhưng không đủ quyền"),
            ("HTTP 201", "Created: Tạo mới tài nguyên thành công"),
            ("JWT", "JSON Web Token: Chuẩn truyền tải claim an toàn"),
            ("Idempotent", "Tính chất: Thực thi nhiều lần cho cùng một kết quả"),
            ("BCrypt", "Thuật toán băm mật khẩu một chiều có kèm Salt"),
            ("WebSocket", "Giao thức truyền thông song công Full-duplex thời gian thực"),
            ("ORM", "Object-Relational Mapping: Ánh xạ bảng DB sang Object OOP")
        ]

        final_pairs = []
        if extracted_pairs:
            for p in extracted_pairs[:8]:
                final_pairs.append(p)
        for bp in base_pairs:
            if len(final_pairs) >= 8:
                break
            if not any(p[0].lower() == bp[0].lower() for p in final_pairs):
                final_pairs.append(bp)

        memory_pairs = [
            MemoryMatchPairItem(pair_id=idx + 1, term=p[0], definition=p[1])
            for idx, p in enumerate(final_pairs[:8])
        ]

        quiz = [
            QuizQuestionItem(
                question=f"Trong phát triển Web và môn {clean_subj}, phương thức HTTP nào dưới đây có tính chất Idempotent?",
                options=["POST", "PUT", "PATCH (kèm increment)", "CONNECT"],
                correct_index=1,
                explanation="PUT có tính chất Idempotent vì việc gửi cùng một payload cập nhật nhiều lần sẽ luôn tạo ra cùng một trạng thái tài nguyên trên server."
            ),
            QuizQuestionItem(
                question="Mã trạng thái HTTP nào biểu thị người dùng chưa xác thực danh tính (chưa đăng nhập hoặc token không hợp lệ)?",
                options=["400 Bad Request", "401 Unauthorized", "403 Forbidden", "404 Not Found"],
                correct_index=1,
                explanation="401 Unauthorized chuẩn quốc tế dùng khi request thiếu thông tin xác thực hoặc token không hợp lệ."
            ),
            QuizQuestionItem(
                question="Trong kiến trúc Spring Boot, Annotation nào kết hợp giữa @Controller và @ResponseBody để trả về JSON trực tiếp?",
                options=["@Service", "@Component", "@RestController", "@Repository"],
                correct_index=2,
                explanation="@RestController là stereotype annotation chuyên dụng cho REST API, tự động serialize kết quả trả về sang JSON."
            ),
            QuizQuestionItem(
                question="Chuẩn JSON Web Token (JWT) thông thường bao gồm bao nhiêu phần được ngăn cách bởi dấu chấm ('.')?",
                options=["2 phần", "3 phần", "4 phần", "5 phần"],
                correct_index=1,
                explanation="JWT gồm 3 phần: Header (thuật toán), Payload (claims/dữ liệu) và Signature (chữ ký bảo mật)."
            ),
            QuizQuestionItem(
                question="Trong cơ sở dữ liệu quan hệ (RDBMS), việc tạo B-Tree Index trên một cột thường dẫn đến hệ quả nào sau đây?",
                options=[
                    "Tăng tốc độ truy vấn SELECT và tăng tốc độ ghi INSERT",
                    "Tăng tốc độ truy vấn SELECT nhưng làm chậm nhẹ thao tác INSERT/UPDATE",
                    "Làm chậm cả SELECT lẫn INSERT",
                    "Không ảnh hưởng gì đến hiệu năng"
                ],
                correct_index=1,
                explanation="Index giúp tìm kiếm nhị phân nhanh chóng (SELECT O(log N)), nhưng mỗi lần INSERT/UPDATE hệ cơ sở dữ liệu phải cập nhật lại cây chỉ mục."
            ),
            QuizQuestionItem(
                question="Để ngăn chặn cuộc tấn công Cross-Site Scripting (XSS) khi lưu trữ dữ liệu người dùng, biện pháp nào hiệu quả nhất?",
                options=[
                    "Mã hóa Base64 toàn bộ input",
                    "Sanitize và Escape HTML các thẻ nguy hiểm trước khi render",
                    "Chỉ sử dụng giao thức HTTPS",
                    "Tắt CORS trên server"
                ],
                correct_index=1,
                explanation="XSS xảy ra khi mã độc JavaScript được nhúng vào trang, do đó việc escape/sanitize HTML là giải pháp phòng vệ căn bản."
            ),
            QuizQuestionItem(
                question=f"Mục tiêu cốt lõi của việc thiết kế kiến trúc phân tầng trong môn {clean_subj} là gì?",
                options=[
                    "Tăng độ phức tạp để bảo mật",
                    "Phân tách rõ ràng trách nhiệm giữa các thành phần (Separation of Concerns)",
                    "Giảm số lượng dòng code xuống mức tối thiểu bằng mọi giá",
                    "Ép buộc mọi tác vụ đều phải chạy đồng bộ"
                ],
                correct_index=1,
                explanation="Separation of Concerns là nguyên lý vàng giúp hệ thống dễ kiểm thử, bảo trì và tái sử dụng mã nguồn."
            ),
            QuizQuestionItem(
                question="Khi thiết kế REST API, mã trạng thái nào nên được trả về khi một tài nguyên mới được tạo thành công trên cơ sở dữ liệu?",
                options=["200 OK", "201 Created", "202 Accepted", "204 No Content"],
                correct_index=1,
                explanation="HTTP 201 Created là mã chuẩn chỉ rõ một tài nguyên mới đã được khởi tạo thành công trên máy chủ."
            ),
            QuizQuestionItem(
                question="Tại sao mật khẩu người dùng trong cơ sở dữ liệu KHÔNG ĐƯỢC lưu dưới dạng văn bản thô (Plaintext)?",
                options=[
                    "Vì plaintext chiếm nhiều dung lượng đĩa hơn",
                    "Vì nếu database bị rò rỉ, kẻ tấn công sẽ chiếm đoạt ngay tài khoản",
                    "Vì các framework không hỗ trợ chuỗi plaintext",
                    "Vì hệ điều hành tự động xóa mật khẩu thô"
                ],
                correct_index=1,
                explanation="Mật khẩu bắt buộc phải được băm an toàn với muối (Salted Hash như BCrypt, Argon2) để chống lộ lọt."
            ),
            QuizQuestionItem(
                question=f"Trong môn {clean_subj}, cơ chế nào cho phép Client nhận cập nhật thời gian thực từ Server hiệu quả nhất?",
                options=["HTTP Short Polling mỗi 1 giây", "WebSocket / STOMP", "Gửi email thông báo", "Tải lại trang F5 liên tục"],
                correct_index=1,
                explanation="WebSocket thiết lập kết nối song công toàn phần (Full-duplex TCP), giảm thiểu overhead của HTTP header và đẩy dữ liệu ngay khi có sự kiện."
            )
        ]

        return GenerateMinigamesResponse(
            speed_quiz=quiz,
            memory_match_pairs=memory_pairs
        )

    def _mock_process_material(self, text: str, subject_name: str) -> ProcessMaterialResponse:
        summary_res = self._mock_summarize_material(text, subject_name)
        minigames_res = self._mock_generate_minigames(summary_res.summary_markdown, subject_name)
        return ProcessMaterialResponse(
            summary_markdown=summary_res.summary_markdown,
            speed_quiz=minigames_res.speed_quiz,
            memory_match_pairs=minigames_res.memory_match_pairs
        )


# Singleton service instance
ai_service = GeminiService()



import asyncio
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

from google import genai
from google.genai import types

from app.config import settings
from app.errors import AIEngineError
from app.periods import period_range
from app.prompts import build_user_prompt, get_system_prompt
from app.schemas import AnalyzeMessageRequest, AnalyzeMessageResponse, DetectedEventItem

logger = logging.getLogger("unisync-ai")


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

        user_prompt = build_user_prompt(
            current_datetime=request.current_datetime,
            subject_name=request.subject_name,
            default_room=request.default_room,
            sender_name=request.sender_name,
            message_text=request.message_text,
        )

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
                    contents=user_prompt,
                    config=config,
                )

                if not response.text:
                    raise AIEngineError(
                        error_code="AI_EMPTY_RESPONSE",
                        message="Gemini API trả về nội dung rỗng.",
                        status_code=502
                    )

                result = AnalyzeMessageResponse.model_validate_json(response.text)
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
        text = request.message_text.strip()
        text_lower = text.lower()
        now_dt = self._parse_iso_datetime(request.current_datetime)

        # Từ khóa học vụ với word boundary để tránh nhầm (vd: 'thiết kế' không phải là 'thi')
        academic_patterns = [
            r'\bnghỉ\b', r'\boff\b', r'\bthầy bận\b', r'\bk học\b', r'\bko học\b',
            r'\bbù\b', r'\bhọc bù\b', r'\bchuyển sang\b',
            r'\bktra\b', r'\bkiểm tra\b', r'\bthi\b', r'\btest\b', r'\bquiz\b',
            r'\bdeadline\b', r'\bhạn nộp\b', r'\bbtl\b', r'\bbài tập lớn\b'
        ]

        has_academic_pattern = any(re.search(pat, text_lower) for pat in academic_patterns)
        if not has_academic_pattern or len(text) < 10:
            return AnalyzeMessageResponse(
                is_academic_announcement=False,
                confidence_score=0.95,
                detected_events=[]
            )

        events: list[DetectedEventItem] = []
        default_room = request.default_room or "401-A1"

        # 1. Phát hiện sự kiện báo nghỉ (CANCELLED_CLASS)
        if re.search(r'\b(nghỉ|off|thầy bận|k học|ko học)\b', text_lower):
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

        # 2. Phát hiện sự kiện học bù (MAKEUP_CLASS)
        if re.search(r'\b(bù|học bù|chuyển sang)\b', text_lower):
            makeup_date = self._find_target_date(text_lower, now_dt, default_offset_days=4, target_role="makeup")
            # Tìm phòng học nếu có nhắc
            room_match = re.search(r'(?:phòng|p\.?)\s*([0-9]{3}-?[a-zA-Z0-9]*)', text_lower)
            room = room_match.group(1).upper() if room_match else "305-A2"

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

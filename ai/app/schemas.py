from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, model_validator

EventTypeLiteral = Literal[
    "REGULAR_CLASS",
    "MAKEUP_CLASS",
    "CANCELLED_CLASS",
    "EXAM",
    "DEADLINE",
    "ROOM_CHANGE"
]


class DetectedEventItem(BaseModel):
    event_type: EventTypeLiteral = Field(
        ...,
        description="Loại sự kiện học vụ: 'REGULAR_CLASS', 'MAKEUP_CLASS', 'CANCELLED_CLASS', 'EXAM', 'DEADLINE', hoặc 'ROOM_CHANGE'"
    )
    title: str = Field(
        ...,
        description="Tiêu đề sự kiện ngắn gọn, rõ ràng bằng tiếng Việt, ví dụ: 'Học bù: Lập trình Web (Tiết 1-3)'"
    )
    start_datetime: str = Field(
        ...,
        description="Thời điểm bắt đầu theo định dạng chuẩn ISO 8601 kèm múi giờ +07:00, ví dụ: '2026-10-24T07:00:00+07:00'"
    )
    end_datetime: str = Field(
        ...,
        description="Thời điểm kết thúc theo định dạng chuẩn ISO 8601 kèm múi giờ +07:00, ví dụ: '2026-10-24T09:35:00+07:00'"
    )
    room: Optional[str] = Field(
        None,
        description="Phòng học diễn ra sự kiện, ví dụ: '305-A2'. Nếu không đổi thì dùng phòng mặc định của môn học"
    )
    note: Optional[str] = Field(
        None,
        description="Ghi chú chi tiết thêm, ví dụ: 'Học bù cho buổi nghỉ ngày 22/10' hoặc 'Kiểm tra 45 phút chương 3'"
    )

    @model_validator(mode="after")
    def validate_datetimes(self):
        try:
            start_dt = datetime.fromisoformat(self.start_datetime)
            end_dt = datetime.fromisoformat(self.end_datetime)
            if start_dt > end_dt:
                raise ValueError(f"start_datetime ({self.start_datetime}) không được lớn hơn end_datetime ({self.end_datetime})")
        except Exception as e:
            # Nếu parsing ISO format lỗi, bỏ qua khi Pydantic đang dùng để validate schema cho Gemini
            if isinstance(e, ValueError) and "không được lớn hơn" in str(e):
                raise e
        return self


class AnalyzeMessageRequest(BaseModel):
    current_datetime: str = Field(
        ...,
        description="Thời điểm gửi tin nhắn theo chuẩn ISO 8601 với múi giờ +07:00, ví dụ: '2026-10-22T15:20:00+07:00'"
    )
    subject_name: str = Field(
        ...,
        description="Tên môn học được gán với nhóm Zalo này, ví dụ: 'Lập trình Web'"
    )
    default_room: Optional[str] = Field(
        None,
        description="Phòng học mặc định của môn học, ví dụ: '401-A1'"
    )
    sender_name: Optional[str] = Field(
        None,
        description="Tên người gửi tin nhắn trong nhóm Zalo, ví dụ: 'Lớp trưởng Nam'"
    )
    message_text: Optional[str] = Field(
        "",
        description="Nội dung tin nhắn văn bản hoặc caption đính kèm ảnh từ nhóm Zalo"
    )
    image_base64: Optional[str] = Field(
        None,
        description="Dữ liệu hình ảnh được mã hóa Base64 (nếu tin nhắn là hình ảnh hoặc kèm ảnh)"
    )
    image_mime_type: Optional[str] = Field(
        "image/jpeg",
        description="Định dạng MIME của hình ảnh, ví dụ: 'image/jpeg', 'image/png', 'image/webp'"
    )
    image_url: Optional[str] = Field(
        None,
        description="Đường dẫn URL của hình ảnh trên Zalo CDN nếu có"
    )
    student_name: Optional[str] = Field(
        None,
        description="Tên Zalo hoặc họ và tên của sinh viên để AI xếp ca học chính xác (A-L: Ca 1, M-Z: Ca 2) khi lớp chia 2 ca"
    )


class AnalyzeMessageResponse(BaseModel):
    is_academic_announcement: bool = Field(
        ...,
        description="True nếu tin nhắn chứa thông báo học vụ (nghỉ, bù, đổi phòng, kiểm tra, deadline); False nếu là tin nhắn tán gẫu, hỏi đáp thường"
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Độ tin cậy của AI đối với kết quả phân tích (từ 0.0 đến 1.0)"
    )
    detected_events: List[DetectedEventItem] = Field(
        default_factory=list,
        description="Danh sách các sự kiện học vụ được bóc tách từ tin nhắn"
    )


class ErrorResponse(BaseModel):
    error_code: str
    message: str

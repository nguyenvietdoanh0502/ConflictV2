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


# ==========================================
# MODULE 4: STUDY MATERIALS & MINIGAMES SCHEMAS
# ==========================================

class QuizQuestionItem(BaseModel):
    question: str = Field(
        ...,
        description="Nội dung câu hỏi trắc nghiệm kiểm tra kiến thức trọng tâm từ tài liệu"
    )
    options: List[str] = Field(
        ...,
        min_length=4,
        max_length=4,
        description="Chính xác 4 phương án trả lời tương ứng A, B, C, D"
    )
    correct_index: int = Field(
        ...,
        ge=0,
        le=3,
        description="Chỉ số index của đáp án chính xác (0: A, 1: B, 2: C, 3: D)"
    )
    explanation: str = Field(
        ...,
        description="Giải thích ngắn gọn, súc tích vì sao đáp án này đúng dựa trên nội dung tài liệu"
    )


class MemoryMatchPairItem(BaseModel):
    pair_id: int = Field(
        ...,
        description="Mã số định danh cặp ghép đôi (ví dụ: 1, 2, 3...)"
    )
    term: str = Field(
        ...,
        description="Thuật ngữ, khái niệm hoặc câu hỏi ngắn gọn (tối đa 10 từ) để in trên mặt thẻ bài"
    )
    definition: str = Field(
        ...,
        description="Định nghĩa hoặc câu trả lời tương ứng (tối đa 25 từ) để in trên mặt thẻ bài đối ứng"
    )


class GeminiSummarizeSchema(BaseModel):
    summary_markdown: str = Field(
        ...,
        description="Bản tóm tắt đề cương dạng Markdown chuẩn 3 phần: ## 1. Khái niệm cốt lõi, ## 2. Công thức & Quy tắc cần nhớ, ## 3. Các câu hỏi thường gặp"
    )


class SummarizeMaterialResponse(BaseModel):
    summary_markdown: str = Field(
        ...,
        description="Bản tóm tắt đề cương dạng Markdown chuẩn 3 phần: ## 1. Khái niệm cốt lõi, ## 2. Công thức & Quy tắc cần nhớ, ## 3. Các câu hỏi thường gặp"
    )
    extracted_text: Optional[str] = Field(
        None,
        description="Văn bản gốc được trích xuất từ file đề cương"
    )


class GenerateMinigamesRequest(BaseModel):
    summary_markdown: str = Field(
        ...,
        min_length=20,
        description="Nội dung tóm tắt đề cương hoặc Smart Cheatsheet"
    )
    subject_name: str = Field(
        ...,
        description="Tên môn học"
    )


class GenerateMinigamesResponse(BaseModel):
    speed_quiz: List[QuizQuestionItem] = Field(
        ...,
        min_length=5,
        max_length=15,
        description="Bộ 10 câu hỏi trắc nghiệm 4 đáp án cho Đấu trường Trắc nghiệm"
    )
    memory_match_pairs: List[MemoryMatchPairItem] = Field(
        ...,
        min_length=6,
        max_length=8,
        description="Bộ 8 cặp thuật ngữ - định nghĩa cho trò chơi Lật thẻ Ghép cặp (16 thẻ bài 3D)"
    )


class ProcessMaterialResponse(BaseModel):
    summary_markdown: str = Field(
        ...,
        description="Bản tóm tắt đề cương dạng Markdown chuẩn 3 phần: ## 1. Khái niệm cốt lõi, ## 2. Công thức & Quy tắc cần nhớ, ## 3. Các câu hỏi thường gặp"
    )
    extracted_text: Optional[str] = Field(
        None,
        description="Văn bản gốc được trích xuất từ file đề cương"
    )
    speed_quiz: List[QuizQuestionItem] = Field(
        default_factory=list,
        description="Bộ câu hỏi trắc nghiệm 4 đáp án cho Đấu trường Trắc nghiệm (tùy chọn hoặc sinh theo yêu cầu)"
    )
    memory_match_pairs: List[MemoryMatchPairItem] = Field(
        default_factory=list,
        description="Bộ cặp thuật ngữ - định nghĩa cho trò chơi Lật thẻ Ghép cặp (tùy chọn hoặc sinh theo yêu cầu)"
    )


class ExtractTextResponse(BaseModel):
    text: str
    char_count: int
    page_count: int

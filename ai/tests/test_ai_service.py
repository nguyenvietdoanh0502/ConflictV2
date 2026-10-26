import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
AUTH_HEADERS = {"X-Internal-Api-Key": "test-internal-key"}


def test_health_check():
    """Kiểm tra endpoint /health."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "unisync-ai-engine"
    assert data["mode"] == "mock"
    assert data["model"] == "gemini-3.8-flash"


def test_internal_api_key_unauthorized():
    """Kiểm tra chặn gọi nội bộ khi thiếu hoặc sai X-Internal-Api-Key."""
    payload = {
        "current_datetime": "2026-10-22T15:20:00+07:00",
        "subject_name": "Lập trình Web",
        "message_text": "Thứ 7 tuần này nghỉ học nhé."
    }
    # Không truyền header
    res_no_auth = client.post("/ai/analyze-message", json=payload)
    assert res_no_auth.status_code == 401

    # Truyền sai header
    res_wrong_auth = client.post(
        "/ai/analyze-message",
        json=payload,
        headers={"X-Internal-Api-Key": "wrong-secret"}
    )
    assert res_wrong_auth.status_code == 401


def test_analyze_academic_announcement_complex():
    """Kiểm tra tin nhắn thông báo phức tạp (báo nghỉ t7 24/10 + học bù t2 26/10 tiết 1-3)."""
    payload = {
        "current_datetime": "2026-10-22T15:20:00+07:00",  # Thứ Năm 22/10
        "subject_name": "Lập trình Web",
        "default_room": "401-A1",
        "sender_name": "Lớp trưởng Nam",
        "message_text": "Ae chú ý t7 tuần này (24/10) thầy bận nên nghỉ nhé, chuyển sang học bù sáng t2 tuần sau tiết 1-3 ở phòng 305-A2."
    }

    response = client.post("/ai/analyze-message", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()

    assert data["is_academic_announcement"] is True
    assert data["confidence_score"] > 0.8
    assert len(data["detected_events"]) == 2

    # Buổi nghỉ phải là thứ 7 (24/10/2026)
    cancel = next(e for e in data["detected_events"] if e["event_type"] == "CANCELLED_CLASS")
    assert "2026-10-24" in cancel["start_datetime"]
    assert "07:00:00" in cancel["start_datetime"]
    assert "09:35:00" in cancel["end_datetime"]

    # Buổi học bù phải là thứ 2 tuần sau (26/10/2026)
    makeup = next(e for e in data["detected_events"] if e["event_type"] == "MAKEUP_CLASS")
    assert "2026-10-26" in makeup["start_datetime"]
    assert "07:00:00" in makeup["start_datetime"]
    assert "09:35:00" in makeup["end_datetime"]
    assert "305-A2" in makeup["room"]


def test_analyze_exam_announcement():
    """Kiểm tra tin nhắn thông báo lịch kiểm tra."""
    payload = {
        "current_datetime": "2026-10-22T10:00:00+07:00",
        "subject_name": "An toàn bảo mật thông tin",
        "default_room": "502-A1",
        "sender_name": "Giảng viên",
        "message_text": "Tuần sau thứ 5 cả lớp kiểm tra giữa kỳ 45 phút nhé."
    }

    response = client.post("/ai/analyze-message", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()

    assert data["is_academic_announcement"] is True
    assert any(e["event_type"] == "EXAM" for e in data["detected_events"])


def test_analyze_banter_with_subwords():
    """Kiểm tra tin nhắn tán gẫu có từ con (ví dụ: 'thiết kế' chứa 'thi') không bị nhận nhầm."""
    payload = {
        "current_datetime": "2026-10-22T11:45:00+07:00",
        "subject_name": "Lập trình Web",
        "default_room": "401-A1",
        "sender_name": "Tuấn",
        "message_text": "Thiết kế slide đẹp thế, trưa nay có ai đi ăn cơm tấm không ae?"
    }

    response = client.post("/ai/analyze-message", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()

    assert data["is_academic_announcement"] is False
    assert len(data["detected_events"]) == 0


def test_analyze_short_greeting():
    """Kiểm tra tin nhắn ngắn không có nội dung học vụ."""
    payload = {
        "current_datetime": "2026-10-22T08:00:00+07:00",
        "subject_name": "Lập trình Web",
        "default_room": "401-A1",
        "sender_name": "Hải",
        "message_text": "alo alo ae"
    }

    response = client.post("/ai/analyze-message", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()

    assert data["is_academic_announcement"] is False
    assert len(data["detected_events"]) == 0


def test_parse_message_alias_endpoint():
    """Kiểm tra endpoint alias /v1/zalo/parse-message tương thích AGENT.md."""
    payload = {
        "current_datetime": "2026-10-22T15:20:00+07:00",
        "subject_name": "Mạng máy tính",
        "default_room": "203-A2",
        "sender_name": "Bí thư",
        "message_text": "Thứ 6 tuần này lớp mình nghỉ học nhé ae."
    }

    response = client.post("/v1/zalo/parse-message", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()

    assert data["is_academic_announcement"] is True
    assert len(data["detected_events"]) >= 1
    assert data["detected_events"][0]["event_type"] == "CANCELLED_CLASS"


def test_analyze_image_payload_mock():
    """Kiểm tra xử lý tin nhắn hình ảnh không có caption trong Mock mode."""
    # 1x1 transparent PNG base64
    dummy_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    payload = {
        "current_datetime": "2026-10-22T15:20:00+07:00",
        "subject_name": "Kiến trúc máy tính",
        "default_room": "501-A1",
        "sender_name": "Lớp trưởng",
        "message_text": "",
        "image_base64": dummy_b64,
        "image_mime_type": "image/png"
    }

    response = client.post("/ai/analyze-message", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()

    assert data["is_academic_announcement"] is True
    assert len(data["detected_events"]) == 1
    event = data["detected_events"][0]
    assert event["event_type"] == "MAKEUP_CLASS"
    assert "từ ảnh" in event["title"]
    assert event["room"] == "501-A1"
    assert "+07:00" in event["start_datetime"]


def test_analyze_image_with_caption_mock():
    """Kiểm tra xử lý tin nhắn hình ảnh có kèm caption đổi phòng."""
    dummy_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    payload = {
        "current_datetime": "2026-10-22T15:20:00+07:00",
        "subject_name": "Hệ điều hành",
        "default_room": "401-A1",
        "sender_name": "Giảng viên",
        "message_text": "Lớp chú ý ảnh thông báo: ngày mai đổi phòng sang 502-A2 nhé",
        "image_base64": dummy_b64,
        "image_mime_type": "image/png"
    }

    response = client.post("/ai/analyze-message", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()

    assert data["is_academic_announcement"] is True
    assert len(data["detected_events"]) >= 1
    assert data["detected_events"][0]["event_type"] == "ROOM_CHANGE"
    assert data["detected_events"][0]["room"] == "502-A2"


def test_analyze_two_shifts_student_group_a_to_l():
    """Kiểm tra tin nhắn chia 2 ca với sinh viên tên nhóm A-L (Nguyễn Việt Doanh -> Ca 1)."""
    payload = {
        "current_datetime": "2026-10-22T15:20:00+07:00",
        "subject_name": "Lập trình Web",
        "default_room": "401-A1",
        "sender_name": "Lớp trưởng",
        "student_name": "Nguyễn Việt Doanh",
        "message_text": "Lớp chia 2 ca thực hành: Ca 1 từ tiết 1-3, Ca 2 từ tiết 4-6 chia theo danh sách tên."
    }

    response = client.post("/ai/analyze-message", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()

    assert data["is_academic_announcement"] is True
    # Tuyệt đối không được xếp cả 2 ca vào lịch học
    assert len(data["detected_events"]) == 1
    event = data["detected_events"][0]
    assert "Ca 1" in event["title"]
    assert "Tiết 1-3" in event["title"]
    assert "A-L" in event["note"]


def test_analyze_two_shifts_student_group_m_to_z():
    """Kiểm tra tin nhắn chia 2 ca với sinh viên tên nhóm M-Z (Lê Minh Tuấn -> Ca 2)."""
    payload = {
        "current_datetime": "2026-10-22T15:20:00+07:00",
        "subject_name": "Lập trình Web",
        "default_room": "401-A1",
        "sender_name": "Lớp trưởng",
        "student_name": "Lê Minh Tuấn",
        "message_text": "Lớp chia 2 ca thực hành: Ca 1 từ tiết 1-3, Ca 2 từ tiết 4-6 chia theo danh sách tên."
    }

    response = client.post("/ai/analyze-message", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()

    assert data["is_academic_announcement"] is True
    # Tuyệt đối không được xếp cả 2 ca vào lịch học
    assert len(data["detected_events"]) == 1
    event = data["detected_events"][0]
    assert "Ca 2" in event["title"]
    assert "Tiết 4-6" in event["title"]
    assert "M-Z" in event["note"]


def test_analyze_tiet_bd_and_so_tiet():
    """Kiểm tra bóc tách thông tin Tiết BĐ và Số tiết (ví dụ: Tiết BĐ: 4, Số tiết: 3 -> Tiết 4-6: 09:40-12:15)."""
    payload = {
        "current_datetime": "2026-10-22T15:20:00+07:00",
        "subject_name": "Kiến trúc máy tính",
        "default_room": "401-A1",
        "sender_name": "Giảng viên",
        "student_name": "Nguyễn Việt Doanh",
        "message_text": "Thông báo lịch học bù: ngày mai Tiết BĐ: 4, Số tiết: 3 tại phòng 401-A1."
    }

    response = client.post("/ai/analyze-message", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()

    assert data["is_academic_announcement"] is True
    assert len(data["detected_events"]) == 1
    event = data["detected_events"][0]
    assert "Tiết 4-6" in event["title"]
    assert "09:40:00+07:00" in event["start_datetime"]
    assert "12:15:00+07:00" in event["end_datetime"]


def test_analyze_two_shifts_accented_vietnamese_names():
    """Kiểm tra nhận diện đúng ca cho các tên tiếng Việt có dấu phức tạp (Ánh -> Ca 1, Đạt -> Ca 1, Út -> Ca 2)."""
    from app.services.gemini_service import get_student_shift

    assert get_student_shift("Nguyễn Thị Ánh") == 1  # Ánh -> A -> Ca 1
    assert get_student_shift("Lê Văn Đạt") == 1       # Đạt -> D -> Ca 1
    assert get_student_shift("Phan Văn Đức") == 1     # Đức -> D -> Ca 1
    assert get_student_shift("Lê Minh Tuấn") == 2     # Tuấn -> T -> Ca 2
    assert get_student_shift("Vũ Thị Út") == 2        # Út -> U -> Ca 2
    assert get_student_shift("Hoàng Yến") == 2        # Yến -> Y -> Ca 2


def test_enforce_single_shift_same_day_unlabelled():
    """Kiểm tra loại bỏ 1 ca khi có 2 sự kiện cùng ngày không gắn nhãn 'Ca 1'/'Ca 2'."""
    from app.services.gemini_service import enforce_single_shift
    from app.schemas import DetectedEventItem

    e1 = DetectedEventItem(
        event_type="MAKEUP_CLASS",
        title="Lịch học: Lập trình Web",
        start_datetime="2026-10-28T07:00:00+07:00",
        end_datetime="2026-10-28T09:35:00+07:00",
        room="401-A1"
    )
    e2 = DetectedEventItem(
        event_type="MAKEUP_CLASS",
        title="Lịch học: Lập trình Web",
        start_datetime="2026-10-28T09:40:00+07:00",
        end_datetime="2026-10-28T12:15:00+07:00",
        room="401-A1"
    )

    # Sinh viên Doanh (A-L: Ca 1) -> Giữ ca sớm (07:00)
    filtered_ca1 = enforce_single_shift([e1, e2], "Nguyễn Việt Doanh")
    assert len(filtered_ca1) == 1
    assert filtered_ca1[0].start_datetime == "2026-10-28T07:00:00+07:00"

    # Sinh viên Tuấn (M-Z: Ca 2) -> Giữ ca muộn (09:40)
    filtered_ca2 = enforce_single_shift([e1, e2], "Lê Minh Tuấn")
    assert len(filtered_ca2) == 1
    assert filtered_ca2[0].start_datetime == "2026-10-28T09:40:00+07:00"



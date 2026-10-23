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

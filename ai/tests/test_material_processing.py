import io
import pytest
from starlette.testclient import TestClient

from app.errors import AIEngineError
from app.main import app
from app.services.extractor_service import extract_text_from_file
from app.services.gemini_service import ai_service


def test_extract_text_from_txt_file():
    content = "Đề cương ôn tập môn Lập trình Web với Spring Boot và ReactJS. Nội dung gồm kiến trúc MVC, RESTful API và cơ chế bảo mật JWT."
    raw_bytes = content.encode("utf-8")
    result = extract_text_from_file(raw_bytes, "de_cuong.txt")
    assert result.char_count > 30
    assert "Spring Boot" in result.text
    assert result.page_count == 1


def test_extract_text_empty_file():
    with pytest.raises(AIEngineError) as exc_info:
        extract_text_from_file(b"", "empty.txt")
    assert exc_info.value.error_code == "EMPTY_FILE"


def test_extract_text_unsupported_extension():
    with pytest.raises(AIEngineError) as exc_info:
        extract_text_from_file(b"some content that is long enough to pass", "malicious.exe")
    assert exc_info.value.error_code == "INVALID_FILE_TYPE"


def test_extract_text_too_short():
    with pytest.raises(AIEngineError) as exc_info:
        extract_text_from_file(b"Short", "short.txt")
    assert exc_info.value.error_code == "MATERIAL_PARSE_FAILED"


import asyncio


def test_process_material_service():
    sample_text = """
    Môn học: Lập trình Web
    Chương 1: Kiến trúc RESTful API
    - REST là phong cách kiến trúc phần mềm hướng tài nguyên.
    - Phương thức HTTP: GET (đọc), POST (tạo), PUT (cập nhật toàn bộ), DELETE (xóa).
    - HTTP Status: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found.
    """
    response = asyncio.run(ai_service.process_material(sample_text, "Lập trình Web"))
    assert response.summary_markdown is not None
    assert response.extracted_text == sample_text
    assert "## 1. Khái niệm cốt lõi" in response.summary_markdown
    assert "## 2. Công thức & Quy tắc cần nhớ" in response.summary_markdown
    assert "## 3. Các câu hỏi thường gặp" in response.summary_markdown

    # Kiểm tra Speed Quiz
    assert len(response.speed_quiz) >= 5
    for q in response.speed_quiz:
        assert len(q.options) == 4
        assert 0 <= q.correct_index <= 3
        assert len(q.question.strip()) > 0
        assert len(q.explanation.strip()) > 0

    # Kiểm tra Memory Match
    assert len(response.memory_match_pairs) >= 6
    for pair in response.memory_match_pairs:
        assert pair.pair_id > 0
        assert len(pair.term.strip()) > 0
        assert len(pair.definition.strip()) > 0


def test_api_process_material_file():
    client = TestClient(app)
    file_content = "Đề cương môn Cơ sở dữ liệu: Hệ quản trị CSDL quan hệ PostgreSQL, B-Tree Index, Khóa chính, Khóa ngoại, Chuẩn hóa 1NF, 2NF, 3NF và Giao dịch ACID."
    files = {
        "file": ("csdl.txt", io.BytesIO(file_content.encode("utf-8")), "text/plain")
    }
    data = {
        "subject_name": "Cơ sở dữ liệu"
    }
    headers = {
        "X-Internal-Api-Key": "test-internal-key"
    }

    response = client.post("/v1/materials/process", files=files, data=data, headers=headers)
    assert response.status_code == 200
    json_data = response.json()
    assert "summary_markdown" in json_data
    assert "extracted_text" in json_data
    assert "PostgreSQL" in json_data["extracted_text"]
    assert "speed_quiz" in json_data
    assert "memory_match_pairs" in json_data
    assert len(json_data["speed_quiz"]) >= 5


def test_api_process_material_text():
    client = TestClient(app)
    payload = {
        "subject_name": "Mạng máy tính",
        "text": "Mô hình OSI 7 tầng: Vật lý, Liên kết dữ liệu, Mạng, Giao vận, Phiên, Thuyết trình, Ứng dụng. Giao thức TCP hướng kết nối tin cậy và UDP phi kết nối tốc độ cao."
    }
    headers = {
        "X-Internal-Api-Key": "test-internal-key"
    }

    response = client.post("/v1/materials/process-text", json=payload, headers=headers)
    assert response.status_code == 200
    json_data = response.json()
    assert len(json_data["memory_match_pairs"]) >= 6


def test_api_summarize_material_file():
    client = TestClient(app)
    file_content = "# Đề cương An toàn thông tin\n- Mật mã học đối xứng: AES, DES\n- Mật mã học bất đối xứng: RSA, ECC\n- Chữ ký số và Hàm băm SHA-256"
    files = {
        "file": ("attt.txt", io.BytesIO(file_content.encode("utf-8")), "text/plain")
    }
    data = {
        "subject_name": "An toàn thông tin"
    }
    headers = {
        "X-Internal-Api-Key": "test-internal-key"
    }

    response = client.post("/v1/materials/summarize", files=files, data=data, headers=headers)
    assert response.status_code == 200
    json_data = response.json()
    assert "summary_markdown" in json_data
    assert "extracted_text" in json_data
    assert "AES, DES" in json_data["extracted_text"]
    assert "## 1. Khái niệm cốt lõi" in json_data["summary_markdown"]


def test_api_generate_minigames():
    client = TestClient(app)
    payload = {
        "subject_name": "An toàn thông tin",
        "summary_markdown": "## 1. Khái niệm cốt lõi\n- AES: Thuật toán mã hóa đối xứng\n- RSA: Thuật toán mã hóa khóa công khai\n- SHA-256: Hàm băm an toàn 256-bit"
    }
    headers = {
        "X-Internal-Api-Key": "test-internal-key"
    }

    response = client.post("/v1/materials/generate-minigames", json=payload, headers=headers)
    assert response.status_code == 200
    json_data = response.json()
    assert "speed_quiz" in json_data
    assert "memory_match_pairs" in json_data
    assert len(json_data["speed_quiz"]) == 10
    assert len(json_data["memory_match_pairs"]) == 8

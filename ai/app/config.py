import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# Nạp ai/.env nếu có. load_dotenv KHÔNG ghi đè biến đã tồn tại trong môi trường,
# nên test (conftest.py) có thể ép AI_MODE=mock trước khi import app.
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path if _env_path.exists() else None)

_PLACEHOLDER_KEYS = {"", "your_gemini_api_key_here", "YOUR_GEMINI_API_KEY"}
_VALID_MODES = {"live", "mock"}


@dataclass(frozen=True)
class Settings:
    port: int
    host: str
    ai_mode: str
    gemini_api_key: str
    gemini_model: str
    gemini_timeout_ms: int
    internal_api_key: str

    @property
    def is_mock_mode(self) -> bool:
        """Mock CHỈ khi người dùng chủ động đặt AI_MODE=mock.

        Không tự chuyển sang mock khi thiếu key hoặc khi Gemini lỗi: dữ liệu giả
        sẽ bị backend lưu như kết quả thật.
        """
        return self.ai_mode == "mock"

    @property
    def is_live_configured(self) -> bool:
        return self.gemini_api_key not in _PLACEHOLDER_KEYS and bool(self.gemini_model)


def _load_settings() -> Settings:
    ai_mode = os.getenv("AI_MODE", "live").strip().lower()
    if ai_mode not in _VALID_MODES:
        raise ValueError(f"AI_MODE không hợp lệ: '{ai_mode}'. Chỉ chấp nhận: {sorted(_VALID_MODES)}")

    return Settings(
        port=int(os.getenv("PORT", "8000")),
        host=os.getenv("HOST", "127.0.0.1"),
        ai_mode=ai_mode,
        gemini_api_key=os.getenv("GEMINI_API_KEY", "").strip(),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip(),
        gemini_timeout_ms=int(os.getenv("GEMINI_TIMEOUT_MS", "30000")),
        # Không có giá trị mặc định: thiếu key thì mọi endpoint nội bộ bị từ chối (fail closed).
        internal_api_key=os.getenv("INTERNAL_API_KEY", "").strip(),
    )


settings = _load_settings()

import os
import pytest

# Thiết lập môi trường test offline trước khi app import
os.environ["AI_MODE"] = "mock"
os.environ["INTERNAL_API_KEY"] = "test-internal-key"
os.environ["GEMINI_MODEL"] = "gemini-3.8-flash"

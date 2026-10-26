class AIEngineError(Exception):
    """Lỗi nghiệp vụ trả về cho backend theo contract `{error_code, message}` (AGENT.md §8.3)."""

    def __init__(self, error_code: str, message: str, status_code: int):
        super().__init__(message)
        self.error_code = error_code
        self.message = message
        self.status_code = status_code

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, Form, Header, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field

from app.config import settings
from app.errors import AIEngineError
from app.playground import get_playground_html
from app.schemas import (
    AnalyzeMessageRequest,
    AnalyzeMessageResponse,
    ErrorResponse,
    GenerateMinigamesRequest,
    GenerateMinigamesResponse,
    ProcessMaterialResponse,
    SummarizeMaterialResponse,
)
from app.services.extractor_service import extract_text_from_file
from app.services.gemini_service import ai_service

# Thiết lập logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("unisync-ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("UniSync AI Engine (FastAPI) đang khởi động...")
    logger.info(f"Port: {settings.port} | Model: {settings.gemini_model}")
    if settings.is_mock_mode:
        logger.info("Trạng thái: Đang chạy ở MOCK MODE (An toàn, sẵn sàng phục vụ test/demo).")
    else:
        logger.info("Trạng thái: Đang chạy ở LIVE MODE (Google Gemini API).")
    logger.info("=" * 60)
    yield
    logger.info("UniSync AI Engine đang dừng...")


app = FastAPI(
    title="UniSync AI Engine",
    description="Microservice bóc tách tin nhắn học vụ từ Zalo vào Thời khóa biểu và sinh học liệu ôn thi.",
    version="1.0.0",
    lifespan=lifespan
)

# Chỉ mở CORS nội bộ cho Backend và Frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(AIEngineError)
async def ai_engine_error_handler(request: Request, exc: AIEngineError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error_code": exc.error_code, "message": exc.message}
    )


def verify_internal_api_key(x_internal_api_key: str | None = Header(None, alias="X-Internal-Api-Key")):
    """Bảo vệ endpoint nội bộ bằng X-Internal-Api-Key nếu được cấu hình (AGENT.md §3)."""
    if not settings.internal_api_key:
        return True
    if not x_internal_api_key or x_internal_api_key != settings.internal_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "UNAUTHORIZED_INTERNAL_CALL", "message": "Sai hoặc thiếu X-Internal-Api-Key header"}
        )
    return True


@app.get("/", response_class=HTMLResponse, tags=["Playground"], summary="Giao diện thử nghiệm trực quan (Playground UI)")
@app.get("/playground", response_class=HTMLResponse, tags=["Playground"], include_in_schema=False)
async def playground_page():
    """Giao diện Web trực quan để kiểm thử bóc tách tin nhắn với Gemini AI."""
    return HTMLResponse(
        content=get_playground_html(
            model_name=settings.gemini_model,
            mode="mock" if settings.is_mock_mode else "live",
            internal_api_key=settings.internal_api_key or ""
        )
    )


@app.get("/health", tags=["Health"])
async def health_check():
    """Kiểm tra tình trạng hoạt động của AI Service."""
    return {
        "status": "ok",
        "service": "unisync-ai-engine",
        "mode": "mock" if settings.is_mock_mode else "live",
        "model": settings.gemini_model
    }


@app.post(
    "/ai/analyze-message",
    response_model=AnalyzeMessageResponse,
    responses={
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    tags=["Zalo AI PoC"],
    summary="Bóc tách tin nhắn Zalo thành sự kiện học vụ (Chuẩn PoC Plan)"
)
async def analyze_zalo_message(
    request: AnalyzeMessageRequest,
    x_internal_api_key: str | None = Header(None, alias="X-Internal-Api-Key")
):
    verify_internal_api_key(x_internal_api_key)
    return await ai_service.analyze_message(request)


@app.post(
    "/v1/zalo/parse-message",
    response_model=AnalyzeMessageResponse,
    responses={
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    tags=["UniSync Specification"],
    summary="Bóc tách tin nhắn Zalo thành sự kiện học vụ (Chuẩn AGENT.md / PRD)"
)
async def parse_zalo_message_alias(
    request: AnalyzeMessageRequest,
    x_internal_api_key: str | None = Header(None, alias="X-Internal-Api-Key")
):
    return await analyze_zalo_message(request, x_internal_api_key)


class ProcessTextRequest(BaseModel):
    subject_name: str = Field(..., description="Tên môn học")
    text: str = Field(..., min_length=30, description="Nội dung văn bản đề cương")


@app.post(
    "/v1/materials/summarize",
    response_model=SummarizeMaterialResponse,
    responses={
        400: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
    tags=["Module 4: Study Materials & Minigames"],
    summary="Bóc tách file đề cương (.pdf, .docx, .txt) và chỉ tóm tắt Smart Cheatsheet (Giai đoạn 1)"
)
async def summarize_material_file(
    file: UploadFile = File(..., description="File đề cương, bài giảng hoặc ghi chú ôn tập (.pdf, .docx, .txt)"),
    subject_name: str = Form(..., description="Tên môn học tương ứng"),
    x_internal_api_key: str | None = Header(None, alias="X-Internal-Api-Key")
):
    verify_internal_api_key(x_internal_api_key)
    file_bytes = await file.read()
    extracted = extract_text_from_file(file_bytes, file.filename or "unknown.txt")
    return await ai_service.summarize_material(extracted.text, subject_name)


@app.post(
    "/v1/materials/generate-minigames",
    response_model=GenerateMinigamesResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
    tags=["Module 4: Study Materials & Minigames"],
    summary="Sinh bộ câu hỏi Quiz & Ghép thẻ từ bản tóm tắt đề cương (Giai đoạn 2)"
)
async def generate_minigames_from_summary(
    request: GenerateMinigamesRequest,
    x_internal_api_key: str | None = Header(None, alias="X-Internal-Api-Key")
):
    verify_internal_api_key(x_internal_api_key)
    return await ai_service.generate_minigames(request.summary_markdown, request.subject_name)


@app.post(
    "/v1/materials/process",
    response_model=ProcessMaterialResponse,
    responses={
        400: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
    tags=["Module 4: Study Materials & Minigames"],
    summary="Bóc tách file đề cương (.pdf, .docx, .txt) và sinh Cheatsheet"
)
async def process_material_file(
    file: UploadFile = File(..., description="File đề cương, bài giảng hoặc ghi chú ôn tập (.pdf, .docx, .txt)"),
    subject_name: str = Form(..., description="Tên môn học tương ứng"),
    x_internal_api_key: str | None = Header(None, alias="X-Internal-Api-Key")
):
    verify_internal_api_key(x_internal_api_key)
    file_bytes = await file.read()
    extracted = extract_text_from_file(file_bytes, file.filename or "unknown.txt")
    return await ai_service.process_material(extracted.text, subject_name)


@app.post(
    "/v1/materials/process-text",
    response_model=ProcessMaterialResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
    tags=["Module 4: Study Materials & Minigames"],
    summary="Sinh lại Cheatsheet + Minigame từ văn bản đề cương đã bóc tách"
)
async def process_material_text(
    request: ProcessTextRequest,
    x_internal_api_key: str | None = Header(None, alias="X-Internal-Api-Key")
):
    verify_internal_api_key(x_internal_api_key)
    return await ai_service.process_material(request.text, request.subject_name)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)

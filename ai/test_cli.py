"""Công cụ dòng lệnh tương tác giúp bạn thử nghiệm mô hình Gemini nhanh chóng và trực quan.

Cách chạy:
    cd ai
    python test_cli.py
"""
import asyncio
import json
import os
import sys
from datetime import datetime, timedelta, timezone

# Đảm bảo in tiếng Việt trên console Windows UTF-8
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv

# Nạp cấu hình từ .env
env_file = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_file)

from app.config import settings
from app.schemas import AnalyzeMessageRequest
from app.services.gemini_service import ai_service

# Các mẫu tin nhắn thực tế để test nhanh
SAMPLE_MESSAGES = [
    {
        "name": "Báo nghỉ học & Học bù có đổi phòng (Tiết 1-3)",
        "subject": "Lập trình Web",
        "room": "401-A1",
        "sender": "Lớp trưởng Nam",
        "text": "Ae chú ý t7 tuần này (24/10) thầy bận nên nghỉ nhé, chuyển sang học bù sáng t2 tuần sau tiết 1-3 ở phòng 305-A2."
    },
    {
        "name": "Báo học bù ca chiều (Tiết 7-9) & Lịch kiểm tra",
        "subject": "Cơ sở dữ liệu",
        "room": "203-A2",
        "sender": "Bí thư Thảo",
        "text": "Thông báo: Chiều thứ 4 tuần sau lớp mình học bù tiết 7-9 tại phòng 502-A1 nhé. Thứ 6 tuần sau nữa kiểm tra giữa kỳ 45 phút luôn."
    },
    {
        "name": "Thông báo Deadline nộp Bài tập lớn (BTL)",
        "subject": "Công nghệ phần mềm",
        "room": "301-B1",
        "sender": "Lớp phó học tập",
        "text": "Nhắc cả lớp: Hạn chót nộp bài tập lớn và slide thuyết trình là 23h59 chủ nhật tuần sau (01/11). Nhóm nào nộp muộn bị trừ điểm."
    },
    {
        "name": "Tin nhắn tán gẫu sinh viên (Không có lịch học)",
        "subject": "Lập trình Web",
        "room": "401-A1",
        "sender": "Tuấn",
        "text": "Thiết kế slide đẹp thế, trưa nay tan học có ai đi ăn cơm tấm ở cổng phụ với tui không ae ơi?"
    }
]


def print_banner():
    print("\n" + "=" * 65)
    print("      UniSync AI Engine - Công cụ Thử Nghiệm Mô Hình Gemini")
    print("=" * 65)
    print(f"  • Chế độ (AI_MODE): {settings.ai_mode.upper()}")
    print(f"  • Mô hình (MODEL) : {settings.gemini_model}")
    print(f"  • API Key         : {'Đã cấu hình (' + settings.gemini_api_key[:6] + '...' + settings.gemini_api_key[-4:] + ')' if settings.gemini_api_key else 'Chưa có'}")
    print("=" * 65)


async def analyze_and_display(subject: str, room: str, sender: str, text: str):
    tz_vn = timezone(timedelta(hours=7))
    now_iso = datetime.now(tz=tz_vn).isoformat()

    req = AnalyzeMessageRequest(
        current_datetime=now_iso,
        subject_name=subject,
        default_room=room,
        sender_name=sender,
        message_text=text
    )

    print("\n⏳ Đang gửi tin nhắn tới Gemini AI...")
    t0 = datetime.now()
    try:
        res = await ai_service.analyze_message(req)
        elapsed = (datetime.now() - t0).total_seconds()

        print(f"\n✅ Đã nhận kết quả sau {elapsed:.2f} giây:")
        print(f"  • Nhận diện học vụ: {'ĐÚNG (Có thông báo lịch)' if res.is_academic_announcement else 'KHÔNG (Tin nhắn tán gẫu)'}")
        print(f"  • Độ tin cậy (Confidence): {res.confidence_score * 100:.1f}%")
        print(f"  • Số sự kiện phát hiện  : {len(res.detected_events)}")

        if not res.detected_events:
            print("\n  👉 Không có sự kiện nào được đưa lên Thời khóa biểu (Hệ thống tự động bỏ qua).")
        else:
            print("\n  📅 DANH SÁCH SỰ KIỆN ĐƯỢC ĐIỀN VÀO THỜI KHÓA BIỂU:")
            for idx, e in enumerate(res.detected_events, start=1):
                icon = {
                    "CANCELLED_CLASS": "⬜ [BÁO NGHỈ]",
                    "MAKEUP_CLASS": "🟧 [HỌC BÙ]",
                    "EXAM": "🟥 [KIỂM TRA/THI]",
                    "DEADLINE": "🟥 [HẠN NỘP BÀI]",
                    "REGULAR_CLASS": "🟦 [LỊCH HỌC]"
                }.get(e.event_type, "📌")

                print(f"\n    {idx}. {icon} {e.title}")
                print(f"       - Loại sự kiện: {e.event_type}")
                print(f"       - Thời gian   : {e.start_datetime} -> {e.end_datetime}")
                print(f"       - Phòng học   : {e.room or 'Chưa xác định'}")
                if e.note:
                    print(f"       - Ghi chú     : {e.note}")

        # In JSON thu nhỏ
        print("\n  📦 Raw JSON Output:")
        print("  " + json.dumps(res.model_dump(), ensure_ascii=False, indent=2).replace("\n", "\n  "))

    except Exception as exc:
        print(f"\n❌ Lỗi khi phân tích: {exc}")


async def main():
    print_banner()

    while True:
        print("\nChọn chức năng thử nghiệm:")
        for idx, sample in enumerate(SAMPLE_MESSAGES, start=1):
            print(f"  [{idx}] Mẫu {idx}: {sample['name']}")
        print("  [5] ✍️  Tự nhập tin nhắn bất kỳ từ bàn phím")
        print("  [0] 🚪 Thoát")

        choice = input("\n👉 Nhập lựa chọn của bạn [0-5]: ").strip()

        if choice == "0":
            print("\nTạm biệt bạn! 👋\n")
            break

        if choice in ["1", "2", "3", "4"]:
            sample = SAMPLE_MESSAGES[int(choice) - 1]
            print("\n" + "-" * 55)
            print(f"Môn học: {sample['subject']} | Phòng: {sample['room']}")
            print(f"Người gửi: {sample['sender']}")
            print(f"Nội dung: \"{sample['text']}\"")
            print("-" * 55)
            await analyze_and_display(sample['subject'], sample['room'], sample['sender'], sample['text'])

        elif choice == "5":
            print("\n" + "-" * 55)
            subj = input("Tên môn học (nhấn Enter để dùng 'Lập trình Web'): ").strip() or "Lập trình Web"
            room = input("Phòng mặc định (nhấn Enter để dùng '401-A1'): ").strip() or "401-A1"
            sender = input("Người gửi (nhấn Enter để dùng 'Lớp trưởng'): ").strip() or "Lớp trưởng"
            print("Nhập nội dung tin nhắn tiếng lóng sinh viên (VD: 'thứ 3 tuần sau nghỉ học bù sang t5 tiết 4-6 phòng 302'):")
            text = input("👉 Nội dung: ").strip()

            if not text:
                print("⚠️ Nội dung không được để trống!")
                continue

            await analyze_and_display(subj, room, sender, text)
        else:
            print("⚠️ Lựa chọn không hợp lệ, vui lòng chọn lại!")


if __name__ == "__main__":
    asyncio.run(main())

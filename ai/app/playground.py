def get_playground_html(model_name: str, mode: str, internal_api_key: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UniSync AI Engine - Playground</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Plus Jakarta Sans', sans-serif; }}
  </style>
</head>
<body class="bg-[#F8F9FD] min-h-screen text-[#1E293B]">
  <!-- Header -->
  <header class="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] text-white py-6 px-6 shadow-md">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          UniSync Zalo-to-Calendar AI Engine
        </div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">AI Model Testing Playground</h1>
        <p class="text-white/80 text-sm mt-1">Thử nghiệm bóc tách tin nhắn tiếng lóng sinh viên thành sự kiện Thời khóa biểu</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-2 text-right">
          <div class="text-[11px] uppercase tracking-wider text-white/70 font-bold">Mô hình hoạt động</div>
          <div class="text-sm font-extrabold text-white flex items-center gap-1.5 justify-end">
            <span>✨</span> {model_name}
          </div>
        </div>
        <div class="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-2 text-center">
          <div class="text-[11px] uppercase tracking-wider text-white/70 font-bold">Chế độ</div>
          <span class="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold {'bg-emerald-400 text-slate-900' if mode == 'live' else 'bg-amber-400 text-slate-900'} uppercase">
            {mode}
          </span>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- Left Column: Input Form & Quick Samples -->
    <div class="lg:col-span-5 space-y-5">
      <!-- Quick Samples -->
      <div class="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <span>⚡</span> Mẫu tin nhắn thử nghiệm nhanh
        </h2>
        <div class="grid grid-cols-1 gap-2">
          <button onclick="loadSample(1)" class="text-left text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition">
            🟧 <span class="font-bold text-slate-800">Mẫu 1:</span> Báo nghỉ & Học bù có đổi phòng (Tiết 1-3)
          </button>
          <button onclick="loadSample(2)" class="text-left text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition">
            🟥 <span class="font-bold text-slate-800">Mẫu 2:</span> Học bù ca chiều (Tiết 7-9) & Kiểm tra giữa kỳ
          </button>
          <button onclick="loadSample(3)" class="text-left text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition">
            ⏰ <span class="font-bold text-slate-800">Mẫu 3:</span> Deadline nộp Bài tập lớn (BTL)
          </button>
          <button onclick="loadSample(4)" class="text-left text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition text-slate-600">
            💬 <span class="font-bold text-slate-700">Mẫu 4:</span> Tán gẫu sinh viên (Không tạo lịch)
          </button>
        </div>
      </div>

      <!-- Input Form -->
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>✍️</span> Nhập tin nhắn cần phân tích
        </h2>

        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Môn học tương ứng</label>
          <input id="subjectInput" type="text" value="Lập trình Web" class="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Phòng mặc định</label>
            <input id="roomInput" type="text" value="401-A1" class="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">Người gửi tin</label>
            <input id="senderInput" type="text" value="Lớp trưởng Nam" class="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">Nội dung tin nhắn Zalo</label>
          <textarea id="messageInput" rows="5" class="w-full text-sm p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-slate-400" placeholder="Gõ thử tiếng lóng: 'thứ 3 tuần sau nghỉ học bù sang sáng thứ 5 tiết 1-3 phòng 302...'"></textarea>
        </div>

        <button id="submitBtn" onclick="runAnalyze()" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2">
          <span>🚀</span> Bóc tách bằng Gemini AI
        </button>
      </div>
    </div>

    <!-- Right Column: Results & Event Cards -->
    <div class="lg:col-span-7 space-y-5">
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 min-h-[500px]">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 class="text-base font-extrabold text-slate-900">Kết quả Trích xuất Lịch học vụ</h2>
            <p id="metaStatus" class="text-xs text-slate-500 mt-0.5">Sẵn sàng phân tích tin nhắn</p>
          </div>
          <div id="confidenceBadge" class="hidden"></div>
        </div>

        <!-- Loading Spinner -->
        <div id="loadingBox" class="hidden py-16 text-center">
          <div class="inline-block w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="mt-3 text-sm font-semibold text-slate-600">Đang gửi yêu cầu tới mô hình Gemini...</p>
        </div>

        <!-- Initial Placeholder -->
        <div id="placeholderBox" class="py-24 text-center">
          <span class="text-5xl block mb-3">📅</span>
          <p class="text-sm font-bold text-slate-600">Chưa có kết quả phân tích</p>
          <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Hãy bấm chọn một mẫu tin nhắn ở cột bên trái hoặc tự gõ thông báo rồi nhấn "Bóc tách bằng Gemini AI".</p>
        </div>

        <!-- Events List Container -->
        <div id="eventsContainer" class="hidden mt-5 space-y-3.5"></div>

        <!-- Non-academic message alert -->
        <div id="nonAcademicBox" class="hidden mt-8 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <span class="text-3xl block mb-2">💬</span>
          <h3 class="text-sm font-bold text-slate-800">Tin nhắn Tán gẫu / Giao tiếp Thông thường</h3>
          <p class="text-xs text-slate-500 mt-1">AI nhận diện đây không phải là thông báo học vụ. Hệ thống sẽ bỏ qua và không tạo sự kiện lên Thời khóa biểu.</p>
        </div>

        <!-- Raw JSON Viewer Accordion -->
        <div id="jsonAccordion" class="hidden mt-6 pt-5 border-t border-slate-100">
          <details class="group">
            <summary class="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-between">
              <span>Xem Structured JSON thô</span>
              <span class="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <pre id="jsonViewer" class="mt-3 p-4 rounded-xl bg-slate-900 text-emerald-400 text-xs overflow-x-auto font-mono"></pre>
          </details>
        </div>
      </div>
    </div>
  </main>

  <script>
    const SAMPLES = {{
      1: {{
        subject: "Lập trình Web",
        room: "401-A1",
        sender: "Lớp trưởng Nam",
        text: "Ae chú ý t7 tuần này (24/10) thầy bận nên nghỉ nhé, chuyển sang học bù sáng t2 tuần sau tiết 1-3 ở phòng 305-A2."
      }},
      2: {{
        subject: "Cơ sở dữ liệu",
        room: "203-A2",
        sender: "Bí thư Thảo",
        text: "Thông báo: Chiều thứ 4 tuần sau lớp mình học bù tiết 7-9 tại phòng 502-A1 nhé. Thứ 6 tuần sau nữa kiểm tra giữa kỳ 45 phút luôn."
      }},
      3: {{
        subject: "Công nghệ phần mềm",
        room: "301-B1",
        sender: "Lớp phó học tập",
        text: "Nhắc cả lớp: Hạn chót nộp bài tập lớn và slide thuyết trình là 23h59 chủ nhật tuần sau (01/11). Nhóm nào nộp muộn bị trừ điểm."
      }},
      4: {{
        subject: "Lập trình Web",
        room: "401-A1",
        sender: "Tuấn",
        text: "Thiết kế slide đẹp thế, trưa nay tan học có ai đi ăn cơm tấm ở cổng phụ với tui không ae ơi?"
      }}
    }};

    function loadSample(id) {{
      const s = SAMPLES[id];
      document.getElementById('subjectInput').value = s.subject;
      document.getElementById('roomInput').value = s.room;
      document.getElementById('senderInput').value = s.sender;
      document.getElementById('messageInput').value = s.text;
      runAnalyze();
    }}

    async function runAnalyze() {{
      const subject = document.getElementById('subjectInput').value.trim();
      const room = document.getElementById('roomInput').value.trim();
      const sender = document.getElementById('senderInput').value.trim();
      const text = document.getElementById('messageInput').value.trim();

      if (!text) {{
        alert("Vui lòng nhập nội dung tin nhắn!");
        return;
      }}

      // UI State
      document.getElementById('placeholderBox').classList.add('hidden');
      document.getElementById('eventsContainer').classList.add('hidden');
      document.getElementById('nonAcademicBox').classList.add('hidden');
      document.getElementById('jsonAccordion').classList.add('hidden');
      document.getElementById('loadingBox').classList.remove('hidden');
      document.getElementById('submitBtn').disabled = true;

      const t0 = performance.now();
      try {{
        const headers = {{ 'Content-Type': 'application/json' }};
        const internalKey = "{internal_api_key}";
        if (internalKey) {{
          headers['X-Internal-Api-Key'] = internalKey;
        }}

        const response = await fetch('/ai/analyze-message', {{
          method: 'POST',
          headers: headers,
          body: JSON.stringify({{
            current_datetime: new Date().toISOString(),
            subject_name: subject,
            default_room: room,
            sender_name: sender,
            message_text: text
          }})
        }});

        const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
        const data = await response.json();

        document.getElementById('loadingBox').classList.add('hidden');
        document.getElementById('submitBtn').disabled = false;

        if (!response.ok) {{
          alert("Lỗi phân tích: " + (data.message || JSON.stringify(data)));
          return;
        }}

        // Meta info
        document.getElementById('metaStatus').innerText = `Hoàn tất trong ${{elapsed}}s | Nhận diện ${{data.detected_events.length}} sự kiện`;
        const badge = document.getElementById('confidenceBadge');
        badge.className = "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800";
        badge.innerHTML = `<span>Độ tin cậy:</span> ${{Math.round(data.confidence_score * 100)}}%`;
        badge.classList.remove('hidden');

        // Render JSON
        document.getElementById('jsonViewer').innerText = JSON.stringify(data, null, 2);
        document.getElementById('jsonAccordion').classList.remove('hidden');

        if (!data.is_academic_announcement || data.detected_events.length === 0) {{
          document.getElementById('nonAcademicBox').classList.remove('hidden');
          return;
        }}

        // Render Cards
        const container = document.getElementById('eventsContainer');
        container.innerHTML = "";
        container.classList.remove('hidden');

        data.detected_events.forEach((e, idx) => {{
          let theme = {{
            border: "border-slate-300",
            bg: "bg-slate-50",
            tag: "bg-slate-200 text-slate-800",
            icon: "📌",
            label: e.event_type
          }};

          if (e.event_type === "MAKEUP_CLASS") {{
            theme = {{ border: "border-amber-300", bg: "bg-amber-50/60", tag: "bg-amber-100 text-amber-900", icon: "🟧", label: "HỌC BÙ" }};
          }} else if (e.event_type === "CANCELLED_CLASS") {{
            theme = {{ border: "border-slate-300", bg: "bg-slate-50", tag: "bg-slate-200 text-slate-700", icon: "⬜", label: "BÁO NGHỈ" }};
          }} else if (e.event_type === "EXAM") {{
            theme = {{ border: "border-rose-300", bg: "bg-rose-50/60", tag: "bg-rose-100 text-rose-900", icon: "🟥", label: "KIỂM TRA / THI" }};
          }} else if (e.event_type === "DEADLINE") {{
            theme = {{ border: "border-red-300", bg: "bg-red-50/60", tag: "bg-red-100 text-red-900", icon: "⏰", label: "HẠN NỘP BÀI" }};
          }}

          const card = document.createElement('div');
          card.className = `p-4 rounded-2xl border ${{theme.border}} ${{theme.bg}} transition hover:shadow-sm`;
          card.innerHTML = `
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <span>${{theme.icon}}</span>
                <span class="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${{theme.tag}}">${{theme.label}}</span>
              </div>
              <span class="text-[11px] font-bold text-slate-500">Phòng: ${{e.room || 'Phòng mặc định'}}</span>
            </div>
            <h4 class="text-sm font-extrabold text-slate-900 mt-2">${{e.title}}</h4>
            <div class="mt-2 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <span>🕒</span> ${{e.start_datetime}} → ${{e.end_datetime}}
            </div>
            ${{e.note ? `<p class="mt-1.5 text-xs text-slate-500 italic">Ghi chú: ${{e.note}}</p>` : ''}}
          `;
          container.appendChild(card);
        }});

      }} catch (err) {{
        document.getElementById('loadingBox').classList.add('hidden');
        document.getElementById('submitBtn').disabled = false;
        alert("Lỗi kết nối tới AI Service: " + err);
      }}
    }}

    // Tự động load mẫu 1 khi mở trang
    window.addEventListener('DOMContentLoaded', () => loadSample(1));
  </script>
</body>
</html>
"""

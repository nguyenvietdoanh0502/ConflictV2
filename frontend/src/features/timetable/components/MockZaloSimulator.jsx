import { useState } from "react";
import {
  Send,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  User
} from "lucide-react";
import {
  useGetZaloMappingsQuery,
  useSimulateZaloMessageMutation,
} from "../services/timetableApi";

const PRESET_MESSAGES = [
  {
    id: 1,
    title: "Mẫu 1: Báo nghỉ & Học bù đổi phòng (Tiết 1-3)",
    tag: "Nghỉ & Bù",
    sender: "Lớp trưởng Nam",
    text: "Ae chú ý t7 tuần này (24/10) thầy bận nên nghỉ nhé, chuyển sang học bù sáng t2 tuần sau tiết 1-3 ở phòng 305-A2.",
    color: "amber",
  },
  {
    id: 2,
    title: "Mẫu 2: Học bù chiều (Tiết 7-9) & Kiểm tra giữa kỳ",
    tag: "Bù & Ktra",
    sender: "Bí thư Thảo",
    text: "Thông báo: Chiều thứ 4 tuần sau lớp mình học bù tiết 7-9 tại phòng 502-A1 nhé. Thứ 6 tuần sau nữa kiểm tra giữa kỳ 45 phút luôn.",
    color: "rose",
  },
  {
    id: 3,
    title: "Mẫu 3: Deadline nộp Bài tập lớn (BTL)",
    tag: "Deadline",
    sender: "Lớp phó học tập",
    text: "Nhắc cả lớp: Hạn chót nộp bài tập lớn và slide thuyết trình là 23h59 chủ nhật tuần sau (01/11). Nhóm nào nộp muộn bị trừ điểm.",
    color: "red",
  },
  {
    id: 4,
    title: "Mẫu 4: Tán gẫu sinh viên (Không có lịch học)",
    tag: "Tán gẫu",
    sender: "Tuấn",
    text: "Thiết kế slide đẹp thế, trưa nay tan học có ai đi ăn cơm tấm ở cổng phụ với tui không ae ơi?",
    color: "slate",
  },
];

export default function MockZaloSimulator({ selectedGroupId, selectedGroupName }) {
  const { data: mappings = [] } = useGetZaloMappingsQuery();
  const [simulateMessage, { isLoading: isSimulating }] = useSimulateZaloMessageMutation();

  const [activeGroupId, setActiveGroupId] = useState("");
  const [senderName, setSenderName] = useState("Lớp trưởng");
  const [messageText, setMessageText] = useState(PRESET_MESSAGES[0].text);

  const [simulationLog, setSimulationLog] = useState(null);

  // Compute effective target group
  const effectiveGroupId =
    selectedGroupId ||
    activeGroupId ||
    (mappings.find((m) => m.active)?.zaloGroupId || (mappings[0]?.zaloGroupId || ""));

  const handleSelectPreset = (preset) => {
    setMessageText(preset.text);
    setSenderName(preset.sender);
  };

  const handleSendSimulation = async () => {
    if (!messageText.trim()) {
      alert("Vui lòng nhập nội dung tin nhắn!");
      return;
    }

    const t0 = performance.now();
    try {
      const response = await simulateMessage({
        zalo_group_id: effectiveGroupId || undefined,
        sender_name: senderName.trim() || "Lớp trưởng",
        message_text: messageText.trim(),
        current_datetime: new Date().toISOString(),
      }).unwrap();

      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      setSimulationLog({
        success: true,
        data: response.data || response,
        elapsed,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      });
    } catch (err) {
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      setSimulationLog({
        success: false,
        error: err.data?.message || err.message || "Lỗi xử lý tin nhắn",
        elapsed,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-sm shadow-indigo-200">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Zalo Message Simulator</h2>
            <p className="text-xs text-slate-500">
              Giả lập tin nhắn Zalo bóc tách thành lịch
              {selectedGroupName ? ` • ${selectedGroupName}` : ""}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          AI Engine Online
        </span>
      </div>

      {/* Group & Sender Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="text-[11px] font-bold text-slate-600">Nhóm Zalo đích *</label>
          <select
            value={effectiveGroupId}
            onChange={(e) => setActiveGroupId(e.target.value)}
            className="mt-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {mappings.length === 0 ? (
              <option value="">Chưa có nhóm nào (tạo ở cột trái)</option>
            ) : (
              mappings.map((m) => (
                <option key={m.id} value={m.zaloGroupId}>
                  {m.zaloGroupName} {m.active ? "🟢" : "⚪ (Tắt)"}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600">Người gửi tin nhắn</label>
          <div className="relative mt-1">
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="VD: Lớp trưởng Nam"
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Preset Message Chips */}
      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
          Mẫu tin nhắn sinh viên hay gửi:
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_MESSAGES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`p-2 rounded-xl border text-left transition text-xs flex flex-col justify-between ${
                messageText === preset.text
                  ? "bg-indigo-50/80 border-indigo-400 text-indigo-950 font-semibold"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              <span className="font-bold text-[11px] truncate">{preset.title.split(":")[0]}</span>
              <span className="text-[10px] text-slate-500 truncate mt-0.5">{preset.title.split(":")[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Textarea */}
      <div className="flex-1 flex flex-col min-h-[110px]">
        <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
          <span>Nội dung tin nhắn giả lập *</span>
          <span className="text-[10px] text-slate-400 font-mono">{messageText.length} ký tự</span>
        </label>
        <textarea
          rows={3}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Nhập tin nhắn tiếng lóng sinh viên (VD: thứ 3 tuần sau nghỉ học bù sang t5 tiết 4-6 phòng 302)..."
          className="flex-1 text-xs p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 leading-relaxed resize-none font-sans"
        />
      </div>

      {/* Action Button: Send */}
      <button
        onClick={handleSendSimulation}
        disabled={isSimulating}
        className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-extrabold shadow-md shadow-indigo-200 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {isSimulating ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Đang bóc tách qua AI Engine...
          </>
        ) : (
          <>
            <Send className="w-3.5 h-3.5" />
            Bắn tin nhắn thử nghiệm
          </>
        )}
      </button>

      {/* Live Activity & Log Box */}
      <div className="pt-2 border-t border-slate-100 flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Terminal className="w-3.5 h-3.5 text-indigo-500" />
            <span>Kết quả xử lý gần nhất:</span>
          </div>
          {simulationLog && (
            <span className="text-[10px] font-mono text-slate-400">
              {simulationLog.timestamp} ({simulationLog.elapsed}s)
            </span>
          )}
        </div>

        {!simulationLog ? (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-400 text-center">
            Chưa có tin nhắn giả lập nào được gửi. Bấm nút phía trên để trải nghiệm.
          </div>
        ) : simulationLog.success ? (
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{simulationLog.data.statusMessage || "Đã xử lý thành công!"}</span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-3">
              <span>Khớp lọc từ khóa: <strong>{simulationLog.data.matchedFilter ? "Có" : "Không"}</strong></span>
              <span>Sự kiện tạo mới: <strong className="text-emerald-700">{simulationLog.data.eventsCreated || 0}</strong></span>
            </div>

            {simulationLog.data.createdEvents && simulationLog.data.createdEvents.length > 0 && (
              <div className="mt-2 pt-2 border-t border-emerald-200/60 space-y-1">
                {simulationLog.data.createdEvents.map((e, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white border border-emerald-100 flex items-center justify-between gap-2">
                    <span className="font-bold text-[11px] text-slate-800 truncate">{e.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                      {e.eventType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Lỗi khi giả lập:</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{simulationLog.error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

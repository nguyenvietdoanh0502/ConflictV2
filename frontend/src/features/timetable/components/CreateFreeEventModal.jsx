import { useState, useEffect, useMemo } from "react";
import {
  CalendarPlus,
  Clock,
  MapPin,
  Tag,
  AlignLeft,
  X,
  Plus,
  Minus,
  Check,
  Sparkles,
  Calendar as CalendarIcon,
  AlertCircle
} from "lucide-react";
import { RAW_PERIODS, calculatePeriodRange, buildEventIsoStrings } from "../constants/periods";
import { useCreateScheduleEventMutation } from "../services/timetableApi";

const QUICK_TITLE_SUGGESTIONS = [
  "Học nhóm Đồ án",
  "Tự học thư viện",
  "Tham gia Hội thảo",
  "Sinh hoạt CLB",
  "Làm bài tập lớn",
  "Kiểm tra / Ôn thi",
];

const QUICK_ROOM_SUGGESTIONS = [
  "Phòng 302-A1",
  "Thư viện T2",
  "Lab 5 CNTT",
  "Quán café",
  "Online Zoom/Teams",
];

const EVENT_TYPES = [
  { value: "REGULAR_CLASS", label: "Lịch tự do", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "MAKEUP_CLASS", label: "Học bù", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "EXAM", label: "Kiểm tra / Thi", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "DEADLINE", label: "Hạn nộp bài", color: "bg-red-50 text-red-700 border-red-200" },
];

export default function CreateFreeEventModal({
  isOpen,
  onClose,
  initialDate,
  initialStartPeriod = 1,
  initialDuration = 2,
  onSuccess,
}) {
  const [createScheduleEvent, { isLoading }] = useCreateScheduleEventMutation();

  // Form states
  const [title, setTitle] = useState("");
  const [room, setRoom] = useState("");
  const [date, setDate] = useState("");
  const [startPeriod, setStartPeriod] = useState(1);
  const [duration, setDuration] = useState(2);
  const [eventType, setEventType] = useState("REGULAR_CLASS");
  const [note, setNote] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setTitle("");
      setRoom("");
      setNote("");
      setEventType("REGULAR_CLASS");

      // Format initial date to YYYY-MM-DD
      if (initialDate) {
        setDate(initialDate);
      } else {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        setDate(`${y}-${m}-${d}`);
      }

      const p = Math.max(1, Math.min(16, Number(initialStartPeriod) || 1));
      setStartPeriod(p);

      const maxDur = 16 - p + 1;
      const d = Math.max(1, Math.min(maxDur, Number(initialDuration) || 2));
      setDuration(d);
    }
  }, [isOpen, initialDate, initialStartPeriod, initialDuration]);

  // Max duration allowed given startPeriod
  const maxAllowedDuration = useMemo(() => {
    return Math.max(1, 16 - startPeriod + 1);
  }, [startPeriod]);

  // Adjust duration if startPeriod changes
  const handleStartPeriodChange = (newP) => {
    const p = Math.max(1, Math.min(16, Number(newP)));
    setStartPeriod(p);
    const maxDur = 16 - p + 1;
    if (duration > maxDur) {
      setDuration(maxDur);
    }
  };

  // Stepper handlers
  const handleIncreaseDuration = () => {
    if (duration < maxAllowedDuration) {
      setDuration((prev) => prev + 1);
    }
  };

  const handleDecreaseDuration = () => {
    if (duration > 1) {
      setDuration((prev) => prev - 1);
    }
  };

  // Range info calculation
  const periodRange = useMemo(() => {
    return calculatePeriodRange(startPeriod, duration);
  }, [startPeriod, duration]);

  // Formatted date string for Vietnamese display
  const formattedDateVietnamese = useMemo(() => {
    if (!date) return "";
    try {
      const parts = date.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
        const dayOfWeek = days[d.getDay()];
        return `${dayOfWeek}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      }
    } catch {
      // fallback
    }
    return date;
  }, [date]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Vui lòng nhập tên lịch!");
      return;
    }
    if (!date) {
      setErrorMsg("Vui lòng chọn ngày diễn ra!");
      return;
    }

    try {
      setErrorMsg("");
      const { startDatetime, endDatetime } = buildEventIsoStrings(date, startPeriod, duration);

      const payload = {
        title: title.trim(),
        room: room.trim() || null,
        eventType,
        startDatetime,
        endDatetime,
        subjectId: null, // Free event (not tied to subject)
        note: note.trim() || null,
      };

      await createScheduleEvent(payload).unwrap();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || "Không thể tạo lịch. Vui lòng thử lại!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-snug">
                Thêm lịch tự do
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Lịch cá nhân trên thời khóa biểu (không tuân theo môn học)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Time & Slot Overview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50 to-purple-50/30 border border-indigo-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Khung thời gian đã chọn
              </span>
              <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-indigo-600 text-white shadow-sm">
                {periodRange.periodLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Date Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ngày diễn ra:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition"
                  />
                </div>
                <p className="text-[10px] text-indigo-600 font-bold mt-1">
                  📅 {formattedDateVietnamese}
                </p>
              </div>

              {/* Start Period Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Bắt đầu từ tiết:
                </label>
                <select
                  value={startPeriod}
                  onChange={(e) => handleStartPeriodChange(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition"
                >
                  {RAW_PERIODS.map((p) => (
                    <option key={p.period} value={p.period}>
                      Tiết {p.period} ({p.start} - {p.end}) [{p.shift}]
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 font-medium mt-1">
                  ⏰ {periodRange.timeRangeText}
                </p>
              </div>
            </div>
          </div>

          {/* Field 1: Tên: (Bắt buộc) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-800 tracking-wide">
              Tên lịch / Sự kiện <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Tự học nhóm, Tham gia hội thảo, Học bù..."
                required
                autoFocus
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-inner"
              />
            </div>
            
            {/* Quick title suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_TITLE_SUGGESTIONS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setTitle(tag)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition border ${
                    title === tag
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-100/80 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border-slate-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Field 2: Vị trí: (Phòng học, địa điểm) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-800 tracking-wide flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Vị trí / Địa điểm
            </label>
            <div className="relative">
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ví dụ: Phòng 302-A1, Thư viện T2, Lab 5, Online Zoom..."
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-inner"
              />
            </div>

            {/* Quick room suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_ROOM_SUGGESTIONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRoom(r)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition border ${
                    room === r
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-100/80 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border-slate-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Field 3: Số tiết: (Thời lượng) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800 tracking-wide flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                Số tiết <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                (Tối đa {maxAllowedDuration} tiết từ Tiết {startPeriod})
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-1 shadow-inner">
                <button
                  type="button"
                  onClick={handleDecreaseDuration}
                  disabled={duration <= 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-40 disabled:hover:bg-transparent transition shadow-sm"
                  title="Giảm 1 tiết"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-14 text-center font-black text-sm text-slate-900">
                  {duration} <span className="text-[10px] font-bold text-slate-500">tiết</span>
                </div>
                <button
                  type="button"
                  onClick={handleIncreaseDuration}
                  disabled={duration >= maxAllowedDuration}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-40 disabled:hover:bg-transparent transition shadow-sm"
                  title="Tăng 1 tiết"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick duration buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((d) => {
                  const isDisabled = d > maxAllowedDuration;
                  return (
                    <button
                      type="button"
                      key={d}
                      disabled={isDisabled}
                      onClick={() => setDuration(d)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                        duration === d
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-700 border-slate-200 disabled:opacity-30 disabled:hover:bg-white"
                      }`}
                    >
                      {d} tiết
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calculated span preview */}
            <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between text-xs font-semibold text-purple-900 mt-2">
              <span>Độ dài trên TKB:</span>
              <span className="font-bold">
                {periodRange.periodLabel} ({periodRange.timeRangeText})
              </span>
            </div>
          </div>

          {/* Optional: Event Type */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-700">
              Phân loại sự kiện (Tùy chọn)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setEventType(t.value)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold transition border text-center ${
                    eventType === t.value
                      ? `${t.color} ring-2 ring-indigo-500/30 font-black shadow-sm`
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional: Ghi chú */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              Ghi chú (Tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nội dung cần chuẩn bị, tài liệu, link nhóm..."
              rows={2}
              className="w-full text-xs font-medium p-3 rounded-xl bg-slate-50/80 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-inner resize-none"
            />
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || !date}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-200 transition cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang thêm...</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-4 h-4" />
                <span>Thêm vào thời khóa biểu</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

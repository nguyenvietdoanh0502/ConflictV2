import { getLocalizedErrorMessage } from "../../../utils/errorMessages";
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
  AlertCircle,
  Layers,
  ArrowRight
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
  { value: "REGULAR_CLASS", label: "Lịch tự do", desc: "Học tập, sinh hoạt cá nhân", color: "bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300" },
  { value: "MAKEUP_CLASS", label: "Học bù", desc: "Buổi học bù tự bổ sung", color: "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300" },
  { value: "EXAM", label: "Kiểm tra / Thi", desc: "Lịch thi, kiểm tra giữa/cuối kỳ", color: "bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300" },
  { value: "DEADLINE", label: "Hạn nộp bài", desc: "Deadline bài tập lớn, đồ án", color: "bg-red-50 text-red-700 border-red-200 hover:border-red-300" },
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
      setErrorMsg(getLocalizedErrorMessage(err, "Không thể tạo lịch. Vui lòng thử lại!"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      {/* Modal Card - Dạng chữ nhật ngang, diện tích rộng rãi (max-w-4xl hoặc max-w-5xl) */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl lg:max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Header Bar */}
        <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-[#F8F7FC]">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
              <CalendarPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  Thêm lịch tự do
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Tạo lịch biểu cá nhân linh hoạt trên thời khóa biểu (không ràng buộc môn học)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Bố cục ngang 2 cột (Left: Nội dung & Phân loại, Right: Thời gian & Xem trước) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs sm:text-sm text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-bold">{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* CỘT TRÁI (Lg: 7 cột): Thông tin sự kiện, địa điểm, phân loại, ghi chú */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Field 1: Tên lịch / Sự kiện */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-black text-slate-900 tracking-wide">
                  Tên lịch / Sự kiện <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Tự học nhóm Đồ án, Hội thảo AI, Ôn thi cuối kỳ..."
                  required
                  autoFocus
                  className="w-full text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition shadow-inner placeholder:font-normal placeholder:text-slate-400"
                />
                
                {/* Quick title suggestions */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Gợi ý nhanh:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TITLE_SUGGESTIONS.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => setTitle(tag)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                          title === tag
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                            : "bg-slate-100/80 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border-slate-200"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field 2: Vị trí / Địa điểm */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-black text-slate-900 tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Vị trí / Địa điểm
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Ví dụ: Phòng 302-A1, Thư viện T2, Lab 5, Quán café, Online Zoom..."
                  className="w-full text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl bg-slate-50/90 border border-slate-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition shadow-inner placeholder:font-normal placeholder:text-slate-400"
                />

                {/* Quick room suggestions */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Địa điểm gợi ý:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ROOM_SUGGESTIONS.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRoom(r)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                          room === r
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200"
                            : "bg-slate-100/80 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-slate-200"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field 3: Phân loại sự kiện */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs sm:text-sm font-black text-slate-900 tracking-wide flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Phân loại sự kiện
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {EVENT_TYPES.map((t) => {
                    const isSelected = eventType === t.value;
                    return (
                      <button
                        type="button"
                        key={t.value}
                        onClick={() => setEventType(t.value)}
                        className={`p-3 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `${t.color} ring-2 ring-indigo-500 shadow-sm font-black`
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-extrabold">{t.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium mt-1">
                          {t.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 4: Ghi chú */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-black text-slate-900 tracking-wide flex items-center gap-1.5">
                  <AlignLeft className="w-4 h-4 text-slate-400" />
                  Ghi chú bổ sung (Tùy chọn)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nội dung cần chuẩn bị, tài liệu ôn tập, link nhóm..."
                  rows={2}
                  className="w-full text-xs sm:text-sm font-medium p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition shadow-inner resize-none placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* CỘT PHẢI (Lg: 5 cột): Cài đặt Thời gian, Tiết học & Thẻ xem trước trực quan */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Card Thời gian & Tiết học */}
              <div className="p-5 rounded-3xl bg-[#F8F7FC] border border-indigo-100/90 shadow-sm space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                  <span className="text-xs sm:text-sm font-extrabold text-indigo-950 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Thiết lập thời gian
                  </span>
                  <span className="px-3 py-1 text-xs font-black rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                    {periodRange.periodLabel}
                  </span>
                </div>

                {/* Ngày diễn ra */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">
                    Ngày diễn ra:
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
                  />
                  <div className="p-2 rounded-xl bg-indigo-100/60 border border-indigo-200/60 text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{formattedDateVietnamese || "Chưa chọn ngày"}</span>
                  </div>
                </div>

                {/* Bắt đầu từ tiết */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Bắt đầu từ tiết:
                    </label>
                    <span className="text-[11px] font-bold text-slate-500">
                      Khung giờ: {RAW_PERIODS[startPeriod - 1]?.start} - {RAW_PERIODS[startPeriod - 1]?.end}
                    </span>
                  </div>
                  <select
                    value={startPeriod}
                    onChange={(e) => handleStartPeriodChange(e.target.value)}
                    className="w-full text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
                  >
                    {RAW_PERIODS.map((p) => (
                      <option key={p.period} value={p.period}>
                        Tiết {p.period} ({p.start} - {p.end}) • Ca {p.shift}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Số tiết (Thời lượng) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-purple-600" />
                      Số tiết (Thời lượng):
                    </label>
                    <span className="text-[11px] text-slate-500 font-bold">
                      Tối đa {maxAllowedDuration} tiết
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Stepper to rõ */}
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={handleDecreaseDuration}
                        disabled={duration <= 1}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Giảm 1 tiết"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="w-16 text-center font-black text-lg text-slate-900">
                        {duration} <span className="text-xs font-bold text-slate-500">tiết</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleIncreaseDuration}
                        disabled={duration >= maxAllowedDuration}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Tăng 1 tiết"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                  </div>
                </div>
              </div>

              {/* Thẻ xem trước trực quan (Live Timetable Event Preview Card) */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Xem trước trên Thời khóa biểu
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-social-violet/10 border-2 border-indigo-300/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      {title.trim() || "Chưa đặt tên lịch"}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shrink-0">
                      {EVENT_TYPES.find((t) => t.value === eventType)?.label || "Lịch tự do"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1 text-indigo-700">
                      <Clock className="w-3.5 h-3.5" />
                      {periodRange.periodLabel} ({periodRange.timeRangeText})
                    </span>
                    {room.trim() && (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <MapPin className="w-3.5 h-3.5" />
                        {room.trim()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 sm:px-8 sm:py-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-2xl transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || !date}
            className="inline-flex items-center gap-2.5 px-6 py-3 text-xs sm:text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-lg shadow-indigo-500/25 transition cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang thêm vào TKB...</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-5 h-5" />
                <span>Thêm vào thời khóa biểu</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

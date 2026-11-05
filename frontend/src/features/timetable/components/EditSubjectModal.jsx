import { useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Calendar,
  Check,
  Clock,
  Palette,
  Sparkles,
  X,
} from "lucide-react";
import { useUpdateSubjectMutation } from "../services/timetableApi";
import { getLocalizedErrorMessage } from "../../../utils/errorMessages";
import { SUBJECT_COLOR_SWATCHES } from "../constants/subjectColors";

const DAYS_OF_WEEK = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 7, label: "CN" },
];

const RAW_PERIODS = [
  { period: 1, start: "07:00", end: "07:50", shift: "Sáng", startMins: 420, endMins: 470 },
  { period: 2, start: "07:50", end: "08:40", shift: "Sáng", startMins: 470, endMins: 520 },
  { period: 3, start: "08:45", end: "09:35", shift: "Sáng", startMins: 525, endMins: 575 },
  { period: 4, start: "09:40", end: "10:30", shift: "Sáng", startMins: 580, endMins: 630 },
  { period: 5, start: "10:35", end: "11:25", shift: "Sáng", startMins: 635, endMins: 685 },
  { period: 6, start: "11:25", end: "12:15", shift: "Sáng", startMins: 685, endMins: 735 },
  { period: 7, start: "12:30", end: "13:20", shift: "Chiều", startMins: 750, endMins: 800 },
  { period: 8, start: "13:20", end: "14:10", shift: "Chiều", startMins: 800, endMins: 850 },
  { period: 9, start: "14:15", end: "15:05", shift: "Chiều", startMins: 855, endMins: 905 },
  { period: 10, start: "15:10", end: "16:00", shift: "Chiều", startMins: 910, endMins: 960 },
  { period: 11, start: "16:05", end: "16:55", shift: "Chiều", startMins: 965, endMins: 1015 },
  { period: 12, start: "16:55", end: "17:45", shift: "Chiều", startMins: 1015, endMins: 1065 },
  { period: 13, start: "18:00", end: "18:50", shift: "Tối", startMins: 1080, endMins: 1130 },
  { period: 14, start: "18:50", end: "19:40", shift: "Tối", startMins: 1130, endMins: 1180 },
  { period: 15, start: "19:45", end: "20:35", shift: "Tối", startMins: 1185, endMins: 1235 },
  { period: 16, start: "20:35", end: "21:25", shift: "Tối", startMins: 1235, endMins: 1285 },
];

function parseTimeToMins(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function inferPeriodsFromTimeRange(startTime, endTime) {
  const startMins = parseTimeToMins(startTime);
  const endMins = parseTimeToMins(endTime);
  if (startMins === null || endMins === null) {
    return [1, 2, 3];
  }

  let startP = 1;
  let minStartDiff = 9999;
  let endP = 3;
  let minEndDiff = 9999;

  for (const p of RAW_PERIODS) {
    const sDiff = Math.abs(startMins - p.startMins);
    if (sDiff < minStartDiff) {
      minStartDiff = sDiff;
      startP = p.period;
    }
    const eDiff = Math.abs(endMins - p.endMins);
    if (eDiff < minEndDiff) {
      minEndDiff = eDiff;
      endP = p.period;
    }
  }

  if (endP < startP) endP = startP;
  const result = [];
  for (let i = startP; i <= endP; i += 1) {
    result.push(i);
  }
  return result;
}

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFutureDateString(weeksAhead = 15) {
  const d = new Date();
  d.setDate(d.getDate() + weeksAhead * 7);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function EditSubjectModal({ isOpen, subject, onClose, onSaved }) {
  if (!isOpen || !subject) return null;

  return (
    <EditSubjectDialog
      key={`${subject.id}-${subject.updatedAt || ""}`}
      subject={subject}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function EditSubjectDialog({ subject, onClose, onSaved }) {
  const [updateSubject, { isLoading }] = useUpdateSubjectMutation();

  const initialHasSchedule = Boolean(
    subject.dayOfWeek && subject.startTime && subject.endTime
  );

  const [name, setName] = useState(subject.name || "");
  const [code, setCode] = useState(subject.code || "");
  const [defaultRoom, setDefaultRoom] = useState(subject.defaultRoom || "");
  const [lecturer, setLecturer] = useState(subject.lecturer || "");
  const [colorHex, setColorHex] = useState(subject.colorHex || "#4F46E5");
  const [hasSchedule, setHasSchedule] = useState(initialHasSchedule);
  const [dayOfWeek, setDayOfWeek] = useState(subject.dayOfWeek || 1);
  const [selectedPeriods, setSelectedPeriods] = useState(() =>
    inferPeriodsFromTimeRange(subject.startTime, subject.endTime)
  );
  const [semesterStartDate, setSemesterStartDate] = useState(
    subject.semesterStartDate || getTodayDateString()
  );
  const [semesterEndDate, setSemesterEndDate] = useState(
    subject.semesterEndDate || getFutureDateString(15)
  );
  const [errorMessage, setErrorMessage] = useState("");

  const minPeriod =
    selectedPeriods.length > 0 ? Math.min(...selectedPeriods) : 1;
  const maxPeriod =
    selectedPeriods.length > 0 ? Math.max(...selectedPeriods) : 1;
  const computedStartTime = RAW_PERIODS[minPeriod - 1].start;
  const computedEndTime = RAW_PERIODS[maxPeriod - 1].end;

  const handleTogglePeriod = (periodNum) => {
    setSelectedPeriods((prev) => {
      const exists = prev.includes(periodNum);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== periodNum);
      }
      return [...prev, periodNum].sort((a, b) => a - b);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Vui lòng nhập tên môn học.");
      return;
    }

    if (hasSchedule) {
      if (!selectedPeriods || selectedPeriods.length === 0) {
        setErrorMessage("Vui lòng chọn ít nhất 1 tiết học.");
        return;
      }
      if (!semesterStartDate || !semesterEndDate) {
        setErrorMessage("Vui lòng chọn ngày bắt đầu và kết thúc môn học.");
        return;
      }
      if (semesterStartDate > semesterEndDate) {
        setErrorMessage("Ngày bắt đầu không được sau ngày kết thúc.");
        return;
      }
    }

    try {
      const payload = {
        id: subject.id,
        name: name.trim(),
        code: code.trim() || null,
        lecturer: lecturer.trim() || null,
        defaultRoom: defaultRoom.trim() || null,
        colorHex: colorHex || "#4F46E5",
        semester: subject.semester || null,
        dayOfWeek: hasSchedule ? Number(dayOfWeek) : null,
        startTime: hasSchedule ? `${computedStartTime}:00` : null,
        endTime: hasSchedule ? `${computedEndTime}:00` : null,
        semesterStartDate: hasSchedule ? semesterStartDate : null,
        semesterEndDate: hasSchedule ? semesterEndDate : null,
      };

      const res = await updateSubject(payload).unwrap();
      if (onSaved) {
        onSaved(res?.data || payload);
      }
      onClose();
    } catch (err) {
      setErrorMessage(
        getLocalizedErrorMessage(
          err,
          "Không thể cập nhật môn học. Vui lòng thử lại."
        )
      );
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        className="relative my-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white font-sans text-slate-900 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#F8F7FC] px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-md transition-colors"
              style={{ backgroundColor: colorHex }}
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 sm:text-lg">
                Chỉnh sửa môn học
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Cập nhật tên, phòng học, lịch cố định và màu sắc hiển thị trên Thời khóa biểu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Color Picker Section - Highlighted */}
          <div className="rounded-2xl border border-slate-200/90 bg-[#F8F7FC] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Màu sắc môn học trên Thời khóa biểu
                </span>
              </div>

              {/* Live preview pill */}
              <div
                className="inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-black text-white shadow-sm transition-colors"
                style={{ backgroundColor: colorHex }}
              >
                <span>{name.trim() || "Tên môn học"}</span>
                {defaultRoom.trim() && (
                  <span className="rounded bg-black/20 px-1.5 py-0.5 text-[10px]">
                    {defaultRoom.trim()}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
              {SUBJECT_COLOR_SWATCHES.map((swatch) => {
                const isSelected =
                  colorHex?.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => setColorHex(swatch.hex)}
                    title={swatch.name}
                    className={`group relative grid h-8 w-8 place-items-center rounded-full transition-transform cursor-pointer ${
                      isSelected
                        ? "scale-115 ring-2 ring-slate-900 ring-offset-2"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white stroke-[3]" />}
                  </button>
                );
              })}

              {/* Custom color input */}
              <label
                className="ml-1 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:border-indigo-300"
                title="Chọn mã màu tùy chỉnh"
              >
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="font-mono uppercase">{colorHex}</span>
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-slate-800">
                Tên môn học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Lập trình Web, Cơ sở dữ liệu..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800">
                Mã môn / Mã lớp
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: IT3080"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800">
                Phòng học mặc định
              </label>
              <input
                type="text"
                value={defaultRoom}
                onChange={(e) => setDefaultRoom(e.target.value)}
                placeholder="VD: 401-A1"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-slate-800">
                Giảng viên phụ trách
              </label>
              <input
                type="text"
                value={lecturer}
                onChange={(e) => setLecturer(e.target.value)}
                placeholder="VD: TS. Nguyễn Văn A"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Recurring Schedule Toggle & Settings */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-4">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold text-slate-800 block">
                  Lịch học cố định hàng tuần trên Thời khóa biểu
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Tự động cập nhật các buổi học định kỳ theo thứ và tiết học đã chọn
                </span>
              </div>
              <input
                type="checkbox"
                checked={hasSchedule}
                onChange={(e) => setHasSchedule(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            {hasSchedule && (
              <div className="space-y-4 border-t border-slate-200/80 pt-3.5">
                {/* Day of week */}
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-slate-800">
                    Thứ học trong tuần
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = Number(dayOfWeek) === day.value;
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => setDayOfWeek(day.value)}
                          className={`rounded-xl py-2 text-center text-xs font-black transition cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Periods 1..16 */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                      Tiết học mặc định
                    </span>
                    <span className="rounded-md border border-indigo-200 bg-indigo-100/80 px-2 py-0.5 text-[11px] font-black text-indigo-700">
                      Tiết {minPeriod} - {maxPeriod} ({computedStartTime} - {computedEndTime})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Sáng 1-3", periods: [1, 2, 3] },
                      { label: "Sáng 4-6", periods: [4, 5, 6] },
                      { label: "Chiều 7-9", periods: [7, 8, 9] },
                      { label: "Chiều 10-12", periods: [10, 11, 12] },
                      { label: "Tối 13-15", periods: [13, 14, 15] },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSelectedPeriods(preset.periods)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-8 gap-1 rounded-2xl border border-slate-200 bg-white p-2">
                    {RAW_PERIODS.map((p) => {
                      const isSelected = selectedPeriods.includes(p.period);
                      return (
                        <button
                          key={p.period}
                          type="button"
                          onClick={() => handleTogglePeriod(p.period)}
                          className={`flex flex-col items-center justify-center rounded-xl py-1.5 px-1 transition cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 font-black text-white shadow-xs"
                              : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-indigo-50/70"
                          }`}
                        >
                          <span className="text-xs font-black">{p.period}</span>
                          <span
                            className={`text-[8px] ${
                              isSelected ? "font-bold text-indigo-100" : "text-slate-400"
                            }`}
                          >
                            {p.start}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Semester start & end date */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-1 text-xs font-extrabold text-slate-800">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                      Ngày bắt đầu môn
                    </label>
                    <input
                      type="date"
                      required={hasSchedule}
                      value={semesterStartDate}
                      onChange={(e) => setSemesterStartDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs font-extrabold text-slate-800">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                      Ngày kết thúc môn
                    </label>
                    <input
                      type="date"
                      required={hasSchedule}
                      min={semesterStartDate}
                      value={semesterEndDate}
                      onChange={(e) => setSemesterEndDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isLoading ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

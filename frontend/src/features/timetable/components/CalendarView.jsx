import { useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";
import viLocale from "@fullcalendar/react/locales/vi";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Settings,
  CalendarPlus,
  QrCode
} from "lucide-react";
import { useGetScheduleEventsQuery } from "../services/timetableApi";
import EventDetailModal from "./EventDetailModal";
import CreateFreeEventModal from "./CreateFreeEventModal";

// 16 Academic Periods mapping (Tiết 1 to Tiết 16)
const PERIODS_MAP = {
  7: { name: "Tiết 1", time: "07:00 - 07:50" },
  8: { name: "Tiết 2", time: "07:50 - 08:40" },
  9: { name: "Tiết 3", time: "08:45 - 09:35" },
  10: { name: "Tiết 4", time: "09:40 - 10:30" },
  11: { name: "Tiết 5", time: "10:35 - 11:25" },
  12: { name: "Tiết 6", time: "11:25 - 12:15" },
  13: { name: "Tiết 7", time: "12:30 - 13:20" },
  14: { name: "Tiết 8", time: "13:20 - 14:10" },
  15: { name: "Tiết 9", time: "14:15 - 15:05" },
  16: { name: "Tiết 10", time: "15:10 - 16:00" },
  17: { name: "Tiết 11", time: "16:05 - 16:55" },
  18: { name: "Tiết 12", time: "16:55 - 17:45" },
  19: { name: "Tiết 13", time: "18:00 - 18:50" },
  20: { name: "Tiết 14", time: "18:50 - 19:40" },
  21: { name: "Tiết 15", time: "19:45 - 20:35" },
  22: { name: "Tiết 16", time: "20:35 - 21:25" },
};

const RAW_PERIODS = [
  { period: 1, startH: 7, startM: 0, endH: 7, endM: 50 },
  { period: 2, startH: 7, startM: 50, endH: 8, endM: 40 },
  { period: 3, startH: 8, startM: 45, endH: 9, endM: 35 },
  { period: 4, startH: 9, startM: 40, endH: 10, endM: 30 },
  { period: 5, startH: 10, startM: 35, endH: 11, endM: 25 },
  { period: 6, startH: 11, startM: 25, endH: 12, endM: 15 },
  { period: 7, startH: 12, startM: 30, endH: 13, endM: 20 },
  { period: 8, startH: 13, startM: 20, endH: 14, endM: 10 },
  { period: 9, startH: 14, startM: 15, endH: 15, endM: 5 },
  { period: 10, startH: 15, startM: 10, endH: 16, endM: 0 },
  { period: 11, startH: 16, startM: 5, endH: 16, endM: 55 },
  { period: 12, startH: 16, startM: 55, endH: 17, endM: 45 },
  { period: 13, startH: 18, startM: 0, endH: 18, endM: 50 },
  { period: 14, startH: 18, startM: 50, endH: 19, endM: 40 },
  { period: 15, startH: 19, startM: 45, endH: 20, endM: 35 },
  { period: 16, startH: 20, startM: 35, endH: 21, endM: 25 },
];

const findStartPeriod = (mins) => {
  let closest = RAW_PERIODS[0];
  let minDiff = 9999;
  for (const p of RAW_PERIODS) {
    const diff = Math.abs(mins - (p.startH * 60 + p.startM));
    if (diff < minDiff) {
      minDiff = diff;
      closest = p;
    }
  }
  return closest.period;
};

const findEndPeriod = (mins) => {
  let closest = RAW_PERIODS[RAW_PERIODS.length - 1];
  let minDiff = 9999;
  for (const p of RAW_PERIODS) {
    const diff = Math.abs(mins - (p.endH * 60 + p.endM));
    if (diff < minDiff) {
      minDiff = diff;
      closest = p;
    }
  }
  return closest.period;
};

const formatLocalIso = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// Clean subject title by removing tags like [Học bù], [Đổi phòng], prefixes, and period suffixes
const cleanSubjectTitle = (title, subjectName) => {
  if (subjectName && typeof subjectName === "string" && subjectName.trim()) {
    return subjectName.trim();
  }
  if (!title || typeof title !== "string") return "";
  let clean = title.trim();
  // Strip bracket tags like [Học bù], [Đổi phòng], [Báo nghỉ], [Kiểm tra], [Thi], etc.
  clean = clean.replace(/^\[.*?\]\s*/g, "");
  // Strip common prefix labels like "Học bù:", "Học Bù -", "Đổi phòng:", "Báo nghỉ:", "Nghỉ:", "Kiểm tra:", "Thi:", "Deadline:"
  clean = clean.replace(/^(?:Học\s*bù|Đổi\s*phòng|Báo\s*nghỉ|Nghỉ\s*học|Nghỉ|Kiểm\s*tra(?:\s*(?:giữa|cuối)\s*kỳ)?|Thi(?:\s*(?:giữa|cuối)\s*kỳ)?|Deadline)\s*[:-–—]?\s*/gi, "");
  // Strip trailing period annotations like "(Tiết 1-3)", "(Tiết 1 - 3)", "(Ca 1)"
  clean = clean.replace(/\s*\((?:Tiết|Ca)\s*[0-9\s\-–—,]+\)$/gi, "");
  return clean.trim() || title;
};

// Helper: Convert hex color to rgba with specific alpha for clean, bright transparency
const hexToRgba = (hex, alpha = 0.7) => {
  if (!hex || typeof hex !== "string") return `rgba(79, 70, 229, ${alpha})`;
  let c = hex.replace("#", "").trim();
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(79, 70, 229, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Curated palette so each subject gets a distinct, vibrant color
const DISTINCT_SUBJECT_COLORS = [
  "#4F46E5", // Indigo (Lập trình Web)
  "#059669", // Emerald (Cơ sở dữ liệu)
  "#7C3AED", // Violet (Mạng máy tính)
  "#D97706", // Amber / Ocher (Giải tích)
  "#0891B2", // Cyan / Ocean (Trí tuệ nhân tạo)
  "#DB2777", // Pink / Rose (Toán rời rạc)
  "#EA580C", // Orange (Hệ điều hành)
  "#0D9488", // Teal (Kiến trúc máy tính)
  "#2563EB", // Royal Blue (Kỹ thuật phần mềm)
  "#9333EA", // Purple (An toàn thông tin)
];

const getSubjectColor = (subjectId, subjectName, subjectColorHex) => {
  if (subjectColorHex && subjectColorHex !== "#6366F1") {
    return subjectColorHex;
  }
  const key = (subjectName || subjectId || "Môn học").toString();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DISTINCT_SUBJECT_COLORS.length;
  return DISTINCT_SUBJECT_COLORS[index];
};

export default function CalendarView({ onOpenSettings }) {
  const { data: scheduleEvents = [], isLoading, refetch } = useGetScheduleEventsQuery();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [createEventModalData, setCreateEventModalData] = useState(null);

  // Map backend ScheduleEvent entities to FullCalendar event format
  // Map backend ScheduleEvent entities to FullCalendar event format
  // Box length snaps exactly to the number of periods (e.g. Tiết 1-3 spans 3 full rows)
  const calendarEvents = useMemo(() => {
    return scheduleEvents
      .filter((evt) => evt.status !== "REJECTED")
      .map((evt) => {
        let eventColor;
        const textColor = "#FFFFFF";

        const isCancelled = evt.eventType === "CANCELLED_CLASS";
        const isPending = evt.status === "PENDING_REVIEW";
        const isConfirmedCancelled = isCancelled && !isPending;
        const isPendingCancellation = isCancelled && isPending;
        const hasPendingRoomChange = Boolean(evt.originalRoom && isPending);

        switch (evt.eventType) {
          case "CANCELLED_CLASS":
            // Yêu cầu:
            // "sự kiện đó sẽ chuyển thành màu xám, độ trong suốt 70%, chờ người dùng duyệt"
            // "nếu duyệt sự kiện nghỉ học, sự kiện đó sẽ chuyển thành màu xám đậm"
            eventColor = isPending ? "#64748B" : "#334155";
            break;
          case "MAKEUP_CLASS":
            eventColor = "#F59E0B"; // Amber / Vàng cam
            break;
          case "EXAM":
            eventColor = "#E11D48"; // Rose / Đỏ hồng
            break;
          case "DEADLINE":
            eventColor = "#DC2626"; // Crimson / Đỏ sẫm
            break;
          case "REGULAR_CLASS":
          default:
            eventColor = getSubjectColor(evt.subjectId, evt.subjectName || evt.title, evt.subjectColorHex);
            break;
        }

        const rawStart = new Date(evt.startDatetime);
        const rawEnd = new Date(evt.endDatetime);

        const startMins = rawStart.getHours() * 60 + rawStart.getMinutes();
        const endMins = rawEnd.getHours() * 60 + rawEnd.getMinutes();

        let startPeriod = findStartPeriod(startMins);
        let endPeriod = findEndPeriod(endMins);
        if (endPeriod < startPeriod) endPeriod = startPeriod;

        // Snap to full slot boundaries on the grid:
        // Tiết k starts at (6 + k):00 and ends at (7 + k):00
        const gridStart = new Date(rawStart);
        gridStart.setHours(6 + startPeriod, 0, 0, 0);

        const gridEnd = new Date(rawStart);
        gridEnd.setHours(7 + endPeriod, 0, 0, 0);

        const pad = (n) => String(n).padStart(2, "0");
        const realTimeText = `${pad(rawStart.getHours())}:${pad(rawStart.getMinutes())} - ${pad(rawEnd.getHours())}:${pad(rawEnd.getMinutes())}`;
        const periodLabel = startPeriod === endPeriod ? `Tiết ${startPeriod}` : `Tiết ${startPeriod} - ${endPeriod}`;
        const displayTitle = cleanSubjectTitle(evt.title, evt.subjectName);

        // Effective background: 70% opacity when pending, 100% when confirmed
        const effectiveBgColor = isPending ? hexToRgba(eventColor, 0.7) : eventColor;

        return {
          id: evt.id,
          title: displayTitle,
          start: formatLocalIso(gridStart),
          end: formatLocalIso(gridEnd),
          color: effectiveBgColor,
          backgroundColor: effectiveBgColor,
          borderColor: "transparent",
          textColor,
          extendedProps: {
            ...evt,
            isPending,
            isCancelled,
            isConfirmedCancelled,
            isPendingCancellation,
            hasPendingRoomChange,
            calculatedColor: eventColor,
            cleanTitle: displayTitle,
            periodLabel,
            realTimeText,
            startPeriod,
            endPeriod,
          },
        };
      });
  }, [scheduleEvents]);

  const handleEventClick = (info) => {
    if (info.event.extendedProps) {
      setSelectedEvent(info.event.extendedProps);
    }
  };

  // Click on an empty time slot to add a free event
  const handleDateClick = (info) => {
    const date = info.date;
    const hour = date.getHours();
    const startPeriod = Math.min(16, Math.max(1, hour - 6));
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    setCreateEventModalData({
      date: dateStr,
      startPeriod,
      duration: 2,
    });
  };

  // Drag over empty time slots to choose period range
  const handleDateSelect = (selectionInfo) => {
    const start = selectionInfo.start;
    const end = selectionInfo.end;
    const startHour = start.getHours();
    let endHour = end.getHours();
    if (endHour === 0 && end.getDate() !== start.getDate()) {
      endHour = 23;
    }
    const startPeriod = Math.min(16, Math.max(1, startHour - 6));
    const duration = Math.max(1, Math.min(16 - startPeriod + 1, endHour - startHour));

    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, "0");
    const d = String(start.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    setCreateEventModalData({
      date: dateStr,
      startPeriod,
      duration,
    });
  };

  // Custom render for the left vertical axis: Tiết học & Giờ học chuẩn
  const renderSlotHeaderContent = (slotInfo) => {
    const date = slotInfo.date;
    if (!date) return slotInfo.text;
    const hour = date.getHours();
    const periodInfo = PERIODS_MAP[hour];
    if (periodInfo) {
      return (
        <div className="flex flex-col items-center justify-center py-1 px-1 text-center select-none leading-none min-w-[68px]">
          <span className="font-extrabold text-indigo-950 text-xs tracking-tight">
            {periodInfo.name}
          </span>
          <span className="text-[9px] text-slate-400 font-mono mt-1 font-semibold">
            {periodInfo.time}
          </span>
        </div>
      );
    }
    return slotInfo.text;
  };

  // Custom event cell render:
  // - Clean subject name without tags, allows multiline wrapping
  // - Prominent bold room and time range
  // - Pending review events have 70% transparent background (no stroke, bright and clean)
  // - Period label removed from inside the box
  const renderEventContent = (eventInfo) => {
    const raw = eventInfo.event.extendedProps;
    const isCancelled = raw?.eventType === "CANCELLED_CLASS";
    const isPending = raw?.status === "PENDING_REVIEW";
    const isConfirmedCancelled = isCancelled && !isPending;
    const isPendingCancellation = isCancelled && isPending;
    const hasPendingRoomChange = Boolean(raw?.originalRoom && isPending);

    const baseColor = raw?.calculatedColor || eventInfo.event.backgroundColor || eventInfo.event.color || "#4F46E5";
    // For pending cancellation: gray with 70% opacity; for confirmed cancelled: dark gray with 100% opacity
    const displayBgColor = isPending ? hexToRgba(baseColor, 0.7) : baseColor;
    const displayTitle = raw?.cleanTitle || cleanSubjectTitle(eventInfo.event.title, raw?.subjectName);

    return (
      <div
        className={`p-2 sm:p-2.5 w-full h-full flex flex-col justify-between rounded-xl overflow-hidden leading-tight select-none transition-all duration-200 ${
          isConfirmedCancelled ? "line-through opacity-85" : ""
        }`}
        style={{
          backgroundColor: displayBgColor,
          color: "#FFFFFF",
        }}
      >
        {/* Top Info: Clean Subject Name (no tag, wraps onto multiple lines) */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <span className="font-black text-xs sm:text-[13px] text-white tracking-tight leading-snug break-words whitespace-normal line-clamp-3">
              {displayTitle}
            </span>
            {isPending && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping shrink-0 mt-0.5" title="Chờ duyệt" />
            )}
          </div>

          {/* Special Status Badges */}
          {isPendingCancellation && (
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-400/30 text-amber-100 border border-amber-300/40">
              <span>⚠️ Báo nghỉ (Chờ duyệt)</span>
            </div>
          )}

          {isConfirmedCancelled && (
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-900/60 text-slate-200 border border-slate-700/50">
              <span>✕ Đã nghỉ học</span>
            </div>
          )}

          {hasPendingRoomChange && (
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/40 text-indigo-100 border border-indigo-400/40">
              <span>🔄 Đổi phòng (Chờ duyệt)</span>
            </div>
          )}

          {/* Classroom (Phòng học) - Phóng to và In Đậm */}
          {raw?.room && (
            <div className="text-xs sm:text-[13px] font-black text-white flex items-center gap-1 break-words">
              <span>
                📍 Phòng: <strong>{raw.room}</strong>
                {hasPendingRoomChange && raw.originalRoom && (
                  <span className="text-[11px] font-normal text-slate-200 ml-1 line-through">({raw.originalRoom})</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Info: Giờ học - In đậm rõ ràng, thay thế phần tiết */}
        <div className="pt-1.5 mt-auto flex items-center">
          <span className={`inline-flex items-center gap-1 font-black text-white font-mono text-xs sm:text-[13px] px-2 py-0.5 rounded-lg ${
            isPending ? "bg-white/20" : "bg-black/25"
          }`}>
            ⏰ {raw?.realTimeText || eventInfo.timeText}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col h-full space-y-4">
      {/* Calendar Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Thời khóa biểu sinh viên</h2>
            <p className="text-xs text-slate-500">
              Tổng cộng <strong>{scheduleEvents.length}</strong> sự kiện học vụ
            </p>
          </div>
        </div>

        {/* Legend Badges & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-[13px] font-bold">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/90 text-indigo-800 border border-indigo-200/90 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span> Lịch thường
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50/90 text-purple-800 border border-purple-200/90 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span> Lịch tự do
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/90 text-amber-800 border border-amber-200/90 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span> Học bù
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50/90 text-rose-800 border border-rose-200/90 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span> Thi / Ktra
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-300 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span> Báo nghỉ
          </span>

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition cursor-pointer shadow-xs"
            title="Làm mới lịch"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          {/* Quick Add Free Event Button (Phóng to) */}
          <button
            onClick={() => {
              const today = new Date();
              const y = today.getFullYear();
              const m = String(today.getMonth() + 1).padStart(2, "0");
              const d = String(today.getDate()).padStart(2, "0");
              setCreateEventModalData({
                date: `${y}-${m}-${d}`,
                startPeriod: 1,
                duration: 2,
              });
            }}
            className="flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition ml-1 cursor-pointer"
            title="Thêm lịch tự do vào thời khóa biểu (hoặc click trực tiếp vào ô trên lịch)"
          >
            <CalendarPlus className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span>+ Thêm lịch</span>
          </button>

          {/* Connect Button (Phóng to, đổi tên thành "Kết nối") */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs sm:text-sm shadow-md shadow-slate-900/20 transition ml-1 cursor-pointer"
              title="Kết nối Zalo AI & Quản lý Whitelist"
            >
              <QrCode className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>Kết nối</span>
            </button>
          )}
        </div>
      </div>

      {/* FullCalendar Wrapper */}
      <div className="flex-1 min-h-[620px] text-xs font-sans">
        <FullCalendar
          plugins={[classicThemePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          firstDay={1}
          weekends={true}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          titleFormat={(info) => {
            const d = info.date || info.start;
            const month = (d?.month ?? 0) + 1;
            const year = d?.year ?? new Date().getFullYear();
            return `Tháng ${month} năm ${year}`;
          }}
          locales={[viLocale]}
          locale="vi"
          buttonText={{
            today: "Hôm nay",
          }}
          dayHeaderFormat={{
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          selectable={true}
          selectMirror={true}
          unselectAuto={true}
          dateClick={handleDateClick}
          select={handleDateSelect}
          slotMinTime="07:00:00"
          slotMaxTime="23:00:00"
          slotDuration="01:00:00"
          slotLabelInterval="01:00:00"
          slotHeaderContent={renderSlotHeaderContent}
          slotLabelContent={renderSlotHeaderContent}
          allDaySlot={false}
          slotEventOverlap={false}
          nowIndicator={true}
          expandRows={true}
          height={760}
        />
      </div>

      {/* Event Details Popup */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Create Free Event Modal */}
      {createEventModalData && (
        <CreateFreeEventModal
          isOpen={true}
          initialDate={createEventModalData.date}
          initialStartPeriod={createEventModalData.startPeriod}
          initialDuration={createEventModalData.duration}
          onClose={() => setCreateEventModalData(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

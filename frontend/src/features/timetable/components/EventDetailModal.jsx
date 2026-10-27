import { getLocalizedErrorMessage } from "../../../utils/errorMessages";
import { useState } from "react";
import {
  Clock,
  MapPin,
  MessageSquare,
  Sparkles,
  CheckCircle,
  XCircle,
  Trash2,
  X,
  User,
  AlertCircle
} from "lucide-react";
import {
  useConfirmScheduleEventMutation,
  useRejectScheduleEventMutation,
  useDeleteScheduleEventMutation,
} from "../services/timetableApi";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

export default function EventDetailModal({ event, onClose }) {
  const [confirmEvent, { isLoading: isConfirming }] = useConfirmScheduleEventMutation();
  const [rejectEvent, { isLoading: isRejecting }] = useRejectScheduleEventMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteScheduleEventMutation();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (!event) return null;

  const handleConfirm = async () => {
    try {
      await confirmEvent(event.id).unwrap();
      onClose();
    } catch (err) {
      alert("Lỗi khi duyệt sự kiện: " + getLocalizedErrorMessage(err));
    }
  };

  const handleReject = async () => {
    try {
      await rejectEvent(event.id).unwrap();
      onClose();
    } catch (err) {
      alert("Lỗi khi từ chối sự kiện: " + getLocalizedErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteError("");
    try {
      await deleteEvent(event.id).unwrap();
      setIsDeleteModalOpen(false);
      onClose();
    } catch (err) {
      setDeleteError(getLocalizedErrorMessage(err, "Lỗi khi xóa sự kiện!"));
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCancelled = event.eventType === "CANCELLED_CLASS";
  const isPending = event.status === "PENDING_REVIEW";
  const isPendingCancellation = isCancelled && isPending;
  const isConfirmedCancelled = isCancelled && !isPending;
  const hasPendingRoomChange = Boolean(event.originalRoom && isPending);

  const getEventBadge = () => {
    if (isPendingCancellation) {
      return { label: "Báo nghỉ (Chờ duyệt)", bg: "bg-slate-200 text-slate-800 border-slate-400" };
    }
    if (isConfirmedCancelled) {
      return { label: "Đã nghỉ học", bg: "bg-slate-700 text-white border-slate-800" };
    }
    if (hasPendingRoomChange) {
      return { label: "Đổi phòng (Chờ duyệt)", bg: "bg-indigo-100 text-indigo-800 border-indigo-300" };
    }
    switch (event.eventType) {
      case "MAKEUP_CLASS":
        return { label: "Học bù", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "EXAM":
        return { label: "Kiểm tra / Thi", bg: "bg-rose-100 text-rose-800 border-rose-200" };
      case "DEADLINE":
        return { label: "Hạn nộp bài", bg: "bg-red-100 text-red-800 border-red-200" };
      default:
        if (!event.subjectId) {
          return { label: "Lịch tự do", bg: "bg-purple-100 text-purple-800 border-purple-200" };
        }
        return { label: "Lịch thường", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" };
    }
  };

  const badge = getEventBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] shadow-2xl border border-slate-100 w-full max-w-4xl lg:max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 font-sans">
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-[#F8F7FC]">
          <div className="flex items-center gap-3">
            <span className={`px-3.5 py-1.5 text-xs sm:text-sm font-extrabold rounded-xl border ${badge.bg}`}>
              {badge.label}
            </span>
            {event.status === "PENDING_REVIEW" ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                Chờ duyệt
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-4 h-4" />
                {isConfirmedCancelled ? "Đã xác nhận nghỉ" : "Đã xác nhận"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Horizontal 2-Column Grid */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Core Event Information (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Notification Alert for Cancellation */}
              {isPendingCancellation && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1.5">
                  <p className="font-extrabold text-base text-amber-950 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Thông báo nghỉ học từ Zalo</span>
                  </p>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Buổi học này có thông báo nghỉ học từ nhóm Zalo môn học. Nếu duyệt, sự kiện sẽ chuyển thành màu xám đậm (đã nghỉ). Nếu từ chối, sự kiện sẽ trở lại trạng thái lịch học bình thường.
                  </p>
                </div>
              )}

              {/* Notification Alert for Room Change */}
              {hasPendingRoomChange && (
                <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 space-y-1.5">
                  <p className="font-extrabold text-base text-indigo-950 flex items-center gap-2">
                    <span>🔄</span>
                    <span>Thông báo đổi phòng học từ Zalo</span>
                  </p>
                  <p className="text-sm text-indigo-800 leading-relaxed">
                    Có thông báo chuyển phòng học từ <strong>{event.originalRoom}</strong> sang <strong>{event.room}</strong>. Bạn có thể duyệt để cập nhật phòng mới hoặc từ chối để giữ phòng cũ.
                  </p>
                </div>
              )}

              {/* Title & Subject */}
              <div>
                <h3 className={`text-2xl sm:text-3xl font-black text-slate-900 leading-snug tracking-tight ${isConfirmedCancelled ? "line-through text-slate-400" : ""}`}>
                  {event.title}
                </h3>
                {event.subjectName && (
                  <div className="mt-3 inline-flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: event.subjectColorHex || "#7C6EE6" }}
                    />
                    <span className="text-sm sm:text-base font-bold text-slate-800">
                      {event.subjectName} {event.subjectCode ? `(${event.subjectCode})` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Time & Room Info Cards (Large & Prominent) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-4 hover:border-slate-300 transition">
                  <div className="p-2.5 rounded-xl bg-social-violet/10 text-social-violet shrink-0 mt-0.5">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Thời gian</p>
                    <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
                      {formatTimeOnly(event.startDatetime)} – {formatTimeOnly(event.endDatetime)}
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1 leading-snug">
                      {formatDateTime(event.startDatetime)}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-4 hover:border-slate-300 transition">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Phòng học</p>
                    <p className="text-base sm:text-lg font-black text-slate-900 mt-1 truncate">
                      {event.room || "Chưa xác định"}
                    </p>
                    {hasPendingRoomChange && event.originalRoom && (
                      <p className="text-xs font-bold text-amber-700 mt-1">
                        Phòng cũ: {event.originalRoom}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Địa điểm lớp học</p>
                  </div>
                </div>
              </div>

              {/* Note if any */}
              {event.note && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-extrabold text-amber-950">Ghi chú sự kiện</p>
                    <p className="text-sm font-medium text-amber-900 mt-1 leading-relaxed">{event.note}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Source Context & Zalo AI Detection (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {event.source === "ZALO_AI" && (event.rawZaloMessage || event.rawZaloImageUrl) ? (
                <div className="rounded-3xl border border-indigo-100 bg-[#FAF9FD] p-5 sm:p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-100/60">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-social-violet/10 text-social-violet">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-extrabold text-indigo-950">Tin nhắn Zalo gốc</span>
                    </div>
                    {event.aiConfidence && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-100/90 px-3 py-1 rounded-full shadow-sm">
                        Độ tin cậy: {Math.round(event.aiConfidence * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600 font-medium">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Người gửi: <strong className="text-slate-800">{event.senderName || "Thành viên lớp học"}</strong></span>
                  </div>

                  {event.rawZaloMessage && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 mb-1.5">Nội dung thông báo:</p>
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 text-sm sm:text-base text-slate-800 leading-relaxed font-sans shadow-inner whitespace-pre-wrap">
                        "{event.rawZaloMessage}"
                      </div>
                    </div>
                  )}

                  {event.rawZaloImageUrl && (
                    <div className="pt-2">
                      <p className="text-xs font-bold text-indigo-950 mb-2">Ảnh thông báo gốc đính kèm:</p>
                      <a
                        href={event.rawZaloImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block group relative rounded-2xl overflow-hidden border border-slate-200 w-full shadow-sm hover:shadow-md transition"
                      >
                        <img
                          src={event.rawZaloImageUrl}
                          alt="Ảnh thông báo Zalo"
                          className="max-h-60 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-bold gap-2">
                          <span>🔍 Xem ảnh kích thước đầy đủ</span>
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200/80 bg-[#FAF9FD] p-5 sm:p-6 space-y-3.5 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80">
                    <Sparkles className="w-4 h-4 text-social-violet" />
                    <span className="text-sm font-extrabold text-slate-900">Chi tiết bổ sung</span>
                  </div>
                  <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                    <p className="flex items-center justify-between">
                      <span className="text-slate-500">Phân loại:</span>
                      <strong className="text-slate-800">{event.subjectId ? "Lịch môn học" : "Lịch cá nhân"}</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-slate-500">Nguồn:</span>
                      <strong className="text-slate-800">Tạo trực tiếp trên UniSync</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-slate-500">Trạng thái:</span>
                      <strong className="text-slate-800">{event.status === "PENDING_REVIEW" ? "Chờ duyệt" : "Đã kích hoạt"}</strong>
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-500 leading-relaxed">
                    Sự kiện này được hiển thị đồng bộ trên Thời khóa biểu toàn hệ thống của bạn.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 sm:px-8 py-4 sm:py-5 border-t border-slate-100 bg-[#F8F7FC] flex flex-wrap items-center justify-end gap-3">
          {event.status === "PENDING_REVIEW" && (
            <>
              <button
                type="button"
                onClick={handleReject}
                disabled={isRejecting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200/80 rounded-xl transition border border-slate-300 disabled:opacity-50"
                title={
                  isPendingCancellation
                    ? "Từ chối thông báo nghỉ học (Giữ lại lịch học bình thường)"
                    : hasPendingRoomChange
                    ? "Từ chối đổi phòng (Giữ lại phòng học cũ)"
                    : "Từ chối sự kiện này"
                }
              >
                <XCircle className="w-4 h-4" />
                <span>
                  {isRejecting
                    ? "Đang xử lý..."
                    : isPendingCancellation
                    ? "Từ chối (Giữ lịch)"
                    : hasPendingRoomChange
                    ? "Từ chối (Giữ phòng cũ)"
                    : "Từ chối"}
                </span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirming}
                className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-extrabold text-white rounded-xl shadow-md transition disabled:opacity-50 ${
                  isPendingCancellation
                    ? "bg-slate-800 hover:bg-slate-900 shadow-slate-300"
                    : "bg-social-violet hover:bg-[#6E60DC] shadow-indigo-200"
                }`}
                title={
                  isPendingCancellation
                    ? "Duyệt nghỉ học (Chuyển sự kiện sang màu xám đậm)"
                    : hasPendingRoomChange
                    ? "Duyệt đổi sang phòng học mới"
                    : "Duyệt sự kiện này lên thời khóa biểu"
                }
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {isConfirming
                    ? "Đang duyệt..."
                    : isPendingCancellation
                    ? "Duyệt nghỉ học"
                    : hasPendingRoomChange
                    ? "Duyệt đổi phòng"
                    : "Duyệt lên lịch"}
                </span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition border border-rose-200 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa sự kiện</span>
          </button>
        </div>
      </div>

      {/* Confirm Delete Overlay Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteError("");
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Xác nhận xóa sự kiện"
        description="Bạn có chắc chắn muốn xóa sự kiện này khỏi thời khóa biểu? Hành động này không thể hoàn tác."
        itemName={event.title}
        itemDetails={
          event.room
            ? `📍 Vị trí: ${event.room} • ${formatDateTime(event.startDatetime)}`
            : `⏰ ${formatDateTime(event.startDatetime)}`
        }
        confirmText="Xóa sự kiện"
        cancelText="Giữ lại"
        errorMsg={deleteError}
      />
    </div>
  );
}

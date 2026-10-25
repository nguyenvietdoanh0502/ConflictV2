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
      alert("Lỗi khi duyệt sự kiện: " + (err.data?.message || err.message));
    }
  };

  const handleReject = async () => {
    try {
      await rejectEvent(event.id).unwrap();
      onClose();
    } catch (err) {
      alert("Lỗi khi từ chối sự kiện: " + (err.data?.message || err.message));
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteError("");
    try {
      await deleteEvent(event.id).unwrap();
      setIsDeleteModalOpen(false);
      onClose();
    } catch (err) {
      setDeleteError(err.data?.message || err.message || "Lỗi khi xóa sự kiện!");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${badge.bg}`}>
              {badge.label}
            </span>
            {event.status === "PENDING_REVIEW" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Chờ duyệt
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                {isConfirmedCancelled ? "Đã xác nhận nghỉ" : "Đã xác nhận"}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Notification Alert for Cancellation */}
          {isPendingCancellation && (
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-800 text-xs space-y-1">
              <p className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span>⚠️ Thông báo nghỉ học</span>
              </p>
              <p className="text-slate-600 leading-relaxed">
                Buổi học này có thông báo nghỉ học từ Zalo. Nếu duyệt, sự kiện sẽ chuyển thành màu xám đậm (đã nghỉ). Nếu từ chối, sự kiện sẽ trở lại trạng thái lịch học bình thường.
              </p>
            </div>
          )}

          {/* Notification Alert for Room Change */}
          {hasPendingRoomChange && (
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 text-xs space-y-1">
              <p className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
                <span>🔄 Thông báo đổi phòng học</span>
              </p>
              <p className="text-indigo-800 leading-relaxed">
                Có thông báo đổi phòng học từ <strong>{event.originalRoom}</strong> sang <strong>{event.room}</strong>. Bạn có thể duyệt để cập nhật phòng mới hoặc từ chối để giữ phòng cũ.
              </p>
            </div>
          )}

          {/* Title & Subject */}
          <div>
            <h3 className={`text-xl font-extrabold text-slate-900 leading-snug ${isConfirmedCancelled ? "line-through text-slate-500" : ""}`}>
              {event.title}
            </h3>
            {event.subjectName && (
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: event.subjectColorHex || "#7C6EE6" }}
                ></span>
                <span className="text-sm font-semibold text-slate-700">
                  {event.subjectName} {event.subjectCode ? `(${event.subjectCode})` : ""}
                </span>
              </div>
            )}
          </div>

          {/* Time & Room Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500">Thời gian</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {formatTimeOnly(event.startDatetime)} - {formatTimeOnly(event.endDatetime)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(event.startDatetime)}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500">Phòng học</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {event.room || "Chưa xác định"}
                </p>
                {hasPendingRoomChange && event.originalRoom && (
                  <p className="text-xs text-amber-700 font-medium mt-0.5">Phòng cũ: {event.originalRoom}</p>
                )}
                <p className="text-xs text-slate-500 mt-0.5">Địa điểm học tập</p>
              </div>
            </div>
          </div>

          {/* Note if any */}
          {event.note && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">Ghi chú sự kiện</p>
                <p className="text-xs font-medium text-amber-800 mt-1">{event.note}</p>
              </div>
            </div>
          )}

          {/* Raw Zalo Message Quote Box */}
          {event.source === "ZALO_AI" && event.rawZaloMessage && (
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-purple-50/20 to-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-indigo-100 text-indigo-600">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-indigo-900">Tin nhắn Zalo gốc</span>
                </div>
                {event.aiConfidence && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Độ tin cậy: {Math.round(event.aiConfidence * 100)}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2 text-xs text-slate-600 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Người gửi: <strong>{event.senderName || "Thành viên nhóm"}</strong></span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-mono">
                "{event.rawZaloMessage}"
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition border border-rose-200 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa sự kiện</span>
          </button>

          <div className="flex items-center gap-2">
            {event.status === "PENDING_REVIEW" && (
              <>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition border border-slate-200"
                  title={
                    isPendingCancellation
                      ? "Từ chối thông báo nghỉ học (Giữ lại lịch học bình thường)"
                      : hasPendingRoomChange
                      ? "Từ chối đổi phòng (Giữ lại phòng học cũ)"
                      : "Từ chối sự kiện này"
                  }
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {isRejecting ? "Đang xử lý..." : isPendingCancellation ? "Từ chối (Giữ lịch)" : hasPendingRoomChange ? "Từ chối (Giữ phòng cũ)" : "Từ chối"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition ${
                    isPendingCancellation
                      ? "bg-slate-800 hover:bg-slate-900 shadow-slate-300"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                  }`}
                  title={
                    isPendingCancellation
                      ? "Duyệt nghỉ học (Chuyển sự kiện sang màu xám đậm)"
                      : hasPendingRoomChange
                      ? "Duyệt đổi sang phòng học mới"
                      : "Duyệt sự kiện này lên thời khóa biểu"
                  }
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isConfirming ? "Đang duyệt..." : isPendingCancellation ? "Duyệt nghỉ học" : hasPendingRoomChange ? "Duyệt đổi phòng" : "Duyệt lên lịch"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
            >
              Đóng
            </button>
          </div>
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

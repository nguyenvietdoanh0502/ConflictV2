import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2, AlertTriangle, X, AlertCircle } from "lucide-react";

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận xóa",
  description = "Bạn có chắc chắn muốn thực hiện hành động này? Thao tác này không thể hoàn tác.",
  itemName = "",
  itemDetails = null,
  confirmText = "Xóa vĩnh viễn",
  cancelText = "Hủy bỏ",
  isLoading = false,
  errorMsg = "",
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus cancel button on open for safe default
    const timer = setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white text-slate-800 shadow-[0_25px_70px_rgba(15,23,42,0.25)] border border-slate-100 animate-in zoom-in-95 duration-200"
      >
        {/* Soft top gradient accent */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-rose-100/70 via-rose-50/40 to-transparent"
          aria-hidden="true"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-slate-400 hover:text-slate-700 hover:bg-white shadow-sm border border-slate-100 transition disabled:opacity-50"
          aria-label="Đóng hộp thoại"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Container */}
        <div className="relative p-6 sm:p-7 space-y-4">
          
          {/* Danger Icon Badge */}
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-200">
            <Trash2 className="h-6 w-6" />
          </div>

          {/* Heading */}
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
              {title}
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
              {description}
            </p>
          </div>

          {/* Highlight Target Item Box */}
          {itemName && (
            <div className="rounded-2xl bg-rose-50/50 border border-rose-100 p-3.5 space-y-1">
              <div className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Đối tượng được chọn:
              </div>
              <p className="text-sm font-black text-slate-900 break-words">
                {itemName}
              </p>
              {itemDetails && (
                <p className="text-xs text-rose-700 font-medium pt-0.5 leading-relaxed">
                  {itemDetails}
                </p>
              )}
            </div>
          )}

          {/* Error Message if deletion failed */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-200 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}

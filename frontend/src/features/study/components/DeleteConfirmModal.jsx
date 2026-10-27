import React, { useEffect, useRef } from "react";

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  material,
  isLoading = false,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !material) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#E5E2EC] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E2EC]">
          <h3 className="text-base font-extrabold text-[#2F2A45]">
            Xác nhận xóa tài liệu
          </h3>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-full px-3 py-1 text-xs font-bold text-[#77718C] hover:bg-[#F0EEF8] hover:text-[#2F2A45] transition-colors disabled:opacity-50"
          >
            Đóng
          </button>
        </div>

        {/* Nội dung cảnh báo */}
        <div className="mt-4 space-y-3.5">
          <p className="text-xs text-[#77718C] leading-relaxed">
            Bạn có chắc chắn muốn xóa tài liệu này không? Thao tác này sẽ xóa vĩnh viễn đề cương, nội dung tóm tắt và tất cả dữ liệu Minigame liên quan.
          </p>

          {/* Hộp thông tin tài liệu được chọn xóa */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
              Tài liệu được chọn:
            </span>
            <p className="text-sm font-black text-[#2F2A45] leading-snug line-clamp-2">
              {material.title}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#77718C]">
              <span>Môn: <strong className="text-[#4F4965]">{material.subjectName || "Chưa phân loại"}</strong></span>
              <span>•</span>
              <span className="truncate max-w-[180px]" title={material.fileName}>{material.fileName}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E2EC]">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#77718C] hover:bg-[#F0EEF8] hover:text-[#2F2A45] transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-rose-600/25 hover:bg-rose-700 hover:shadow-rose-600/35 transition-all disabled:opacity-50"
          >
            {isLoading ? "Đang xóa..." : "Xác nhận xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

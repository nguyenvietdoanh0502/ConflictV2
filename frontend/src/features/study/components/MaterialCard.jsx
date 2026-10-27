import React from "react";
import { getLocalizedErrorMessage } from "../../../utils/errorMessages";

function MaterialCard({
  material,
  onOpenStudy,
  onOpenLeaderboard,
  onDelete,
  onGenerateMinigames,
  isGeneratingMinigames = false,
}) {
  const isCompleted = material.processingStatus === "COMPLETED";
  const isProcessing = material.processingStatus === "PROCESSING";
  const isFailed = material.processingStatus === "FAILED";

  const quizCount = material.quizData?.length || 0;
  const matchCount = material.memoryMatchData?.length || 0;
  const hasMinigames = quizCount > 0 || matchCount > 0;

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoString.slice(0, 10);
    }
  };

  const getTypeBadge = (type) => {
    const t = (type || "").toUpperCase();
    if (t === "PDF") return "bg-rose-100 text-rose-700 border-rose-200";
    if (t === "DOCX") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-purple-100 text-purple-700 border-purple-200";
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-[#E5E2EC] bg-white p-5 shadow-sm hover:shadow-md hover:border-social-violet/40 transition-all">
      <div>
        {/* Header card: Type badge, Subject pill, and Delete button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${getTypeBadge(material.fileType)}`}>
              {material.fileType || "DOC"}
            </span>
            <span className="rounded-xl border border-social-violet/20 bg-social-violet/10 px-2.5 py-0.5 text-[11px] font-bold text-social-violet max-w-[140px] truncate">
              {material.subjectName || "Môn học"}
            </span>
          </div>

          <button
            type="button"
            title="Xóa tài liệu này"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(material);
            }}
            className="rounded-xl border border-[#E5E2EC] bg-[#FAF9FD] px-2.5 py-1 text-xs font-bold text-[#77718C] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            Xóa
          </button>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-sm font-black text-[#2F2A45] line-clamp-2 leading-snug">
          {material.title}
        </h3>

        {/* File name & date */}
        <p className="mt-1 text-xs text-[#77718C] truncate" title={material.fileName}>
          {material.fileName}
        </p>

        {/* Status & Stats */}
        <div className="mt-4 pt-3 border-t border-[#F0EEF8]">
          {isProcessing && (
            <div className="rounded-xl bg-social-violet/10 p-2.5 text-xs font-bold text-social-violet animate-pulse">
              Đang đọc hiểu & tạo Cheatsheet...
            </div>
          )}

          {isFailed && (
            <div className="rounded-xl bg-rose-50 p-2.5 text-xs font-bold text-rose-600 border border-rose-200">
              Lỗi xử lý: {getLocalizedErrorMessage({ message: material.errorMessage }, "Không thể xử lý hoặc trích xuất văn bản.")}
            </div>
          )}

          {isCompleted && (
            hasMinigames ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-700 font-bold border border-amber-200">
                  {quizCount} câu trắc nghiệm
                </span>
                <span className="rounded-lg bg-social-violet/10 px-2 py-1 text-social-violet font-bold border border-social-violet/20">
                  {matchCount} cặp thẻ
                </span>
              </div>
            ) : (
              <div className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 inline-block">
                Đã tóm tắt Smart Cheatsheet
              </div>
            )
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 flex items-center justify-between gap-2 pt-3 border-t border-[#F0EEF8]">
        <span className="text-[11px] text-[#A5A0B8]">
          {formatDate(material.createdAt)}
        </span>

        {isCompleted && (
          <div className="flex items-center gap-1.5">
            {hasMinigames && (
              <button
                type="button"
                onClick={() => onOpenLeaderboard(material)}
                title="Xem Bảng xếp hạng"
                className="rounded-xl border border-[#E5E2EC] bg-[#FAF9FD] px-2.5 py-1.5 text-xs font-bold text-[#4F4965] hover:bg-[#F0EEF8] transition-colors"
              >
                BXH
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenStudy(material, "cheatsheet")}
              className="rounded-xl border border-[#E5E2EC] bg-[#FAF9FD] px-3 py-1.5 text-xs font-bold text-[#4F4965] hover:bg-[#F0EEF8] transition-colors"
            >
              Tóm tắt
            </button>

            {hasMinigames ? (
              <button
                type="button"
                onClick={() => onOpenStudy(material, "quiz")}
                className="rounded-xl bg-social-violet px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] hover:shadow-social-violet/35 transition-all"
              >
                Vào ôn tập
              </button>
            ) : (
              <button
                type="button"
                disabled={isGeneratingMinigames}
                onClick={() => onGenerateMinigames && onGenerateMinigames(material)}
                className="rounded-xl bg-social-violet px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-500/25 hover:bg-[#6E60DC] transition-all disabled:opacity-50"
              >
                {isGeneratingMinigames ? "Đang tạo..." : "Tạo Minigame"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialCard;

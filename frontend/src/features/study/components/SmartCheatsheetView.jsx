import React, { useState } from "react";
import MathText from "./MathText";

export default function SmartCheatsheetView({
  material,
  onBack,
  onStartQuiz,
  onStartMemoryMatch,
  onGenerateMinigames,
  onDelete,
  isGeneratingMinigames = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const rawMarkdown = material?.aiSummaryMarkdown || "Chưa có bản tóm tắt nào.";
  const hasMinigames = (material?.quizData?.length || 0) > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tách nội dung theo 3 phần chuẩn nếu có
  const sections = [];
  const lines = rawMarkdown.split("\n");
  let currentSection = { title: "Tổng quan", content: [] };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: line.replace("## ", "").trim(), content: [] };
    } else if (line.startsWith("# ")) {
      // Tiêu đề chính
    } else {
      currentSection.content.push(line);
    }
  }
  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  // Filter theo từ khóa
  const filteredSections = sections.map((sec) => {
    const text = sec.content.join("\n");
    const matchesSearch = !searchTerm.trim() || 
      sec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      text.toLowerCase().includes(searchTerm.toLowerCase());
    return { ...sec, matchesSearch };
  }).filter((s) => s.matchesSearch);

  const getSectionBadgeClass = (title) => {
    if (title.includes("1") || title.toLowerCase().includes("khái niệm")) return "border-violet-200 bg-violet-50 text-violet-700";
    if (title.includes("2") || title.toLowerCase().includes("công thức")) return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-6 border border-[#E5E2EC] shadow-sm">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-social-violet hover:underline mb-1 inline-block"
          >
            Quay lại danh sách
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-[#2F2A45]">
            {material?.title}
          </h1>
          <p className="text-xs text-[#77718C] mt-1 flex items-center gap-2">
            <span>Môn: <strong className="text-[#2F2A45]">{material?.subjectName}</strong></span>
            <span>•</span>
            <span>Tệp: {material?.fileName}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl border border-[#E5E2EC] bg-[#FAF9FD] px-3.5 py-2 text-xs font-bold text-[#4F4965] hover:bg-[#F0EEF8] transition-colors"
          >
            {copied ? "Đã sao chép!" : "Sao chép tóm tắt"}
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(material)}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors"
            >
              Xóa tài liệu
            </button>
          )}

          {hasMinigames ? (
            <>
              <button
                type="button"
                onClick={onStartQuiz}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-amber-500/25 hover:bg-amber-600 transition-all hover:scale-105"
              >
                Đấu trường Trắc nghiệm
              </button>

              <button
                type="button"
                onClick={onStartMemoryMatch}
                className="rounded-xl bg-social-violet px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] transition-all hover:scale-105"
              >
                Lật thẻ Ghép cặp
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isGeneratingMinigames}
              onClick={() => onGenerateMinigames && onGenerateMinigames(material)}
              className="rounded-xl bg-social-violet px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-violet-500/25 hover:bg-[#6E60DC] transition-all hover:scale-105 disabled:opacity-50"
            >
              {isGeneratingMinigames ? "Đang tạo minigame..." : "Khởi tạo Minigames"}
            </button>
          )}
        </div>
      </div>

      {/* Banner Khởi tạo Minigame nếu chưa có */}
      {!hasMinigames && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-social-violet/10 p-4 border border-social-violet/20 animate-in fade-in duration-300">
          <div>
            <p className="text-sm font-black text-[#2F2A45]">Muốn kiểm tra mức độ ghi nhớ kiến thức?</p>
            <p className="text-xs text-[#6B6584] mt-0.5">Tạo 10 câu hỏi trắc nghiệm tốc độ và bộ thẻ lật ghi nhớ từ nội dung bản tóm tắt này.</p>
          </div>
          <button
            type="button"
            disabled={isGeneratingMinigames}
            onClick={() => onGenerateMinigames && onGenerateMinigames(material)}
            className="shrink-0 rounded-xl bg-social-violet px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] transition-all disabled:opacity-50"
          >
            {isGeneratingMinigames ? "Đang xử lý..." : "Tạo Minigames ngay"}
          </button>
        </div>
      )}

      {/* Tìm kiếm trong tài liệu */}
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm khái niệm, định nghĩa, công thức hoặc từ khóa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-[#E5E2EC] bg-white px-4 py-3 text-sm text-[#2F2A45] shadow-sm focus:border-social-violet focus:outline-none focus:ring-4 focus:ring-social-violet/15"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-4 top-3.5 text-xs text-[#77718C] hover:text-[#2F2A45]"
          >
            Xóa tìm kiếm
          </button>
        )}
      </div>

      {/* Các mục tóm tắt dạng Card */}
      <div className="space-y-6">
        {filteredSections.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E5E2EC] bg-white p-12 text-center text-[#77718C]">
            <p className="text-base font-bold text-[#2F2A45]">Không tìm thấy nội dung khớp với "{searchTerm}"</p>
            <p className="text-xs mt-1">Hãy thử với từ khóa khác ngắn gọn hơn.</p>
          </div>
        ) : (
          filteredSections.map((sec, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-[#E5E2EC] bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md"
            >
              <div className="pb-4 border-b border-[#F0EEF8]">
                <span className={`inline-block rounded-md border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${getSectionBadgeClass(sec.title)}`}>
                  Phần {idx + 1}
                </span>
                <h2 className="text-lg font-black text-[#2F2A45] mt-1.5">
                  {sec.title}
                </h2>
              </div>

              <div className="mt-5 space-y-3 text-sm leading-relaxed text-[#4F4965]">
                {sec.content.map((paragraph, pIdx) => {
                  const trimmed = paragraph.trim();
                  if (!trimmed) return null;

                  if (trimmed.startsWith("- **") || trimmed.startsWith("* **")) {
                    const parts = trimmed.slice(4).split("**:");
                    if (parts.length >= 2) {
                      return (
                        <div key={pIdx} className="rounded-2xl bg-[#FAF9FD] p-3.5 border border-[#F0EEF8]">
                          <MathText text={parts[0]} as="strong" className="text-social-violet font-extrabold block" />
                          <MathText text={parts.slice(1).join("**:").trim()} as="div" className="mt-1 text-[#4F4965] leading-relaxed" />
                        </div>
                      );
                    }
                  }

                  if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                    return (
                      <div key={pIdx} className="flex items-start gap-2.5 pl-1">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-social-violet" />
                        <MathText text={trimmed.slice(2)} as="span" className="leading-relaxed" />
                      </div>
                    );
                  }

                  if (trimmed.startsWith("### ")) {
                    return (
                      <MathText
                        key={pIdx}
                        text={trimmed.slice(4)}
                        as="h3"
                        className="font-extrabold text-[#2F2A45] pt-2 text-base"
                      />
                    );
                  }

                  return (
                    <MathText
                      key={pIdx}
                      text={trimmed}
                      as="div"
                      className="text-[#4F4965] leading-relaxed"
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

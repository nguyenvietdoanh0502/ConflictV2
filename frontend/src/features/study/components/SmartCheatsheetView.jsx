import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectAccessToken, selectCurrentUser } from "../../auth/authSelectors";
import MathText from "./MathText";

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SmartCheatsheetView({
  material,
  initialTab = "cheatsheet", // "cheatsheet" | "original"
  onBack,
  onStartQuiz,
  onStartMemoryMatch,
  onGenerateMinigames,
  onOpenShare,
  onDelete,
  isGeneratingMinigames = false,
}) {
  const accessToken = useSelector(selectAccessToken);
  const currentUser = useSelector(selectCurrentUser);

  const [activeDocTab, setActiveDocTab] = useState(
    initialTab === "original" ? "original" : "cheatsheet"
  );
  const [originalSubView, setOriginalSubView] = useState("text"); // "text" | "pdf"
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  // PDF Blob URL state for inline preview
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState("");

  // Revoke blob URL on unmount or material change
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const rawMarkdown = material?.aiSummaryMarkdown || "Chưa có bản tóm tắt nào.";
  const rawOriginalText = (material?.extractedText || "").trim();
  const hasMinigames =
    (material?.quizData?.length || 0) > 0 ||
    (material?.memoryMatchData?.length || 0) > 0;
  const isPdf = (material?.fileType || "").toUpperCase() === "PDF";
  const hasOriginalFile = Boolean(material?.hasOriginalFile || material?.fileUrl);
  const isOwner =
    material?.isOwner !== undefined
      ? material.isOwner
      : !currentUser?.id || material?.userId === currentUser?.id;

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  const fetchMaterialFileBlob = useCallback(
    async (download = false) => {
      const url = `${apiBase}/v1/materials/${material?.id}/file?download=${download}`;
      const res = await fetch(url, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) {
        throw new Error("Không thể tải tệp gốc của đề cương này.");
      }
      return await res.blob();
    },
    [apiBase, material?.id, accessToken]
  );

  const handleSelectPdfSubView = async () => {
    setOriginalSubView("pdf");
    if (pdfBlobUrl || !isPdf || !hasOriginalFile || !material?.id) return;

    setIsLoadingFile(true);
    setFileError("");
    try {
      const blob = await fetchMaterialFileBlob(false);
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(objectUrl);
    } catch (err) {
      setFileError(err.message || "Không thể hiển thị bản xem trước PDF.");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleDownloadOriginalFile = async () => {
    if (!material?.id) return;
    setIsLoadingFile(true);
    setFileError("");
    try {
      const blob = await fetchMaterialFileBlob(true);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download =
        material.fileName ||
        `${material.title || "de-cuong"}.${(material.fileType || "txt").toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    } catch (err) {
      setFileError(err.message || "Không thể tải tệp gốc về máy.");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleCopy = () => {
    const textToCopy =
      activeDocTab === "original" && rawOriginalText ? rawOriginalText : rawMarkdown;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tách nội dung tóm tắt theo 3 phần chuẩn nếu có
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

  // Filter tóm tắt theo từ khóa
  const filteredSections = sections
    .map((sec) => {
      const text = sec.content.join("\n");
      const matchesSearch =
        !searchTerm.trim() ||
        sec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        text.toLowerCase().includes(searchTerm.toLowerCase());
      return { ...sec, matchesSearch };
    })
    .filter((s) => s.matchesSearch);

  // Tách đoạn văn bản gốc và lọc theo từ khóa
  const originalParagraphs = rawOriginalText
    ? rawOriginalText.split(/\n+/).filter((p) => p.trim().length > 0)
    : [];
  const filteredOriginalParagraphs = searchTerm.trim()
    ? originalParagraphs.filter((p) =>
        p.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : originalParagraphs;

  const wordCount = rawOriginalText
    ? rawOriginalText.split(/\s+/).filter(Boolean).length
    : 0;

  const getSectionBadgeClass = (title) => {
    if (title.includes("1") || title.toLowerCase().includes("khái niệm"))
      return "border-violet-200 bg-violet-50 text-violet-700";
    if (title.includes("2") || title.toLowerCase().includes("công thức"))
      return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-6 border border-[#E5E2EC] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold text-social-violet hover:underline inline-block"
            >
              ← Quay lại danh sách
            </button>
            {!isOwner && material?.ownerName && (
              <span className="rounded-full bg-social-violet/10 border border-social-violet/20 px-2.5 py-0.5 text-[11px] font-bold text-social-violet">
                Chia sẻ bởi {material.ownerName}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2F2A45]">
            {material?.title}
          </h1>
          <p className="text-xs text-[#77718C] mt-1 flex flex-wrap items-center gap-2">
            <span>
              Môn: <strong className="text-[#2F2A45]">{material?.subjectName}</strong>
            </span>
            <span>•</span>
            <span>Tệp: {material?.fileName}</span>
            {material?.fileSize ? (
              <>
                <span>•</span>
                <span>{formatFileSize(material.fileSize)}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl border border-[#E5E2EC] bg-[#FAF9FD] px-3.5 py-2 text-xs font-bold text-[#4F4965] hover:bg-[#F0EEF8] transition-colors"
          >
            {copied
              ? "Đã sao chép!"
              : activeDocTab === "original"
              ? "Sao chép bản gốc"
              : "Sao chép tóm tắt"}
          </button>

          {onOpenShare && (
            <>
              <button
                type="button"
                onClick={() => onOpenShare(material, "SHARE_MATERIAL")}
                className="rounded-xl border border-social-violet/30 bg-social-violet/10 px-3.5 py-2 text-xs font-extrabold text-social-violet hover:bg-social-violet/20 transition-colors"
              >
                Chia sẻ
              </button>

              <button
                type="button"
                onClick={() => onOpenShare(material, "CHALLENGE_GAME")}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                Thách đấu bạn bè
              </button>
            </>
          )}

          {isOwner && onDelete && (
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

      {/* Thanh chuyển đổi giữa Bản Tóm Tắt AI & Bản Gốc Đề Cương */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white p-2 border border-[#E5E2EC] shadow-xs">
        <div className="flex rounded-xl bg-[#F0EEF8] p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveDocTab("cheatsheet")}
            className={`rounded-lg px-4 py-2 transition-all ${
              activeDocTab === "cheatsheet"
                ? "bg-white text-social-violet shadow-xs font-extrabold"
                : "text-[#6F6B83] hover:text-[#2F2A45]"
            }`}
          >
            Bản tóm tắt AI 
          </button>

          <button
            type="button"
            onClick={() => setActiveDocTab("original")}
            className={`rounded-lg px-4 py-2 transition-all ${
              activeDocTab === "original"
                ? "bg-white text-social-violet shadow-xs font-extrabold"
                : "text-[#6F6B83] hover:text-[#2F2A45]"
            }`}
          >
            Đề cương gốc ({material?.fileType || "Tài liệu"})
          </button>
        </div>

        {/* Nút phụ khi ở tab Đề cương gốc */}
        {activeDocTab === "original" && (
          <div className="flex flex-wrap items-center gap-2 px-2">
            {isPdf && hasOriginalFile && (
              <div className="flex rounded-xl bg-[#FAF9FD] border border-[#E5E2EC] p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setOriginalSubView("text")}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    originalSubView === "text"
                      ? "bg-social-violet text-white"
                      : "text-[#6F6B83] hover:text-[#2F2A45]"
                  }`}
                >
                  Văn bản gốc
                </button>
                <button
                  type="button"
                  onClick={handleSelectPdfSubView}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    originalSubView === "pdf"
                      ? "bg-social-violet text-white"
                      : "text-[#6F6B83] hover:text-[#2F2A45]"
                  }`}
                >
                  Xem file PDF gốc
                </button>
              </div>
            )}

            {(hasOriginalFile || rawOriginalText) && (
              <button
                type="button"
                disabled={isLoadingFile}
                onClick={handleDownloadOriginalFile}
                className="rounded-xl border border-social-violet/30 bg-[#FAF9FD] px-3 py-1.5 text-xs font-extrabold text-social-violet hover:bg-social-violet/10 transition disabled:opacity-50"
              >
                {isLoadingFile ? "Đang tải..." : "⬇Tải tệp gốc"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Banner Khởi tạo Minigame nếu chưa có */}
      {!hasMinigames && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-social-violet/10 p-4 border border-social-violet/20 animate-in fade-in duration-300">
          <div>
            <p className="text-sm font-black text-[#2F2A45]">
              Muốn kiểm tra mức độ ghi nhớ kiến thức hoặc thách đấu bạn bè?
            </p>
            <p className="text-xs text-[#6B6584] mt-0.5">
              Tạo 10 câu hỏi trắc nghiệm tốc độ và bộ thẻ lật ghi nhớ từ nội dung đề cương này.
            </p>
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

      {/* Tìm kiếm trong tài liệu (ẩn khi đang ở chế độ xem iframe PDF) */}
      {!(activeDocTab === "original" && originalSubView === "pdf") && (
        <div className="relative">
          <input
            type="text"
            placeholder={
              activeDocTab === "original"
                ? "Tìm kiếm từ khóa, đoạn văn trong nội dung đề cương gốc..."
                : "Tìm kiếm khái niệm, định nghĩa, công thức hoặc từ khóa trong bản tóm tắt..."
            }
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
      )}

      {/* ==================== TAB 1: BẢN TÓM TẮT AI ==================== */}
      {activeDocTab === "cheatsheet" && (
        <div className="space-y-6">
          {filteredSections.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E5E2EC] bg-white p-12 text-center text-[#77718C]">
              <p className="text-base font-bold text-[#2F2A45]">
                Không tìm thấy nội dung khớp với "{searchTerm}"
              </p>
              <p className="text-xs mt-1">Hãy thử với từ khóa khác ngắn gọn hơn.</p>
            </div>
          ) : (
            filteredSections.map((sec, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-[#E5E2EC] bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md"
              >
                <div className="pb-4 border-b border-[#F0EEF8]">
                  <span
                    className={`inline-block rounded-md border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${getSectionBadgeClass(
                      sec.title
                    )}`}
                  >
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
                          <div
                            key={pIdx}
                            className="rounded-2xl bg-[#FAF9FD] p-3.5 border border-[#F0EEF8]"
                          >
                            <MathText
                              text={parts[0]}
                              as="strong"
                              className="text-social-violet font-extrabold block"
                            />
                            <MathText
                              text={parts.slice(1).join("**:").trim()}
                              as="div"
                              className="mt-1 text-[#4F4965] leading-relaxed"
                            />
                          </div>
                        );
                      }
                    }

                    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                      return (
                        <div key={pIdx} className="flex items-start gap-2.5 pl-1">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-social-violet" />
                          <MathText
                            text={trimmed.slice(2)}
                            as="span"
                            className="leading-relaxed"
                          />
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
      )}

      {/* ==================== TAB 2: ĐỀ CƯƠNG GỐC ==================== */}
      {activeDocTab === "original" && (
        <div className="rounded-3xl border border-[#E5E2EC] bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[#F0EEF8]">
            <div>
              <span className="inline-block rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
                Nội dung gốc từ tệp tải lên
              </span>
              <h2 className="text-lg font-black text-[#2F2A45] mt-1.5">
                {material?.fileName || material?.title}
              </h2>
            </div>

            {rawOriginalText && (
              <div className="flex items-center gap-3 text-xs text-[#77718C]">
                <span className="rounded-xl bg-[#FAF9FD] border border-[#E5E2EC] px-3 py-1 font-semibold">
                  {wordCount.toLocaleString("vi-VN")} từ
                </span>
                <span className="rounded-xl bg-[#FAF9FD] border border-[#E5E2EC] px-3 py-1 font-semibold">
                  {rawOriginalText.length.toLocaleString("vi-VN")} ký tự
                </span>
              </div>
            )}
          </div>

          {fileError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-600">
              {fileError}
            </div>
          )}

          {/* Chế độ xem trực tiếp PDF gốc */}
          {originalSubView === "pdf" && isPdf && hasOriginalFile ? (
            <div className="w-full">
              {isLoadingFile ? (
                <div className="py-20 text-center text-xs font-bold text-[#77718C] animate-pulse">
                  Đang tải tệp PDF gốc...
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title={material?.fileName || "PDF gốc"}
                  className="w-full h-[720px] rounded-2xl border border-[#E5E2EC] bg-[#FAF9FD]"
                />
              ) : (
                <div className="py-12 text-center text-xs text-[#77718C]">
                  Không thể hiển thị khung PDF trực tiếp. Vui lòng bấm "⬇️ Tải tệp gốc" hoặc xem ở chế độ "📝 Văn bản gốc".
                </div>
              )}
            </div>
          ) : rawOriginalText ? (
            /* Chế độ đọc văn bản gốc trích xuất */
            filteredOriginalParagraphs.length === 0 ? (
              <div className="py-12 text-center text-[#77718C]">
                <p className="text-sm font-bold text-[#2F2A45]">
                  Không tìm thấy đoạn văn nào khớp với "{searchTerm}"
                </p>
              </div>
            ) : (
              <div className="max-h-[680px] overflow-y-auto rounded-2xl bg-[#FAF9FD] border border-[#F0EEF8] p-5 sm:p-6 space-y-3 text-sm leading-relaxed text-[#2F2A45] custom-scrollbar">
                {filteredOriginalParagraphs.map((para, idx) => (
                  <p key={idx} className="whitespace-pre-wrap break-words">
                    {para}
                  </p>
                ))}
              </div>
            )
          ) : (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-extrabold text-[#2F2A45]">
                Tài liệu này được tải lên trước khi hệ thống bật lưu trữ văn bản gốc.
              </p>
              <p className="text-xs text-[#77718C] max-w-md mx-auto">
                Các tài liệu tải lên mới sẽ hiển thị đầy đủ toàn bộ văn bản gốc và tệp gốc tại đây để bạn đối chiếu với bản tóm tắt AI.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

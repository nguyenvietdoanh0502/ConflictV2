import React, { useState, useRef, useEffect } from "react";
import { useUploadMaterialMutation } from "../services/studyApi";

const LOADING_STEPS = [
  { step: "01", title: "Đang tải lên & bóc tách tệp...", desc: "Đọc cấu trúc văn bản và trích xuất nội dung đề cương" },
  { step: "02", title: "AI Gemini đang đọc hiểu tài liệu...", desc: "Phân loại các khái niệm, định nghĩa và công thức trọng tâm" },
  { step: "03", title: "Đang tổng hợp 3 phần Smart Cheatsheet...", desc: "Bóc tách: Khái niệm cốt lõi, Công thức cần nhớ & Câu hỏi thường gặp" },
  { step: "04", title: "Sắp hoàn thành bản tóm tắt...", desc: "Định dạng Markdown và hoàn tất lưu trữ" }
];

export default function MaterialUploadModal({
  isOpen,
  onClose,
  subjects = [],
  defaultSubjectId,
  onSuccess,
}) {
  const [uploadMaterial, { isLoading }] = useUploadMaterialMutation();
  const fileInputRef = useRef(null);

  const [subjectId, setSubjectId] = useState(defaultSubjectId || (subjects[0]?.id || ""));
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let timer;
    if (isLoading) {
      setLoadingStep(0);
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 4000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  if (!isOpen) return null;

  const handleFileChange = (file) => {
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext)) {
      setErrorMsg("Chỉ hỗ trợ file định dạng .pdf, .docx, hoặc .txt");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg("Dung lượng file vượt quá giới hạn cho phép (tối đa 20MB)");
      return;
    }

    setErrorMsg("");
    setSelectedFile(file);
    if (!title.trim()) {
      const cleanName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      setTitle(cleanName);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectId) {
      setErrorMsg("Vui lòng chọn môn học cho tài liệu này");
      return;
    }
    if (!selectedFile) {
      setErrorMsg("Vui lòng chọn hoặc kéo thả file đề cương vào ô tải lên");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("subjectId", subjectId);
    if (title.trim()) {
      formData.append("title", title.trim());
    }

    try {
      const res = await uploadMaterial(formData).unwrap();
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      const msg = err?.data?.message || "Không thể xử lý tài liệu. Vui lòng kiểm tra lại file hoặc mạng.";
      setErrorMsg(msg);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const currentStepInfo = LOADING_STEPS[loadingStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#E5E2EC] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E2EC]">
          <div>
            <h3 className="text-lg font-extrabold text-[#2F2A45]">Tải Lên Đề Cương & Bài Giảng</h3>
            <p className="text-xs text-[#77718C] mt-0.5">Tự động phân tích và tạo Smart Cheatsheet</p>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-full p-2 text-[#77718C] hover:bg-[#F0EEF8] hover:text-[#2F2A45] text-xs font-bold disabled:opacity-50"
          >
            Đóng
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4F4965] mb-1">
              Gắn vào Môn học <span className="text-rose-500">*</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-[#E5E2EC] bg-[#FDFCFE] px-3.5 py-2.5 text-sm font-semibold text-[#2F2A45] focus:border-social-violet focus:outline-none focus:ring-4 focus:ring-social-violet/15 disabled:opacity-60"
            >
              <option value="" disabled>-- Chọn môn học --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4F4965] mb-1">
              Tiêu đề tài liệu / Bộ câu hỏi
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Đề cương Ôn thi Giữa kỳ, Slide Bài giảng Chương 3..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-[#E5E2EC] bg-[#FDFCFE] px-3.5 py-2.5 text-sm text-[#2F2A45] focus:border-social-violet focus:outline-none focus:ring-4 focus:ring-social-violet/15 disabled:opacity-60"
            />
          </div>

          {/* Vùng kéo thả file */}
          <div>
            <label className="block text-xs font-bold text-[#4F4965] mb-1.5">
              Tệp tài liệu (.pdf, .docx, .txt) <span className="text-rose-500">*</span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isLoading && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                isLoading
                  ? "pointer-events-none opacity-60 border-[#E5E2EC] bg-[#FAF9FD]"
                  : isDragOver
                  ? "border-social-violet bg-social-violet/10 scale-[1.01] cursor-pointer"
                  : selectedFile
                  ? "border-emerald-400 bg-emerald-50/50 cursor-pointer"
                  : "border-[#E5E2EC] bg-[#FAF9FD] hover:bg-[#F3F1FA] hover:border-social-violet/40 cursor-pointer"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                disabled={isLoading}
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(e) => handleFileChange(e.target.files[0])}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-sm font-extrabold text-[#2F2A45] max-w-[320px] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs font-medium text-[#77718C]">
                    {formatFileSize(selectedFile.size)} • {isLoading ? "Đang xử lý tệp..." : "Nhấn để chọn tệp khác"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-sm font-bold text-[#2F2A45]">
                    Kéo thả file vào đây, hoặc <span className="text-social-violet underline font-bold">chọn từ máy tính</span>
                  </p>
                  <p className="text-xs text-[#77718C] mt-0.5">
                    Hỗ trợ PDF, Word (.docx) hoặc Text (.txt), tối đa 20MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Trạng thái xử lý AI */}
          {isLoading && (
            <div className="rounded-2xl border border-social-violet/20 bg-gradient-to-br from-[#F5F3FC] to-[#EDE9FE] p-4 text-center shadow-inner animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-bold text-social-violet mb-2">
                <span className="font-mono bg-social-violet/15 px-2.5 py-0.5 rounded-md">TIẾN TRÌNH [{currentStepInfo.step}/04]</span>
                <span className="text-[#77718C] font-normal">AI có thể mất 10-25s để phân tích chuyên sâu</span>
              </div>
              <div className="text-left py-1">
                <h4 className="text-sm font-black text-[#2F2A45]">
                  {currentStepInfo.title}
                </h4>
                <p className="text-xs text-[#6B6584] mt-0.5">
                  {currentStepInfo.desc}
                </p>
              </div>

              {/* Progress bar dạng gradient */}
              <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-white/70 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-social-violet via-purple-500 to-indigo-500 transition-all duration-700 ease-out"
                  style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E2EC]">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#77718C] hover:bg-[#F0EEF8] disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedFile || !subjectId}
              className="rounded-xl bg-social-violet px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] disabled:opacity-50 transition-all"
            >
              {isLoading ? "Đang tổng hợp..." : "Bắt đầu tóm tắt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

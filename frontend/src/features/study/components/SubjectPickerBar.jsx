import { getLocalizedErrorMessage } from "../../../utils/errorMessages";
import React, { useState } from "react";
import { useCreateSubjectMutation } from "../../timetable/services/timetableApi";

export default function SubjectPickerBar({
  subjects = [],
  selectedSubjectId,
  onSelectSubject,
  isLoading = false,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createSubject, { isLoading: isCreating }] = useCreateSubjectMutation();

  const [form, setForm] = useState({
    name: "",
    code: "",
    lecturer: "",
    defaultRoom: "",
    colorHex: "#7C6EE6",
  });
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpenModal = () => {
    setForm({
      name: "",
      code: "",
      lecturer: "",
      defaultRoom: "",
      colorHex: "#7C6EE6",
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg("Vui lòng nhập tên môn học");
      return;
    }

    try {
      const res = await createSubject({
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        lecturer: form.lecturer.trim() || undefined,
        defaultRoom: form.defaultRoom.trim() || undefined,
        colorHex: form.colorHex || "#7C6EE6",
      }).unwrap();

      setIsModalOpen(false);
      if (res?.data?.id) {
        onSelectSubject(res.data.id);
      }
    } catch (err) {
      setErrorMsg(getLocalizedErrorMessage(err, "Không thể tạo môn học. Vui lòng thử lại."));
    }
  };

  const presetColors = [
    "#7C6EE6", // UniSync Violet
    "#2563EB", // Blue
    "#059669", // Emerald
    "#D97706", // Amber
    "#DC2626", // Red
    "#8B5CF6", // Purple
    "#0891B2", // Cyan
    "#DB2777", // Pink
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E2EC]">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-[#77718C]">
            Môn học
          </h2>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="rounded-xl bg-[#FAF9FD] px-3.5 py-1.5 text-xs font-bold text-social-violet hover:bg-social-violet/10 transition-colors"
        >
          + Thêm môn học
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-2 overflow-x-auto py-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-28 animate-pulse rounded-2xl bg-[#FAF9FD]" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex items-center justify-between rounded-2xl border border-dashed border-[#E5E2EC] bg-[#FAF9FD] p-4 mt-3">
          <div className="text-xs text-[#77718C]">
            Chưa có môn học nào. Tạo môn học đầu tiên để gắn tài liệu học tập.
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="rounded-xl bg-social-violet px-4 py-2 text-xs font-bold text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] transition-all"
          >
            Tạo môn học
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-thin">
          <button
            type="button"
            onClick={() => onSelectSubject(null)}
            className={`inline-flex h-10 shrink-0 items-center justify-center rounded-2xl px-4 text-xs font-bold transition-colors ${
              selectedSubjectId === null
                ? "border border-social-violet bg-social-violet text-white shadow-sm shadow-social-violet/25"
                : "border border-[#E5E2EC] bg-[#FAF9FD] text-[#4F4965] hover:border-social-violet/30 hover:bg-[#F0EEF8]"
            }`}
          >
            Tất cả môn
          </button>

          {subjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectSubject(sub.id)}
                className={`group inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-bold transition-colors ${
                  isSelected
                    ? "border border-social-violet bg-social-violet text-white shadow-sm shadow-social-violet/25"
                    : "border border-[#E5E2EC] bg-[#FAF9FD] text-[#4F4965] hover:border-social-violet/30 hover:bg-[#F0EEF8]"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: sub.colorHex || "#7C6EE6" }}
                />
                <span className="truncate max-w-[150px] leading-none">{sub.name}</span>
                {sub.code && (
                  <span
                    className={`inline-flex items-center justify-center rounded-lg px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-[#E5E2EC]/60 text-[#77718C]"
                    }`}
                  >
                    {sub.code}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Modal Thêm Môn học Nhanh */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#E5E2EC] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2EC]">
              <h3 className="text-base font-extrabold text-[#2F2A45]">Tạo môn học mới</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-[#77718C] hover:bg-[#F0EEF8] hover:text-[#2F2A45] text-xs font-bold"
              >
                Đóng
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4F4965] mb-1">
                  Tên môn học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lập trình Web, CSDL..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-[#E5E2EC] bg-[#FDFCFE] px-3.5 py-2.5 text-sm text-[#2F2A45] focus:border-social-violet focus:outline-none focus:ring-4 focus:ring-social-violet/15"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4F4965] mb-1">
                    Mã môn / Mã lớp
                  </label>
                  <input
                    type="text"
                    placeholder="IT3080"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full rounded-xl border border-[#E5E2EC] bg-[#FDFCFE] px-3 py-2 text-sm text-[#2F2A45] focus:border-social-violet focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4F4965] mb-1">
                    Phòng học mặc định
                  </label>
                  <input
                    type="text"
                    placeholder="402-A1"
                    value={form.defaultRoom}
                    onChange={(e) => setForm({ ...form, defaultRoom: e.target.value })}
                    className="w-full rounded-xl border border-[#E5E2EC] bg-[#FDFCFE] px-3 py-2 text-sm text-[#2F2A45] focus:border-social-violet focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4F4965] mb-1">
                  Giảng viên phụ trách
                </label>
                <input
                  type="text"
                  placeholder="Thầy/Cô..."
                  value={form.lecturer}
                  onChange={(e) => setForm({ ...form, lecturer: e.target.value })}
                  className="w-full rounded-xl border border-[#E5E2EC] bg-[#FDFCFE] px-3.5 py-2 text-sm text-[#2F2A45] focus:border-social-violet focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4F4965] mb-2">
                  Màu sắc nhận diện
                </label>
                <div className="flex items-center gap-2.5">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, colorHex: color })}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        form.colorHex === color ? "scale-125 ring-2 ring-offset-2 ring-social-violet" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E2EC]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#77718C] hover:bg-[#F0EEF8] transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-xl bg-social-violet px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] disabled:opacity-50 transition-all"
                >
                  {isCreating ? "Đang tạo..." : "Tạo môn học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

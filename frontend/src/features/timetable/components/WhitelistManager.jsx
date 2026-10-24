import { useState } from "react";
import {
  ShieldCheck,
  BookOpen,
  Link2,
  Trash2,
  X,
  Sparkles,
  Calendar,
  Clock
} from "lucide-react";
import {
  useGetSubjectsQuery,
  useCreateSubjectMutation,
  useDeleteSubjectMutation,
  useGetZaloMappingsQuery,
  useCreateZaloMappingMutation,
  useToggleZaloMappingMutation,
  useDeleteZaloMappingMutation,
} from "../services/timetableApi";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

const DAYS_OF_WEEK = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 7, label: "Chủ Nhật" },
];

const RAW_PERIODS = [
  { period: 1, start: "07:00", end: "07:50", shift: "Sáng" },
  { period: 2, start: "07:50", end: "08:40", shift: "Sáng" },
  { period: 3, start: "08:45", end: "09:35", shift: "Sáng" },
  { period: 4, start: "09:40", end: "10:30", shift: "Sáng" },
  { period: 5, start: "10:35", end: "11:25", shift: "Sáng" },
  { period: 6, start: "11:25", end: "12:15", shift: "Sáng" },
  { period: 7, start: "12:30", end: "13:20", shift: "Chiều" },
  { period: 8, start: "13:20", end: "14:10", shift: "Chiều" },
  { period: 9, start: "14:15", end: "15:05", shift: "Chiều" },
  { period: 10, start: "15:10", end: "16:00", shift: "Chiều" },
  { period: 11, start: "16:05", end: "16:55", shift: "Chiều" },
  { period: 12, start: "16:55", end: "17:45", shift: "Chiều" },
  { period: 13, start: "18:00", end: "18:50", shift: "Tối" },
  { period: 14, start: "18:50", end: "19:40", shift: "Tối" },
  { period: 15, start: "19:45", end: "20:35", shift: "Tối" },
  { period: 16, start: "20:35", end: "21:25", shift: "Tối" },
];

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getFutureDateString = (weeksAhead = 15) => {
  const d = new Date();
  d.setDate(d.getDate() + weeksAhead * 7);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function WhitelistManager({ onSelectGroupForSimulator }) {
  const { data: subjects = [] } = useGetSubjectsQuery();
  const { data: mappings = [], isLoading: isLoadingMappings } = useGetZaloMappingsQuery();

  const [createSubject, { isLoading: isCreatingSubject }] = useCreateSubjectMutation();
  const [deleteSubject, { isLoading: isDeletingSubject }] = useDeleteSubjectMutation();

  const [createMapping, { isLoading: isCreatingMapping }] = useCreateZaloMappingMutation();
  const [toggleMapping] = useToggleZaloMappingMutation();
  const [deleteMapping, { isLoading: isDeletingMapping }] = useDeleteZaloMappingMutation();

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [deleteConfirmState, setDeleteConfirmState] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // Form states for Subject
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    defaultRoom: "",
    colorHex: "#6366F1",
    dayOfWeek: 1, // Thứ 2
    selectedPeriods: [1, 2, 3], // Tiết 1, 2, 3
    semesterStartDate: getTodayDateString(),
    semesterEndDate: getFutureDateString(15),
  });

  // Form states for Mapping
  const [mappingForm, setMappingForm] = useState({
    subjectId: "",
    zaloGroupId: "",
    zaloGroupName: "",
    active: true,
  });

  const handleTogglePeriod = (periodNum) => {
    setSubjectForm((prev) => {
      const exists = prev.selectedPeriods.includes(periodNum);
      let updated;
      if (exists) {
        if (prev.selectedPeriods.length === 1) return prev; // Keep at least one
        updated = prev.selectedPeriods.filter((p) => p !== periodNum);
      } else {
        updated = [...prev.selectedPeriods, periodNum].sort((a, b) => a - b);
      }
      return { ...prev, selectedPeriods: updated };
    });
  };

  const minPeriod = subjectForm.selectedPeriods.length > 0
    ? Math.min(...subjectForm.selectedPeriods)
    : 1;
  const maxPeriod = subjectForm.selectedPeriods.length > 0
    ? Math.max(...subjectForm.selectedPeriods)
    : 1;
  const computedStartTime = RAW_PERIODS[minPeriod - 1].start;
  const computedEndTime = RAW_PERIODS[maxPeriod - 1].end;

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) return;

    if (!subjectForm.selectedPeriods || subjectForm.selectedPeriods.length === 0) {
      alert("Vui lòng chọn ít nhất 1 tiết học");
      return;
    }

    if (!subjectForm.semesterStartDate || !subjectForm.semesterEndDate) {
      alert("Vui lòng chọn ngày bắt đầu và kết thúc môn");
      return;
    }

    if (subjectForm.semesterStartDate > subjectForm.semesterEndDate) {
      alert("Ngày bắt đầu không được sau ngày kết thúc");
      return;
    }

    const startTime = `${computedStartTime}:00`;
    const endTime = `${computedEndTime}:00`;

    try {
      await createSubject({
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim() || undefined,
        defaultRoom: subjectForm.defaultRoom.trim() || undefined,
        colorHex: subjectForm.colorHex,
        dayOfWeek: Number(subjectForm.dayOfWeek),
        startTime: startTime,
        endTime: endTime,
        semesterStartDate: subjectForm.semesterStartDate,
        semesterEndDate: subjectForm.semesterEndDate,
      }).unwrap();

      setSubjectForm({
        name: "",
        code: "",
        defaultRoom: "",
        colorHex: "#6366F1",
        dayOfWeek: 1,
        selectedPeriods: [1, 2, 3],
        semesterStartDate: getTodayDateString(),
        semesterEndDate: getFutureDateString(15),
      });
      setShowAddSubject(false);
    } catch (err) {
      alert("Lỗi khi tạo môn học: " + (err.data?.message || err.message));
    }
  };

  const handleCreateMapping = async (e) => {
    e.preventDefault();
    if (!mappingForm.subjectId || !mappingForm.zaloGroupId || !mappingForm.zaloGroupName) {
      alert("Vui lòng điền đầy đủ thông tin ghép nhóm");
      return;
    }
    try {
      await createMapping({
        subjectId: mappingForm.subjectId,
        zaloGroupId: mappingForm.zaloGroupId.trim(),
        zaloGroupName: mappingForm.zaloGroupName.trim(),
        active: mappingForm.active,
      }).unwrap();
      setMappingForm({ subjectId: "", zaloGroupId: "", zaloGroupName: "", active: true });
      setShowAddMapping(false);
    } catch (err) {
      alert("Lỗi khi ghép nhóm Zalo: " + (err.data?.message || err.message));
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleMapping(id).unwrap();
    } catch (err) {
      alert("Lỗi khi đổi trạng thái: " + (err.data?.message || err.message));
    }
  };

  const requestDeleteMapping = (id, name) => {
    setDeleteError("");
    setDeleteConfirmState({
      type: "MAPPING",
      id,
      name,
      title: "Hủy theo dõi nhóm Zalo",
      description: "Bạn có chắc chắn muốn hủy liên kết và ngừng theo dõi nhóm Zalo này?",
      details: "Zalo AI sẽ không còn phân tích tin nhắn và tự động tạo lịch học từ nhóm này nữa.",
      confirmText: "Hủy theo dõi",
    });
  };

  const requestDeleteSubject = (id, name) => {
    setDeleteError("");
    setDeleteConfirmState({
      type: "SUBJECT",
      id,
      name,
      title: "Xác nhận xóa môn học",
      description: "Bạn có chắc chắn muốn xóa môn học này? Thao tác này sẽ xóa toàn bộ sự kiện lịch học và cấu hình liên quan.",
      details: "Toàn bộ các buổi học trên thời khóa biểu và liên kết nhóm Zalo của môn này sẽ bị xóa vĩnh viễn.",
      confirmText: "Xóa môn học",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmState) return;
    setDeleteError("");
    try {
      if (deleteConfirmState.type === "SUBJECT") {
        await deleteSubject(deleteConfirmState.id).unwrap();
      } else if (deleteConfirmState.type === "MAPPING") {
        await deleteMapping(deleteConfirmState.id).unwrap();
      }
      setDeleteConfirmState(null);
    } catch (err) {
      setDeleteError(err.data?.message || err.message || "Xóa thất bại!");
    }
  };

  // Quick Seed helper: 1-click test data creation
  const handleQuickSeed = async () => {
    try {
      const today = getTodayDateString();
      const future = getFutureDateString(15);

      // 1. Tạo môn Lập trình Web (Thứ 3, Tiết 1-3)
      const s1 = await createSubject({
        name: "Lập trình Web",
        code: "IT101",
        defaultRoom: "401-A1",
        colorHex: "#6366F1",
        dayOfWeek: 2,
        startTime: "07:00:00",
        endTime: "09:35:00",
        semesterStartDate: today,
        semesterEndDate: future,
      }).unwrap();

      // 2. Tạo môn Cơ sở dữ liệu (Thứ 5, Tiết 7-9)
      const s2 = await createSubject({
        name: "Cơ sở dữ liệu",
        code: "IT102",
        defaultRoom: "203-A2",
        colorHex: "#10B981",
        dayOfWeek: 4,
        startTime: "12:30:00",
        endTime: "15:05:00",
        semesterStartDate: today,
        semesterEndDate: future,
      }).unwrap();

      const sub1Id = s1.data?.id || s1.id;
      const sub2Id = s2.data?.id || s2.id;

      // 3. Ghép nhóm Zalo
      if (sub1Id) {
        await createMapping({
          subjectId: sub1Id,
          zaloGroupId: "zalo-web-k64",
          zaloGroupName: "Lập trình Web - K64",
          active: true,
        }).unwrap();
      }

      if (sub2Id) {
        await createMapping({
          subjectId: sub2Id,
          zaloGroupId: "zalo-csdl-l02",
          zaloGroupName: "Cơ sở dữ liệu - Lớp 2",
          active: true,
        }).unwrap();
      }
    } catch (err) {
      alert("Tạo dữ liệu mẫu: " + (err.data?.message || err.message));
    }
  };

  const handleOpenAddMappingForSubject = (subjectId, subjectName) => {
    setMappingForm({
      subjectId: subjectId,
      zaloGroupId: "",
      zaloGroupName: `${subjectName} - K`,
      active: true,
    });
    setShowAddMapping(true);
    setShowAddSubject(false);
  };

  const activeCount = mappings.filter((m) => m.active).length;
  const connectedSubjectsCount = subjects.filter((s) =>
    mappings.some((m) => m.subjectId === s.id)
  ).length;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Quản lý Whitelist</h2>
            <p className="text-xs text-slate-500">
              <strong>{subjects.length}</strong> môn học • Đã ghép Zalo: <strong>{connectedSubjectsCount}/{subjects.length}</strong> ({activeCount} nhóm đang bật)
            </p>
          </div>
        </div>

        {mappings.length === 0 && subjects.length === 0 && (
          <button
            onClick={handleQuickSeed}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition border border-indigo-200"
            title="Tạo nhanh 2 môn học và 2 nhóm Zalo để test ngay"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Tạo mẫu test
          </button>
        )}
      </div>

      {/* Action Buttons: Add Subject / Add Mapping */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setShowAddSubject(!showAddSubject);
            setShowAddMapping(false);
          }}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition ${
            showAddSubject
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          + Môn học
        </button>

        <button
          onClick={() => {
            setShowAddMapping(!showAddMapping);
            setShowAddSubject(false);
          }}
          disabled={subjects.length === 0}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition ${
            showAddMapping
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 disabled:opacity-50"
          }`}
          title={subjects.length === 0 ? "Vui lòng tạo môn học trước khi ghép nhóm" : ""}
        >
          <Link2 className="w-3.5 h-3.5" />
          + Ghép Zalo
        </button>
      </div>

      {/* Form Add Subject Modal/Accordion */}
      {showAddSubject && (
        <form onSubmit={handleCreateSubject} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900">Thêm Môn học mới</h4>
            <button type="button" onClick={() => setShowAddSubject(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700">Tên môn học *</label>
            <input
              type="text"
              required
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              placeholder="VD: Lập trình Web"
              className="mt-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-700">Mã môn</label>
              <input
                type="text"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                placeholder="VD: IT101"
                className="mt-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700">Phòng mặc định</label>
              <input
                type="text"
                value={subjectForm.defaultRoom}
                onChange={(e) => setSubjectForm({ ...subjectForm, defaultRoom: e.target.value })}
                placeholder="VD: 401-A1"
                className="mt-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* 1. Thứ học mặc định */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">
              Thứ học mặc định *
            </label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = subjectForm.dayOfWeek === day.value;
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => setSubjectForm({ ...subjectForm, dayOfWeek: day.value })}
                    className={`py-1.5 rounded-xl text-center text-xs font-bold transition ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-indigo-200"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Tiết học mặc định (16 tiết) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" />
                Tiết học mặc định *
              </label>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                Tiết {minPeriod} - {maxPeriod} ({computedStartTime} - {computedEndTime})
              </span>
            </div>

            {/* Shift Presets */}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSubjectForm((prev) => ({ ...prev, selectedPeriods: [1, 2, 3] }))}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition"
              >
                Sáng 1-3
              </button>
              <button
                type="button"
                onClick={() => setSubjectForm((prev) => ({ ...prev, selectedPeriods: [4, 5, 6] }))}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition"
              >
                Sáng 4-6
              </button>
              <button
                type="button"
                onClick={() => setSubjectForm((prev) => ({ ...prev, selectedPeriods: [7, 8, 9] }))}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition"
              >
                Chiều 7-9
              </button>
              <button
                type="button"
                onClick={() => setSubjectForm((prev) => ({ ...prev, selectedPeriods: [10, 11, 12] }))}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition"
              >
                Chiều 10-12
              </button>
              <button
                type="button"
                onClick={() => setSubjectForm((prev) => ({ ...prev, selectedPeriods: [13, 14, 15] }))}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 transition"
              >
                Tối 13-15
              </button>
            </div>

            {/* 16 Period Interactive Buttons */}
            <div className="p-2 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <div className="text-[10px] font-semibold text-slate-400">Ấn vào các tiết để chọn / bỏ chọn:</div>
              <div className="grid grid-cols-8 gap-1">
                {RAW_PERIODS.map((p) => {
                  const isSelected = subjectForm.selectedPeriods.includes(p.period);
                  return (
                    <button
                      key={p.period}
                      type="button"
                      onClick={() => handleTogglePeriod(p.period)}
                      title={`Tiết ${p.period}: ${p.start} - ${p.end} (${p.shift})`}
                      className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white font-extrabold shadow-sm ring-2 ring-indigo-300 ring-offset-1 scale-[1.03]"
                          : "bg-slate-50 hover:bg-indigo-50/70 text-slate-700 border border-slate-200/80 hover:border-indigo-300"
                      }`}
                    >
                      <span className="text-[11px] leading-tight font-extrabold">{p.period}</span>
                      <span className={`text-[8px] leading-tight truncate ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                        {p.start}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Thời gian bắt đầu môn và kết thúc môn (chọn ngày) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-500" />
                Ngày bắt đầu môn *
              </label>
              <input
                type="date"
                required
                value={subjectForm.semesterStartDate}
                onChange={(e) => setSubjectForm({ ...subjectForm, semesterStartDate: e.target.value })}
                className="mt-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-500" />
                Ngày kết thúc môn *
              </label>
              <input
                type="date"
                required
                value={subjectForm.semesterEndDate}
                min={subjectForm.semesterStartDate}
                onChange={(e) => setSubjectForm({ ...subjectForm, semesterEndDate: e.target.value })}
                className="mt-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Auto-schedule note */}
          <div className="p-2.5 rounded-xl bg-indigo-100/60 border border-indigo-200/70 text-[11px] text-indigo-900 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
            <div className="leading-tight">
              Môn học sẽ được <strong>tự động xếp vào thời khóa biểu</strong> cho tất cả các ngày <strong>{DAYS_OF_WEEK.find((d) => d.value === subjectForm.dayOfWeek)?.label}</strong> trong các tuần từ ngày bắt đầu đến kết thúc.
            </div>
          </div>

          {/* Color & Submit */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-slate-700">Màu sắc hiển thị</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={subjectForm.colorHex}
                  onChange={(e) => setSubjectForm({ ...subjectForm, colorHex: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white"
                />
                <span className="text-xs font-mono text-slate-600">{subjectForm.colorHex}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={isCreatingSubject}
              className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow flex items-center gap-1.5"
            >
              {isCreatingSubject ? "Đang lưu & xếp lịch..." : "Lưu & Thêm TKB"}
            </button>
          </div>
        </form>
      )}

      {/* Form Add Mapping Modal/Accordion */}
      {showAddMapping && (
        <form onSubmit={handleCreateMapping} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">Ghép nhóm Zalo vào Môn học</h4>
            <button type="button" onClick={() => setShowAddMapping(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600">Chọn môn học *</label>
            <select
              required
              value={mappingForm.subjectId}
              onChange={(e) => setMappingForm({ ...mappingForm, subjectId: e.target.value })}
              className="mt-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">-- Chọn môn học --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600">Tên nhóm Zalo *</label>
            <input
              type="text"
              required
              value={mappingForm.zaloGroupName}
              onChange={(e) => setMappingForm({ ...mappingForm, zaloGroupName: e.target.value })}
              placeholder="VD: Lập trình Web - K64"
              className="mt-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600">Mã nhóm Zalo (Zalo Group ID) *</label>
            <input
              type="text"
              required
              value={mappingForm.zaloGroupId}
              onChange={(e) => setMappingForm({ ...mappingForm, zaloGroupId: e.target.value })}
              placeholder="VD: zalo-group-101"
              className="mt-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mappingForm.active}
                onChange={(e) => setMappingForm({ ...mappingForm, active: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-xs font-semibold text-slate-700">Kích hoạt theo dõi ngay</span>
            </label>
            <button
              type="submit"
              disabled={isCreatingMapping}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow"
            >
              {isCreatingMapping ? "Đang ghép..." : "Ghép nhóm"}
            </button>
          </div>
        </form>
      )}

      {/* Whitelist Subjects & Zalo Groups List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {isLoadingMappings ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
            Đang tải danh sách whitelist...
          </div>
        ) : subjects.length === 0 && mappings.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">Chưa có môn học nào trong Whitelist</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Bấm "+ Môn học" hoặc nút "Tạo mẫu test" ở trên để bắt đầu.
            </p>
          </div>
        ) : (
          subjects.map((subject) => {
            const subjectMappings = mappings.filter((m) => m.subjectId === subject.id);
            const isConnected = subjectMappings.length > 0;
            const dayLabel =
              DAYS_OF_WEEK.find((d) => d.value === subject.dayOfWeek)?.label ||
              (subject.dayOfWeek ? `Thứ ${subject.dayOfWeek}` : null);
            const timeLabel =
              subject.startTime && subject.endTime
                ? `${subject.startTime.slice(0, 5)} - ${subject.endTime.slice(0, 5)}`
                : null;

            return (
              <div
                key={subject.id}
                className={`p-3.5 rounded-2xl border transition ${
                  isConnected
                    ? "bg-white border-slate-200/90 shadow-sm hover:border-indigo-300"
                    : "bg-slate-50/70 border-slate-200/90 hover:bg-white hover:border-indigo-300"
                }`}
              >
                {/* Subject Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm ring-2 ring-white"
                        style={{ backgroundColor: subject.colorHex || "#6366F1" }}
                      />
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">
                        {subject.name}
                      </h4>
                      {subject.code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {subject.code}
                        </span>
                      )}
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Đã kết nối Zalo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Chưa kết nối Zalo
                        </span>
                      )}
                    </div>

                    {/* Schedule & Room info */}
                    <div className="text-[11px] text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {subject.defaultRoom && (
                        <span>
                          Phòng: <strong className="text-slate-700">{subject.defaultRoom}</strong>
                        </span>
                      )}
                      {dayLabel && (
                        <span>
                          • <strong className="text-slate-700">{dayLabel}</strong>
                        </span>
                      )}
                      {timeLabel && <span className="text-slate-400">({timeLabel})</span>}
                    </div>
                  </div>

                  {/* Action: Delete Subject */}
                  <button
                    type="button"
                    onClick={() => requestDeleteSubject(subject.id, subject.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                    title={`Xóa môn "${subject.name}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Connected Zalo Groups Section */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2">
                  {isConnected ? (
                    subjectMappings.map((mapping) => (
                      <div
                        key={mapping.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                          mapping.active
                            ? "bg-indigo-50/40 border-indigo-100"
                            : "bg-slate-100/50 border-slate-200/80 opacity-60"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-semibold">Nhóm:</span>
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {mapping.zaloGroupName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                              ID: {mapping.zaloGroupId}
                            </span>
                            {mapping.lastSyncedAt && (
                              <span className="text-[9px] text-slate-400">
                                Đồng bộ:{" "}
                                {new Date(mapping.lastSyncedAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controls for this Zalo group */}
                        <div className="flex items-center gap-2 shrink-0">
                          {onSelectGroupForSimulator && (
                            <button
                              onClick={() =>
                                onSelectGroupForSimulator(mapping.zaloGroupId, mapping.zaloGroupName)
                              }
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 transition"
                              title="Chọn nhóm này để test gửi tin nhắn Zalo"
                            >
                              Test Zalo
                            </button>
                          )}

                          {/* Active switch */}
                          <button
                            onClick={() => handleToggle(mapping.id)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              mapping.active ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                            title={
                              mapping.active
                                ? "Đang bật Whitelist (Click để tắt)"
                                : "Đang tắt Whitelist (Click để bật)"
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                mapping.active ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>

                          {/* Delete mapping */}
                          <button
                            type="button"
                            onClick={() => requestDeleteMapping(mapping.id, mapping.zaloGroupName)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition cursor-pointer"
                            title="Hủy ghép nhóm Zalo này"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-dashed border-slate-200">
                      <span className="text-[11px] text-slate-400 italic">
                        Chưa liên kết nhóm Zalo bóc tách tin nhắn
                      </span>
                      <button
                        onClick={() => handleOpenAddMappingForSubject(subject.id, subject.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition"
                      >
                        <Link2 className="w-3 h-3" />
                        + Ghép Zalo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Summary Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Tổng cộng: <strong>{subjects.length}</strong> môn học
        </span>
        <span>
          <strong>{connectedSubjectsCount}</strong> môn đã kết nối Zalo
        </span>
      </div>

      {/* Confirm Delete Overlay Modal */}
      {deleteConfirmState && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => {
            setDeleteConfirmState(null);
            setDeleteError("");
          }}
          onConfirm={handleConfirmDelete}
          isLoading={isDeletingSubject || isDeletingMapping}
          title={deleteConfirmState.title || "Xác nhận xóa"}
          description={deleteConfirmState.description}
          itemName={deleteConfirmState.name}
          itemDetails={deleteConfirmState.details}
          confirmText={deleteConfirmState.confirmText || "Xóa vĩnh viễn"}
          cancelText="Giữ lại"
          errorMsg={deleteError}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  BookOpen,
  Link2,
  Trash2,
  X,
  Sparkles,
  Calendar,
  Clock,
  QrCode,
  Plus,
  CheckCircle2,
  AlertCircle
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
import { fetchBridgeGroups, fetchBridgeStatus } from "../services/zaloBridgeApi";
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

export default function WhitelistManager({ onSelectGroupForSimulator, onNavigateToConnect }) {
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

  const [bridgeGroups, setBridgeGroups] = useState([]);
  const [bridgeStatus, setBridgeStatus] = useState(null);

  useEffect(() => {
    fetchBridgeGroups().then((groups) => {
      if (groups && groups.length > 0) setBridgeGroups(groups);
    });
    fetchBridgeStatus().then((st) => {
      if (st) setBridgeStatus(st);
    });
  }, []);

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
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 flex flex-col space-y-6">
      
      {/* Header & Status Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Quản lý Whitelist Môn học & Nhóm Zalo
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Tổng số <strong>{subjects.length}</strong> môn học • Đã ghép Zalo: <strong>{connectedSubjectsCount}/{subjects.length}</strong> ({activeCount} nhóm đang bật theo dõi)
            </p>
          </div>
        </div>

        {/* Action Buttons: Add Subject / Add Mapping */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowAddSubject(!showAddSubject);
              setShowAddMapping(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-2xl border transition cursor-pointer ${
              showAddSubject
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-indigo-600"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{showAddSubject ? "Đóng Form Môn" : "+ Thêm Môn học"}</span>
          </button>

          <button
            onClick={() => {
              setShowAddMapping(!showAddMapping);
              setShowAddSubject(false);
            }}
            disabled={subjects.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-2xl border transition cursor-pointer ${
              showAddMapping
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
            title={subjects.length === 0 ? "Vui lòng tạo môn học trước khi ghép nhóm" : ""}
          >
            <Link2 className="w-4 h-4" />
            <span>{showAddMapping ? "Đóng Form Ghép" : "+ Ghép nhóm Zalo"}</span>
          </button>
        </div>
      </div>

      {/* Zalo Account Status Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50/20 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-3 h-3 rounded-full shrink-0 ${bridgeStatus?.connected && bridgeStatus?.mode === "real" ? "bg-emerald-500 animate-pulse shadow-sm shadow-emerald-300" : "bg-amber-400"}`} />
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2 flex-wrap">
              <span>Trạng thái kết nối Zalo:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                bridgeStatus?.connected && bridgeStatus?.mode === "real"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}>
                {bridgeStatus?.connected && bridgeStatus?.mode === "real"
                  ? `Đã kết nối: ${bridgeStatus?.user?.displayName || bridgeStatus?.user?.name || "Tài khoản Zalo"}`
                  : "Chưa kết nối (Cần quét QR)"}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
              {bridgeStatus?.connected && bridgeStatus?.mode === "real"
                ? `${bridgeGroups.length} nhóm Zalo khả dụng để liên kết trực tiếp với môn học`
                : "Vui lòng quét mã QR ở mục Kết nối Zalo để lấy danh sách nhóm thực tế"}
            </p>
          </div>
        </div>

        {onNavigateToConnect && (
          <button
            type="button"
            onClick={onNavigateToConnect}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl transition shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span>{bridgeStatus?.connected && bridgeStatus?.mode === "real" ? "Quản lý Zalo" : "Quét mã QR"}</span>
          </button>
        )}
      </div>

      {/* Form Add Subject Modal - BỐ CỤC NGANG RỘNG RÃI */}
      {showAddSubject && (
        <form onSubmit={handleCreateSubject} className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-slate-50 to-purple-50/40 border border-indigo-200/90 shadow-md space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm sm:text-base font-black text-indigo-950">
                Thêm Môn học mới & Tự động xếp Thời khóa biểu
              </h4>
            </div>
            <button type="button" onClick={() => setShowAddSubject(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Cột 1: Thông tin cơ bản (4 cột) */}
            <div className="lg:col-span-4 space-y-3.5">
              <div>
                <label className="text-xs font-extrabold text-slate-800 block">Tên môn học <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="VD: Lập trình Web, CSDL, Học máy..."
                  className="mt-1 w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-extrabold text-slate-800 block">Mã môn</label>
                  <input
                    type="text"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    placeholder="VD: IT101"
                    className="mt-1 w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-800 block">Phòng học</label>
                  <input
                    type="text"
                    value={subjectForm.defaultRoom}
                    onChange={(e) => setSubjectForm({ ...subjectForm, defaultRoom: e.target.value })}
                    placeholder="VD: 401-A1"
                    className="mt-1 w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-800 block">Màu sắc hiển thị trên TKB</label>
                <div className="flex items-center gap-3 mt-1.5 p-2 rounded-xl bg-white border border-slate-200">
                  <input
                    type="color"
                    value={subjectForm.colorHex}
                    onChange={(e) => setSubjectForm({ ...subjectForm, colorHex: e.target.value })}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white"
                  />
                  <span className="text-xs font-mono font-bold text-slate-700">{subjectForm.colorHex}</span>
                </div>
              </div>
            </div>

            {/* Cột 2: Thứ & Tiết học 1-16 (5 cột) */}
            <div className="lg:col-span-5 space-y-3.5">
              {/* Thứ học */}
              <div>
                <label className="text-xs font-extrabold text-slate-800 mb-1.5 block">
                  Thứ học mặc định trong tuần <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = subjectForm.dayOfWeek === day.value;
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => setSubjectForm({ ...subjectForm, dayOfWeek: day.value })}
                        className={`py-2 rounded-xl text-center text-xs font-black transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-300 ring-2 ring-indigo-400"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-indigo-200"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tiết học mặc định */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Tiết học mặc định (16 tiết) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-black text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md border border-indigo-200">
                    Tiết {minPeriod} - {maxPeriod} ({computedStartTime} - {computedEndTime})
                  </span>
                </div>

                {/* Shift Presets */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSubjectForm((prev) => ({ ...prev, selectedPeriods: [1, 2, 3] }))}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 transition cursor-pointer"
                  >
                    Sáng 1-3
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectForm((prev) => ({ ...prev, selectedPeriods: [4, 5, 6] }))}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 transition cursor-pointer"
                  >
                    Sáng 4-6
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectForm((prev) => ({ ...prev, selectedPeriods: [7, 8, 9] }))}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 transition cursor-pointer"
                  >
                    Chiều 7-9
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectForm((prev) => ({ ...prev, selectedPeriods: [10, 11, 12] }))}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 transition cursor-pointer"
                  >
                    Chiều 10-12
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectForm((prev) => ({ ...prev, selectedPeriods: [13, 14, 15] }))}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 transition cursor-pointer"
                  >
                    Tối 13-15
                  </button>
                </div>

                {/* 16 Period Interactive Buttons */}
                <div className="p-2.5 bg-white rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="grid grid-cols-8 gap-1">
                    {RAW_PERIODS.map((p) => {
                      const isSelected = subjectForm.selectedPeriods.includes(p.period);
                      return (
                        <button
                          key={p.period}
                          type="button"
                          onClick={() => handleTogglePeriod(p.period)}
                          title={`Tiết ${p.period}: ${p.start} - ${p.end} (${p.shift})`}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white font-black shadow-md ring-2 ring-indigo-300 scale-[1.04]"
                              : "bg-slate-50 hover:bg-indigo-50/70 text-slate-700 border border-slate-200 hover:border-indigo-300"
                          }`}
                        >
                          <span className="text-xs font-black">{p.period}</span>
                          <span className={`text-[8px] leading-tight truncate ${isSelected ? "text-indigo-100 font-bold" : "text-slate-400"}`}>
                            {p.start}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Cột 3: Ngày bắt đầu - kết thúc & Nút Lưu (3 cột) */}
            <div className="lg:col-span-3 space-y-3.5">
              <div>
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Ngày bắt đầu môn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={subjectForm.semesterStartDate}
                  onChange={(e) => setSubjectForm({ ...subjectForm, semesterStartDate: e.target.value })}
                  className="mt-1 w-full text-xs sm:text-sm font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Ngày kết thúc môn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={subjectForm.semesterStartDate}
                  value={subjectForm.semesterEndDate}
                  onChange={(e) => setSubjectForm({ ...subjectForm, semesterEndDate: e.target.value })}
                  className="mt-1 w-full text-xs sm:text-sm font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                />
              </div>

              {/* Note */}
              <div className="p-3 rounded-2xl bg-indigo-100/70 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Môn học sẽ được <strong>tự động xếp lịch</strong> vào các ngày <strong>{DAYS_OF_WEEK.find((d) => d.value === subjectForm.dayOfWeek)?.label}</strong> từ ngày bắt đầu đến kết thúc.
                </span>
              </div>

              <button
                type="submit"
                disabled={isCreatingSubject}
                className="w-full px-5 py-3 text-xs sm:text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-2xl shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCreatingSubject ? "Đang lưu & xếp TKB..." : "Lưu & Thêm vào TKB"}
              </button>
            </div>

          </div>
        </form>
      )}

      {/* Form Add Mapping Modal - BỐ CỤC NGANG RỘNG RÃI */}
      {showAddMapping && (
        <form onSubmit={handleCreateMapping} className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50/90 via-slate-50 to-teal-50/40 border border-emerald-200/90 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm sm:text-base font-black text-emerald-950">
                Ghép nhóm Zalo vào Môn học theo dõi
              </h4>
            </div>
            <button type="button" onClick={() => setShowAddMapping(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs font-extrabold text-slate-800 block">Chọn môn học <span className="text-rose-500">*</span></label>
              <select
                required
                value={mappingForm.subjectId}
                onChange={(e) => setMappingForm({ ...mappingForm, subjectId: e.target.value })}
                className="mt-1 w-full text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
              >
                <option value="">-- Chọn môn học --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.code ? `(${s.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {bridgeGroups.length > 0 && (
              <div>
                <label className="text-xs font-extrabold text-slate-800 block">Chọn nhanh từ nhóm Zalo ({bridgeGroups.length} nhóm)</label>
                <select
                  onChange={(e) => {
                    const selected = bridgeGroups.find((g) => g.id === e.target.value);
                    if (selected) {
                      setMappingForm((prev) => ({
                        ...prev,
                        zaloGroupId: selected.id,
                        zaloGroupName: selected.name,
                      }));
                    }
                  }}
                  className="mt-1 w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
                >
                  <option value="">-- Bấm vào đây để chọn nhóm Zalo --</option>
                  {bridgeGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.id}) {g.memberCount ? `[${g.memberCount} thành viên]` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-extrabold text-slate-800 block">Tên nhóm Zalo <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={mappingForm.zaloGroupName}
                onChange={(e) => setMappingForm({ ...mappingForm, zaloGroupName: e.target.value })}
                placeholder="VD: Lập trình Web - K64"
                className="mt-1 w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-800 block">Mã nhóm Zalo (Group ID) <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={mappingForm.zaloGroupId}
                onChange={(e) => setMappingForm({ ...mappingForm, zaloGroupId: e.target.value })}
                placeholder="VD: zalo-group-101"
                className="mt-1 w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm font-mono"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mappingForm.active}
                  onChange={(e) => setMappingForm({ ...mappingForm, active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-xs font-bold text-slate-700">Bật theo dõi ngay</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isCreatingMapping}
              className="px-5 py-2.5 text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-2xl shadow-lg shadow-emerald-500/25 transition cursor-pointer"
            >
              {isCreatingMapping ? "Đang ghép..." : "Xác nhận Ghép nhóm"}
            </button>
          </div>
        </form>
      )}

      {/* DANH SÁCH WHITELIST - BỐ CỤC LƯỚI 2 CỘT RỘNG RÃI (Grid 2 cols) */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoadingMappings ? (
          <div className="py-12 text-center text-xs sm:text-sm text-slate-400 animate-pulse font-semibold">
            Đang tải danh sách Whitelist môn học...
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Chưa có môn học nào trong Whitelist</p>
            <p className="text-xs text-slate-400 mt-1">
              Bấm "+ Thêm Môn học" ở trên để bắt đầu thêm môn và xếp lịch lên thời khóa biểu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {subjects.map((subject) => {
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
                  className={`p-5 rounded-3xl border transition shadow-sm hover:shadow-md ${
                    isConnected
                      ? "bg-white border-slate-200/90 hover:border-indigo-300"
                      : "bg-slate-50/70 border-slate-200/90 hover:bg-white hover:border-indigo-300"
                  }`}
                >
                  {/* Subject Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ring-2 ring-white"
                          style={{ backgroundColor: subject.colorHex || "#6366F1" }}
                        />
                        <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                          {subject.name}
                        </h4>
                        {subject.code && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                            {subject.code}
                          </span>
                        )}
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Đã kết nối Zalo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Chưa kết nối Zalo
                          </span>
                        )}
                      </div>

                      {/* Schedule & Room info */}
                      <div className="text-xs text-slate-600 font-semibold mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        {subject.defaultRoom && (
                          <span className="flex items-center gap-1 text-slate-700">
                            📍 Phòng: <strong className="text-slate-900">{subject.defaultRoom}</strong>
                          </span>
                        )}
                        {dayLabel && (
                          <span className="text-indigo-700 font-bold">
                            • {dayLabel}
                          </span>
                        )}
                        {timeLabel && <span className="text-slate-500 font-medium">({timeLabel})</span>}
                      </div>
                    </div>

                    {/* Action: Delete Subject */}
                    <button
                      type="button"
                      onClick={() => requestDeleteSubject(subject.id, subject.name)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition shrink-0 cursor-pointer"
                      title={`Xóa môn "${subject.name}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Connected Zalo Groups Section */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                    {isConnected ? (
                      subjectMappings.map((mapping) => (
                        <div
                          key={mapping.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                            mapping.active
                              ? "bg-indigo-50/50 border-indigo-100"
                              : "bg-slate-100/50 border-slate-200/80 opacity-60"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Nhóm:</span>
                              <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                                {mapping.zaloGroupName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200">
                                ID: {mapping.zaloGroupId}
                              </span>
                              {mapping.lastSyncedAt && (
                                <span className="text-[10px] text-slate-400 font-medium">
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
                          <div className="flex items-center gap-3 shrink-0">
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
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition cursor-pointer"
                              title="Hủy ghép nhóm Zalo này"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between bg-white/90 p-3 rounded-2xl border border-dashed border-slate-200">
                        <span className="text-xs text-slate-400 italic font-medium">
                          Chưa liên kết nhóm Zalo bóc tách tin nhắn
                        </span>
                        <button
                          onClick={() => handleOpenAddMappingForSubject(subject.id, subject.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition cursor-pointer"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>+ Ghép Zalo</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

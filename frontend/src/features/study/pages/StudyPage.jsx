import { getLocalizedErrorMessage } from "../../../utils/errorMessages";
import React, { useState } from "react";
import { useGetSubjectsQuery } from "../../timetable/services/timetableApi";
import {
  useGetMaterialsQuery,
  useDeleteMaterialMutation,
  useGenerateMinigamesMutation,
} from "../services/studyApi";
import SubjectPickerBar from "../components/SubjectPickerBar";
import MaterialCard from "../components/MaterialCard";
import MaterialUploadModal from "../components/MaterialUploadModal";
import SmartCheatsheetView from "../components/SmartCheatsheetView";
import SpeedQuizGame from "../components/SpeedQuizGame";
import MemoryMatchGame from "../components/MemoryMatchGame";
import LeaderboardModal from "../components/LeaderboardModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

export default function StudyPage() {
  const { data: subjects = [], isLoading: isLoadingSubjects } = useGetSubjectsQuery();
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  const { data: materials = [], isLoading: isLoadingMaterials } = useGetMaterialsQuery(
    selectedSubjectId
  );

  const [deleteMaterial] = useDeleteMaterialMutation();
  const [generateMinigames] = useGenerateMinigamesMutation();

  // Navigation states
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [activeView, setActiveView] = useState("list"); // 'list' | 'cheatsheet' | 'quiz' | 'match'
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [leaderboardMaterial, setLeaderboardMaterial] = useState(null);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [generatingId, setGeneratingId] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleOpenStudy = (material, mode) => {
    setActiveMaterial(material);
    setActiveView(mode); // 'cheatsheet' | 'quiz' | 'match'
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteMaterial = (material) => {
    setMaterialToDelete(material);
  };

  const handleConfirmDelete = async () => {
    if (!materialToDelete) return;
    setIsDeletingMaterial(true);
    try {
      await deleteMaterial(materialToDelete.id).unwrap();
      showToast("Đã xóa tài liệu thành công");
      if (activeMaterial && activeMaterial.id === materialToDelete.id) {
        setActiveView("list");
        setActiveMaterial(null);
      }
      setMaterialToDelete(null);
    } catch (err) {
      const msg = getLocalizedErrorMessage(err, "Không thể xóa tài liệu. Vui lòng thử lại.");
      showToast(msg);
    } finally {
      setIsDeletingMaterial(false);
    }
  };

  const handleGenerateMinigames = async (material) => {
    setGeneratingId(material.id);
    showToast("AI đang đọc bản tóm tắt và sinh bộ Minigame ôn thi...");
    try {
      const res = await generateMinigames(material.id).unwrap();
      const updated = res.data;
      if (activeMaterial && activeMaterial.id === material.id) {
        setActiveMaterial(updated);
      }
      showToast("Đã tạo Minigame thành công. Bạn có thể vào ôn thi ngay.");
    } catch (err) {
      const msg = getLocalizedErrorMessage(err, "Không thể tạo Minigame. Vui lòng thử lại.");
      showToast(msg);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F7FC] px-3 py-6 sm:px-6 lg:px-8">
      {/* Toast thông báo */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#2F2A45] px-5 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMsg}
        </div>
      )}

      {/* Chế độ xem Chi tiết (Tóm tắt hoặc Minigame) */}
      {activeView === "cheatsheet" && activeMaterial && (
        <div className="mx-auto max-w-5xl animate-in fade-in duration-200">
          <SmartCheatsheetView
            material={materials.find((m) => m.id === activeMaterial.id) || activeMaterial}
            onBack={() => setActiveView("list")}
            onStartQuiz={() => setActiveView("quiz")}
            onStartMemoryMatch={() => setActiveView("match")}
            onGenerateMinigames={handleGenerateMinigames}
            onDelete={handleDeleteMaterial}
            isGeneratingMinigames={generatingId === activeMaterial.id}
          />
        </div>
      )}

      {activeView === "quiz" && activeMaterial && (
        <div className="mx-auto max-w-5xl animate-in fade-in duration-200">
          <SpeedQuizGame
            material={activeMaterial}
            onBack={() => setActiveView("list")}
            onOpenLeaderboard={() => setLeaderboardMaterial(activeMaterial)}
            onSwitchToMemoryMatch={() => setActiveView("match")}
          />
        </div>
      )}

      {activeView === "match" && activeMaterial && (
        <div className="mx-auto max-w-5xl animate-in fade-in duration-200">
          <MemoryMatchGame
            material={activeMaterial}
            onBack={() => setActiveView("list")}
            onOpenLeaderboard={() => setLeaderboardMaterial(activeMaterial)}
            onSwitchToQuiz={() => setActiveView("quiz")}
          />
        </div>
      )}

      {/* Chế độ xem Danh sách chính */}
      {activeView === "list" && (
        <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-200">
          {/* Thanh chọn Môn học */}
          <div className="rounded-3xl bg-white p-6 border border-[#E5E2EC] shadow-sm">
            <SubjectPickerBar
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              onSelectSubject={setSelectedSubjectId}
              isLoading={isLoadingSubjects}
            />
          </div>

          {/* Danh sách Đề cương / Học liệu */}
          <div className="space-y-4 min-h-[340px]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#2F2A45]">
                  Tài liệu & Đề cương
                </h2>
                <p className="text-xs text-[#77718C] mt-0.5">
                  {selectedSubjectId
                    ? `Thuộc môn đã chọn (${materials.length})`
                    : `Tất cả tài liệu (${materials.length})`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="rounded-2xl bg-social-violet px-5 py-2.5 text-xs font-black text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] hover:shadow-social-violet/35 transition-all"
              >
                Tải đề cương mới
              </button>
            </div>

            {isLoadingMaterials ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 animate-pulse rounded-3xl bg-white border border-[#E5E2EC] p-5 shadow-sm" />
                ))}
              </div>
            ) : materials.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5E2EC] bg-white p-12 text-center shadow-sm">
                <h3 className="text-base font-extrabold text-[#2F2A45]">
                  Chưa có tài liệu nào
                </h3>
                <p className="mt-1 text-xs text-[#77718C] max-w-sm mx-auto">
                  Tải lên tài liệu đề cương hoặc bài giảng để hệ thống tóm tắt và tạo bài ôn tập.
                </p>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="mt-4 rounded-2xl bg-social-violet px-6 py-2.5 text-xs font-black text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] transition-all"
                >
                  Tải lên tài liệu
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {materials.map((mat) => (
                  <MaterialCard
                    key={mat.id}
                    material={mat}
                    onOpenStudy={handleOpenStudy}
                    onOpenLeaderboard={(m) => setLeaderboardMaterial(m)}
                    onDelete={handleDeleteMaterial}
                    onGenerateMinigames={handleGenerateMinigames}
                    isGeneratingMinigames={generatingId === mat.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Upload Tài liệu */}
      <MaterialUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        subjects={subjects}
        defaultSubjectId={selectedSubjectId}
        onSuccess={() => {
          showToast("AI đã sinh học liệu và Minigame thành công!");
        }}
      />

      {/* Modal Bảng xếp hạng */}
      <LeaderboardModal
        isOpen={Boolean(leaderboardMaterial)}
        onClose={() => setLeaderboardMaterial(null)}
        material={leaderboardMaterial}
      />

      {/* Modal Xác nhận Xóa Tài liệu */}
      <DeleteConfirmModal
        isOpen={Boolean(materialToDelete)}
        onClose={() => setMaterialToDelete(null)}
        onConfirm={handleConfirmDelete}
        material={materialToDelete}
        isLoading={isDeletingMaterial}
      />
    </div>
  );
}

import { getLocalizedErrorMessage } from "../../../utils/errorMessages";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetSubjectsQuery } from "../../timetable/services/timetableApi";
import {
  useGetMaterialsQuery,
  useGetSharedMaterialsQuery,
  useGetMaterialByIdQuery,
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
import ShareAndChallengeModal from "../components/ShareAndChallengeModal";

export default function StudyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawUrlMaterialId = searchParams.get("materialId");
  const urlMaterialId =
    rawUrlMaterialId && rawUrlMaterialId !== "undefined" && rawUrlMaterialId !== "null"
      ? rawUrlMaterialId
      : null;
  const urlMode = searchParams.get("mode"); // 'cheatsheet' | 'original' | 'quiz' | 'match'
  const urlTimestamp = searchParams.get("t") || "";

  const { data: subjects = [], isLoading: isLoadingSubjects } = useGetSubjectsQuery();
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [listTab, setListTab] = useState("mine"); // 'mine' | 'shared'

  const { data: materials = [], isLoading: isLoadingMaterials } = useGetMaterialsQuery(
    selectedSubjectId
  );
  const { data: sharedMaterials = [], isLoading: isLoadingShared } =
    useGetSharedMaterialsQuery();
  const { data: directMaterial, isLoading: isLoadingDirectMaterial } =
    useGetMaterialByIdQuery(urlMaterialId, {
      skip: !urlMaterialId,
    });

  const [deleteMaterial] = useDeleteMaterialMutation();
  const [generateMinigames] = useGenerateMinigamesMutation();

  // Navigation states
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [activeView, setActiveView] = useState("list"); // 'list' | 'cheatsheet' | 'quiz' | 'match'
  const [initialDocTab, setInitialDocTab] = useState("cheatsheet"); // 'cheatsheet' | 'original'
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [leaderboardMaterial, setLeaderboardMaterial] = useState(null);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [generatingId, setGeneratingId] = useState(null);

  // Share & Challenge Modal state
  const [shareModalConfig, setShareModalConfig] = useState({
    isOpen: false,
    material: null,
    defaultMode: "SHARE_MATERIAL",
    defaultGameType: "SPEED_QUIZ",
    challengerScore: null,
    challengerTimeSeconds: null,
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleOpenStudy = (material, mode = "cheatsheet") => {
    if (!material) return;
    setActiveMaterial(material);
    if (urlMaterialId || urlMode) {
      setSearchParams({}, { replace: true });
    }

    if (mode === "original") {
      setInitialDocTab("original");
      setActiveView("cheatsheet");
    } else if (mode === "cheatsheet") {
      setInitialDocTab("cheatsheet");
      setActiveView("cheatsheet");
    } else if (mode === "quiz" || mode === "match") {
      const hasGames =
        (material.quizData?.length || 0) > 0 ||
        (material.memoryMatchData?.length || 0) > 0;
      if (!hasGames) {
        setInitialDocTab("cheatsheet");
        setActiveView("cheatsheet");
        showToast("Đề cương chưa có bộ Minigame. Hãy bấm 'Tạo Minigames ngay' để bắt đầu!");
      } else {
        setActiveView(mode);
      }
    } else {
      setInitialDocTab("cheatsheet");
      setActiveView("cheatsheet");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToList = () => {
    setActiveView("list");
    setActiveMaterial(null);
    if (urlMaterialId || urlMode) {
      setSearchParams({}, { replace: true });
    }
  };

  const handleOpenShareModal = (material, modeOrOptions = "SHARE_MATERIAL") => {
    if (!material) return;
    if (typeof modeOrOptions === "string") {
      setShareModalConfig({
        isOpen: true,
        material,
        defaultMode: modeOrOptions,
        defaultGameType: "SPEED_QUIZ",
        challengerScore: null,
        challengerTimeSeconds: null,
      });
    } else {
      setShareModalConfig({
        isOpen: true,
        material,
        defaultMode: modeOrOptions.defaultMode || "CHALLENGE_GAME",
        defaultGameType: modeOrOptions.defaultGameType || "SPEED_QUIZ",
        challengerScore: modeOrOptions.challengerScore ?? null,
        challengerTimeSeconds: modeOrOptions.challengerTimeSeconds ?? null,
      });
    }
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
      if (resolvedActiveMaterial && resolvedActiveMaterial.id === materialToDelete.id) {
        handleBackToList();
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
      const updated = res.data || res;
      if (activeMaterial && activeMaterial.id === material.id) {
        setActiveMaterial(updated);
      }
      if (shareModalConfig.isOpen && shareModalConfig.material?.id === material.id) {
        setShareModalConfig((prev) => ({ ...prev, material: updated }));
      }
      showToast("Đã tạo Minigame thành công. Bạn có thể vào ôn thi hoặc thách đấu ngay!");
    } catch (err) {
      const msg = getLocalizedErrorMessage(err, "Không thể tạo Minigame. Vui lòng thử lại.");
      showToast(msg);
    } finally {
      setGeneratingId(null);
    }
  };

  // Resolve up-to-date activeMaterial from either URL query params or local state
  const resolvedActiveMaterial = urlMaterialId
    ? directMaterial ||
      materials.find((m) => m.id === urlMaterialId) ||
      sharedMaterials.find((m) => m.id === urlMaterialId) ||
      null
    : activeMaterial
    ? materials.find((m) => m.id === activeMaterial.id) ||
      sharedMaterials.find((m) => m.id === activeMaterial.id) ||
      (directMaterial?.id === activeMaterial.id ? directMaterial : null) ||
      activeMaterial
    : null;

  const hasResolvedGames =
    (resolvedActiveMaterial?.quizData?.length || 0) > 0 ||
    (resolvedActiveMaterial?.memoryMatchData?.length || 0) > 0;

  const effectiveView =
    urlMaterialId && resolvedActiveMaterial
      ? (urlMode === "quiz" || urlMode === "match") && hasResolvedGames
        ? urlMode
        : "cheatsheet"
      : activeView;

  const effectiveDocTab =
    urlMaterialId && urlMode === "original" ? "original" : initialDocTab;

  const displayedSharedMaterials = selectedSubjectId
    ? sharedMaterials.filter((m) => m.subjectId === selectedSubjectId)
    : sharedMaterials;

  const activeList = listTab === "mine" ? materials : displayedSharedMaterials;
  const isListLoading = listTab === "mine" ? isLoadingMaterials : isLoadingShared;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F7FC] px-3 py-6 sm:px-6 lg:px-8">
      {/* Toast thông báo */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#2F2A45] px-5 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMsg}
        </div>
      )}

      {/* Trạng thái đang tải đề cương trực tiếp từ liên kết Chat / Thông báo */}
      {urlMaterialId && !resolvedActiveMaterial && isLoadingDirectMaterial && (
        <div className="mx-auto max-w-5xl rounded-3xl border border-[#E5E2EC] bg-white p-12 text-center shadow-sm animate-pulse">
          <p className="text-sm font-extrabold text-social-violet">
            Đang mở nội dung đề cương...
          </p>
        </div>
      )}

      {/* Chế độ xem Chi tiết (Tóm tắt / Đề cương gốc) */}
      {effectiveView === "cheatsheet" && resolvedActiveMaterial && (
        <div className="mx-auto max-w-5xl animate-in fade-in duration-200">
          <SmartCheatsheetView
            key={`${resolvedActiveMaterial.id}-${effectiveDocTab}-${urlTimestamp}`}
            material={resolvedActiveMaterial}
            initialTab={effectiveDocTab}
            onBack={handleBackToList}
            onStartQuiz={() => handleOpenStudy(resolvedActiveMaterial, "quiz")}
            onStartMemoryMatch={() => handleOpenStudy(resolvedActiveMaterial, "match")}
            onGenerateMinigames={handleGenerateMinigames}
            onOpenShare={handleOpenShareModal}
            onDelete={handleDeleteMaterial}
            isGeneratingMinigames={generatingId === resolvedActiveMaterial.id}
          />
        </div>
      )}

      {effectiveView === "quiz" && resolvedActiveMaterial && (
        <div className="mx-auto max-w-5xl animate-in fade-in duration-200">
          <SpeedQuizGame
            key={`${resolvedActiveMaterial.id}-${urlTimestamp}`}
            material={resolvedActiveMaterial}
            onBack={handleBackToList}
            onOpenLeaderboard={() => setLeaderboardMaterial(resolvedActiveMaterial)}
            onSwitchToMemoryMatch={() => handleOpenStudy(resolvedActiveMaterial, "match")}
            onOpenChallenge={handleOpenShareModal}
          />
        </div>
      )}

      {effectiveView === "match" && resolvedActiveMaterial && (
        <div className="mx-auto max-w-5xl animate-in fade-in duration-200">
          <MemoryMatchGame
            key={`${resolvedActiveMaterial.id}-${urlTimestamp}`}
            material={resolvedActiveMaterial}
            onBack={handleBackToList}
            onOpenLeaderboard={() => setLeaderboardMaterial(resolvedActiveMaterial)}
            onSwitchToQuiz={() => handleOpenStudy(resolvedActiveMaterial, "quiz")}
            onOpenChallenge={handleOpenShareModal}
          />
        </div>
      )}

      {/* Chế độ xem Danh sách chính */}
      {effectiveView === "list" && !(urlMaterialId && isLoadingDirectMaterial) && (
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <h2 className="text-lg font-black text-[#2F2A45]">
                    Tài liệu & Đề cương
                  </h2>
                  <p className="text-xs text-[#77718C] mt-0.5">
                    {listTab === "mine"
                      ? selectedSubjectId
                        ? `Thuộc môn đã chọn (${materials.length})`
                        : `Tất cả tài liệu của tôi (${materials.length})`
                      : `Đề cương được bạn bè chia sẻ (${displayedSharedMaterials.length})`}
                  </p>
                </div>

                {/* Bộ lọc Tài liệu của tôi vs Được bạn bè chia sẻ */}
                <div className="flex rounded-2xl bg-[#EAE6F6] p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setListTab("mine")}
                    className={`rounded-xl px-3.5 py-1.5 transition-all ${
                      listTab === "mine"
                        ? "bg-white text-social-violet shadow-xs font-extrabold"
                        : "text-[#6F6B83] hover:text-[#2F2A45]"
                    }`}
                  >
                    Tài liệu của tôi ({materials.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setListTab("shared")}
                    className={`rounded-xl px-3.5 py-1.5 transition-all ${
                      listTab === "shared"
                        ? "bg-white text-social-violet shadow-xs font-extrabold"
                        : "text-[#6F6B83] hover:text-[#2F2A45]"
                    }`}
                  >
                    Được bạn bè chia sẻ ({sharedMaterials.length})
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="rounded-2xl bg-social-violet px-5 py-2.5 text-xs font-black text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] hover:shadow-social-violet/35 transition-all self-start sm:self-auto"
              >
                Tải đề cương mới
              </button>
            </div>

            {isListLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 animate-pulse rounded-3xl bg-white border border-[#E5E2EC] p-5 shadow-sm"
                  />
                ))}
              </div>
            ) : activeList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5E2EC] bg-white p-12 text-center shadow-sm">
                <h3 className="text-base font-extrabold text-[#2F2A45]">
                  {listTab === "mine"
                    ? "Chưa có tài liệu nào"
                    : "Chưa có đề cương nào được bạn bè chia sẻ"}
                </h3>
                <p className="mt-1 text-xs text-[#77718C] max-w-sm mx-auto">
                  {listTab === "mine"
                    ? "Tải lên tài liệu đề cương hoặc bài giảng để hệ thống tóm tắt, xem song song bản gốc và tạo bài ôn tập."
                    : "Khi bạn bè chia sẻ đề cương hoặc gửi lời mời thách đấu Minigame qua Chat, tài liệu sẽ xuất hiện tại đây."}
                </p>
                {listTab === "mine" && (
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                    className="mt-4 rounded-2xl bg-social-violet px-6 py-2.5 text-xs font-black text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] transition-all"
                  >
                    Tải lên tài liệu
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeList.map((mat) => (
                  <MaterialCard
                    key={mat.id}
                    material={mat}
                    onOpenStudy={handleOpenStudy}
                    onOpenLeaderboard={(m) => setLeaderboardMaterial(m)}
                    onOpenShare={handleOpenShareModal}
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
          showToast("AI đã sinh học liệu và lưu bản gốc thành công!");
        }}
      />

      {/* Modal Bảng xếp hạng */}
      <LeaderboardModal
        isOpen={Boolean(leaderboardMaterial)}
        onClose={() => setLeaderboardMaterial(null)}
        material={leaderboardMaterial}
        onOpenChallenge={(mat, gameType) => {
          setLeaderboardMaterial(null);
          handleOpenShareModal(mat, {
            defaultMode: "CHALLENGE_GAME",
            defaultGameType: gameType || "SPEED_QUIZ",
          });
        }}
      />

      {/* Modal Chia sẻ Đề cương & Thách đấu Minigame */}
      <ShareAndChallengeModal
        key={`${shareModalConfig.material?.id || "none"}-${shareModalConfig.defaultMode}-${shareModalConfig.defaultGameType}-${shareModalConfig.isOpen}`}
        isOpen={shareModalConfig.isOpen}
        onClose={() => setShareModalConfig((prev) => ({ ...prev, isOpen: false }))}
        material={shareModalConfig.material}
        defaultMode={shareModalConfig.defaultMode}
        defaultGameType={shareModalConfig.defaultGameType}
        challengerScore={shareModalConfig.challengerScore}
        challengerTimeSeconds={shareModalConfig.challengerTimeSeconds}
        onGenerateMinigames={handleGenerateMinigames}
        isGeneratingMinigames={generatingId === shareModalConfig.material?.id}
        onSuccess={(msg) => showToast(msg)}
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

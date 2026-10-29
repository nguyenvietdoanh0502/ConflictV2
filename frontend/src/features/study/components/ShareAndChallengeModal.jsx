import { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useGetFriendsQuery } from "../../friend/friendApi";
import { openChat } from "../../chat/chatSlice";
import { useShareMaterialMutation } from "../services/studyApi";
import { getLocalizedErrorMessage } from "../../../utils/errorMessages";

export default function ShareAndChallengeModal({
  isOpen,
  onClose,
  material,
  defaultMode = "SHARE_MATERIAL", // "SHARE_MATERIAL" | "CHALLENGE_GAME"
  defaultGameType = "SPEED_QUIZ", // "SPEED_QUIZ" | "MEMORY_MATCH"
  challengerScore = null,
  challengerTimeSeconds = null,
  onGenerateMinigames,
  isGeneratingMinigames = false,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const { data: friends = [], isLoading: isLoadingFriends } = useGetFriendsQuery(
    undefined,
    { skip: !isOpen }
  );
  const [shareMaterial, { isLoading: isSending }] = useShareMaterialMutation();

  const [shareType, setShareType] = useState(defaultMode || "SHARE_MATERIAL");
  const [gameType, setGameType] = useState(defaultGameType || "SPEED_QUIZ");
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [openChatAfterSend, setOpenChatAfterSend] = useState(true);

  const hasMinigames =
    (material?.quizData?.length || 0) > 0 ||
    (material?.memoryMatchData?.length || 0) > 0;

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase().trim();
    return friends.filter((f) => f.user?.fullName?.toLowerCase().includes(q));
  }, [friends, searchQuery]);

  if (!isOpen || !material) return null;

  const toggleFriend = (friendUserId) => {
    setErrorMsg("");
    setSelectedFriendIds((prev) =>
      prev.includes(friendUserId)
        ? prev.filter((id) => id !== friendUserId)
        : [...prev, friendUserId]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredFriends.map((f) => f.user?.id).filter(Boolean);
    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedFriendIds.includes(id));

    if (allSelected) {
      setSelectedFriendIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedFriendIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (selectedFriendIds.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất một người bạn để gửi.");
      return;
    }

    if (shareType === "CHALLENGE_GAME" && !hasMinigames) {
      setErrorMsg("Đề cương này chưa tạo bộ Minigame. Hãy bấm 'Tạo Minigame ngay' bên dưới trước khi gửi thách đấu.");
      return;
    }

    try {
      await shareMaterial({
        materialId: material.id,
        recipientIds: selectedFriendIds,
        shareType,
        challengeGameType: shareType === "CHALLENGE_GAME" ? gameType : null,
        challengerScore: shareType === "CHALLENGE_GAME" ? challengerScore : null,
        challengerTimeSeconds: shareType === "CHALLENGE_GAME" ? challengerTimeSeconds : null,
        message: customMessage.trim() || undefined,
      }).unwrap();

      if (openChatAfterSend && selectedFriendIds.length > 0) {
        const firstFriendEntry = friends.find((f) => f.user?.id === selectedFriendIds[0]);
        if (firstFriendEntry?.user) {
          dispatch(openChat(firstFriendEntry.user));
        }
      }

      if (onSuccess) {
        onSuccess(
          shareType === "CHALLENGE_GAME"
            ? `Đã gửi lời mời thách đấu tới ${selectedFriendIds.length} người bạn!`
            : `Đã chia sẻ đề cương tới ${selectedFriendIds.length} người bạn!`
        );
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        getLocalizedErrorMessage(
          err,
          "Không thể gửi chia sẻ / lời mời thách đấu. Vui lòng thử lại."
        )
      );
    }
  };

  const defaultPreviewText =
    shareType === "CHALLENGE_GAME"
      ? challengerScore && challengerScore > 0
        ? `Thách đấu bạn vượt qua mốc ${challengerScore} điểm ở trò ${
            gameType === "MEMORY_MATCH" ? "Lật thẻ Ghép cặp" : "Đấu trường Trắc nghiệm"
          } — đề cương "${material.title}"!`
        : `Mình thách đấu bạn cùng so tài trò ${
            gameType === "MEMORY_MATCH" ? "Lật thẻ Ghép cặp" : "Đấu trường Trắc nghiệm"
          } trong đề cương "${material.title}"!`
      : `Mình chia sẻ với bạn đề cương "${material.title}" (${material.subjectName}) để cùng ôn tập nhé!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#E5E2EC] animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E2EC] shrink-0">
          <div>
            <h3 className="text-lg font-black text-[#2F2A45]">
              {shareType === "CHALLENGE_GAME"
                ? "Gửi Lời Mời Thách Đấu Minigame"
                : "Chia Sẻ Đề Cương Cho Bạn Bè"}
            </h3>
            <p className="text-xs text-[#77718C] mt-0.5 truncate max-w-[340px]">
              {material.title} • <span className="font-bold text-social-violet">{material.subjectName}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#77718C] hover:bg-[#F0EEF8] hover:text-[#2F2A45] text-xs font-bold"
          >
            Đóng
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="mt-4 flex rounded-2xl bg-[#F0EEF8] p-1 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              setShareType("SHARE_MATERIAL");
              setErrorMsg("");
            }}
            className={`flex-1 rounded-xl py-2.5 transition-all ${
              shareType === "SHARE_MATERIAL"
                ? "bg-white text-social-violet shadow-sm font-extrabold"
                : "text-[#77718C] hover:text-[#2F2A45]"
            }`}
          >
            Chia sẻ Đề cương
          </button>

          <button
            type="button"
            onClick={() => {
              setShareType("CHALLENGE_GAME");
              setErrorMsg("");
            }}
            className={`flex-1 rounded-xl py-2.5 transition-all ${
              shareType === "CHALLENGE_GAME"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm font-extrabold"
                : "text-[#77718C] hover:text-[#2F2A45]"
            }`}
          >
            Thách đấu Minigame
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-200 shrink-0">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {/* Nếu ở chế độ Thách đấu Minigame */}
          {shareType === "CHALLENGE_GAME" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-3">
              {!hasMinigames ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-amber-900">
                      Đề cương này chưa tạo bộ câu hỏi Minigame
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Khởi tạo Minigame bằng AI để gửi lời thách đấu cho bạn bè.
                    </p>
                  </div>
                  {onGenerateMinigames && (
                    <button
                      type="button"
                      disabled={isGeneratingMinigames}
                      onClick={() => onGenerateMinigames(material)}
                      className="shrink-0 rounded-xl bg-social-violet px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#6E60DC] disabled:opacity-50"
                    >
                      {isGeneratingMinigames ? "Đang tạo..." : "Tạo Minigame ngay"}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-900">
                      Chọn đấu trường thách đấu:
                    </span>
                    {challengerScore !== null && challengerScore > 0 && (
                      <span className="rounded-lg bg-amber-500 px-2.5 py-0.5 text-[11px] font-black text-white shadow-xs">
                        Điểm của bạn: {challengerScore}đ
                        {challengerTimeSeconds ? ` (${challengerTimeSeconds}s)` : ""}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setGameType("SPEED_QUIZ")}
                      className={`rounded-xl border p-2.5 text-left transition-all ${
                        gameType === "SPEED_QUIZ"
                          ? "border-amber-500 bg-white ring-2 ring-amber-500/20 shadow-xs"
                          : "border-amber-200/80 bg-white/60 hover:bg-white"
                      }`}
                    >
                      <p className="text-xs font-black text-[#2F2A45]">Đấu trường Trắc nghiệm</p>
                      <p className="text-[11px] text-[#77718C] mt-0.5">
                        {material.quizData?.length || 10} câu hỏi • 15s/câu
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGameType("MEMORY_MATCH")}
                      className={`rounded-xl border p-2.5 text-left transition-all ${
                        gameType === "MEMORY_MATCH"
                          ? "border-social-violet bg-white ring-2 ring-social-violet/20 shadow-xs"
                          : "border-amber-200/80 bg-white/60 hover:bg-white"
                      }`}
                    >
                      <p className="text-xs font-black text-[#2F2A45]">Lật thẻ Ghép cặp</p>
                      <p className="text-[11px] text-[#77718C] mt-0.5">
                        {material.memoryMatchData?.length || 8} cặp thuật ngữ
                      </p>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Danh sách Bạn bè */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-[#2F2A45]">
                Chọn bạn bè nhận ({selectedFriendIds.length} đã chọn)
              </label>
              {filteredFriends.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] font-bold text-social-violet hover:underline"
                >
                  {filteredFriends.every((f) => selectedFriendIds.includes(f.user?.id))
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </button>
              )}
            </div>

            {friends.length > 3 && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhanh tên bạn bè..."
                className="mb-2 w-full rounded-xl border border-[#E5E2EC] bg-[#FAF9FD] px-3 py-2 text-xs text-[#2F2A45] focus:border-social-violet focus:bg-white focus:outline-none"
              />
            )}

            <div className="max-h-44 overflow-y-auto rounded-2xl border border-[#E5E2EC] bg-[#FAF9FD] p-2 space-y-1 custom-scrollbar">
              {isLoadingFriends ? (
                <div className="py-6 text-center text-xs text-[#77718C] animate-pulse">
                  Đang tải danh sách bạn bè...
                </div>
              ) : friends.length === 0 ? (
                <div className="py-6 text-center px-3">
                  <p className="text-xs font-bold text-[#2F2A45]">Bạn chưa có người bạn nào trong danh sách</p>
                  <p className="text-[11px] text-[#77718C] mt-0.5">
                    Hãy kết bạn bằng mã PIN để cùng chia sẻ đề cương và thách đấu Minigame.
                  </p>
                  <Link
                    to="/friends"
                    onClick={onClose}
                    className="mt-2.5 inline-block rounded-xl bg-social-violet px-3.5 py-1.5 text-xs font-bold text-white"
                  >
                    Đi tới trang Bạn bè
                  </Link>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#77718C]">
                  Không tìm thấy bạn bè khớp với "{searchQuery}"
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const friendUser = friend.user;
                  if (!friendUser) return null;
                  const isSelected = selectedFriendIds.includes(friendUser.id);
                  const displayName = friendUser.fullName || "Bạn bè";

                  return (
                    <div
                      key={friend.friendshipId || friendUser.id}
                      onClick={() => toggleFriend(friendUser.id)}
                      className={`flex items-center justify-between rounded-xl p-2 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-social-violet/10 border border-social-violet/30"
                          : "hover:bg-white border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {friendUser.avatarUrl ? (
                          <img
                            src={friendUser.avatarUrl}
                            alt={displayName}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-white"
                          />
                        ) : (
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-social-violet text-xs font-extrabold text-white">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#2F2A45] truncate">
                            {displayName}
                          </p>
                          {friendUser.pinCode && (
                            <p className="text-[10px] text-[#77718C] font-mono">
                              {friendUser.pinCode}
                            </p>
                          )}
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-[#D0CADF] text-social-violet focus:ring-social-violet"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Lời nhắn kèm theo */}
          <div>
            <label className="block text-xs font-extrabold text-[#2F2A45] mb-1">
              Lời nhắn đính kèm (Tùy chọn)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={defaultPreviewText}
              className="w-full rounded-xl border border-[#E5E2EC] bg-[#FAF9FD] px-3.5 py-2 text-xs text-[#2F2A45] focus:border-social-violet focus:bg-white focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-[#4F4965] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={openChatAfterSend}
              onChange={(e) => setOpenChatAfterSend(e.target.checked)}
              className="h-4 w-4 rounded border-[#D0CADF] text-social-violet"
            />
            <span>Mở ngay cửa sổ Chat sau khi gửi</span>
          </label>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E2EC]">
            <button
              type="button"
              disabled={isSending}
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#77718C] hover:bg-[#F0EEF8] disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={
                isSending ||
                selectedFriendIds.length === 0 ||
                (shareType === "CHALLENGE_GAME" && !hasMinigames)
              }
              className={`rounded-xl px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all disabled:opacity-50 ${
                shareType === "CHALLENGE_GAME"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600"
                  : "bg-social-violet shadow-social-violet/25 hover:bg-[#6E60DC]"
              }`}
            >
              {isSending
                ? "Đang gửi..."
                : shareType === "CHALLENGE_GAME"
                ? `Gửi thách đấu (${selectedFriendIds.length})`
                : `Chia sẻ ngay (${selectedFriendIds.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

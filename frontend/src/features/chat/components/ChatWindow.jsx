import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  closeChat,
  toggleMinimize,
  selectActiveFriend,
  selectIsChatMinimized,
} from "../chatSlice";
import { selectCurrentUser, selectAccessToken } from "../../auth/authSelectors";
import { useGetChatHistoryQuery, useLazyGetChatHistoryQuery } from "../chatApi";
import {
  useGetMaterialsQuery,
  useShareMaterialMutation,
} from "../../study/services/studyApi";
import { realtimeService } from "../../../services/realtime";
import { getLocalizedErrorMessage } from "../../../utils/errorMessages";

function formatMessageTime(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    if (isToday) {
      return `${hours}:${minutes}`;
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month} ${hours}:${minutes}`;
  } catch {
    return "";
  }
}

export default function ChatWindow() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activeFriend = useSelector(selectActiveFriend);
  const isMinimized = useSelector(selectIsChatMinimized);
  const currentUser = useSelector(selectCurrentUser);
  const accessToken = useSelector(selectAccessToken);

  // Messages management
  const [olderMessages, setOlderMessages] = useState([]);
  const [realtimeMessages, setRealtimeMessages] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMoreState, setHasMoreState] = useState(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [inputText, setInputText] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(realtimeService.status);
  const [sendError, setSendError] = useState("");

  // Quick Share Material / Challenge popover inside chat
  const [isMaterialPickerOpen, setIsMaterialPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState("SHARE_MATERIAL"); // "SHARE_MATERIAL" | "CHALLENGE_GAME"

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initial history load (page 0)
  const {
    data: initialHistory,
    isLoading: isLoadingHistory,
  } = useGetChatHistoryQuery(
    { friendUserId: activeFriend?.id, page: 0, size: 30 },
    { skip: !activeFriend?.id }
  );

  const [getOlderMessages] = useLazyGetChatHistoryQuery();

  const { data: myMaterials = [], isLoading: isLoadingMyMaterials } =
    useGetMaterialsQuery(null, { skip: !isMaterialPickerOpen });
  const [shareMaterial, { isLoading: isSharingMaterial }] =
    useShareMaterialMutation();

  const completedMaterials = useMemo(
    () => myMaterials.filter((m) => m.processingStatus === "COMPLETED"),
    [myMaterials]
  );

  // Unified deduplicated messages list
  const messages = useMemo(() => {
    const initialItems = initialHistory?.items || [];
    const combined = [...olderMessages, ...initialItems, ...realtimeMessages];
    const seen = new Set();
    const deduped = [];
    for (const msg of combined) {
      if (msg?.id && !seen.has(msg.id)) {
        seen.add(msg.id);
        deduped.push(msg);
      }
    }
    return deduped;
  }, [olderMessages, initialHistory?.items, realtimeMessages]);

  const hasMore = hasMoreState !== null ? hasMoreState : Boolean(initialHistory?.hasMore);

  // Subscribe to realtime status
  useEffect(() => {
    const unsubStatus = realtimeService.onStatusChange((status) => {
      setConnectionStatus(status);
    });
    return unsubStatus;
  }, []);

  // Listen to incoming messages for this chat thread
  useEffect(() => {
    if (!activeFriend?.id) return;

    const unsubMessages = realtimeService.onMessage((newMsg) => {
      if (!newMsg || !newMsg.id) return;

      const isCurrentThread =
        (newMsg.senderId === activeFriend.id && newMsg.recipientId === currentUser?.id) ||
        (newMsg.senderId === currentUser?.id && newMsg.recipientId === activeFriend.id);

      if (isCurrentThread) {
        setRealtimeMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }
    });

    return unsubMessages;
  }, [activeFriend?.id, currentUser?.id]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  // Auto-scroll on new messages or when expanded
  useEffect(() => {
    if (!isMinimized && messages.length > 0 && page === 0) {
      scrollToBottom(messages.length <= 30 ? "auto" : "smooth");
    }
  }, [messages.length, isMinimized, page, scrollToBottom]);

  // Load older messages (pagination)
  const handleLoadOlder = async () => {
    if (!hasMore || isLoadingOlder || !activeFriend?.id) return;

    const container = messagesContainerRef.current;
    const previousScrollHeight = container ? container.scrollHeight : 0;
    const nextPage = page + 1;

    setIsLoadingOlder(true);
    try {
      const response = await getOlderMessages({
        friendUserId: activeFriend.id,
        page: nextPage,
        size: 30,
      }).unwrap();

      const newOlderItems = response?.items || [];
      setOlderMessages((prev) => [...newOlderItems, ...prev]);
      setPage(nextPage);
      setHasMoreState(Boolean(response?.hasMore));

      // Preserve scroll position
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - previousScrollHeight;
        }
      });
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // Send message
  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !activeFriend?.id) return;

    if (trimmed.length > 2000) {
      setSendError("Tin nhắn không được vượt quá 2000 ký tự");
      return;
    }

    try {
      setSendError("");
      realtimeService.sendMessage(activeFriend.id, trimmed);
      setInputText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "36px";
      }
      setTimeout(() => scrollToBottom("smooth"), 50);
    } catch (err) {
      console.error("Send message failed:", err);
      if (err.message === "WEBSOCKET_NOT_CONNECTED") {
        setSendError("Mất kết nối với máy chủ chat. Vui lòng thử lại sau giây lát.");
      } else {
        setSendError("Không thể gửi tin nhắn. Vui lòng thử lại.");
      }
    }
  };

  const handleQuickShareMaterial = async (mat, shareType, gameType = "SPEED_QUIZ") => {
    if (!activeFriend?.id || !mat?.id) return;
    setSendError("");
    try {
      const res = await shareMaterial({
        materialId: mat.id,
        recipientIds: [activeFriend.id],
        shareType,
        challengeGameType: shareType === "CHALLENGE_GAME" ? gameType : null,
      }).unwrap();

      const sentMessages = res?.data || res;
      if (Array.isArray(sentMessages) && sentMessages.length > 0) {
        const msgDto = sentMessages[0];
        setRealtimeMessages((prev) =>
          prev.some((m) => m.id === msgDto.id) ? prev : [...prev, msgDto]
        );
      }
      setIsMaterialPickerOpen(false);
      setTimeout(() => scrollToBottom("smooth"), 50);
    } catch (err) {
      setSendError(
        getLocalizedErrorMessage(
          err,
          "Không thể chia sẻ đề cương. Vui lòng thử lại."
        )
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setInputText(e.target.value);
    if (sendError) setSendError("");

    // Auto-adjust height up to 96px while keeping 36px baseline height for single line
    const el = e.target;
    el.style.height = "36px";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 36), 96)}px`;
  };

  const handleReconnect = () => {
    if (accessToken) {
      realtimeService.connect(accessToken);
    }
  };

  if (!activeFriend) return null;

  const displayName = activeFriend.fullName?.trim() || "Bạn bè";
  const avatarUrl = activeFriend.avatarUrl?.trim();
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div
      className={`fixed bottom-0 right-4 sm:right-6 z-50 flex flex-col rounded-t-[22px] bg-white border border-[#E3DEED] shadow-[0_12px_40px_rgba(47,42,69,0.22)] transition-all duration-200 ${
        isMinimized ? "w-72 sm:w-80" : "w-[340px] sm:w-[380px] h-[500px] max-h-[85vh]"
      }`}
    >
      {/* Header (Facebook Messenger style) */}
      <div
        className="flex items-center justify-between border-b border-[#ECE8F5] bg-white px-3.5 py-2.5 rounded-t-[22px] cursor-pointer select-none"
        onClick={() => dispatch(toggleMinimize())}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar with active status indicator */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-social-violet text-xs font-black text-white shadow-sm">
                {avatarLetter}
              </span>
            )}
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                connectionStatus === "connected"
                  ? "bg-[#31A24C]"
                  : connectionStatus === "connecting"
                  ? "bg-amber-400"
                  : "bg-gray-400"
              }`}
              title={
                connectionStatus === "connected"
                  ? "Đang hoạt động"
                  : connectionStatus === "connecting"
                  ? "Đang kết nối lại..."
                  : "Ngoại tuyến"
              }
            />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold text-social-ink leading-tight">
              {displayName}
            </h3>
            <p className="truncate text-[11px] font-medium text-social-muted">
              {connectionStatus === "connected"
                ? "Đang hoạt động"
                : connectionStatus === "connecting"
                ? "Đang kết nối..."
                : "Mất kết nối"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => dispatch(toggleMinimize())}
            className="grid h-7 w-7 place-items-center rounded-full text-social-muted hover:bg-[#F0EEF8] hover:text-social-ink transition-colors"
            title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
            aria-label={isMinimized ? "Mở rộng cửa sổ chat" : "Thu nhỏ cửa sổ chat"}
          >
            {isMinimized ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => dispatch(closeChat())}
            className="grid h-7 w-7 place-items-center rounded-full text-social-muted hover:bg-[#FEE2E2] hover:text-[#DC2626] transition-colors"
            title="Đóng chat"
            aria-label="Đóng cửa sổ trò chuyện"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body & Input (when not minimized) */}
      {!isMinimized && (
        <>
          {/* Connection warning banner if disconnected */}
          {connectionStatus !== "connected" && (
            <div className="flex items-center justify-between bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800 border-b border-amber-200">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                {connectionStatus === "connecting"
                  ? "Đang kết nối lại máy chủ chat..."
                  : "Mất kết nối thời gian thực"}
              </span>
              <button
                type="button"
                onClick={handleReconnect}
                className="font-bold underline hover:text-amber-900"
              >
                Kết nối lại
              </button>
            </div>
          )}

          {/* Message List */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-3.5 space-y-2 bg-[#F9F8FC] custom-scrollbar"
          >
            {/* Load Older Messages Button */}
            {hasMore && (
              <div className="text-center pb-1">
                <button
                  type="button"
                  onClick={handleLoadOlder}
                  disabled={isLoadingOlder}
                  className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-social-violet shadow-sm border border-[#E5E1F0] hover:bg-[#F3EFFC] disabled:opacity-60 transition"
                >
                  {isLoadingOlder ? "Đang tải tin nhắn cũ..." : "↑ Tải tin nhắn cũ hơn"}
                </button>
              </div>
            )}

            {/* Loading skeleton */}
            {isLoadingHistory && messages.length === 0 ? (
              <div className="space-y-3 py-4">
                <div className="flex items-end gap-2">
                  <div className="h-7 w-7 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-9 w-44 rounded-2xl bg-gray-200 animate-pulse" />
                </div>
                <div className="flex justify-end">
                  <div className="h-9 w-48 rounded-2xl bg-[#E0DCF7] animate-pulse" />
                </div>
                <div className="flex items-end gap-2">
                  <div className="h-7 w-7 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-12 w-52 rounded-2xl bg-gray-200 animate-pulse" />
                </div>
              </div>
            ) : messages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#EAE6FF] text-2xl shadow-inner">
                  👋
                </div>
                <h4 className="mt-3 text-xs font-extrabold text-social-ink">
                  Bắt đầu cuộc trò chuyện với {displayName}
                </h4>
                <p className="mt-1 max-w-[220px] text-[11px] text-social-muted">
                  Hãy gửi tin nhắn đầu tiên, chia sẻ đề cương hoặc thách đấu minigame.
                </p>
              </div>
            ) : (
              /* Message Bubbles */
              messages.map((msg, index) => {
                const isMe = msg.senderId === currentUser?.id;
                const prevMsg = messages[index - 1];
                const isSameSenderAsPrev = prevMsg && prevMsg.senderId === msg.senderId;
                const formattedTime = formatMessageTime(msg.createdAt);
                const sharedMat = msg.sharedMaterial;
                const sharedMatId =
                  sharedMat?.id || sharedMat?.materialId || msg.sharedMaterialId;
                const hasSharedGames = Boolean(
                  sharedMat?.hasMinigames ||
                    (sharedMat?.quizCount || 0) > 0 ||
                    (sharedMat?.memoryMatchCount || 0) > 0
                );
                const isChallenge = msg.messageType === "CHALLENGE_GAME" && sharedMat;
                const isShareMat = msg.messageType === "SHARE_MATERIAL" && sharedMat;

                return (
                  <div
                    key={msg.id || `${msg.createdAt}-${index}`}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${
                      isSameSenderAsPrev ? "mt-1" : "mt-2.5"
                    }`}
                  >
                    <div
                      className={`flex items-end gap-1.5 max-w-[88%] ${
                        isMe ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar for friend's messages (only on first of group) */}
                      {!isMe && (
                        <div className="w-7 shrink-0">
                          {!isSameSenderAsPrev ? (
                            avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt=""
                                className="h-7 w-7 rounded-full object-cover ring-1 ring-white"
                              />
                            ) : (
                              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#8F82ED] text-[10px] font-bold text-white">
                                {avatarLetter}
                              </span>
                            )
                          ) : (
                            <div className="w-7" />
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col gap-1.5 min-w-0 ${isMe ? "items-end" : "items-start"}`}>
                        {/* Text Bubble */}
                        {msg.content && (
                          <div
                            className={`group relative break-words px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                              isMe
                                ? "rounded-2xl rounded-tr-sm bg-social-violet text-white"
                                : "rounded-2xl rounded-tl-sm bg-white text-social-ink border border-[#ECE8F5]"
                            }`}
                            title={formattedTime}
                          >
                            <p className="whitespace-pre-wrap">
                              {isChallenge || isShareMat
                                ? msg.content.replace(/^(?:⚔️|📚|🎯|⚡|🃏)\s*/u, "")
                                : msg.content}
                            </p>
                          </div>
                        )}

                        {/* Rich Card: Minigame Challenge */}
                        {isChallenge && (
                          <div className="w-64 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-3 shadow-md space-y-2">
                            <div className="flex items-center justify-between gap-1">
                              <span className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                                Thách đấu Minigame
                              </span>
                              <span className="text-[10px] font-bold text-amber-800">
                                {msg.challengeGameType === "MEMORY_MATCH"
                                  ? "Lật thẻ"
                                  : "Trắc nghiệm"}
                              </span>
                            </div>

                            <div>
                              <p className="text-xs font-black text-[#2F2A45] line-clamp-2 leading-snug">
                                {sharedMat.title}
                              </p>
                              <p className="text-[11px] font-semibold text-social-violet mt-0.5 truncate">
                                {sharedMat.subjectName}
                              </p>
                            </div>

                            {msg.challengerScore > 0 && (
                              <div className="rounded-xl bg-amber-100/80 border border-amber-200 px-2.5 py-1.5 text-[11px] font-extrabold text-amber-900">
                                Điểm mục tiêu: {msg.challengerScore} điểm
                                {msg.challengerTimeSeconds
                                  ? ` (${msg.challengerTimeSeconds}s)`
                                  : ""}
                              </div>
                            )}

                            <div className="flex flex-col gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!sharedMatId) return;
                                  const targetMode =
                                    msg.challengeGameType === "MEMORY_MATCH"
                                      ? "match"
                                      : "quiz";
                                  navigate(
                                    `/study?materialId=${sharedMatId}&mode=${targetMode}&t=${Date.now()}`
                                  );
                                }}
                                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-1.5 text-[11px] font-black text-white shadow-sm hover:from-amber-600 hover:to-orange-600 transition"
                              >
                                Nhận lời thách đấu ngay
                              </button>
                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!sharedMatId) return;
                                    navigate(
                                      `/study?materialId=${sharedMatId}&mode=cheatsheet&t=${Date.now()}`
                                    );
                                  }}
                                  className="rounded-lg border border-amber-200 bg-white py-1 text-[10px] font-bold text-[#4F4965] hover:bg-amber-50 transition"
                                >
                                  Xem tóm tắt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!sharedMatId) return;
                                    navigate(
                                      `/study?materialId=${sharedMatId}&mode=original&t=${Date.now()}`
                                    );
                                  }}
                                  className="rounded-lg border border-amber-200 bg-white py-1 text-[10px] font-bold text-[#4F4965] hover:bg-amber-50 transition"
                                >
                                  Xem bản gốc
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Rich Card: Shared Study Material */}
                        {isShareMat && (
                          <div className="w-64 rounded-2xl border border-social-violet/30 bg-white p-3 shadow-md space-y-2">
                            <div className="flex items-center justify-between gap-1">
                              <span className="rounded-lg bg-social-violet/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-social-violet">
                                Đề cương chia sẻ
                              </span>
                              <span className="rounded bg-[#F0EEF8] px-1.5 py-0.5 text-[9px] font-black uppercase text-[#4F4965]">
                                {sharedMat.fileType || "DOC"}
                              </span>
                            </div>

                            <div>
                              <p className="text-xs font-black text-[#2F2A45] line-clamp-2 leading-snug">
                                {sharedMat.title}
                              </p>
                              <p className="text-[11px] font-semibold text-social-violet mt-0.5 truncate">
                                {sharedMat.subjectName}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!sharedMatId) return;
                                  navigate(
                                    `/study?materialId=${sharedMatId}&mode=cheatsheet&t=${Date.now()}`
                                  );
                                }}
                                className="rounded-xl bg-social-violet py-1.5 text-[11px] font-extrabold text-white shadow-xs hover:bg-[#6E60DC] transition"
                              >
                                Tóm tắt AI
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!sharedMatId) return;
                                  navigate(
                                    `/study?materialId=${sharedMatId}&mode=original&t=${Date.now()}`
                                  );
                                }}
                                className="rounded-xl border border-social-violet/30 bg-[#FAF9FD] py-1.5 text-[11px] font-extrabold text-social-violet hover:bg-social-violet/10 transition"
                              >
                                Bản gốc
                              </button>
                            </div>

                            {hasSharedGames && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!sharedMatId) return;
                                  navigate(
                                    `/study?materialId=${sharedMatId}&mode=quiz&t=${Date.now()}`
                                  );
                                }}
                                className="w-full rounded-xl bg-amber-50 border border-amber-200 py-1 text-[10px] font-extrabold text-amber-700 hover:bg-amber-100 transition"
                              >
                                Vào chơi Minigame ôn tập
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <span
                      className={`text-[9px] text-social-muted px-2 pt-0.5 select-none ${
                        isMe ? "text-right" : "text-left pl-9"
                      }`}
                    >
                      {formattedTime}
                    </span>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Share Material / Challenge Picker Popover */}
          {isMaterialPickerOpen && (
            <div className="border-t border-[#ECE8F5] bg-white p-3 max-h-56 flex flex-col space-y-2 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex rounded-xl bg-[#F0EEF8] p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPickerMode("SHARE_MATERIAL")}
                    className={`rounded-lg px-2.5 py-1 transition ${
                      pickerMode === "SHARE_MATERIAL"
                        ? "bg-white text-social-violet shadow-xs font-extrabold"
                        : "text-[#77718C]"
                    }`}
                  >
                    Chia sẻ đề cương
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerMode("CHALLENGE_GAME")}
                    className={`rounded-lg px-2.5 py-1 transition ${
                      pickerMode === "CHALLENGE_GAME"
                        ? "bg-amber-500 text-white shadow-xs font-extrabold"
                        : "text-[#77718C]"
                    }`}
                  >
                    Thách đấu
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMaterialPickerOpen(false)}
                  className="text-[11px] font-bold text-[#77718C] hover:text-[#2F2A45]"
                >
                  Đóng
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {isLoadingMyMaterials ? (
                  <p className="py-4 text-center text-xs text-[#77718C] animate-pulse">
                    Đang tải đề cương...
                  </p>
                ) : completedMaterials.length === 0 ? (
                  <p className="py-4 text-center text-xs text-[#77718C]">
                    Bạn chưa có đề cương nào đã xử lý.
                  </p>
                ) : (
                  completedMaterials.map((mat) => {
                    const hasGames =
                      (mat.quizData?.length || 0) > 0 ||
                      (mat.memoryMatchData?.length || 0) > 0;
                    return (
                      <div
                        key={mat.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[#ECE8F5] bg-[#FAF9FD] p-2 hover:bg-white transition"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[#2F2A45]">
                            {mat.title}
                          </p>
                          <p className="truncate text-[10px] text-social-violet font-semibold">
                            {mat.subjectName}
                          </p>
                        </div>

                        {pickerMode === "CHALLENGE_GAME" ? (
                          hasGames ? (
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                disabled={isSharingMaterial}
                                onClick={() =>
                                  handleQuickShareMaterial(
                                    mat,
                                    "CHALLENGE_GAME",
                                    "SPEED_QUIZ"
                                  )
                                }
                                className="rounded-lg bg-amber-500 px-2 py-1 text-[10px] font-extrabold text-white hover:bg-amber-600 disabled:opacity-50"
                                title="Thách đấu Trắc nghiệm"
                              >
                                Quiz
                              </button>
                              <button
                                type="button"
                                disabled={isSharingMaterial}
                                onClick={() =>
                                  handleQuickShareMaterial(
                                    mat,
                                    "CHALLENGE_GAME",
                                    "MEMORY_MATCH"
                                  )
                                }
                                className="rounded-lg bg-social-violet px-2 py-1 text-[10px] font-extrabold text-white hover:bg-[#6E60DC] disabled:opacity-50"
                                title="Thách đấu Lật thẻ"
                              >
                                Thẻ
                              </button>
                            </div>
                          ) : (
                            <span className="shrink-0 text-[10px] text-[#77718C]">
                              Chưa tạo game
                            </span>
                          )
                        ) : (
                          <button
                            type="button"
                            disabled={isSharingMaterial}
                            onClick={() =>
                              handleQuickShareMaterial(mat, "SHARE_MATERIAL")
                            }
                            className="shrink-0 rounded-lg bg-social-violet px-2.5 py-1 text-[10px] font-extrabold text-white hover:bg-[#6E60DC] disabled:opacity-50"
                          >
                            Gửi
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Send Error Toast */}
          {sendError && (
            <div className="bg-red-50 px-3 py-1 text-[11px] text-red-600 border-t border-red-100 flex items-center justify-between">
              <span>{sendError}</span>
              <button
                type="button"
                onClick={() => setSendError("")}
                className="font-bold text-red-700 hover:underline ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Bar (Facebook Messenger style) */}
          <div className="border-t border-[#ECE8F5] bg-white px-3 py-2.5">
            <div className="flex items-center gap-2">
              {/* Quick Share Study Material / Challenge button (Simple Paperclip Icon) */}
              <button
                type="button"
                onClick={() => setIsMaterialPickerOpen((prev) => !prev)}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${
                  isMaterialPickerOpen
                    ? "border-social-violet bg-social-violet text-white"
                    : "border-[#E5E1F0] bg-[#F7F5FC] text-social-violet hover:bg-[#EAE6FF]"
                }`}
                title="Đính kèm Đề cương hoặc Thách đấu Minigame"
                aria-label="Đính kèm Đề cương hoặc Thách đấu Minigame"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>

              <div className="relative flex-1 flex items-center">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn... (Enter để gửi)"
                  rows={1}
                  maxLength={2000}
                  className="block w-full h-9 min-h-[36px] max-h-24 resize-none rounded-full border border-[#E5E1F0] bg-[#F7F5FC] px-3.5 py-[7px] text-xs leading-5 font-medium text-social-ink placeholder-social-muted outline-none transition focus:border-social-violet focus:bg-white focus:ring-2 focus:ring-social-violet/20 custom-scrollbar"
                />
                {inputText.length > 1800 && (
                  <span className="absolute right-3 bottom-2 text-[10px] font-bold text-social-muted">
                    {inputText.length}/2000
                  </span>
                )}
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition duration-150 ${
                  inputText.trim()
                    ? "bg-social-violet text-white shadow-md hover:bg-[#6E60DC] active:scale-95"
                    : "bg-[#EAE6FF] text-[#A699ED] cursor-not-allowed"
                }`}
                title="Gửi tin nhắn"
                aria-label="Gửi tin nhắn"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.49-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

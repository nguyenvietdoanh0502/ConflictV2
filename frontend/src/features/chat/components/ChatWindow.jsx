import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  closeChat,
  toggleMinimize,
  selectActiveFriend,
  selectIsChatMinimized,
} from "../chatSlice";
import { selectCurrentUser, selectAccessToken } from "../../auth/authSelectors";
import { useGetChatHistoryQuery, useLazyGetChatHistoryQuery } from "../chatApi";
import { realtimeService } from "../../../services/realtime";

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
        textareaRef.current.style.height = "auto";
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setInputText(e.target.value);
    if (sendError) setSendError("");

    // Auto-adjust height up to 100px
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
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
        isMinimized ? "w-72 sm:w-80" : "w-[340px] sm:w-[370px] h-[480px] max-h-[85vh]"
      }`}
    >
      {/* Header (Facebook Messenger style) */}
      <div
        className="flex items-center justify-between border-b border-[#ECE8F5] bg-gradient-to-r from-white via-white to-[#FAF8FF] px-3.5 py-2.5 rounded-t-[22px] cursor-pointer select-none"
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
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-social-violet to-[#FF8FB3] text-xs font-black text-white shadow-sm">
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
                  Hãy gửi tin nhắn đầu tiên để cùng nhau thảo luận bài học hoặc thách đấu minigame.
                </p>
              </div>
            ) : (
              /* Message Bubbles */
              messages.map((msg, index) => {
                const isMe = msg.senderId === currentUser?.id;
                const prevMsg = messages[index - 1];
                const isSameSenderAsPrev = prevMsg && prevMsg.senderId === msg.senderId;
                const formattedTime = formatMessageTime(msg.createdAt);

                return (
                  <div
                    key={msg.id || `${msg.createdAt}-${index}`}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${
                      isSameSenderAsPrev ? "mt-1" : "mt-2.5"
                    }`}
                  >
                    <div className={`flex items-end gap-1.5 max-w-[82%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
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

                      {/* Bubble */}
                      <div
                        className={`group relative break-words px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? "rounded-2xl rounded-tr-sm bg-gradient-to-r from-social-violet to-[#8F82ED] text-white"
                            : "rounded-2xl rounded-tl-sm bg-white text-social-ink border border-[#ECE8F5]"
                        }`}
                        title={formattedTime}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
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
          <div className="border-t border-[#ECE8F5] bg-white p-2.5">
            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn... (Enter để gửi)"
                  rows={1}
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl border border-[#E5E1F0] bg-[#F7F5FC] px-3 py-2 text-xs font-medium text-social-ink placeholder-social-muted outline-none transition focus:border-social-violet focus:bg-white focus:ring-2 focus:ring-social-violet/20 max-h-24 custom-scrollbar"
                />
                {inputText.length > 1800 && (
                  <span className="absolute right-2 bottom-2 text-[10px] font-bold text-social-muted">
                    {inputText.length}/2000
                  </span>
                )}
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition duration-150 ${
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

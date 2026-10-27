import { useState, useMemo, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useGetFriendsQuery } from "../../friend/friendApi";
import { openChat, selectActiveFriend, selectUnreadCounts } from "../chatSlice";

export default function MessengerDropdown({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  const { data: friends = [], isLoading, isError, refetch } = useGetFriendsQuery();
  const activeFriend = useSelector(selectActiveFriend);
  const unreadCounts = useSelector(selectUnreadCounts);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread" | "group"

  // Calculate unread items count
  const unreadTotal = useMemo(() => {
    return Object.values(unreadCounts || {}).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

  // Filter friends based on search query and active tab
  const filteredFriends = useMemo(() => {
    let list = friends;

    if (activeTab === "unread") {
      list = list.filter((f) => (unreadCounts[f.user?.id] || 0) > 0);
    } else if (activeTab === "group") {
      // In current backend, groups are future feature; return empty list for group tab
      list = [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((f) =>
        f.user?.fullName?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [friends, searchQuery, activeTab, unreadCounts]);

  const handleOpenChat = (friendUser) => {
    dispatch(openChat(friendUser));
    if (onClose) onClose();
  };

  const handleComposeClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSeeAllClick = () => {
    if (onClose) onClose();
    navigate("/friends");
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (onClose) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="Hộp thoại đoạn chat Messenger"
      className="fixed sm:absolute top-[68px] sm:top-full left-3 right-3 sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-[380px] max-h-[85vh] sm:max-h-[580px] z-50 flex flex-col rounded-[22px] bg-white border border-[#EBE8F3] shadow-[0_14px_35px_rgba(47,42,69,0.18)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans"
    >
      {/* 1. Header Bar */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
        <h2 className="text-[22px] font-bold text-[#2F2A45] tracking-tight">
          Đoạn chat
        </h2>

        <div className="flex items-center gap-1.5">
          {/* Options button */}
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full bg-[#F0EEF8] text-[#4F4965] hover:bg-[#E4E0F3] hover:text-social-violet transition"
            title="Tùy chọn đoạn chat"
            aria-label="Tùy chọn đoạn chat"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Search Input */}
      <div className="px-4 py-1.5">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#807C92]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              d="m21 21-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
            />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trên Messenger"
            className="w-full rounded-full border border-transparent bg-[#F0EEF8] py-2 pl-9 pr-8 text-[13px] font-medium text-[#2F2A45] placeholder-[#807C92] outline-none transition focus:border-social-violet focus:bg-white focus:ring-2 focus:ring-social-violet/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#807C92] hover:text-[#2F2A45]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Filter Pills */}
      <div className="flex items-center gap-1.5 px-4 pt-2 pb-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`rounded-full px-3 py-1 text-xs transition ${
            activeTab === "all"
              ? "bg-[#EAE6FF] font-extrabold text-social-violet"
              : "font-semibold text-[#66607B] hover:bg-[#F0EEF8]"
          }`}
        >
          Tất cả
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={`rounded-full px-3 py-1 text-xs transition flex items-center gap-1 ${
            activeTab === "unread"
              ? "bg-[#EAE6FF] font-extrabold text-social-violet"
              : "font-semibold text-[#66607B] hover:bg-[#F0EEF8]"
          }`}
        >
          <span>Chưa đọc</span>
          {unreadTotal > 0 && (
            <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-[#E41E3F] px-1 text-[9px] font-extrabold text-white">
              {unreadTotal > 9 ? "9+" : unreadTotal}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("group")}
          className={`rounded-full px-3 py-1 text-xs transition ${
            activeTab === "group"
              ? "bg-[#EAE6FF] font-extrabold text-social-violet"
              : "font-semibold text-[#66607B] hover:bg-[#F0EEF8]"
          }`}
        >
          Nhóm
        </button>

        <button
          type="button"
          className="rounded-full px-2.5 py-1 text-xs font-semibold text-[#66607B] hover:bg-[#F0EEF8] transition"
          title="Bộ lọc khác"
        >
          •••
        </button>
      </div>

      {/* 4. Conversations / Friends List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 max-h-[360px] sm:max-h-[380px] custom-scrollbar">
        {isLoading ? (
          <div className="space-y-1.5 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-2xl animate-pulse">
                <div className="h-12 w-12 rounded-full bg-[#EAE7F2] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/5 rounded bg-[#EAE7F2]" />
                  <div className="h-2.5 w-4/5 rounded bg-[#F1EEF8]" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-xs text-[#807C92]">
            <p>Không thể tải danh sách cuộc trò chuyện</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-2 font-bold text-social-violet hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : friends.length === 0 && !searchQuery.trim() ? (
          <div className="py-10 text-center px-4">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EAE6FF] text-2xl">
              💬
            </div>
            <p className="mt-3 text-sm font-bold text-[#2F2A45]">Chưa có đoạn chat nào</p>
            <p className="mt-1 text-xs text-[#807C92]">
              Kết bạn để bắt đầu trò chuyện và kết nối cùng mọi người.
            </p>
            <Link
              to="/friends"
              onClick={onClose}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-social-violet px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#6E60DC]"
            >
              + Tìm kiếm bạn bè
            </Link>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#807C92]">
            {activeTab === "unread" ? (
              <p>Không có tin nhắn chưa đọc nào</p>
            ) : activeTab === "group" ? (
              <p>Chưa có nhóm trò chuyện nào</p>
            ) : (
              <p>
                Không tìm thấy kết quả phù hợp
                {searchQuery.trim() ? ` cho "${searchQuery.trim()}"` : ""}
              </p>
            )}
          </div>
        ) : (
          filteredFriends.map((friend) => {
            const friendUser = friend.user;
            const isCurrentChat = activeFriend?.id === friendUser.id;
            const unreadCount = unreadCounts[friendUser.id] || 0;
            const displayName = friendUser.fullName?.trim() || "Bạn bè";
            const avatarUrl = friendUser.avatarUrl?.trim();
            const avatarLetter = displayName.charAt(0).toUpperCase();

            return (
              <button
                key={friend.friendshipId || friendUser.id}
                type="button"
                onClick={() => handleOpenChat(friendUser)}
                className={`group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition duration-150 ${
                  isCurrentChat
                    ? "bg-[#EAE6FF]/70 text-social-violet"
                    : "hover:bg-[#F3EFFC] text-[#2F2A45]"
                }`}
              >
                {/* Avatar with Online indicator */}
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-12 w-12 rounded-full object-cover ring-1 ring-black/5"
                    />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-social-violet text-base font-extrabold text-white ring-1 ring-black/5">
                      {avatarLetter}
                    </span>
                  )}
                  {/* Online dot indicator */}
                  <span
                    className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#31A24C]"
                    title="Đang hoạt động"
                  />
                </div>

                {/* Name & Message Snippet */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`truncate text-sm ${
                        unreadCount > 0 ? "font-extrabold text-[#2F2A45]" : "font-bold text-[#2F2A45]"
                      }`}
                    >
                      {displayName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p
                      className={`truncate text-xs ${
                        unreadCount > 0
                          ? "font-bold text-[#2F2A45]"
                          : isCurrentChat
                          ? "text-social-violet font-semibold"
                          : "text-[#807C92]"
                      }`}
                    >
                      {unreadCount > 0
                        ? "Tin nhắn mới..."
                        : isCurrentChat
                        ? "Đang mở đoạn chat"
                        : "Nhấn để trò chuyện"}
                    </p>
                    <span className="text-[11px] text-[#807C92] shrink-0">· Vừa xong</span>
                  </div>
                </div>

                {/* Unread indicator */}
                {unreadCount > 0 && (
                  <div className="shrink-0 pl-1">
                    <span className="grid h-3 w-3 rounded-full bg-social-violet ring-2 ring-white" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* 5. Footer Link - Xem tất cả trong Messenger */}
      <div className="border-t border-[#F0EDF7] p-2.5 text-center bg-white">
        <Link
          to="/friends"
          onClick={onClose}
          className="text-sm font-bold text-social-violet hover:underline inline-flex items-center justify-center gap-1 w-full py-1"
        >
          Xem tất cả trong Messenger
        </Link>
      </div>
    </div>
  );
}

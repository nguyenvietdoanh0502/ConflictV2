import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useGetFriendsQuery } from "../../friend/friendApi";
import { openChat, selectActiveFriend, selectUnreadCounts } from "../chatSlice";

export default function ContactsSidebar({ className = "" }) {
  const dispatch = useDispatch();
  const { data: friends = [], isLoading, isError, refetch } = useGetFriendsQuery();
  const activeFriend = useSelector(selectActiveFriend);
  const unreadCounts = useSelector(selectUnreadCounts);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase().trim();
    return friends.filter((f) =>
      f.user?.fullName?.toLowerCase().includes(q)
    );
  }, [friends, searchQuery]);

  const handleOpenChat = (friendUser) => {
    dispatch(openChat(friendUser));
  };

  return (
    <div
      className={`flex flex-col rounded-[26px] border border-white/80 bg-white/80 p-4 shadow-card backdrop-blur-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EDF7]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#31A24C] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#31A24C]" />
          </span>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-social-ink">
            Người liên hệ
          </h2>
        </div>
        <span className="rounded-full bg-[#EAE6FF] px-2.5 py-0.5 text-xs font-bold text-social-violet">
          {friends.length}
        </span>
      </div>

      {/* Quick Search */}
      <div className="relative mt-3">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-social-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m21 21-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm bạn bè..."
          className="w-full rounded-2xl border border-[#E9E5F2] bg-[#F7F5FC] py-2 pl-9 pr-3 text-xs font-medium text-social-ink placeholder-social-muted outline-none transition focus:border-social-violet focus:bg-white focus:ring-2 focus:ring-social-violet/20"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-social-muted hover:text-social-ink"
          >
            ✕
          </button>
        )}
      </div>

      {/* Friends List */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-1 max-h-[calc(100vh-22rem)] pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded bg-gray-200" />
                  <div className="h-2.5 w-1/2 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-6 text-center text-xs text-social-muted">
            <p>Không thể tải danh sách bạn bè</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-2 font-bold text-social-violet hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : friends.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EAE6FF] text-2xl">
              👥
            </div>
            <p className="mt-3 text-xs font-bold text-social-ink">Chưa có người liên hệ</p>
            <p className="mt-1 text-[11px] text-social-muted">
              Kết nối với bạn cùng lớp để trao đổi và thi đấu minigame.
            </p>
            <Link
              to="/friends"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-social-violet px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#6E60DC]"
            >
              <span>+</span> Thêm bạn bè
            </Link>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="py-6 text-center text-xs text-social-muted">
            Không tìm thấy bạn bè phù hợp
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
                    ? "bg-[#EAE6FF] text-social-violet shadow-sm"
                    : "hover:bg-[#F3EFFC] text-social-ink"
                }`}
              >
                {/* Avatar with Online indicator */}
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#8F82ED] to-[#FF8FB3] text-sm font-extrabold text-white ring-2 ring-white">
                      {avatarLetter}
                    </span>
                  )}
                  {/* Active dot */}
                  <span
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#31A24C]"
                    title="Đang hoạt động"
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`truncate text-sm ${
                        unreadCount > 0 ? "font-extrabold text-social-ink" : "font-semibold"
                      }`}
                    >
                      {displayName}
                    </p>
                    {unreadCount > 0 && (
                      <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[#E41E3F] px-1 text-[10px] font-extrabold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-social-muted">
                    {unreadCount > 0
                      ? "Tin nhắn mới..."
                      : isCurrentChat
                      ? "Đang mở chat"
                      : "Nhấn để trò chuyện"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer shortcut to /friends */}
      {friends.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#F0EDF7] text-center">
          <Link
            to="/friends"
            className="text-xs font-bold text-social-violet hover:underline inline-flex items-center gap-1"
          >
            Quản lý lời mời & bạn bè
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}

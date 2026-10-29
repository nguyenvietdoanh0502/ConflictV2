import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Sun,
  MessageCircle,
  Trash2,
  Sparkles,
  RotateCw,
  Clock,
  ChevronRight,
  UserPlus,
  UserCheck,
  BookOpen,
  Swords,
} from "lucide-react";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useTriggerTodayScheduleMutation,
} from "../notificationApi";
import { openChat } from "../../chat/chatSlice";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 172800) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `Hôm qua lúc ${hours}:${minutes}`;
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function NotificationDropdown({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread"
  const [page] = useState(0);

  const {
    data: notifData,
    isLoading,
  } = useGetNotificationsQuery({
    page,
    size: 30,
    unreadOnly: activeTab === "unread",
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [triggerTodaySchedule, { isLoading: isTriggeringToday }] =
    useTriggerTodayScheduleMutation();

  const notifications = notifData?.items || [];
  const totalUnread = notifData?.totalUnread || 0;

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

  const handleNotificationClick = async (notif) => {
    // 1. Mark as read if not yet read
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id).unwrap();
      } catch {
        // ignore
      }
    }

    let meta = {};
    if (notif.metadata) {
      try {
        meta = JSON.parse(notif.metadata);
      } catch {
        // ignore
      }
    }

    // 2. Action based on type
    if (notif.type === "NEW_MESSAGE") {
      if (meta.senderId) {
        dispatch(
          openChat({
            id: meta.senderId,
            fullName: meta.senderName || notif.title,
            avatarUrl: meta.avatarUrl || null,
          })
        );
      } else {
        navigate("/friends");
      }
      if (onClose) onClose();
    } else if (
      notif.type === "MATERIAL_SHARED" ||
      notif.type === "MINIGAME_CHALLENGE"
    ) {
      if (notif.link) {
        navigate(notif.link);
      } else if (meta.materialId) {
        const mode =
          notif.type === "MINIGAME_CHALLENGE"
            ? meta.challengeGameType === "MEMORY_MATCH"
              ? "match"
              : "quiz"
            : "cheatsheet";
        navigate(`/study?materialId=${meta.materialId}&mode=${mode}`);
      } else {
        navigate("/study");
      }
      if (onClose) onClose();
    } else if (
      notif.type === "FRIEND_REQUEST_RECEIVED" ||
      notif.type === "FRIEND_REQUEST_ACCEPTED"
    ) {
      navigate("/friends");
      if (onClose) onClose();
    } else if (
      notif.type === "NEW_SCHEDULE_EVENT" ||
      notif.type === "TODAY_SCHEDULE"
    ) {
      navigate("/timetable");
      if (onClose) onClose();
    } else if (notif.link) {
      navigate(notif.link);
      if (onClose) onClose();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleTriggerToday = async () => {
    try {
      await triggerTodaySchedule().unwrap();
    } catch (err) {
      console.error("Failed to trigger today schedule:", err);
    }
  };

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id).unwrap();
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Hộp thoại thông báo"
      className="fixed sm:absolute top-[68px] sm:top-full left-3 right-3 sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-[410px] max-h-[85vh] sm:max-h-[600px] z-50 flex flex-col rounded-[22px] bg-white border border-[#EBE8F3] shadow-[0_14px_35px_rgba(47,42,69,0.18)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans"
    >
      {/* 1. Header Bar */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-[#F0EEF8]">
        <div className="flex items-center gap-2">
          <h2 className="text-[22px] font-bold text-[#2F2A45] tracking-tight">
            Thông báo
          </h2>
          {totalUnread > 0 && (
            <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-social-violet/15 px-1.5 text-xs font-bold text-social-violet">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Refresh/Check today schedule briefing */}
          <button
            type="button"
            onClick={handleTriggerToday}
            disabled={isTriggeringToday}
            className="grid h-8 w-8 place-items-center rounded-full bg-[#F0EEF8] text-[#4F4965] hover:bg-[#E4E0F3] hover:text-social-violet transition disabled:opacity-50"
            title="Tạo/Làm mới tóm tắt lịch học hôm nay"
            aria-label="Tạo/Làm mới tóm tắt lịch học hôm nay"
          >
            <RotateCw className={`h-4 w-4 ${isTriggeringToday ? "animate-spin text-social-violet" : ""}`} />
          </button>

          {/* Mark all as read */}
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll || totalUnread === 0}
            className="grid h-8 w-8 place-items-center rounded-full bg-[#F0EEF8] text-[#4F4965] hover:bg-[#E4E0F3] hover:text-social-violet transition disabled:opacity-40"
            title="Đánh dấu tất cả là đã đọc"
            aria-label="Đánh dấu tất cả là đã đọc"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Filter Tabs (Facebook Pills style) */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#F0EEF8] bg-[#FAF9FD]">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
            activeTab === "all"
              ? "bg-social-violet text-white shadow-sm"
              : "bg-white text-[#6F6B83] border border-[#E5E2EC] hover:bg-[#F0EEF8] hover:text-[#2F2A45]"
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
            activeTab === "unread"
              ? "bg-social-violet text-white shadow-sm"
              : "bg-white text-[#6F6B83] border border-[#E5E2EC] hover:bg-[#F0EEF8] hover:text-[#2F2A45]"
          }`}
        >
          <span>Chưa đọc</span>
          {totalUnread > 0 && (
            <span
              className={`grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[10px] ${
                activeTab === "unread"
                  ? "bg-white text-social-violet font-extrabold"
                  : "bg-social-violet text-white"
              }`}
            >
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* 3. Notifications List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 divide-y divide-transparent">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <RotateCw className="h-6 w-6 text-social-violet animate-spin mb-2" />
            <p className="text-xs text-[#8F8A9F]">Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-14 px-4 flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-full bg-[#F0EEF8] grid place-items-center text-social-violet mb-3">
              <Bell className="h-7 w-7 text-social-violet/70" />
            </div>
            <p className="text-sm font-bold text-[#2F2A45]">
              {activeTab === "unread"
                ? "Không có thông báo chưa đọc"
                : "Bạn chưa có thông báo nào"}
            </p>
            <p className="text-xs text-[#8F8A9F] mt-1 max-w-[240px]">
              {activeTab === "unread"
                ? "Bạn đã đọc hết mọi thông báo quan trọng rồi!"
                : "Các cập nhật thời khóa biểu, chia sẻ đề cương, thách đấu và tin nhắn sẽ xuất hiện tại đây."}
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            let meta = {};
            if (notif.metadata) {
              try {
                meta = JSON.parse(notif.metadata);
              } catch {
                // ignore
              }
            }

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`group relative flex items-start gap-3 p-2.5 rounded-xl transition cursor-pointer ${
                  notif.isRead
                    ? "hover:bg-[#F5F3FA]"
                    : "bg-[#F3F0FC]/70 hover:bg-[#ECE7F9]"
                }`}
              >
                {/* Icon / Avatar on the left */}
                <div className="relative shrink-0">
                  {notif.type === "NEW_MESSAGE" ? (
                    <div className="relative">
                      {meta.avatarUrl ? (
                        <img
                          src={meta.avatarUrl}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-[#6E60DC] to-[#8C7EFF] text-white font-extrabold text-sm grid place-items-center ring-2 ring-white shadow-sm">
                          {(meta.senderName || notif.title || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-[#0084FF] text-white grid place-items-center shadow ring-2 ring-white">
                        <MessageCircle className="h-3 w-3 fill-current" />
                      </span>
                    </div>
                  ) : notif.type === "MINIGAME_CHALLENGE" ? (
                    <div className="relative">
                      {meta.avatarUrl ? (
                        <img
                          src={meta.avatarUrl}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-extrabold text-sm grid place-items-center ring-2 ring-white shadow-sm">
                          {(meta.senderName || notif.title || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-amber-500 text-white grid place-items-center shadow ring-2 ring-white">
                        <Swords className="h-3 w-3" />
                      </span>
                    </div>
                  ) : notif.type === "MATERIAL_SHARED" ? (
                    <div className="relative">
                      {meta.avatarUrl ? (
                        <img
                          src={meta.avatarUrl}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-[#6E60DC] to-[#9B8FF3] text-white font-extrabold text-sm grid place-items-center ring-2 ring-white shadow-sm">
                          {(meta.senderName || notif.title || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-social-violet text-white grid place-items-center shadow ring-2 ring-white">
                        <BookOpen className="h-3 w-3" />
                      </span>
                    </div>
                  ) : notif.type === "FRIEND_REQUEST_RECEIVED" ? (
                    <div className="relative">
                      {meta.avatarUrl ? (
                        <img
                          src={meta.avatarUrl}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-[#7C6EE6] to-[#9B8FF3] text-white font-extrabold text-sm grid place-items-center ring-2 ring-white shadow-sm">
                          {(meta.senderName || notif.title || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-social-violet text-white grid place-items-center shadow ring-2 ring-white">
                        <UserPlus className="h-3 w-3" />
                      </span>
                    </div>
                  ) : notif.type === "FRIEND_REQUEST_ACCEPTED" ? (
                    <div className="relative">
                      {meta.avatarUrl ? (
                        <img
                          src={meta.avatarUrl}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-[#10B981] to-[#34D399] text-white font-extrabold text-sm grid place-items-center ring-2 ring-white shadow-sm">
                          {(meta.fullName || notif.title || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-[#10B981] text-white grid place-items-center shadow ring-2 ring-white">
                        <UserCheck className="h-3 w-3" />
                      </span>
                    </div>
                  ) : notif.type === "TODAY_SCHEDULE" ? (
                    <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-[#FF9800] to-[#FFB74D] text-white grid place-items-center ring-2 ring-white shadow-sm">
                      <Sun className="h-6 w-6 stroke-[2.2]" />
                    </div>
                  ) : (
                    /* NEW_SCHEDULE_EVENT */
                    <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-[#7C6EE6] to-[#9B8FF3] text-white grid place-items-center ring-2 ring-white shadow-sm">
                      <Sparkles className="h-6 w-6 stroke-[2.2]" />
                    </div>
                  )}
                </div>

                {/* Content in the middle */}
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-[13px] leading-snug text-[#2F2A45]">
                    <span className="font-bold text-[#1D192B] mr-1">
                      {notif.title}
                    </span>
                    <span className="text-[#4F4965] break-words">
                      {notif.type === "NEW_MESSAGE"
                        ? `đã nhắn: "${notif.content}"`
                        : notif.content}
                    </span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#77718C]">
                    <Clock className="h-3 w-3 inline text-[#9A95AD]" />
                    <span>{formatRelativeTime(notif.createdAt)}</span>
                    {notif.type === "TODAY_SCHEDULE" && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#FFF3E0] text-[#E65100] text-[10px] font-bold">
                        Hôm nay
                      </span>
                    )}
                    {notif.type === "NEW_SCHEDULE_EVENT" && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#EDE7F6] text-[#512DA8] text-[10px] font-bold">
                        Thời khóa biểu
                      </span>
                    )}
                    {notif.type === "MATERIAL_SHARED" && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#EDE7F6] text-social-violet text-[10px] font-bold">
                        Đề cương chia sẻ
                      </span>
                    )}
                    {notif.type === "MINIGAME_CHALLENGE" && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        ⚔️ Thách đấu
                      </span>
                    )}
                    {notif.type === "FRIEND_REQUEST_RECEIVED" && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#EDE7F6] text-[#512DA8] text-[10px] font-bold">
                        Lời mời kết bạn
                      </span>
                    )}
                    {notif.type === "FRIEND_REQUEST_ACCEPTED" && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold">
                        Bạn bè mới
                      </span>
                    )}
                  </div>
                </div>

                {/* Unread indicator / Actions on the right */}
                <div className="shrink-0 flex items-center gap-1 pt-1">
                  {!notif.isRead && (
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-social-violet shadow-sm"
                      title="Chưa đọc"
                    />
                  )}

                  {/* Delete button on hover */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(e, notif.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-[#8F8A9F] hover:bg-white hover:text-[#E41E3F] transition shadow-xs"
                    title="Xóa thông báo"
                    aria-label="Xóa thông báo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Footer link */}
      <div className="p-2 border-t border-[#F0EEF8] bg-[#FAF9FD] flex items-center justify-between text-xs text-[#77718C]">
        <button
          type="button"
          onClick={() => {
            navigate("/timetable");
            if (onClose) onClose();
          }}
          className="flex items-center gap-1 font-semibold text-social-violet hover:underline px-2 py-1"
        >
          <span>Xem Thời khóa biểu</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        <span className="text-[11px] text-[#A29EB2] pr-2">
          {notifications.length > 0 && `${notifications.length} thông báo`}
        </span>
      </div>
    </div>
  );
}

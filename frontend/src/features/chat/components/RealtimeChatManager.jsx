import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { realtimeService } from "../../../services/realtime";
import {
  selectAccessToken,
  selectCurrentUser,
  selectIsAuthenticated,
} from "../../auth/authSelectors";
import {
  incrementUnread,
  selectActiveFriend,
  selectIsChatMinimized,
  selectIsMobileContactsOpen,
  setMobileContactsOpen,
} from "../chatSlice";
import ChatWindow from "./ChatWindow";
import ContactsSidebar from "./ContactsSidebar";

export default function RealtimeChatManager() {
  const dispatch = useDispatch();
  const accessToken = useSelector(selectAccessToken);
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const activeFriend = useSelector(selectActiveFriend);
  const isMinimized = useSelector(selectIsChatMinimized);
  const isMobileContactsOpen = useSelector(selectIsMobileContactsOpen);

  // Manage WebSocket connection lifecycle
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      realtimeService.connect(accessToken);
    } else {
      realtimeService.disconnect();
    }

    return () => {
      // Disconnect on unmount
      realtimeService.disconnect();
    };
  }, [isAuthenticated, accessToken]);

  // Global listener for incoming messages to increment unread count
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = realtimeService.onMessage((message) => {
      if (!message || !message.senderId) return;

      // Only count messages from other people
      if (message.senderId !== currentUser?.id) {
        // If chat with this friend is not currently open and active, or is minimized
        if (!activeFriend || activeFriend.id !== message.senderId || isMinimized) {
          dispatch(incrementUnread(message.senderId));
        }
      }
    });

    return unsubscribe;
  }, [isAuthenticated, currentUser?.id, activeFriend, isMinimized, dispatch]);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Docked Messenger Chat Window */}
      {activeFriend && <ChatWindow key={activeFriend.id} />}

      {/* Mobile Contacts Drawer / Modal */}
      {isMobileContactsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div
            className="fixed inset-0"
            onClick={() => dispatch(setMobileContactsOpen(false))}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-white p-5 shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EDF7]">
              <h2 className="text-base font-extrabold text-social-ink flex items-center gap-2">
                <span>💬</span> Trò chuyện cùng bạn bè
              </h2>
              <button
                type="button"
                onClick={() => dispatch(setMobileContactsOpen(false))}
                className="grid h-8 w-8 place-items-center rounded-full text-social-muted hover:bg-[#F3EFFC] hover:text-social-ink transition"
                aria-label="Đóng danh sách bạn bè"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex-1 overflow-y-auto">
              <ContactsSidebar className="border-0 shadow-none p-0 bg-transparent" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

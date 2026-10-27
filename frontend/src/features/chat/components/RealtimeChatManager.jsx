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
} from "../chatSlice";
import ChatWindow from "./ChatWindow";

export default function RealtimeChatManager() {
  const dispatch = useDispatch();
  const accessToken = useSelector(selectAccessToken);
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const activeFriend = useSelector(selectActiveFriend);
  const isMinimized = useSelector(selectIsChatMinimized);

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
    </>
  );
}

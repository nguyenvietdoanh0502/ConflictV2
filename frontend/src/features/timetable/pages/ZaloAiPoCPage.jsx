import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  X,
  Sparkles
} from "lucide-react";
import CalendarView from "../components/CalendarView";
import TimetableSettingsModal from "../components/TimetableSettingsModal";
import { realtimeService } from "../../../services/realtime";
import { baseApi } from "../../../services/baseApi";

export default function ZaloAiPoCPage() {
  const dispatch = useDispatch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [realtimeNotification, setRealtimeNotification] = useState(null);
  const [isWsConnected, setIsWsConnected] = useState(realtimeService.isConnected());

  // Monitor WebSocket connection status
  useEffect(() => {
    const unsubStatus = realtimeService.onStatusChange((status) => {
      setIsWsConnected(status === "connected");
    });
    return unsubStatus;
  }, []);

  // Listen to real-time /user/queue/schedule events
  useEffect(() => {
    const unsubSchedule = realtimeService.onScheduleUpdate((notification) => {
      // Invalidate tags to automatically reload schedule events and mappings
      dispatch(baseApi.util.invalidateTags([{ type: "ScheduleEvent", id: "LIST" }]));
      dispatch(baseApi.util.invalidateTags([{ type: "ZaloMapping", id: "LIST" }]));

      setRealtimeNotification(notification);

      // Auto dismiss notification after 7 seconds
      const timer = setTimeout(() => {
        setRealtimeNotification(null);
      }, 7000);

      return () => clearTimeout(timer);
    });

    return unsubSchedule;
  }, [dispatch]);

  const handleSelectGroup = (groupId, groupName) => {
    setSelectedGroupId(groupId);
    setSelectedGroupName(groupName);
  };

  return (
    <div className="w-full max-w-[1750px] mx-auto p-4 sm:p-6 pt-6 sm:pt-8 space-y-4">
      {/* Main Timetable Box (Full Width) */}
      <div className="w-full">
        <CalendarView onOpenSettings={() => setIsSettingsOpen(true)} />
      </div>

      {/* Settings Modal (Whitelist Manager & Mock Simulator) */}
      <TimetableSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isWsConnected={isWsConnected}
        selectedGroupId={selectedGroupId}
        selectedGroupName={selectedGroupName}
        onSelectGroup={handleSelectGroup}
      />

      {/* Floating Real-time Toast (Non-intrusive bottom-right toast) */}
      {realtimeNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md p-4 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                Zalo AI vừa cập nhật lịch
              </p>
              <p className="text-xs font-semibold text-slate-100 truncate mt-0.5">
                {realtimeNotification.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setRealtimeNotification(null)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

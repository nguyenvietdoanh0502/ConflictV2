import { useState } from "react";
import { useSelector } from "react-redux";
import {
  X,
  ShieldCheck,
  Zap,
  Settings,
  QrCode,
} from "lucide-react";
import { selectCurrentUser } from "../../auth/authSelectors";
import WhitelistManager from "./WhitelistManager";
import MockZaloSimulator from "./MockZaloSimulator";
import ZaloConnectPanel from "./ZaloConnectPanel";

const MOCK_SIMULATOR_ALLOWED_EMAIL = "vietdoanh0502@gmail.com";

export default function TimetableSettingsModal({
  isOpen,
  onClose,
  selectedGroupId = "",
  selectedGroupName = "",
  onSelectGroup,
}) {
  const [activeTab, setActiveTab] = useState("connect");
  const currentUser = useSelector(selectCurrentUser);
  const canUseMockSimulator =
    currentUser?.email?.trim().toLowerCase() === MOCK_SIMULATOR_ALLOWED_EMAIL;

  if (!isOpen) return null;

  const effectiveTab =
    !canUseMockSimulator && activeTab === "simulator" ? "connect" : activeTab;

  const handleSelectGroupAndSwitch = (groupId, groupName) => {
    if (!canUseMockSimulator) return;
    if (onSelectGroup) {
      onSelectGroup(groupId, groupName);
    }
    setActiveTab("simulator");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card - Chiều cao cố định h-[86vh] để chống giật/nhảy vị trí khi đổi tab */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-6xl xl:max-w-7xl h-[86vh] min-h-[580px] max-h-[880px] flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header Bar - Cố định ở đỉnh, không bị xê dịch */}
        <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-[#F8F7FC] shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                  Trung tâm Cài đặt & Kết nối Zalo AI
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5 font-medium">
                Quét mã QR đồng bộ Zalo cá nhân, quản lý Whitelist môn học và tự động cập nhật lịch học thông minh
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition shrink-0 cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 sm:px-8 pt-3 pb-2 border-b border-slate-100 bg-white flex items-center gap-3 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("connect")}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-colors duration-150 shrink-0 cursor-pointer ${
              effectiveTab === "connect"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>1. Kết nối Zalo cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("whitelist")}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-colors duration-150 shrink-0 cursor-pointer ${
              effectiveTab === "whitelist"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>2. Nhóm Zalo Whitelist & Môn học</span>
          </button>

          {canUseMockSimulator && (
            <button
              type="button"
              onClick={() => setActiveTab("simulator")}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-colors duration-150 shrink-0 cursor-pointer ${
                effectiveTab === "simulator"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>3. Bắn tin nhắn giả lập (Simulator)</span>
              {selectedGroupName && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white truncate max-w-[120px]">
                  {selectedGroupName}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Content Body - Giữ các tab mount trong DOM (hidden thay vì unmount) + scrollbar-gutter stable để chống giật tuyệt đối */}
        <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] p-6 sm:p-8 bg-slate-50/50">
          <div className={effectiveTab === "connect" ? "w-full" : "hidden"}>
            <ZaloConnectPanel
              onNavigateToWhitelist={() => setActiveTab("whitelist")}
            />
          </div>

          <div className={effectiveTab === "whitelist" ? "w-full" : "hidden"}>
            <WhitelistManager
              onNavigateToConnect={() => setActiveTab("connect")}
              onSelectGroupForSimulator={
                canUseMockSimulator ? handleSelectGroupAndSwitch : undefined
              }
            />
          </div>

          {canUseMockSimulator && (
            <div className={effectiveTab === "simulator" ? "w-full" : "hidden"}>
              <MockZaloSimulator
                selectedGroupId={selectedGroupId}
                selectedGroupName={selectedGroupName}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

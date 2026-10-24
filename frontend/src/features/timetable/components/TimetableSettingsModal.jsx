import { useState } from "react";
import {
  X,
  ShieldCheck,
  Zap,
  Radio,
  Settings
} from "lucide-react";
import WhitelistManager from "./WhitelistManager";
import MockZaloSimulator from "./MockZaloSimulator";

export default function TimetableSettingsModal({
  isOpen,
  onClose,
  isWsConnected = false,
  selectedGroupId = "",
  selectedGroupName = "",
  onSelectGroup
}) {
  const [activeTab, setActiveTab] = useState("whitelist");

  if (!isOpen) return null;

  const handleSelectGroupAndSwitch = (groupId, groupName) => {
    if (onSelectGroup) {
      onSelectGroup(groupId, groupName);
    }
    setActiveTab("simulator");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-20 md:pt-24 pb-12 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 truncate">
                  Cài đặt & Giả lập Zalo AI
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isWsConnected
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  {isWsConnected ? "STOMP Online" : "STOMP Offline"}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Cấu hình nhóm Zalo được phép bóc tách và thử nghiệm kịch bản tin nhắn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-2xl transition shrink-0"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-1 border-b border-slate-100 bg-white flex items-center gap-2">
          <button
            onClick={() => setActiveTab("whitelist")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition ${
              activeTab === "whitelist"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. Nhóm Zalo Whitelist & Môn học</span>
          </button>

          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition ${
              activeTab === "simulator"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>2. Bắn tin nhắn giả lập (Simulator)</span>
            {selectedGroupName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white truncate max-w-[120px]">
                {selectedGroupName}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          {activeTab === "whitelist" ? (
            <div className="max-w-3xl mx-auto">
              <WhitelistManager onSelectGroupForSimulator={handleSelectGroupAndSwitch} />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
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

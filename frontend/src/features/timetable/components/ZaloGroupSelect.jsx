import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  ChevronDown,
  CheckCircle2,
  Users,
  RefreshCw,
  X,
  MessageSquare,
  Sparkles,
  ArrowDownAZ,
  ExternalLink,
  Plus
} from "lucide-react";
import {
  sortZaloGroupsAlphabetically,
  filterZaloGroups,
  groupZaloGroupsByLetter,
  DEFAULT_MOCK_GROUPS
} from "../constants/zaloConstants";

/**
 * ZaloGroupSelect - Dropdown chọn nhóm Zalo cao cấp dành cho liên kết Môn học
 * - Font chữ Plus Jakarta Sans to, rõ ràng, đồng nhất trang web
 * - Tự động sắp xếp các nhóm theo bảng chữ cái tiếng Việt (A -> Z)
 * - Thanh tìm kiếm thông minh hỗ trợ gõ không dấu (ví dụ: "lap trinh" -> "Lập trình Web")
 * - Phân nhóm theo chữ cái đầu (A, C, Đ, G, K, L, M...)
 * - Hiển thị số lượng thành viên, mã nhóm, avatar gradient hoặc ảnh Zalo
 */
export default function ZaloGroupSelect({
  groups = [],
  value = "",
  onChange,
  onRefresh,
  isRefreshing = false,
  onNavigateToConnect,
  placeholder = "-- Bấm để chọn nhóm Zalo liên kết --",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // If no groups provided from backend, fallback to default mock groups
  const effectiveGroups = useMemo(() => {
    return groups && groups.length > 0 ? groups : DEFAULT_MOCK_GROUPS;
  }, [groups]);

  // Sắp xếp theo bảng chữ cái tiếng Việt
  const sortedGroups = useMemo(() => {
    return sortZaloGroupsAlphabetically(effectiveGroups);
  }, [effectiveGroups]);

  // Lọc theo từ khóa tìm kiếm (hỗ trợ tiếng Việt không dấu)
  const filteredGroups = useMemo(() => {
    return filterZaloGroups(sortedGroups, searchQuery);
  }, [sortedGroups, searchQuery]);

  // Nhóm theo chữ cái đầu tiên khi không tìm kiếm
  const letterSections = useMemo(() => {
    if (searchQuery.trim()) return null; // When searching, show flat list for clarity
    return groupZaloGroupsByLetter(sortedGroups);
  }, [sortedGroups, searchQuery]);

  // Tìm thông tin nhóm đang được chọn
  const selectedGroup = useMemo(() => {
    if (!value) return null;
    return effectiveGroups.find((g) => (g.id || g.zaloGroupId) === value) || null;
  }, [value, effectiveGroups]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredGroups.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredGroups.length - 1
      );
    } else if (e.key === "Enter" && filteredGroups.length > 0) {
      e.preventDefault();
      const chosen = filteredGroups[highlightedIndex];
      if (chosen) {
        handleSelect(chosen);
      }
    }
  };

  const handleSelect = (group) => {
    if (onChange) {
      onChange(group);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClearSelection = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange(null);
    }
  };

  // Helper to get initials / avatar badge
  const renderGroupAvatar = (group) => {
    const name = group?.name || group?.zaloGroupName || "Z";
    const initial = name.trim().charAt(0).toUpperCase();

    if (group?.avatar) {
      return (
        <img
          src={group.avatar}
          alt={name}
          className="w-10 h-10 rounded-2xl object-cover shrink-0 border border-slate-200/90 shadow-sm"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      );
    }

    // Gradient based on initial letter
    return (
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 ring-2 ring-white">
        {initial}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full font-sans select-none" onKeyDown={handleKeyDown}>
      {/* Nút bấm kích hoạt Dropdown (Trigger Button) - To, Rõ, Sang Trọng */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[56px] px-4 py-2.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 bg-white text-left ${
          disabled
            ? "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
            : isOpen
            ? "border-indigo-600 ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-500/5 bg-white"
            : selectedGroup
            ? "border-indigo-300 hover:border-indigo-400 bg-indigo-50/20 shadow-sm hover:shadow"
            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 shadow-sm hover:shadow"
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {selectedGroup ? (
            <>
              {renderGroupAvatar(selectedGroup)}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                    {selectedGroup.name}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đã chọn
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium truncate">
                  <span className="font-mono text-[11px] text-slate-400">
                    ID: {selectedGroup.id}
                  </span>
                  {selectedGroup.memberCount !== undefined && (
                    <span className="text-slate-400">•</span>
                  )}
                  {selectedGroup.memberCount !== undefined && (
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                      <Users className="w-3 h-3 text-slate-400" />
                      {selectedGroup.memberCount} thành viên
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm sm:text-base font-bold text-slate-500 block truncate">
                  {placeholder}
                </span>
                <span className="text-xs text-slate-400 font-medium block mt-0.5">
                  Sắp xếp A-Z • {effectiveGroups.length} nhóm Zalo khả dụng
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action icons on right */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedGroup && !disabled && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="Bỏ chọn nhóm Zalo này"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform duration-200 ${
              isOpen
                ? "bg-indigo-600 text-white rotate-180 shadow-md shadow-indigo-200"
                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Floating Dropdown Menu Panel (Popover) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2.5 z-50 bg-white/98 backdrop-blur-2xl rounded-3xl border border-slate-200/95 shadow-2xl shadow-indigo-950/20 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ring-1 ring-slate-900/10">
          
          {/* Header Panel: Tìm kiếm & Trạng thái Sắp xếp A-Z */}
          <div className="p-3.5 bg-gradient-to-b from-[#F8F7FC] to-white border-b border-slate-100 space-y-2.5">
            {/* Input tìm kiếm to rõ */}
            <div className="relative">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên nhóm hoặc mã ID (gõ không dấu)..."
                className="w-full text-xs sm:text-sm font-semibold pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-inner text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Thanh thông tin & Sắp xếp theo bảng chữ cái */}
            <div className="flex items-center justify-between gap-2 px-1 text-xs">
              <div className="flex items-center gap-1.5 font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/70">
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span className="uppercase text-[10px] tracking-wider">
                  Sắp xếp A-Z theo bảng chữ cái
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-600 text-xs">
                  {filteredGroups.length} / {effectiveGroups.length} nhóm
                </span>

                {onRefresh && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefresh();
                    }}
                    disabled={isRefreshing}
                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    title="Làm mới danh sách nhóm từ Zalo"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isRefreshing ? "animate-spin text-indigo-600" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Danh sách các nhóm Zalo - Cuộn mượt với Typography to rõ */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-80 sm:max-h-96 overflow-y-auto p-2.5 space-y-1 divide-y divide-slate-100 [scrollbar-gutter:stable]"
          >
            {filteredGroups.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <p className="text-sm font-extrabold text-slate-700">
                  Không tìm thấy nhóm Zalo nào khớp
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto font-medium">
                  Không có kết quả cho "{searchQuery}". Thử tìm với từ khóa khác hoặc bấm nút làm mới.
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Xóa bộ lọc</span>
                  </button>
                )}
              </div>
            ) : letterSections ? (
              // Khi KHÔNG tìm kiếm: Hiển thị phân đoạn theo chữ cái (A, C, Đ, G, K, L, M, T...)
              letterSections.map(([letter, sectionGroups]) => (
                <div key={letter} className="pt-2 first:pt-0">
                  {/* Chữ cái đầu mục A-Z nổi bật */}
                  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-3 py-1 mb-1.5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                      {letter}
                    </span>
                    <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wider">
                      Mục chữ {letter} ({sectionGroups.length} nhóm)
                    </span>
                    <div className="flex-1 h-px bg-indigo-100" />
                  </div>

                  {/* Danh sách nhóm trong mục chữ này */}
                  <div className="space-y-1">
                    {sectionGroups.map((group) => {
                      const isSelected = (group.id || group.zaloGroupId) === value;
                      return (
                        <div
                          key={group.id}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(group)}
                          className={`w-full p-3 rounded-2xl flex items-center justify-between gap-3 text-left transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50 border-2 border-indigo-400 shadow-sm"
                              : "hover:bg-indigo-50/60 border-2 border-transparent hover:border-indigo-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {renderGroupAvatar(group)}
                            <div className="min-w-0 flex-1">
                              <h5 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-indigo-950 truncate leading-snug">
                                {group.name}
                              </h5>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                                <span className="font-mono text-[11px] text-slate-400">
                                  ID: {group.id}
                                </span>
                                {group.memberCount !== undefined && (
                                  <span className="text-slate-300">•</span>
                                )}
                                {group.memberCount !== undefined && (
                                  <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                                    <Users className="w-3 h-3 text-slate-400" />
                                    {group.memberCount} thành viên
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="flex items-center gap-1 text-emerald-600 shrink-0">
                              <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition shrink-0">
                              Chọn
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              // Khi ĐANG tìm kiếm: Hiển thị danh sách kết quả trực tiếp đã lọc
              <div className="space-y-1">
                {filteredGroups.map((group, idx) => {
                  const isSelected = (group.id || group.zaloGroupId) === value;
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <div
                      key={group.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(group)}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between gap-3 text-left transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 border-2 border-indigo-400 shadow-sm"
                          : isHighlighted
                          ? "bg-indigo-50/70 border-2 border-indigo-200"
                          : "hover:bg-indigo-50/60 border-2 border-transparent hover:border-indigo-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {renderGroupAvatar(group)}
                        <div className="min-w-0 flex-1">
                          <h5 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-indigo-950 truncate leading-snug">
                            {group.name}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                            <span className="font-mono text-[11px] text-slate-400">
                              ID: {group.id}
                            </span>
                            {group.memberCount !== undefined && (
                              <span className="text-slate-300">•</span>
                            )}
                            {group.memberCount !== undefined && (
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                                <Users className="w-3 h-3 text-slate-400" />
                                {group.memberCount} thành viên
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="flex items-center gap-1 text-emerald-600 shrink-0">
                          <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition shrink-0">
                          Chọn
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Panel: Hướng dẫn & Nút Quét mã QR nếu chưa có nhóm mong muốn */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500">
            <span className="font-medium text-slate-600">
              💡 Không thấy nhóm lớp học của bạn?
            </span>
            {onNavigateToConnect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onNavigateToConnect();
                }}
                className="inline-flex items-center gap-1.5 font-black text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-indigo-200 transition cursor-pointer self-start sm:self-auto shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quét mã QR để đồng bộ thêm nhóm</span>
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

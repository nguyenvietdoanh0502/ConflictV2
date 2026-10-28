import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import {
  sortZaloGroupsAlphabetically,
  filterZaloGroups,
  DEFAULT_MOCK_GROUPS,
} from "../constants/zaloConstants";

/**
 * ZaloGroupSelect - Dropdown chọn nhóm Zalo đơn giản, nền trắng, chữ to rõ ràng
 * - Nền màu trắng thuần túy (bg-white)
 * - Sắp xếp các nhóm theo bảng chữ cái A-Z
 * - Thanh tìm kiếm thông minh hỗ trợ gõ không dấu
 * - Không có avatar, không có tiêu đề mục chữ cái
 */
export default function ZaloGroupSelect({
  groups = [],
  value = "",
  onChange,
  placeholder = "-- Bấm vào đây để chọn nhóm Zalo --",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Danh sách nhóm khả dụng (dùng mock fallback nếu chưa có dữ liệu)
  const effectiveGroups = useMemo(() => {
    return groups && groups.length > 0 ? groups : DEFAULT_MOCK_GROUPS;
  }, [groups]);

  // Sắp xếp các nhóm theo bảng chữ cái tiếng Việt A-Z
  const sortedGroups = useMemo(() => {
    return sortZaloGroupsAlphabetically(effectiveGroups);
  }, [effectiveGroups]);

  // Lọc theo từ khóa tìm kiếm (hỗ trợ tiếng Việt không dấu)
  const filteredGroups = useMemo(() => {
    return filterZaloGroups(sortedGroups, searchQuery);
  }, [sortedGroups, searchQuery]);

  // Nhóm đang được chọn
  const selectedGroup = useMemo(() => {
    if (!value) return null;
    return effectiveGroups.find((g) => (g.id || g.zaloGroupId) === value) || null;
  }, [value, effectiveGroups]);

  // Click outside để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tự động focus ô tìm kiếm khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (group) => {
    if (onChange) {
      onChange(group);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange(null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full font-sans select-none">
      {/* Trigger Button - Nền màu trắng, to, rõ ràng */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 bg-white text-left ${
          disabled
            ? "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
            : isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-white"
            : "border-slate-200 hover:border-slate-300 bg-white shadow-sm"
        }`}
      >
        <div className="min-w-0 flex-1">
          {selectedGroup ? (
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {selectedGroup.name}
              </span>
              {selectedGroup.memberCount !== undefined && (
                <span className="text-xs text-slate-400 font-medium shrink-0">
                  ({selectedGroup.memberCount} thành viên)
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm sm:text-base font-medium text-slate-400 truncate block">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedGroup && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-600 rounded-lg transition cursor-pointer"
              title="Bỏ chọn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-150 ${
              isOpen ? "rotate-180 text-emerald-600" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown Panel - Nền màu trắng thuần túy, phẳng, đơn giản */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          {/* Phần tìm kiếm */}
          <div className="p-2.5 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nhóm Zalo..."
                className="w-full text-sm font-medium pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Danh sách các nhóm - Phẳng, không tiêu đề mục chữ cái, không avatar, đơn giản & to rõ */}
          <div className="max-h-64 sm:max-h-72 overflow-y-auto p-1.5 space-y-0.5 bg-white">
            {filteredGroups.length === 0 ? (
              <div className="py-6 text-center text-xs sm:text-sm text-slate-400">
                Không tìm thấy nhóm Zalo nào phù hợp
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isSelected = (group.id || group.zaloGroupId) === value;
                return (
                  <div
                    key={group.id}
                    onClick={() => handleSelect(group)}
                    className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-900 font-bold"
                        : "hover:bg-slate-50 text-slate-800 font-medium"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm sm:text-base truncate font-semibold">
                        {group.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate flex items-center gap-2">
                        <span className="font-mono">ID: {group.id}</span>
                        {group.memberCount !== undefined && (
                          <span>• {group.memberCount} thành viên</span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}
    </div>
  );
}

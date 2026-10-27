import React, { useState } from "react";
import { useGetLeaderboardQuery } from "../services/studyApi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../auth/authSelectors";

export default function LeaderboardModal({ isOpen, onClose, material }) {
  const currentUser = useSelector(selectCurrentUser);
  const [gameType, setGameType] = useState("SPEED_QUIZ");

  const { data: leaderboard = [], isLoading } = useGetLeaderboardQuery(
    { materialId: material?.id, gameType },
    { skip: !isOpen || !material?.id }
  );

  if (!isOpen || !material) return null;

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const rest = leaderboard.slice(3);

  const formatTime = (totalSec) => {
    if (!totalSec && totalSec !== 0) return "--:--";
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-[#E5E2EC] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E2EC]">
          <div>
            <h3 className="text-lg font-black text-[#2F2A45]">Bảng Vàng Thành Tích</h3>
            <p className="text-xs text-[#77718C] truncate max-w-[280px]">
              {material.title} ({material.subjectName})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#77718C] hover:bg-[#F0EEF8] hover:text-[#2F2A45] text-xs font-bold"
          >
            Đóng
          </button>
        </div>

        {/* Tab switch giữa 2 game */}
        <div className="mt-4 flex rounded-2xl bg-[#F0EEF8] p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setGameType("SPEED_QUIZ")}
            className={`flex-1 rounded-xl py-2 transition-all ${
              gameType === "SPEED_QUIZ"
                ? "bg-white text-social-violet shadow-sm font-extrabold"
                : "text-[#77718C] hover:text-[#2F2A45]"
            }`}
          >
            Đấu Trường Trắc Nghiệm
          </button>

          <button
            type="button"
            onClick={() => setGameType("MEMORY_MATCH")}
            className={`flex-1 rounded-xl py-2 transition-all ${
              gameType === "MEMORY_MATCH"
                ? "bg-white text-social-violet shadow-sm font-extrabold"
                : "text-[#77718C] hover:text-[#2F2A45]"
            }`}
          >
            Lật Thẻ Ghép Cặp
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#77718C] animate-pulse">
            Đang tải dữ liệu bảng xếp hạng...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-12 text-center text-[#77718C]">
            <p className="text-sm font-bold text-[#2F2A45]">Chưa có lượt chơi nào!</p>
            <p className="text-xs mt-1">Hãy là người đầu tiên chinh phục Minigame và ghi tên lên bảng vàng!</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Bục Podium vinh danh Top 3 */}
            <div className="flex items-end justify-center gap-2 sm:gap-4 pt-4">
              {/* Top 2: Bạc */}
              <div className="flex flex-col items-center">
                {top2 ? (
                  <>
                    <div className="h-12 w-12 rounded-full ring-2 ring-slate-300 bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm overflow-hidden mb-1">
                      {top2.avatarUrl ? <img src={top2.avatarUrl} alt="" className="h-full w-full object-cover" /> : top2.fullName?.charAt(0) || "2"}
                    </div>
                    <p className="text-[11px] font-bold text-[#2F2A45] max-w-[80px] truncate text-center">{top2.fullName}</p>
                    <p className="text-xs font-black text-amber-600">{top2.score}đ</p>
                    <div className="mt-1 h-14 w-20 rounded-t-2xl bg-slate-200/80 flex items-center justify-center font-black text-slate-500 text-sm shadow-sm">
                      #2
                    </div>
                  </>
                ) : (
                  <div className="h-14 w-20 rounded-t-2xl bg-slate-100" />
                )}
              </div>

              {/* Top 1: Vàng */}
              <div className="flex flex-col items-center">
                {top1 ? (
                  <>
                    <div className="h-16 w-16 rounded-full ring-4 ring-amber-400 bg-amber-50 flex items-center justify-center font-extrabold text-amber-700 text-base overflow-hidden mb-1">
                      {top1.avatarUrl ? <img src={top1.avatarUrl} alt="" className="h-full w-full object-cover" /> : top1.fullName?.charAt(0) || "1"}
                    </div>
                    <p className="text-xs font-extrabold text-[#2F2A45] max-w-[90px] truncate text-center">{top1.fullName}</p>
                    <p className="text-sm font-black text-amber-600">{top1.score}đ</p>
                    <div className="mt-1 h-20 w-24 rounded-t-2xl bg-amber-200/80 flex items-center justify-center font-black text-amber-700 text-base shadow-sm">
                      #1
                    </div>
                  </>
                ) : null}
              </div>

              {/* Top 3: Đồng */}
              <div className="flex flex-col items-center">
                {top3 ? (
                  <>
                    <div className="h-12 w-12 rounded-full ring-2 ring-amber-600 bg-amber-100 flex items-center justify-center font-bold text-amber-800 text-sm overflow-hidden mb-1">
                      {top3.avatarUrl ? <img src={top3.avatarUrl} alt="" className="h-full w-full object-cover" /> : top3.fullName?.charAt(0) || "3"}
                    </div>
                    <p className="text-[11px] font-bold text-[#2F2A45] max-w-[80px] truncate text-center">{top3.fullName}</p>
                    <p className="text-xs font-black text-amber-600">{top3.score}đ</p>
                    <div className="mt-1 h-10 w-20 rounded-t-2xl bg-amber-100/80 flex items-center justify-center font-black text-amber-700 text-xs shadow-sm">
                      #3
                    </div>
                  </>
                ) : (
                  <div className="h-10 w-20 rounded-t-2xl bg-amber-50" />
                )}
              </div>
            </div>

            {/* Danh sách các vị trí tiếp theo */}
            {rest.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {rest.map((entry) => {
                  const isMe = currentUser?.id === entry.userId;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold ${
                        isMe ? "bg-social-violet/10 border border-social-violet/30" : "bg-[#FAF9FD]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center font-bold text-[#77718C]">#{entry.rank}</span>
                        <div className="h-7 w-7 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-[10px] font-bold">
                          {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" /> : entry.fullName?.charAt(0)}
                        </div>
                        <span className="font-bold text-[#2F2A45] truncate max-w-[150px]">
                          {entry.fullName} {isMe && <span className="text-social-violet">(Bạn)</span>}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[#77718C] text-[11px]">
                          {formatTime(entry.timeTakenSeconds)}
                        </span>
                        <span className="font-black text-amber-600 min-w-[50px] text-right">
                          {entry.score}đ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end pt-3 border-t border-[#E5E2EC]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-social-violet px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#6E60DC]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

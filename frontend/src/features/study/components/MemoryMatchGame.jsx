import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useSubmitGameScoreMutation } from "../services/studyApi";
import MathText from "./MathText";

function buildShuffledCards(pairs) {
  if (!pairs || pairs.length === 0) return [];
  const activePairs = pairs.slice(0, 8);
  const cleanCardText = (str) => (str || "").trim().replace(/^\d+\.\s*/, "");

  const cardList = [];
  activePairs.forEach((pair) => {
    cardList.push({
      id: `term-${pair.pair_id}`,
      pairId: pair.pair_id,
      type: "TERM",
      text: cleanCardText(pair.term),
    });
    cardList.push({
      id: `def-${pair.pair_id}`,
      pairId: pair.pair_id,
      type: "DEF",
      text: cleanCardText(pair.definition),
    });
  });

  for (let i = cardList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardList[i], cardList[j]] = [cardList[j], cardList[i]];
  }
  return cardList;
}

export default function MemoryMatchGame({
  material,
  onBack,
  onOpenLeaderboard,
  onSwitchToQuiz,
  onOpenChallenge,
}) {
  const [submitScore] = useSubmitGameScoreMutation();

  const pairs = material?.memoryMatchData || [];
  const hasPairs = pairs.length > 0;

  // Tạo danh sách thẻ bài đã xáo trộn
  const [cards, setCards] = useState(() => buildShuffledCards(pairs));
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairIds, setMatchedPairIds] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  // Bộ đếm thời gian
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!hasPairs || isFinished) return;
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [hasPairs, isFinished]);

  // Khởi tạo lại thẻ bài khi bấm Chơi lại
  const initializeGame = () => {
    if (!pairs || pairs.length === 0) return;
    clearInterval(timerRef.current);
    setCards(buildShuffledCards(pairs));
    setFlippedIndices([]);
    setMatchedPairIds(new Set());
    setMoves(0);
    setSeconds(0);
    setIsFinished(false);
    setScore(0);
  };

  // Xử lý khi click vào 1 thẻ bài
  const handleCardClick = (index) => {
    if (flippedIndices.length >= 2) return;
    if (flippedIndices.includes(index)) return;
    if (matchedPairIds.has(cards[index].pairId)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.pairId === secondCard.pairId && firstCard.type !== secondCard.type) {
        setTimeout(() => {
          setMatchedPairIds((prev) => {
            const updated = new Set(prev);
            updated.add(firstCard.pairId);

            const totalPairs = cards.length / 2;
            if (updated.size === totalPairs) {
              handleGameWin();
            }
            return updated;
          });
          setFlippedIndices([]);
        }, 500);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1100);
      }
    }
  };

  // Hoàn thành toàn bộ ma trận thẻ bài
  const handleGameWin = () => {
    clearInterval(timerRef.current);
    setIsFinished(true);

    const calculatedScore = Math.max(150, 1000 - seconds * 8 - moves * 12);
    setScore(calculatedScore);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignored
    }

    submitScore({
      materialId: material.id,
      gameType: "MEMORY_MATCH",
      score: calculatedScore,
      timeTakenSeconds: seconds,
      accuracyRate: Math.round(((cards.length / 2) / Math.max(1, moves)) * 1000) / 10,
    }).catch((err) => {
      console.warn("Failed to auto-submit score:", err);
    });
  };

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!pairs || pairs.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#E5E2EC] bg-white p-12 text-center">
        <p className="text-base font-bold text-[#2F2A45]">Chưa có dữ liệu cặp thẻ bài ôn tập.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-xl bg-social-violet px-4 py-2 text-xs font-bold text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC]"
        >
          Trở về
        </button>
      </div>
    );
  }

  // Màn hình Chiến thắng khi lật hết các cặp
  if (isFinished) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-[#E5E2EC] bg-white p-8 text-center shadow-xl animate-in fade-in zoom-in-95 duration-300">
        <span className="font-mono text-xs uppercase tracking-widest text-[#77718C] block mb-1">
          KẾT QUẢ ÔN TẬP
        </span>
        <h2 className="text-2xl font-black text-[#2F2A45]">Xuất Sắc! Ghép Thành Công!</h2>
        <p className="text-xs text-[#77718C] mt-1">
          Bạn đã ghi nhớ hoàn tất tất cả cặp thuật ngữ của: <strong>{material.title}</strong>
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#FAF9FD] p-4 border border-[#F0EEF8]">
            <p className="text-xs font-bold text-[#77718C]">Thời Gian</p>
            <p className="text-2xl font-black text-social-violet mt-1">{formatTime(seconds)}</p>
          </div>

          <div className="rounded-2xl bg-[#FAF9FD] p-4 border border-[#F0EEF8]">
            <p className="text-xs font-bold text-[#77718C]">Số Lượt Lật</p>
            <p className="text-2xl font-black text-amber-500 mt-1">{moves}</p>
          </div>

          <div className="rounded-2xl bg-[#FAF9FD] p-4 border border-[#F0EEF8]">
            <p className="text-xs font-bold text-[#77718C]">Điểm Đạt Được</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{score}</p>
          </div>
        </div>

        {/* Nút Thách đấu bạn bè */}
        {onOpenChallenge && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() =>
                onOpenChallenge(material, {
                  defaultMode: "CHALLENGE_GAME",
                  defaultGameType: "MEMORY_MATCH",
                  challengerScore: score,
                  challengerTimeSeconds: seconds,
                })
              }
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 transition-all hover:scale-[1.01]"
            >
              Thách đấu bạn bè vượt mốc {score} điểm ({seconds}s)!
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={initializeGame}
            className="w-full sm:w-auto rounded-2xl border border-[#E5E2EC] bg-white px-6 py-3 text-xs font-bold text-[#4F4965] hover:bg-[#F0EEF8] transition-colors"
          >
            Chơi lại
          </button>

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="w-full sm:w-auto rounded-2xl bg-amber-500 px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-amber-500/25 hover:bg-amber-600 transition-all hover:scale-105"
          >
            Bảng Xếp Hạng
          </button>

          <button
            type="button"
            onClick={onSwitchToQuiz}
            className="w-full sm:w-auto rounded-2xl bg-social-violet px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] transition-all hover:scale-105"
          >
            Đổi sang Trắc Nghiệm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header trạng thái */}
      <div className="flex items-center justify-between rounded-3xl bg-white p-4 sm:p-5 border border-[#E5E2EC] shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-bold text-[#77718C] hover:text-social-violet"
        >
          ← Dừng chơi
        </button>

        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          {onOpenChallenge && (
            <button
              type="button"
              onClick={() =>
                onOpenChallenge(material, {
                  defaultMode: "CHALLENGE_GAME",
                  defaultGameType: "MEMORY_MATCH",
                })
              }
              className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              ⚔️ Thách đấu
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-extrabold text-[#2F2A45]">
            <span>Thời gian:</span>
            <span className="font-mono text-social-violet rounded-xl bg-[#F0EEF8] px-2.5 py-1">
              {formatTime(seconds)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-extrabold text-[#2F2A45]">
            <span>Lượt lật:</span>
            <span className="rounded-xl bg-amber-50 px-2.5 py-1 text-amber-600 border border-amber-200">
              {moves}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600">
            <span>Đã ghép:</span>
            <span>{matchedPairIds.size} / {cards.length / 2}</span>
          </div>
        </div>
      </div>

      {/* Ma trận thẻ bài (Grid 2/3/4 cột) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 perspective-1000">
        {cards.map((card, idx) => {
          const isFlipped = flippedIndices.includes(idx);
          const isMatched = matchedPairIds.has(card.pairId);
          const isOpen = isFlipped || isMatched;

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className="h-36 sm:h-40 cursor-pointer select-none transition-transform duration-300 hover:scale-[1.02]"
              style={{ perspective: "1000px" }}
            >
              <div
                className="relative h-full w-full rounded-2xl transition-transform duration-500 shadow-sm"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isOpen ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Mặt úp (Mặt sau của thẻ - hiển thị logo UniSync kèm icon 🎓) */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-social-violet/40 bg-social-violet text-white shadow-md p-4"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <span className="text-3xl opacity-80">🎓</span>
                  <span className="mt-1 text-[11px] font-black uppercase tracking-widest text-white/70">
                    UniSync
                  </span>
                </div>

                {/* Mặt ngửa (Nội dung Thuật ngữ hoặc Định nghĩa kèm icon check khi đã ghép) */}
                <div
                  className={`absolute inset-0 flex flex-col justify-between rounded-2xl border-2 p-3.5 text-center shadow-lg transition-all ${
                    isMatched
                      ? "border-emerald-500 bg-emerald-50/90 text-emerald-900 ring-2 ring-emerald-500/20"
                      : card.type === "TERM"
                      ? "border-social-violet bg-white text-[#2F2A45] shadow-social-violet/10"
                      : "border-teal-500 bg-white text-[#2F2A45] shadow-teal-500/10"
                  }`}
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                        card.type === "TERM"
                          ? "bg-social-violet/15 text-social-violet"
                          : "bg-teal-100 text-teal-700"
                      }`}
                    >
                      {card.type === "TERM" ? "Thuật ngữ" : "Định nghĩa"}
                    </span>
                    {isMatched && <span className="text-xs text-emerald-600 font-bold">✓</span>}
                  </div>

                  <MathText
                    text={card.text}
                    as="div"
                    className="my-auto text-xs sm:text-sm font-extrabold line-clamp-4 leading-snug"
                  />

                  <div className="text-[10px] text-[#A5A0B8]">
                    {isMatched ? "Đã ghép đôi" : "Nhấp thẻ đối ứng"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

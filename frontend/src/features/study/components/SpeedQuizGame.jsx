import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useSubmitGameScoreMutation } from "../services/studyApi";
import MathText from "./MathText";

const QUESTION_TIME_LIMIT = 15; // 15s / câu

export default function SpeedQuizGame({
  material,
  onBack,
  onOpenLeaderboard,
  onSwitchToMemoryMatch,
}) {
  const [submitScore] = useSubmitGameScoreMutation();

  const questions = material?.quizData || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);

  // Điểm số & thống kê
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);

  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const currentQ = questions[currentIndex];

  // Khởi động lại game
  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(QUESTION_TIME_LIMIT);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setIsFinished(false);
    setTotalTimeTaken(0);
    startTimeRef.current = Date.now();
  };

  // Đếm ngược 15s cho từng câu
  useEffect(() => {
    if (isFinished || isAnswered || !currentQ) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, isAnswered, isFinished]);

  // Hết giờ mà chưa chọn
  const handleTimeOut = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(-1);
    setStreak(0);
  };

  // Người dùng click chọn đáp án
  const handleSelectOption = (idx) => {
    if (isAnswered) return;
    clearInterval(timerRef.current);
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correct_index;
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      setCorrectCount((prev) => prev + 1);

      // Điểm: 100 điểm gốc + (giây còn lại * 15) + (streak * 25)
      const earned = 100 + timeLeft * 15 + newStreak * 25;
      setScore((prev) => prev + earned);
    } else {
      setStreak(0);
    }
  };

  // Sang câu hỏi tiếp theo
  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(QUESTION_TIME_LIMIT);
    } else {
      handleFinishGame();
    }
  };

  // Kết thúc game
  const handleFinishGame = () => {
    setIsFinished(true);
    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    setTotalTimeTaken(durationSec);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignored
    }

    const accuracy = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
    submitScore({
      materialId: material.id,
      gameType: "SPEED_QUIZ",
      score: score,
      timeTakenSeconds: durationSec,
      accuracyRate: Math.round(accuracy * 10) / 10,
    }).catch((err) => {
      console.warn("Failed to auto-submit score:", err);
    });
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#E5E2EC] bg-white p-12 text-center">
        <p className="text-base font-bold text-[#2F2A45]">Chưa có dữ liệu câu hỏi trắc nghiệm.</p>
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

  // Màn hình tổng kết khi hoàn thành
  if (isFinished) {
    const accuracy = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-[#E5E2EC] bg-white p-8 text-center shadow-xl animate-in fade-in zoom-in-95 duration-300">
        <span className="font-mono text-xs uppercase tracking-widest text-[#77718C] block mb-1">
          KẾT QUẢ ÔN TẬP
        </span>
        <h2 className="text-2xl font-black text-[#2F2A45]">Hoàn Thành Đấu Trường!</h2>
        <p className="text-xs text-[#77718C] mt-1">
          Bạn đã hoàn thành bộ câu hỏi ôn tập: <strong>{material.title}</strong>
        </p>

        {/* Bảng kết quả thống kê */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#FAF9FD] p-4 border border-[#F0EEF8]">
            <p className="text-xs font-bold text-[#77718C]">Tổng Điểm</p>
            <p className="text-2xl font-black text-amber-500 mt-1">{score}</p>
          </div>

          <div className="rounded-2xl bg-[#FAF9FD] p-4 border border-[#F0EEF8]">
            <p className="text-xs font-bold text-[#77718C]">Chính Xác</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {correctCount}/{questions.length} <span className="text-xs font-normal">({accuracy}%)</span>
            </p>
          </div>

          <div className="rounded-2xl bg-[#FAF9FD] p-4 border border-[#F0EEF8]">
            <p className="text-xs font-bold text-[#77718C]">Max Streak</p>
            <p className="text-2xl font-black text-social-violet mt-1">
              x{maxStreak}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRestart}
            className="w-full sm:w-auto rounded-2xl border border-[#E5E2EC] bg-white px-6 py-3 text-xs font-bold text-[#4F4965] hover:bg-[#F0EEF8] transition-colors"
          >
            Chơi lại
          </button>

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="w-full sm:w-auto rounded-2xl bg-amber-500 px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-amber-500/25 hover:bg-amber-600 transition-all hover:scale-105"
          >
            Xem Bảng Xếp Hạng
          </button>

          <button
            type="button"
            onClick={onSwitchToMemoryMatch}
            className="w-full sm:w-auto rounded-2xl bg-social-violet px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] transition-all hover:scale-105"
          >
            Đổi sang Lật Thẻ
          </button>
        </div>
      </div>
    );
  }

  // Tính tỷ lệ thanh đếm ngược
  const timerPercent = (timeLeft / QUESTION_TIME_LIMIT) * 100;
  const isTimeCritical = timeLeft <= 5;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Thanh Header trận đấu */}
      <div className="flex items-center justify-between rounded-3xl bg-white p-4 sm:p-5 border border-[#E5E2EC] shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-bold text-[#77718C] hover:text-social-violet"
        >
          Dừng chơi
        </button>

        <div className="flex items-center gap-4">
          {streak > 1 && (
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-600 animate-bounce">
              Streak x{streak}!
            </span>
          )}

          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#2F2A45]">
            <span>Điểm:</span>
            <span className="rounded-xl bg-amber-50 px-2.5 py-1 text-amber-600 border border-amber-200">
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Card Câu hỏi & Đồng hồ đếm ngược */}
      <div className="rounded-3xl border border-[#E5E2EC] bg-white p-6 sm:p-8 shadow-sm">
        {/* Thanh đếm ngược thời gian */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#77718C]">
              Câu {currentIndex + 1} / {questions.length}
            </span>
            <span className={`font-mono text-sm ${isTimeCritical ? "text-rose-600 animate-pulse font-black" : "text-social-violet"}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0EEF8]">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                isTimeCritical ? "bg-rose-500" : timeLeft <= 8 ? "bg-amber-500" : "bg-social-violet"
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>

        {/* Nội dung câu hỏi */}
        <MathText
          text={currentQ.question}
          as="h2"
          className="text-lg sm:text-xl font-black text-[#2F2A45] leading-snug"
        />

        {/* 4 Phương án lựa chọn */}
        <div className="mt-6 grid grid-cols-1 gap-3">
          {currentQ.options.map((opt, oIdx) => {
            const isSelected = selectedOption === oIdx;
            const isCorrectAnswer = oIdx === currentQ.correct_index;

            let buttonStyle = "border-[#E5E2EC] bg-[#FAF9FD] text-[#4F4965] hover:bg-[#F0EEF8] hover:border-social-violet/40";

            if (isAnswered) {
              if (isCorrectAnswer) {
                buttonStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-extrabold shadow-sm ring-2 ring-emerald-500/20";
              } else if (isSelected) {
                buttonStyle = "border-rose-500 bg-rose-50 text-rose-800 font-bold ring-2 ring-rose-500/20 animate-shake";
              } else {
                buttonStyle = "border-[#E5E2EC] bg-white text-[#A5A0B8] opacity-60";
              }
            }

            const optionLetters = ["A", "B", "C", "D"];

            return (
              <button
                key={oIdx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(oIdx)}
                className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left text-sm font-semibold transition-all ${buttonStyle}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                    isAnswered && isCorrectAnswer
                      ? "bg-emerald-500 text-white"
                      : isAnswered && isSelected
                      ? "bg-rose-500 text-white"
                      : "bg-white text-[#77718C] shadow-sm border border-[#E5E2EC]"
                  }`}
                >
                  {optionLetters[oIdx]}
                </span>
                <MathText text={opt} as="span" className="flex-1 leading-snug" />
              </button>
            );
          })}
        </div>

        {/* Hộp giải thích chi tiết */}
        {isAnswered && (
          <div className="mt-6 rounded-2xl bg-[#FAF9FD] p-5 border border-[#E5E2EC] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs font-black uppercase tracking-wider text-[#77718C]">
              {selectedOption === currentQ.correct_index ? "Chính xác!" : "Giải thích chi tiết"}
            </p>
            <MathText
              text={currentQ.explanation}
              as="p"
              className="mt-2 text-xs sm:text-sm text-[#4F4965] leading-relaxed"
            />

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-social-violet px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-social-violet/25 hover:bg-[#6E60DC] transition-all hover:scale-105"
              >
                <span>{currentIndex + 1 < questions.length ? "Câu tiếp theo" : "Xem kết quả"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

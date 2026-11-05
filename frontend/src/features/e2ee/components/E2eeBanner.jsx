import { useDispatch, useSelector } from "react-redux";
import {
  dismissE2eePrompt,
  openE2eeSetupModal,
  openE2eeUnlockModal,
  selectE2eePromptDismissed,
  selectE2eeStatus,
} from "../e2eeSlice";

export default function E2eeBanner({ peerHasActiveKey, isLoadingPeerKeys }) {
  const dispatch = useDispatch();
  const status = useSelector(selectE2eeStatus);
  const promptDismissed = useSelector(selectE2eePromptDismissed);

  if (status === "unknown" || isLoadingPeerKeys) {
    return null;
  }

  if (status === "locked") {
    return (
      <div className="mx-3 mt-2 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
        <span className="font-medium">
          Khóa mã hóa đang khóa. Nhập mã PIN để đọc và gửi tin nhắn mã hóa.
        </span>
        <button
          type="button"
          onClick={() => dispatch(openE2eeUnlockModal("unlock"))}
          className="shrink-0 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-700"
        >
          Nhập PIN
        </button>
      </div>
    );
  }

  if (status === "not_setup") {
    if (promptDismissed) {
      return (
        <div className="mx-3 mt-2 flex items-center justify-between gap-2 rounded-xl border border-[#E5E0F5] bg-[#FAF9FF] px-3 py-1.5 text-[11px] text-[#6F6880]">
          <span>Chưa bật mã hóa đầu cuối cho cuộc trò chuyện.</span>
          <button
            type="button"
            onClick={() => dispatch(openE2eeSetupModal())}
            className="shrink-0 font-bold text-social-violet hover:underline"
          >
            Thiết lập
          </button>
        </div>
      );
    }

    return (
      <div className="mx-3 mt-2 flex items-center justify-between gap-2 rounded-xl border border-[#DCD6F3] bg-[#F4F1FF] px-3 py-2 text-[11px] text-[#2F2A45]">
        <span className="font-medium">
          Bật mã hóa đầu cuối bằng mã PIN 8 ký tự để bảo vệ nội dung tin nhắn.
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => dispatch(dismissE2eePrompt())}
            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[#6F6880] hover:bg-white/60"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={() => dispatch(openE2eeSetupModal())}
            className="rounded-lg bg-social-violet px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#6E60DC]"
          >
            Bật ngay
          </button>
        </div>
      </div>
    );
  }

  if (status === "ready") {
    if (peerHasActiveKey) {
      return (
        <div className="mx-3 mt-2 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-1.5 text-center text-[11px] font-semibold text-emerald-800">
          Tin nhắn được mã hóa đầu cuối
        </div>
      );
    }

    return (
      <div className="mx-3 mt-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-1.5 text-center text-[11px] font-medium text-amber-800">
        Bạn bè chưa bật mã hóa đầu cuối. Tin nhắn văn bản sẽ gửi ở dạng thường.
      </div>
    );
  }

  return null;
}


import { useDispatch, useSelector } from "react-redux";
import {
  openE2eeSetupModal,
  openE2eeUnlockModal,
  selectE2eeKeyVersion,
  selectE2eeStatus,
} from "../e2eeSlice";

export default function E2eeSecuritySection() {
  const dispatch = useDispatch();
  const status = useSelector(selectE2eeStatus);
  const keyVersion = useSelector(selectE2eeKeyVersion);

  const statusBadge = () => {
    if (status === "ready") {
      return (
        <span className="rounded-full bg-[#E8F7F2] px-3 py-1.5 text-[11px] font-bold text-[#3C907A]">
          Đã kích hoạt {keyVersion ? `(Phiên bản v${keyVersion})` : ""}
        </span>
      );
    }
    if (status === "locked") {
      return (
        <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-bold text-amber-800">
          Đang khóa trên trình duyệt này
        </span>
      );
    }
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
        Chưa thiết lập
      </span>
    );
  };

  return (
    <section className="rounded-[26px] border border-[#ECE7F5] bg-[#F9F7FF] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-extrabold text-[#2F2A45]">
            Bảo mật tin nhắn
          </p>
          <p className="mt-1 text-xs font-medium text-[#6F6880]">
            Mã hóa đầu
            
             cuối tin nhắn văn bản bằng cặp khóa cá nhân và mã PIN 8
            ký tự
          </p>
        </div>
        {statusBadge()}
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {status === "not_setup" && (
          <button
            type="button"
            onClick={() => dispatch(openE2eeSetupModal())}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-social-violet px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#6E60DC]"
          >
            Thiết lập mã PIN bảo mật
          </button>
        )}

        {status === "locked" && (
          <>
            <button
              type="button"
              onClick={() => dispatch(openE2eeUnlockModal("unlock"))}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-social-violet px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#6E60DC]"
            >
              Nhập mã PIN mở khóa
            </button>
            <button
              type="button"
              onClick={() => dispatch(openE2eeUnlockModal("reset"))}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
            >
              Quên PIN / Đặt lại khóa
            </button>
          </>
        )}

        {status === "ready" && (
          <>
            <button
              type="button"
              onClick={() => dispatch(openE2eeUnlockModal("change_pin"))}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#DCD6F3] bg-white px-4 text-xs font-extrabold text-[#4F4965] transition hover:bg-[#FAF9FF]"
            >
              Đổi mã PIN bảo mật
            </button>
            <button
              type="button"
              onClick={() => dispatch(openE2eeUnlockModal("reset"))}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
            >
              Đặt lại cặp khóa mới
            </button>
          </>
        )}
      </div>
    </section>
  );
}


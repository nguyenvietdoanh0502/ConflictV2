import { useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../../auth/authSelectors";
import { E2EE_PIN_LENGTH, isValidE2eePin } from "../crypto/e2eeCrypto";
import { useCreateE2eeKeyMutation } from "../e2eeApi";
import { e2eeSession } from "../e2eeSession";
import {
  closeE2eeSetupModal,
  selectIsE2eeSetupModalOpen,
  setE2eeState,
} from "../e2eeSlice";
import { getLocalizedErrorMessage } from "../../../utils/errorMessages";

export default function E2eeSetupModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsE2eeSetupModalOpen);
  const currentUser = useSelector(selectCurrentUser);
  const [createE2eeKey, { isLoading }] = useCreateE2eeKeyMutation();

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [rememberOnBrowser, setRememberOnBrowser] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const busy = isLoading || isGenerating;

  const handleClose = () => {
    if (busy) return;
    setPin("");
    setConfirmPin("");
    setErrorMessage("");
    dispatch(closeE2eeSetupModal());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isValidE2eePin(pin)) {
      setErrorMessage(`Mã PIN bảo mật phải gồm đúng ${E2EE_PIN_LENGTH} ký tự.`);
      return;
    }

    if (pin !== confirmPin) {
      setErrorMessage("Mã PIN xác nhận không trùng khớp.");
      return;
    }

    if (!currentUser?.id) {
      setErrorMessage("Không tìm thấy thông tin người dùng hiện tại.");
      return;
    }

    setIsGenerating(true);
    try {
      const { requestPayload, nonExtractablePrivate } =
        await e2eeSession.createKeyBundleForPin(pin);
      const savedKey = await createE2eeKey(requestPayload).unwrap();
      await e2eeSession.activateLocalKey(
        currentUser.id,
        savedKey.keyVersion,
        nonExtractablePrivate,
        rememberOnBrowser
      );
      dispatch(
        setE2eeState({
          status: "ready",
          keyVersion: savedKey.keyVersion,
        })
      );
      setPin("");
      setConfirmPin("");
      dispatch(closeE2eeSetupModal());
    } catch (err) {
      setErrorMessage(
        getLocalizedErrorMessage(
          err,
          "Không thể thiết lập khóa mã hóa. Vui lòng thử lại."
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] grid place-items-center bg-[#2F2A45]/[.45] px-4 py-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-[26px] border border-[#EAE7F6] bg-white p-6 text-[#2F2A45] shadow-[0_28px_80px_rgba(47,42,69,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="e2ee-setup-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="e2ee-setup-title"
              className="mt-1.5 text-xl font-extrabold text-[#2F2A45]"
            >
              Thiết lập mã hóa đầu cuối
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="grid h-8 w-8 place-items-center rounded-full border border-[#EAE7F6] text-lg text-[#746D87] hover:bg-[#FAF9FF]"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <p className="mt-2 text-xs leading-5 text-[#6F6880]">
          Tạo mã PIN gồm đúng {E2EE_PIN_LENGTH} ký tự để bảo vệ khóa giải mã tin
          nhắn của bạn. Khi đăng nhập trên thiết bị mới, bạn chỉ cần nhập lại mã
          PIN này để đọc tin nhắn.
        </p>

        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs leading-5 text-amber-800">
          Lưu ý: Nếu quên mã PIN, bạn sẽ phải
          tạo khóa mới và không thể đọc lại các tin nhắn đã mã hóa trước đó.
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label
              htmlFor="e2ee-pin"
              className="block text-xs font-bold text-[#4F4965]"
            >
              Mã PIN bảo mật ({pin.length}/{E2EE_PIN_LENGTH} ký tự)
            </label>
            <input
              id="e2ee-pin"
              type="password"
              value={pin}
              maxLength={E2EE_PIN_LENGTH}
              onChange={(e) => setPin(e.target.value)}
              placeholder={`Nhập đúng ${E2EE_PIN_LENGTH} ký tự`}
              disabled={busy}
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-[#DCD6F3] bg-[#FAF9FF] px-3.5 py-2.5 text-sm font-medium text-[#2F2A45] outline-none transition focus:border-social-violet focus:bg-white focus:ring-2 focus:ring-social-violet/20"
            />
          </div>

          <div>
            <label
              htmlFor="e2ee-confirm-pin"
              className="block text-xs font-bold text-[#4F4965]"
            >
              Xác nhận mã PIN ({confirmPin.length}/{E2EE_PIN_LENGTH} ký tự)
            </label>
            <input
              id="e2ee-confirm-pin"
              type="password"
              value={confirmPin}
              maxLength={E2EE_PIN_LENGTH}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder={`Nhập lại ${E2EE_PIN_LENGTH} ký tự`}
              disabled={busy}
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-[#DCD6F3] bg-[#FAF9FF] px-3.5 py-2.5 text-sm font-medium text-[#2F2A45] outline-none transition focus:border-social-violet focus:bg-white focus:ring-2 focus:ring-social-violet/20"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-xs font-medium text-[#4F4965]">
            <input
              type="checkbox"
              checked={rememberOnBrowser}
              onChange={(e) => setRememberOnBrowser(e.target.checked)}
              disabled={busy}
              className="h-4 w-4 rounded border-[#DCD6F3] text-social-violet focus:ring-social-violet"
            />
            <span>
              Ghi nhớ khóa trên trình duyệt này (tự động xóa khi đăng xuất)
            </span>
          </label>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
            >
              {errorMessage}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              className="rounded-xl border border-[#DCD6F3] bg-white px-4 py-2 text-xs font-bold text-[#6F6880] hover:bg-[#FAF9FF] disabled:opacity-50"
            >
              Để sau
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-social-violet px-5 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#6E60DC] disabled:opacity-50"
            >
              {busy ? "Đang tạo khóa..." : "Kích hoạt mã hóa"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}


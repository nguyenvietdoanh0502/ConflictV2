import { useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../../auth/authSelectors";
import { E2EE_PIN_LENGTH, isValidE2eePin } from "../crypto/e2eeCrypto";
import {
  useCreateE2eeKeyMutation,
  useGetMyE2eeKeyQuery,
  useUpdateE2eeBackupMutation,
} from "../e2eeApi";
import { e2eeSession } from "../e2eeSession";
import {
  closeE2eeUnlockModal,
  selectE2eeUnlockModalMode,
  selectIsE2eeUnlockModalOpen,
  setE2eeState,
} from "../e2eeSlice";
import { getLocalizedErrorMessage } from "../../../utils/errorMessages";

export default function E2eeUnlockModal() {
  const isOpen = useSelector(selectIsE2eeUnlockModalOpen);
  const initialMode = useSelector(selectE2eeUnlockModalMode);

  if (!isOpen) return null;

  return <E2eeUnlockDialog key={initialMode || "unlock"} initialMode={initialMode} />;
}

function E2eeUnlockDialog({ initialMode }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  const { data: myKeyDto } = useGetMyE2eeKeyQuery(undefined, {
    skip: !currentUser?.id,
  });
  const [createE2eeKey, { isLoading: isCreating }] = useCreateE2eeKeyMutation();
  const [updateBackup, { isLoading: isUpdatingBackup }] =
    useUpdateE2eeBackupMutation();

  const [mode, setMode] = useState(initialMode || "unlock"); // "unlock" | "reset" | "change_pin"
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [rememberOnBrowser, setRememberOnBrowser] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const busy = isWorking || isCreating || isUpdatingBackup;

  const handleClose = () => {
    if (busy) return;
    dispatch(closeE2eeUnlockModal());
  };

  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isValidE2eePin(pin)) {
      setErrorMessage(`Vui lòng nhập mã PIN gồm đúng ${E2EE_PIN_LENGTH} ký tự.`);
      return;
    }

    if (!myKeyDto?.hasKey || !currentUser?.id) {
      setErrorMessage("Không tìm thấy bản sao lưu khóa trên máy chủ.");
      return;
    }

    setIsWorking(true);
    try {
      await e2eeSession.unlockWithPin(
        currentUser.id,
        myKeyDto,
        pin,
        rememberOnBrowser
      );
      dispatch(
        setE2eeState({
          status: "ready",
          keyVersion: myKeyDto.keyVersion,
        })
      );
      dispatch(closeE2eeUnlockModal());
    } catch (err) {
      if (err?.message === "E2EE_WRONG_PIN") {
        setErrorMessage("Mã PIN không chính xác. Vui lòng kiểm tra lại.");
      } else {
        setErrorMessage(
          getLocalizedErrorMessage(err, "Không thể mở khóa tin nhắn.")
        );
      }
    } finally {
      setIsWorking(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!accountPassword.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu đăng nhập tài khoản để xác nhận.");
      return;
    }
    if (!isValidE2eePin(newPin)) {
      setErrorMessage(`Mã PIN mới phải gồm đúng ${E2EE_PIN_LENGTH} ký tự.`);
      return;
    }
    if (newPin !== confirmNewPin) {
      setErrorMessage("Mã PIN xác nhận không trùng khớp.");
      return;
    }
    if (!currentUser?.id) return;

    setIsWorking(true);
    try {
      const { requestPayload, nonExtractablePrivate } =
        await e2eeSession.createKeyBundleForPin(newPin);
      const savedKey = await createE2eeKey({
        ...requestPayload,
        currentPassword: accountPassword,
      }).unwrap();

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
      dispatch(closeE2eeUnlockModal());
    } catch (err) {
      setErrorMessage(
        getLocalizedErrorMessage(
          err,
          "Không thể đặt lại khóa mã hóa. Vui lòng kiểm tra mật khẩu đăng nhập."
        )
      );
    } finally {
      setIsWorking(false);
    }
  };

  const handleChangePinSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isValidE2eePin(pin)) {
      setErrorMessage(
        `Vui lòng nhập mã PIN hiện tại gồm đúng ${E2EE_PIN_LENGTH} ký tự.`
      );
      return;
    }
    if (!isValidE2eePin(newPin)) {
      setErrorMessage(`Mã PIN mới phải gồm đúng ${E2EE_PIN_LENGTH} ký tự.`);
      return;
    }
    if (newPin !== confirmNewPin) {
      setErrorMessage("Mã PIN mới xác nhận không trùng khớp.");
      return;
    }
    if (!myKeyDto?.hasKey || !currentUser?.id) {
      setErrorMessage("Không tìm thấy khóa hiện tại.");
      return;
    }

    setIsWorking(true);
    try {
      const { requestPayload, nonExtractableKey } =
        await e2eeSession.rewrapBackupWithNewPin(myKeyDto, pin, newPin);
      const updated = await updateBackup(requestPayload).unwrap();
      await e2eeSession.activateLocalKey(
        currentUser.id,
        updated.keyVersion,
        nonExtractableKey,
        true
      );
      dispatch(
        setE2eeState({
          status: "ready",
          keyVersion: updated.keyVersion,
        })
      );
      dispatch(closeE2eeUnlockModal());
    } catch (err) {
      if (err?.message === "E2EE_WRONG_PIN") {
        setErrorMessage("Mã PIN hiện tại không chính xác.");
      } else {
        setErrorMessage(
          getLocalizedErrorMessage(err, "Không thể đổi mã PIN bảo mật.")
        );
      }
    } finally {
      setIsWorking(false);
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
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block rounded-full bg-[#EDE9FE] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-social-violet">
              Mã hóa đầu cuối
            </span>
            <h2 className="mt-1.5 text-xl font-extrabold text-[#2F2A45]">
              {mode === "unlock" && "Mở khóa tin nhắn mã hóa"}
              {mode === "reset" && "Đặt lại khóa mã hóa"}
              {mode === "change_pin" && "Đổi mã PIN bảo mật"}
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

        {mode === "unlock" && (
          <form onSubmit={handleUnlockSubmit} className="mt-3 space-y-3.5">
            <p className="text-xs leading-5 text-[#6F6880]">
              Nhập mã PIN bảo mật ({E2EE_PIN_LENGTH} ký tự) để khôi phục khóa và
              đọc các tin nhắn được mã hóa đầu cuối.
            </p>

            <div>
              <label
                htmlFor="e2ee-unlock-pin"
                className="block text-xs font-bold text-[#4F4965]"
              >
                Mã PIN bảo mật ({pin.length}/{E2EE_PIN_LENGTH} ký tự)
              </label>
              <input
                id="e2ee-unlock-pin"
                type="password"
                value={pin}
                maxLength={E2EE_PIN_LENGTH}
                onChange={(e) => setPin(e.target.value)}
                placeholder={`Nhập đúng ${E2EE_PIN_LENGTH} ký tự`}
                disabled={busy}
                autoFocus
                className="mt-1 w-full rounded-xl border border-[#DCD6F3] bg-[#FAF9FF] px-3.5 py-2.5 text-sm font-medium text-[#2F2A45] outline-none transition focus:border-social-violet focus:bg-white focus:ring-2 focus:ring-social-violet/20"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-[#4F4965]">
              <input
                type="checkbox"
                checked={rememberOnBrowser}
                onChange={(e) => setRememberOnBrowser(e.target.checked)}
                disabled={busy}
                className="h-4 w-4 rounded border-[#DCD6F3] text-social-violet focus:ring-social-violet"
              />
              <span>
                Ghi nhớ khóa trên trình duyệt này (xóa khi đăng xuất)
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

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("");
                  setMode("reset");
                }}
                disabled={busy}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Quên mã PIN?
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={busy}
                  className="rounded-xl border border-[#DCD6F3] bg-white px-4 py-2 text-xs font-bold text-[#6F6880] hover:bg-[#FAF9FF]"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-social-violet px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#6E60DC] disabled:opacity-50"
                >
                  {busy ? "Đang mở khóa..." : "Mở khóa"}
                </button>
              </div>
            </div>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={handleResetSubmit} className="mt-3 space-y-3.5">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs leading-5 text-rose-800">
              Cảnh báo: Đặt lại khóa mới sẽ khiến bạn không thể xem lại các
              tin nhắn cũ đã mã hóa bằng khóa trước đó.
            </div>

            <div>
              <label
                htmlFor="e2ee-reset-password"
                className="block text-xs font-bold text-[#4F4965]"
              >
                Mật khẩu đăng nhập tài khoản
              </label>
              <input
                id="e2ee-reset-password"
                type="password"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                placeholder="Nhập mật khẩu đăng nhập hiện tại"
                disabled={busy}
                className="mt-1 w-full rounded-xl border border-[#DCD6F3] bg-[#FAF9FF] px-3.5 py-2.5 text-sm font-medium text-[#2F2A45] outline-none focus:border-social-violet focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="e2ee-reset-new-pin"
                className="block text-xs font-bold text-[#4F4965]"
              >
                Mã PIN mới ({newPin.length}/{E2EE_PIN_LENGTH} ký tự)
              </label>
              <input
                id="e2ee-reset-new-pin"
                type="password"
                value={newPin}
                maxLength={E2EE_PIN_LENGTH}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder={`Nhập đúng ${E2EE_PIN_LENGTH} ký tự`}
                disabled={busy}
                className="mt-1 w-full rounded-xl border border-[#DCD6F3] bg-[#FAF9FF] px-3.5 py-2.5 text-sm font-medium text-[#2F2A45] outline-none focus:border-social-violet focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="e2ee-reset-confirm-pin"
                className="block text-xs font-bold text-[#4F4965]"
              >
                Xác nhận mã PIN mới ({confirmNewPin.length}/{E2EE_PIN_LENGTH} ký
                tự)
              </label>
              <input
                id="e2ee-reset-confirm-pin"
                type="password"
                value={confirmNewPin}
                maxLength={E2EE_PIN_LENGTH}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                placeholder={`Nhập lại ${E2EE_PIN_LENGTH} ký tự`}
                disabled={busy}
                className="mt-1 w-full rounded-xl border border-[#DCD6F3] bg-[#FAF9FF] px-3.5 py-2.5 text-sm font-medium text-[#2F2A45] outline-none focus:border-social-violet focus:bg-white"
              />
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
              >
                {errorMessage}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("");
                  setMode("unlock");
                }}
                disabled={busy}
                className="text-xs font-bold text-[#6F6880] hover:underline"
              >
                Quay lại mở khóa
              </button>

              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {busy ? "Đang tạo khóa mới..." : "Tạo khóa mới"}
              </button>
            </div>
          </form>
        )}

        {mode === "change_pin" && (
          <form onSubmit={handleChangePinSubmit} className="mt-3 space-y-3.5">
            <p className="text-xs leading-5 text-[#6F6880]">
              Đổi mã PIN bảo vệ bản sao lưu khóa mà không làm thay đổi cặp khóa
              mã hóa hiện tại. Lịch sử tin nhắn vẫn được giữ nguyên.
            </p>

            <div>
              <label
                htmlFor="e2ee-current-pin"
                className="block text-xs font-bold text-[#4F4965]"
              >
                Mã PIN hiện tại ({pin.length}/{E2EE_PIN_LENGTH} ký tự)
              </label>
              <input
                id="e2ee-current-pin"
                type="password"
                value={pin}
                maxLength={E2EE_PIN_LENGTH}
                onChange={(e) => setPin(e.target.value)}
                placeholder={`Nhập đúng ${E2EE_PIN_LENGTH} ký tự`}
                disabled={busy}
                className="mt-1 w-full rounded-xl border border-[#DCD6F3] bg-[#FAF9FF] px-3.5 py-2.5 text-sm font-medium text-[#2F2A45] outline-none focus:border-social-violet focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="e2ee-change-new-pin"
                className="block text-xs font-bold text-[#4F4965]"
              >
                Mã PIN mới ({newPin.length}/{E2EE_PIN_LENGTH} ký tự)
              </label>
              <input
                id="e2ee-change-new-pin"
                type="password"
                value={newPin}
                maxLength={E2EE_PIN_LENGTH}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder={`Nhập đúng ${E2EE_PIN_LENGTH} ký tự`}
                disabled={busy}
                className="mt-1 w-full rounded-xl border border-[#DCD6F3] bg-[#FAF9FF] px-3.5 py-2.5 text-sm font-medium text-[#2F2A45] outline-none focus:border-social-violet focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="e2ee-change-confirm-pin"
                className="block text-xs font-bold text-[#4F4965]"
              >
                Xác nhận mã PIN mới ({confirmNewPin.length}/{E2EE_PIN_LENGTH} ký
                tự)
              </label>
              <input
                id="e2ee-change-confirm-pin"
                type="password"
                value={confirmNewPin}
                maxLength={E2EE_PIN_LENGTH}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                placeholder={`Nhập lại ${E2EE_PIN_LENGTH} ký tự`}
                disabled={busy}
                className="mt-1 w-full rounded-xl border border-[#DCD6F3] bg-[#FAF9FF] px-3.5 py-2.5 text-sm font-medium text-[#2F2A45] outline-none focus:border-social-violet focus:bg-white"
              />
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
              >
                {errorMessage}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="rounded-xl border border-[#DCD6F3] bg-white px-4 py-2 text-xs font-bold text-[#6F6880] hover:bg-[#FAF9FF]"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-social-violet px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#6E60DC] disabled:opacity-50"
              >
                {busy ? "Đang lưu..." : "Cập nhật mã PIN"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

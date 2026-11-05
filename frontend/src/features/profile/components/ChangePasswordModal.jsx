import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { useChangePasswordMutation } from "../../auth/authApi";
import { getLocalizedErrorMessage } from "../../../utils/errorMessages";

const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$/;

const fieldClassName =
  "h-11 w-full rounded-[15px] border border-[#E6E0EF] bg-white pl-4 pr-11 text-sm font-medium text-[#2F2A45] outline-none transition placeholder:text-[#77718C] hover:border-[#CBC3DD] focus:border-[#7C6EE6] focus:ring-4 focus:ring-[#7C6EE6]/10 disabled:cursor-not-allowed disabled:bg-[#F4F1F7] disabled:opacity-60";

export default function ChangePasswordModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const oldPasswordInputRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      oldPasswordInputRef.current?.focus();
    });

    function handleKeyDown(event) {
      if (event.key === "Escape" && !isLoading) {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previousFocusRef.current?.focus();
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) {
    return null;
  }

  function handleClose() {
    if (isLoading) return;
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setServerError("");
    setSuccessMessage("");
    onClose();
  }

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    setSuccessMessage("");

    if (!oldPassword) {
      setServerError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPassword) {
      setServerError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (oldPassword === newPassword) {
      setServerError("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      setServerError(
        "Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt (@#$%^&+=!)."
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setServerError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    try {
      await changePassword({
        oldPassword,
        newPassword,
        confirmNewPassword,
      }).unwrap();

      setSuccessMessage("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      setServerError(
        getLocalizedErrorMessage(
          error,
          "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại."
        )
      );
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#2F2A45]/[.45] px-4 py-6 backdrop-blur-md"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#EAE7F6] bg-[#FFF9FC] font-sans text-[#2F2A45] shadow-[0_30px_100px_rgba(47,42,69,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isLoading}
      >
        <div className="relative overflow-hidden border-b border-[#EEE8F4] bg-[#F5F3FF] px-6 pb-5 pt-6">
          <span
            className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full border-[18px] border-white/[.45]"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/90 bg-white/80 text-xl leading-none text-[#746D87] shadow-sm transition hover:bg-white hover:text-[#2F2A45]"
            aria-label="Đóng hộp thoại đổi mật khẩu"
          >
            ×
          </button>

          <div className="relative flex items-start gap-3.5 pr-8">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-[#7C6EE6] text-white shadow-[0_12px_28px_rgba(124,110,230,0.28)]">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h2
                id={titleId}
                className="text-xl font-extrabold tracking-tight text-[#2F2A45]"
              >
                Đổi mật khẩu
              </h2>
              <p
                id={descriptionId}
                className="mt-1 text-xs font-medium leading-5 text-[#6F6880]"
              >
                Cập nhật mật khẩu định kỳ để bảo vệ tài khoản học tập của bạn.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label
              htmlFor="change-old-password"
              className="block text-sm sm:text-base font-extrabold text-[#2F2A45]"
            >
              Mật khẩu hiện tại
            </label>
            <div className="relative mt-1.5">
              <input
                ref={oldPasswordInputRef}
                id="change-old-password"
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={isLoading}
                required
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
                className={fieldClassName}
              />
              <button
                type="button"
                onClick={() => setShowOld((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#77718C] transition hover:bg-[#F4F1F7] hover:text-[#2F2A45]"
                aria-label={showOld ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"}
                tabIndex={-1}
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="change-new-password"
              className="block text-sm sm:text-base font-extrabold text-[#2F2A45]"
            >
              Mật khẩu mới
            </label>
            <div className="relative mt-1.5">
              <input
                id="change-new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
                placeholder="Ví dụ: UniSync@2026"
                autoComplete="new-password"
                className={fieldClassName}
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#77718C] transition hover:bg-[#F4F1F7] hover:text-[#2F2A45]"
                aria-label={showNew ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="change-confirm-password"
              className="block text-sm sm:text-base font-extrabold text-[#2F2A45]"
            >
              Xác nhận mật khẩu mới
            </label>
            <div className="relative mt-1.5">
              <input
                id="change-confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isLoading}
                required
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                className={fieldClassName}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#77718C] transition hover:bg-[#F4F1F7] hover:text-[#2F2A45]"
                aria-label={showConfirm ? "Ẩn xác nhận mật khẩu mới" : "Hiện xác nhận mật khẩu mới"}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {serverError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-[16px] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold leading-5 text-rose-700"
            >
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white">
                !
              </span>
              <span>{serverError}</span>
            </p>
          )}

          {successMessage && (
            <p
              role="status"
              className="flex items-center gap-2 rounded-[16px] border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700"
            >
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500 text-[10px] font-extrabold text-white">
                ✓
              </span>
              <span>{successMessage}</span>
            </p>
          )}

          <div className="flex flex-col-reverse gap-2.5 border-t border-[#EEE8F4] pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="inline-flex min-h-10 items-center justify-center rounded-[14px] border border-[#DCD6F3] bg-white px-4 text-xs font-extrabold text-[#716A80] transition hover:bg-[#FAF9FF] hover:text-[#2F2A45] disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-10 min-w-36 items-center justify-center gap-2 rounded-[14px] bg-[#7C6EE6] px-5 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(124,110,230,0.25)] transition hover:bg-[#695CCB] disabled:opacity-50"
            >
              {isLoading && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/[.35] border-t-white" />
              )}
              {isLoading ? "Đang lưu..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}


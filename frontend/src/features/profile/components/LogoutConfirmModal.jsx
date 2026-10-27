import { getLocalizedErrorMessage } from "../../../utils/errorMessages";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLogoutMutation } from "../../auth/authApi";
import { clearCredentials } from "../../auth/authSlice";

function getLogoutErrorMessage(error) {
  return getLocalizedErrorMessage(error, "Đăng xuất thất bại. Vui lòng thử lại.");
}

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const [serverError, setServerError] = useState("");
  const dispatch = useDispatch();
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableElements?.length) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  async function handleLogoutSubmit() {
    setServerError("");

    try {
      await logout().unwrap();
      dispatch(clearCredentials());
      onConfirm();
      navigate("/", { replace: true });
    } catch (error) {
      setServerError(getLogoutErrorMessage(error));
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#2F2A45]/[.45] px-4 py-8 backdrop-blur-md"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#EAE7F6] bg-white font-sans text-[#2F2A45] shadow-[0_30px_100px_rgba(47,42,69,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isLoading}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-[#EAE7F6] bg-white text-xl leading-none text-[#746D87] shadow-sm transition hover:rotate-6 hover:bg-[#FAF9FF] hover:text-[#2F2A45] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-social-violet/20"
          aria-label="Đóng hộp thoại đăng xuất"
        >
          ×
        </button>

        <div className="relative px-6 pb-6 pt-7 sm:px-7 sm:pb-7">
          <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-social-violet text-white shadow-[0_12px_28px_rgba(124,110,230,0.28)]">
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 17l5-5-5-5M15 12H3" />
              <path d="M14 4h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-4" />
            </svg>
          </div>

          <h2
            id={titleId}
            className="mt-4 pr-10 text-2xl font-extrabold tracking-tight text-[#2F2A45]"
          >
            Bạn muốn đăng xuất?
          </h2>

          <p
            id={descriptionId}
            className="mt-2 text-sm font-medium leading-6 text-[#6F6880]"
          >
            Phiên đăng nhập hiện tại sẽ kết thúc. Bạn cần đăng nhập lại để tiếp
            tục kết nối cùng bạn bè và sử dụng không gian cá nhân.
          </p>

          {serverError && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-5 text-rose-700"
            >
              <span
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-rose-500 text-xs font-extrabold text-white"
                aria-hidden="true"
              >
                !
              </span>
              {serverError}
            </p>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex min-h-11 items-center justify-center rounded-[16px] border border-[#DCD6F3] bg-white px-5 text-sm font-extrabold text-[#716A80] transition hover:border-social-violet/40 hover:bg-[#FAF9FF] hover:text-[#2F2A45] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-social-violet/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ở lại
            </button>

            <button
              type="button"
              onClick={handleLogoutSubmit}
              disabled={isLoading}
              className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-[16px] bg-social-violet px-6 text-sm font-extrabold text-white shadow-[0_10px_26px_rgba(124,110,230,0.28)] transition hover:-translate-y-0.5 hover:bg-[#6E60DC] hover:shadow-[0_14px_30px_rgba(124,110,230,0.34)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-social-violet/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-[#B5ACF2] disabled:shadow-none"
            >
              {isLoading && (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/[.35] border-t-white"
                  aria-hidden="true"
                />
              )}
              {isLoading ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLogoutMutation } from "../../auth/authApi";
import { clearCredentials } from "../../auth/authSlice";

function getLogoutErrorMessage(error) {
  if (error?.status === "FETCH_ERROR") {
    return "Không kết nối được tới backend. Hãy kiểm tra server đang chạy ở cổng 8080.";
  }

  if (typeof error?.data?.message === "string") {
    return error.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đăng xuất thất bại. Vui lòng kiểm tra lại email và mật khẩu.";
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
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/90 bg-[#FFF9FC] text-[#2F2A45] shadow-[0_30px_100px_rgba(47,42,69,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isLoading}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#FFE3EC] via-[#FFF0F5]/60 to-transparent"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -right-7 -top-9 h-28 w-28 rounded-full border-[18px] border-white/[.45]"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute right-24 top-8 h-4 w-4 rounded-full bg-[#B8EADD]"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/90 bg-white/70 text-xl leading-none text-[#746D87] shadow-sm transition hover:rotate-6 hover:bg-white hover:text-[#2F2A45] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF8FB3]/20"
          aria-label="Đóng hộp thoại đăng xuất"
        >
          ×
        </button>

        <div className="relative px-6 pb-6 pt-7 sm:px-7 sm:pb-7">
          <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-[#FF8FB3] text-white shadow-[0_14px_32px_rgba(255,143,179,0.3)]">
            <svg
              aria-hidden="true"
              className="h-7 w-7"
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

          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#D86288]">
            See you soon
          </p>
          <h2
            id={titleId}
            className="mt-1.5 pr-10 text-2xl font-extrabold tracking-tight text-[#2F2A45]"
          >
            Bạn muốn đăng xuất?
          </h2>

          <p
            id={descriptionId}
            className="mt-3 text-sm font-medium leading-6 text-[#6F6880]"
          >
            Phiên đăng nhập hiện tại sẽ kết thúc. Bạn cần đăng nhập lại để tiếp
            tục kết nối cùng bạn bè và sử dụng không gian cá nhân.
          </p>

          {serverError && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-[18px] border border-[#FFC7D8] bg-[#FFF0F5] px-4 py-3 text-sm font-semibold leading-5 text-[#C75077]"
            >
              <span
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#FF8FB3] text-xs font-extrabold text-white"
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
              className="inline-flex min-h-11 items-center justify-center rounded-[15px] border border-[#DED8E8] bg-white px-5 text-sm font-extrabold text-[#716A80] transition hover:border-[#C9C1D6] hover:bg-[#F7F4FA] hover:text-[#2F2A45] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ở lại
            </button>

            <button
              type="button"
              onClick={handleLogoutSubmit}
              disabled={isLoading}
              className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-[15px] bg-[#FF8FB3] px-5 text-sm font-extrabold text-white shadow-[0_10px_26px_rgba(255,143,179,0.28)] transition hover:-translate-y-0.5 hover:bg-[#EF7DA2] hover:shadow-[0_14px_30px_rgba(255,143,179,0.34)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF8FB3]/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-[#F1B5C8] disabled:shadow-none"
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

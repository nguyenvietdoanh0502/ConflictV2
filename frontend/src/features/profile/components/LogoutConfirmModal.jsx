import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { useLogoutMutation } from "../../auth/authApi";
import { clearCredentials } from "../../auth/authSlice";
import { useNavigate } from "react-router-dom";

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


export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const [serverError, setServerError] = useState("")
  const dispatch = useDispatch();
  const [logout,{isLoading}] = useLogoutMutation();
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
      className="fixed inset-0 z-[100] grid place-items-center bg-black/75 px-4 py-8 backdrop-blur-sm"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#333333] bg-[#0F0F0F] text-white shadow-[0_30px_100px_rgba(0,0,0,0.7)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#E50000]/10 to-transparent"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg border border-transparent text-xl leading-none text-[#777777] transition hover:border-[#333333] hover:bg-[#1A1A1A] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50000]/70"
          aria-label="Đóng hộp thoại đăng xuất"
        >
          ×
        </button>

        <div className="relative px-6 pb-6 pt-7 sm:px-7 sm:pb-7">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#E50000]/40 bg-[#E50000]/10 text-2xl font-bold text-[#FF4D4D] shadow-[0_10px_30px_rgba(229,0,0,0.12)]">
            <span aria-hidden="true">!</span>
          </div>

          <h2
            id={titleId}
            className="mt-5 pr-10 text-2xl font-bold tracking-tight text-white"
          >
            Bạn có chắc muốn đăng xuất?
          </h2>

          <p
            id={descriptionId}
            className="mt-3 text-sm leading-6 text-[#999999]"
          >
            Phiên đăng nhập hiện tại sẽ kết thúc. Bạn cần đăng nhập lại để tiếp
            tục sử dụng hồ sơ và danh sách phim đã lưu.
          </p>
          {serverError && (
            <p role="alert" className="mt-4 text-sm text-[#FF8080]">
              {serverError}
            </p>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-lg border border-[#333333] bg-[#1A1A1A] px-5 text-sm font-semibold text-[#D6D6D6] transition hover:border-[#4A4A4A] hover:bg-[#262626] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/10"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleLogoutSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

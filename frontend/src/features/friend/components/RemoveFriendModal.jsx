import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

export default function RemoveFriendModal({
  isOpen,
  friend,
  isRemoving = false,
  errorMessage,
  onClose,
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const displayName = friend?.user?.fullName?.trim() || "người bạn này";

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

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isRemoving) {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previousFocusRef.current?.focus();
    };
  }, [isOpen, isRemoving, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget && !isRemoving) {
      onClose?.();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#2F2A45]/[.45] px-4 py-8 backdrop-blur-md"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isRemoving}
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/90 bg-[#FFF9FC] text-[#2F2A45] shadow-[0_30px_100px_rgba(47,42,69,0.30)]"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#FFE2EC] via-[#F3EEFF]/70 to-transparent"
          aria-hidden="true"
        />

        <div className="relative px-6 pb-6 pt-7 sm:px-7 sm:pb-7">
          <span
            className="grid h-14 w-14 place-items-center rounded-[20px] border border-white bg-gradient-to-br from-[#FFD8BE] to-[#FFBBD0] text-[#A94064] shadow-[0_10px_24px_rgba(255,143,179,0.20)]"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2M6.5 9h11l-.65 10.1A2 2 0 0 1 14.86 21H9.14a2 2 0 0 1-1.99-1.9L6.5 9ZM10 12.5v4m4-4v4" />
            </svg>
          </span>

          <h2 id={titleId} className="mt-5 text-2xl font-extrabold tracking-[-0.025em] text-[#2F2A45]">
            Hủy kết bạn với {displayName}?
          </h2>
          <p id={descriptionId} className="mt-3 text-sm leading-6 text-[#716A84]">
            Người này sẽ bị xóa khỏi danh sách bạn bè. Hai bên vẫn có thể gửi
            lời mời kết bạn lại sau đó.
          </p>

          {errorMessage ? (
            <p
              role="alert"
              className="mt-4 rounded-2xl border border-[#FFC6D8] bg-[#FFF0F5] px-4 py-3 text-sm font-medium text-[#A63E62]"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onClose}
              disabled={isRemoving}
              className="min-h-11 rounded-full border border-[#DED8ED] bg-white px-5 text-sm font-bold text-[#5F5874] transition hover:border-[#BDB5D3] hover:bg-[#F8F6FD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/[.15] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Giữ lại
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!onConfirm || isRemoving}
              className="min-h-11 rounded-full bg-[#D85B84] px-5 text-sm font-bold text-white shadow-[0_9px_20px_rgba(216,91,132,0.24)] transition hover:-translate-y-0.5 hover:bg-[#C44972] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF8FB3]/30 disabled:cursor-not-allowed disabled:bg-[#D9B9C4] disabled:shadow-none"
            >
              {isRemoving ? "Đang xóa..." : "Hủy kết bạn"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

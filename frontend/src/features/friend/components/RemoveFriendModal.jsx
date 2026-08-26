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
      className="fixed inset-0 z-[100] grid place-items-center bg-black/75 px-4 py-8 backdrop-blur-sm"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#333333] bg-[#0F0F0F] text-white shadow-[0_30px_100px_rgba(0,0,0,0.7)]"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#E50000]/10 to-transparent"
          aria-hidden="true"
        />

        <div className="relative px-6 pb-6 pt-7 sm:px-7 sm:pb-7">
          <span
            className="grid h-14 w-14 place-items-center rounded-2xl border border-[#E50000]/40 bg-[#E50000]/10 text-2xl font-bold text-[#FF4D4D]"
            aria-hidden="true"
          >
            !
          </span>

          <h2 id={titleId} className="mt-5 text-2xl font-bold tracking-tight">
            Hủy kết bạn với {displayName}?
          </h2>
          <p id={descriptionId} className="mt-3 text-sm leading-6 text-[#999999]">
            Người này sẽ bị xóa khỏi danh sách bạn bè. Hai bên vẫn có thể gửi
            lời mời kết bạn lại sau đó.
          </p>

          {errorMessage ? (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-[#E50000]/35 bg-[#E50000]/10 px-4 py-3 text-sm text-[#FF8A8A]"
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
              className="min-h-11 rounded-lg border border-[#333333] bg-[#1A1A1A] px-5 text-sm font-semibold text-[#D6D6D6] transition hover:border-[#4A4A4A] hover:bg-[#262626] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Giữ lại
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!onConfirm || isRemoving}
              className="min-h-11 rounded-lg bg-[#E50000] px-5 text-sm font-semibold text-white transition hover:bg-[#FF1A1A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E50000]/25 disabled:cursor-not-allowed disabled:bg-[#4A1B1B] disabled:text-[#A77A7A]"
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

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../../auth/authSelectors";
import { setCurrentUser } from "../../auth/authSlice";
import { useUpdateProfileMutation } from "../userApi";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

const fieldClassName =
  "mt-2 w-full rounded-[16px] border border-[#E6E0EF] bg-white px-4 text-sm font-medium text-[#2F2A45] outline-none transition placeholder:text-[#77718C] hover:border-[#CBC3DD] focus:border-[#7C6EE6] focus:ring-4 focus:ring-[#7C6EE6]/10 disabled:cursor-not-allowed disabled:bg-[#F4F1F7] disabled:opacity-60";

function getLocalDateInputValue(date = new Date()) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function getUpdateProfileErrorMessage(error) {
  if (error?.status === "FETCH_ERROR") {
    return "Không kết nối được tới backend. Hãy kiểm tra server đang chạy ở cổng 8080.";
  }

  const errorMessages = {
    MISSING_FULL_NAME: "Vui lòng nhập họ và tên.",
    INVALID_FULL_NAME: "Họ và tên phải có từ 2 đến 100 ký tự.",
    INVALID_AVATAR_FILE: "Ảnh phải có định dạng JPEG, PNG hoặc WebP.",
    AVATAR_TOO_LARGE: "Ảnh không được vượt quá 5 MB.",
    AVATAR_UPLOAD_FAILED: "Không thể tải ảnh lên Cloudinary.",
    INVALID_DATE_OF_BIRTH:
      "Ngày sinh không hợp lệ hoặc nằm trong tương lai.",
    INVALID_ADDRESS: "Địa chỉ không được vượt quá 255 ký tự.",
    INVALID_GENDER: "Giới tính không hợp lệ.",
    USER_NOT_EXISTED: "Không tìm thấy tài khoản.",
  };
  const errorCode = error?.data?.errorCode;

  if (errorCode && errorMessages[errorCode]) {
    return errorMessages[errorCode];
  }

  if (typeof error?.data?.message === "string") {
    return error.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Cập nhật hồ sơ thất bại.";
}

export default function UpdateProfileModal({ isOpen, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [avatar, setAvatar] = useState(null);
  const [serverError, setServerError] = useState("");
  const today = getLocalDateInputValue();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

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

  async function handleUpdateProfileSubmit(event) {
    event.preventDefault();
    setServerError("");

    const normalizedFullName = fullName.trim();
    const normalizedAddress = address.trim();

    if (normalizedFullName.length < 2 || normalizedFullName.length > 100) {
      setServerError("Họ và tên phải có từ 2 đến 100 ký tự!!");
      return;
    }

    if (dateOfBirth && dateOfBirth > today) {
      setServerError("Ngày sinh không được nằm trong tương lai.");
      return;
    }

    if (normalizedAddress.length > 255) {
      setServerError("Địa chỉ không được vượt quá 255 ký tự.");
      return;
    }

    if (
      gender &&
      !GENDER_OPTIONS.some((option) => option.value === gender)
    ) {
      setServerError("Giới tính không hợp lệ.");
      return;
    }

    if (avatar) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(avatar.type)) {
        setServerError("Ảnh phải có định dạng JPEG, PNG hoăc WebP");
        return;
      }

      if (avatar.size > 5 * 1024 * 1024) {
        setServerError("Ảnh không được vượt quá 5 MB.");
        return;
      }
    }

    try {
      const apiResponse = await updateProfile({
        fullName: normalizedFullName,
        dateOfBirth,
        address: normalizedAddress,
        gender,
        avatar,
      }).unwrap();
      const updateUser = apiResponse?.data;

      if (!updateUser) {
        throw new Error("API không trả về thông tin người dùng!");
      }

      dispatch(setCurrentUser(updateUser));
      onConfirm?.(updateUser);
      onClose();
    } catch (error) {
      setServerError(getUpdateProfileErrorMessage(error));
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#2F2A45]/[.45] px-3 py-5 backdrop-blur-md sm:px-5 sm:py-8"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative max-h-[calc(100vh-2.5rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/90 bg-[#FFF9FC] text-[#2F2A45] shadow-[0_30px_100px_rgba(47,42,69,0.28)] sm:max-h-[calc(100vh-4rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isLoading}
      >
        <div className="relative overflow-hidden border-b border-[#EEE8F4] bg-gradient-to-br from-[#F0ECFF] via-[#FFF5F9] to-[#FFF0E5] px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
          <span
            className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border-[20px] border-white/[.45]"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute bottom-5 right-24 h-5 w-5 rounded-full bg-[#B8EADD]/80"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/90 bg-white/70 text-xl leading-none text-[#746D87] shadow-sm transition hover:rotate-6 hover:bg-white hover:text-[#2F2A45] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/20"
            aria-label="Đóng hộp thoại cập nhật hồ sơ"
          >
            ×
          </button>

          <div className="relative flex items-start gap-4 pr-10">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-[#7C6EE6] text-white shadow-[0_12px_28px_rgba(124,110,230,0.28)]">
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
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
              </svg>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#7C6EE6]">
                Make it yours
              </p>
              <h2
                id={titleId}
                className="mt-1 text-xl font-extrabold tracking-tight text-[#2F2A45] sm:text-2xl"
              >
                Cập nhật thông tin cá nhân
              </h2>
              <p
                id={descriptionId}
                className="mt-1.5 text-xs font-medium leading-5 text-[#6F6880] sm:text-sm"
              >
                Làm mới hồ sơ và ảnh đại diện để bạn bè nhận ra bạn ngay nhé.
              </p>
            </div>
          </div>
        </div>

        <form
          className="space-y-5 px-5 py-6 sm:px-7 sm:py-7"
          onSubmit={handleUpdateProfileSubmit}
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="update-full-name"
                className="text-sm font-extrabold text-[#4A435C]"
              >
                Họ và tên
              </label>
              <span className="rounded-full bg-[#F0ECFF] px-2.5 py-1 text-[10px] font-bold text-[#7C6EE6]">
                2–100 ký tự
              </span>
            </div>

            <input
              id="update-full-name"
              type="text"
              value={fullName}
              minLength={2}
              maxLength={100}
              required
              disabled={isLoading}
              onChange={(event) => {
                setFullName(event.target.value);
              }}
              className={`${fieldClassName} h-12`}
              placeholder="Nhập họ và tên của bạn"
              autoComplete="name"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="update-date-of-birth"
                className="text-sm font-extrabold text-[#4A435C]"
              >
                Ngày sinh
              </label>
              <input
                id="update-date-of-birth"
                type="date"
                value={dateOfBirth}
                max={today}
                disabled={isLoading}
                onChange={(event) => {
                  setDateOfBirth(event.target.value);
                }}
                className={`${fieldClassName} h-12`}
                autoComplete="bday"
              />
            </div>

            <div>
              <label
                htmlFor="update-gender"
                className="text-sm font-extrabold text-[#4A435C]"
              >
                Giới tính
              </label>
              <select
                id="update-gender"
                value={gender}
                disabled={isLoading}
                onChange={(event) => {
                  setGender(event.target.value);
                }}
                className={`${fieldClassName} h-12`}
                autoComplete="sex"
              >
                <option value="">Chưa cập nhật</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="update-address"
                className="text-sm font-extrabold text-[#4A435C]"
              >
                Địa chỉ
              </label>
              <span className="text-xs font-bold text-[#716A80]">
                {address.length}/255
              </span>
            </div>
            <textarea
              id="update-address"
              value={address}
              maxLength={255}
              rows={3}
              disabled={isLoading}
              onChange={(event) => {
                setAddress(event.target.value);
              }}
              className={`${fieldClassName} resize-none py-3 leading-6`}
              placeholder="Nhập địa chỉ hiện tại của bạn"
              autoComplete="street-address"
            />
          </div>

          <div>
            <label
              htmlFor="update-avatar"
              className="text-sm font-extrabold text-[#4A435C]"
            >
              Ảnh đại diện
            </label>

            <div className="mt-2 rounded-[20px] border border-dashed border-[#CFC6E5] bg-[#F8F5FF] p-3.5 transition hover:border-[#9C8FE8] hover:bg-[#F3EFFF] focus-within:border-[#7C6EE6] focus-within:ring-4 focus-within:ring-[#7C6EE6]/10">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[#EAE6FF] text-[#7C6EE6]">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="3" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-5-5L5 20" />
                  </svg>
                </span>

                <div className="min-w-0 flex-1">
                  <input
                    id="update-avatar"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isLoading}
                    onChange={(event) => {
                      const selectedFile = event.target.files?.[0] ?? null;
                      setAvatar(selectedFile);
                    }}
                    className="block w-full cursor-pointer text-xs font-medium text-[#6F6880] file:mr-3 file:cursor-pointer file:rounded-xl file:border-0 file:bg-[#7C6EE6] file:px-3.5 file:py-2.5 file:text-xs file:font-extrabold file:text-white file:transition hover:file:bg-[#695CCB] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <p className="mt-2 text-[11px] font-medium leading-5 text-[#716A80]">
                    JPEG, PNG hoặc WebP · tối đa 5 MB
                  </p>
                  {avatar && (
                    <p className="mt-1 truncate text-[11px] font-bold text-[#4C907E]">
                      Đã chọn: {avatar.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {serverError && (
            <p
              role="alert"
              className="flex items-start gap-2.5 rounded-[18px] border border-[#FFC7D8] bg-[#FFF0F5] px-4 py-3 text-sm font-semibold leading-5 text-[#C75077]"
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

          <div className="flex flex-col-reverse gap-3 border-t border-[#EEE8F4] pt-5 sm:flex-row sm:justify-end">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex min-h-11 items-center justify-center rounded-[15px] border border-[#DED8E8] bg-white px-5 text-sm font-extrabold text-[#716A80] transition hover:border-[#C9C1D6] hover:bg-[#F7F4FA] hover:text-[#2F2A45] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Để sau
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-11 min-w-40 items-center justify-center gap-2 rounded-[15px] bg-[#7C6EE6] px-5 text-sm font-extrabold text-white shadow-[0_10px_26px_rgba(124,110,230,0.25)] transition hover:-translate-y-0.5 hover:bg-[#695CCB] hover:shadow-[0_14px_30px_rgba(124,110,230,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-[#ACA3DF] disabled:shadow-none"
            >
              {isLoading && (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/[.35] border-t-white"
                  aria-hidden="true"
                />
              )}
              {isLoading ? "Đang cập nhật..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

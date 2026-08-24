import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useUpdateProfileMutation } from "../userApi";
import { selectCurrentUser } from "../../auth/authSelectors";
import { setCurrentUser } from "../../auth/authSlice";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

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
    INVALID_DATE_OF_BIRTH: "Ngày sinh không hợp lệ hoặc nằm trong tương lai.",
    INVALID_ADDRESS: "Địa chỉ không được vượt quá 255 ký tự.",
    INVALID_GENDER: "Giới tính không hợp lệ.",
    USER_NOT_EXISTED: "Không tìm thấy tài khoản.",
  };
  const errorCode = error?.data?.errorCode;
  if(errorCode && errorMessages[errorCode]){
    return errorMessages[errorCode];
  }
  if(typeof error?.data?.message === "string"){
    return error.data.message;
  }
  if(error instanceof Error){
    return error.message;
  }
  return "Cập nhật hồ sơ thất bại.";

}


export default function UpdateProfileModal({
  isOpen,
  onClose,
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [fullName,setFullName] = useState(user?.fullName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [avatar, setAvatar] = useState(null);
  const [serverError, setServerError] = useState("")
  const today = getLocalDateInputValue();

  const [updateProfile,{isLoading}] = useUpdateProfileMutation();

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
      if(
        normalizedFullName.length<2 || normalizedFullName.length>100
      ){
        setServerError("Họ và tên phải có từ 2 đến 100 ký tự!!");
        return;
      }
      if(dateOfBirth && dateOfBirth > today){
        setServerError("Ngày sinh không được nằm trong tương lai.");
        return;
      }
      if(normalizedAddress.length > 255){
        setServerError("Địa chỉ không được vượt quá 255 ký tự.");
        return;
      }
      if(gender && !GENDER_OPTIONS.some((option) => option.value === gender)){
        setServerError("Giới tính không hợp lệ.");
        return;
      }
      if(avatar){
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ]

        if(!allowedTypes.includes(avatar.type)){
            setServerError("Ảnh phải có định dạng JPEG, PNG hoăc WebP");
            return;
        }
        if(avatar.size>5*1024*1024){
            setServerError("Ảnh không được vượt quá 5 MB.")
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
        if(!updateUser){
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
      className="fixed inset-0 z-[100] grid place-items-center bg-black/75 px-4 py-8 backdrop-blur-sm"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative max-h-[calc(100vh-4rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#333333] bg-[#0F0F0F] text-white shadow-[0_30px_100px_rgba(0,0,0,0.7)]"
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
          aria-label="Đóng hộp thoại cập nhật hồ sơ"
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
            Cập nhật thông tin cá nhân
          </h2>
          <p
            id={descriptionId}
            className="mt-2 text-sm leading-6 text-[#888888]"
          >
            Điều chỉnh thông tin hồ sơ và ảnh đại diện của bạn.
          </p>
          <form
            className="mt-6 space-y-5"
            onSubmit={handleUpdateProfileSubmit}
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="update-full-name"
                  className="text-sm font-semibold text-[#E6E6E6]"
                >
                  Họ và tên
                </label>
                <span className="text-xs text-[#666666]">2–100 ký tự</span>
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
                className="mt-2 h-12 w-full rounded-xl border border-[#333333] bg-[#171717] px-4 text-sm text-white outline-none transition placeholder:text-[#666666] hover:border-[#454545] focus:border-[#E50000] focus:ring-4 focus:ring-[#E50000]/10 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Nhập họ và tên của bạn"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="update-date-of-birth"
                  className="text-sm font-semibold text-[#E6E6E6]"
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
                  className="mt-2 h-12 w-full rounded-xl border border-[#333333] bg-[#171717] px-4 text-sm text-white [color-scheme:dark] outline-none transition hover:border-[#454545] focus:border-[#E50000] focus:ring-4 focus:ring-[#E50000]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="update-gender"
                  className="text-sm font-semibold text-[#E6E6E6]"
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
                  className="mt-2 h-12 w-full rounded-xl border border-[#333333] bg-[#171717] px-4 text-sm text-white outline-none transition hover:border-[#454545] focus:border-[#E50000] focus:ring-4 focus:ring-[#E50000]/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="text-sm font-semibold text-[#E6E6E6]"
                >
                  Địa chỉ
                </label>
                <span className="text-xs text-[#666666]">
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
                className="mt-2 w-full resize-none rounded-xl border border-[#333333] bg-[#171717] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-[#666666] hover:border-[#454545] focus:border-[#E50000] focus:ring-4 focus:ring-[#E50000]/10 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Nhập địa chỉ hiện tại của bạn"
              />
            </div>

            <div>
              <label
                htmlFor="update-avatar"
                className="text-sm font-semibold text-[#E6E6E6]"
              >
                Ảnh đại diện
              </label>

              <div className="mt-2 rounded-xl border border-dashed border-[#3A3A3A] bg-[#171717] p-3 transition hover:border-[#E50000]/60 hover:bg-[#1A1A1A] focus-within:border-[#E50000] focus-within:ring-4 focus-within:ring-[#E50000]/10">
                <input
                  id="update-avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isLoading}
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] ?? null;
                    setAvatar(selectedFile);
                  }}
                  className="block w-full cursor-pointer text-sm text-[#A3A3A3] file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#2A2A2A] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white file:transition hover:file:bg-[#E50000] disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="mt-2 px-1 text-xs leading-5 text-[#666666]">
                  Hỗ trợ JPEG, PNG hoặc WebP. Kích thước tối đa 5 MB.
                </p>
              </div>
            </div>

            {serverError && (
              <p
                role="alert"
                className="rounded-xl border border-[#E50000]/35 bg-[#E50000]/10 px-4 py-3 text-sm leading-5 text-[#FF8080]"
              >
                {serverError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-[#262626] pt-5 sm:flex-row sm:justify-end">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#383838] bg-[#1A1A1A] px-5 text-sm font-semibold text-[#D6D6D6] transition hover:border-[#4A4A4A] hover:bg-[#262626] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-[#E50000] px-5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(229,0,0,0.2)] transition hover:bg-[#FF1A1A] hover:shadow-[0_12px_32px_rgba(229,0,0,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E50000]/25 disabled:cursor-not-allowed disabled:bg-[#7A1F1F] disabled:shadow-none"
              >
                {isLoading && (
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                    aria-hidden="true"
                  />
                )}
                {isLoading ? "Đang cập nhật..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}

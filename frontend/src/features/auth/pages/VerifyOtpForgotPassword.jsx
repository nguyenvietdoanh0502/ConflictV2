import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useVerifyForgotPasswordOtpMutation } from "../authApi";

const OTP_LENGTH = 6;

function getVerifyOtpForgotPasswordErrorMessage(error) {
  if (error?.status === "FETCH_ERROR") {
    return "Không kết nối được tới backend. Hãy kiểm tra server đang chạy ở cổng 8080.";
  }

  if (typeof error?.data?.message === "string") {
    return error.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Xác minh thất bại. Vui lòng kiểm tra lại email và mã OTP.";
}

export default function VerifyOtpForgotPasswordPage() {
  const [otpDigits, setOtpDigits] = useState(() =>
    Array(OTP_LENGTH).fill(""),
  );
  const [serverError, setServerError] = useState("");
  const otpInputRefs = useRef([]);

  const navigate = useNavigate();
  const location = useLocation();
  const locationEmail = location.state?.email ?? "";
  const [verify, { isLoading }] = useVerifyForgotPasswordOtpMutation();

  function clearServerError() {
    if (serverError) {
      setServerError("");
    }
  }

  function handleOtpChange(index, value) {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length > 1) {
      const nextDigits = Array(OTP_LENGTH).fill("");

      numbers
        .slice(0, OTP_LENGTH)
        .split("")
        .forEach((number, numberIndex) => {
          nextDigits[numberIndex] = number;
        });

      setOtpDigits(nextDigits);
      clearServerError();
      otpInputRefs.current[
        Math.min(numbers.length, OTP_LENGTH) - 1
      ]?.focus();
      return;
    }

    const nextDigits = [...otpDigits];
    nextDigits[index] = numbers.slice(-1);
    setOtpDigits(nextDigits);
    clearServerError();

    if (numbers && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, event) {
    if (event.key === "Backspace") {
      event.preventDefault();

      const nextDigits = [...otpDigits];

      if (nextDigits[index]) {
        nextDigits[index] = "";
      } else if (index > 0) {
        nextDigits[index - 1] = "";
        otpInputRefs.current[index - 1]?.focus();
      }

      setOtpDigits(nextDigits);
      clearServerError();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(event) {
    const pastedNumbers = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedNumbers) {
      return;
    }

    event.preventDefault();

    const nextDigits = Array(OTP_LENGTH).fill("");

    pastedNumbers.split("").forEach((number, index) => {
      nextDigits[index] = number;
    });

    setOtpDigits(nextDigits);
    clearServerError();
    otpInputRefs.current[pastedNumbers.length - 1]?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    const otpCode = otpDigits.join("");

    if (otpCode.length !== OTP_LENGTH) {
      setServerError("Vui lòng nhập đủ 6 chữ số của mã OTP.");
      const firstEmptyIndex = otpDigits.findIndex((digit) => !digit);
      otpInputRefs.current[firstEmptyIndex]?.focus();
      return;
    }

    try {
      const apiResponse = await verify({
        email: locationEmail,
        otpCode,
      }).unwrap();

      const credentials = apiResponse?.data;

      if (!credentials?.resetToken) {
        throw new Error("API verify không trả về resetToken.");
      }

      navigate("/reset-password", {
        replace: true,
        state: {
            email: locationEmail,
            resetToken: credentials.resetToken,
        },
        });
    } catch (error) {
      setServerError(getVerifyOtpForgotPasswordErrorMessage(error));
    }
  }


  return (
    <>
      <div className="mb-7">
        <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#FFF3E9] text-[#AD7049]">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 7.5 12 12.75 20.25 7.5M5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25V6.75a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </span>
        <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.035em] text-[#2F2A45] sm:text-[34px]">
          Xác minh là bạn
        </h2>
        <p className="mt-2.5 text-sm leading-6 text-[#777087]">
          Nhập mã 6 số để tiếp tục đặt lại mật khẩu
        </p>
        <p className="mt-2 inline-flex max-w-full rounded-full bg-[#FFF3E9] px-3 py-1.5 text-xs font-bold text-[#9B6442]">
          <span className="truncate">{locationEmail}</span>
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
                <fieldset>
                  <legend className="mb-3 block text-sm font-bold text-[#4B4562]">
                    Mã OTP gồm 6 chữ số
                  </legend>

                  <div
                    className="grid grid-cols-6 gap-2 sm:gap-3"
                    onPaste={handleOtpPaste}
                  >
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          otpInputRefs.current[index] = element;
                        }}
                        id={`otp-${index + 1}`}
                        name={`otp-${index + 1}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]"
                        maxLength={1}
                        value={digit}
                        onChange={(event) =>
                          handleOtpChange(index, event.target.value)
                        }
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        onFocus={(event) => event.target.select()}
                        autoComplete={
                          index === 0 ? "one-time-code" : "off"
                        }
                        disabled={isLoading}
                        aria-label={`Chữ số OTP thứ ${index + 1}`}
                        aria-invalid={Boolean(serverError)}
                        aria-describedby={
                          serverError ? "verify-error" : undefined
                        }
                        className="aspect-square w-full min-w-0 rounded-[16px] border border-[#E4DFF4] bg-[#FAF9FD] text-center text-xl font-extrabold text-[#2F2A45] caret-[#7C6EE6] outline-none transition hover:border-[#CFC6EF] focus:-translate-y-0.5 focus:border-[#7C6EE6] focus:bg-white focus:ring-4 focus:ring-[#7C6EE6]/10 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-[18px] sm:text-2xl"
                        required
                      />
                    ))}
                  </div>
                </fieldset>

                

                {serverError && (
                  <div
                    id="verify-error"
                    className="flex gap-3 rounded-[18px] border border-[#FF8FB3]/40 bg-[#FFF0F5] px-4 py-3 text-sm leading-5 text-[#A94464]"
                    role="alert"
                  >
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#D86489]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v4m0 4h.01M10.1 3.75 2.8 16.4A2.25 2.25 0 0 0 4.75 19.8h14.5a2.25 2.25 0 0 0 1.95-3.4L13.9 3.75a2.2 2.2 0 0 0-3.8 0Z"
                      />
                    </svg>
                    <span>{serverError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#7C6EE6] to-[#9385EC] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(124,110,230,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(124,110,230,0.34)] focus:outline-none focus:ring-4 focus:ring-[#7C6EE6]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          fill="currentColor"
                          d="M21 12a9 9 0 0 0-9-9v3a6 6 0 0 1 6 6h3Z"
                        />
                      </svg>
                      Đang xác minh...
                    </>
                  ) : (
                    <>
                      Xác minh
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m9 18 6-6-6-6"
                        />
                      </svg>
                    </>
                  )}
                </button>
      </form>
    </>
  );
}

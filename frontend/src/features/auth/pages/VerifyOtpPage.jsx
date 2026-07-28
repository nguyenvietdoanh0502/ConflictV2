import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useVerifyOtpMutation } from "../authApi";
import { setCredentials } from "../authSlice";

const OTP_LENGTH = 6;

function getVerifyErrorMessage(error) {
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

export default function VerifyOtpPage() {
  const [otpDigits, setOtpDigits] = useState(() =>
    Array(OTP_LENGTH).fill(""),
  );
  const [serverError, setServerError] = useState("");
  const otpInputRefs = useRef([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const locationEmail = location.state?.email ?? "";
  const [verify, { isLoading }] = useVerifyOtpMutation();

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

      if (!credentials?.accessToken) {
        throw new Error("API verify không trả về accessToken.");
      }

      dispatch(setCredentials(credentials));
      navigate("/", { replace: true });
    } catch (error) {
      setServerError(getVerifyErrorMessage(error));
    }
  }

  if (!locationEmail) {
    return <Navigate to="/register" replace />;
  }

  return (
    <>
              <div className="mb-8">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#333333] bg-[#1A1A1A] text-[#FF1919]">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 7.5V6A3.75 3.75 0 0 0 12 2.25h-1.5A3.75 3.75 0 0 0 6.75 6v12A3.75 3.75 0 0 0 10.5 21.75H12A3.75 3.75 0 0 0 15.75 18v-1.5M13.5 12h8.25m0 0-3-3m3 3-3 3"
                    />
                  </svg>
                </span>

                <h2 className="mt-5 text-3xl font-bold tracking-tight text-white">
                  Nhập OTP
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#999999]">
                  Mã OTP đã được gửi về email {locationEmail}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <fieldset>
                  <legend className="mb-3 block text-sm font-semibold text-[#E4E4E7]">
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
                        className="aspect-square w-full min-w-0 rounded-xl border border-[#333333] bg-[#141414] text-center text-xl font-bold text-white caret-[#E50000] outline-none transition hover:border-[#4A4A4A] focus:border-[#E50000] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#E50000]/15 disabled:cursor-not-allowed disabled:opacity-60 sm:text-2xl"
                        required
                      />
                    ))}
                  </div>
                </fieldset>

                

                {serverError && (
                  <div
                    id="verify-error"
                    className="flex gap-3 rounded-lg border border-[#E50000]/35 bg-[#E50000]/10 px-4 py-3 text-sm leading-5 text-[#FF9999]"
                    role="alert"
                  >
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#FF3333]"
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
                  className="group flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#E50000] px-5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(229,0,0,0.2)] transition hover:bg-[#FF1919] focus:outline-none focus:ring-4 focus:ring-[#E50000]/25 disabled:cursor-not-allowed disabled:opacity-60"
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

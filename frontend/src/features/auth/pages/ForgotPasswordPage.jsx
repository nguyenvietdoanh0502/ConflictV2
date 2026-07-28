import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useForgotPasswordMutation } from "../authApi";
import { setCredentials } from "../authSlice";

const initialForm = {
  email: "",
};

function getForgotPasswordErrorMessage(error) {
  if (error?.status === "FETCH_ERROR") {
    return "Không kết nối được tới backend. Hãy kiểm tra server đang chạy ở cổng 8080.";
  }

  if (typeof error?.data?.message === "string") {
    return error.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Vui lòng kiểm tra lại email.";
}

export default function ForgotPasswordPage() {
  const [form, setForm] = useState(initialForm);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (serverError) {
      setServerError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    try {
      const apiResponse = await forgotPassword({
        email: form.email.trim(),
      }).unwrap();
      navigate("/verify-otp-forgot-password", {
        replace: true,
        state: { email: form.email.trim() },
        });
    } catch (error) {
      setServerError(getForgotPasswordErrorMessage(error));
    }
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
                  Quên mật khẩu
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#999999]">
                  Nhập email của bạn.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    className="mb-2.5 block text-sm font-semibold text-[#E4E4E7]"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <svg
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#666666]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6.75 12 12l8.25-5.25M5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25V6.75a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      placeholder="Nhập địa chỉ email"
                      disabled={isLoading}
                      aria-invalid={Boolean(serverError)}
                      aria-describedby={serverError ? "forgot-password-error" : undefined}
                      className="h-14 w-full rounded-lg border border-[#262626] bg-[#141414] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-[#666666] hover:border-[#333333] focus:border-[#E50000] focus:ring-4 focus:ring-[#E50000]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                  </div>
                </div>


                {serverError && (
                  <div
                    id="forgot-password-error"
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

              <Link
                  to="/register"
                  className="mt-4 ml-auto flex min-h-7 w-fit items-center rounded-md border border-transparent px-2 text-sm font-medium text-[#B3B3B3] transition-all duration-200 hover:border-[#E50000]/30 hover:bg-[#E50000]/10 hover:text-[#FF3333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50000]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]"
                >
                  Chưa có tài khoản? Đăng ký
                </Link>

    </>
  );
}
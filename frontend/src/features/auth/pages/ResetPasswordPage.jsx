import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useResetPasswordMutation } from "../authApi";
import { setCredentials } from "../authSlice";

const initialForm = {
  email: "",
  resetToken: "",
  newPassword: "",
  confirmNewPassword: "",
};

function getResetPasswordErrorMessage(error) {
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

export default function ResetPasswordPage() {
  const [form, setForm] = useState(initialForm);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [serverError, setServerError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const location = useLocation();
  const locationEmail = location.state?.email ?? "";
  const locationResetToken = location.state?.resetToken ?? "";

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
      const apiResponse = await resetPassword({
        email: locationEmail,
        resetToken: locationResetToken,
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
      }).unwrap();
      navigate("/login", { replace: true });
    } catch (error) {
      setServerError(getResetPasswordErrorMessage(error));
    }
  }

  return (
    <>
              <div className="mb-8">

                <h2 className="mt-5 text-3xl font-bold tracking-tight text-white">
                  Đặt lại mật khẩu
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#999999]">
                  Đặt lại mật khẩu của bạn
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    className="mb-2.5 block text-sm font-semibold text-[#E4E4E7]"
                    htmlFor="newPassword"
                  >
                    Mật khẩu mới
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
                        d="M6.75 10.5V8.25a5.25 5.25 0 0 1 10.5 0v2.25m-12 0h13.5A2.25 2.25 0 0 1 21 12.75v6A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75v-6a2.25 2.25 0 0 1 2.25-2.25Z"
                      />
                    </svg>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={form.newPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Nhập mật khẩu"
                      disabled={isLoading}
                      aria-invalid={Boolean(serverError)}
                      aria-describedby={serverError ? "reset-password-error" : undefined}
                      className="h-14 w-full rounded-lg border border-[#262626] bg-[#141414] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-[#666666] hover:border-[#333333] focus:border-[#E50000] focus:ring-4 focus:ring-[#E50000]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((current) => !current)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#666666] transition hover:bg-[#262626] hover:text-[#BFBFBF] focus:outline-none focus:ring-2 focus:ring-[#E50000] disabled:cursor-not-allowed"
                      aria-label={
                        showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                      aria-pressed={showNewPassword}
                    >
                      {showNewPassword ? (
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
                            d="m3 3 18 18M10.6 10.7A2 2 0 0 0 13.3 13.4M9.9 4.4A10.7 10.7 0 0 1 12 4.2c5.25 0 8.25 4.8 8.25 4.8a13.7 13.7 0 0 1-2.2 2.85M6.6 6.6C4.7 7.8 3.75 9 3.75 9s3 4.8 8.25 4.8c.8 0 1.55-.1 2.25-.3"
                          />
                        </svg>
                      ) : (
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
                            d="M3.75 12s3-4.8 8.25-4.8 8.25 4.8 8.25 4.8-3 4.8-8.25 4.8S3.75 12 3.75 12Z"
                          />
                          <circle cx="12" cy="12" r="2.25" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className="mb-2.5 block text-sm font-semibold text-[#E4E4E7]"
                    htmlFor="confirmNewPassword"
                  >
                    Nhập lại mật khẩu mới
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
                        d="M6.75 10.5V8.25a5.25 5.25 0 0 1 10.5 0v2.25m-12 0h13.5A2.25 2.25 0 0 1 21 12.75v6A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75v-6a2.25 2.25 0 0 1 2.25-2.25Z"
                      />
                    </svg>
                    <input
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={form.confirmNewPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu mới"
                      disabled={isLoading}
                      aria-invalid={Boolean(serverError)}
                      aria-describedby={serverError ? "reset-password-error" : undefined}
                      className="h-14 w-full rounded-lg border border-[#262626] bg-[#141414] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-[#666666] hover:border-[#333333] focus:border-[#E50000] focus:ring-4 focus:ring-[#E50000]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword((current) => !current)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#666666] transition hover:bg-[#262626] hover:text-[#BFBFBF] focus:outline-none focus:ring-2 focus:ring-[#E50000] disabled:cursor-not-allowed"
                      aria-label={
                        showConfirmNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                      aria-pressed={showConfirmNewPassword}
                    >
                      {showConfirmNewPassword ? (
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
                            d="m3 3 18 18M10.6 10.7A2 2 0 0 0 13.3 13.4M9.9 4.4A10.7 10.7 0 0 1 12 4.2c5.25 0 8.25 4.8 8.25 4.8a13.7 13.7 0 0 1-2.2 2.85M6.6 6.6C4.7 7.8 3.75 9 3.75 9s3 4.8 8.25 4.8c.8 0 1.55-.1 2.25-.3"
                          />
                        </svg>
                      ) : (
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
                            d="M3.75 12s3-4.8 8.25-4.8 8.25 4.8 8.25 4.8-3 4.8-8.25 4.8S3.75 12 3.75 12Z"
                          />
                          <circle cx="12" cy="12" r="2.25" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {serverError && (
                  <div
                    id="reset-password-error"
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
                      Đang đặt lại mật khẩu...
                    </>
                  ) : (
                    <>
                      Đặt lại mật khẩu
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

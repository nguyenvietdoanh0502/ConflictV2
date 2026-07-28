import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link,useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../authApi";
import { setCredentials } from "../authSlice";

const initialForm = {
  email: "",
  password: "",
  confirmPassword: "",
  fullName: "",
};

function getRegisterErrorMessage(error) {
  if (error?.status === "FETCH_ERROR") {
    return "Không kết nối được tới backend. Hãy kiểm tra server đang chạy ở cổng 8080.";
  }

  if (typeof error?.data?.message === "string") {
    return error.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đăng ký thất bại. Vui lòng kiểm tra lại email và mật khẩu.";
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

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
      const apiResponse = await register({
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        fullName: form.fullName,
      }).unwrap();

      navigate("/verify-otp", {
        replace: true,
        state: { email: form.email.trim() },
        });
    } catch (error) {
      setServerError(getRegisterErrorMessage(error));
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
                  Chào mừng
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#999999]">
                  Đăng ký tài khoản để tiếp tục hành trình điện ảnh của bạn.
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
                      aria-describedby={serverError ? "register-error" : undefined}
                      className="h-14 w-full rounded-lg border border-[#262626] bg-[#141414] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-[#666666] hover:border-[#333333] focus:border-[#E50000] focus:ring-4 focus:ring-[#E50000]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="mb-2.5 block text-sm font-semibold text-[#E4E4E7]"
                    htmlFor="password"
                  >
                    Mật khẩu
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
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Nhập mật khẩu"
                      disabled={isLoading}
                      aria-invalid={Boolean(serverError)}
                      aria-describedby={serverError ? "register-error" : undefined}
                      className="h-14 w-full rounded-lg border border-[#262626] bg-[#141414] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-[#666666] hover:border-[#333333] focus:border-[#E50000] focus:ring-4 focus:ring-[#E50000]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#666666] transition hover:bg-[#262626] hover:text-[#BFBFBF] focus:outline-none focus:ring-2 focus:ring-[#E50000] disabled:cursor-not-allowed"
                      aria-label={
                        showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
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
                    htmlFor="confirmPassword"
                  >
                    Nhập lại mật khẩu
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
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu"
                      disabled={isLoading}
                      aria-invalid={Boolean(serverError)}
                      aria-describedby={serverError ? "register-error" : undefined}
                      className="h-14 w-full rounded-lg border border-[#262626] bg-[#141414] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-[#666666] hover:border-[#333333] focus:border-[#E50000] focus:ring-4 focus:ring-[#E50000]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#666666] transition hover:bg-[#262626] hover:text-[#BFBFBF] focus:outline-none focus:ring-2 focus:ring-[#E50000] disabled:cursor-not-allowed"
                      aria-label={
                        showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                      aria-pressed={showConfirmPassword}
                    >
                      {showConfirmPassword ? (
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
                    htmlFor="fullName"
                  >
                    Tên đầy đủ
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
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={handleChange}
                      autoComplete="name"
                      placeholder="Nhập tên đầy đủ của bạn"
                      disabled={isLoading}
                      aria-invalid={Boolean(serverError)}
                      aria-describedby={serverError ? "register-error" : undefined}
                      className="h-14 w-full rounded-lg border border-[#262626] bg-[#141414] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-[#666666] hover:border-[#333333] focus:border-[#E50000] focus:ring-4 focus:ring-[#E50000]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                {serverError && (
                  <div
                    id="register-error"
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
                      Đang đăng ký...
                    </>
                  ) : (
                    <>
                      Đăng ký
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
                  to="/login"
                  className="mt-4 ml-auto flex min-h-7 w-fit items-center rounded-md border border-transparent px-2 text-sm font-medium text-[#B3B3B3] transition-all duration-200 hover:border-[#E50000]/30 hover:bg-[#E50000]/10 hover:text-[#FF3333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50000]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]"
                >
                  Đã có tài khoản? Đăng nhập
                </Link>
    </>
  );
}

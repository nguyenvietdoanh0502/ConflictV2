import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForgotPasswordMutation } from "../authApi";

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
      await forgotPassword({
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
      <div className="mb-7">
        <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#EAF8F4] text-[#438675]">
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
              d="M15.75 10.5V8.25a3.75 3.75 0 0 0-7.5 0v2.25m-1.5 0h10.5A2.25 2.25 0 0 1 19.5 12.75v6A2.25 2.25 0 0 1 17.25 21H6.75a2.25 2.25 0 0 1-2.25-2.25v-6a2.25 2.25 0 0 1 2.25-2.25Z"
            />
          </svg>
        </span>
        <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.035em] text-[#2F2A45] sm:text-[34px]">
          Quên mật khẩu?
        </h2>
        <p className="mt-2.5 text-sm leading-6 text-[#777087]">
          Không sao cả. Nhập email và chúng mình sẽ giúp bạn quay lại.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    className="mb-2.5 block text-sm font-bold text-[#4B4562]"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <svg
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8B82B7]"
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
                      className="h-14 w-full rounded-[18px] border border-[#E8E3F7] bg-[#FAF9FD] pl-12 pr-4 text-sm font-medium text-[#2F2A45] outline-none transition placeholder:font-normal placeholder:text-[#77718C] hover:border-[#CFC6EF] focus:border-[#7C6EE6] focus:bg-white focus:ring-4 focus:ring-[#7C6EE6]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                  </div>
                </div>


                {serverError && (
                  <div
                    id="forgot-password-error"
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
                      Gửi mã xác minh
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

      <p className="mt-5 text-center text-sm text-[#6F6880]">
        Chưa có tài khoản?{" "}
        <Link
          to="/register"
          className="rounded-md font-bold text-[#675BAF] transition hover:text-[#FF6F9E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/20"
        >
          Đăng ký ngay
        </Link>
      </p>
    </>
  );
}

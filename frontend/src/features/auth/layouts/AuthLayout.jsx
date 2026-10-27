import { Link, Outlet, useNavigate } from "react-router-dom";
import logoWithoutText from "../../../assets/logowithouttext.png";
import justText from "../../../assets/justtext.png";

export default function AuthLayout() {
  const navigate = useNavigate();

  function handleBack() {
    const historyIndex = window.history.state?.idx;

    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#F4F3F8] text-[#2F2A45]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1120px] content-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:gap-16 lg:px-10 lg:py-12">
        <section className="text-center lg:pb-12 lg:text-left">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-[18px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/20 group"
            aria-label="Về trang chủ UniSync"
          >
            <img
              src={logoWithoutText}
              alt="UniSync"
              className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-md transition-transform group-hover:scale-105"
            />
            <img
              src={justText}
              alt="UniSync"
              className="h-8 sm:h-10 w-auto object-contain drop-shadow-sm transition-transform group-hover:scale-105"
            />
          </Link>

          <h1 className="mx-auto mt-4 max-w-[520px] text-lg font-semibold leading-7 text-[#514B65] sm:text-xl lg:mx-0 lg:mt-6 lg:text-[28px] lg:leading-10">
            Đồng bộ hóa đại học — Học tập, giao lưu & xếp lịch dễ dàng.
          </h1>
          <p className="mx-auto mt-2 hidden max-w-[500px] text-base leading-7 text-[#7C758F] lg:block">
            Nền tảng giúp sinh viên kết nối, quản lý thời khóa biểu thông minh và tối ưu hóa việc học tập mỗi ngày.
          </p>
        </section>

        <section className="mx-auto w-full max-w-[460px]">
          <div className="rounded-[20px] border border-[#E6E2F0] bg-white p-5 shadow-[0_12px_36px_rgba(57,45,99,0.10)] sm:p-8">
            <button
              type="button"
              onClick={handleBack}
              className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-[16px] px-3 text-sm font-semibold text-[#6F6884] transition hover:bg-[#F2F0F8] hover:text-[#675BAF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/20"
              aria-label="Quay lại trang trước"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m15 18-6-6 6-6"
                />
              </svg>
              Quay lại
            </button>

            <Outlet />
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-[#847D96]">
            UniSync · University + Synchronize · Học tập & gắn kết.
          </p>
        </section>
      </div>
    </main>
  );
}

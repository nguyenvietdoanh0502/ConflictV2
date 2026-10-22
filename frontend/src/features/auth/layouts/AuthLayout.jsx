import { Link, Outlet, useNavigate } from "react-router-dom";

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
            className="inline-flex items-center gap-3 rounded-[18px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/20"
            aria-label="Về trang chủ Conflict"
          >
            <span className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#7C6EE6] text-white shadow-[0_8px_20px_rgba(124,110,230,0.22)] sm:h-14 sm:w-14 sm:rounded-[18px]">
              <svg
                className="h-7 w-7 sm:h-8 sm:w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 10.5h.01m4.49 0h.01m4.49 0h.01M5.25 19.5l-2.25.75.75-2.25A8.25 8.25 0 1 1 5.25 19.5Z"
                />
              </svg>
            </span>
            <span className="text-3xl font-extrabold tracking-[-0.045em] text-[#675BAF] sm:text-4xl">
              Conflict
            </span>
          </Link>

          <h1 className="mx-auto mt-4 max-w-[520px] text-lg font-semibold leading-7 text-[#514B65] sm:text-xl lg:mx-0 lg:mt-6 lg:text-[28px] lg:leading-10">
            Kết nối với bạn bè và chia sẻ những khoảnh khắc của bạn.
          </h1>
          <p className="mx-auto mt-2 hidden max-w-[500px] text-base leading-7 text-[#7C758F] lg:block">
            Một không gian gần gũi để trò chuyện, khám phá và luôn ở cạnh
            những người bạn quan tâm.
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
            Conflict · Kết nối tích cực, chia sẻ chân thành.
          </p>
        </section>
      </div>
    </main>
  );
}

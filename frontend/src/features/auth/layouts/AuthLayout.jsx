
import { Outlet} from "react-router-dom";


export default function AuthLayout() {

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#141414] text-white"
      style={{ fontFamily: '"Manrope", sans-serif' }}
    >
      <style>
        {`@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap");`}
      </style>

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login/streamvibe-hero.jpg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[#0F0F0F]/55"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/80 to-[#0F0F0F]/55"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0F0F0F]/70 via-transparent to-[#0F0F0F]"
        aria-hidden="true"
      />

      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
          <div className="flex items-center gap-3">
            <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-[#E50000] shadow-[0_0_32px_rgba(229,0,0,0.3)]">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8.25 6.4c0-1.08 1.18-1.74 2.1-1.18l8.1 4.95a1.38 1.38 0 0 1 0 2.36l-8.1 4.95a1.38 1.38 0 0 1-2.1-1.18V6.4Z"
                  fill="currentColor"
                />
              </svg>
              <span className="absolute -inset-1 -z-10 rounded-[14px] border border-[#FF3333]/35" />
            </span>
            <span className="text-xl font-bold tracking-tight sm:text-2xl">
              Stream<span className="text-[#E50000]">Vibe</span>
            </span>
          </div>

          <span className="hidden items-center gap-2 rounded-lg border border-[#262626] bg-[#0F0F0F]/80 px-3 py-2 text-xs font-medium text-[#B3B3B3] backdrop-blur sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-[#E50000] shadow-[0_0_10px_#E50000]" />
            Kho phim trực tuyến
          </span>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] items-center px-5 pb-10 pt-28 sm:px-8 lg:px-12 lg:pb-12 lg:pt-32">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_500px] xl:gap-24">
          <section className="hidden max-w-2xl lg:block">
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#262626] bg-[#141414]/80 px-3 py-2 text-sm font-medium text-[#E4E4E7] backdrop-blur">
              <svg
                className="h-4 w-4 text-[#E50000]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8.25 6.4c0-1.08 1.18-1.74 2.1-1.18l8.1 4.95a1.38 1.38 0 0 1 0 2.36l-8.1 4.95a1.38 1.38 0 0 1-2.1-1.18V6.4Z" />
              </svg>
              Giải trí không giới hạn
            </span>

            <h1 className="mt-7 text-5xl font-bold leading-[1.12] tracking-[-0.03em] text-white xl:text-6xl">
              Cả thế giới điện ảnh,
              <span className="block text-[#E50000]">trong tầm tay bạn.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[#B3B3B3] xl:text-lg xl:leading-8">
              Đăng nhập để tiếp tục những bộ phim yêu thích, khám phá nội dung
              mới và tận hưởng trải nghiệm xem phim trên mọi thiết bị.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              {["4K Ultra HD", "Phụ đề đa ngôn ngữ", "Xem trên mọi thiết bị"].map(
                (feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#262626] bg-[#1A1A1A]/85 px-3 py-2 text-sm text-[#BFBFBF]"
                  >
                    <svg
                      className="h-4 w-4 text-[#FF1919]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m6 12 4 4 8-8"
                      />
                    </svg>
                    {feature}
                  </span>
                ),
              )}
            </div>
          </section>
        <section className="mx-auto w-full max-w-[500px]">
            <div className="rounded-2xl border border-[#262626] bg-[#0F0F0F]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-9 lg:p-10">
              <Outlet />
            </div>
        </section>
        </div>
      </div>
    </main>
  );
}

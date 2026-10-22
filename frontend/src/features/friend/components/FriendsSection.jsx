function LoadingCards() {
  return (
    <ul className="space-y-3" aria-label="Đang tải dữ liệu" aria-busy="true">
      {[1, 2, 3].map((item) => (
        <li
          key={item}
          className="flex animate-pulse items-center gap-4 rounded-[22px] border border-[#ECE7FA] bg-white/80 p-4 motion-reduce:animate-none"
        >
          <span className="h-14 w-14 shrink-0 rounded-[20px] bg-[#E9E4FB]" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-4 w-2/5 rounded-full bg-[#E5DFFA]" />
            <span className="block h-3 w-3/5 rounded-full bg-[#F0ECFA]" />
          </span>
          <span className="hidden h-10 w-24 rounded-full bg-[#EAE5F8] sm:block" />
        </li>
      ))}
    </ul>
  );
}

export default function FriendsSection({
  sectionId,
  eyebrow,
  title,
  description,
  itemCount = 0,
  isLoading = false,
  isError = false,
  onRetry,
  emptyTitle,
  emptyDescription,
  children,
}) {
  const headingId = `${sectionId}-title`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-[#E3E0E9] bg-white p-5 shadow-[0_1px_3px_rgba(47,42,69,0.08)] sm:p-6"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#7C6EE6]">
            {eyebrow}
          </p>
          <h3 id={headingId} className="mt-2 text-lg font-extrabold tracking-[-0.01em] text-[#2F2A45] sm:text-xl">
            {title}
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-[#746E88]">
            {description}
          </p>
        </div>

        <span
          className="grid h-10 min-w-10 shrink-0 place-items-center rounded-full border border-[#DCD5FF] bg-[#F0EDFF] px-2 text-xs font-extrabold text-[#6558C8] shadow-[0_5px_14px_rgba(124,110,230,0.12)]"
          aria-label={`${itemCount} mục`}
        >
          {itemCount}
        </span>
      </header>

      <div className="mt-5">
        {isLoading ? <LoadingCards /> : null}

        {!isLoading && isError ? (
          <div
            role="alert"
            className="rounded-[22px] border border-[#FFD3DF] bg-[#FFF4F7] p-5"
          >
            <span
              className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#D2577F] shadow-sm ring-1 ring-[#FFD6E2]"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 3.5h.01M10.1 4.4 3.25 16.25A2 2 0 0 0 5 19.25h14a2 2 0 0 0 1.75-3L13.9 4.4a2 2 0 0 0-3.8 0Z" />
              </svg>
            </span>
            <p className="mt-3 text-sm font-bold text-[#A63E62]">
              Chưa thể tải dữ liệu kết nối.
            </p>
            <p className="mt-1 text-xs leading-5 text-[#8F6574]">
              Có một chút gián đoạn. Bạn vui lòng kiểm tra kết nối và thử lại.
            </p>
            <button
              type="button"
              onClick={onRetry}
              disabled={!onRetry}
              className="mt-4 min-h-10 rounded-full border border-[#FFB6CD] bg-white px-4 text-xs font-bold text-[#B7486D] transition hover:border-[#FF8FB3] hover:bg-[#FFEAF1] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF8FB3]/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Thử lại
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && itemCount === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[#DCD5F3] bg-gradient-to-br from-white to-[#F7F5FF] px-5 py-9 text-center">
            <span
              className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] border border-white bg-gradient-to-br from-[#EAE5FF] to-[#FFE8F0] text-[#7C6EE6] shadow-[0_9px_22px_rgba(124,110,230,0.15)]"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 10a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM5 19c.9-2.5 3.5-4 7-4s6.1 1.5 7 4M18 5v4m-2-2h4" />
              </svg>
            </span>
            <p className="mt-4 text-sm font-bold text-[#3D3754]">
              {emptyTitle}
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-[#7A738E]">
              {emptyDescription}
            </p>
          </div>
        ) : null}

        {!isLoading && !isError && itemCount > 0 ? children : null}
      </div>
    </section>
  );
}

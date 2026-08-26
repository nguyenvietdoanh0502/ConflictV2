function LoadingCards() {
  return (
    <ul className="space-y-3" aria-label="Đang tải dữ liệu" aria-busy="true">
      {[1, 2, 3].map((item) => (
        <li
          key={item}
          className="flex animate-pulse items-center gap-4 rounded-xl border border-[#292929] bg-[#101010] p-4"
        >
          <span className="h-14 w-14 shrink-0 rounded-2xl bg-[#252525]" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-4 w-2/5 rounded bg-[#292929]" />
            <span className="block h-3 w-3/5 rounded bg-[#222222]" />
          </span>
          <span className="hidden h-10 w-24 rounded-lg bg-[#292929] sm:block" />
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
      className="rounded-2xl border border-[#2B2B2B] bg-[#141414] p-5 sm:p-6"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#777777]">
            {eyebrow}
          </p>
          <h3 id={headingId} className="mt-2 text-lg font-bold text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[#858585]">
            {description}
          </p>
        </div>

        <span
          className="grid h-9 min-w-9 shrink-0 place-items-center rounded-full border border-[#3A3A3A] bg-[#1B1B1B] px-2 text-xs font-bold text-[#D8D8D8]"
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
            className="rounded-xl border border-[#E50000]/30 bg-[#E50000]/10 p-4"
          >
            <p className="text-sm font-semibold text-[#FF8A8A]">
              Chưa thể tải dữ liệu friendship.
            </p>
            <p className="mt-1 text-xs leading-5 text-[#C78080]">
              Kiểm tra kết nối tới backend rồi thử lại.
            </p>
            <button
              type="button"
              onClick={onRetry}
              disabled={!onRetry}
              className="mt-3 min-h-10 rounded-lg border border-[#E50000]/45 px-4 text-xs font-semibold text-[#FF8A8A] transition hover:bg-[#E50000] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50000]/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Thử lại
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && itemCount === 0 ? (
          <div className="rounded-xl border border-dashed border-[#343434] bg-[#101010] px-5 py-8 text-center">
            <span
              className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[#333333] bg-[#1B1B1B] text-lg font-bold text-[#777777]"
              aria-hidden="true"
            >
              0
            </span>
            <p className="mt-4 text-sm font-semibold text-[#D6D6D6]">
              {emptyTitle}
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#737373]">
              {emptyDescription}
            </p>
          </div>
        ) : null}

        {!isLoading && !isError && itemCount > 0 ? children : null}
      </div>
    </section>
  );
}

import FriendAvatar from "./FriendAvatar";

function formatRequestTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function FriendRequestCard({
  request,
  direction = "incoming",
  onAccept,
  onRemove,
  isBusy = false,
}) {
  const isIncoming = direction === "incoming";
  const displayName = request?.user?.fullName?.trim() || "Người dùng Conflict";
  const dateLabel = formatRequestTime(request?.createdAt);

  return (
    <article
      aria-busy={isBusy}
      className="group rounded-[22px] border border-[#E8E2FF] bg-white/90 p-4 shadow-[0_10px_30px_rgba(77,62,140,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-[#CEC5FF] hover:shadow-[0_16px_38px_rgba(77,62,140,0.12)] motion-reduce:transform-none"
    >
      <div className="flex items-center gap-3">
        <FriendAvatar
          fullName={displayName}
          avatarUrl={request?.user?.avatarUrl}
          size="sm"
        />

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold text-[#2F2A45]">
            {displayName}
          </h4>
          <p className="mt-1.5 text-xs font-medium text-[#77708F]">
            {dateLabel
              ? `${isIncoming ? "Đã nhận" : "Đã gửi"} ngày ${dateLabel}`
              : "Đang chờ phản hồi"}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-[#FFE0A9] bg-[#FFF7E7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#A86F19]">
          Đang chờ
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-[#F0ECFF] pt-4 sm:flex-row sm:justify-end">
        {isIncoming ? (
          <button
            type="button"
            onClick={() => onAccept?.(request)}
            disabled={!onAccept || isBusy}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#7C6EE6] px-4 text-xs font-bold text-white shadow-[0_7px_16px_rgba(124,110,230,0.25)] transition hover:bg-[#695BCF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/25 disabled:cursor-not-allowed disabled:bg-[#CFC9EC] disabled:shadow-none"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.2 4.2L19 7" />
            </svg>
            {isBusy ? "Đang xử lý..." : "Chấp nhận"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => onRemove?.(request)}
          disabled={!onRemove || isBusy}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#E4DFF5] bg-[#FAF9FF] px-4 text-xs font-bold text-[#655E7D] transition hover:border-[#FFBDD2] hover:bg-[#FFF1F6] hover:text-[#B7486D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF8FB3]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isIncoming ? "Từ chối" : "Hủy lời mời"}
        </button>
      </div>
    </article>
  );
}
